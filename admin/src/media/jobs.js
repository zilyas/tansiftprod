// Conversion jobs: one video at a time, two images at a time, kept in memory.
// The browser polls a job until it is done, then gets the R2 URLs.
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { convertImage, convertVideo, detect } from './convert.js';

class Lane {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  push(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.#next();
    });
  }

  #next() {
    if (this.running >= this.concurrency || !this.queue.length) return;
    const { task, resolve, reject } = this.queue.shift();
    this.running++;
    task()
      .then(resolve, reject)
      .finally(() => {
        this.running--;
        this.#next();
      });
  }
}

const monthKey = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const slugify = (name) =>
  name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'file';

export class Jobs {
  constructor({ r2, config }) {
    this.r2 = r2;
    this.config = config;
    this.jobs = new Map();
    this.images = new Lane(2);
    this.videos = new Lane(1);
  }

  get(id) {
    return this.jobs.get(id);
  }

  /** Starts converting an uploaded temp file. Returns the job id immediately. */
  async start({ filePath, originalName, bytes, alt = '', silent = false }) {
    const type = await detect(filePath);
    const { maxImageMb, maxVideoMb } = this.config.media;
    if (type.kind === 'image' && bytes > maxImageMb * 1024 * 1024) throw userError(`Images must be under ${maxImageMb} MB`);
    if (type.kind === 'video' && bytes > maxVideoMb * 1024 * 1024) throw userError(`Videos must be under ${maxVideoMb} MB`);
    if (type.kind !== 'image' && type.kind !== 'video') {
      throw userError('This file type is not supported. Use JPEG, PNG, WebP, GIF or AVIF images, or MP4, MOV or WebM videos.');
    }

    const id = randomUUID();
    const job = { id, kind: type.kind, name: originalName, status: 'queued', createdAt: Date.now() };
    this.jobs.set(id, job);
    this.#prune();

    const lane = type.kind === 'video' ? this.videos : this.images;
    lane
      .push(() => this.#convert(job, type, filePath, originalName, alt, silent))
      .catch((err) => {
        job.status = 'error';
        job.error = err.expose ? err.message : 'Conversion failed. Try another file or a shorter video.';
        console.error(JSON.stringify({ level: 'error', msg: 'conversion failed', job: id, error: String(err.message) }));
      })
      .finally(() => rm(filePath, { force: true }));
    return job;
  }

  async #convert(job, type, filePath, originalName, alt, silent) {
    job.status = 'converting';
    const work = await mkdtemp(join(tmpdir(), 'tsa-'));
    const base = `${monthKey()}/${randomUUID().slice(0, 8)}-${slugify(originalName)}`;
    try {
      let item;
      if (type.kind === 'image') {
        const out = await convertImage(filePath, join(work, 'img'), {
          widths: this.config.media.imageWidths,
          quality: this.config.media.imageQuality,
        });
        job.status = 'uploading';
        const variants = [];
        for (const v of out.variants) {
          const key = `images/${base}-${v.width}.webp`;
          variants.push({ width: v.width, url: await this.r2.uploadFile(key, v.path, 'image/webp'), key, bytes: v.bytes });
        }
        const main = variants[variants.length - 1];
        item = { id: job.id, type: 'image', name: originalName, url: main.url, width: out.width, height: out.height, variants, bytes: variants.reduce((n, v) => n + v.bytes, 0) };
      } else {
        const m = this.config.media;
        const out = await convertVideo(filePath, join(work, 'vid'), {
          demuxer: type.demuxer,
          crf: m.videoCrf,
          mp4Fallback: m.videoMp4Fallback,
          maxSeconds: m.maxVideoSeconds,
          timeoutSeconds: m.encodeTimeoutSeconds,
          silent,
        });
        job.status = 'uploading';
        const webmKey = `videos/${base}.webm`;
        const url = await this.r2.uploadFile(webmKey, out.webm, 'video/webm');
        const keys = [webmKey];
        let fallback = '';
        if (out.mp4) {
          const k = `videos/${base}.mp4`;
          fallback = await this.r2.uploadFile(k, out.mp4, 'video/mp4');
          keys.push(k);
        }
        const posterKey = `videos/${base}-poster.webp`;
        const poster = await this.r2.uploadFile(posterKey, out.poster, 'image/webp');
        keys.push(posterKey);
        item = {
          id: job.id, type: 'video', name: originalName, url, fallback, poster, keys,
          width: out.width, height: out.height, duration: Math.round(out.duration * 10) / 10,
          bytes: out.sizes.webm + out.sizes.mp4 + out.sizes.poster,
        };
      }
      item.alt = alt;
      item.createdAt = new Date().toISOString();
      await this.#addToLibrary(item);
      job.status = 'done';
      job.item = item;
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  }

  // Library writes are serialised so two finishing jobs cannot overwrite each other.
  #libraryLock = Promise.resolve();
  #addToLibrary(item) {
    this.#libraryLock = this.#libraryLock.then(async () => {
      const lib = await this.r2.readLibrary();
      lib.items.unshift(item);
      await this.r2.writeLibrary(lib);
    });
    return this.#libraryLock;
  }

  async removeFromLibrary(id) {
    let removed = null;
    this.#libraryLock = this.#libraryLock.then(async () => {
      const lib = await this.r2.readLibrary();
      removed = lib.items.find((i) => i.id === id) ?? null;
      if (!removed) return;
      const keys = removed.type === 'image' ? removed.variants.map((v) => v.key) : removed.keys;
      await this.r2.deleteKeys(keys);
      lib.items = lib.items.filter((i) => i.id !== id);
      await this.r2.writeLibrary(lib);
    });
    await this.#libraryLock;
    return removed;
  }

  #prune() {
    const cutoff = Date.now() - 6 * 3600_000;
    for (const [id, job] of this.jobs) if (job.createdAt < cutoff) this.jobs.delete(id);
  }
}

export function userError(message) {
  const err = new Error(message);
  err.expose = true;
  err.status = 400;
  return err;
}

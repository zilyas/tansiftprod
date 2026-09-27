import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { Jobs } from '../src/media/jobs.js';

// Real Jobs + conversion with the configuration shape loadConfig() produces; only R2 is faked.
function fakeR2() {
  const uploads = [];
  let library = { items: [] };
  return {
    uploads,
    async uploadFile(key, _path, contentType) {
      uploads.push({ key, contentType });
      return `https://media.example.com/${key}`;
    },
    async deleteKeys() {},
    async readLibrary() { return structuredClone(library); },
    async writeLibrary(l) { library = l; },
  };
}

const media = {
  maxImageMb: 25, maxVideoMb: 95, maxVideoSeconds: 180, imageWidths: [640, 1280, 1920],
  imageQuality: 78, videoCrf: 33, videoMp4Fallback: true, encodeTimeoutSeconds: 600,
};

async function waitFor(jobs, id) {
  for (let i = 0; i < 200; i++) {
    const job = jobs.get(id);
    if (job.status === 'done' || job.status === 'error') return job;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('job did not finish');
}

test('uploaded photo is converted to WebP widths, stored in R2 and added to the library', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jobs-'));
  const file = join(dir, 'upload');
  await sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#0047ab' } }).jpeg().toFile(file);
  const r2 = fakeR2();
  const jobs = new Jobs({ r2, config: { media } });
  const started = await jobs.start({ filePath: file, originalName: 'Port at Sunrise.JPG', bytes: 1000, alt: 'Port' });
  const job = await waitFor(jobs, started.id);
  assert.equal(job.status, 'done', job.error);
  assert.deepEqual(job.item.variants.map((v) => v.width), [640, 1280, 1920]);
  assert.ok(r2.uploads.every((u) => u.contentType === 'image/webp' && /^images\/\d{4}\/\d{2}\/[0-9a-f]{8}-port-at-sunrise-\d+\.webp$/.test(u.key)));
  assert.equal(job.item.url, job.item.variants[2].url);
  assert.equal((await r2.readLibrary()).items[0].alt, 'Port');
});

test('non-media upload is refused before any conversion', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'jobs-'));
  const file = join(dir, 'upload');
  await writeFile(file, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const jobs = new Jobs({ r2: fakeR2(), config: { media } });
  await assert.rejects(jobs.start({ filePath: file, originalName: 'x.svg', bytes: 50 }), /not supported/);
});

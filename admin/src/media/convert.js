// Media conversion. Uploads are treated as hostile input:
// - the real type is detected from the file's bytes, not its name or MIME;
// - only common image and video containers are accepted (no SVG, no playlists);
// - ffmpeg/ffprobe run without a shell, with network protocols disabled, the
//   input format pinned, and a hard timeout.
import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';

sharp.cache(false);
sharp.concurrency(1);

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/tiff']);
// Container → ffmpeg demuxer to pin with -f.
const VIDEO_TYPES = new Map([
  ['video/mp4', 'mov'],
  ['video/quicktime', 'mov'],
  ['video/x-m4v', 'mov'],
  ['video/webm', 'matroska'],
  ['video/x-matroska', 'matroska'],
]);

export async function detect(filePath) {
  const type = await fileTypeFromFile(filePath);
  if (!type) return { kind: 'unknown' };
  if (IMAGE_TYPES.has(type.mime)) return { kind: 'image', mime: type.mime, ext: type.ext };
  if (VIDEO_TYPES.has(type.mime)) return { kind: 'video', mime: type.mime, ext: type.ext, demuxer: VIDEO_TYPES.get(type.mime) };
  return { kind: 'unsupported', mime: type.mime, ext: type.ext };
}

/**
 * Converts an image to WebP at several widths (never enlarging).
 * @returns {{width:number,height:number,variants:{width:number,path:string,bytes:number}[]}}
 */
export async function convertImage(input, outBase, { widths, quality }) {
  const base = sharp(input, { failOn: 'warning', limitInputPixels: 50_000_000, autoOrient: true, animated: false });
  const meta = await base.metadata();
  // autoOrient swaps width/height for rotated photos.
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  const targets = [...new Set(widths.filter((w) => w < width).concat([Math.min(width, Math.max(...widths))]))].sort((a, b) => a - b);
  const lossless = meta.format === 'png' && (meta.hasAlpha || (meta.width ?? 0) < 1200);
  const variants = [];
  for (const w of targets) {
    const out = `${outBase}-${w}.webp`;
    const info = await base
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp(lossless ? { lossless: true, effort: 4 } : { quality, effort: 4, smartSubsample: true })
      .toFile(out);
    variants.push({ width: info.width, height: info.height, path: out, bytes: info.size });
  }
  return { width, height, variants };
}

function run(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr = (stderr + d).slice(-4000)));
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(signal === 'SIGKILL' ? `${cmd} timed out` : `${cmd} failed: ${stderr.trim().split('\n').pop()}`));
    });
  });
}

// ffmpeg: never read stdin, only open local files (no http/playlists/concat).
const SAFE_INPUT = ['-hide_banner', '-nostdin', '-protocol_whitelist', 'file'];
// ffprobe has no -nostdin option; stdin is already ignored by spawn().
const SAFE_PROBE = ['-hide_banner', '-protocol_whitelist', 'file'];

export async function probe(input, demuxer) {
  const out = await run(
    'ffprobe',
    [...SAFE_PROBE, '-v', 'error', '-f', demuxer, '-print_format', 'json', '-show_format', '-show_streams', input],
    60_000,
  );
  const data = JSON.parse(out);
  const video = data.streams?.find((s) => s.codec_type === 'video');
  if (!video) throw new Error('No video track found');
  return {
    width: Number(video.width),
    height: Number(video.height),
    duration: Number(data.format?.duration ?? video.duration ?? 0),
    hasAudio: Boolean(data.streams?.some((s) => s.codec_type === 'audio')),
  };
}

// Caps the long edge at 1920 px (landscape 1920×1080, vertical Reels 1080×1920),
// keeps the aspect ratio and even dimensions. Works on old and new ffmpeg.
const SCALE = "scale='if(gte(iw,ih),min(1920,iw),-2)':'if(gte(iw,ih),-2,min(1920,ih))'";

/**
 * Converts a video to VP9 WebM (+ optional H.264 MP4 fallback) and a WebP poster.
 */
export async function convertVideo(input, outBase, { demuxer, crf, mp4Fallback, maxSeconds, timeoutSeconds, silent }) {
  const info = await probe(input, demuxer);
  if (!info.width || !info.height) throw new Error('Could not read the video size');
  const keepAudio = info.hasAudio && !silent;
  const timeout = timeoutSeconds * 1000;
  const common = [...SAFE_INPUT, '-y', '-f', demuxer, '-i', input, '-map', '0:v:0', ...(keepAudio ? ['-map', '0:a:0?'] : []), '-map_metadata', '-1', '-vf', SCALE, '-t', String(maxSeconds)];

  const webm = `${outBase}.webm`;
  await run(
    'ffmpeg',
    [
      ...common,
      '-c:v', 'libvpx-vp9', '-crf', String(silent ? crf + 2 : crf), '-b:v', '0',
      '-deadline', 'good', '-cpu-used', silent ? '4' : '3', '-row-mt', '1', '-tile-columns', '2', '-threads', '3',
      '-pix_fmt', 'yuv420p', '-g', '240',
      ...(keepAudio ? ['-c:a', 'libopus', '-b:a', '96k'] : ['-an']),
      '-fs', '400M', '-f', 'webm', webm,
    ],
    timeout,
  );

  let mp4 = null;
  if (mp4Fallback) {
    mp4 = `${outBase}.mp4`;
    await run(
      'ffmpeg',
      [
        ...common,
        '-c:v', 'libx264', '-crf', '24', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
        ...(keepAudio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']),
        '-movflags', '+faststart', '-fs', '400M', '-f', 'mp4', mp4,
      ],
      timeout,
    );
  }

  // Poster from a frame at 10% of the duration, then WebP via sharp.
  const posterPng = `${outBase}-poster.png`;
  const at = Math.max(0, Math.min(info.duration * 0.1, 5));
  await run('ffmpeg', [...SAFE_INPUT, '-y', '-ss', at.toFixed(2), '-f', demuxer, '-i', input, '-frames:v', '1', '-vf', SCALE, '-f', 'image2', '-c:v', 'png', posterPng], 120_000);
  const poster = `${outBase}-poster.webp`;
  await sharp(posterPng).webp({ quality: 80 }).toFile(poster);

  const sizes = {
    webm: (await stat(webm)).size,
    mp4: mp4 ? (await stat(mp4)).size : 0,
    poster: (await stat(poster)).size,
  };
  return { ...info, webm, mp4, poster, posterPng, sizes };
}

/** Checks that ffmpeg has the encoders the pipeline needs. */
export async function checkEncoders() {
  try {
    const out = await run('ffmpeg', ['-hide_banner', '-encoders'], 20_000);
    return { vp9: out.includes('libvpx-vp9'), opus: out.includes('libopus'), x264: out.includes('libx264') };
  } catch {
    return { vp9: false, opus: false, x264: false };
  }
}

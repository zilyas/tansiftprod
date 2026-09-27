import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { convertImage, detect } from '../src/media/convert.js';

const dir = mkdtempSync(join(tmpdir(), 'tsa-conv-'));

test('JPEG photo becomes smaller WebP files at several widths, EXIF rotation applied', async () => {
  // A noisy 3000×2000 photo-like JPEG with an EXIF "rotate 90°" flag.
  const w = 3000, h = 2000;
  const raw = Buffer.alloc(w * h * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = (i * 7 + ((i / 3000) | 0) * 13) % 256 ^ (Math.random() * 40);
  const input = join(dir, 'photo.jpg');
  await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 92 }).withMetadata({ orientation: 6 }).toFile(input);

  const type = await detect(input);
  assert.equal(type.kind, 'image');
  const out = await convertImage(input, join(dir, 'out'), { widths: [640, 1280, 1920], quality: 78 });
  // Orientation 6 means the displayed image is portrait.
  assert.equal(out.width, 2000);
  assert.equal(out.height, 3000);
  assert.deepEqual(out.variants.map((v) => v.width), [640, 1280, 1920]);
  for (const v of out.variants) {
    const meta = await sharp(v.path).metadata();
    assert.equal(meta.format, 'webp');
    assert.equal(meta.exif, undefined); // metadata stripped
  }
  const largest = out.variants.at(-1);
  assert.ok(largest.bytes < statSync(input).size, 'WebP should be smaller than the JPEG');
});

test('small images are never enlarged', async () => {
  const input = join(dir, 'small.png');
  await sharp({ create: { width: 500, height: 300, channels: 4, background: '#0047ab' } }).png().toFile(input);
  const out = await convertImage(input, join(dir, 'small-out'), { widths: [640, 1280, 1920], quality: 78 });
  assert.deepEqual(out.variants.map((v) => v.width), [500]);
});

test('non-media files are refused by content, not by name', async () => {
  const fake = join(dir, 'evil.jpg');
  writeFileSync(fake, '#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:0\nhttp://169.254.169.254/latest\n');
  assert.notEqual((await detect(fake)).kind, 'image');
  const svg = join(dir, 'x.png');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const t = await detect(svg);
  assert.ok(t.kind !== 'image' && t.kind !== 'video');
});

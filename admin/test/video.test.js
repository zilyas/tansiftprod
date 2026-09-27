// Real ffmpeg conversion. Skipped when ffmpeg/ffprobe are not installed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { convertVideo, detect, checkEncoders } from '../src/media/convert.js';

let hasFfmpeg = true;
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
} catch {
  hasFfmpeg = false;
}

test('vertical MP4 becomes WebM + MP4 + WebP poster, capped at 1920 on the long edge', { skip: !hasFfmpeg && 'ffmpeg not installed' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tsa-vid-'));
  const input = join(dir, 'reel.mp4');
  // 4 s vertical 1440×2560 test clip with a tone, like a phone Reel.
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=1440x2560:rate=30:duration=4', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', input]);

  assert.deepEqual(await checkEncoders(), { vp9: true, opus: true, x264: true });
  const type = await detect(input);
  assert.equal(type.kind, 'video');
  assert.equal(type.demuxer, 'mov');

  const out = await convertVideo(input, join(dir, 'out'), { demuxer: 'mov', crf: 33, mp4Fallback: true, maxSeconds: 180, timeoutSeconds: 300, silent: false });
  const probe = (f) => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', f]).toString()).streams;

  const webm = probe(out.webm);
  const v = webm.find((s) => s.codec_type === 'video');
  assert.equal(v.codec_name, 'vp9');
  assert.equal(v.width, 1080);
  assert.equal(v.height, 1920);
  assert.equal(webm.find((s) => s.codec_type === 'audio').codec_name, 'opus');
  assert.equal(probe(out.mp4).find((s) => s.codec_type === 'video').codec_name, 'h264');
  assert.ok(statSync(out.poster).size > 0);
  assert.ok(out.sizes.webm < statSync(input).size, 'WebM should be smaller than the source');
});

test('silent option removes the audio track', { skip: !hasFfmpeg && 'ffmpeg not installed' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tsa-vid2-'));
  const input = join(dir, 'loop.mp4');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=25:duration=2', '-f', 'lavfi', '-i', 'sine=duration=2',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', input]);
  const out = await convertVideo(input, join(dir, 'out'), { demuxer: 'mov', crf: 33, mp4Fallback: false, maxSeconds: 180, timeoutSeconds: 300, silent: true });
  const streams = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', out.webm]).toString()).streams;
  assert.equal(streams.some((s) => s.codec_type === 'audio'), false);
  assert.equal(out.mp4, null);
});

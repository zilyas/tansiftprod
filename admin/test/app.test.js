// End-to-end flow against the real app with fake GitHub/R2 back ends.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/server.js';
import { hashPassword } from '../src/auth/password.js';
import { base32Decode, generateSecret, hotp, currentStep } from '../src/auth/totp.js';
import { State } from '../src/state.js';
import { LoginLimiter } from '../src/auth/limiter.js';

const ORIGIN = 'https://admin.test';
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

async function setup() {
  const totpSecret = generateSecret();
  const config = {
    origin: ORIGIN,
    siteUrl: 'https://site.test',
    trustedProxyHops: 1,
    auth: {
      passwordHash: await hashPassword('a very good password', { N: 2 ** 14, r: 8, p: 1 }),
      totpSecret,
      recoveryHashes: [],
      sessionSecret: 's'.repeat(48),
      sessionVersion: '1',
      idleMinutes: 30,
      absoluteHours: 12,
      cookieSecure: true,
    },
    coolify: { deployUrl: '', token: '' },
    media: { maxImageMb: 25, maxVideoMb: 95, maxVideoSeconds: 180 },
  };
  const commits = [];
  const github = {
    head: 'abc123',
    async headSha() { return this.head; },
    async readFile(path) { return { text: read(path), sha: 'blob' }; },
    async commitFiles(files, message, expected) {
      if (expected && expected !== this.head) { const e = new Error('conflict'); e.status = 409; throw e; }
      commits.push({ files, message });
      this.head = `c${commits.length}`;
      return { sha: this.head, url: `https://github.com/x/y/commit/${this.head}` };
    },
    async history() { return []; },
  };
  const app = createApp({
    config,
    github,
    r2: { readLibrary: async () => ({ items: [] }) },
    jobs: { get: () => null, start: async () => ({}), removeFromLibrary: async () => null },
    state: new State(mkdtempSync(join(tmpdir(), 'tsa-test-'))),
    limiter: new LoginLimiter(),
  });
  return { app, config, commits, github, totpSecret };
}

// Minimal cookie jar for __Host- cookies.
function jar() {
  const cookies = new Map();
  return {
    header: () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
    store(res) {
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(';');
        const [k, ...v] = pair.split('=');
        const value = v.join('=');
        if (/Max-Age=0/i.test(c) || value === '') cookies.delete(k);
        else cookies.set(k, value);
      }
    },
  };
}

const post = (app, j, path, body, extra = {}) =>
  app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', Cookie: j.header(), 'X-Forwarded-For': '9.9.9.9', ...extra },
    body: JSON.stringify(body),
  });

test('password → code → session → publish', async () => {
  const { app, commits, totpSecret } = await setup();
  const j = jar();

  // Protected API refuses without a session; home redirects to login.
  assert.equal((await app.request('/api/me')).status, 401);
  assert.equal((await app.request('/')).status, 302);

  // Wrong password.
  let res = await post(app, j, '/api/login/password', { password: 'nope' });
  assert.equal(res.status, 401);

  // Code before password is refused.
  res = await post(app, j, '/api/login/code', { code: '123456' });
  assert.equal(res.status, 401);

  res = await post(app, j, '/api/login/password', { password: 'a very good password' });
  assert.equal(res.status, 200);
  j.store(res);
  assert.match(j.header(), /__Host-tsa_pre=/);

  const code = hotp(base32Decode(totpSecret), currentStep());
  res = await post(app, j, '/api/login/code', { code });
  assert.equal(res.status, 200);
  j.store(res);
  assert.match(j.header(), /__Host-tsa_session=/);
  const setCookie = res.headers.getSetCookie().join(' ');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  assert.match(setCookie, /SameSite=Strict/);

  // Same code again is refused (replay), even with a fresh password step.
  const j2 = jar();
  res = await post(app, j2, '/api/login/password', { password: 'a very good password' });
  j2.store(res);
  res = await post(app, j2, '/api/login/code', { code });
  assert.equal(res.status, 401);

  // Signed in: /api/me returns the CSRF token.
  res = await app.request('/api/me', { headers: { Cookie: j.header() } });
  assert.equal(res.status, 200);
  const me = await res.json();
  assert.ok(me.csrf);
  assert.equal(res.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/);

  // Read, edit, publish.
  res = await app.request('/api/content/settings', { headers: { Cookie: j.header() } });
  const { value, head } = await res.json();
  value.email = 'hello@tansift.test';

  // Without the CSRF token → refused.
  res = await post(app, j, '/api/publish', { changes: [{ id: 'settings', value }], head });
  assert.equal(res.status, 403);

  // Cross-site request → refused even with the token.
  res = await post(app, j, '/api/publish', { changes: [{ id: 'settings', value }], head }, { 'X-CSRF-Token': me.csrf, 'Sec-Fetch-Site': 'cross-site' });
  assert.equal(res.status, 403);

  // Broken shape → 422 with the field name, nothing committed.
  res = await post(app, j, '/api/publish', { changes: [{ id: 'settings', value: { ...value, geo: 'x' } }], head }, { 'X-CSRF-Token': me.csrf });
  assert.equal(res.status, 422);
  assert.match((await res.json()).error, /geo/);
  assert.equal(commits.length, 0);

  res = await post(app, j, '/api/publish', { changes: [{ id: 'settings', value }], head, message: 'New email' }, { 'X-CSRF-Token': me.csrf });
  assert.equal(res.status, 200);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].files[0].path, 'content/settings.json');
  assert.match(commits[0].files[0].text, /hello@tansift\.test/);
  assert.equal(commits[0].message, 'content: New email');

  // Publishing from a stale version is refused with a clear message.
  res = await post(app, j, '/api/publish', { changes: [{ id: 'settings', value }], head }, { 'X-CSRF-Token': me.csrf });
  assert.equal(res.status, 409);

  // Unknown file ids cannot be read or written.
  res = await app.request('/api/content/..%2F..%2Fetc', { headers: { Cookie: j.header() } });
  assert.equal(res.status, 404);
});

test('rate limit after repeated wrong passwords', async () => {
  const { app } = await setup();
  const j = jar();
  for (let i = 0; i < 5; i++) await post(app, j, '/api/login/password', { password: 'wrong' });
  const res = await post(app, j, '/api/login/password', { password: 'a very good password' });
  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get('retry-after')) > 0);
});

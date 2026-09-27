import { test } from 'node:test';
import assert from 'node:assert/strict';
import { base32Decode, base32Encode, generateSecret, hotp, otpauthUri, verifyTotp } from '../src/auth/totp.js';
import { hashPassword, verifyPassword } from '../src/auth/password.js';
import { checkSession, csrfToken, newSession, sign, unsign } from '../src/auth/session.js';
import { LoginLimiter } from '../src/auth/limiter.js';
import { clientIp, sameOriginRequest } from '../src/security.js';

// RFC 6238 Appendix B test vectors (SHA-1, secret "12345678901234567890").
test('TOTP matches RFC 6238 SHA-1 vectors', () => {
  const key = Buffer.from('12345678901234567890');
  const vectors = [
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ];
  for (const [t, expected] of vectors) assert.equal(hotp(key, Math.floor(t / 30), 8), expected);
});

test('base32 round trip and 160-bit secrets', () => {
  const s = generateSecret();
  assert.equal(base32Decode(s).length, 20);
  assert.equal(base32Encode(base32Decode(s)), s);
});

test('verifyTotp accepts ±1 step and rejects reuse', () => {
  const secret = base32Encode(Buffer.from('12345678901234567890'));
  const now = 1_700_000_000_000;
  const step = Math.floor(now / 30000);
  const code = hotp(Buffer.from('12345678901234567890'), step);
  assert.equal(verifyTotp(secret, code, { nowMs: now }), step);
  assert.equal(verifyTotp(secret, code, { nowMs: now + 30000 }), step); // one step late still OK
  assert.equal(verifyTotp(secret, code, { nowMs: now + 90000 }), -1); // too late
  assert.equal(verifyTotp(secret, code, { nowMs: now, lastStep: step }), -1); // replay
  assert.equal(verifyTotp(secret, 'abcdef', { nowMs: now }), -1);
});

test('otpauth URI has the expected parameters', () => {
  const uri = otpauthUri('JBSWY3DPEHPK3PXP', { issuer: 'Tansift', account: 'admin' });
  assert.match(uri, /^otpauth:\/\/totp\/Tansift%3Aadmin\?/);
  assert.match(uri, /secret=JBSWY3DPEHPK3PXP/);
  assert.match(uri, /algorithm=SHA1&digits=6&period=30/);
});

test('scrypt password hash verifies and rejects wrong passwords', async () => {
  const hash = await hashPassword('correct horse battery', { N: 2 ** 14, r: 8, p: 1 });
  assert.match(hash, /^scrypt:16384:8:1:/);
  assert.equal(await verifyPassword('correct horse battery', hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
});

test('signed cookies reject tampering and enforce timeouts', () => {
  const secret = 'x'.repeat(40);
  const token = sign({ a: 1 }, secret);
  assert.deepEqual(unsign(token, secret), { a: 1 });
  assert.equal(unsign(token.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), secret), null);
  assert.equal(unsign(token, 'y'.repeat(40)), null);
  const opts = { version: '1', idleMinutes: 30, absoluteHours: 12 };
  const s = newSession('1', 0);
  assert.ok(checkSession(s, opts, 10 * 60_000));
  assert.equal(checkSession(s, opts, 31 * 60_000), null); // idle
  assert.equal(checkSession({ ...s, seen: 13 * 3600_000 - 1000 }, opts, 13 * 3600_000), null); // absolute
  assert.equal(checkSession(s, { ...opts, version: '2' }, 1000), null); // revoked
  assert.notEqual(csrfToken('a', secret), csrfToken('b', secret));
});

test('limiter blocks after 5 failures per IP', () => {
  const l = new LoginLimiter();
  for (let i = 0; i < 5; i++) {
    assert.equal(l.retryAfter('1.1.1.1', 1000), 0);
    l.fail('1.1.1.1', 1000);
  }
  assert.ok(l.retryAfter('1.1.1.1', 2000) > 0);
  assert.equal(l.retryAfter('2.2.2.2', 2000), 0);
});

test('client IP trusts exactly the configured proxy hops', () => {
  assert.equal(clientIp('6.6.6.6, 1.2.3.4', '10.0.0.1', 1), '1.2.3.4'); // spoofed left entry ignored
  assert.equal(clientIp('1.2.3.4, 172.64.0.1', '10.0.0.1', 2), '1.2.3.4');
  assert.equal(clientIp(undefined, '10.0.0.1', 1), '10.0.0.1');
});

test('same-origin check uses Fetch Metadata, then Origin', () => {
  const h = (o) => new Headers(o);
  assert.equal(sameOriginRequest(h({ 'sec-fetch-site': 'same-origin' }), 'https://admin.x'), true);
  assert.equal(sameOriginRequest(h({ 'sec-fetch-site': 'same-site' }), 'https://admin.x'), false);
  assert.equal(sameOriginRequest(h({ origin: 'https://admin.x' }), 'https://admin.x'), true);
  assert.equal(sameOriginRequest(h({ origin: 'https://evil.x' }), 'https://admin.x'), false);
  assert.equal(sameOriginRequest(h({}), 'https://admin.x'), false);
});

// Password hashing with scrypt (OWASP: N=2^17, r=8, p=1).
// The hash is stored in ADMIN_PASSWORD_HASH as
//   scrypt:<N>:<r>:<p>:<base64 salt>:<base64 hash>
// Colons are used instead of "$" so .env interpolation cannot mangle it.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const KEYLEN = 32;
const DEFAULTS = { N: 2 ** 17, r: 8, p: 1 };

// N=2^17 needs 128 * N * r = 128 MiB; allow headroom above Node's 32 MiB default.
const maxmem = (N, r) => 256 * N * r;

export async function hashPassword(password, params = DEFAULTS) {
  const salt = randomBytes(16);
  const { N, r, p } = params;
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r, p, maxmem: maxmem(N, r) });
  return ['scrypt', N, r, p, salt.toString('base64'), key.toString('base64')].join(':');
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') throw new Error('ADMIN_PASSWORD_HASH has an unknown format');
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scrypt(String(password).normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: maxmem(Number(N), Number(r)),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

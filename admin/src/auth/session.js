// Stateless signed cookies (HMAC-SHA256). Nothing is stored server-side:
// rotating SESSION_SECRET or bumping SESSION_VERSION signs everyone out.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function unsign(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/** Cookie names: __Host- prefix requires Secure, so local http dev drops it. */
export function cookieNames(secure) {
  return secure ? { session: '__Host-tsa_session', pre: '__Host-tsa_pre' } : { session: 'tsa_session', pre: 'tsa_pre' };
}

export function cookieOptions(secure, maxAgeSeconds) {
  return { path: '/', httpOnly: true, secure, sameSite: 'Strict', maxAge: maxAgeSeconds };
}

/** New session payload after a successful password + TOTP login. */
export function newSession(version, nowMs = Date.now()) {
  return { v: version, sid: b64url(randomBytes(18)), iat: nowMs, seen: nowMs };
}

/** Validates idle and absolute timeouts. Returns the refreshed payload or null. */
export function checkSession(payload, { version, idleMinutes, absoluteHours }, nowMs = Date.now()) {
  if (!payload || payload.v !== version || typeof payload.iat !== 'number' || typeof payload.seen !== 'number') return null;
  if (nowMs - payload.iat > absoluteHours * 3600_000) return null;
  if (nowMs - payload.seen > idleMinutes * 60_000) return null;
  return { ...payload, seen: nowMs };
}

/** CSRF token bound to the session id. */
export function csrfToken(sid, secret) {
  return createHmac('sha256', secret).update(`csrf:${sid}`).digest('base64url');
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

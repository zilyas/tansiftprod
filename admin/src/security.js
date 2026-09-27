// Request hardening: client IP behind proxies, CSRF origin checks, headers.

/**
 * Client IP from X-Forwarded-For, trusting exactly `hops` proxies. Each proxy
 * appends the address it received the request from, so the client is the
 * entry `hops` positions from the right. Anything further left is spoofable.
 */
export function clientIp(xff, remote, hops) {
  if (!hops || !xff) return remote || 'unknown';
  const list = xff.split(',').map((s) => s.trim()).filter(Boolean);
  return list[list.length - hops] ?? list[0] ?? remote ?? 'unknown';
}

/**
 * Accepts a state-changing request only from this dashboard's own origin.
 * Uses Fetch Metadata when the browser sends it, else an exact Origin match.
 */
export function sameOriginRequest(headers, origin) {
  const site = headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const o = headers.get('origin');
  return o === origin;
}

export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self'",
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
    "font-src 'self'",
    "form-action 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-Robots-Tag': 'noindex, nofollow',
};

/** Structured audit log line on stdout (never includes secrets). */
export function audit(event, fields = {}) {
  const clean = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, typeof v === 'string' ? v.replace(/[\r\n]/g, ' ').slice(0, 300) : v]),
  );
  console.log(JSON.stringify({ time: new Date().toISOString(), event, ...clean }));
}

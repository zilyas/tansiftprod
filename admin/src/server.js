// Tansift content dashboard.
// Login: password (scrypt) → 6-digit authenticator code (TOTP) → signed session cookie.
// Content: JSON files in the GitHub repo, published as one commit per save.
// Media: uploads converted to WebP/WebM and stored on Cloudflare R2.
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

import { loadConfig } from './config.js';
import { verifyPassword } from './auth/password.js';
import { verifyTotp } from './auth/totp.js';
import { checkSession, cookieNames, cookieOptions, csrfToken, newSession, safeEqual, sign, unsign } from './auth/session.js';
import { LoginLimiter } from './auth/limiter.js';
import { State } from './state.js';
import { audit, clientIp, sameOriginRequest, securityHeaders } from './security.js';
import { FILES, TEMPLATES, fileById, validateContent } from './content.js';
import { GitHub } from './github.js';
import { R2 } from './r2.js';
import { Jobs } from './media/jobs.js';
import { checkEncoders } from './media/convert.js';

const PRE_AUTH_SECONDS = 5 * 60;
const MAX_TOTP_ATTEMPTS = 5;

export function createApp({ config, github, r2, jobs, state, limiter = new LoginLimiter() }) {
  const app = new Hono();
  const names = cookieNames(config.auth.cookieSecure);
  const secret = config.auth.sessionSecret;

  const ipOf = (c) => clientIp(c.req.header('x-forwarded-for'), c.env?.incoming?.socket?.remoteAddress, config.trustedProxyHops);

  // Security headers on every response.
  app.use('*', async (c, next) => {
    await next();
    for (const [k, v] of Object.entries(securityHeaders)) c.header(k, v);
    if (c.req.path.startsWith('/api/')) c.header('Cache-Control', 'no-store');
  });

  app.get('/healthz', (c) => c.text('ok\n'));

  // ---------- Session helpers ----------
  const readSession = (c) => checkSession(unsign(getCookie(c, names.session), secret), {
    version: config.auth.sessionVersion,
    idleMinutes: config.auth.idleMinutes,
    absoluteHours: config.auth.absoluteHours,
  });

  const writeSession = (c, payload) =>
    setCookie(c, names.session, sign(payload, secret), cookieOptions(config.auth.cookieSecure, config.auth.absoluteHours * 3600));

  const fail = (c, status = 401, message = 'Sign-in failed. Check your details and try again.') => c.json({ error: message }, status);

  // ---------- Login ----------
  app.post('/api/login/password', async (c) => {
    if (!sameOriginRequest(c.req.raw.headers, config.origin)) return fail(c, 403, 'Request refused.');
    const ip = ipOf(c);
    const wait = limiter.retryAfter(ip);
    if (wait) {
      c.header('Retry-After', String(wait));
      return fail(c, 429, `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`);
    }
    const body = await c.req.json().catch(() => ({}));
    const ok = typeof body.password === 'string' && body.password.length <= 256 && (await verifyPassword(body.password, config.auth.passwordHash));
    if (!ok) {
      limiter.fail(ip);
      audit('login.password.fail', { ip });
      return fail(c);
    }
    setCookie(c, names.pre, sign({ stage: 'pw', iat: Date.now(), n: 0 }, secret), cookieOptions(config.auth.cookieSecure, PRE_AUTH_SECONDS));
    audit('login.password.ok', { ip });
    return c.json({ next: 'code' });
  });

  app.post('/api/login/code', async (c) => {
    if (!sameOriginRequest(c.req.raw.headers, config.origin)) return fail(c, 403, 'Request refused.');
    const ip = ipOf(c);
    const wait = limiter.retryAfter(ip);
    if (wait) {
      c.header('Retry-After', String(wait));
      return fail(c, 429, `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`);
    }
    const pre = unsign(getCookie(c, names.pre), secret);
    if (!pre || pre.stage !== 'pw' || Date.now() - pre.iat > PRE_AUTH_SECONDS * 1000 || pre.n >= MAX_TOTP_ATTEMPTS) {
      deleteCookie(c, names.pre, { path: '/', secure: config.auth.cookieSecure });
      return fail(c, 401, 'Your sign-in expired. Enter your password again.');
    }
    const body = await c.req.json().catch(() => ({}));
    let ok = false;
    let method = 'totp';
    if (typeof body.code === 'string') {
      const step = verifyTotp(config.auth.totpSecret, body.code, { lastStep: state.lastTotpStep });
      if (step >= 0) {
        state.setLastTotpStep(step);
        ok = true;
      }
    } else if (typeof body.recovery === 'string') {
      method = 'recovery';
      const hash = createHash('sha256').update(body.recovery.replace(/[\s-]/g, '').toUpperCase()).digest('hex');
      if (config.auth.recoveryHashes.some((h) => safeEqual(h, hash)) && !state.isRecoveryUsed(hash)) {
        state.markRecoveryUsed(hash);
        ok = true;
      }
    }
    if (!ok) {
      limiter.fail(ip);
      setCookie(c, names.pre, sign({ ...pre, n: pre.n + 1 }, secret), cookieOptions(config.auth.cookieSecure, PRE_AUTH_SECONDS));
      audit('login.code.fail', { ip, method });
      return fail(c);
    }
    limiter.succeed(ip);
    deleteCookie(c, names.pre, { path: '/', secure: config.auth.cookieSecure });
    writeSession(c, newSession(config.auth.sessionVersion));
    audit(method === 'recovery' ? 'login.recovery.USED' : 'login.ok', { ip });
    return c.json({ ok: true });
  });

  app.post('/api/logout', (c) => {
    deleteCookie(c, names.session, { path: '/', secure: config.auth.cookieSecure });
    return c.json({ ok: true });
  });

  // ---------- Authenticated API ----------
  app.use('/api/*', async (c, next) => {
    if (c.req.path.startsWith('/api/login/') || c.req.path === '/api/logout') return next();
    const session = readSession(c);
    if (!session) return c.json({ error: 'Signed out. Please sign in again.' }, 401);
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      if (!sameOriginRequest(c.req.raw.headers, config.origin) || !safeEqual(c.req.header('x-csrf-token') ?? '', csrfToken(session.sid, secret))) {
        audit('csrf.refused', { ip: ipOf(c), path: c.req.path });
        return c.json({ error: 'Request refused. Reload the page and try again.' }, 403);
      }
    }
    writeSession(c, session); // sliding idle timeout
    c.set('session', session);
    return next();
  });

  app.get('/api/me', (c) =>
    c.json({
      csrf: csrfToken(c.get('session').sid, secret),
      siteUrl: config.siteUrl,
      files: FILES.map(({ id, label, group }) => ({ id, label, group })),
      templates: TEMPLATES,
      limits: { imageMb: config.media.maxImageMb, videoMb: config.media.maxVideoMb, videoSeconds: config.media.maxVideoSeconds },
    }),
  );

  app.get('/api/content/:id', async (c) => {
    const file = fileById(c.req.param('id'));
    if (!file) return c.json({ error: 'Unknown content file' }, 404);
    const [{ text, sha }, head] = await Promise.all([github.readFile(file.path), github.headSha()]);
    return c.json({ id: file.id, label: file.label, value: JSON.parse(text), sha, head });
  });

  app.post('/api/publish', async (c) => {
    const len = Number(c.req.header('content-length') ?? 0);
    if (len > 3_000_000) return c.json({ error: 'Too much content in one publish.' }, 413);
    const body = await c.req.json().catch(() => null);
    if (!body || !Array.isArray(body.changes) || !body.changes.length) return c.json({ error: 'Nothing to publish.' }, 400);
    const files = [];
    for (const change of body.changes) {
      const file = fileById(change.id);
      if (!file) return c.json({ error: `Unknown content file: ${change.id}` }, 400);
      const current = JSON.parse((await github.readFile(file.path)).text);
      const result = validateContent(change.value, current, TEMPLATES[file.id]);
      if (!result.ok) return c.json({ error: `${file.label}: ${result.problems.slice(0, 5).join('; ')}` }, 422);
      files.push({ path: file.path, text: result.text, label: file.label });
    }
    const summary = typeof body.message === 'string' && body.message.trim() ? body.message.trim().slice(0, 120) : `Update ${files.map((f) => f.label).join(', ')}`;
    try {
      const commit = await github.commitFiles(files, `content: ${summary}`, body.head);
      let deploy = 'auto';
      if (config.coolify.deployUrl && config.coolify.token) {
        const res = await fetch(config.coolify.deployUrl, { headers: { Authorization: `Bearer ${config.coolify.token}` } }).catch(() => null);
        deploy = res?.ok ? 'triggered' : 'failed';
      }
      audit('content.published', { ip: ipOf(c), files: files.map((f) => f.path).join(','), sha: commit.sha, deploy });
      return c.json({ ok: true, commit, deploy });
    } catch (err) {
      if (err.status === 409 || err.status === 422) return c.json({ error: 'The content changed on GitHub since you opened it. Reload to get the latest version, then re-apply your edits.' }, 409);
      throw err;
    }
  });

  app.get('/api/history', async (c) => c.json({ items: await github.history() }));

  // ---------- Media ----------
  // The browser sends the raw file as the request body (no multipart parsing),
  // streamed to a temp file with a hard size cap.
  app.post('/api/media', async (c) => {
    const maxBytes = Math.max(config.media.maxImageMb, config.media.maxVideoMb) * 1024 * 1024;
    const declared = Number(c.req.header('content-length') ?? 0);
    if (declared > maxBytes) return c.json({ error: `Files must be under ${config.media.maxVideoMb} MB.` }, 413);
    const name = decodeURIComponent(c.req.header('x-file-name') ?? 'upload').slice(0, 120);
    const alt = decodeURIComponent(c.req.header('x-alt') ?? '').slice(0, 300);
    const silent = c.req.header('x-silent') === '1';
    const dir = join(tmpdir(), 'tsa-uploads');
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, randomUUID());
    let bytes = 0;
    try {
      const counter = new TransformStream({
        transform(chunk, ctl) {
          bytes += chunk.byteLength;
          if (bytes > maxBytes) ctl.error(new Error('too large'));
          else ctl.enqueue(chunk);
        },
      });
      await pipeline(Readable.fromWeb(c.req.raw.body.pipeThrough(counter)), createWriteStream(filePath));
    } catch {
      await rm(filePath, { force: true });
      return c.json({ error: `Files must be under ${config.media.maxVideoMb} MB.` }, 413);
    }
    try {
      const job = await jobs.start({ filePath, originalName: name, bytes, alt, silent });
      audit('media.upload', { ip: ipOf(c), kind: job.kind, bytes });
      return c.json({ job }, 202);
    } catch (err) {
      await rm(filePath, { force: true });
      if (err.expose) return c.json({ error: err.message }, err.status ?? 400);
      throw err;
    }
  });

  app.get('/api/jobs/:id', (c) => {
    const job = jobs.get(c.req.param('id'));
    return job ? c.json({ job }) : c.json({ error: 'Unknown job' }, 404);
  });

  app.get('/api/media', async (c) => c.json(await r2.readLibrary()));

  app.delete('/api/media/:id', async (c) => {
    const removed = await jobs.removeFromLibrary(c.req.param('id'));
    if (!removed) return c.json({ error: 'Not found' }, 404);
    audit('media.deleted', { ip: ipOf(c), id: removed.id });
    return c.json({ ok: true });
  });

  // ---------- Pages ----------
  const noStore = async (c, next) => {
    await next();
    c.header('Cache-Control', 'no-store');
  };

  app.get('/login', noStore, serveStatic({ path: './public/login.html' }));
  app.get('/', noStore, async (c, next) => {
    if (!readSession(c)) return c.redirect('/login');
    return next();
  }, serveStatic({ path: './public/index.html' }));
  app.use('/assets/*', serveStatic({ root: './public' }));

  app.onError((err, c) => {
    console.error(JSON.stringify({ level: 'error', path: c.req.path, error: String(err.message).slice(0, 300) }));
    return c.json({ error: 'Something went wrong on the server. Try again in a moment.' }, 500);
  });

  return app;
}

// Start the server when run directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const r2 = new R2(config.r2);
  const app = createApp({
    config,
    github: new GitHub(config.github),
    r2,
    jobs: new Jobs({ r2, config }),
    state: new State(config.dataDir),
  });
  checkEncoders().then((enc) => {
    if (!enc.vp9) console.error(JSON.stringify({ level: 'error', msg: 'ffmpeg with libvpx-vp9 not found: video uploads will fail' }));
  });
  serve({ fetch: app.fetch, port: config.port }, (info) =>
    console.log(JSON.stringify({ level: 'info', msg: `Tansift dashboard listening on :${info.port}` })),
  );
}

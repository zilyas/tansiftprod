// Reads and checks every setting from environment variables. Secrets live only
// here (Coolify → Environment Variables); nothing is stored in a database.

function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. Run "npm run setup" to generate the auth values.`);
  return v;
}

function opt(name, fallback = '') {
  return process.env[name] ?? fallback;
}

function num(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
  return n;
}

export function loadConfig() {
  const cookieSecure = opt('COOKIE_SECURE', 'true') !== 'false';
  const config = {
    port: num('PORT', 8787),
    // Public URL of this dashboard, e.g. https://admin.example.com (used for CSRF origin checks).
    origin: req('ADMIN_ORIGIN').replace(/\/+$/, ''),
    siteUrl: opt('SITE_URL').replace(/\/+$/, ''),
    dataDir: opt('DATA_DIR', '/data'),
    // How many reverse proxies sit in front (Traefik = 1, Cloudflare + Traefik = 2).
    trustedProxyHops: num('TRUSTED_PROXY_HOPS', 1),

    auth: {
      passwordHash: req('ADMIN_PASSWORD_HASH'),
      totpSecret: req('ADMIN_TOTP_SECRET'),
      recoveryHashes: opt('ADMIN_RECOVERY_HASHES').split(',').map((s) => s.trim()).filter(Boolean),
      sessionSecret: req('SESSION_SECRET'),
      sessionVersion: opt('SESSION_VERSION', '1'),
      idleMinutes: num('SESSION_IDLE_MINUTES', 30),
      absoluteHours: num('SESSION_MAX_HOURS', 12),
      cookieSecure,
    },

    github: {
      token: req('GITHUB_TOKEN'),
      repo: req('GITHUB_REPO'), // owner/name
      branch: opt('GITHUB_BRANCH', 'main'),
      authorName: opt('GIT_AUTHOR_NAME', 'Tansift dashboard'),
      authorEmail: opt('GIT_AUTHOR_EMAIL', 'dashboard@users.noreply.github.com'),
    },

    // Optional: explicit Coolify deploy call after each publish. Leave empty when
    // Coolify auto-deploys on push (GitHub App or push webhook).
    coolify: {
      deployUrl: opt('COOLIFY_DEPLOY_URL'),
      token: opt('COOLIFY_API_TOKEN'),
    },

    r2: {
      accountId: req('R2_ACCOUNT_ID'),
      accessKeyId: req('R2_ACCESS_KEY_ID'),
      secretAccessKey: req('R2_SECRET_ACCESS_KEY'),
      bucket: req('R2_BUCKET'),
      // Public base URL of the bucket's custom domain, e.g. https://media.example.com
      publicUrl: req('R2_PUBLIC_URL').replace(/\/+$/, ''),
      jurisdiction: opt('R2_JURISDICTION'), // "eu" for EU buckets, else empty
    },

    media: {
      maxImageMb: num('MAX_IMAGE_MB', 25),
      maxVideoMb: num('MAX_VIDEO_MB', 95),
      maxVideoSeconds: num('MAX_VIDEO_SECONDS', 180),
      imageWidths: opt('IMAGE_WIDTHS', '640,1280,1920')
        .split(',')
        .map(Number)
        .filter((n) => n > 0),
      imageQuality: num('IMAGE_QUALITY', 78),
      videoCrf: num('VIDEO_CRF', 33),
      videoMp4Fallback: opt('VIDEO_MP4_FALLBACK', 'true') !== 'false',
      encodeTimeoutSeconds: num('ENCODE_TIMEOUT_SECONDS', 900),
    },
  };

  if (Buffer.from(config.auth.sessionSecret).length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.github.repo)) throw new Error('GITHUB_REPO must look like owner/name');
  return config;
}

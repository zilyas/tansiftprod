# Commit JSON to Git, convert media, redeploy automatically

The best 2026 architecture for this brief is a small, separate Node.js admin container on its own subdomain (for example `admin.example.com`), deployed on Coolify next to the static Astro site. The admin keeps every secret server-side. Login uses a scrypt or Argon2id password hash and a SHA-1/6-digit/30-second TOTP secret, both held in Coolify environment variables, plus a stateless HMAC-signed `__Host-` session cookie. Uploads stream through the admin server, where sharp converts images to WebP and ffmpeg converts video to VP9 WebM (optionally with an H.264 MP4 fallback). The results go to Cloudflare R2 under immutable, unique keys and are served from an R2 custom domain. **Content lives as bilingual JSON in the site's GitHub repo, and each Publish writes it as one atomic commit through the Git Database API**. Coolify's GitHub-App auto-deploy, filtered with Watch Paths, rebuilds the static site from that commit, so the dashboard never needs a Coolify token. **Keeping content JSON in R2 instead is workable, but it gives up free history, diffs, `git revert` rollback and commit-pinned reproducible builds**, and in return removes only a GitHub token and a few seconds of commit latency. Running costs for a typical brochure site round to about $0 per month on R2's free tier, plus whatever the Coolify VPS already costs. The real limits are elsewhere: Cloudflare's 100 MB proxied-upload cap on Free/Pro plans, the 512 MB CDN cacheable-file limit, and CPU time for video encoding on a small VPS.

## Off-the-shelf git CMSs miss on 2FA, databases or server-side conversion

Five mature git-based CMSs were checked, and none meets all the constraints. **TinaCMS self-hosted needs a database-backed Data Layer** (MongoDB in its first starter, Vercel KV in the Next.js demo), although Tina itself describes that layer as "more of an ephemeral cache" ([Tina](https://tina.io/blog/self-hosted-datalayer)). **Pages CMS self-hosted requires PostgreSQL** and a GitHub App ([pages-cms](https://github.com/pages-cms/pages-cms)). Both break the no-database rule. Decap's GitHub backend relies on OAuth and needs your own OAuth routes outside Netlify ([Astro docs](https://docs.astro.build/en/guides/cms/decap-cms/)). Keystatic needs an Astro server adapter plus a custom GitHub App ([Keystatic](https://keystatic.com/docs/installation-astro)). Sveltia CMS (v0.221.4, September 2026) comes closest. It is a Decap-compatible static SPA that can "Sign In with Token" using a fine-grained PAT with `contents=write`, and it commits several files at once through GraphQL `createCommitOnBranch` ([Sveltia](https://github.com/sveltia/sveltia-cms)).

Every one of these tools falls short for this client in the same three ways. Authentication is GitHub's, so the client would need a GitHub account and GitHub's 2FA rather than your own password-plus-TOTP. In Sveltia's case, the PAT sits in the browser. And none of them runs sharp or ffmpeg on upload. **A custom dashboard that follows Sveltia's model but keeps the GitHub token behind its own 2FA session is safer and fits the brief exactly.** The part worth reusing is the design pattern (JSON files in the repo, batched commits), not the product. Sveltia behind a Traefik gate remains a legitimate low-effort fallback if server-side conversion is dropped.

## Git commits beat JSON in R2 for content storage

The storage decision comes down to history and reproducibility, and on both Git wins clearly.

| Criterion | JSON committed to GitHub | JSON objects in R2 | JSON on a Coolify volume + Astro SSR |
|---|---|---|---|
| History / diff / rollback | Free (`git log`, `git revert`) | DIY: timestamped snapshots plus a "current" pointer, because R2 does not implement bucket versioning ([R2](https://developers.cloudflare.com/r2/api/s3/api/)) | DIY snapshots and volume backups |
| Reproducible builds | Build is tied to a commit SHA | "Latest" fetch at build time is not reproducible | Not applicable (runtime reads) |
| Coolify rollback | Image and content roll back together | Rollback "does not … restore" external state ([Coolify](https://coolify.io/docs/applications/deployments/rollbacks)) | Same problem |
| Deploy trigger | Push auto-deploys (GitHub App) | Needs an explicit deploy webhook call | No rebuild at all |
| Publish latency | Commit, then full static build | PUT, then full static build | Instant |
| Runtime surface | Static Nginx | Static Nginx | Node server always on |
| Extra credentials | Fine-grained PAT or GitHub App | R2 token (needed for media anyway) | None |

**How to commit.** For a Publish that touches several JSON files, use the Git Database API sequence. First `GET /repos/{o}/{r}/git/ref/heads/main`. Then `POST …/git/blobs` once per file, `POST …/git/trees` with `base_tree`, `POST …/git/commits` with `parents: [headSha]`, and finally `PATCH …/git/refs/heads/main` with `force: false`, which guarantees a fast-forward update and so works as optimistic concurrency ([GitHub refs](https://docs.github.com/en/rest/git/refs#update-a-reference); [trees](https://docs.github.com/en/rest/git/trees#create-a-tree)). The simpler `PUT /repos/{o}/{r}/contents/{path}` requires the current blob `sha` when updating. GitHub also warns that parallel content writes "will conflict," so they must run serially ([GitHub contents](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)). With that endpoint, N files means N commits and potentially N builds. **Either use the Git Data API or keep all editable content in one or two JSON files.**

**Rate limits.** They do not matter for a single editor. Limits are 5,000 requests/hour for a PAT, 80 content-creating requests/minute and 500/hour, and GitHub recommends serial mutating requests spaced at least one second apart ([GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)). A four-file publish costs about seven write calls.

**Credential.** Use a fine-grained PAT scoped to the one repo with **Contents: read & write** only, which is enough for every endpoint above ([GitHub permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)). Give it an expiry of up to 366 days and set a rotation reminder ([GitHub PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)). A GitHub App installation token (one-hour lifetime, not tied to a person's account) is more robust, but it adds JWT key management.

**JSON shape and Astro integration.** Mirror the bilingual structure in one file per page or collection, for example `src/content/pages/home.json` holding `{ "hero": { "title": { "fr": "…", "en": "…" }, "image": { "src": "https://media.example.com/images/2026/09/<uuid>-1280.webp", "srcset": [...], "alt": { "fr": "…", "en": "…" } } } }`. Validate it with an Astro content-collection Zod schema so that a malformed save fails the build rather than shipping. Astro's built-in `file()` loader reads JSON at build time ([Astro](https://docs.astro.build/en/guides/content-collections/)). Store a `media.json` manifest (key, type, width, height, duration, poster, alt) in the repo instead of treating R2 `ListObjectsV2` as the media index. That keeps the library versioned and avoids Class A list charges.

**When R2 or SSR storage is the better choice.** The SSR-on-a-volume option is the only one that publishes instantly. It uses `@astrojs/node` in `standalone` mode, per-route `prerender = false`, and Astro 7's `memoryCache()` route caching invalidated on save ([Astro caching](https://docs.astro.build/en/guides/caching/)). It is right if the client edits hourly and cannot wait for a rebuild. Otherwise it trades a static Nginx site for an always-on Node process, and backups, atomic writes and rollback all become your problem.

## Publishing triggers Coolify through the push, not a token

Coolify v4 offers two routes, and the recommended one needs no Coolify credential. **An app created through Coolify's GitHub App gets Auto Deploy by default**, and "you do not need to copy a manual Git webhook URL". GitHub must still be able to reach Coolify's public webhook endpoint ([Coolify](https://coolify.io/docs/applications/deployments/automatic-deployments)). An app created from a public repository URL has no automatic deploys until you add a manual webhook with a secret and "Just the push event" ([Coolify](https://coolify.io/docs/applications/sources/github/auto-deploy)). Set **Watch Paths** on both apps, since patterns support `**` and `!` negation and the last match wins ([Coolify](https://coolify.io/docs/applications/deployments/automatic-deployments)). If the admin code lives in the same repo, give the admin app `!src/content/**` so content commits never redeploy the dashboard. Leave the site app watching everything.

The alternative is the explicit deploy webhook: `POST https://<coolify>/api/v1/deploy` with body `{"uuid":"<site-uuid>","force":false}` and header `Authorization: Bearer <id|secret>` ([Coolify](https://coolify.io/docs/core/automation/deploy-webhooks)). Use it only if you want Save and Publish to be separate actions, or if content lives outside Git (the R2 variant). In that case:

- Create a **`deploy`-only** token with a 90-day or one-year expiry ([Coolify permissions](https://coolify.io/docs/api/permissions)).
- Turn on Settings → Advanced → API Access and restrict "Allowed IPs" to the admin's egress IP. If the admin calls `http://coolify:8080/api/v1` over the `coolify` Docker network, allow that network's subnet instead ([Coolify](https://coolify.io/docs/api/ip-allowlist)).
- Keep `force=false` so the build cache is reused.
- Handle 401, 403 and 429 responses, honouring `Retry-After`.
- Remember that an accepted request only means a deployment UUID was queued, not that the deploy succeeded, so poll or link to the Deployments page ([Coolify](https://coolify.io/docs/core/automation/deploy-webhooks)).

**Build settings.** Build the site with Nixpacks or Railpack with "Is it a static site?" enabled and the publish directory set to `dist`, or with a Dockerfile. The plain Static build pack runs no build command ([Coolify](https://coolify.io/docs/applications/builds/static)). Rolling updates keep the old container serving until the new one passes its health check ([Coolify](https://coolify.io/docs/applications/deployments/rolling-updates)), so the client never sees downtime during a publish.

Two points remain unverified. Coolify does not document whether queued deploys are debounced or superseded. Build time is also undocumented; expect tens of seconds to a few minutes on a small VPS. Show the client a "Published, live in about 2 minutes" status rather than promising instant changes.

## Uploads route through the server to feed sharp and ffmpeg

Server-side conversion decides the upload path. **Presigned direct-to-R2 PUTs skip your server, so they cannot feed sharp or ffmpeg.** The browser therefore streams the file to the admin, which converts it and then uploads the outputs to R2 with the S3 API. This path has one hard constraint. **Cloudflare's proxy caps request bodies at 100 MB on the Free and Pro plans** (200 MB on Business) ([Cloudflare](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)). To accept larger source videos, either make the admin hostname DNS-only (grey cloud), which means giving up Cloudflare Access on that hostname, or cap client uploads at about 95 MB. For hero clips and marketing video, **a 95 MB input cap is usually adequate and keeps the admin behind Cloudflare.**

### Image settings

Use sharp 0.35.x with the following settings.

- **Constructor:** `sharp(input, { failOn: 'warning', limitInputPixels: 50_000_000, autoOrient: true })`.
- **Resize:** `.resize({ width: w, withoutEnlargement: true })` at widths 640, 1280, 1920 and 2400, skipping any width larger than the original.
- **Encode:** `.webp({ quality: 78, effort: 4, smartSubsample: true })`. Use `lossless: true` for PNG logos and screenshots.
- **Process tuning:** `sharp.cache(false)` and `sharp.concurrency(1)`, with `MALLOC_ARENA_MAX=2` on glibc images ([sharp](https://github.com/lovell/sharp/blob/main/docs/src/content/docs/install.md)).

By default sharp strips EXIF, GPS and XMP metadata and converts to sRGB ([sharp](https://github.com/lovell/sharp/blob/main/docs/src/content/docs/api-output.md)), which also protects the client from publishing photo geolocation. Google measures lossy WebP at **25–34% smaller than JPEG** and lossless WebP at 26% smaller than PNG ([Google WebP](https://developers.google.com/speed/webp/docs/webp_study)). AVIF is supported everywhere that matters (Safari 16.4+) ([caniuse](https://github.com/Fyrd/caniuse/blob/main/features-json/avif.json)) but costs noticeably more CPU, so keep it as an optional `<picture>` source rather than the baseline.

### Video settings

Encode single-pass constant-quality VP9, with each flag defined below.

```
ffmpeg -hide_banner -nostdin -protocol_whitelist file -f mov -i in \
  -map 0:v:0 -map 0:a:0? -map_metadata -1 \
  -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" \
  -c:v libvpx-vp9 -crf 33 -b:v 0 -deadline good -cpu-used 3 -row-mt 1 -tile-columns 2 -threads 3 \
  -pix_fmt yuv420p -g 240 -c:a libopus -b:a 96k -t 120 -fs 300M -f webm out.webm
```

- **Safety flags.** `-nostdin` stops ffmpeg reading from standard input. `-protocol_whitelist file` blocks every network protocol, and `-f mov` pins the input format (use `-f matroska` for WebM or MKV input). Together they stop a disguised playlist file from making ffmpeg fetch URLs.
- **Streams and metadata.** `-map 0:v:0 -map 0:a:0?` keeps the first video track and the first audio track if one exists. `-map_metadata -1` drops the source metadata.
- **Size.** The `-vf` scale filter caps output at 1920x1080, keeps the aspect ratio and forces even dimensions.
- **Quality.** `-crf 33 -b:v 0` switches VP9 to constant-quality mode. FFmpeg's wrapper states that a zero bitrate "engage[s] constant quality mode" ([FFmpeg](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/libvpxenc.c)).
- **Speed.** `-deadline good -cpu-used 3` balances speed against quality, and `-row-mt 1 -tile-columns 2 -threads 3` spread the work over several cores. Avoid the `best` deadline, which FFmpeg says "should be avoided" ([FFmpeg](https://github.com/FFmpeg/FFmpeg/blob/master/doc/encoders.texi)).
- **Format.** `-pix_fmt yuv420p` uses the widely supported colour format, and `-g 240` sets a keyframe at least every 240 frames.
- **Audio.** `-c:a libopus -b:a 96k` encodes audio as Opus at 96 kbps.
- **Hard limits.** `-t 120` stops encoding after 120 seconds of video, and `-fs 300M` stops when the output reaches 300 MB.

For silent hero loops, replace the audio options with `-an` and use CRF 35–38 with `-cpu-used 4`. In the page markup, use `autoplay muted loop playsinline`.

**Browser support and fallback.** WebM/VP9 now plays in every current engine, including iOS Safari from 17.4. Safari never supports WebM alpha ([caniuse](https://github.com/Fyrd/caniuse/blob/main/features-json/webm.json)). AV1 in Safari works only on devices with hardware decoders ([MDN](https://github.com/mdn/content/blob/main/files/en-us/web/media/guides/formats/video_codecs/index.md)). An **H.264 MP4 fallback** (`libx264 -crf 24 -preset medium -movflags +faststart`) is cheap insurance for older iPhones and Macs, and roughly doubles encode time.

**Poster frames.** Generate the poster with `ffmpeg -ss <10% of duration> -frames:v 1 … -f image2pipe -c:v png -` and pipe the frame into sharp for WebP. Record width, height and duration in `media.json` to prevent layout shift.

### Treat uploads as hostile

Historic "video" uploads that were actually HLS or DASH playlists caused SSRF and local file reads through ffmpeg ([HackerOne #1062888](https://hackerone.com/reports/1062888); [Red Hat CVE-2023-6605](https://bugzilla.redhat.com/show_bug.cgi?id=2334336)). The pipeline should therefore:

1. Stream each upload to a random temp filename, with byte caps of about 25 MB per image and 95 MB per video.
2. Detect the real type from magic bytes (for example with `file-type`) and allowlist JPEG, PNG, WebP, GIF, AVIF and HEIC for images and MP4, MOV, WebM and MKV for video.
3. Reject SVG, m3u8 files and anything text-like.
4. Run ffprobe with `-protocol_whitelist file` and a pinned demuxer before encoding.
5. Spawn ffmpeg with an argument array, never a shell, and kill it with SIGKILL when it passes a timeout.
6. Queue jobs with `p-queue` at a concurrency of 1 for video and 2 for images. Return HTTP 202 and have the UI poll for status.
7. Set Coolify container limits of about `cpus: 2` and `memory: 1.5g`.

For the image, use `node:24-bookworm-slim` with `apt-get install ffmpeg`. Add a build step that runs `ffmpeg -encoders | grep libvpx-vp9` so that a missing codec fails the build loudly rather than at upload time.

### Pasted external links

The option to paste an external link needs its own rules. **Never fetch the pasted URL on the server**, because that would reopen the SSRF risk the ffmpeg flags close. Accept only `https:` URLs, store them in the JSON as `{ "kind": "external", "url": "…" }`, and render them as a plain `<img>` or `<video>` tag. For YouTube or Vimeo, use a parsed video ID rendered into a fixed embed template rather than arbitrary iframe HTML. External media gets no conversion, and it breaks if the other host removes it, so the UI should say so.

## R2 settings cost cents and have three limits worth knowing

**Client configuration.** Use `@aws-sdk/client-s3` with `endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com` and `region: "auto"` ([R2](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)). **Also set `requestChecksumCalculation: "WHEN_REQUIRED"` and `responseChecksumValidation: "WHEN_REQUIRED"`**, because SDK v3.729.0 and later send default CRC32 checksums that R2 rejects ([Cloudflare Community](https://community.cloudflare.com/t/aws-sdk-client-s3-v3-729-0-breaks-uploadpart-and-putobject-r2-s3-api-compatibility/758637)).

**Token.** Create an **Account API token with Object Read & Write scoped to the single media bucket**. Object-level tokens work only with the S3 API, which is all the admin needs ([R2 tokens](https://developers.cloudflare.com/r2/api/tokens/)).

**Uploading converted files.** Upload each output with `@aws-sdk/lib-storage` `Upload`, which handles multipart for large files ([R2](https://developers.cloudflare.com/r2/objects/upload-objects/)). Use keys such as `images/2026/09/<uuid>-1280.webp`, and set `ContentType` and `CacheControl: "public, max-age=31536000, immutable"` on each upload. R2 has no versioning, so overwriting a key destroys the old file. Unique keys avoid that and also make cache purges unnecessary.

**Public delivery.** Serve media from a **custom domain** such as `media.example.com`, which must be a zone in the same Cloudflare account, and turn on Smart Tiered Cache. Disable `r2.dev`, which is "not intended for production usage," is rate-limited and has no caching or WAF ([R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/); [R2 limits](https://developers.cloudflare.com/r2/platform/limits/)). No CORS rule is needed when the site only uses `<img>`/`<video>` tags and the server does the uploading.

| Item | Figure |
|---|---|
| R2 storage | $0.015/GB-month; first 10 GB-month free ([R2 pricing](https://developers.cloudflare.com/r2/pricing/)) |
| Class A (PUT, List, multipart) | $4.50/million; 1M/month free |
| Class B (GET, HEAD) | $0.36/million; 10M/month free |
| Egress, DeleteObject | Free |
| Example: 20 GB media, 5k uploads, 1M reads/month | About $0.15/month (derived from the published rates) |
| CDN cacheable file size (Free/Pro/Business) | 512 MB ([Cloudflare](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)) |
| Proxied upload body (Free/Pro) | 100 MB |
| Writes to the same key | 1 per second |
| Alternative: Image/Media Transformations | 5,000 unique free/month, then $0.50 per 1,000 ([Images pricing](https://developers.cloudflare.com/images/pricing/)) |
| Alternative: Stream | $5 per 1,000 minutes stored + $1 per 1,000 minutes delivered ([Stream pricing](https://developers.cloudflare.com/stream/pricing/)) |

Two alternatives deserve a fair hearing. Cloudflare Image Transformations would replace sharp entirely with on-the-fly `format=auto` resizing, and a small site would likely stay inside the 5,000 free unique transformations. However, the brief asks for server-side WebP files, and self-converting costs nothing extra. Stream is only worth it for long-form video on mobile networks that needs adaptive bitrate. For short loops, Stream bills every delivered minute, including every autoplay loop. On policy, Cloudflare's 2023 terms update allows video delivered through the CDN "so long as that content is hosted by a Cloudflare service like Stream, Images, or R2" ([Cloudflare blog](https://blog.cloudflare.com/updated-tos)). That wording was read through a search snippet, so re-check the live Service-Specific Terms before launch. Keep each video under 512 MB so the CDN caches it and serves range requests (206) for seeking ([Cloudflare](https://developers.cloudflare.com/cache/reference/range-requests/)).

## Password, TOTP and a signed cookie secure one admin without a database

**Password hash.** Store only a self-describing hash in an environment variable, never the password. OWASP's current order is Argon2id (19 MiB, t=2, p=1), then scrypt (N=2^17, r=8, p=1) ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)). Node's native `crypto.argon2` exists only from **v24.7.0** ([Node.js](https://nodejs.org/api/crypto.html)). On Node 24 LTS, store Argon2id, for example `ADMIN_PASSWORD_HASH=argon2id:m=19456,t=2,p=1:<b64salt>:<b64hash>`. Use `:` as the separator rather than `$`, because `$` can be mangled by `.env` interpolation. If you use scrypt instead, raise `maxmem` to 256 MiB, because N=2^17 fails with the default 32 MiB limit, and call the async API. Compare hashes with `crypto.timingSafeEqual`.

**TOTP.** Generate a 20-byte CSPRNG secret, base32-encoded without padding, and use **SHA-1, 6 digits and a 30-second period**. That is the only combination every mainstream app honours; Microsoft Authenticator still ignores `algorithm=SHA256` ([Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5175383/authenticator-app-not-working-with-sha-256-and-sha)). Provision it offline with `otpauth://totp/Site:admin?secret=…&issuer=Site` ([Key URI format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)). Accept the current step plus or minus one. Reject any step at or before the last accepted step, because NIST requires each OTP to be accepted only once ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/)). Persist `lastAcceptedStep` to a small volume file so the rule survives restarts. Keep 8–10 recovery codes as SHA-256 hashes in `ADMIN_RECOVERY_HASHES`. Treat any recovery-code login as break-glass: log it loudly and rotate the secret through Coolify afterwards.

**Sessions.** Use a password step that issues a 5-minute pre-auth cookie. That cookie allows only the TOTP step, and at most 5 attempts. A successful TOTP issues `__Host-admin_session`, a cookie holding `base64url(payload).HMAC-SHA256`, with `Secure; HttpOnly; SameSite=Strict; Path=/` and no Domain attribute ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)). Enforce a **30-minute idle and 8–12-hour absolute timeout** from the signed timestamps. Both sit well inside NIST AAL2's 1-hour idle and 24-hour absolute ceilings ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html)). To revoke every session, bump `SESSION_VERSION` or rotate `SESSION_SECRET`.

**Brute force, CSRF and headers.** These controls complete the setup:

- **Rate limiting.** Allow 5 failures per IP per 15 minutes. Add a global escalating delay after about 20 failures per hour, so the single account throttles rather than permanently locking itself out. Rate-limit before running the expensive hash, and return one identical 401 response for every failure ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)).
- **Client IP behind Traefik.** Trust exactly one proxy hop (Express `trust proxy = 1`), because otherwise every visitor appears with Traefik's IP ([express-rate-limit](https://github.com/express-rate-limit/express-rate-limit/blob/main/docs/guides/troubleshooting-proxy-issues.mdx)). Use two hops if Cloudflare also sits in front.
- **CSRF.** Reject any non-GET request unless `Sec-Fetch-Site` is `same-origin`, falling back to an exact `Origin` check when the header is absent. On top of that, require a session-bound HMAC CSRF token ([OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)). The public site on the same registrable domain counts as "same-site," so SameSite alone does not protect you ([MDN](https://developer.mozilla.org/en-US/docs/Glossary/Site)).
- **Response headers.** Send a strict nonce-based CSP with `frame-ancestors 'none'`, plus `nosniff`, HSTS, `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
- **Logging.** Write JSON-line audit logs to stdout, and never log secrets.
- **Perimeter (optional).** Cloudflare Access (free for up to 50 users) or a Traefik `ipAllowList` adds another layer, but only if the origin cannot be reached around it.

## Conclusion

The interesting result is that the no-database constraint costs almost nothing. Git provides the content history and audit trail, R2 plus a `media.json` manifest in the repo provides the media library, environment variables hold all the auth state, and only two tiny files need a writable volume: TOTP replay state and consumed recovery codes. The components that carry real operational risk are the video pipeline and the upload path. The ffmpeg hardening and the 100 MB proxy cap will shape the client's experience more than any storage choice. Build this as roughly 1,500 lines of Node, and treat encode time, the Cloudflare video terms and Coolify's queued-deploy behaviour as things to measure on the real VPS before handover.

Several upgrades can be added later without changing the architecture. SVT-AV1 WebM is an extra `<source>` once the VPS has spare CPU. A passkey could sit alongside TOTP for phishing resistance. And if the client ever demands instant publishing, the SSR-on-a-volume variant can replace the rebuild step, because the JSON schema and the R2 media layer stay the same across all three storage options.

# Content dashboard

The client edits the website at `https://admin.<domain>` without touching code. There is no database:

- **Text and page structure** live in the JSON files in [`content/`](../content). The dashboard reads them from GitHub and writes changes back as one commit per publish. Coolify rebuilds the site from that commit.
- **Photos and videos** are uploaded to **Cloudflare R2**. The dashboard converts them first: photos become **WebP** at 640, 1280 and 1920 px, and videos become **WebM (VP9 + Opus)** capped at 1920 px, with an MP4 fallback for older iPhones and a WebP poster. The list of uploads is a single `library.json` file in the bucket.
- **External links** also work in every image and video field, with no upload. Accepted links are direct `https://` files, YouTube and Vimeo.

```
Client ──► admin.<domain> (Node, this folder)  ──commit──► GitHub (content/*.json)
               │                                              │ push
               └──upload──► Cloudflare R2 (media.<domain>)    ▼
                                                        Coolify rebuilds the site
```

A bad edit cannot break the live site. The dashboard checks every change against the current file's shape before committing. The site build checks the JSON again with a schema (`src/lib/content.ts`). If a build fails, Coolify keeps the previous version online.

## Security

- **Sign-in:** password first, then a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Aegis…). If the phone is lost, a one-time recovery code replaces the 6-digit code.
- **Password storage:** the password is stored only as a scrypt hash in an environment variable.
- **Code reuse:** each authenticator code works once.
- **Rate limits:** after 5 failed attempts from one address, sign-in is blocked for 15 minutes. A global limit also slows down distributed guessing.
- **Sessions:** sessions end after 30 minutes idle or 12 hours in total. Cookies are `Secure`, `HttpOnly` and `SameSite=Strict`, and every change carries a CSRF token.
- **Signing everyone out:** raise `SESSION_VERSION` (for example `1` → `2`) and redeploy.
- **Upload checks:** file types are detected from the file's bytes, not its name. SVG, HEIC and other formats are refused. ffmpeg runs with network protocols disabled and a hard time limit.
- **Photo privacy:** location data (EXIF/GPS) is stripped from photos.
- **Audit log:** every sign-in, publish and upload is logged as a JSON line, which you can see in Coolify's logs.

For extra protection you can also put the admin domain behind **Cloudflare Access** (free for up to 50 users) or an IP allow-list.

## 1. Create the Cloudflare R2 bucket

1. In Cloudflare: **R2 Object Storage → Create bucket**, for example `tansift-media`. Choose the location **Automatic**, or **EU jurisdiction** (then set `R2_JURISDICTION=eu`).
2. **Bucket → Settings → Custom Domains → Connect Domain**: `media.<domain>`. The domain must be on Cloudflare.
   - Don't use the `r2.dev` address for the live site. Cloudflare rate-limits it and it is not cached.
3. **R2 → Manage API tokens → Create API token**:
   - Permission **Object Read & Write**, applied to **this bucket only**.
   - Copy the **Access Key ID** and the **Secret Access Key**. The secret is shown once.
   - The **Account ID** is on the R2 overview page.

No CORS setup is needed: uploads go through the dashboard server, not straight from the browser to R2.

The R2 free tier covers 10 GB of storage and has no download (egress) fees.

## 2. Create a GitHub token

GitHub → **Settings → Developer settings → Fine-grained personal access tokens → Generate new token**:

- **Repository access:** only `zilyas/tansiftprod`
- **Permissions → Repository → Contents:** Read and write. Metadata is added automatically.
- **Expiration:** up to one year. Put a reminder in your calendar to renew it.

## 3. Generate the password, 2FA and recovery codes

On your own computer (Node 22 or newer):

```bash
cd admin
npm ci
npm run setup
```

The script:

1. Asks for the client's password (at least 12 characters).
2. Shows a QR code. The client scans it with their authenticator app, or you give them the manual key.
3. Prints **10 recovery codes**. Give them to the client to keep somewhere safe (a password manager or printed out). Each code works once.
4. Prints the lines `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `ADMIN_RECOVERY_HASHES` and `SESSION_SECRET`. Paste them into Coolify in step 4.

Run `npm run setup` again at any time to change the password, move to a new phone, or get new recovery codes. Then replace all four variables in Coolify and redeploy.

## 4. Add the dashboard to Coolify

Add a **second application** in the same Coolify project, from the same repository and branch as the site.

| Setting | Value |
|---|---|
| Build Pack | Dockerfile |
| Base Directory | `/admin` |
| Dockerfile Location | `/Dockerfile` (inside `/admin`) |
| Ports Exposes | `8787` |
| Domains | `https://admin.<domain>` |
| Persistent Storage | Volume mounted at `/data` (holds the used-code state; tiny) |
| Watch Paths | `admin/**` |

In the **site** application, set **Watch Paths** so dashboard code changes don't rebuild the site, while content commits still do:

```
**
!admin/**
```

### Environment variables (dashboard app)

| Variable | Example | Notes |
|---|---|---|
| `ADMIN_ORIGIN` | `https://admin.tansiftproduction.com` | The dashboard's own address, no trailing slash |
| `SITE_URL` | `https://www.tansiftproduction.com` | Used for the "View site" link and for previews |
| `ADMIN_PASSWORD_HASH` | from `npm run setup` | |
| `ADMIN_TOTP_SECRET` | from `npm run setup` | |
| `ADMIN_RECOVERY_HASHES` | from `npm run setup` | |
| `SESSION_SECRET` | from `npm run setup` | At least 32 characters |
| `GITHUB_TOKEN` | `github_pat_…` | From step 2 |
| `GITHUB_REPO` | `zilyas/tansiftprod` | |
| `GITHUB_BRANCH` | `main` | The branch Coolify deploys the site from |
| `R2_ACCOUNT_ID` | | From step 1 |
| `R2_ACCESS_KEY_ID` | | |
| `R2_SECRET_ACCESS_KEY` | | |
| `R2_BUCKET` | `tansift-media` | |
| `R2_PUBLIC_URL` | `https://media.tansiftproduction.com` | The bucket's custom domain |
| `TRUSTED_PROXY_HOPS` | `1` | `1` behind Coolify's proxy only; `2` if the admin domain is also proxied by Cloudflare (orange cloud) |

Optional variables:

| Variable | Default | Notes |
|---|---|---|
| `R2_JURISDICTION` | empty | `eu` for an EU-jurisdiction bucket |
| `SESSION_VERSION` | `1` | Raise it to sign everyone out |
| `SESSION_IDLE_MINUTES` / `SESSION_MAX_HOURS` | `30` / `12` | |
| `MAX_IMAGE_MB` / `MAX_VIDEO_MB` | `25` / `95` | Cloudflare's proxy refuses uploads over 100 MB on the Free and Pro plans |
| `MAX_VIDEO_SECONDS` | `180` | Longer videos are cut. Put full films on YouTube or Vimeo and paste the link. |
| `IMAGE_WIDTHS` / `IMAGE_QUALITY` | `640,1280,1920` / `78` | |
| `VIDEO_CRF` | `33` | Higher = smaller file, lower quality (VP9 scale 0–63) |
| `VIDEO_MP4_FALLBACK` | `true` | Also make an H.264 MP4 for older iPhones |
| `COOLIFY_DEPLOY_URL` + `COOLIFY_API_TOKEN` | empty | Only if the site does **not** auto-deploy on push. Use the deploy webhook URL from the site app's **Webhooks** page and an API token with deploy permission. |
| `GIT_AUTHOR_NAME` / `GIT_AUTHOR_EMAIL` | `Tansift dashboard` | Shown on content commits |

### Make sure the site rebuilds after each publish

- **Site added through the GitHub App:** auto-deploy on push is on by default. Nothing else is needed.
- **Site added as a public repository:**
  - either add the webhook shown under **Webhooks → GitHub** to the repository (**Settings → Webhooks**, content type `application/json`, the secret Coolify shows, "Just the push event");
  - or set `COOLIFY_DEPLOY_URL` and `COOLIFY_API_TOKEN` above.

## 5. Check it

- `https://admin.<domain>/healthz` returns `ok`.
- Sign in with the password and the 6-digit code.
- Change a word, **Publish**, and check the change appears on the site after the rebuild (about a minute). The commit shows in **Change history**.
- Upload a photo. It appears in **Media library** with its size after conversion.
- Check Coolify's logs. They show `ffmpeg` encoders at start-up only if something is missing: the image build fails early if VP9, Opus or H.264 support is absent.

## Using the dashboard (for the client)

- **Left menu:** each page or collection of the site. Fields show English and French side by side, or one language only with the switch at the top.
- **Lists** (services, projects, journal guides, testimonials, FAQ): use **Add**, **Remove** and the arrows to reorder.
- **Photo and video fields:** **Choose / upload** offers three options:
  - **Upload** a new file. Always fill in "Describe the picture", which is used for accessibility and Google.
  - Pick from the **Library** of earlier uploads.
  - **Paste a link.** Choosing a converted video also fills in its MP4 fallback and poster.
- **Silent videos:** tick **remove the sound** for background loops like the home page hero. The file gets smaller.
- Nothing is live until you press **Publish**. The bar at the bottom shows how many pages have unpublished changes. Add a short note, and it appears in **Change history**.
- **Photo formats:** JPEG, PNG, WebP, GIF, AVIF (up to 25 MB). iPhone HEIC photos: export as JPEG first, or set the iPhone camera to **Most Compatible**.
- **Video formats:** MP4, MOV, WebM, up to 95 MB and 3 minutes. Longer films go on YouTube or Vimeo; paste the link instead.
- **Deleting from the Library** removes the file from R2. Don't delete anything still used on the site.

## Develop and test

```bash
cd admin
npm ci
npm test        # auth, content validation, API flow, image conversion; video tests need ffmpeg on PATH
```

Code map:

| Path | Role |
|---|---|
| `src/server.js` | Routes, auth middleware, publish flow |
| `src/auth/` | scrypt password, TOTP (RFC 6238), signed session cookies, rate limiter |
| `src/content.js` | List of editable files and the shape check that guards every publish |
| `src/github.js` | Reads files, writes one commit per publish (fails safely if someone else pushed in between) |
| `src/r2.js` | Uploads to R2 and keeps `library.json` |
| `src/media/` | Type detection, sharp and ffmpeg conversion, job queue |
| `public/` | The dashboard's pages (plain HTML, CSS and JavaScript, no build step) |
| `scripts/setup.js` | Generates the password hash, 2FA secret and recovery codes |

To make a new field editable, add it to the JSON file in `content/` and to the schema in `src/lib/content.ts`. The dashboard builds its form from the JSON, so no dashboard change is needed. Friendly labels for new keys go in `LABELS` in `public/assets/app.js`.

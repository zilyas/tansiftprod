# Go live: website + dashboard on Coolify

One guide from zero to live, in order. It sets up two Coolify applications from the same GitHub repository:

| App | What it is | Address (example) | Port |
|---|---|---|---|
| **Website** | Static Astro site served by nginx | `https://www.tansiftproduction.com` | 8080 |
| **Dashboard** | Content editor (password + 2FA, R2 uploads) | `https://admin.tansiftproduction.com` | 8787 |

Photos and videos live in **Cloudflare R2** at `https://media.tansiftproduction.com`.

Replace `tansiftproduction.com` with the real domain everywhere below.

---

## Before you start

- [ ] PR merged into `main` (Coolify deploys `main`)
- [ ] A Coolify server (v4) reachable on the internet, with its public IP noted
- [ ] The domain added to **Cloudflare** (needed for the R2 media domain; the free plan is fine)
- [ ] `npm run setup` already done in `admin/`, with the output lines for `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `ADMIN_RECOVERY_HASHES` and `SESSION_SECRET` kept somewhere private (password manager), and the authenticator app scanned

---

## Step 1: DNS records (Cloudflare → your domain → DNS)

| Type | Name | Content | Proxy status |
|---|---|---|---|
| A | `@` | Coolify server IP | DNS only (grey cloud) |
| A | `www` | Coolify server IP | DNS only (grey cloud) |
| A | `admin` | Coolify server IP | DNS only (grey cloud) |

Leave `media` alone: step 2 creates it.

Use **DNS only** at first so Coolify can get its HTTPS certificates without friction. If you later switch `www`/`admin` to **Proxied** (orange cloud), set Cloudflare **SSL/TLS → Full (strict)** and change `TRUSTED_PROXY_HOPS` to `2` on the dashboard app.

## Step 2: Cloudflare R2 bucket for media

1. Cloudflare dashboard → **R2 Object Storage** → **Create bucket**. Name `tansift-media`, location **Automatic**.
2. Open the bucket → **Settings** → **Custom Domains** → **Connect Domain** → `media.tansiftproduction.com` → confirm. Wait until the status shows **Active**.
   - Don't use the `r2.dev` address: it is rate-limited and not meant for live sites.
3. **R2** overview page → **Manage API tokens** → **Create API token**.
   - Permissions: **Object Read & Write**
   - Specify bucket: **only `tansift-media`**
   - Create, then copy the **Access Key ID** and **Secret Access Key** (the secret is shown once).
4. On the R2 overview page, copy your **Account ID**.

## Step 3: GitHub token for the dashboard

GitHub → your avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.

- **Resource owner:** `zilyas`
- **Repository access:** Only select repositories → `zilyas/tansiftprod`
- **Permissions → Repository permissions → Contents:** Read and write
- **Expiration:** 1 year. Add a calendar reminder to renew it.

Copy the token (`github_pat_…`).

## Step 4: Connect GitHub to Coolify (for automatic deploys)

The simplest setup is Coolify's **GitHub App**: every push to `main` (including each **Publish** from the dashboard) rebuilds the site automatically.

Coolify → **Sources** → **+ Add** → **GitHub App** → follow the wizard. Install it on `zilyas/tansiftprod` only.

(If you already created the site app as a *Public Repository*, either recreate it with the GitHub App source, or add a GitHub webhook as explained in the app's **Webhooks** page. See "Automatic deploys without the GitHub App" at the end.)

## Step 5: Website app

Coolify → **Projects** → your project → **+ New** → **Private Repository (with GitHub App)** → choose `zilyas/tansiftprod`, branch `main`.

**Configuration → General**

| Setting | Value |
|---|---|
| Build Pack | **Dockerfile** |
| Base Directory | `/` |
| Dockerfile Location | `/Dockerfile` |
| Ports Exposes | `8080` |
| Domains | `https://www.tansiftproduction.com,https://tansiftproduction.com` |

To send the bare domain to `www`, keep only `https://www.tansiftproduction.com` in Domains and turn on the redirect option in the domain settings of your Coolify version.

**Environment Variables** (tick **Build Variable** on both):

| Key | Value |
|---|---|
| `SITE_URL` | `https://www.tansiftproduction.com` |
| `PUBLIC_SHOW_SAMPLES` | `false` (hides the sample projects; leave it `true` until real projects exist if you prefer the preview) |

**Advanced → Git / Watch Paths** (only rebuild the site when site files change):

```
**
!admin/**
```

**Health check** (optional; the image already has one): path `/healthz`, port `8080`.

Click **Deploy**. When it finishes, open `https://www.tansiftproduction.com`.

## Step 6: Dashboard app

Same project → **+ New** → **Private Repository (with GitHub App)** → `zilyas/tansiftprod`, branch `main`.

**Configuration → General**

| Setting | Value |
|---|---|
| Build Pack | **Dockerfile** |
| Base Directory | `/admin` |
| Dockerfile Location | `/Dockerfile` |
| Ports Exposes | `8787` |
| Domains | `https://admin.tansiftproduction.com` |

**Persistent Storage** → **+ Add** → **Volume Mount**:
- Name: `tansift-admin-data`
- Destination Path: `/data`

Use a *Volume* mount, not a *Directory/bind* mount. The app runs as a non-root user and a bind mount would be owned by root.

**Environment Variables** (these are runtime variables, so leave **Build Variable** unticked). Paste each value yourself; never share them in chat.

| Key | Value |
|---|---|
| `ADMIN_ORIGIN` | `https://admin.tansiftproduction.com` |
| `SITE_URL` | `https://www.tansiftproduction.com` |
| `ADMIN_PASSWORD_HASH` | from `npm run setup` |
| `ADMIN_TOTP_SECRET` | from `npm run setup` |
| `ADMIN_RECOVERY_HASHES` | from `npm run setup` |
| `SESSION_SECRET` | from `npm run setup` |
| `GITHUB_TOKEN` | token from step 3 |
| `GITHUB_REPO` | `zilyas/tansiftprod` |
| `GITHUB_BRANCH` | `main` |
| `R2_ACCOUNT_ID` | from step 2 |
| `R2_ACCESS_KEY_ID` | from step 2 |
| `R2_SECRET_ACCESS_KEY` | from step 2 |
| `R2_BUCKET` | `tansift-media` |
| `R2_PUBLIC_URL` | `https://media.tansiftproduction.com` |
| `TRUSTED_PROXY_HOPS` | `1` (`2` if `admin` is proxied by Cloudflare) |

If your Coolify version shows an **Is Literal** option, tick it on these variables so Coolify never interprets characters inside the values.

**Advanced → Watch Paths** (rebuild only when dashboard code changes, not on every content publish):

```
admin/**
```

Click **Deploy**. The first build takes a few minutes (it installs ffmpeg). The build stops with an error if ffmpeg lacks the VP9, Opus or H.264 encoders, so a finished build means video conversion is available.

## Step 7: Check everything

Website:
- [ ] `https://www.tansiftproduction.com/healthz` returns `ok`
- [ ] `https://www.tansiftproduction.com/robots.txt` ends with your domain's sitemap
- [ ] View page source on the home page: `<link rel="canonical">` shows your domain
- [ ] The Work page shows no "Preview"/sample projects (if `PUBLIC_SHOW_SAMPLES=false`)
- [ ] Try it on a phone, in light and dark mode

Dashboard:
- [ ] `https://admin.tansiftproduction.com/healthz` returns `ok`
- [ ] Sign in with the password, then the 6-digit code
- [ ] Change one word, **Publish**, and add a note → a commit `content: …` appears on `main` in GitHub → the website app starts a new deploy by itself → the change is live about a minute later
- [ ] Upload a photo → it appears in **Media library**, and `https://media.tansiftproduction.com/images/…` opens
- [ ] Upload a short video → it converts to WebM and gets a poster
- [ ] **Change history** lists your publish

If sign-in fails with a correct code, check the server clock (`timedatectl` on the Coolify host should show "System clock synchronized: yes").

## Step 8: After launch

- Submit `https://www.tansiftproduction.com/sitemap-index.xml` in **Google Search Console** and **Bing Webmaster Tools**.
- Create the **Google Business Profile** with the same name, address and phone as the site.
- Give the client the dashboard address, their password, and the 10 recovery codes (printed or in a password manager).
- Optional extra protection: put `admin.tansiftproduction.com` behind **Cloudflare Access** (Zero Trust → Access → Applications) with the client's email.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Dashboard app restarts right after deploy | A required variable is missing. The log line names it ("Missing environment variable …"). |
| Sign-in works but you are sent back to the login page | `ADMIN_ORIGIN` doesn't match the address in the browser exactly (https, no trailing slash), or the site is opened over http. |
| "Too many attempts" | 5 wrong tries from one address lock sign-in for 15 minutes. Wait, or redeploy the dashboard to reset the counter. |
| Publish says "The content changed on GitHub since you opened it" | A commit reached `main` in between. Reload the dashboard and redo the change. |
| Publish works but the site doesn't update | Auto-deploy isn't reaching Coolify. Check the site app's **Deployments** list, the GitHub App installation, and the Watch Paths (`**` then `!admin/**`). |
| Every upload ends with "Conversion failed" | Often R2: keys, bucket name or Account ID wrong, or the token not scoped to this bucket. The dashboard app's log shows the real error. |
| Uploaded image link gives 404 | The custom domain on the bucket isn't Active yet, or `R2_PUBLIC_URL` is wrong. |
| Video upload refused, or the video is cut short | Uploads over 95 MB are refused, and videos are cut at 3 minutes. Put full films on YouTube/Vimeo and paste the link. |
| Build of the site fails after a publish | The content check caught a problem. Coolify keeps the previous version online. Open the failed deployment log (it names the file and field), fix it in the dashboard, and publish again. |

## Automatic deploys without the GitHub App

If the site app uses a public repository URL instead of the GitHub App:

1. In the site app, open **Webhooks** and copy the GitHub webhook URL, then set a secret there.
2. GitHub → repository **Settings** → **Webhooks** → **Add webhook**: paste the URL, content type `application/json`, the same secret, **Just the push event**.

Or set `COOLIFY_DEPLOY_URL` (the site app's deploy webhook) and `COOLIFY_API_TOKEN` (Coolify → **Keys & Tokens** → API token with deploy permission) on the dashboard app. The dashboard then triggers the site deploy itself after each publish.

## Rotating secrets later

| What | How |
|---|---|
| Password, 2FA phone, recovery codes | Run `npm run setup` in `admin/` on your computer, replace the four variables in the dashboard app, redeploy |
| Sign everyone out | Raise `SESSION_VERSION` (1 → 2), redeploy |
| GitHub token | Generate a new one (step 3), replace `GITHUB_TOKEN`, redeploy |
| R2 keys | Create a new token (step 2.3), replace both R2 key variables, redeploy, then delete the old token |

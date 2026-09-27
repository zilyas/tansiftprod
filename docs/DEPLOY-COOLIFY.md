# Deploying to Coolify

The site ships as a Docker image: Node builds the static site, then an unprivileged nginx serves it on port **8080** with caching, gzip, security headers, the custom 404 page and a `/healthz` health check. Coolify's proxy handles HTTPS and the domain.

## One-time setup

1. **Point the domain** (e.g. `tansiftproduction.com` and `www.tansiftproduction.com`) at your Coolify server's IP with an `A` record.
2. In Coolify: **Projects → your project → + New → Public Repository** (or **Private Repository (GitHub App)** if the repo becomes private).
   - Repository: `https://github.com/zilyas/tansiftprod`
   - Branch: `main` once this branch is merged (or `claude/client-website-design-vcn5qk` to preview it now)
   - **Build Pack: Dockerfile**
3. On the new application's **Configuration → General** page:
   - **Ports Exposes:** `8080`
   - **Domains:** `https://www.tansiftproduction.com` (add the bare domain too if you want Coolify to redirect it)
   - Leave **Dockerfile Location** as `/Dockerfile` and **Base Directory** as `/`
4. **Environment Variables:** add
   - `SITE_URL` = `https://www.tansiftproduction.com` (your real domain, no trailing slash)
   - Tick **Is Build Variable?** — the domain is baked into canonical links, the sitemap, `robots.txt` and `llms.txt` at build time.
   - `PUBLIC_SHOW_SAMPLES` = `false` on the live site (also a build variable). This hides the sample projects until real ones are added; the Work page then points visitors to the portfolio archive and Instagram. Leave it unset on a staging copy to preview the layout with samples.
5. **Health Check** (optional, the image already declares one): path `/healthz`, port `8080`.
6. Click **Deploy**.

## After each change

Enable **Automatic Deployment** (Coolify → Configuration → Git) so every push to the deploy branch rebuilds the site. Content published from the dashboard (a commit to `content/*.json`) goes live on the next deploy. Set **Watch Paths** to `**` and `!admin/**` so dashboard code changes don't rebuild the site. The dashboard itself is a second Coolify app: see [DASHBOARD.md](DASHBOARD.md).

## Check the live site

- `https://your-domain/healthz` returns `ok`
- `https://your-domain/robots.txt` ends with your domain's sitemap URL
- View source on the homepage: `<link rel="canonical">` shows your domain
- Submit `https://your-domain/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools

## Test the image locally

```bash
docker build --build-arg SITE_URL=http://localhost:8080 -t tansift-web .
docker run --rm -p 8080:8080 tansift-web
# open http://localhost:8080
```

## Notes

- Large videos: keep the hero loop under ~6 MB. For long films, link to Vimeo or YouTube instead of serving MP4 files from the container.
- If the domain changes, update `SITE_URL` in Coolify and redeploy.

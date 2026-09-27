# Tansift Production — website

Bilingual (English / French) website for Tansift Production, a film, photo and social media content studio in Essaouira, Morocco. Built from Blueprint v2 with [Astro](https://astro.build) as a static site.

## Run it

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev      # local site at http://localhost:4321
npm run build    # production build in dist/
npm run preview  # serve the build
npm run check    # type and template checks
```

**Deploy:** the repo includes a `Dockerfile` for Coolify (nginx on port 8080). Step-by-step guide: [docs/DEPLOY-COOLIFY.md](docs/DEPLOY-COOLIFY.md). The `dist/` folder also works on any static host.

## Where things live

| Path | What it holds |
|------|---------------|
| `content/*.json` | All editable content: contact details, page text (EN/FR), services, projects, journal, testimonials, image and video slots. **Edited through the dashboard.** |
| `src/lib/content.ts` | Schema that checks the JSON at build time (a bad edit fails the build; the live site stays up) |
| `src/data/` | Typed loaders over `content/` used by the pages |
| `admin/` | The content dashboard (password + 2FA, uploads to Cloudflare R2 with WebP/WebM conversion). See [docs/DASHBOARD.md](docs/DASHBOARD.md) |
| `src/i18n/` | Page routes per language and shared interface text |
| `src/views/` | One file per page type, used by both languages |
| `src/pages/` | URL routes (`/` English, `/fr/` French) |
| `src/styles/global.css` | Design tokens from Blueprint v2 (film-stock palette, Barlow Condensed / Barlow / JetBrains Mono) |
| `src/pages/robots.txt.ts`, `src/pages/llms.txt.ts` | Crawler rules and the AI summary file, generated with the site's domain |
| `Dockerfile`, `deploy/nginx.conf` | Production image for Coolify |

## Before launch

Step-by-step deployment of the website and the dashboard: [docs/GO-LIVE.md](docs/GO-LIVE.md).

- [ ] Add real images and videos from the portfolio (see [docs/MEDIA.md](docs/MEDIA.md))
- [ ] Set up the content dashboard ([docs/DASHBOARD.md](docs/DASHBOARD.md))
- [ ] Replace the sample projects in the dashboard's **Projects** page (or build with `PUBLIC_SHOW_SAMPLES=false` to hide them)
- [ ] Add testimonials and client logos in the dashboard's **Testimonials & clients** page
- [ ] Fill in `whatsapp`, `email`, `phone`, `streetAddress` and `foundingYear` in the dashboard's **Contact & settings** page
- [ ] Set the real domain as the `SITE_URL` build variable in Coolify
- [ ] Confirm the story behind the name on the Studio page (dashboard → **Studio**)
- [ ] Add crew names and roles in `src/views/Studio.astro`
- [ ] Confirm whether Tansift holds a Moroccan production licence, and adjust the permit wording on the Shoot in Essaouira page
- [ ] Create a Google Business Profile with the same name, address and phone number

## How the brief form sends

The "Start a project" form has no server. When a visitor finishes it, the site builds a text brief and:

1. opens WhatsApp with the brief pre-filled, if `site.whatsapp` is set;
2. otherwise opens an email, if `site.email` is set;
3. otherwise shows the brief with a copy button and a link to Instagram.

To receive briefs in an inbox instead, connect a form service such as Netlify Forms or Formspree later.

## SEO, GEO and AEO built in

- One primary search phrase per page, with French pages on French URLs and `hreflang` links between them
- Structured data: business profile, services, FAQ, articles and breadcrumbs
- Questions answered on the page in plain text, with FAQ markup
- `sitemap-index.xml`, `robots.txt` allowing search and AI crawlers, and `llms.txt`
- Static HTML that reads without JavaScript, light pages and lazy-loaded media

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
| `src/data/site.ts` | Contact details, Instagram, portfolio link. **Fill in WhatsApp, email and address here.** |
| `src/data/services.ts` | The six services with their EN/FR copy, FAQ and SEO titles |
| `src/data/projects.ts` | Work grid entries (currently samples, see below) |
| `src/data/journal.ts` | Journal guides (permits, light and wind) with sources |
| `src/data/media.ts` | Every image and video slot on the site |
| `src/i18n/` | Page routes per language and shared interface text |
| `src/views/` | One file per page type, used by both languages |
| `src/pages/` | URL routes (`/` English, `/fr/` French) |
| `src/styles/global.css` | Design tokens from Blueprint v2 (film-stock palette, Barlow Condensed / Barlow / JetBrains Mono) |
| `src/pages/robots.txt.ts`, `src/pages/llms.txt.ts` | Crawler rules and the AI summary file, generated with the site's domain |
| `Dockerfile`, `deploy/nginx.conf` | Production image for Coolify |

## Before launch

- [ ] Add real images and videos from the portfolio (see [docs/MEDIA.md](docs/MEDIA.md))
- [ ] Replace the sample projects in `src/data/projects.ts`
- [ ] Fill in `whatsapp`, `email`, `phone`, `streetAddress` and `foundingYear` in `src/data/site.ts`
- [ ] Set the real domain as the `SITE_URL` build variable in Coolify
- [ ] Confirm the story behind the name on the Studio page (`src/views/Studio.astro`)
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

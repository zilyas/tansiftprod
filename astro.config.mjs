// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The public domain, set at build time with the SITE_URL environment
// variable (in Coolify: a build variable). Canonical URLs, hreflang links,
// the sitemap, robots.txt, llms.txt and structured data are built from it.
export const SITE_URL = (process.env.SITE_URL || 'https://www.tansiftproduction.com').replace(/\/+$/, '');

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [
    // French pages use translated slugs, so language alternates are
    // declared with hreflang tags in each page head rather than here.
    // Sample case studies are previews only and stay out of the sitemap.
    sitemap({ filter: (page) => !page.includes('/sample-') }),
  ],
});

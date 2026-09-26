// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: replace with the final domain before launch. Canonical URLs,
// hreflang links, the sitemap and structured data are all built from it.
export const SITE_URL = 'https://www.tansiftproduction.com';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  integrations: [
    // French pages use translated slugs, so language alternates are
    // declared with hreflang tags in each page head rather than here.
    sitemap(),
  ],
});

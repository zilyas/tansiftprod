import type { APIRoute } from 'astro';

// Search engines and AI assistants are welcome: they help people find a
// production crew in Essaouira. Bulk training scrapers are refused.
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href;
  const allowed = [
    'GPTBot',
    'OAI-SearchBot',
    'ClaudeBot',
    'Claude-SearchBot',
    'PerplexityBot',
    'Google-Extended',
    'Applebot-Extended',
  ];
  const body = [
    '# Tansift Production — crawler access policy',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# AI search and assistant crawlers (allowed so answers can cite the site)',
    ...allowed.flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /', '']),
    '# Bulk training scraper',
    'User-agent: Bytespider',
    'Disallow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

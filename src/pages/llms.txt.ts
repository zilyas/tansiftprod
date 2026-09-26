import type { APIRoute } from 'astro';
import { services, serviceUrl } from '../data/services';
import { articles, articleUrl } from '../data/journal';
import { routes } from '../i18n/routes';
import { site as business } from '../data/site';

// Plain-language map of the site for AI assistants (llms.txt convention).
export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const body = `# ${business.name}

> Video production, photography and social media content studio based in Essaouira, Morocco. Tansift makes brand films, Reels and short-form video, video podcasts, photography for brands, hotels and real estate, wedding films and drone footage, and supports visiting productions with local crew, location scouting and permit preparation. Languages: French, English, Darija, Arabic.

## Key pages
- [Home](${u(routes.home.en)}): Who Tansift is and what it makes
- [Shoot in Essaouira](${u(routes.shoot.en)}): Local crew, locations, wind calendar, permits and FAQ for visiting productions
- [Services](${u(routes.services.en)}): All services
- [Work](${u(routes.work.en)}): Selected projects
- [Start a project](${u(routes.contact.en)}): Send a brief

## Services
${services.map((s) => `- [${s.name.en}](${u(serviceUrl(s, 'en'))}): ${s.line.en}`).join('\n')}

## Guides
${articles.map((a) => `- [${a.title.en}](${u(articleUrl(a, 'en'))}): ${a.description.en}`).join('\n')}

## French version
- [Accueil](${u(routes.home.fr)})
- [Tourner à Essaouira](${u(routes.shoot.fr)})
- [Services](${u(routes.services.fr)})

## Contact
- Instagram: ${business.instagram}
- Portfolio archive: ${business.portfolio}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

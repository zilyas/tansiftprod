import type { Lang } from '../i18n/routes';
import { projects as projectsData } from '../lib/content';
import { orPlaceholder } from '../lib/media';

type L<T = string> = Record<Lang, T>;

export type Category = 'social' | 'podcast' | 'photo' | 'brand' | 'weddings';

export const categories: { id: Category; label: L }[] = [
  { id: 'social', label: { en: 'Social content', fr: 'Réseaux sociaux' } },
  { id: 'podcast', label: { en: 'Podcasts', fr: 'Podcasts' } },
  { id: 'photo', label: { en: 'Photography', fr: 'Photographie' } },
  { id: 'brand', label: { en: 'Brand films', fr: 'Films de marque' } },
  { id: 'weddings', label: { en: 'Weddings & events', fr: 'Mariages et événements' } },
];

export interface Project {
  // URL segment for the case study page. Sample slugs start with "sample-"
  // so they are kept out of the sitemap.
  slug: string;
  title: L;
  client: string;
  category: Category;
  place: string; // e.g. "Skala du Port · 07:10"
  summary: L;
  cover: string; // image path in /public
  video?: string; // optional hover or full video URL
  link?: string; // optional external link (Instagram post, Vimeo…)
  year?: string;
  // Case study text. A project gets its own page only when this is filled in.
  story?: {
    brief: L;
    approach: L;
    result: L;
    deliverables: L<string[]>;
    credits?: { role: L; name: string }[];
    gallery?: string[];
  };
  // Sample entries are labelled "Sample" on the site. Replace them with real
  // projects from the portfolio and delete the flag.
  sample?: boolean;
}

// Sample projects preview the layout. Set PUBLIC_SHOW_SAMPLES=false (a build
// variable in Coolify) to hide them on the live site until real work is added.
export const showSamples = import.meta.env.PUBLIC_SHOW_SAMPLES !== 'false';

// Projects, edited in the dashboard (content/projects.json).
export const projects: Project[] = projectsData.map((p) => ({ ...p, cover: orPlaceholder(p.cover) }));

export const visibleProjects = projects.filter((p) => showSamples || !p.sample);

export function projectUrl(p: Project, lang: Lang): string {
  return lang === 'en' ? `/work/${p.slug}/` : `/fr/realisations/${p.slug}/`;
}

import type { Lang } from '../i18n/routes';
import { placeholder } from './media';

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

// TODO: replace these samples with real projects from
// https://tansiftproduction66f.myportfolio.com/work (see docs/MEDIA.md).
export const projects: Project[] = [
  {
    slug: 'sample-riad-season-opener',
    title: { en: 'Riad season opener', fr: 'Ouverture de saison d’un riad' },
    client: 'Sample client',
    category: 'social',
    place: 'Medina · 08:30',
    summary: {
      en: 'A month of Reels and photos from one shoot day.',
      fr: 'Un mois de Reels et de photos en une journée de tournage.',
    },
    cover: placeholder('social'),
    year: '2026',
    story: {
      brief: {
        en: 'Sample text. The riad wanted a steady flow of posts for the new season without organising a shoot every week.',
        fr: 'Texte d’exemple. Le riad voulait publier régulièrement pendant la nouvelle saison sans organiser un tournage chaque semaine.',
      },
      approach: {
        en: 'Sample text. One planned shoot day: rooms at 08:30 in soft light, breakfast on the terrace, the medina walk to the port, and the rooftop at sunset.',
        fr: 'Texte d’exemple. Une journée de tournage planifiée : les chambres à 8 h 30 en lumière douce, le petit-déjeuner en terrasse, la balade de la médina au port et le toit au coucher du soleil.',
      },
      result: {
        en: 'Sample text. Replace with the real outcome, for example the number of posts delivered or bookings after launch.',
        fr: 'Texte d’exemple. Remplacez par le résultat réel, par exemple le nombre de publications livrées ou les réservations après le lancement.',
      },
      deliverables: {
        en: ['10 vertical Reels with subtitles', '45 edited photos', 'A posting calendar for 4 weeks'],
        fr: ['10 Reels verticaux sous-titrés', '45 photos retouchées', 'Un calendrier de publication sur 4 semaines'],
      },
      credits: [
        { role: { en: 'Direction', fr: 'Réalisation' }, name: 'Tansift Production' },
      ],
      gallery: [placeholder('journey'), placeholder('problem')],
    },
    sample: true,
  },
  {
    slug: 'sample-conversations-by-the-ocean',
    title: { en: 'Conversations by the ocean', fr: 'Conversations face à l’océan' },
    client: 'Sample client',
    category: 'podcast',
    place: 'Terrace · 10:00',
    summary: {
      en: 'Three-camera video podcast with vertical clips.',
      fr: 'Podcast vidéo à trois caméras avec extraits verticaux.',
    },
    cover: placeholder('podcast'),
    sample: true,
  },
  {
    slug: 'sample-blue-boats-white-walls',
    title: { en: 'Blue boats, white walls', fr: 'Barques bleues, murs blancs' },
    client: 'Sample client',
    category: 'photo',
    place: 'Skala du Port · 07:10',
    summary: {
      en: 'Product and lifestyle photography around the port.',
      fr: 'Photographie produit et lifestyle autour du port.',
    },
    cover: placeholder('photo'),
    sample: true,
  },
  {
    slug: 'sample-made-in-mogador',
    title: { en: 'Made in Mogador', fr: 'Fait à Mogador' },
    client: 'Sample client',
    category: 'brand',
    place: 'Workshop · 09:40',
    summary: {
      en: 'A brand film following an artisan from raw material to finished piece.',
      fr: 'Un film de marque qui suit un artisan de la matière brute à la pièce finie.',
    },
    cover: placeholder('brand'),
    sample: true,
  },
  {
    slug: 'sample-vows-on-the-ramparts',
    title: { en: 'Vows on the ramparts', fr: 'Des vœux sur les remparts' },
    client: 'Sample client',
    category: 'weddings',
    place: 'Skala de la Ville · 18:50',
    summary: {
      en: 'Highlight film and photos of an intimate ceremony.',
      fr: 'Film court et photos d’une cérémonie intime.',
    },
    cover: placeholder('weddings'),
    sample: true,
  },
  {
    slug: 'sample-wind-season',
    title: { en: 'Wind season', fr: 'La saison du vent' },
    client: 'Sample client',
    category: 'brand',
    place: 'Sidi Kaouki · 07:00',
    summary: {
      en: 'Surf school campaign shot before the afternoon wind.',
      fr: 'Campagne pour une école de surf, tournée avant le vent de l’après-midi.',
    },
    cover: placeholder('drone'),
    sample: true,
  },
];

export const visibleProjects = projects.filter((p) => showSamples || !p.sample);

export function projectUrl(p: Project, lang: Lang): string {
  return lang === 'en' ? `/work/${p.slug}/` : `/fr/realisations/${p.slug}/`;
}

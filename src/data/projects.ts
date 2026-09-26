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
  title: L;
  client: string;
  category: Category;
  place: string; // e.g. "Skala du Port · 07:10"
  summary: L;
  cover: string; // image path in /public
  video?: string; // optional hover or full video URL
  link?: string; // optional external link (Instagram post, Vimeo…)
  // Sample entries are labelled "Sample" on the site. Replace them with real
  // projects from the portfolio and delete the flag.
  sample?: boolean;
}

// TODO: replace these samples with real projects from
// https://tansiftproduction66f.myportfolio.com/work (see docs/MEDIA.md).
export const projects: Project[] = [
  {
    title: { en: 'Riad season opener', fr: 'Ouverture de saison d’un riad' },
    client: 'Sample client',
    category: 'social',
    place: 'Medina · 08:30',
    summary: {
      en: 'A month of Reels and photos from one shoot day.',
      fr: 'Un mois de Reels et de photos en une journée de tournage.',
    },
    cover: placeholder('social'),
    sample: true,
  },
  {
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

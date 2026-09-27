// Every fixed image and video slot on the site (hero, chapters, studio),
// edited in the dashboard (content/media.json). Values are site paths,
// R2 URLs or external links.
import { media } from '../lib/content';

export interface MediaSlot {
  src: string;
  alt: { en: string; fr: string };
  width: number;
  height: number;
  placeholder?: boolean;
}

export const heroReel = media.heroReel;
export const chapterMedia = media.chapters;
export const studioMedia = media.studio;

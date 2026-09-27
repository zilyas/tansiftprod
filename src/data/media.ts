// Every fixed image and video slot on the site (hero, chapters, studio),
// edited in the dashboard (content/media.json). Values are site paths,
// R2 URLs or external links.
import { media } from '../lib/content';
import { orPlaceholder } from '../lib/media';

export interface MediaSlot {
  src: string;
  alt: { en: string; fr: string };
  width: number;
  height: number;
  placeholder?: boolean;
}

const filled = <T extends { src: string }>(slot: T): T => ({ ...slot, src: orPlaceholder(slot.src) });

export const heroReel = { ...media.heroReel, poster: filled(media.heroReel.poster) };
export const chapterMedia = { problem: filled(media.chapters.problem), journey: filled(media.chapters.journey) };
export const studioMedia = { team: filled(media.studio.team) };

// Every image and video slot on the site, in one place.
//
// Slots currently use generated preview scenes from /public/media/preview/
// (illustrated film stills made for layout and motion testing). To swap in a
// real file from the Tansift portfolio, drop it into /public/media/, change
// its `src` below and remove `placeholder: true` (see docs/MEDIA.md).

export interface MediaSlot {
  src: string;
  alt: { en: string; fr: string };
  width: number;
  height: number;
  placeholder?: boolean;
}

const ph = (name: string) => `/media/placeholders/${name}.svg`;
const pv = (name: string) => `/media/preview/${name}.webp`;

export const heroReel = {
  // Short silent loop for the homepage hero (12–15 s, H.264 MP4, under ~6 MB).
  // Leave empty to show the poster only.
  video: '/media/preview/hero-loop.webm',
  // The full showreel with sound, opened by "Watch the reel".
  // Can be a local MP4 or a Vimeo/YouTube link.
  fullReelUrl: '',
  poster: {
    src: pv('hero-poster'),
    alt: {
      en: 'Essaouira ramparts at golden hour, framed for the Tansift showreel',
      fr: 'Les remparts d’Essaouira à l’heure dorée, cadrés pour le showreel Tansift',
    },
    width: 1920,
    height: 804,
    placeholder: true,
  } satisfies MediaSlot,
};

export const chapterMedia = {
  problem: {
    src: pv('chapter-port'),
    alt: {
      en: 'Blue fishing boats in Essaouira port',
      fr: 'Barques bleues au port d’Essaouira',
    },
    width: 1600,
    height: 900,
    placeholder: true,
  },
  journey: {
    src: pv('chapter-crew'),
    alt: {
      en: 'Crew setting up a shot on the beach at dawn',
      fr: 'L’équipe installe un plan sur la plage à l’aube',
    },
    width: 1600,
    height: 900,
    placeholder: true,
  },
} satisfies Record<string, MediaSlot>;

export const studioMedia = {
  team: {
    src: pv('studio-team'),
    alt: {
      en: 'The Tansift crew in Essaouira',
      fr: 'L’équipe Tansift à Essaouira',
    },
    width: 1600,
    height: 1000,
    placeholder: true,
  },
} satisfies Record<string, MediaSlot>;

export const placeholder = ph;
export const preview = pv;

// Preview image per service and project category.
export const categoryImage = {
  social: pv('service-social'),
  podcast: pv('service-podcast'),
  photo: pv('service-photo'),
  brand: pv('service-brand'),
  weddings: pv('service-weddings'),
  drone: pv('service-drone'),
} as const;

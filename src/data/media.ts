// Every image and video slot on the site, in one place.
//
// Each slot points at a placeholder in /public/media/placeholders/ until the
// real file from the Tansift portfolio is added. To swap one in, drop the file
// into /public/media/ and change its `src` below (see docs/MEDIA.md).

export interface MediaSlot {
  src: string;
  alt: { en: string; fr: string };
  width: number;
  height: number;
  placeholder?: boolean;
}

const ph = (name: string) => `/media/placeholders/${name}.svg`;

export const heroReel = {
  // Short silent loop for the homepage hero (12–15 s, H.264 MP4, under ~6 MB).
  // Leave empty to show the poster only.
  video: '',
  // The full showreel with sound, opened by "Watch the reel".
  // Can be a local MP4 or a Vimeo/YouTube link.
  fullReelUrl: '',
  poster: {
    src: ph('hero'),
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
    src: ph('problem'),
    alt: {
      en: 'Blue fishing boats in Essaouira port',
      fr: 'Barques bleues au port d’Essaouira',
    },
    width: 1600,
    height: 900,
    placeholder: true,
  },
  journey: {
    src: ph('journey'),
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
    src: ph('team'),
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

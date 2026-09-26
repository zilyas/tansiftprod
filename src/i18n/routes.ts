export const locales = ['en', 'fr'] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = 'en';

// Every page key maps to its path in each language. French pages use
// French slugs so each language version can rank for its own searches.
export const routes = {
  home: { en: '/', fr: '/fr/' },
  work: { en: '/work/', fr: '/fr/realisations/' },
  services: { en: '/services/', fr: '/fr/services/' },
  shoot: { en: '/shoot-in-essaouira/', fr: '/fr/tourner-a-essaouira/' },
  studio: { en: '/studio/', fr: '/fr/studio/' },
  journal: { en: '/journal/', fr: '/fr/journal/' },
  contact: { en: '/start-a-project/', fr: '/fr/demarrer-un-projet/' },
} as const;

export type RouteKey = keyof typeof routes;

export function path(key: RouteKey, lang: Lang): string {
  return routes[key][lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'fr' : 'en';
}

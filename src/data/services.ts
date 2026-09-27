import type { Lang } from '../i18n/routes';
import { services as servicesData } from '../lib/content';
import { orPlaceholder } from '../lib/media';

type L<T = string> = Record<Lang, T>;

// Services, edited in the dashboard (content/services.json).
export interface Service {
  id: string;
  slug: L;
  name: L;
  // Short line for cards.
  line: L;
  // Page title and meta description (SEO).
  title: L;
  description: L;
  // Answer-first intro, 40–60 words.
  intro: L;
  includes: L<string[]>;
  idealFor: L<string[]>;
  faq: L<{ q: string; a: string }[]>;
  image: string;
}

export const services: Service[] = servicesData.map((s) => ({ ...s, image: orPlaceholder(s.image) }));

export function serviceUrl(s: Service, lang: Lang): string {
  return lang === 'en' ? `/services/${s.slug.en}/` : `/fr/services/${s.slug.fr}/`;
}

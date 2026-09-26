import type { Lang } from '../i18n/routes';

// Social proof. Sections using these lists only appear once they have entries.

export interface Testimonial {
  quote: Record<Lang, string>;
  name: string;
  role: Record<Lang, string>; // e.g. "Owner, Riad X"
  photo?: string;
}

// TODO: add real quotes with the client's permission.
export const testimonials: Testimonial[] = [];

export interface Client {
  name: string;
  logo?: string; // SVG or PNG in /public/media/clients/
  url?: string;
}

// TODO: add clients who agreed to be listed.
export const clients: Client[] = [];

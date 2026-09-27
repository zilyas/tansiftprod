import type { Lang } from '../i18n/routes';
import { proof } from '../lib/content';

// Social proof, edited in the dashboard (content/proof.json). Sections using
// these lists only appear once they have entries.

export interface Testimonial {
  quote: Record<Lang, string>;
  name: string;
  role: Record<Lang, string>;
  photo?: string;
}

export interface Client {
  name: string;
  logo?: string;
  url?: string;
}

export const testimonials: Testimonial[] = proof.testimonials;
export const clients: Client[] = proof.clients;

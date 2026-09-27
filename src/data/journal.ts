import type { Lang } from '../i18n/routes';
import { journal } from '../lib/content';

type L<T = string> = Record<Lang, T>;

// Journal guides, edited in the dashboard (content/journal.json).
export interface Article {
  id: string;
  slug: L;
  title: L;
  description: L;
  // Short answer at the top of the article, for readers and AI assistants.
  summary: L;
  published: string; // ISO date
  updated: string;
  sections: L<{ heading: string; body: string[] }[]>;
  sources: { label: string; url: string }[];
}

export const articles: Article[] = journal;

export function articleUrl(a: Article, lang: Lang): string {
  return lang === 'en' ? `/journal/${a.slug.en}/` : `/fr/journal/${a.slug.fr}/`;
}

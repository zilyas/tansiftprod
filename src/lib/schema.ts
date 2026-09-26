// Structured data (schema.org JSON-LD) builders shared by the pages.

const SITE = 'https://www.tansiftproduction.com';

export function abs(site: URL | undefined, p: string): string {
  return new URL(p, site ?? SITE).href;
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function breadcrumbSchema(site: URL | undefined, crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(site, c.path),
    })),
  };
}

export function serviceSchema(site: URL | undefined, s: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.description,
    url: abs(site, s.path),
    provider: { '@id': abs(site, '/#organization') },
    areaServed: { '@type': 'City', name: 'Essaouira' },
  };
}

export function articleSchema(
  site: URL | undefined,
  a: { title: string; description: string; path: string; published: string; updated: string; lang: string },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    inLanguage: a.lang,
    datePublished: a.published,
    dateModified: a.updated,
    mainEntityOfPage: abs(site, a.path),
    author: { '@id': abs(site, '/#organization') },
    publisher: { '@id': abs(site, '/#organization') },
  };
}

// Loads the editable content from /content/*.json and validates it at build
// time. The dashboard edits these files; if a saved file does not match the
// shape below, the build fails with a clear message instead of shipping a
// broken page.
import { z } from 'astro/zod';

import settingsJson from '../../content/settings.json';
import mediaJson from '../../content/media.json';
import servicesJson from '../../content/services.json';
import projectsJson from '../../content/projects.json';
import journalJson from '../../content/journal.json';
import proofJson from '../../content/proof.json';
import homeJson from '../../content/pages/home.json';
import shootJson from '../../content/pages/shoot.json';
import studioJson from '../../content/pages/studio.json';

// A text field in both languages.
const L = z.object({ en: z.string(), fr: z.string() });
const LList = z.object({ en: z.array(z.string()), fr: z.array(z.string()) });
const QA = z.object({ q: z.string(), a: z.string() });

// A media reference: a site path (/media/...), an R2 URL or an external link.
const MediaUrl = z.string().refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), {
  message: 'must be empty, a /path or an https:// link',
});

const Slot = z.object({
  src: MediaUrl,
  alt: L,
  width: z.number(),
  height: z.number(),
  placeholder: z.boolean().optional(),
});

function load<T extends z.ZodTypeAny>(name: string, schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`content/${name} is not valid:\n${issues}`);
  }
  return result.data;
}

export const settings = load(
  'settings.json',
  z.object({
    name: z.string(),
    city: z.string(),
    region: z.string(),
    country: z.string(),
    geo: z.object({ lat: z.number(), lng: z.number() }),
    whatsapp: z.string(),
    email: z.string(),
    phone: z.string(),
    streetAddress: z.string(),
    foundingYear: z.string(),
    instagram: z.string(),
    instagramHandle: z.string(),
    portfolio: z.string(),
  }),
  settingsJson,
);

export const media = load(
  'media.json',
  z.object({
    heroReel: z.object({ video: MediaUrl, videoFallback: MediaUrl, fullReelUrl: z.string(), poster: Slot }),
    chapters: z.object({ problem: Slot, journey: Slot }),
    studio: z.object({ team: Slot }),
  }),
  mediaJson,
);

export const services = load(
  'services.json',
  z.array(
    z.object({
      id: z.string(),
      slug: L,
      name: L,
      line: L,
      title: L,
      description: L,
      intro: L,
      includes: LList,
      idealFor: LList,
      faq: z.object({ en: z.array(QA), fr: z.array(QA) }),
      image: MediaUrl,
    }),
  ),
  servicesJson,
);

export const projects = load(
  'projects.json',
  z.array(
    z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/, 'use lowercase letters, numbers and hyphens'),
      title: L,
      client: z.string(),
      category: z.enum(['social', 'podcast', 'photo', 'brand', 'weddings']),
      place: z.string(),
      summary: L,
      cover: MediaUrl,
      video: MediaUrl.optional(),
      link: z.string().optional(),
      year: z.string().optional(),
      story: z
        .object({
          brief: L,
          approach: L,
          result: L,
          deliverables: LList,
          credits: z.array(z.object({ role: L, name: z.string() })).optional(),
          gallery: z.array(MediaUrl).optional(),
        })
        .optional(),
      sample: z.boolean().optional(),
    }),
  ),
  projectsJson,
);

const Section = z.object({ heading: z.string(), body: z.array(z.string()) });
export const journal = load(
  'journal.json',
  z.array(
    z.object({
      id: z.string(),
      slug: L,
      title: L,
      description: L,
      summary: L,
      published: z.string(),
      updated: z.string(),
      sections: z.object({ en: z.array(Section), fr: z.array(Section) }),
      sources: z.array(z.object({ label: z.string(), url: z.string() })),
    }),
  ),
  journalJson,
);

export const proof = load(
  'proof.json',
  z.object({
    testimonials: z.array(z.object({ quote: L, name: z.string(), role: L, photo: MediaUrl.optional() })),
    clients: z.array(z.object({ name: z.string(), logo: MediaUrl.optional(), url: z.string().optional() })),
  }),
  proofJson,
);

// Page copy keeps its per-language shape ({ en: {...}, fr: {...} }).
const Page = z.object({ en: z.record(z.string(), z.any()), fr: z.record(z.string(), z.any()) });
// Typed from the JSON itself so views get field names and array types.
export const pages = {
  home: load('pages/home.json', Page, homeJson) as typeof homeJson,
  shoot: load('pages/shoot.json', Page, shootJson) as typeof shootJson,
  studio: load('pages/studio.json', Page, studioJson) as typeof studioJson,
};

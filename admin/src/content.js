// Which content files the dashboard may edit, and a structural check so a save
// cannot change the JSON shape the site expects. The site's build validates the
// same files again (src/lib/content.ts); if a build ever fails, Coolify keeps
// the previous version online.

export const FILES = [
  { id: 'settings', path: 'content/settings.json', label: 'Contact & settings', group: 'Site' },
  { id: 'home', path: 'content/pages/home.json', label: 'Home page', group: 'Pages' },
  { id: 'shoot', path: 'content/pages/shoot.json', label: 'Shoot in Essaouira', group: 'Pages' },
  { id: 'studio', path: 'content/pages/studio.json', label: 'Studio', group: 'Pages' },
  { id: 'media', path: 'content/media.json', label: 'Hero & page images', group: 'Media' },
  { id: 'services', path: 'content/services.json', label: 'Services', group: 'Collections' },
  { id: 'projects', path: 'content/projects.json', label: 'Projects', group: 'Collections' },
  { id: 'journal', path: 'content/journal.json', label: 'Journal guides', group: 'Collections' },
  { id: 'proof', path: 'content/proof.json', label: 'Testimonials & clients', group: 'Collections' },
];

export const fileById = (id) => FILES.find((f) => f.id === id);

const L = { en: '', fr: '' };

// Blank items used by "Add" buttons, and to know the shape of lists that are
// currently empty. Keys are paths inside the file ('' = the file is the list).
export const TEMPLATES = {
  proof: {
    testimonials: { quote: L, name: '', role: L, photo: '' },
    clients: { name: '', logo: '', url: '' },
  },
  projects: {
    '': {
      slug: 'new-project',
      title: L,
      client: '',
      category: 'social',
      place: '',
      summary: L,
      cover: '',
      video: '',
      link: '',
      year: '',
      story: {
        brief: L,
        approach: L,
        result: L,
        deliverables: { en: [], fr: [] },
        credits: [{ role: L, name: '' }],
        gallery: [],
      },
      sample: false,
    },
  },
  services: {
    '': {
      id: 'new-service',
      slug: { en: 'new-service', fr: 'nouveau-service' },
      name: L,
      line: L,
      title: L,
      description: L,
      intro: L,
      includes: { en: [], fr: [] },
      idealFor: { en: [], fr: [] },
      faq: { en: [{ q: '', a: '' }], fr: [{ q: '', a: '' }] },
      image: '',
    },
  },
  journal: {
    '': {
      id: 'new-guide',
      slug: { en: 'new-guide', fr: 'nouveau-guide' },
      title: L,
      description: L,
      summary: L,
      published: '',
      updated: '',
      sections: { en: [{ heading: '', body: [''] }], fr: [{ heading: '', body: [''] }] },
      sources: [{ label: '', url: '' }],
    },
  },
};

/** Puts template items into empty lists so their shape is known. */
function withTemplates(value, templates = {}) {
  const copy = structuredClone(value);
  for (const [path, item] of Object.entries(templates)) {
    const parts = path ? path.split('.') : [];
    let parent = null;
    let target = copy;
    for (const p of parts) {
      parent = target;
      target = target?.[p];
    }
    if (Array.isArray(target)) {
      if (target.length === 0) {
        if (parent) parent[parts[parts.length - 1]] = [item];
        else return [item];
      } else {
        target.push(item);
      }
    }
  }
  return copy;
}

// Keys whose string values are media references (image or video).
export const MEDIA_KEYS = new Set(['src', 'image', 'cover', 'video', 'videoFallback', 'poster', 'photo', 'logo', 'gallery']);

const MAX_STRING = 20_000;
const MAX_BYTES = 900_000;

const kind = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

/**
 * Infers the allowed shape from the current file. Array items are merged so
 * that every key seen in any item is allowed (optional fields in projects).
 */
export function inferShape(value) {
  const k = kind(value);
  if (k === 'array') {
    let item = null;
    for (const v of value) item = item ? mergeShapes(item, inferShape(v)) : inferShape(v);
    return { kind: 'array', item };
  }
  if (k === 'object') {
    return { kind: 'object', keys: Object.fromEntries(Object.entries(value).map(([key, v]) => [key, inferShape(v)])) };
  }
  return { kind: k };
}

function mergeShapes(a, b) {
  if (a.kind !== b.kind) return a;
  if (a.kind === 'object') {
    const keys = { ...a.keys };
    for (const [key, s] of Object.entries(b.keys)) keys[key] = keys[key] ? mergeShapes(keys[key], s) : s;
    return { kind: 'object', keys };
  }
  if (a.kind === 'array') return { kind: 'array', item: a.item && b.item ? mergeShapes(a.item, b.item) : a.item ?? b.item };
  return a;
}

function isMediaValue(v) {
  return v === '' || v.startsWith('/') || /^https:\/\/[^\s]+$/.test(v);
}

/**
 * Returns a list of problems (empty when the value fits the shape).
 * New keys are refused; missing keys are allowed (optional fields).
 */
export function checkShape(value, shape, path = '', parentKey = '') {
  const problems = [];
  const k = kind(value);
  const where = path || '(root)';
  if (!shape) return problems;
  if (shape.kind !== k) {
    problems.push(`${where}: expected ${shape.kind}, got ${k}`);
    return problems;
  }
  if (k === 'string') {
    if (value.length > MAX_STRING) problems.push(`${where}: text is too long`);
    if (MEDIA_KEYS.has(parentKey) && !isMediaValue(value)) problems.push(`${where}: media must be a /path or an https:// link`);
  } else if (k === 'object') {
    for (const [key, v] of Object.entries(value)) {
      if (!shape.keys[key]) problems.push(`${path ? path + '.' : ''}${key}: unknown field`);
      else problems.push(...checkShape(v, shape.keys[key], `${path ? path + '.' : ''}${key}`, key));
    }
  } else if (k === 'array') {
    value.forEach((v, i) => problems.push(...checkShape(v, shape.item, `${where}[${i}]`, parentKey)));
  }
  return problems;
}

export function validateContent(nextValue, currentValue, templates) {
  const text = JSON.stringify(nextValue, null, 2) + '\n';
  if (Buffer.byteLength(text) > MAX_BYTES) return { ok: false, problems: ['File is too large'] };
  const problems = checkShape(nextValue, inferShape(withTemplates(currentValue, templates)));
  return { ok: problems.length === 0, problems, text };
}

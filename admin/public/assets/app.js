// Tansift dashboard front end. Builds editing forms from each JSON content file,
// keeps unsaved edits in memory, and publishes them as one commit.
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
};

const state = {
  me: null,
  files: new Map(), // id → { value, original, head, label }
  current: null, // file id or 'library' or 'history'
  lang: 'both',
  library: null,
};

// ---------- API ----------
async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(body !== undefined && !(body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' && state.me ? { 'X-CSRF-Token': state.me.csrf } : {}),
      ...headers,
    },
    body: body === undefined || body instanceof Blob ? body : JSON.stringify(body),
  });
  if (res.status === 401) {
    location.replace('/login');
    throw new Error('Signed out');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toast(message, kind = 'ok', link) {
  const t = el('div', { class: `toast toast--${kind}`, role: kind === 'error' ? 'alert' : 'status' }, message);
  if (link) t.append(' ', el('a', { href: link.href, target: '_blank', rel: 'noopener', text: link.text }));
  $('#toasts').append(t);
  setTimeout(() => t.remove(), kind === 'error' ? 9000 : 6000);
}

// ---------- Labels ----------
const LABELS = {
  h1: 'Main title', lede: 'Intro text', eyebrow: 'Small label above the title', title: 'Title', description: 'Search result description (Google)',
  name: 'Name', line: 'One-line summary', intro: 'Intro paragraph', includes: "What's included", idealFor: 'Ideal for',
  faq: 'Questions & answers', q: 'Question', a: 'Answer', image: 'Image', cover: 'Cover image', video: 'Video', videoFallback: 'Video fallback (MP4)',
  fullReelUrl: 'Full showreel link (YouTube, Vimeo or file)', poster: 'Poster image', src: 'Image', alt: 'Image description (accessibility)',
  slug: 'Web address (URL slug)', summary: 'Short summary', story: 'Case study', brief: 'The brief', approach: 'The approach', result: 'The result',
  deliverables: 'Delivered', credits: 'Credits', role: 'Role', gallery: 'Gallery', sample: 'Sample (hide on the live site)', placeholder: 'Show "Preview" label',
  client: 'Client', category: 'Category', place: 'Place and hour (e.g. Skala du Port · 07:10)', year: 'Year', link: 'External link (Instagram post, Vimeo…)',
  whatsapp: 'WhatsApp number (international, digits only, e.g. 212600000000)', email: 'Email', phone: 'Phone', streetAddress: 'Street address',
  foundingYear: 'Year founded', instagram: 'Instagram link', instagramHandle: 'Instagram handle', portfolio: 'Portfolio link',
  testimonials: 'Testimonials', clients: 'Clients', quote: 'Quote', photo: 'Photo', logo: 'Logo', url: 'Link',
  heroReel: 'Home page hero', chapters: 'Home page images', studio: 'Studio page', problem: 'Chapter 1 image', journey: 'Chapter 2 image', team: 'Team photo',
  published: 'Published (YYYY-MM-DD)', updated: 'Updated (YYYY-MM-DD)', sections: 'Sections', heading: 'Heading', body: 'Paragraphs', sources: 'Sources', label: 'Label',
  steps: 'Steps', why: 'Reasons', k: 'Title', v: 'Text', time: 'Timing', text: 'Text', locations: 'Locations', note: 'Note', provide: 'What we provide', how: 'How we work',
};
const humanize = (key) =>
  LABELS[key] ?? String(key).replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

const LONG_KEYS = new Set(['lede', 'intro', 'description', 'summary', 'a', 'quote', 'brief', 'approach', 'result', 'text', 'line', 'note', 'v', 'body', 'ch1Body', 'ch3Body', 'screen', 'name', 'lede', 'windNote']);
const MEDIA_KEYS = new Set(['src', 'image', 'cover', 'video', 'videoFallback', 'poster', 'photo', 'logo', 'gallery']);
const HIDDEN_KEYS = new Set(['width', 'height', 'geo', 'id']);
const ENUMS = { category: ['social', 'podcast', 'photo', 'brand', 'weddings'] };

// ---------- Value helpers ----------
const getAt = (obj, path) => path.reduce((o, k) => (o == null ? o : o[k]), obj);
function setAt(obj, path, value) {
  const last = path[path.length - 1];
  const parent = getAt(obj, path.slice(0, -1));
  parent[last] = value;
}
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isPair = (v) => isObj(v) && Object.keys(v).length === 2 && 'en' in v && 'fr' in v;

function blankLike(v) {
  if (Array.isArray(v)) return [];
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  return '';
}

function dirtyIds() {
  return [...state.files].filter(([, f]) => JSON.stringify(f.value) !== JSON.stringify(f.original)).map(([id]) => id);
}

function refreshDirty() {
  const ids = dirtyIds();
  $('#publishbar').hidden = ids.length === 0;
  $('#dirty-count').textContent = ids.length ? `${ids.length} page${ids.length > 1 ? 's' : ''} with unpublished changes` : '';
  document.querySelectorAll('.nav-item').forEach((b) => {
    const dot = b.querySelector('.dot');
    if (dot) dot.hidden = !ids.includes(b.dataset.id);
  });
}

// ---------- Field renderers ----------
function onChange(fileId, path, value) {
  setAt(state.files.get(fileId).value, path, value);
  refreshDirty();
}

let uid = 0;
const nextId = () => `f${++uid}`;

function textField(fileId, path, key, value, lang) {
  const id = nextId();
  const long = LONG_KEYS.has(key) || value.length > 90;
  const input = long
    ? el('textarea', { id, rows: Math.min(8, Math.max(3, Math.ceil(value.length / 80))) })
    : el('input', { id, type: 'text' });
  input.value = value;
  input.addEventListener('input', () => onChange(fileId, path, input.value));
  const label = el('label', { for: id }, lang ? el('span', { class: 'lang-tag', text: lang.toUpperCase() }) : null, lang ? '' : humanize(key));
  return el('div', { class: 'field', 'data-lang': lang || null }, label, input);
}

function enumField(fileId, path, key, value) {
  const id = nextId();
  const select = el('select', { id }, ...ENUMS[key].map((o) => el('option', { value: o, text: o, selected: o === value })));
  select.addEventListener('change', () => onChange(fileId, path, select.value));
  return el('div', { class: 'field' }, el('label', { for: id, text: humanize(key) }), select);
}

function boolField(fileId, path, key, value) {
  const input = el('input', { type: 'checkbox' });
  input.checked = value;
  input.addEventListener('change', () => onChange(fileId, path, input.checked));
  return el('label', { class: 'check' }, input, humanize(key));
}

function numberField(fileId, path, key, value) {
  const id = nextId();
  const input = el('input', { id, type: 'number', step: 'any' });
  input.value = value;
  input.addEventListener('input', () => onChange(fileId, path, Number(input.value)));
  return el('div', { class: 'field' }, el('label', { for: id, text: humanize(key) }), input);
}

const isVideoUrl = (u) => /\.(webm|mp4|mov)(\?|$)/i.test(u);
const isEmbed = (u) => /youtu\.?be|vimeo\.com/i.test(u);

// Site-relative paths (/media/…) live on the website, not on the dashboard.
const previewUrl = (u) => (u.startsWith('/') && state.me?.siteUrl ? state.me.siteUrl + u : u);

function thumbFor(value) {
  const box = el('div', { class: 'thumb' });
  const url = value && previewUrl(value);
  if (!url) box.textContent = 'No media';
  else if (isEmbed(url)) box.textContent = 'YouTube / Vimeo';
  else if (isVideoUrl(url)) box.append(el('video', { src: url, muted: true, preload: 'metadata', playsinline: true }));
  else box.append(el('img', { src: url, alt: '', loading: 'lazy' }));
  return box;
}

function mediaField(fileId, path, key, value) {
  const id = nextId();
  const wrap = el('div', { class: 'field' });
  const input = el('input', { id, type: 'url', placeholder: 'https://… or choose / upload' });
  input.value = value;
  let thumb = thumbFor(value);
  const update = (v, meta) => {
    input.value = v;
    onChange(fileId, path, v);
    const t = thumbFor(v);
    thumb.replaceWith(t);
    thumb = t;
    // Keep the image size and alt text next to it in sync when available.
    if (meta && isObj(getAt(state.files.get(fileId).value, path.slice(0, -1)))) {
      const parent = getAt(state.files.get(fileId).value, path.slice(0, -1));
      if (typeof parent.width === 'number' && meta.width) parent.width = meta.width;
      if (typeof parent.height === 'number' && meta.height) parent.height = meta.height;
      // A converted video brings its MP4 fallback and WebP poster: fill both in.
      if (key === 'video' && meta.poster !== undefined) {
        if ('videoFallback' in parent) parent.videoFallback = meta.fallback || '';
        if (isObj(parent.poster) && 'src' in parent.poster && meta.poster) parent.poster.src = meta.poster;
        else if (typeof parent.poster === 'string' && meta.poster) parent.poster = meta.poster;
        const y = window.scrollY;
        renderFile(fileId);
        window.scrollTo(0, y);
      }
      refreshDirty();
    }
  };
  input.addEventListener('change', () => update(input.value.trim()));
  const choose = el('button', { class: 'btn btn--small', type: 'button', text: 'Choose / upload' });
  choose.addEventListener('click', () => openMediaPicker({ accept: key === 'video' || key === 'videoFallback' ? 'video' : key === 'fullReelUrl' ? 'any' : 'image' }).then((picked) => picked && update(picked.url, picked)));
  const clear = el('button', { class: 'btn btn--ghost btn--small', type: 'button', text: 'Remove' });
  clear.addEventListener('click', () => update(''));
  wrap.append(
    el('label', { for: id, text: humanize(key) }),
    el('div', { class: 'media-field' }, thumb, el('div', { class: 'media-field__controls' }, input, el('div', { class: 'btn-row' }, choose, clear))),
  );
  return wrap;
}

function stringListField(fileId, path, key, list, lang) {
  const box = el('div', { class: 'list' });
  const render = () => {
    box.replaceChildren();
    const items = getAt(state.files.get(fileId).value, path);
    items.forEach((v, i) => {
      const isMedia = MEDIA_KEYS.has(key);
      const field = isMedia ? mediaField(fileId, [...path, i], key === 'gallery' ? 'image' : key, v) : textField(fileId, [...path, i], key, v);
      const tools = rowTools(fileId, path, i, render);
      box.append(el('div', { class: 'list-row' }, field, tools));
    });
    const add = el('button', { class: 'btn btn--ghost btn--small', type: 'button', text: `Add ${MEDIA_KEYS.has(key) ? 'image' : 'line'}` });
    add.addEventListener('click', () => {
      getAt(state.files.get(fileId).value, path).push('');
      refreshDirty();
      render();
    });
    box.append(el('div', {}, add));
  };
  render();
  return el('div', { class: 'field', 'data-lang': lang || null }, el('span', { class: 'field__label' }, lang ? el('span', { class: 'lang-tag', text: lang.toUpperCase() }) : '', lang ? '' : humanize(key)), box);
}

function rowTools(fileId, path, i, rerender) {
  const list = () => getAt(state.files.get(fileId).value, path);
  const move = (d) => {
    const arr = list();
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    refreshDirty();
    rerender();
  };
  const up = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move up', text: '↑', onclick: () => move(-1) });
  const down = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move down', text: '↓', onclick: () => move(1) });
  const del = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Remove', text: '✕' });
  del.addEventListener('click', () => {
    if (del.dataset.armed) {
      list().splice(i, 1);
      refreshDirty();
      rerender();
    } else {
      del.dataset.armed = '1';
      del.textContent = 'Sure?';
      setTimeout(() => {
        delete del.dataset.armed;
        del.textContent = '✕';
      }, 3000);
    }
  });
  return el('div', { class: 'row-tools' }, up, down, del);
}

function itemTitle(item, index) {
  const pick = (v) => (isPair(v) ? v.en || v.fr : typeof v === 'string' ? v : '');
  const t = pick(item?.title) || pick(item?.name) || pick(item?.heading) || pick(item?.q) || pick(item?.k) || pick(item?.label) || item?.slug || '';
  return `${index + 1}. ${t || 'Untitled'}`;
}

function objectListField(fileId, path, key, lang) {
  const box = el('div', { class: 'list' });
  const templateFor = () => {
    const tpl = state.me.templates?.[fileId]?.[path.join('.')];
    if (tpl) return structuredClone(tpl);
    const arr = getAt(state.files.get(fileId).value, path);
    return arr.length ? blankLike(arr[arr.length - 1]) : null;
  };
  const render = (openIndex = -1) => {
    box.replaceChildren();
    const items = getAt(state.files.get(fileId).value, path);
    items.forEach((item, i) => {
      const details = el('details', { class: 'item', open: i === openIndex });
      const summary = el('summary', {}, el('span', { class: 'item__title', text: itemTitle(item, i) }));
      summary.append(rowTools(fileId, path, i, () => render(i)));
      details.append(summary);
      details.addEventListener('toggle', () => {
        if (details.open && !details.dataset.built) {
          details.dataset.built = '1';
          details.append(el('div', { class: 'item__body' }, ...objectFields(fileId, [...path, i], item)));
        }
      });
      if (i === openIndex) details.dispatchEvent(new Event('toggle'));
      box.append(details);
    });
    const tpl = templateFor();
    if (tpl) {
      const add = el('button', { class: 'btn btn--ghost btn--small', type: 'button', text: `Add ${humanize(key).toLowerCase().replace(/s$/, '')}` });
      add.addEventListener('click', () => {
        const arr = getAt(state.files.get(fileId).value, path);
        arr.push(templateFor());
        refreshDirty();
        render(arr.length - 1);
      });
      box.append(el('div', {}, add));
    }
  };
  render();
  return el('div', { class: 'field', 'data-lang': lang || null }, el('span', { class: 'field__label' }, lang ? el('span', { class: 'lang-tag', text: lang.toUpperCase() }) : '', lang ? '' : humanize(key)), box);
}

function fieldFor(fileId, path, key, value, lang) {
  if (HIDDEN_KEYS.has(key) && !lang) return null;
  if (typeof value === 'string') {
    if (ENUMS[key]) return enumField(fileId, path, key, value);
    if (MEDIA_KEYS.has(key) || key === 'fullReelUrl') return mediaField(fileId, path, key, value);
    return textField(fileId, path, key, value, lang);
  }
  if (typeof value === 'boolean') return boolField(fileId, path, key, value);
  if (typeof value === 'number') return numberField(fileId, path, key, value);
  if (Array.isArray(value)) {
    const sample = value[0] ?? state.me.templates?.[fileId]?.[path.join('.')];
    if (value.length === 0 && !sample && MEDIA_KEYS.has(key)) return stringListField(fileId, path, key, value, lang);
    if (isObj(sample) || (value.length === 0 && state.me.templates?.[fileId]?.[path.join('.')])) return objectListField(fileId, path, key, lang);
    return stringListField(fileId, path, key, value, lang);
  }
  if (isObj(value)) {
    if (isPair(value)) return pairField(fileId, path, key, value);
    return el('fieldset', { class: 'group' }, el('legend', { text: humanize(key) }), ...objectFields(fileId, path, value));
  }
  return null;
}

/** English and French side by side. */
function pairField(fileId, path, key, value) {
  return el(
    'div',
    { class: 'field' },
    el('span', { class: 'field__label', text: humanize(key) }),
    el('div', { class: 'pair' }, fieldFor(fileId, [...path, 'en'], key, value.en, 'en'), fieldFor(fileId, [...path, 'fr'], key, value.fr, 'fr')),
  );
}

function objectFields(fileId, path, obj) {
  return Object.entries(obj)
    .map(([k, v]) => fieldFor(fileId, [...path, k], k, v))
    .filter(Boolean);
}

/** A page file shaped { en: {...}, fr: {...} } is shown key by key, languages side by side. */
function pageFields(fileId, value) {
  return Object.keys(value.en).map((k) => {
    const en = value.en[k];
    const fr = value.fr[k];
    return el(
      'div',
      { class: 'group' },
      el('div', { class: 'group__title', text: humanize(k) }),
      el('div', { class: 'pair' }, fieldFor(fileId, ['en', k], k, en, 'en'), fr !== undefined ? fieldFor(fileId, ['fr', k], k, fr, 'fr') : el('div')),
    );
  });
}

// ---------- Views ----------
async function openFile(id) {
  state.current = id;
  markNav();
  const main = $('#main');
  main.replaceChildren(el('div', { class: 'loading', text: 'Loading…' }));
  try {
    if (!state.files.has(id)) {
      const data = await api(`/api/content/${id}`);
      state.files.set(id, { value: data.value, original: structuredClone(data.value), head: data.head, label: data.label });
    }
  } catch (err) {
    main.replaceChildren(el('div', { class: 'empty', text: err.message }));
    return;
  }
  renderFile(id);
}

function langSwitch() {
  const seg = el('div', { class: 'segmented', role: 'group', 'aria-label': 'Languages shown' });
  for (const [v, label] of [['both', 'EN + FR'], ['en', 'English'], ['fr', 'Français']]) {
    const b = el('button', { type: 'button', 'aria-pressed': String(state.lang === v), text: label });
    b.addEventListener('click', () => {
      state.lang = v;
      renderFile(state.current);
    });
    seg.append(b);
  }
  return seg;
}

function renderFile(id) {
  const f = state.files.get(id);
  const main = $('#main');
  const isPage = isObj(f.value) && 'en' in f.value && 'fr' in f.value && isObj(f.value.en);
  let fields;
  if (isPage) fields = pageFields(id, f.value);
  else if (Array.isArray(f.value)) fields = [objectListField(id, [], f.label)];
  else fields = objectFields(id, [], f.value);
  const editor = el('div', { class: `editor ${state.lang === 'both' ? '' : `lang-only-${state.lang}`}` }, ...fields);
  main.replaceChildren(
    el('div', { class: 'main__head' }, el('h1', { text: f.label }), langSwitch()),
    editor,
  );
  main.focus({ preventScroll: true });
}

async function renderLibrary() {
  const lib = await api('/api/media');
  state.library = lib.items;
  return lib.items;
}

function formatBytes(n) {
  if (!n) return '';
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
}

function mediaCard(item, onSelect) {
  const card = el('div', { class: `card ${onSelect ? 'is-selectable' : ''}`, tabindex: onSelect ? '0' : null, role: onSelect ? 'button' : null });
  card.append(thumbFor(item.type === 'video' ? item.poster || item.url : item.url));
  card.append(el('div', { class: 'card__name', text: item.name }));
  card.append(el('div', { class: 'card__meta', text: `${item.type} · ${item.width}×${item.height}${item.duration ? ` · ${item.duration}s` : ''} · ${formatBytes(item.bytes)}` }));
  if (onSelect) {
    card.addEventListener('click', () => onSelect(item));
    card.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(item)));
  }
  return card;
}

async function openLibraryView() {
  state.current = 'library';
  markNav();
  const main = $('#main');
  main.replaceChildren(el('div', { class: 'loading', text: 'Loading media…' }));
  try {
    const items = await renderLibrary();
    const grid = el('div', { class: 'grid' });
    for (const item of items) {
      const card = mediaCard(item);
      const copy = el('button', { class: 'btn btn--ghost btn--small', type: 'button', text: 'Copy link' });
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(item.url);
          toast('Link copied');
        } catch {
          prompt('Copy this link', item.url);
        }
      });
      const del = el('button', { class: 'btn btn--danger btn--small', type: 'button', text: 'Delete' });
      del.addEventListener('click', async () => {
        if (!del.dataset.armed) {
          del.dataset.armed = '1';
          del.textContent = 'Delete for good?';
          return;
        }
        try {
          await api(`/api/media/${item.id}`, { method: 'DELETE' });
          card.remove();
          toast('Deleted. Pages still using this file will show an empty frame.');
        } catch (err) {
          toast(err.message, 'error');
        }
      });
      card.append(el('div', { class: 'btn-row' }, copy, del));
      grid.append(card);
    }
    const upload = el('button', { class: 'btn', type: 'button', text: 'Upload new' });
    upload.addEventListener('click', () => openMediaPicker({ accept: 'any', tab: 'upload' }).then((p) => p && openLibraryView()));
    main.replaceChildren(
      el('div', { class: 'main__head' }, el('h1', { text: 'Media library' }), upload),
      items.length ? grid : el('div', { class: 'empty', text: 'No media yet. Upload photos and videos here, then pick them in any page.' }),
    );
  } catch (err) {
    main.replaceChildren(el('div', { class: 'empty', text: err.message }));
  }
}

async function openHistory() {
  state.current = 'history';
  markNav();
  const main = $('#main');
  main.replaceChildren(el('div', { class: 'loading', text: 'Loading history…' }));
  try {
    const { items } = await api('/api/history');
    const list = el('ul', { class: 'history' });
    for (const c of items) {
      list.append(
        el('li', {}, el('strong', { text: c.message.replace(/^content: /, '') }), el('span', { class: 'help', text: new Date(c.date).toLocaleString() }), el('a', { href: c.url, target: '_blank', rel: 'noopener', text: 'See the change on GitHub' })),
      );
    }
    main.replaceChildren(
      el('div', { class: 'main__head' }, el('h1', { text: 'Change history' })),
      el('p', { class: 'help', text: 'Every publish is saved as a version. To undo one, ask your developer to revert it on GitHub; the site then rebuilds with the earlier content.' }),
      items.length ? list : el('div', { class: 'empty', text: 'No changes yet.' }),
    );
  } catch (err) {
    main.replaceChildren(el('div', { class: 'empty', text: err.message }));
  }
}

function markNav() {
  document.querySelectorAll('.nav-item').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === state.current)));
  $('#sidebar').classList.remove('is-open');
  $('#menu-btn').setAttribute('aria-expanded', 'false');
}

function buildNav() {
  const nav = $('#sidebar');
  nav.replaceChildren();
  const groups = {};
  for (const f of state.me.files) (groups[f.group] ??= []).push(f);
  for (const [group, files] of Object.entries(groups)) {
    nav.append(el('h2', { text: group }));
    nav.append(el('ul', {}, ...files.map((f) => el('li', {}, el('button', { class: 'nav-item', type: 'button', 'data-id': f.id, onclick: () => openFile(f.id) }, el('span', { text: f.label }), el('span', { class: 'dot', hidden: true, title: 'Unpublished changes' }))))));
  }
  nav.append(el('h2', { text: 'Tools' }));
  nav.append(
    el('ul', {},
      el('li', {}, el('button', { class: 'nav-item', type: 'button', 'data-id': 'library', onclick: openLibraryView }, el('span', { text: 'Media library' }))),
      el('li', {}, el('button', { class: 'nav-item', type: 'button', 'data-id': 'history', onclick: openHistory }, el('span', { text: 'Change history' }))),
    ),
  );
}

// ---------- Media picker ----------
function openMediaPicker({ accept = 'image', tab = 'upload' } = {}) {
  const dialog = $('#media-dialog');
  const fileInput = $('#file-input');
  fileInput.accept = accept === 'video' ? 'video/mp4,video/quicktime,video/webm' : accept === 'image' ? 'image/jpeg,image/png,image/webp,image/gif,image/avif' : fileInput.getAttribute('accept');
  $('#upload-silent').closest('label').hidden = accept === 'image';
  $('#limits-help').textContent = `Photos up to ${state.me.limits.imageMb} MB (converted to WebP) · Videos up to ${state.me.limits.videoMb} MB and ${state.me.limits.videoSeconds} s (converted to WebM)`;
  $('#upload-status').hidden = true;
  $('#link-error').hidden = true;
  $('#link-input').value = '';

  return new Promise((resolve) => {
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      cleanup();
      dialog.close();
      resolve(value);
    };

    const tabs = [...dialog.querySelectorAll('[role="tab"]')];
    const showTab = async (name) => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
      dialog.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== name));
      if (name === 'library') {
        const grid = $('#picker-grid');
        grid.replaceChildren(el('div', { class: 'loading', text: 'Loading…' }));
        try {
          const items = (await renderLibrary()).filter((i) => accept === 'any' || i.type === accept);
          grid.replaceChildren(...(items.length ? items.map((i) => mediaCard(i, (item) => finish({ url: item.url, width: item.width, height: item.height, fallback: item.fallback, poster: item.poster }))) : [el('div', { class: 'empty', text: 'Nothing here yet. Upload a file first.' })]));
        } catch (err) {
          grid.replaceChildren(el('div', { class: 'empty', text: err.message }));
        }
      }
    };
    const onTab = (e) => {
      const t = e.target.closest('[role="tab"]');
      if (t) showTab(t.dataset.tab);
    };

    const upload = async (file) => {
      if (!file) return;
      const status = $('#upload-status');
      const text = $('#upload-status-text');
      const bar = $('#upload-progress');
      status.hidden = false;
      bar.style.width = '0%';
      text.textContent = `Uploading ${file.name}…`;
      try {
        const job = await new Promise((res, rej) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/media');
          xhr.setRequestHeader('X-CSRF-Token', state.me.csrf);
          xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
          xhr.setRequestHeader('X-Alt', encodeURIComponent($('#upload-alt').value));
          if ($('#upload-silent').checked) xhr.setRequestHeader('X-Silent', '1');
          xhr.upload.onprogress = (e) => e.lengthComputable && (bar.style.width = `${Math.round((e.loaded / e.total) * 100)}%`);
          xhr.onload = () => {
            const data = JSON.parse(xhr.responseText || '{}');
            xhr.status === 202 ? res(data.job) : rej(new Error(data.error || 'Upload failed'));
          };
          xhr.onerror = () => rej(new Error('Upload interrupted. Check your connection.'));
          xhr.send(file);
        });
        text.textContent = job.kind === 'video' ? 'Converting the video to WebM… this can take a few minutes. You can keep this window open.' : 'Converting to WebP…';
        bar.style.width = '100%';
        for (;;) {
          await new Promise((r) => setTimeout(r, 1500));
          const { job: j } = await api(`/api/jobs/${job.id}`);
          if (j.status === 'done') {
            toast(`${file.name} is ready (${formatBytes(j.item.bytes)} after conversion)`);
            finish({ url: j.item.url, width: j.item.width, height: j.item.height, fallback: j.item.fallback, poster: j.item.poster });
            return;
          }
          if (j.status === 'error') throw new Error(j.error);
          text.textContent = j.status === 'uploading' ? 'Saving to the media library…' : text.textContent;
        }
      } catch (err) {
        text.textContent = err.message;
        bar.style.width = '0%';
      }
    };

    const onFile = () => upload(fileInput.files[0]);
    const drop = $('#drop');
    const onDragOver = (e) => {
      e.preventDefault();
      drop.classList.add('is-over');
    };
    const onDragLeave = () => drop.classList.remove('is-over');
    const onDrop = (e) => {
      e.preventDefault();
      drop.classList.remove('is-over');
      upload(e.dataTransfer.files[0]);
    };
    const onLink = () => {
      const v = $('#link-input').value.trim();
      const err = $('#link-error');
      if (!/^https:\/\/[^\s]+$/.test(v)) {
        err.textContent = 'Use a full link starting with https://';
        err.hidden = false;
        return;
      }
      finish({ url: v });
    };
    const onClose = (e) => e.target.closest('[data-close]') && finish(null);
    const onCancel = () => finish(null);

    function cleanup() {
      dialog.removeEventListener('click', onTab);
      dialog.removeEventListener('click', onClose);
      dialog.removeEventListener('close', onCancel);
      fileInput.removeEventListener('change', onFile);
      drop.removeEventListener('dragover', onDragOver);
      drop.removeEventListener('dragleave', onDragLeave);
      drop.removeEventListener('drop', onDrop);
      $('#link-use').removeEventListener('click', onLink);
      fileInput.value = '';
    }

    dialog.addEventListener('click', onTab);
    dialog.addEventListener('click', onClose);
    dialog.addEventListener('close', onCancel);
    fileInput.addEventListener('change', onFile);
    drop.addEventListener('dragover', onDragOver);
    drop.addEventListener('dragleave', onDragLeave);
    drop.addEventListener('drop', onDrop);
    $('#link-use').addEventListener('click', onLink);
    dialog.showModal();
    showTab(tab);
  });
}

// ---------- Publish ----------
function openPublish() {
  const ids = dirtyIds();
  if (!ids.length) return;
  const dialog = $('#publish-dialog');
  $('#publish-summary').textContent = `You changed: ${ids.map((id) => state.files.get(id).label).join(', ')}. The website updates about 2 minutes after publishing.`;
  $('#publish-error').hidden = true;
  dialog.showModal();
}

async function publish() {
  const ids = dirtyIds();
  const btn = $('#publish-confirm');
  btn.disabled = true;
  btn.textContent = 'Publishing…';
  try {
    // All edits must start from the same GitHub version.
    const heads = [...new Set(ids.map((id) => state.files.get(id).head))];
    const res = await api('/api/publish', {
      method: 'POST',
      body: { changes: ids.map((id) => ({ id, value: state.files.get(id).value })), head: heads.length === 1 ? heads[0] : undefined, message: $('#publish-note').value },
    });
    for (const id of ids) {
      const f = state.files.get(id);
      f.original = structuredClone(f.value);
    }
    // Next edits build on the new version.
    for (const f of state.files.values()) f.head = res.commit.sha;
    refreshDirty();
    $('#publish-dialog').close();
    $('#publish-note').value = '';
    toast('Published. The website will show your changes in about 2 minutes.', 'ok', { href: res.commit.url, text: 'View change' });
  } catch (err) {
    const e = $('#publish-error');
    e.textContent = err.message;
    e.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish now';
  }
}

// ---------- Boot ----------
async function boot() {
  state.me = await api('/api/me');
  if (state.me.siteUrl) {
    const a = $('#view-site');
    a.href = state.me.siteUrl;
    a.hidden = false;
  }
  buildNav();
  openFile(state.me.files[0].id);

  $('#publish').addEventListener('click', openPublish);
  $('#publish-confirm').addEventListener('click', publish);
  $('#publish-dialog').addEventListener('click', (e) => e.target.closest('[data-close]') && $('#publish-dialog').close());
  $('#discard').addEventListener('click', () => {
    const btn = $('#discard');
    if (!btn.dataset.armed) {
      btn.dataset.armed = '1';
      btn.textContent = 'Discard all changes?';
      setTimeout(() => {
        delete btn.dataset.armed;
        btn.textContent = 'Discard changes';
      }, 4000);
      return;
    }
    for (const f of state.files.values()) f.value = structuredClone(f.original);
    refreshDirty();
    if (state.files.has(state.current)) renderFile(state.current);
    delete btn.dataset.armed;
    btn.textContent = 'Discard changes';
  });
  $('#logout').addEventListener('click', async () => {
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    location.replace('/login');
  });
  $('#menu-btn').addEventListener('click', () => {
    const open = !$('#sidebar').classList.contains('is-open');
    $('#sidebar').classList.toggle('is-open', open);
    $('#menu-btn').setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('beforeunload', (e) => {
    if (dirtyIds().length) e.preventDefault();
  });
}

boot().catch((err) => {
  $('#main').replaceChildren(el('div', { class: 'empty', text: err.message }));
});

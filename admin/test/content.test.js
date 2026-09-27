import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FILES, TEMPLATES, validateContent } from '../src/content.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));

test('every real content file validates against itself', () => {
  for (const f of FILES) {
    const v = read(f.path);
    const r = validateContent(v, v, TEMPLATES[f.id]);
    assert.equal(r.ok, true, `${f.path}: ${r.problems.join('; ')}`);
  }
});

test('edits keep the shape; wrong types and new fields are refused', () => {
  const services = read('content/services.json');
  const edited = structuredClone(services);
  edited[0].name.en = 'Social content (new name)';
  assert.equal(validateContent(edited, services, TEMPLATES.services).ok, true);
  const bad = structuredClone(services);
  bad[0].name = 'not bilingual';
  bad[1].hacker = true;
  const r = validateContent(bad, services, TEMPLATES.services);
  assert.equal(r.ok, false);
  assert.match(r.problems.join(' '), /0\]\.name: expected object/);
  assert.match(r.problems.join(' '), /hacker: unknown field/);
});

test('media fields accept only /paths and https links', () => {
  const media = read('content/media.json');
  const bad = structuredClone(media);
  bad.chapters.problem.src = 'javascript:alert(1)';
  assert.equal(validateContent(bad, media).ok, false);
  const good = structuredClone(media);
  good.chapters.problem.src = 'https://media.example.com/images/2026/09/a-1920.webp';
  assert.equal(validateContent(good, media).ok, true);
});

test('new items from templates validate (projects, testimonials)', () => {
  const projects = read('content/projects.json');
  const next = [...projects, structuredClone(TEMPLATES.projects[''])];
  assert.equal(validateContent(next, projects, TEMPLATES.projects).ok, true);
  const proof = read('content/proof.json');
  const withQuote = { ...proof, testimonials: [structuredClone(TEMPLATES.proof.testimonials)] };
  assert.equal(validateContent(withQuote, proof, TEMPLATES.proof).ok, true);
});

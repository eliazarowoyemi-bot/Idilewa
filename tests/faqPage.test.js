import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('FAQ route includes the supplied search, category, language, and accordion behaviors', async () => {
  const page = await readFile(new URL('../faq.html', import.meta.url), 'utf8');
  const client = await readFile(new URL('../src/faq.js', import.meta.url), 'utf8');
  const vite = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
  assert.match(vite, /'faq'/);
  assert.match(page, /id="faqSearch"/);
  assert.match(page, /id="faqCategories"/);
  assert.match(page, /id="faqLanguage"/);
  assert.match(client, /setAttribute\('aria-expanded'/);
  assert.match(client, /No matching questions/);
  assert.match(client, /English answer shown|fallback/);
});

test('FAQ answers describe the current tutor availability and family approval flow honestly', async () => {
  const client = await readFile(new URL('../src/faq.js', import.meta.url), 'utf8');
  assert.match(client, /not currently enabled/);
  assert.match(client, /points are added only after parent approval/);
  assert.doesNotMatch(client, /Yes! Ìdíléwa provides a student–tutor messaging experience/);
});

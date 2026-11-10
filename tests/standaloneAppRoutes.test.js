import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createStandaloneAppPlugin } from '../src/standaloneAppRoutes.js';

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const plugin = createStandaloneAppPlugin(rootDirectory);
const appSource = await readFile(resolve(rootDirectory, 'index.html'), 'utf8');

function transformEntry(filename, html = '') {
  return plugin.transformIndexHtml.handler(html, { filename: resolve(rootDirectory, filename) });
}

test('homepage serves the supplied academy app and guards its optional embedded controls', () => {
  const transformed = transformEntry('index.html', appSource);

  assert.match(transformed, /Our Language\./);
  assert.match(transformed, /function go\(id\)/);
  assert.match(transformed, /Fruit Maths/);
  assert.match(transformed, /Little Scientists/);
  assert.doesNotMatch(transformed, /document\.getElementById\("footerYear"\)\.textContent=/);
  assert.doesNotMatch(transformed, /const root=document\.querySelector\('\.bilingualGame'\), sel=root\.querySelector\(/);
  assert.match(transformed, /id="idilewa-accessibility-overrides"/);
  assert.match(transformed, /premium-mobile-menu\{margin-right:0;transform:translateX\(-6px\)\}/);
  assert.match(transformed, /<h2>Source<\/h2>/);
  assert.match(transformed, /urlSearchParams|URLSearchParams/);
});

test('legacy learning, coding, conversation, and heritage URLs open their matching app views', () => {
  const destinations = [
    ['voice_lessons.html', '/?view=learning'],
    ['code-studio.html', '/?view=codeLab'],
    ['ai-conversation.html', '/?view=aiChat'],
    ['oral.html', '/?view=heritageLab'],
    ['languages.html', '/?view=academy'],
  ];

  for (const [filename, destination] of destinations) {
    const redirect = transformEntry(filename);
    assert.ok(redirect.includes(`location.replace("${destination}")`));
    assert.ok(redirect.includes(`<a href="${destination}">`));
  }
});

test('retired sign-in, portal, and consent entries return to the new home view', () => {
  for (const filename of ['login.html', 'auth-callback.html', 'parents.html', 'tutor.html', 'consent.html']) {
    const redirect = transformEntry(filename);
    assert.match(redirect, /location\.replace\("\/?\?view=home"\)/);
  }
});

test('every built HTML entry except the homepage points to the standalone app', async () => {
  const files = await readdir(rootDirectory);
  const pages = files.filter((file) => file.endsWith('.html') && file !== 'index.html');

  assert.ok(pages.length > 0);
  for (const filename of pages) {
    const redirect = transformEntry(filename);
    assert.match(redirect, /Continue to Ìdíléwa Language Academy/, filename);
    assert.match(redirect, /location\.replace\(/, filename);
  }
});

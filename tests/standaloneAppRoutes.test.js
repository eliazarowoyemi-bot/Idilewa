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
  assert.doesNotMatch(transformed, /const root=document\.querySelector\(&#x27;\.bilingualGame&#x27;\), sel=root\.querySelector\(/);
  assert.match(transformed, /id="idilewa-accessibility-overrides"/);
  assert.match(transformed, /\.premium-auth-link/);
  assert.match(transformed, /<h2>Source<\/h2>/);
  assert.match(transformed, /urlSearchParams|URLSearchParams/);
  assert.match(transformed, /\/ai-conversation\.html/);
  assert.match(transformed, /For Tutors/);
  assert.match(transformed, /link\.href = '\/educator-portal\.html'/);
  assert.match(transformed, /Sign in/);
});

test('legacy learning and heritage URLs open their matching standalone views', () => {
  const destinations = [
    ['oral.html', '/?view=heritageLab'],
    ['languages.html', '/?view=academy'],
  ];

  for (const [filename, destination] of destinations) {
    const redirect = transformEntry(filename);
    assert.ok(redirect.includes(`location.replace("${destination}")`));
    assert.ok(redirect.includes(`<a href="${destination}">`));
  }
});

test('native entry pages retain their app and return home or voice links to canonical pages', async () => {
  for (const filename of [
    'ai-conversation.html',
    'auth-callback.html',
    'code-studio.html',
    'consent.html',
    'educator-portal.html',
    'login.html',
    'parents.html',
    'tutor.html',
    'trainer.html',
    'voice_lessons.html',
    'voices.html',
  ]) {
    const source = await readFile(resolve(rootDirectory, filename), 'utf8');
    const transformed = transformEntry(filename, source);
    const closingHead = source.toLowerCase().lastIndexOf('</head>');
    assert.ok(transformed.startsWith(source.slice(0, closingHead)), filename);
    assert.ok(transformed.endsWith(source.slice(closingHead)), filename);
    assert.match(transformed, /event\.stopImmediatePropagation\(\)/, filename);
    assert.match(transformed, /location\.assign\(link\.getAttribute\('href'\) === '#\/index' \? '\/' : '\/voice_lessons\.html'\)/, filename);
    if (filename === 'tutor.html') {
      assert.match(transformed, /href = '\/educator-portal\.html'/);
      assert.match(transformed, /link\.textContent = 'Educator Portal'/);
      assert.match(transformed, /id="idilewa-tutor-accessibility-overrides"/);
    }
  }
});

test('every built HTML entry except the homepage points to the standalone app', async () => {
  const files = await readdir(rootDirectory);
  const pages = files.filter((file) => file.endsWith('.html') && file !== 'index.html');
  const nativePages = new Set([
    'ai-conversation.html',
    'auth-callback.html',
    'code-studio.html',
    'consent.html',
    'educator-portal.html',
    'login.html',
    'parents.html',
    'tutor.html',
    'trainer.html',
    'voice_lessons.html',
    'voices.html',
  ]);

  assert.ok(pages.length > 0);
  for (const filename of pages) {
    if (nativePages.has(filename)) continue;
    const redirect = transformEntry(filename);
    assert.match(redirect, /Continue to Ìdíléwa Language Academy/, filename);
    assert.match(redirect, /location\.replace\(/, filename);
  }
});

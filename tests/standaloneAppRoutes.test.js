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
  assert.match(transformed, /href="\/creative-studio\.html">🎨 Creative Studio<\/a>/);
  assert.match(transformed, /Tutorship/);
  assert.match(transformed, /link\.href = '\/tutor\.html'/);
  assert.match(transformed, /Sign in/);
  assert.match(transformed, /\/kids\.html/);
  assert.match(transformed, /\/about\.html/);
  assert.match(transformed, /link\.href = '\/parents\.html#\/parent-login'/);
  assert.match(transformed, /link\.href = '\/parents\.html#\/parent-signup'/);
  assert.match(transformed, /src="\/src\/siteFooter\.js"/);
});

test('homepage drawer shows its menu label and all primary destinations', async () => {
  const navigationSource = await readFile(resolve(rootDirectory, 'src/siteNav.js'), 'utf8');

  assert.match(navigationSource, /label\.textContent = 'Menu'/);
  for (const destination of [
    "['/', 'Home']",
    "['/?view=academy', 'Language Academy']",
    "['/?view=codeLab', 'Code for Kids']",
    "['/?view=heritageLab', 'Heritage Library']",
    "['/kids.html', 'Kids Arcade']",
    "['/creative-studio.html', 'Creative Studio']",
    "['/tutor.html', 'Tutorship']",
    "['/parents.html', 'For Families']",
    "['/family-tasks.html', 'Family Tasks']",
    "['/faq.html', 'FAQ']",
    "['/about.html', 'About Ìdíléwa']",
    "['/pricing.html', 'Pricing']",
  ]) {
    assert.ok(navigationSource.includes(destination), `drawer should include ${destination}`);
  }
  assert.match(navigationSource, /window\.location\.assign\('\/faq\.html'\)/);
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
    'about.html',
    'consent.html',
    'educator-portal.html',
    'faq.html',
    'family-tasks.html',
    'login.html',
    'parents.html',
    'kids.html',
    'tutor.html',
    'trainer.html',
    'voice_lessons.html',
    'voices.html',
  ]) {
    const source = await readFile(resolve(rootDirectory, filename), 'utf8');
    const transformed = transformEntry(filename, source);
    const closingHead = source.toLowerCase().lastIndexOf('</head>');
    if (!['about.html', 'kids.html', 'tutor.html'].includes(filename)) {
      assert.ok(transformed.startsWith(source.slice(0, closingHead)), filename);
      const closingBody = source.toLowerCase().lastIndexOf('</body>');
      assert.ok(transformed.includes(source.slice(closingHead, closingBody)), filename);
      assert.ok(transformed.endsWith(source.slice(closingBody)), filename);
    }
    assert.match(transformed, /event\.stopImmediatePropagation\(\)/, filename);
    assert.match(transformed, /src="\/src\/siteFooter\.js"/, filename);
    assert.match(transformed, /location\.assign\(link\.getAttribute\('href'\) === '#\/index' \? '\/' : '\/voice_lessons\.html'\)/, filename);
    if (filename === 'tutor.html') {
      assert.match(transformed, /href = '\/educator-portal\.html#\/tutor-signup'/);
      assert.match(transformed, /link\.textContent = 'Secure Tutor Sign-up'/);
      assert.match(transformed, /id="idilewa-tutor-accessibility-overrides"/);
      assert.match(transformed, /href="\/kids\.html">Kids Arcade/);
    }
    if (filename === 'kids.html') {
      assert.match(transformed, /const GAMES=\{racer:"\/games\/turbo-racers\.html",ludo:"\/games\/balloon-ludo\.html"\}/);
      assert.match(transformed, /frame\.src=GAMES\[which\]/);
      assert.match(transformed, /src="\/src\/arcadeProgress\.js"/);
      assert.match(transformed, /href="\/parents\.html#\/parent-signup">Family account/);
    }
    if (filename === 'about.html') {
      assert.match(transformed, /href="\/\?view=academy"/);
      assert.match(transformed, /href="\/\?view=codeLab"/);
      assert.match(transformed, /href="\/\?view=heritageLab"/);
      assert.doesNotMatch(transformed, /href="https:\/\/idilewa\.com/);
      assert.match(transformed, /data-idilewa-route/);
    }
  }
});

test('Creative Studio links back to Home and Code Playground and hardens local project imports', async () => {
  const source = await readFile(resolve(rootDirectory, 'creative-studio.html'), 'utf8');
  const transformed = transformEntry('creative-studio.html', source);

  assert.match(transformed, /<title>Creative Studio \| Ìdíléwa<\/title>/);
  assert.match(transformed, /href="\/">Home<\/a>/);
  assert.match(transformed, /href="\/\?view=codeLab">Games &amp; Code Playground<\/a>/);
  assert.match(transformed, /id="studioMenuToggle" type="button" aria-expanded="false" aria-controls="studioNavigationMenu"/);
  assert.match(transformed, /id="studioNavigationMenu" role="region" aria-label="Creative Studio and site navigation" hidden/);
  assert.match(transformed, /<h2 id="studioToolsLabel">Creative Studio<\/h2>\s*<nav class="tabs" id="tabs" aria-label="Creative Studio tools"><\/nav>/);
  assert.match(transformed, /<h2 id="studioPagesLabel">Ìdíléwa pages<\/h2>[\s\S]*<nav class="studio-site-nav" aria-label="Ìdíléwa navigation">/);
  assert.match(transformed, /href="\/kids\.html">Kids Arcade<\/a>/);
  assert.match(transformed, /href="\/about\.html">About<\/a>/);
  assert.match(transformed, /href="\/tutor\.html">Tutorship<\/a>/);
  assert.match(transformed, /src="\/src\/creativeStudioPage\.js"/);
  assert.match(transformed, /src="\/src\/siteFooter\.js"/);
  assert.match(transformed, /idilewaCreativeStudioBridge/);
});

test('every built HTML entry except the homepage points to the standalone app', async () => {
  const files = await readdir(rootDirectory);
  const pages = files.filter((file) => file.endsWith('.html') && file !== 'index.html');
  const nativePages = new Set([
    'ai-conversation.html',
    'auth-callback.html',
    'about.html',
    'consent.html',
    'creative-studio.html',
    'educator-portal.html',
    'faq.html',
    'family-tasks.html',
    'login.html',
    'parents.html',
    'kids.html',
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

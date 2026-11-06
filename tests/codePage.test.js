import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('Code for Kids opens the kids learning page, not the general curriculum', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderFullHome()'));
  const routes = appSource.match(/const ROUTES = \[([\s\S]*?)\n  \];/)?.[1] || '';

  assert.match(homeSource, /routeLink\('kids', `Code for Kids/);
  assert.match(homeSource, /title: 'Code', copy: 'Build skills in your language', route: 'kids'/);
  assert.match(routes, /'kids'/);
  assert.doesNotMatch(routes, /'coding'|'coding-studio'/);
});

test('the standalone Creative Studio and its build entries are removed', async () => {
  assert.doesNotMatch(viteConfig, /starter-projects|coding-studio/);
  for (const path of [
    '../starter-projects.html',
    '../coding-studio.html',
    '../src/studio/editor-main.tsx',
    '../src/components/editor/StudioEditor.tsx',
    '../src/components/gallery/StarterGallery.tsx',
    '../supabase/migrations/20261104000000_multilingual_block_studio.sql',
  ]) {
    await assert.rejects(access(new URL(path, import.meta.url)), { code: 'ENOENT' });
  }
});

test('the unreachable block editor and game builder are removed without removing kids curriculum', () => {
  assert.doesNotMatch(appSource, /renderCodePlay|renderCodingStudio|CODE_PLAY_GAMES|data-route="coding-studio"/);
  assert.doesNotMatch(styleSource, /\.code-play-|\.code-studio-|\.code-design-page/);
  assert.match(appSource, /function renderLanguages\(\)/);
  assert.doesNotMatch(appSource, /function renderCurriculum\(\)|function renderPayment\(\)/);
});

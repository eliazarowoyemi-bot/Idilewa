import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
const viteConfigTs = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');

test('retired pages and unknown routes redirect to the Family homepage', async () => {
  const routes = appSource.match(/const ROUTES = \[([\s\S]*?)\n  \];/)?.[1];
  const nav = appSource.match(/const NAV = \[([\s\S]*?)\n  \];/)?.[1];
  const removedRoutes = appSource.match(/const REMOVED_ROUTES = new Set\(\[([\s\S]*?)\]\);/)?.[1];

  assert.ok(routes, 'application routes should exist');
  assert.ok(nav, 'main navigation should exist');
  assert.ok(removedRoutes, 'retired route list should exist');
  for (const route of ['world', 'explore', 'undefined', 'coding', 'coding-studio', 'method', 'base', 'human', 'guides', 'game', 'library', 'individuals', 'schools', 'ifa', 'ifa_odu']) {
    assert.doesNotMatch(routes, new RegExp(`['\"]${route}['\"]`), `${route} should not be an active route`);
    assert.match(removedRoutes, new RegExp(`['\"]${route}['\"]`), `${route} should redirect home`);
  }
  const retiredShells = ['base', 'guides', 'human', 'ifa', 'ifa_odu', 'individuals', 'method', 'schools'];
  for (const route of retiredShells) {
    assert.doesNotMatch(viteConfig, new RegExp(`'${route}'`));
    assert.doesNotMatch(viteConfigTs, new RegExp(`'${route}'`));
    await assert.rejects(access(new URL(`../${route}.html`, import.meta.url)), { code: 'ENOENT' });
  }
  assert.doesNotMatch(appSource, /function renderDirectory|function renderBase|function renderLibrary|function renderTileGame|TILE_WORDS/);
  assert.doesNotMatch(nav, /world|Explore|Library|Tile game/);
  assert.match(appSource, /page: REMOVED_ROUTES\.has\(page\) \|\| !ROUTES\.includes\(page\) \? 'index' : page/);
  assert.match(appSource, /removedRoute: REMOVED_ROUTES\.has\(page\) \|\| !ROUTES\.includes\(page\)/);
  assert.match(appSource, /if \(location\.removedRoute\) \{\s*navigate\('index', \{\}, true\);/);
  assert.doesNotMatch(appSource, /function renderCulturalWorld|initCulturalWorld|CULTURAL_BIOMES|cultural-zone|cultural-world-replacement/);
});

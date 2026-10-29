import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('Explore is removed from navigation and its previous route redirects home', () => {
  const routes = appSource.match(/const ROUTES = \[([\s\S]*?)\n  \];/)?.[1];
  const nav = appSource.match(/const NAV = \[([\s\S]*?)\n  \];/)?.[1];

  assert.ok(routes, 'application routes should exist');
  assert.ok(nav, 'main navigation should exist');
  assert.doesNotMatch(routes, /'world'/);
  assert.doesNotMatch(nav, /world|Explore/);
  assert.match(appSource, /const REMOVED_ROUTES = new Set\(\[[^\]]*'world'/);
  assert.match(appSource, /page: REMOVED_ROUTES\.has\(page\) \? 'index'/);
  assert.match(appSource, /if \(location\.removedRoute\) \{\s*navigate\('index', \{\}, true\);/);
  assert.doesNotMatch(appSource, /function renderCulturalWorld|initCulturalWorld|CULTURAL_BIOMES|cultural-zone|cultural-world-replacement/);
});

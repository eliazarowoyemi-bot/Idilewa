import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
const viteConfigTs = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');

test('the coding pages are retired and no longer included in the site build', async () => {
  const routes = appSource.match(/const ROUTES = \[([\s\S]*?)\];/)?.[1] || '';
  const navigation = appSource.match(/const NAV = \[([\s\S]*?)\];/)?.[1] || '';

  assert.doesNotMatch(routes, /coding/);
  assert.match(appSource, /REMOVED_ROUTES = new Set\([^)]*'coding', 'coding-studio'/);
  assert.doesNotMatch(navigation, /coding|label: 'Code'/);
  assert.doesNotMatch(appSource, /route: 'coding'|ctaRoute: 'coding'|routeLink\('coding'|href="#\/coding"/);
  assert.doesNotMatch(viteConfig, /'coding'/);
  assert.doesNotMatch(viteConfigTs, /'coding'/);
  await assert.rejects(access(new URL('../coding.html', import.meta.url)), { code: 'ENOENT' });
});

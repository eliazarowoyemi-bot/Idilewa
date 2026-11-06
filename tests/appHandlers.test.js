import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const appSource = readFileSync(join(fileURLToPath(new URL('..', import.meta.url)), 'app.js'), 'utf8');

const handledActions = new Set([
  ...[...appSource.matchAll(/case '([a-z][a-z0-9-]+)':/g)].map((match) => match[1]),
  ...[...appSource.matchAll(/\[data-action="([a-z][a-z0-9-]+)"\]/g)].map((match) => match[1]),
]);

const staticActions = [...new Set(
  [...appSource.matchAll(/data-action="([^"$]+)"/g)].map((match) => match[1])
)].filter((action) => /^[a-z][a-z0-9-]+$/.test(action));

test('every static data-action in app.js is wired to a handler', () => {
  const orphans = staticActions.filter((action) => !handledActions.has(action)).sort();
  assert.deepEqual(orphans, [], `unhandled actions: ${orphans.join(', ')}`);
  assert.ok(staticActions.length > 40, 'action audit should see the full shell');
});

test('dynamic action templates only ever resolve to handled actions', () => {
  const dynamicSwitches = [...appSource.matchAll(/data-action="\$\{([^}]+)\}"/g)].map((match) => match[1]);
  assert.ok(dynamicSwitches.length >= 2, 'expected ternary action templates in the shell');
  for (const expression of dynamicSwitches) {
    const options = [...expression.matchAll(/'([a-z][a-z0-9-]+)'/g)].map((match) => match[1]);
    assert.ok(options.length >= 2, `could not read the options of: ${expression}`);
    for (const option of options) {
      assert.ok(handledActions.has(option), `template option "${option}" has no handler`);
    }
  }
});

test('retired dashboard renderers stay removed from the shell', () => {
  for (const retired of ['renderParentDashboardData', 'renderEducatorDashboardData', 'loadRoleDashboard', 'loadAdultDashboard']) {
    assert.ok(!appSource.includes(retired), `${retired} should stay deleted`);
  }
  assert.ok(!appSource.includes('withdraw-educator-consent'), 'consent withdrawal should use the live parent action');
  assert.match(appSource, /data-action="parent-withdraw-consent"/);
  assert.match(appSource, /if \(!requestId \|\| !window\.confirm\('Withdraw this educator/);
});

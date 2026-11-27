import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const authDialogSource = await readFile(new URL('../src/authDialog.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const clientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const callbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');
const viteSource = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');

test('Family portal exposes landing, account, dashboard, learning and settings routes', () => {
  for (const route of [
    'families', 'parent-login', 'parent-signup', 'parent-dashboard', 'parent-children',
    'parent-progress', 'parent-messages', 'parent-settings', 'parent-welcome'
  ]) {
    assert.match(appSource, new RegExp(`'${route}'`));
    assert.match(appSource, new RegExp(`case '${route}':`));
  }
  assert.match(appSource, /label: 'For Parents', route: 'families'/);
  assert.match(appSource, /function renderAuthRoutePlaceholder\(role, mode\)/);
  assert.match(authDialogSource, /data-auth-form="parent"/);
  assert.match(appSource, /data-form="parent-profile"/);
  assert.match(appSource, /getRoleDashboard\('\/api\/dashboard\/parent'\)/);
});

test('Parent account registration and email confirmation return to the protected family dashboard', () => {
  assert.match(authDialogSource, /redirectRoute: state\.returnToHomepage \? 'index' : 'parent-dashboard'/);
  assert.match(authDialogSource, /expectedRole = role === 'tutor' \? 'educator' : 'parent'/);
  assert.match(clientSource, /role === 'parent' && phone/);
  assert.match(clientSource, /'parent-dashboard'\]\.includes\(redirectRoute\)/);
  assert.match(callbackSource, /'parent-dashboard', 'parent-signup'\]\.includes\(next/);
});

test('Parent views keep learner data behind guardian-approved authentication and consent', () => {
  assert.match(appSource, /getCurrentUser\(\)\?\.role !== 'parent'\) return renderParentAccess\(\)/);
  assert.match(appSource, /parent-withdraw-consent/);
  assert.match(appSource, /cancel-parent-subscription/);
  assert.match(appSource, /withdraw-child-consent/);
  assert.match(appSource, /renderParentBilling/);
  assert.match(appSource, /\/api\/payments\/cancel/);
  assert.match(appSource, /href="\/family-tasks\.html">Family Tasks/);
  assert.match(appSource, /Direct messages aren’t enabled yet/);
  assert.match(appSource, /PARENT_PORTAL_LINKS/);
});

test('Family portal is responsive and reuses existing project imagery', async () => {
  assert.match(styleSource, /@media \(max-width: 760px\)[\s\S]*?\.family-workspace \{ display: block; \}/);
  assert.match(styleSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.family-button/);
  assert.match(appSource, /family-learning\.jpg/);
  assert.match(viteSource, /'parents'/);
  await access(new URL('../public/assets/home-family-learning.jpg', import.meta.url));
});

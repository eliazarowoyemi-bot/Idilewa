import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const authDialogSource = await readFile(new URL('../src/authDialog.js', import.meta.url), 'utf8');
const authClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const callbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../api/auth/welcome.js', import.meta.url), 'utf8');

test('parent signup offers Google only while child profiles remain parent-managed', () => {
  assert.match(authDialogSource, /data-auth-google-action="signup"[\s\S]*?Sign up with Google/);
  assert.match(authDialogSource, /state\.role === 'parent' && state\.mode === 'signup'/);
  assert.match(authDialogSource, /signInWithGoogle\(\{ redirectRoute: 'parent-signup' \}\)/);
  const childForm = authDialogSource.match(/function childForm\(\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.doesNotMatch(childForm, /data-auth-google-action/);
  assert.match(childForm, /A parent or guardian must approve the account/);
});

test('parent Google callback verifies provider and confirms the parent role before routing', () => {
  assert.match(authClientSource, /'tutor-login', 'parent-signup'/);
  assert.match(authClientSource, /\/api\/auth\/welcome\?action=complete-google-signup/);
  assert.match(callbackSource, /'parent-signup'\]\.includes/);
  assert.match(callbackSource, /completeParentGoogleSignup\(\{ accessToken: callback\.session\.access_token \}\)/);
  assert.match(callbackSource, /user\?\.role !== 'parent'/);
  assert.match(callbackSource, /\/parents\.html#\/parent-dashboard/);
});

test('parent Google role promotion accepts only verified Google sessions and adult profiles', () => {
  assert.match(apiSource, /admin\.auth\.getUser\(match\[1\]\)/);
  assert.match(apiSource, /providers\.includes\('google'\)/);
  assert.match(apiSource, /!user\.email_confirmed_at/);
  assert.match(apiSource, /profile\.role !== 'adult'/);
  assert.match(apiSource, /\.update\(\{ role: 'parent'/);
  assert.match(apiSource, /profile\.role === 'parent'/);
});

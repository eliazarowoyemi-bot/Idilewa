import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const authDialogSource = await readFile(new URL('../src/authDialog.js', import.meta.url), 'utf8');
const authDialogStyleSource = await readFile(new URL('../src/authDialog.css', import.meta.url), 'utf8');
const authClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const callbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../src/server/educatorVerifyInvite.js', import.meta.url), 'utf8');
const migrationSource = await readFile(new URL('../supabase/migrations/20261126141500_open_educator_registration.sql', import.meta.url), 'utf8');

test('tutor signup uses the shared responsive popup and Idilewa visual identity', () => {
  assert.match(authDialogSource, /<dialog class="id-auth-dialog"/);
  assert.match(authDialogSource, /<h2>Bring your language closer\.<\/h2>/);
  assert.match(authDialogSource, /A brass desk lamp with a pull cord/);
  assert.match(authDialogSource, /Create your tutor account/);
  assert.doesNotMatch(authDialogSource, /Educator invitation code|one-time invitation/);
  assert.match(authDialogStyleSource, /#1b4332/);
  assert.match(authDialogStyleSource, /@media \(max-width: 900px\)/);
  assert.match(authDialogStyleSource, /@media \(max-width: 560px\)/);
  assert.doesNotMatch(appSource, /renderTutorAuth|data-form="tutor-(?:login|signup)"/);
});

test('tutor account pages offer Google sign-in and open Google registration', () => {
  assert.match(authDialogSource, /data-auth-google-action="\$\{signup \? 'signup' : 'signin'\}"/);
  assert.match(authDialogSource, /data-google-required required/);
  assert.match(authDialogSource, /beginEducatorGoogleSignup\(\{/);
  assert.match(authDialogSource, /returnToHomepage: state\.returnToHomepage/);
  assert.match(authClientSource, /await signInWithGoogle\(\{ redirectRoute: 'tutor-login', returnToHomepage \}\)/);
  assert.doesNotMatch(authDialogSource, /verifyEducatorInvite|inviteCode|id-auth-tutor-invite/);
  assert.match(authClientSource, /signInWithOAuth\(\{\s*provider: 'google'/);
  assert.doesNotMatch(authClientSource, /verifyEducatorInvite|educator_invite_id/);
  assert.match(authClientSource, /verify-invite\?action=complete-google-signup/);
});

test('Google OAuth callback completes only verified educator accounts', () => {
  assert.match(callbackSource, /getPendingEducatorGoogleSignup\(\)/);
  assert.match(callbackSource, /completeEducatorGoogleSignup\(\{/);
  assert.match(callbackSource, /user\?\.role !== 'educator'/);
  assert.match(callbackSource, /callback\.user\.role === 'educator'/);
  assert.match(callbackSource, /returnToHomepage\s*\?\s*'\/'/);
  assert.match(callbackSource, /This Google account is ready/);
  assert.match(apiSource, /user\.app_metadata\?\.providers/);
  assert.match(apiSource, /user\.email_confirmed_at/);
  assert.match(apiSource, /complete_educator_google_signup/);
  assert.match(apiSource, /safeguardingAccepted !== true/);
  assert.match(apiSource, /req\.query\?\.action === 'complete-google-signup'/);
});

test('open educator profiles retain child approval and service-only Google role promotion', () => {
  assert.match(migrationSource, /IF v_role = 'child' THEN[\s\S]*?guardian_access_requests[\s\S]*?IF NOT FOUND THEN[\s\S]*?A verified guardian approval is required/);
  assert.doesNotMatch(migrationSource, /educator_invites|educator_invite_id/);
  assert.match(migrationSource, /CREATE OR REPLACE FUNCTION public\.complete_educator_google_signup\(p_user_id UUID\)/);
  assert.match(migrationSource, /UPDATE public\.profiles[\s\S]*?SET role = 'educator'[\s\S]*?role = 'adult'/);
  assert.match(migrationSource, /REVOKE ALL ON FUNCTION public\.complete_educator_google_signup\(UUID\) FROM PUBLIC, anon, authenticated/);
  assert.match(migrationSource, /GRANT EXECUTE ON FUNCTION public\.complete_educator_google_signup\(UUID\) TO service_role/);
  assert.match(migrationSource, /complete_educator_google_signup\(p_user_id UUID, p_invite_id UUID\)[\s\S]*?RETURN public\.complete_educator_google_signup\(p_user_id\)/);
  assert.match(migrationSource, /GRANT EXECUTE ON FUNCTION public\.complete_educator_google_signup\(UUID, UUID\) TO service_role/);
});

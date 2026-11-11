import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const authClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const callbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');
const apiSource = await readFile(new URL('../api/educator/verify-invite.js', import.meta.url), 'utf8');
const migrationSource = await readFile(new URL('../supabase/migrations/20261111000000_educator_google_signup.sql', import.meta.url), 'utf8');

test('tutor signup uses the exact supplied artwork and matches the reference content', async () => {
  const markup = appSource.match(/<aside class="tutor-signup-intro">([\s\S]*?)<\/aside>/)?.[1] || '';
  const image = await readFile(new URL('../public/assets/tutor-signup-happy-toon.webp', import.meta.url));

  assert.match(markup, /A personal way to learn, wherever you are/);
  assert.match(markup, /A brighter way<br \/><em>to learn together\.<\/em>/);
  assert.match(markup, /Connect with expert tutors in languages, Mathematics and more/);
  assert.match(markup, /src="\/assets\/tutor-signup-happy-toon\.webp"/);
  assert.match(markup, /Live Zoom lessons/);
  assert.match(markup, /Parent dashboards/);
  assert.deepEqual([...image.subarray(0, 4)], [0x52, 0x49, 0x46, 0x46]);
  assert.equal(image.toString('ascii', 8, 12), 'WEBP');
});

test('tutor account pages offer Google sign-in and invite-gated Google registration', () => {
  assert.match(appSource, /data-action="\$\{signup \? 'tutor-google-signup' : 'tutor-google-login'\}"/);
  assert.match(appSource, /case 'tutor-google-login'/);
  assert.match(appSource, /case 'tutor-google-signup'/);
  assert.match(appSource, /data-google-required required/);
  assert.match(appSource, /beginEducatorGoogleSignup\(\{/);
  assert.match(authClientSource, /signInWithOAuth\(\{\s*provider: 'google'/);
  assert.match(authClientSource, /verifyEducatorInvite\(inviteCode\)/);
  assert.match(authClientSource, /verify-invite\?action=complete-google-signup/);
});

test('Google OAuth callback completes only verified educator accounts', () => {
  assert.match(callbackSource, /getPendingEducatorGoogleSignup\(\)/);
  assert.match(callbackSource, /completeEducatorGoogleSignup\(\{/);
  assert.match(callbackSource, /user\?\.role !== 'educator'/);
  assert.match(callbackSource, /callback\.user\.role === 'educator'/);
  assert.match(callbackSource, /This Google account is ready/);
  assert.match(apiSource, /user\.app_metadata\?\.providers/);
  assert.match(apiSource, /user\.email_confirmed_at/);
  assert.match(apiSource, /complete_educator_google_signup/);
  assert.match(apiSource, /safeguardingAccepted !== true/);
  assert.match(apiSource, /req\.query\?\.action === 'complete-google-signup'/);
});

test('Google educator invitation redemption is atomic and service-role only', () => {
  assert.match(migrationSource, /WHERE id = p_invite_id[\s\S]*?redeemed_by IS NULL[\s\S]*?redeemed_at IS NULL/);
  assert.match(migrationSource, /UPDATE public\.profiles[\s\S]*?SET role = 'educator'[\s\S]*?role = 'adult'/);
  assert.match(migrationSource, /REVOKE ALL ON FUNCTION public\.complete_educator_google_signup\(UUID, UUID\) FROM PUBLIC, anon, authenticated/);
  assert.match(migrationSource, /GRANT EXECUTE ON FUNCTION public\.complete_educator_google_signup\(UUID, UUID\) TO service_role/);
  assert.match(migrationSource, /'educator_connection_decision_ip', 'auth_email_code', 'auth_email_code_ip'/);
});

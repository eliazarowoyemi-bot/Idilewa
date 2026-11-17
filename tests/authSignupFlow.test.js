import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const supabaseClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');

test('family signup collects parent details and consent flows land on the signup screen', () => {
  assert.match(appSource, /data-form="parent-auth" data-mode="\$\{signup \? 'signup' : 'signin'\}"/);
  assert.match(appSource, /<label>Full Name<input name="name" autocomplete="name"/);
  assert.match(appSource, /<label>Phone Number<input name="phone" type="tel"/);
  assert.match(appSource, /Use 12 or more characters, including uppercase and lowercase letters, a number and a symbol\./);
  assert.match(appSource, /if \(mode === 'signup'\) \{/);
  assert.match(appSource, /role: 'parent',\s*redirectRoute: 'parent-dashboard'/);
  assert.match(appSource, /case 'consent-signup': navigate\('parent-signup'\); break;/);
  assert.match(appSource, /Create Parent Account/);
  assert.doesNotMatch(appSource, /renderLogin\(|modern-auth/);
});

test('signup handles both immediate sessions and confirmation-required accounts', async () => {
  assert.match(appSource, /if \(!session\) \{[\s\S]*?Account created\. Confirm your email/);
  assert.doesNotMatch(appSource, /await signOutAccount\(\{ notify: false \}\)/);
  assert.match(supabaseClientSource, /confirmationRequired: !data\.session/);
  assert.match(supabaseClientSource, /emailRedirectTo: new URL\('\/auth-callback\.html\?next=index'/);
  assert.match(await readFile(new URL('../auth-callback.html', import.meta.url), 'utf8'), /src="\.\/src\/authCallback\.js"/);
  assert.match(await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8'), /\[auth\.email\]\s*enable_confirmations = true/);
  assert.match(supabaseClientSource, /export async function resendSignupConfirmation\(email\)/);
  assert.doesNotMatch(appSource, /data-action="resend-signup-confirmation"/);
});

test('auth callback exchanges confirmation sessions and safely routes recovery', async () => {
  const callbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');
  const viteConfigSource = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
  assert.match(supabaseClientSource, /exchangeCodeForSession\(code\)/);
  assert.match(supabaseClientSource, /export async function restoreAuthSession\(\)/);
  assert.match(callbackSource, /callback\?\.type === 'recovery'/);
  assert.match(callbackSource, /updateAccountPassword\(password\)/);
  assert.match(callbackSource, /includes\(next \|\| ''\)/);
  assert.match(callbackSource, /destination === 'tutor-login'\s*\? '\/educator-portal\.html#\/tutor-login'/);
  assert.match(viteConfigSource, /'auth-callback'/);
});

test('homepage hero and language cards use their supplied images in language order', async () => {
  assert.match(appSource, /src="\/assets\/home-family-learning\.jpg"/);
  assert.match(appSource, /src="\/assets\/\$\{language\.image\}"/);
  assert.match(appSource, /src="\/assets\/story-grandmother\.jpg"/);
  assert.doesNotMatch(appSource, /home-hero-illustration\.svg|home-hero-art-label/);
  assert.match(appSource, /id: 'yoruba', name: 'Yorùbá'[^\\n]*image: 'child-language-yoruba\.jpg'/);
  assert.match(appSource, /id: 'igbo', name: 'Igbo'[^\\n]*image: 'child-language-igbo\.jpg'/);
  assert.match(appSource, /id: 'hausa', name: 'Hausa'[^\\n]*image: 'child-language-hausa\.jpg'/);
  assert.match(appSource, /id: 'swahili', name: 'Kiswahili'[^\\n]*image: 'child-language-swahili\.jpg'/);
  const photo = await readFile(new URL('../public/assets/home-family-learning.jpg', import.meta.url));
  assert.deepEqual([...photo.subarray(0, 2)], [0xff, 0xd8]);
  for (const name of ['yoruba', 'igbo', 'hausa', 'swahili']) {
    const languageImage = await readFile(new URL(`../public/assets/child-language-${name}.jpg`, import.meta.url));
    assert.deepEqual([...languageImage.subarray(0, 2)], [0xff, 0xd8]);
  }
});

test('parent sign-in is password-based on the family auth screen', () => {
  assert.doesNotMatch(appSource, /request-signin-otp|resend-signup-otp|signup-otp|request-child-signin-code/);
  assert.match(appSource, /await signInAccount\(\{ email, password, expectedRole: 'parent' \}\)/);
  assert.match(supabaseClientSource, /expectedRole === 'adult' && \['parent', 'educator'\]\.includes\(userRecord\.role\)/);
  assert.match(supabaseClientSource, /if \(expectedRole && userRecord\.role !== expectedRole\s*&& !\(expectedRole === 'adult' && \['parent', 'educator'\]\.includes\(userRecord\.role\)\)\)/);
  assert.match(supabaseClientSource, /Email codes are only available for child sign-in and password recovery/);
  assert.match(supabaseClientSource, /requestAuthEmailCode\(email, purpose === 'password-reset' \? 'recovery' : purpose\)/);
});

test('legacy login routes redirect to the family auth screens', () => {
  assert.match(appSource, /const entryPage = defaultPage === 'login' \? 'parent-login' : defaultPage;/);
  assert.match(appSource, /page = params\.mode === 'signup' \? 'parent-signup' : 'parent-login';/);
  assert.match(appSource, /if \(route === 'login'\) route = params\.mode === 'signup' \? 'parent-signup' : 'parent-login';/);
  assert.match(appSource, /if \(page === 'parent-login'\) return renderParentAuth\(false\);/);
  assert.match(appSource, /if \(page === 'parent-signup'\) return renderParentAuth\(true\);/);
  assert.doesNotMatch(appSource, /case 'login':/);
});

test('family auth screens keep their heading, email label and form mode in sync', () => {
  assert.match(appSource, /<h1>\$\{signup \? 'Create Parent Account' : 'Parent Login'\}<\/h1>/);
  assert.match(appSource, /<label>Email Address<input id="authEmail" name="email" type="email" autocomplete="email"/);
  assert.match(appSource, /data-mode="\$\{signup \? 'signup' : 'signin'\}"/);
  assert.doesNotMatch(appSource, /forgot-link|form-label-row|authPageHeading/);
});

test('family sign-in errors render inline above the submit button', () => {
  assert.match(appSource, /<p class="family-auth-error" role="alert" hidden><\/p>/);
  assert.match(appSource, /errorElement\.hidden = false;/);
  assert.match(appSource, /Your parent account could not be verified\./);
  assert.doesNotMatch(appSource, /id="authInlineError"/);
});

test('sign-in and sign-out activity emails are sent without blocking local logout', () => {
  assert.match(appSource, /await sendAuthActivityEmail\('sign-in'\)/);
  assert.match(supabaseClientSource, /body: JSON\.stringify\(\{ event: 'sign-out' \}\)/);
  assert.match(supabaseClientSource, /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
  assert.match(supabaseClientSource, /return \{\s*signedOut: true,\s*activityEmailError:/);
  assert.doesNotMatch(supabaseClientSource, /if \(activityEmailError\) \{\s*throw new Error\('You are signed out/);
});

test('sign-out clears pending verification and recovery steps before returning to family sign-in', () => {
  assert.match(appSource, /function clearPendingAuthFlow\(\) \{[\s\S]*?idilewa-pending-signup-email[\s\S]*?idilewa-pending-signin-otp[\s\S]*?idilewa-password-reset-verified[\s\S]*?idilewa-guardian-signup/);
  assert.match(appSource, /case 'account-sign-out':\s*case 'profile-sign-out':\s*const authStorageError = clearPendingAuthFlow\(\);\s*void signOutAccount\(\)\.then/);
  assert.match(appSource, /navigate\(parseLocation\(\)\.page\.startsWith\('tutor'\) \? 'tutor-login' : 'parent-login', \{\}, true\);/);
});

test('sign-out clears the current device session without relying on global logout', () => {
  assert.match(supabaseClientSource, /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
});

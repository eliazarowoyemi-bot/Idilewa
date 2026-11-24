import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const supabaseClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const authDialogSource = await readFile(new URL('../src/authDialog.js', import.meta.url), 'utf8');
const childSignupSource = await readFile(new URL('../kids-signup.html', import.meta.url), 'utf8');

test('parent, tutor, and child flows share the popup while child profiles remain guardian-managed', () => {
  assert.match(authDialogSource, /<dialog class="id-auth-dialog"/);
  assert.match(authDialogSource, /event\.key === 'Escape' && dialog\.open[\s\S]*?dialog\.close\('dismissed'\)/);
  assert.match(authDialogSource, /data-auth-form="parent"/);
  assert.match(authDialogSource, /data-auth-form="tutor"/);
  assert.match(authDialogSource, /function childForm\(\)/);
  assert.match(authDialogSource, /A verified parent account manages the profile and confirms consent/);
  assert.match(authDialogSource, /\/api\/guardian\/children/);
  assert.match(authDialogSource, /consent: formData\.get\('consent'\) === 'on'/);
  assert.doesNotMatch(childSignupSource, /<form[^>]*action="\/api\/guardian\/children"/);
  assert.match(childSignupSource, /src="\/src\/authDialog\.js"/);
  assert.match(authDialogSource, /if \(role === 'parent' && mode === 'signup'\)/);
  assert.match(authDialogSource, /role: 'parent',\s*redirectRoute: 'parent-dashboard'/);
  assert.match(appSource, /case 'consent-signup': navigate\('parent-signup'\); break;/);
  assert.doesNotMatch(appSource, /data-form="parent-auth"/);
  assert.doesNotMatch(appSource, /renderTutorAuth|data-form="tutor-(?:login|signup)"/);
  assert.doesNotMatch(appSource, /renderLogin\(|modern-auth/);
});

test('signup handles both immediate sessions and confirmation-required accounts', async () => {
  assert.match(authDialogSource, /if \(!session\) \{\s*setConfirmation/);
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
  assert.match(authDialogSource, /await signIn\(\{ email, password, expectedRole \}\)/);
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
  assert.match(authDialogSource, /id-auth-dialog-title/);
  assert.match(authDialogSource, /id="id-auth-parent-email" name="email" type="email"/);
  assert.match(authDialogSource, /data-auth-form="parent" data-mode="\$\{state\.mode\}"/);
  assert.match(appSource, /return renderAuthRoutePlaceholder\('parent', signup \? 'signup' : 'signin'\)/);
  assert.doesNotMatch(appSource, /forgot-link|form-label-row|authPageHeading/);
});

test('family sign-in errors render inline above the submit button', () => {
  assert.match(authDialogSource, /data-auth-feedback role="\$\{feedback\?\.kind === 'error' \? 'alert' : 'status'\}"/);
  assert.match(authDialogSource, /Your account could not be verified\. Please try again\./);
  assert.doesNotMatch(appSource, /id="authInlineError"/);
});

test('sign-in and sign-out activity emails are sent without blocking local logout', () => {
  assert.match(authDialogSource, /await sendAuthActivityEmail\('sign-in'\)/);
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

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const supabaseClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');

test('signup offers adult accounts without guardian consent and retains child approval', () => {
  assert.match(appSource, /data-role="adult"[^>]*role="radio" aria-checked=/);
  assert.match(appSource, /Adult accounts do not need parent or guardian approval, but must confirm their email/);
  assert.match(appSource, /const accountType = data\.get\('accountType'\) === 'adult' \? 'adult' : 'child';/);
  assert.match(appSource, /accountType === 'child'\s*&&\s*\(!verifiedGuardianSignup/);
  assert.match(appSource, /!signUp \|\| !isChild \|\| verifiedGuardianSignup/);
  assert.match(appSource, /Create Adult Learning Space/);
});

test('signup handles both immediate sessions and confirmation-required accounts', async () => {
  assert.match(appSource, /if \(!session\) \{[\s\S]*?Account created\. Check your email to confirm it; the link will return you to Idilewa\./);
  assert.doesNotMatch(appSource, /await signOutAccount\(\{ notify: false \}\)/);
  assert.match(supabaseClientSource, /confirmationRequired: !data\.session/);
  assert.match(supabaseClientSource, /emailRedirectTo: new URL\('\/auth-callback\.html\?next=index'/);
  assert.match(await readFile(new URL('../auth-callback.html', import.meta.url), 'utf8'), /src="\.\/src\/authCallback\.js"/);
  assert.match(await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8'), /\[auth\.email\]\s*enable_confirmations = true/);
  assert.match(supabaseClientSource, /export async function resendSignupConfirmation\(email\)/);
  assert.match(appSource, /data-action="resend-signup-confirmation"/);
});

test('auth callback exchanges confirmation sessions and safely routes recovery', async () => {
  const callbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');
  const viteConfigSource = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
  assert.match(supabaseClientSource, /exchangeCodeForSession\(code\)/);
  assert.match(supabaseClientSource, /export async function restoreAuthSession\(\)/);
  assert.match(callbackSource, /callback\?\.type === 'recovery'/);
  assert.match(callbackSource, /updateAccountPassword\(password\)/);
  assert.match(callbackSource, /includes\(next \|\| ''\)/);
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

test('adult sign-in is password-based and child sign-in uses a parent-issued passcode', () => {
  assert.doesNotMatch(appSource, /request-signin-otp|resend-signup-otp|signup-otp/);
  assert.match(appSource, /data-action="request-child-signin-code"/);
  assert.match(appSource, /requestSigninOtp\(email, 'child-signin'\)/);
  assert.match(appSource, /expectedRole: purpose === 'child-signin' \? 'child'/);
  assert.match(appSource, /signInAccount\(\{ email, password, expectedRole: 'adult' \}\)/);
  assert.match(supabaseClientSource, /expectedRole === 'adult' && \['parent', 'educator'\]\.includes\(userRecord\.role\)/);
  assert.match(supabaseClientSource, /if \(expectedRole && userRecord\.role !== expectedRole\s*&& !\(expectedRole === 'adult' && \['parent', 'educator'\]\.includes\(userRecord\.role\)\)\)/);
  assert.match(supabaseClientSource, /Email codes are only available for child sign-in and password recovery/);
  assert.match(supabaseClientSource, /requestAuthEmailCode\(email, purpose === 'password-reset' \? 'recovery' : purpose\)/);
});

test('direct sign-in and signup routes default to the adult email-and-password flow', () => {
  assert.match(appSource, /authRole: stored\.authRole === 'child' \? 'child' : 'adult'/);
  assert.match(appSource, /if \(defaultPage === 'login' && !defaultAuthEntryInitialized\) \{\s*state\.loginMode = 'signin';\s*state\.authRole = 'adult';/);
  assert.match(appSource, /if \(page === 'login' && \['signin', 'signup'\]\.includes\(params\.mode\)\) \{\s*state\.loginMode = params\.mode;\s*state\.authRole = 'adult';/);
});

test('invalid password sign-in displays guidance inline instead of an overlapping toast', () => {
  assert.match(appSource, /id="authInlineError" class="auth-inline-error" role="alert"/);
  assert.match(appSource, /We couldn’t sign you in with those details\.[\s\S]*?inlineError\.hidden = false/);
});

test('sign-in and sign-out activity emails are sent without blocking local logout', () => {
  assert.match(appSource, /await sendAuthActivityEmail\('sign-in'\)/);
  assert.match(supabaseClientSource, /body: JSON\.stringify\(\{ event: 'sign-out' \}\)/);
  assert.match(appSource, /requestSigninOtp\(email, 'password-reset'\)/);
  assert.match(supabaseClientSource, /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
  assert.match(supabaseClientSource, /return \{\s*signedOut: true,\s*activityEmailError:/);
  assert.doesNotMatch(supabaseClientSource, /if \(activityEmailError\) \{\s*throw new Error\('You are signed out/);
});

test('sign-out clears pending verification and recovery steps before returning to sign-in', () => {
  assert.match(appSource, /function clearPendingAuthFlow\(\) \{[\s\S]*?pendingSignupEmail = '';[\s\S]*?pendingSignin = null;[\s\S]*?passwordResetVerified = false;[\s\S]*?idilewa-pending-signup-email[\s\S]*?idilewa-pending-signin-otp[\s\S]*?idilewa-password-reset-verified/);
  assert.match(appSource, /case 'account-sign-out':\s*case 'profile-sign-out':\s*const authStorageError = clearPendingAuthFlow\(\);\s*void signOutAccount\(\)\.then/);
  assert.match(appSource, /catch\(\(error\) => \{\s*state\.loginMode = 'signin';\s*state\.authRole = 'adult';\s*navigate\(parseLocation\(\)\.page\.startsWith\('tutor'\) \? 'tutor-login' : 'login', parseLocation\(\)\.page\.startsWith\('tutor'\) \? \{\} : \{ mode: 'signin' \}, true\);/);
});

test('sign-out clears the current device session without relying on global logout', () => {
  assert.match(supabaseClientSource, /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
});

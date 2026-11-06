import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
import test from 'node:test';

register('./support/assetLoader.js', import.meta.url);

const { LEVELS, defaultState, store } = await import('../src/studio/store.js');
const { RAIL_LINKS, TABS } = await import('../src/studio/ui.js');

const home = await import('../src/studio/pages/home.js');
const voice = await import('../src/studio/pages/voice.js');
const tonalLab = await import('../src/studio/pages/tonalLab.js');
const code = await import('../src/studio/pages/code.js');
const aiSpeak = await import('../src/studio/pages/aiSpeak.js');
const mentors = await import('../src/studio/pages/mentors.js');
const guardian = await import('../src/studio/pages/guardian.js');
const checkout = await import('../src/studio/pages/checkout.js');
const profile = await import('../src/studio/pages/profile.js');
const auth = await import('../src/studio/pages/auth.js');

const studioIndex = await readFile(new URL('../src/studio/index.js', import.meta.url), 'utf8');
const designCss = await readFile(new URL('../src/studio/design.css', import.meta.url), 'utf8');
const studioHtml = await readFile(new URL('../studio.html', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');

const PAGES = { home, voice, lab: tonalLab, code, speak: aiSpeak, mentors, guardian, checkout, profile, auth };

function stubCtx() {
  const state = defaultState();
  return {
    state,
    store,
    level: { current: LEVELS[0], next: LEVELS[1], pct: 42, xp: state.xp },
    toast: () => {},
    modal: () => {},
    nav: () => {},
    rerender: () => {},
  };
}

test('every studio page renders real markup from the shared state', () => {
  for (const [name, page] of Object.entries(PAGES)) {
    assert.equal(typeof page.render, 'function', `${name} must export render(ctx)`);
    assert.equal(typeof page.mount, 'function', `${name} must export mount(root, ctx)`);

    const html = page.render(stubCtx());
    assert.equal(typeof html, 'string');
    assert.ok(html.length > 400, `${name}.render() should produce a full screen`);
    assert.doesNotMatch(html, /undefined|NaN|\[object Object\]/, `${name}.render() leaks an empty value`);
    assert.match(html, /class="cs-/, `${name}.render() should use the cs- design system`);
  }
});

test('the studio router covers every rail link and bottom tab', () => {
  const routes = studioIndex.match(/const ROUTES = \{([\s\S]*?)\n\};/)?.[1] || '';
  const ids = new Set([...routes.matchAll(/^\s{2}([a-z]+):/gm)].map((match) => match[1]));

  for (const link of RAIL_LINKS) assert.ok(ids.has(link.id), `missing route for ${link.id}`);
  for (const tab of TABS) assert.ok(ids.has(tab.id), `missing route for tab ${tab.id}`);
});

test('the studio shell wires the security, store and design layers together', () => {
  assert.match(studioIndex, /store\.init\(\)/);
  assert.match(studioIndex, /vault\.unlock\(\)/);
  assert.match(studioIndex, /guardContent\(shellRoot\)/);
  assert.match(studioIndex, /store\.subscribe\(/);
  assert.match(studioIndex, /document\.getElementById\('studio-root'\)/);
  assert.match(studioIndex, /hashchange/);
  assert.match(studioHtml, /id="studio-root"/);
  assert.match(studioHtml, /src="\.\/src\/studio\/index\.js"/);
  assert.match(viteConfig, /'studio'/);
});

test('auth and checkout primitives ship with styles', () => {
  for (const selector of [
    '.cs-auth',
    '.cs-role',
    '.cs-otp__box',
    '.cs-passkey-grid',
    '.cs-steps',
    '.cs-plan__list',
    '.cs-summary',
    '.cs-channel',
    '.cs-escrow',
    '.cs-or',
    '.cs-resend',
    '.cs-hint',
    '.cs-error',
    '.cs-metrics',
    '.cs-step',
  ]) {
    assert.ok(designCss.includes(selector), `design.css is missing ${selector}`);
  }
});

const authSource = await readFile(new URL('../src/studio/pages/auth.js', import.meta.url), 'utf8');
const checkoutSource = await readFile(new URL('../src/studio/pages/checkout.js', import.meta.url), 'utf8');

test('the auth wizard drives Supabase OTP with a demo fallback', () => {
  assert.match(authSource, /requestSigninOtp|verifySigninOtp|signIn/);
  assert.match(authSource, /isSupabaseConfigured/);
  assert.match(authSource, /wireDigits|data-digit/);
  assert.match(authSource, /guest/i);
  assert.match(authSource, /isSignupPasswordValid/);
  assert.match(authSource, /inputmode="numeric"/);
  assert.match(authSource, /autocomplete="one-time-code"/);
});

test('checkout prices the family plan with 7.5% VAT and a KoraPay reference', () => {
  const html = checkout.render(stubCtx());
  assert.match(html, /48,000/);
  assert.match(html, /7\.5%|VAT/);
  assert.match(html, /KoraPay/);
  assert.match(checkoutSource, /IDL-/);
  assert.match(checkoutSource, /passcode/i);
  assert.match(checkoutSource, /1\.075/);
});

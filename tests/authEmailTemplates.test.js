import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const templateNames = ['confirmation', 'magic_link', 'recovery', 'email_change'];

test('authentication templates are Idilewa branded and retain their required Supabase variables', async () => {
  for (const name of templateNames) {
    const template = await readFile(new URL(`../supabase/templates/${name}.html`, import.meta.url), 'utf8');
    assert.match(template, /Idilewa/);
    assert.match(template, /<!doctype html>/i);
    if (name === 'confirmation') {
      assert.match(template, /{{ \.ConfirmationURL }}/);
    } else {
      assert.match(template, /{{ \.Token }}/);
      assert.match(template, /{{ \.ConfirmationURL }}/);
    }
  }
});

test('signup requires email confirmation and the frontend has no signup code step', async () => {
  const template = await readFile(new URL('../supabase/templates/confirmation.html', import.meta.url), 'utf8');
  const config = await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(config, /^\[auth\.email\]\s*[\s\S]*?^enable_confirmations = true$/m);
  assert.doesNotMatch(app, /signup-otp|verifySignupOtp|resendSignupOtp/);
  assert.match(template, /{{ \.ConfirmationURL }}/);
  assert.match(app, /data-action="resend-signup-confirmation"/);
  assert.match(template, /https:\/\/www\.idilewa\.com\/assets\/idilewa-email-logo\.png\?v=2/);
  assert.match(template, /alt="Idilewa — Language · culture · future"/);
  assert.doesNotMatch(template, /LANGUAGE · CULTURE · CURIOSITY|>È<\/td>/);
});

test('email logo is a real PNG that can be served from public assets', async () => {
  const logo = await readFile(new URL('../public/assets/idilewa-email-logo.png', import.meta.url));
  assert.deepEqual([...logo.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(logo.readUInt32BE(16), 762);
  assert.equal(logo.readUInt32BE(20), 192);
});

test('Supabase project config deploys all four branded authentication templates', async () => {
  const config = await readFile(new URL('../supabase/config.toml', import.meta.url), 'utf8');
  assert.match(config, /^\[auth\.email\]\s*[\s\S]*?^enable_confirmations = true$/m);
  for (const name of templateNames) {
    assert.match(config, new RegExp(`\\[auth\\.email\\.template\\.${name}\\]`));
    assert.match(config, new RegExp(`content_path = \"\\./supabase/templates/${name}\\.html\"`));
  }
});

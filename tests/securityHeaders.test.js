import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const vercel = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'));

function headerValue(source, key) {
  const block = (vercel.headers || []).find((entry) => entry.source === source);
  return block?.headers.find((header) => header.key.toLowerCase() === key.toLowerCase())?.value || '';
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

test('transport and framing headers are hardened for every route', () => {
  assert.equal(headerValue('/(.*)', 'Strict-Transport-Security'), 'max-age=63072000; includeSubDomains; preload');
  assert.equal(headerValue('/(.*)', 'X-Content-Type-Options'), 'nosniff');
  assert.equal(headerValue('/(.*)', 'X-Frame-Options'), 'DENY');
  assert.equal(headerValue('/(.*)', 'Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.match(headerValue('/(.*)', 'Permissions-Policy'), /microphone=\(self\)/);
  assert.match(headerValue('/(.*)', 'Permissions-Policy'), /camera=\(\)/);
  assert.equal(headerValue('/(.*)', 'Cross-Origin-Opener-Policy'), 'same-origin-allow-popups');
});

test('the STEM Studio ships a strict policy that matches its own markup', () => {
  const studioPolicy = headerValue('/studio', 'Content-Security-Policy');
  const studioHtmlPolicy = headerValue('/studio.html', 'Content-Security-Policy');
  assert.ok(studioPolicy, 'studio CSP should exist');
  assert.equal(studioHtmlPolicy, studioPolicy, 'both studio entry points should share one policy');

  const directives = Object.fromEntries(
    studioPolicy.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const [name, ...values] = part.split(/\s+/);
      return [name, values];
    })
  );

  assert.deepEqual(directives['default-src'], ["'self'"]);
  assert.deepEqual(directives['script-src'], ["'self'"]);
  assert.ok(!directives['script-src'].includes("'unsafe-inline'"), 'studio must not allow inline scripts');
  assert.ok(!directives['script-src'].includes("'unsafe-eval'"), 'studio must not allow eval');
  assert.deepEqual(directives['object-src'], ["'none'"]);
  assert.deepEqual(directives['frame-ancestors'], ["'none'"]);
  assert.deepEqual(directives['form-action'], ["'self'"]);
  assert.deepEqual(directives['base-uri'], ["'self'"]);
  assert.ok(directives['connect-src'].some((value) => value.includes('supabase.co')), 'studio must reach Supabase');
  assert.ok(directives['font-src'].includes('https://fonts.gstatic.com'));
});

test('studio sources stay compatible with the strict policy', () => {
  const files = walk(join(repoRoot, 'src', 'studio')).filter((file) => /\.(js|css)$/.test(file));
  assert.ok(files.length > 10, 'studio source tree should be present');

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /\son[a-z]+=\s*["']/i, `${file} must not use inline event handlers`);
    assert.doesNotMatch(source, /[^.\w]eval\(|new Function\(/, `${file} must not eval code`);
    assert.doesNotMatch(source, /<iframe/i, `${file} must not embed frames`);
    assert.doesNotMatch(source, /<script(?![^>]*\bsrc=)/i, `${file} must not inject inline scripts`);
  }
});

test('the studio page is a first-class vite entry point linked from the legacy shell', () => {
  const viteConfig = readFileSync(join(repoRoot, 'vite.config.js'), 'utf8');
  assert.match(viteConfig, /'studio'/);

  const studioHtml = readFileSync(join(repoRoot, 'studio.html'), 'utf8');
  assert.match(studioHtml, /src="\.\/src\/studio\/index\.js"/);
  assert.match(studioHtml, /id="studio-root"/);

  const appSource = readFileSync(join(repoRoot, 'app.js'), 'utf8');
  assert.match(appSource, /\{ label: 'STEM Studio', href: '\/studio', group: 'studio' \}/);
});

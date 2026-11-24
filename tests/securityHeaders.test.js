import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const vercel = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'));
const sitemap = readFileSync(join(repoRoot, 'public', 'sitemap.xml'), 'utf8');

function headerValue(source, key) {
  const block = (vercel.headers || []).find((entry) => entry.source === source);
  return block?.headers.find((header) => header.key.toLowerCase() === key.toLowerCase())?.value || '';
}

test('transport and framing headers allow only same-origin framing', () => {
  assert.equal(headerValue('/(.*)', 'Strict-Transport-Security'), 'max-age=63072000; includeSubDomains; preload');
  assert.equal(headerValue('/(.*)', 'X-Content-Type-Options'), 'nosniff');
  assert.equal(headerValue('/(.*)', 'Content-Security-Policy'), "frame-ancestors 'self'");
  assert.equal(headerValue('/(.*)', 'X-Frame-Options'), 'SAMEORIGIN');
  assert.equal(headerValue('/(.*)', 'Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.match(headerValue('/(.*)', 'Permissions-Policy'), /microphone=\(self\)/);
  assert.match(headerValue('/(.*)', 'Permissions-Policy'), /camera=\(\)/);
  assert.equal(headerValue('/(.*)', 'Cross-Origin-Opener-Policy'), 'same-origin-allow-popups');
});

test('retired studio and payment entry points are gone from the deployment config', () => {
  const sources = (vercel.headers || []).map((entry) => entry.source);
  assert.ok(sources.includes('/(.*)'), 'the catch-all header block should remain');
  for (const retired of ['/studio', '/studio.html', '/curriculum', '/payment']) {
    assert.equal(sources.includes(retired), false, `${retired} should no longer be served`);
  }
});

test('new learning experiences have clean production aliases and sitemap entries', () => {
  const rewrites = new Map((vercel.rewrites || []).map(({ source, destination }) => [source, destination]));

  assert.equal(rewrites.get('/code'), '/development-center');
  assert.equal(rewrites.get('/milestones'), '/milestone-achievement');
  assert.match(sitemap, /<loc>https:\/\/idilewa\.com\/code<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/idilewa\.com\/milestones<\/loc>/);
});

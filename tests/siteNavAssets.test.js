import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/siteNav.js', import.meta.url), 'utf8');

test('homepage and feature artwork use Vite-managed asset URLs', () => {
  for (const [symbol, file] of [
    ['landingHomeHero', 'landing-home-hero'],
    ['landingFeatureVoice', 'landing-feature-voice'],
    ['landingFeatureCode', 'landing-feature-code'],
    ['landingFeatureAi', 'landing-feature-ai'],
    ['landingFeatureHeritage', 'landing-feature-heritage'],
  ]) {
    assert.match(source, new RegExp(`import ${symbol}Url from '\\.\\./assets/${file}\\.webp'`));
  }

  assert.match(source, /heroIllustration\.src = landingHomeHeroUrl/);
  assert.doesNotMatch(source, /['"]\/assets\/landing-(?:home-hero|feature-(?:voice|code|ai|heritage))\.webp['"]/);
});

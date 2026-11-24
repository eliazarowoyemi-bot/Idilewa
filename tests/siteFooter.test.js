import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSiteBottomNavigationMarkup,
  createSiteFooterMarkup,
} from '../src/siteFooterMarkup.js';

test('shared footer uses the homepage brand lockup and information structure', () => {
  const footer = createSiteFooterMarkup();

  assert.match(footer, /src="\/assets\/idilewa-mark\.png"/);
  assert.match(footer, /Ìdíléwa<\/strong><small>Our Language\. Our Future\./);
  assert.doesNotMatch(footer, /class="idilewa-brand-lockup" aria-hidden="true"/);
  assert.match(footer, /About Us[\s\S]*Quick Links[\s\S]*Get Connected/);
  assert.match(footer, /Social profile links will be added when verified/);
  assert.match(footer, /Start Learning Now/);
  assert.doesNotMatch(footer, /🌳/);
});

test('shared footer delegates app routes while keeping static-page fallbacks', () => {
  const footer = createSiteFooterMarkup((item, fallback) => (
    item.key === 'home' ? '<a href="#/index" data-route="index">Home</a>' : fallback(item)
  ));

  assert.match(footer, /href="#\/index" data-route="index"/);
  assert.match(footer, /href="\/faq\.html"/);
  assert.match(footer, /href="\/development-center\.html"/);
  assert.match(footer, /href="\/parents\.html#\/privacy"/);
});

test('mobile primary navigation has four labelled destinations and one current page', () => {
  const navigation = createSiteBottomNavigationMarkup('explore');
  const links = [...navigation.matchAll(/<a class="idilewa-mobile-tab[^"]*" href="([^"]+)"([^>]*)>/g)];

  assert.equal(links.length, 4);
  assert.match(navigation, /aria-label="Primary navigation"/);
  assert.match(navigation, /href="\/voice_lessons\.html"/);
  assert.match(navigation, /href="\/heritage-library"/);
  assert.match(navigation, /href="\/profile\.html"/);
  assert.match(navigation, /href="\/parents\.html#\/parent-login"/);
  assert.equal(links.filter(([, , attributes]) => attributes.includes('aria-current="page"')).length, 1);
  assert.match(navigation, /Explore<\/span>/);
});

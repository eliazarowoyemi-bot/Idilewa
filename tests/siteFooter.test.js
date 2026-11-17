import assert from 'node:assert/strict';
import test from 'node:test';
import { createSiteFooterMarkup } from '../src/siteFooterMarkup.js';

test('shared footer uses the canonical leaf wordmark and homepage information structure', () => {
  const footer = createSiteFooterMarkup();

  assert.match(footer, /class="idilewa-footer-logo" src="\/assets\/idilewa-email-logo\.png"/);
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

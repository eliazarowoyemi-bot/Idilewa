import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { searchFaq, searchSupportKnowledge } from '../src/supportAssistantSearch.js';
import { supportFaqKnowledge, supportPageKnowledge } from '../src/supportAssistantKnowledge.js';

test('local FAQ search matches accents and returns the relevant product route', () => {
  const results = searchFaq('Which languages can I learn?');
  const [result] = searchFaq('Does the academy teach Kiswahili?');

  assert.equal(result.question, 'Which languages does the Language Academy cover?');
  assert.equal(result.url, '/?view=academy');
  assert.equal(results.length, 1);
  assert.equal(results[0].url, '/?view=academy');
  assert.match(result.answer, /Yorùbá, Igbo, Hausa, and Kiswahili/);
  assert.match(result.answer, /Nigerian Pidgin is available in AI Conversation/);
});

test('local FAQ search prioritizes language coverage for a named language', () => {
  const [result] = searchFaq('Can I learn Yoruba?');

  assert.equal(result.question, 'Which languages does the Language Academy cover?');
  assert.equal(result.url, '/?view=academy');
});

test('local FAQ search returns grounded answers about tutor booking and family approvals', () => {
  const tutorResults = searchFaq('Can I book an online tutor?');
  const familyResults = searchFaq('Do family task points need parent approval?');
  const pricingResults = searchFaq('Is Ìdíléwa free to use?');
  const planResults = searchFaq('Do I have to pay for a Family plan?');

  assert.ok(tutorResults.some((result) => result.answer.includes('not currently enabled')));
  assert.ok(familyResults.some((result) => result.answer.includes('points are added only after parent approval')));
  assert.ok(pricingResults.some((result) => result.answer.includes('All current learning plans are free')));
  assert.ok(pricingResults.some((result) => result.url === '/pricing.html'));
  assert.ok(planResults.some((result) => result.answer.includes('no paid plans at present')));
});

test('local FAQ search returns no answer when the maintained dataset has no relevant match', () => {
  assert.deepEqual(searchFaq('quantum payroll forecasting'), []);
});

test('site knowledge search returns sources across a multi-part Idilewa question', () => {
  const results = searchSupportKnowledge(
    'How can my child learn Yoruba, practise speaking, and explore coding?',
    10,
  );
  const titles = results.map((result) => result.title);

  assert.ok(titles.includes('Language Academy'));
  assert.ok(titles.includes('Voice Lessons and pronunciation'));
  assert.ok(titles.includes('Code Playground and Development Center'));
  assert.ok(results.every((result) => result.url.startsWith('/')));
});

test('site knowledge search avoids unrelated pages on broad family questions', () => {
  const results = searchSupportKnowledge('How can my family get started?');
  const urls = results.map((result) => result.url);

  assert.ok(urls.includes('/'));
  assert.ok(urls.includes('/about'));
  assert.ok(!urls.includes('/family-tasks'));
});

test('multi-part language questions include the matching Pidgin tools without unrelated pages', () => {
  const results = searchSupportKnowledge(
    'Which languages are currently highlighted in the Language Academy, and where can I use Nigerian Pidgin?',
  );
  const titles = results.map((result) => result.title);
  const academyFaq = supportFaqKnowledge.find(
    ({ title }) => title === 'Which languages does the Language Academy cover?',
  );

  assert.ok(titles.includes('Language Academy'));
  assert.ok(titles.includes('AI Conversation'));
  assert.ok(titles.includes('Speech and language tools'));
  assert.ok(!titles.includes('Can tutors help with subjects beyond languages?'));
  assert.ok(!titles.includes('Languages and courses'));
  assert.equal(academyFaq.url, '/?view=academy');
});

test('assistant uses the live AI client and accurately discloses Gemini processing', async () => {
  const assistant = await readFile(new URL('../src/supportAssistant.js', import.meta.url), 'utf8');

  assert.match(assistant, /AI guide for Idilewa/);
  assert.match(assistant, /Messages go to Gemini/);
  assert.match(assistant, /aren’t stored by Ìdíléwa/);
  assert.doesNotMatch(assistant, /not live AI|not sent to a service or saved/);
  assert.match(assistant, /sendSupportAssistantMessage/);
});

test('site knowledge includes every public sitemap route or its canonical replacement', async () => {
  const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const sitemapRoutes = [...sitemap.matchAll(/<loc>(https:\/\/idilewa\.com[^<]+)<\/loc>/g)]
    .map(([, value]) => new URL(value).pathname);
  const indexedRoutes = new Set(supportPageKnowledge.map((page) => page.url));
  const canonicalRoutes = new Map([['/trainer', '/voice_lessons']]);

  assert.ok(sitemapRoutes.length >= 20);
  assert.deepEqual(
    sitemapRoutes.filter((route) => !indexedRoutes.has(canonicalRoutes.get(route) || route)),
    [],
  );
});

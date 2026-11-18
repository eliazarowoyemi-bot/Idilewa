import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { searchFaq } from '../src/supportAssistantSearch.js';

test('local FAQ search matches accents and returns the relevant product route', () => {
  const results = searchFaq('Which languages can I learn?');
  const [result] = searchFaq('Does the academy teach Kiswahili?');

  assert.equal(result.question, 'Which languages does the Language Academy cover?');
  assert.equal(result.url, '/?view=academy');
  assert.equal(results.length, 1);
  assert.equal(results[0].url, '/?view=academy');
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

test('assistant discloses its curated scope and does not send or persist messages', async () => {
  const assistant = await readFile(new URL('../src/supportAssistant.js', import.meta.url), 'utf8');

  assert.match(assistant, /not live AI/);
  assert.match(assistant, /not sent to a service or saved/);
  assert.doesNotMatch(assistant, /fetch\s*\(|localStorage|sessionStorage|XMLHttpRequest|WebSocket/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalSupportAssistantReply } from '../src/supportAssistantLocal.js';

test('local guide answers greetings without requiring the AI service', () => {
  const result = getLocalSupportAssistantReply('Hi!');

  assert.match(result.reply, /Hello!/);
  assert.ok(result.sources.some((source) => source.url === '/faq'));
});

test('local guide gives a clear language breakdown and current availability caveat', () => {
  const result = getLocalSupportAssistantReply('Which languages can I learn?');

  assert.match(result.reply, /Yorùbá, Igbo, Hausa, and Kiswahili/);
  assert.match(result.reply, /Nigerian Pidgin/);
  assert.match(result.reply, /Availability varies by service/);
  assert.ok(result.sources.some((source) => source.url === '/?view=academy'));
});

test('local guide explains family onboarding and child approval', () => {
  const result = getLocalSupportAssistantReply('How can my family get started?');

  assert.match(result.reply, /Parent Portal/);
  assert.match(result.reply, /approval by email/);
  assert.ok(result.sources.some((source) => source.url === '/parents'));
});

test('local guide separates Code Playground from Creative Studio', () => {
  const result = getLocalSupportAssistantReply('What can I do in Code and Creative Studio?');

  assert.match(result.reply, /Code Playground:/);
  assert.match(result.reply, /Creative Studio:/);
  assert.ok(result.sources.some((source) => source.url === '/code'));
  assert.ok(result.sources.some((source) => source.url === '/creative-studio'));
});

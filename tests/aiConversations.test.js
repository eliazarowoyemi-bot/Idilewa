import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('AI Conversations registers every supplied interface as a navigable Idilewa route', () => {
  for (const route of [
    'ai-conversations', 'ai-login', 'ai-signup', 'ai-dashboard', 'ai-chat',
    'ai-everyday', 'ai-voice', 'ai-history', 'ai-analytics', 'ai-profile',
    'ai-children', 'ai-messages', 'ai-settings'
  ]) {
    assert.match(appSource, new RegExp(`'${route}'`));
    assert.match(appSource, new RegExp(`case '${route}':`));
  }
  assert.match(appSource, /label: 'AI Conversations', route: 'ai-conversations'/);
  assert.match(appSource, /data-route="ai-dashboard"/);
  assert.match(appSource, /data-route="ai-chat"/);
  assert.match(appSource, /data-route="ai-voice"/);
});

test('conversation practice, local history, account forms and voice tools are wired', () => {
  assert.match(appSource, /data-form="ai-conversation"/);
  assert.match(appSource, /data-action="ai-delete-conversation"/);
  assert.match(appSource, /data-action="ai-clear-history"/);
  assert.match(appSource, /data-action="ai-record-start"/);
  assert.match(appSource, /transcribeWithPlotweaver\(recording/);
  assert.match(appSource, /data-form="login"/);
  assert.match(appSource, /data-form="profile-settings"/);
  assert.match(appSource, /Guided practice preview · sample replies are offline, not live AI/);
  assert.match(appSource, /The chat preview does not contact a live AI service/);
});

test('AI Conversations has responsive workspace and mobile navigation layouts', () => {
  assert.match(styleSource, /\.ai-workspace\s*\{[^}]*grid-template-columns: 196px/s);
  assert.match(styleSource, /@media \(max-width: 740px\)[\s\S]*?\.ai-workspace \{ display: block; \}/);
  assert.match(styleSource, /@media \(max-width: 520px\)[\s\S]*?\.ai-language-grid \{ grid-template-columns: repeat\(2, minmax\(0,1fr\)\); \}/);
  assert.match(styleSource, /prefers-reduced-motion: reduce[\s\S]*?\.ai-button/);
});

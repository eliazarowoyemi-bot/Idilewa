import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('AI Conversations registers its supplied interfaces and workspace navigation', () => {
  for (const route of [
    'ai-conversations', 'ai-login', 'ai-signup', 'ai-dashboard', 'ai-chat',
    'ai-everyday', 'ai-voice', 'ai-history', 'ai-analytics', 'ai-profile',
    'ai-messages', 'ai-settings'
  ]) {
    assert.match(appSource, new RegExp(`'${route}'`));
    assert.match(appSource, new RegExp(`case '${route}':`));
  }
  assert.match(appSource, /label: 'AI Conversations', route: 'ai-conversations'/);
  assert.match(appSource, /route: 'ai-dashboard', label: 'Dashboard'/);
  assert.match(appSource, /data-route="\$\{item\.route\}"/);
  assert.match(appSource, /data-route="ai-chat"/);
  assert.match(appSource, /data-route="ai-voice"/);
});

test('AI Conversations removes My Children and redirects its old route to the dashboard', () => {
  const workspaceLinks = appSource.slice(appSource.indexOf('const AI_WORKSPACE_LINKS'), appSource.indexOf('const AI_WORKSPACE_ACTIVE'));
  const parentLinks = appSource.slice(appSource.indexOf('const PARENT_PORTAL_LINKS'), appSource.indexOf('const PARENT_PREFERENCES_KEY'));
  const routes = appSource.slice(appSource.indexOf('const ROUTES = ['), appSource.indexOf('const REMOVED_ROUTES'));

  assert.doesNotMatch(routes, /ai-children/);
  assert.doesNotMatch(workspaceLinks, /ai-children|My Children/);
  assert.doesNotMatch(appSource, /renderAiChildren|case 'ai-children'/);
  assert.match(appSource, /if \(page === 'ai-children'\) \{\s*page = 'ai-dashboard';\s*history\.replaceState\(null, '', `\$\{window\.location\.pathname\}\$\{window\.location\.search\}#\/ai-dashboard`\);/);
  assert.match(parentLinks, /route: 'parent-children', label: 'My Children'/);
});

test('AI Conversations opens guests directly in live, translation-backed practice', () => {
  assert.match(appSource, /if \(page === 'ai-conversations'\) return renderAiEveryday\(params\);/);
  assert.match(appSource, /<form class="ai-message-form" data-form="ai-conversation"/);
  assert.match(appSource, /translateWithPlotweaver\(\{[\s\S]*?sourceLanguage: 'en',[\s\S]*?targetLanguage: language\.speech/);
  assert.match(appSource, /Messages are sent to Plotweaver for translation/);
  assert.doesNotMatch(appSource, /renderAiLanding|Offline guided sample|pre-written prompts/);
});

test('conversation practice, local history, account forms and voice tools are wired', () => {
  assert.match(appSource, /data-form="ai-conversation"/);
  assert.match(appSource, /data-action="ai-delete-conversation"/);
  assert.match(appSource, /data-action="ai-clear-history"/);
  assert.match(appSource, /data-action="ai-record-start"/);
  assert.match(appSource, /transcribeWithPlotweaver\(recording/);
  assert.match(appSource, /data-form="login"/);
  assert.match(appSource, /data-form="profile-settings"/);
  assert.match(appSource, /Your message is sent to Plotweaver for translation/);
  assert.match(appSource, /ai-conversation-status/);
  assert.match(appSource, /transcribeWithPlotweaver\(recording/);
});

test('AI Conversations has responsive workspace and mobile navigation layouts', () => {
  assert.match(styleSource, /\.ai-workspace\s*\{[^}]*grid-template-columns: 196px/s);
  assert.match(styleSource, /@media \(max-width: 740px\)[\s\S]*?\.ai-workspace \{ display: block; \}/);
  assert.match(styleSource, /@media \(max-width: 520px\)[\s\S]*?\.ai-language-grid \{ grid-template-columns: repeat\(2, minmax\(0,1fr\)\); \}/);
  assert.match(styleSource, /prefers-reduced-motion: reduce[\s\S]*?\.ai-button/);
});

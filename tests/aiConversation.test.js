import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const stylesSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');

const AI_CHAT_ACTIONS = [
  'aichat-back',
  'aichat-settings',
  'aichat-change-guide',
  'aichat-select-guide',
  'aichat-translate',
  'aichat-toggle-translation',
  'aichat-toggle-autospeak',
  'aichat-listen',
  'aichat-replay',
  'aichat-pause',
  'aichat-slow',
  'aichat-mic',
  'aichat-focus-input',
];

test('the AI conversation page is a first-class route with its own shell', async () => {
  const routes = appSource.match(/const ROUTES = \[([\s\S]*?)\n  \];/)?.[1];
  assert.ok(routes, 'application routes should exist');
  assert.match(routes, /'ai-conversation'/);

  const shell = await readFile(new URL('../ai-conversation.html', import.meta.url), 'utf8');
  assert.match(shell, /data-default-route="ai-conversation"/);
  assert.match(shell, /<script type="module" src="\.\/app\.js"><\/script>/);
  assert.match(viteConfig, /'ai-conversation',/);

  assert.match(appSource, /page === 'login' \|\| page === 'ai-conversation'/, 'the shared site header should be hidden on AI chat');
  assert.match(appSource, /page === 'ai-conversation' \|\| page\.startsWith\('tutor'\)/, 'AI chat renders its own full-bleed layout');
  assert.match(appSource, /if \(page === 'ai-conversation'\) initializeAiConversation\(\)/);
  assert.match(stylesSource, /body\[data-page="ai-conversation"\]/);
});

test('the AI conversation screen renders the guide card, thread, composer, and tabs', async () => {
  for (const className of ['aichat-header', 'aichat-focus', 'aichat-guide', 'aichat-thread', 'aichat-composer', 'aichat-tabs']) {
    assert.match(appSource, new RegExp(`class="${className}`), `${className} markup should exist`);
    assert.match(stylesSource, new RegExp(`\\.${className}\\b`), `${className} styles should exist`);
  }
  assert.match(appSource, /class="aichat-title">AI Conversation</);
  assert.match(appSource, /class="aichat-tabs aichat-tabs-desktop"/);
  assert.match(appSource, /class="aichat-tabs aichat-tabs-mobile"/);
  assert.match(appSource, /id="aichat-audio-status" role="status"/);
  assert.doesNotMatch(appSource, /Live replies use Google Gemini|Live replies use Gemini|voice input and translation use Plotweaver|Avoid sharing personal details/);
  assert.match(stylesSource, /\.aichat-status-sr-only\s*\{[\s\S]*?clip-path: inset\(50%\);/);
  assert.match(appSource, /data-form="aichat-composer"/);
  assert.match(appSource, /class="aichat-focus-select"/);
  assert.match(appSource, /class="aichat-input"/);
  assert.match(appSource, /label: 'AI Chat', ico: 'message', active: true/);
  assert.match(appSource, /<a class="aichat-tab" href="#\/\$\{tab\.route\}" data-route="\$\{tab\.route\}">/);
});

test('both Yoruba guides resolve to bundled portrait assets', async () => {
  for (const photo of ['yoruba-educator-woman.jpg', 'yoruba-educator-man.jpg']) {
    assert.match(appSource, new RegExp(`photo: '${photo.replace('.', '\\.')}'`), `${photo} should be wired to a guide`);
    await access(new URL(`../public/assets/${photo}`, import.meta.url));
  }
  assert.match(appSource, /alt: 'Ìyá Adúkẹ́/);
  assert.match(appSource, /alt: 'Bàbá Tundé/);
});

test('every AI chat control is wired through the shared action handler', () => {
  assert.match(appSource, /if \(action\.startsWith\('aichat-'\)\) \{ handleAiConversationAction\(action, el\); return; \}/);
  assert.match(appSource, /function handleAiConversationAction\(action, el\)/);
  for (const action of AI_CHAT_ACTIONS) {
    assert.match(appSource, new RegExp(`data-action="${action}"`), `${action} should be rendered in the markup`);
    assert.match(appSource, new RegExp(`case '${action}':`), `${action} should have a handler branch`);
  }
  assert.match(appSource, /if \(type === 'aichat-composer'\)/);
  assert.match(appSource, /if \(el\.matches\('\.aichat-focus-select'\)\)/);
  assert.match(appSource, /closest\('\.aichat-popover, \[data-action="aichat-settings"\], \[data-action="aichat-change-guide"\]'\)/);
});

test('AI chat uses server-side Gemini and Plotweaver services instead of canned replies', () => {
  assert.match(appSource, /import \{ sendAiChatMessage \} from '\.\/src\/aiChatClient\.js'/);
  assert.match(appSource, /sendAiChatMessage\(\{[\s\S]*?language: aiChatLanguage\(\)\.code/);
  assert.match(appSource, /synthesizePlotweaverSpeech\(\{/);
  assert.match(appSource, /transcribeWithPlotweaver\(recording, aiChatLanguage\(\)\.code\)/);
  assert.match(appSource, /translateWithPlotweaver\(\{/);
  assert.doesNotMatch(appSource, /const AICHAT_REPLIES =/);
  assert.doesNotMatch(appSource, /Live replies use Google Gemini|Live replies use Gemini|Avoid sharing personal details/);
  assert.match(appSource, /yoruba: 'Ó dáàlẹ̀! Ẹ jẹ́ ká bẹ̀rẹ̀ lónìí\.'/);
  assert.match(appSource, /english: 'Great! Let’s get started today\.'/);
});

test('AI chat animation respects reduced motion preferences', () => {
  const reducedMotion = stylesSource.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/g) || [];
  assert.ok(reducedMotion.some((block) => /aichat/.test(block)), 'AI chat animations should be disabled for reduced motion');
test('the AI conversation page reflows into a rail and thread workspace on wide screens', () => {
  const tablet = stylesSource.match(/@media \(min-width: 620px\) \{[\s\S]*?\n\}/)?.[0] || '';
  const desktop = stylesSource.match(/@media \(min-width: 1024px\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.ok(tablet, 'a tablet breakpoint should keep the single-column shell');
  assert.match(tablet, /\.aichat-page \{[\s\S]*?max-width: 780px;/);
  assert.ok(desktop, 'a desktop breakpoint should own the workspace layout');
  assert.match(desktop, /grid-template-areas:\s*\n\s*"head head"\s*\n\s*"rail chat"\s*\n\s*"rail comp";/);
  assert.match(desktop, /grid-template-columns: minmax\(300px, 32%\) minmax\(0, 1fr\);/);
  assert.match(desktop, /\.aichat-scroll \{ display: contents; \}/);
  assert.match(desktop, /\.aichat-thread \{[\s\S]*?overflow-y: auto;/);
  assert.match(desktop, /\.aichat-tab \{[\s\S]*?flex-direction: row;/);
  assert.match(desktop, /\.aichat-tabs-desktop \{[\s\S]*?display: grid;/);
  assert.match(desktop, /\.aichat-tabs-mobile \{ display: none; \}/);
  assert.match(desktop, /background: var\(--aichat-green-deep\);[\s\S]*?color: #fff;/);
  assert.match(appSource, /function aiChatScrollContainers\(\)/);
  assert.match(appSource, /const overflowY = window\.getComputedStyle\(el\)\.overflowY;/);
  assert.match(appSource, /thread\.classList\.toggle\('is-scrolled', thread\.scrollTop > 4\)/);
  assert.match(stylesSource, /\.aichat-scroll\.has-more-below \{/);
  assert.match(stylesSource, /\.aichat-thread\.is-scrolled \{/);
  assert.match(desktop, /width: 100%;/);
  assert.match(desktop, /max-width: none;/);
  assert.match(desktop, /height: 100svh;/);
  assert.match(desktop, /\.aichat-thread \{[\s\S]*?padding: clamp\(14px, 1\.4vw, 24px\) clamp\(14px, 1\.5vw, 24px\);/);
  assert.match(desktop, /\.aichat-bubble-guide \{ max-width: min\(84%, 820px\);/);
  assert.match(desktop, /\.aichat-bubble-user \{ max-width: min\(74%, 640px\);/);
  assert.match(stylesSource, /\.aichat-thread \{ padding: 14px; \}/);
  assert.match(stylesSource, /\.aichat-composer \{ grid-template-columns: 48px minmax\(0, 1fr\) 48px; gap: 8px; padding-inline: 12px; \}/);
});

});

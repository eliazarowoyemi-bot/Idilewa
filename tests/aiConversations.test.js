import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

const slice = (startToken, endToken) => appSource.slice(appSource.indexOf(startToken), appSource.indexOf(endToken));

test('AI Conversation registers every section route and its workspace navigation', () => {
  const routes = slice('const ROUTES = [', 'const REMOVED_ROUTES');
  const views = slice('const AI_CHAT_VIEWS = [', 'let aiAuthReturnRoute');

  for (const route of [
    'ai-conversations', 'ai-login', 'ai-signup', 'ai-dashboard', 'ai-chat', 'ai-everyday',
    'ai-voice', 'ai-history', 'ai-analytics', 'ai-profile', 'ai-messages', 'ai-settings',
    'ai-translate', 'ai-saved'
  ]) {
    assert.match(routes, new RegExp(`'${route}'`), `${route} should be a registered route`);
    assert.match(appSource, new RegExp(`case '${route}':`), `${route} should resolve to a renderer`);
  }

  const expectedViews = [
    ['conversation', 'ai-conversations'],
    ['translate', 'ai-translate'],
    ['practice', 'ai-voice'],
    ['history', 'ai-history'],
    ['saved', 'ai-saved']
  ];
  for (const [id, route] of expectedViews) {
    assert.match(views, new RegExp(`\\{ id: '${id}', route: '${route}'`), `${id} view should link to ${route}`);
  }

  assert.match(views, /'ai-chat': 'conversation'/);
  assert.match(views, /'ai-everyday': 'conversation'/);
  assert.match(views, /'ai-analytics': 'history'/);
  assert.match(views, /'ai-messages': 'saved'/);
  assert.match(views, /'ai-settings': 'translate'/);

  assert.match(appSource, /\{ label: 'AI Conversations', route: 'ai-conversations', group: 'ai-conversations' \}/);
  assert.match(appSource, /\{ route: 'ai-conversations', label: 'AI Chat', ico: 'sparkles' \}/);
});

test('the AI Conversation shell renders a sidebar, mobile topbar, tabs and drawer', () => {
  assert.match(appSource, /function renderAiChatShell\(view, content\)/);
  assert.match(appSource, /<div class="aic" data-view="\$\{esc\(view\)\}">/);
  assert.match(appSource, /<aside class="aic-sidebar" aria-label="AI Conversation sections">/);
  assert.match(appSource, /<nav class="aic-sidebar-nav">\$\{links\}<\/nav>/);
  assert.match(appSource, /\$\{renderAiChatTopbar\(\)\}/);
  assert.match(appSource, /\$\{renderAiChatDrawer\(view\)\}/);
  assert.match(appSource, /\$\{renderAiChatTabs\(view\)\}/);
  assert.match(appSource, /<div class="aic-main" id="aic-main" tabindex="-1">\$\{content\}<\/div>/);
  assert.match(appSource, /class="aic-sidebar-link \$\{item\.id === view \? 'is-active' : ''\}" href="#\/\$\{item\.route\}" data-route="\$\{item\.route\}"/);

  // The legacy site header, footer and bottom navigation step aside for the AI workspace.
  assert.match(styleSource, /body\[data-page\^="ai-"\] \.site-header,/);
  assert.match(styleSource, /body\[data-page\^="ai-"\] \.mobile-nav \{ display: none; \}/);
  assert.match(appSource, /if \(page\.startsWith\('ai-'\) \|\| page\.startsWith\('tutor'\) \|\| page === 'families' \|\|/);
});

test('learners pick from five languages and six scripted topics with no network AI', () => {
  const languages = slice('const AI_CHAT_LANGUAGES = [', 'const AI_CHAT_TOPICS = [');
  for (const id of ['yoruba', 'igbo', 'hausa', 'swahili', 'pidgin']) {
    assert.match(languages, new RegExp(`\\{ id: '${id}'`), `${id} should be offered`);
  }
  assert.equal((languages.match(/\{ id: '/g) || []).length, 5);

  const topics = slice('const AI_CHAT_TOPICS = [', 'const AI_CHAT_DIALOGUE = {');
  for (const id of ['everyday', 'family', 'school', 'market', 'culture', 'storytelling']) {
    assert.match(topics, new RegExp(`\\{ id: '${id}'`), `${id} should be offered`);
  }
  assert.equal((topics.match(/\{ id: '/g) || []).length, 6);

  // The welcome → language → topic → chat journey is driven by a single stage machine.
  assert.match(appSource, /function aiChatStage\(\) \{/);
  assert.match(appSource, /if \(!\['welcome', 'language', 'topic', 'chat'\]\.includes\(aiChatState\.step\)\) return 'welcome';/);
  assert.match(appSource, /data-action="aic-start"/);
  assert.match(appSource, /data-action="aic-choose-language" data-language="\$\{language\.id\}"/);
  assert.match(appSource, /data-action="aic-choose-topic" data-topic="\$\{topic\.id\}"/);
  assert.match(appSource, /<span class="aic-step-index">Step 1 of 2<\/span>/);
  assert.match(appSource, /<span class="aic-step-index">Step 2 of 2<\/span>/);

  // Replies are read from the local script — the next line comes from the dialogue array.
  assert.match(appSource, /const next = dialogue\[index \+ 1\] \|\| null;/);
  assert.match(appSource, /const gloss = scripted && message\.toLowerCase\(\) === scripted\.reply\.toLowerCase\(\) \? scripted\.replyEn : '';/);
  assert.match(appSource, /data-action="aic-quick-reply" data-reply="\$\{esc\(scripted\.reply\)\}"/);
  assert.match(appSource, /: \{ role: 'assistant', text: language\.close, gloss: language\.closeEn, at: Date\.now\(\) \}\);/);
  assert.doesNotMatch(appSource, /fetch\([^)]*api\/chat/);
});

test('speech, translation, saved phrases and history persist on the device', () => {
  // Chat replies are read aloud with the shared Plotweaver voice helper.
  assert.match(appSource, /return \(slow \? aiChatSpeakSlow\(phrase\) : playPlotweaverSpeech\(phrase, aiChatAccent\(\)\)\)/);
  assert.match(appSource, /utterance\.rate = 0\.65;/);
  assert.match(appSource, /utterance\.lang = aiChatLocale\(\);/);

  // Record & Practise transcribes the learner recording before typing it into the composer.
  assert.match(appSource, /void transcribeWithPlotweaver\(recording, aiChatAccent\(\)\)/);
  assert.match(appSource, /if \(aiVoiceTarget === 'chat'\) \{\s+aiChatDraft = text;/);
  assert.match(appSource, /if \(!navigator\.mediaDevices\?\.getUserMedia \|\| typeof MediaRecorder === 'undefined'\) \{/);
  assert.match(appSource, /<button class="aic-composer-mic aic-composer-record" type="button" data-action="aic-record" data-target="chat"/);

  // Translate & Listen calls the Plotweaver translation endpoint.
  assert.match(appSource, /<form class="aic-form" data-form="ai-translate">/);
  assert.match(appSource, /const result = await translateWithPlotweaver\(\{ text, sourceLanguage: 'en', targetLanguage: language\.speech \}\);/);

  // Saved phrases and conversation history are stored locally per language and topic.
  assert.match(appSource, /const AI_CHAT_STORAGE_KEY = 'idilewa-ai-chat-v1';/);
  assert.match(appSource, /raw = JSON\.parse\(localStorage\.getItem\(AI_CHAT_STORAGE_KEY\) \|\| 'null'\);/);
  assert.match(appSource, /localStorage\.setItem\(AI_CHAT_STORAGE_KEY, JSON\.stringify\(aiChatState\)\);/);
  assert.match(appSource, /data-action="aic-save-phrase" data-text="\$\{esc\(message\.text\)\}" data-gloss="\$\{esc\(message\.gloss \|\| ''\)\}"/);
  assert.match(appSource, /data-action="aic-delete-thread" data-key="\$\{esc\(key\)\}"/);
  assert.match(appSource, /data-action="aic-remove-saved" data-index="\$\{index\}"/);
  assert.match(appSource, /data-action="aic-clear-history"/);
  assert.match(appSource, /data-action="aic-resume" data-language="\$\{esc\(languageId\)\}" data-topic="\$\{esc\(topicId\)\}"/);
});

test('AI Conversation styles cover phones, tablets and desktops', () => {
  const classes = ['aic', 'aic-sidebar', 'aic-sidebar-link', 'aic-main', 'aic-topbar', 'aic-tabs',
    'aic-tab', 'aic-drawer', 'aic-drawer-scrim', 'aic-stage', 'aic-welcome', 'aic-step', 'aic-option',
    'aic-option-topic', 'aic-option-icon', 'aic-chat', 'aic-thread', 'aic-msg', 'aic-bubble',
    'aic-chips', 'aic-chip', 'aic-toolbar', 'aic-tool', 'aic-composer', 'aic-composer-field',
    'aic-composer-record', 'aic-composer-send', 'aic-form', 'aic-list', 'aic-gloss'];
  for (const name of classes) {
    assert.ok(styleSource.includes(`.${name}`), `.${name} should be styled`);
  }

  // The sidebar only appears from tablet-landscape upwards; phones use tabs and a drawer.
  assert.match(styleSource, /\.aic-sidebar \{ display: none; \}/);
  assert.match(styleSource, /@media \(min-width: 960px\) \{[\s\S]{0,400}\.aic \{ grid-template-columns: 268px minmax\(0, 1fr\);/);
  assert.match(styleSource, /@media \(min-width: 640px\) \{/);
  assert.match(styleSource, /\.aic-tabs \{/);
  assert.match(styleSource, /body\[data-page\^="ai-"\] \.mobile-nav \{ display: none; \}/);
  assert.match(styleSource, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]{0,600}\.aic/);
});

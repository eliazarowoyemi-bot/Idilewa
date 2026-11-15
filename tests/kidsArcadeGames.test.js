import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createStandaloneAppPlugin } from '../src/standaloneAppRoutes.js';
import { verifyGameCompletionMessage } from '../src/gameCompletion.js';
import test from 'node:test';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const kidsHtml = await readFile(new URL('../kids.html', import.meta.url), 'utf8');
const progressSource = await readFile(new URL('../src/arcadeProgress.js', import.meta.url), 'utf8');
const completionSource = await readFile(new URL('../src/gameCompletion.js', import.meta.url), 'utf8');
const racerHtml = await readFile(new URL('../public/games/turbo-racers.html', import.meta.url), 'utf8');
const ludoHtml = await readFile(new URL('../public/games/balloon-ludo.html', import.meta.url), 'utf8');
const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const plugin = createStandaloneAppPlugin(rootDirectory);

function transformKidsPage() {
  return plugin.transformIndexHtml.handler(kidsHtml, {
    filename: resolve(rootDirectory, 'kids.html'),
  });
}

function assertInlineScriptsParse(html, filename) {
  let scriptIndex = 0;
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) {
      assert.doesNotThrow(
        () => new vm.Script(match[1], { filename: `${filename}#script-${scriptIndex}` }),
        `${filename} script ${scriptIndex} should parse`,
      );
      scriptIndex += 1;
    }
  }
  assert.ok(scriptIndex > 0, `${filename} should include playable game logic`);
}

test('Kids Arcade loads the maintained same-origin game pages and reports progress', () => {
  const transformed = transformKidsPage();
  assert.match(transformed, /const GAMES=\{racer:"\/games\/turbo-racers\.html",ludo:"\/games\/balloon-ludo\.html"\}/);
  assert.match(transformed, /frame\.src=GAMES\[which\]/);
  assert.match(transformed, /id="progressStatus" role="status" aria-live="polite"/);
  assert.match(transformed, /src="\/src\/arcadeProgress\.js"/);
  assert.doesNotMatch(transformed, /const GAMES=\{racer:"<!doctype html>/);
  assertInlineScriptsParse(transformed, 'kids.html');
  const transformedHome = plugin.transformIndexHtml.handler(indexHtml, {
    filename: resolve(rootDirectory, 'index.html'),
  });
  assert.match(transformedHome, /\/kids\.html/);
});

test('the academy merges the game-vocabulary accordion into the coding challenges', () => {
  assert.match(indexHtml, /Game words &amp; translations · Àwọn ọ̀rọ̀ eré/);
  assert.match(indexHtml, /<details class="id-approved-accordion">/);
});

test('both supplied game pages parse and report only completed-run progress', () => {
  assert.match(racerHtml, /<title>Ìdíléwa Turbo Racers<\/title>/);
  assert.match(racerHtml, /game:'turbo-racers',outcome:win\?'won':'finished'/);
  assert.match(ludoHtml, /<title>Ìdíléwa Balloon Ludo 2\.0/);
  assert.match(ludoHtml, /game:'balloon-ludo',outcome:'won'/);
  assertInlineScriptsParse(racerHtml, 'turbo-racers.html');
  assertInlineScriptsParse(ludoHtml, 'balloon-ludo.html');
  assert.doesNotMatch(racerHtml + ludoHtml, /https?:\/\/|fetch\(|XMLHttpRequest|WebSocket\(/i);
});

test('game results must match the same-origin game frame and validated completion values', () => {
  const frame = {
    contentWindow: {},
    getAttribute: () => '/games/turbo-racers.html',
  };
  const payload = {
    type: 'idilewa-game-complete',
    game: 'turbo-racers',
    outcome: 'won',
    score: 18,
    difficulty: 'easy',
    language: 'yo',
  };
  const event = { origin: 'https://idilewa.com', source: frame.contentWindow, data: payload };

  assert.deepEqual(verifyGameCompletionMessage(event, frame, event.origin), {
    game: 'turbo-racers',
    outcome: 'won',
    score: 18,
    difficulty: 'easy',
    language: 'yo',
  });
  assert.equal(verifyGameCompletionMessage({ ...event, origin: 'https://attacker.example' }, frame, event.origin), null);
  assert.equal(verifyGameCompletionMessage({ ...event, source: {} }, frame, event.origin), null);
  assert.equal(verifyGameCompletionMessage({ ...event, data: { ...payload, score: -1 } }, frame, event.origin), null);
  assert.equal(verifyGameCompletionMessage({ ...event, data: { ...payload, language: 'xx' } }, frame, event.origin), null);
  assert.equal(verifyGameCompletionMessage({ ...event, data: { ...payload, outcome: 'unknown' } }, frame, event.origin), null);
  assert.match(progressSource, /lessonType: 'coding'/);
  assert.match(progressSource, /lessonId: `kids-arcade-\$\{completion\.game\}`/);
  assert.match(completionSource, /event\.origin !== origin/);
});

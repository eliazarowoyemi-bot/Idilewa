import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const racerHtml = await readFile(new URL('../public/games/turbo-racers.html', import.meta.url), 'utf8');
const ludoHtml = await readFile(new URL('../public/games/balloon-ludo.html', import.meta.url), 'utf8');

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

test('Turbo Racers and Balloon Ludo are playable Code Playground choices', () => {
  assert.match(indexHtml, /'turbo-racers': \{ title: 'Turbo Racers', path: '\/games\/turbo-racers\.html' \}/);
  assert.match(indexHtml, /'balloon-ludo': \{ title: 'Balloon Ludo', path: '\/games\/balloon-ludo\.html' \}/);
  assert.match(indexHtml, /🎮 Select a game · 13 games/);
  assert.match(indexHtml, /data-idilewa-game-card="\$\{game\.id\}"/);
  assert.match(indexHtml, /window\.nextCodeGame = \(\) => \{/);
});

test('Orbit Breaker keeps its gameplay controls without the removed coding challenge or JSON editor', () => {
  const arcadeData = indexHtml.match(/const arcadeData='([^']+)'/);
  assert.ok(arcadeData, 'The built-in arcade games should be available to the game selector');
  const arcadeHtml = Buffer.from(arcadeData[1], 'base64').toString('utf8');
  const source = `${indexHtml}\n${arcadeHtml}`;

  for (const removedContent of [
    'Mini coding challenge',
    'Edit game settings (JSON)',
    'Editable game settings JSON',
    'Safe settings editor',
    'Apply my code',
    'function checkChallenge()',
    'function updateEditor()',
    'updateEditor()',
  ]) {
    assert.ok(!source.includes(removedContent), `${removedContent} should stay removed`);
  }

  assert.match(source, /id=&quot;size&quot;/);
  assert.match(source, /id=&quot;speed&quot;/);
  assert.match(source, /id=&quot;density&quot;/);
  assert.match(source, /id=&quot;feedback&quot;/);
  assert.match(source, /role=&quot;status&quot;/);
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

test('game results are verified against the same-origin arcade iframe before persistence', () => {
  assert.match(appSource, /payload\.type !== 'idilewa-game-complete'/);
  assert.match(appSource, /event\.origin !== window\.location\.origin/);
  assert.match(appSource, /event\.source !== frame\.contentWindow/);
  assert.match(appSource, /frame\.getAttribute\('src'\) !== gamePaths\[gameId\]/);
  assert.match(appSource, /Number\.isSafeInteger\(payload\.score\)/);
  assert.match(appSource, /lessonType: 'coding'/);
  assert.match(appSource, /lessonId: `kids-arcade-\$\{gameId\}`/);
  assert.match(appSource, /await saveProgress|void saveProgress/);
});

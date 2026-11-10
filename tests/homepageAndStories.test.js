import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('homepage follows the supplied language academy design', () => {
  assert.match(appSource, /<title>Ìdíléwa Language Academy<\/title>/);
  assert.match(appSource, /Our Language\./);
  assert.match(appSource, /Our Future\./);
  assert.match(appSource, /Learn\. Speak\. Connect\./);
  assert.match(appSource, /Choose your language/);
  assert.match(appSource, /Voice Lessons/);
  assert.match(appSource, /Heritage Stories/);
});

test('the single app includes the learning, coding, conversation, and heritage destinations', () => {
  for (const id of ['home', 'learning', 'codeLab', 'aiChat', 'heritageLab']) {
    assert.match(appSource, new RegExp(`id="${id}"`), `${id} view should be included`);
  }
  assert.match(appSource, /function go\(id\)/);
  assert.match(appSource, /function renderLesson\(/);
  assert.match(appSource, /function sendIdilewaChat\(/);
});

test('the supplied page includes its games, collapsible guides, and embedded game experiences', () => {
  for (const game of [
    'First Programme',
    'Orbit Breaker',
    'Hide &amp; Seek',
    'Fruit Maths',
    'Science Lab',
    'Little Chefs',
  ]) {
    assert.ok(appSource.includes(game), `${game} should be included`);
  }
  assert.match(appSource, /<details[^>]*class="game-instructions"/);
  assert.match(appSource, /id="orbitFrame"/);
  assert.match(appSource, /id="hideFrame"/);
});

test('the supplied interface includes responsive and reduced-motion styles', () => {
  assert.match(appSource, /@media\(max-width:/);
  assert.match(appSource, /prefers-reduced-motion:reduce/);
});

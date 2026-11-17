import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createStandaloneAppPlugin } from '../src/standaloneAppRoutes.js';
import {
  mergeMilestoneProgress,
  normalizeMilestoneProgress,
} from '../src/milestoneProgressState.js';

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const plugin = createStandaloneAppPlugin(rootDirectory);
const referenceHtml = await readFile(resolve(rootDirectory, 'milestone-achievement.html'), 'utf8');

function transformPage(filename, html) {
  return plugin.transformIndexHtml.handler(html, { filename: resolve(rootDirectory, filename) });
}

test('Milestone Achievement keeps the supplied game and bridges local saves to account sync', () => {
  const transformed = transformPage('milestone-achievement.html', referenceHtml);

  assert.match(referenceHtml, /idilewa-v25-progress/);
  assert.match(transformed, /idilewa-milestone-storage-bootstrap/);
  assert.match(transformed, /idilewa-milestone-progress-bridge/);
  assert.match(transformed, /src="\/src\/milestoneAchievementProgress\.js"/);
  assert.ok(
    transformed.indexOf('idilewa-milestone-storage-bootstrap') < transformed.indexOf("const KEY='idilewa-v25-progress'"),
    'the save hook must run before the supplied game initializes',
  );
  assert.match(transformed, /<h1>🌍 Life Adventures<\/h1>/);
  assert.match(transformed, /localStorage\.setItem\(KEY/);
});

test('milestone progress merges completed work without regressing the latest wallet or preferences', () => {
  const merged = mergeMilestoneProgress(
    {
      primary: 'yo',
      support: 'en',
      level: 'Beginner',
      xp: 40,
      wallet: 7300,
      completed: 2,
      seen: { 'school-1': 1 },
      recent: ['school-1'],
      savedAt: 100,
    },
    {
      primary: 'ig',
      support: 'sw',
      level: 'Elementary',
      xp: 25,
      wallet: 7000,
      completed: 1,
      seen: { 'school-1': 1, 'home-1': 1 },
      recent: ['home-1'],
      savedAt: 200,
    },
  );

  assert.equal(merged.primary, 'ig');
  assert.equal(merged.wallet, 7000);
  assert.equal(merged.xp, 40);
  assert.equal(merged.completed, 2);
  assert.deepEqual(merged.seen, { 'school-1': 1, 'home-1': 1 });
});

test('milestone progress rejects malformed values and duplicate language choices', () => {
  const progress = normalizeMilestoneProgress({
    primary: 'not-a-language',
    support: 'yo',
    xp: -10,
    wallet: 'invalid',
    completed: 2.9,
    seen: { 'challenge-1': 2, bad: -1 },
    recent: ['challenge-1', 42],
  });

  assert.equal(progress.primary, 'yo');
  assert.equal(progress.support, 'en');
  assert.equal(progress.xp, 0);
  assert.equal(progress.wallet, 7600);
  assert.equal(progress.completed, 2);
  assert.deepEqual(progress.seen, { 'challenge-1': 2 });
  assert.deepEqual(progress.recent, ['challenge-1']);
});

test('milestone progress preserves the Expert difficulty offered by the game', () => {
  assert.equal(normalizeMilestoneProgress({ level: 'Expert' }).level, 'Expert');
});

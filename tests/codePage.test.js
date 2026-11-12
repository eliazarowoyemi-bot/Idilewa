import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  advanceGame,
  createGameState,
  GAME_TEMPLATES,
  movePlayer,
  rectanglesOverlap,
  RULE_CATALOG,
  STARTER_RULES,
} from '../src/codeStudioEngine.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const appModuleSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const engineSource = await readFile(new URL('../src/codeStudioEngine.js', import.meta.url), 'utf8');
const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('standalone Code page is removed while homepage links retain the in-app Code Lab', () => {
  for (const path of ['code-studio.html', 'src/codeStudio.js', 'styles/code-studio.css']) {
    assert.equal(existsSync(resolve(rootDirectory, path)), false, `${path} should be removed`);
  }
  assert.doesNotMatch(appModuleSource, /code-studio\.html/);
  assert.match(appModuleSource, /routeLink\('codeLab'/);
  assert.match(appModuleSource, /title: 'Code', description: 'Build & Run'.*route: 'codeLab'/);
  assert.match(appSource, /id="codeLab"/);
});

test('the integrated coding view includes the supplied games and language controls', () => {
  for (const id of [
    'orbitFrame',
    'hideFrame',
    'fruitStart',
    'fruitLanguage',
    'dgScienceTab',
    'dgKitchenTab',
  ]) {
    assert.match(appSource, new RegExp(`id="${id}"`), `${id} should be available in the app`);
  }
  assert.match(appSource, /Orbit Breaker/);
  assert.match(appSource, /Hide &amp; Seek/);
  assert.match(appSource, /Science Lab/);
  assert.match(appSource, /Little Chefs/);
});

test('lost lives pause play and offer a language recovery challenge', () => {
  assert.match(appSource, /window\.idilewaQuiz/);
  assert.match(appSource, /idilewa-shared-life-loss/);
  assert.match(appSource, /Answer the language question to try recovering a life/);
  assert.ok(appSource.includes('playing=false;cancelAnimationFrame(raf);window.idilewaQuiz'));
  assert.ok(appSource.includes('paused=true;window.parent.postMessage({type:&#x27;idilewa-shared-life-loss&#x27;'));
  assert.match(appSource, /lives\+\+;score\+=20;updateStats\(\)/);
});

test('three starter games have bounded, testable control behavior', () => {
  assert.deepEqual(Object.keys(GAME_TEMPLATES), ['race', 'catch', 'maze']);
  assert.deepEqual(STARTER_RULES, ['movement', 'hazards', 'score', 'sound']);
  assert.ok(RULE_CATALOG.movement);

  const race = createGameState('race');
  race.phase = 'running';
  const project = { template: 'race', speed: 1, blocks: STARTER_RULES.map((id) => ({ id, enabled: true })) };
  assert.equal(movePlayer(race, 'left', project), true);
  assert.equal(race.lane, 0);
  assert.equal(movePlayer(race, 'left', project), false);
  assert.equal(movePlayer(race, 'right', project), true);
  assert.equal(movePlayer(race, 'up', project), false);

  const disabledControls = {
    ...project,
    blocks: project.blocks.map((block) => ({ ...block, enabled: block.id !== 'movement' })),
  };
  assert.equal(movePlayer(race, 'left', disabledControls), false);

  const maze = createGameState('maze');
  maze.phase = 'running';
  const openMaze = {
    ...project,
    template: 'maze',
    blocks: project.blocks.map((block) => ({ ...block, enabled: block.id !== 'hazards' })),
  };
  assert.equal(movePlayer(maze, 'right', openMaze), true);
  assert.equal(movePlayer(maze, 'right', openMaze), true);
  assert.equal(movePlayer(maze, 'right', openMaze), true);

  const mazeWithWalls = createGameState('maze');
  mazeWithWalls.phase = 'running';
  const path = ['right', 'right', 'down', 'down', 'right', 'right', 'down', 'down', 'right', 'right', 'down', 'down', 'right', 'right'];
  for (const direction of path) assert.equal(movePlayer(mazeWithWalls, direction, project), true);
  assert.equal(mazeWithWalls.phase, 'complete');
});

test('racing and catching rules update score, collisions, and lives', () => {
  const race = createGameState('race');
  race.phase = 'running';
  race.lane = 0;
  const project = { template: 'race', speed: 1, blocks: STARTER_RULES.map((id) => ({ id, enabled: true })) };
  const raceEvents = [];
  for (let frame = 0; frame < 100; frame += 1) {
    raceEvents.push(...advanceGame(race, project, 0.05, () => 0));
    if (race.phase !== 'running') break;
  }
  assert.ok(raceEvents.includes('collision'));
  assert.ok(race.lives < 3);
  assert.ok(race.score > 0);

  const catcher = createGameState('catch');
  catcher.phase = 'running';
  for (let step = 0; step < 6; step += 1) movePlayer(catcher, 'left', project);
  const catchEvents = [];
  for (let frame = 0; frame < 80; frame += 1) {
    catchEvents.push(...advanceGame(catcher, { ...project, template: 'catch' }, 0.05, () => 0));
    if (catchEvents.includes('collect')) break;
  }
  assert.ok(catchEvents.includes('collect'));
  assert.equal(catcher.score, 10);
});

test('rectangle collisions use edge-exclusive overlap', () => {
  assert.equal(rectanglesOverlap(
    { x: 0, y: 0, width: 10, height: 10 },
    { x: 10, y: 0, width: 10, height: 10 },
  ), false);
  assert.equal(rectanglesOverlap(
    { x: 0, y: 0, width: 10, height: 10 },
    { x: 9, y: 9, width: 10, height: 10 },
  ), true);
  assert.match(engineSource, /export function advanceGame/);
});

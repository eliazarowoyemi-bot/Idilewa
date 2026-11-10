import assert from 'node:assert/strict';
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

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
const studioHtml = await readFile(new URL('../code-studio.html', import.meta.url), 'utf8');
const studioSource = await readFile(new URL('../src/codeStudio.js', import.meta.url), 'utf8');
const engineSource = await readFile(new URL('../src/codeStudioEngine.js', import.meta.url), 'utf8');

test('Code Studio stays packaged separately and is linked from the academy homepage', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderFullHome()'));

  assert.match(homeSource, /Our Language\.<br \/><span>Our Future\.<\/span>/);
  assert.match(homeSource, /code-studio\.html/);
  assert.match(studioHtml, /Code Studio/);
  assert.match(viteConfig, /'code-studio'/);
});

test('Code Studio exposes working game, design, sound, language, and Canva controls', () => {
  for (const id of [
    'game-template',
    'block-stack',
    'game-stage',
    'run-game',
    'reset-game',
    'game-speed',
    'player-color',
    'sound-enabled',
    'sound-volume',
    'sound-tempo',
    'target-language',
    'translate-game-text',
    'apply-translation',
    'open-canva',
    'save-project',
    'import-project',
    'export-project',
  ]) {
    assert.match(studioHtml, new RegExp(`id="${id}"`), `${id} should be available on the page`);
  }
  assert.match(studioHtml, /value="yo"/);
  assert.match(studioHtml, /value="ig"/);
  assert.match(studioHtml, /value="ha"/);
  assert.match(studioHtml, /value="pcm"/);
  assert.match(studioHtml, /value="sw"/);
  assert.match(studioHtml, /current game preview is uploaded/);
  assert.match(studioSource, /translateWithPlotweaver/);
  assert.match(studioSource, /localStorage/);
  assert.doesNotMatch(studioHtml, /cdn\.tailwindcss\.com|Anansi|pest_control/);
  assert.doesNotMatch(studioHtml, /<img\b/i);
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

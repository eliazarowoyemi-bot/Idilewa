export const GAME_TEMPLATES = {
  race: {
    title: 'Road Racer',
    description: 'Steer between lanes and make it to the finish.',
    instruction: 'Use the left and right arrow keys to steer. Avoid traffic.',
  },
  catch: {
    title: 'Star Catcher',
    description: 'Move across the stage and catch falling stars.',
    instruction: 'Move left and right to catch the falling stars.',
  },
  maze: {
    title: 'Maze Runner',
    description: 'Find a clear path from the start to the finish.',
    instruction: 'Use the arrow keys to find the way through the maze.',
  },
};

export const RULE_CATALOG = {
  movement: {
    title: 'Move the player',
    description: 'Arrow keys or touch controls steer the player.',
    code: 'handleArrowKeys();',
  },
  hazards: {
    title: 'Create game objects',
    description: 'Traffic, stars, or maze walls make each round a challenge.',
    code: 'updateGameObjects();',
  },
  score: {
    title: 'Keep score',
    description: 'Survival time, steps, and collected stars add points.',
    code: 'updateScore();',
  },
  sound: {
    title: 'Play a sound',
    description: 'Play an optional tone when something happens.',
    code: 'playEventTone();',
  },
};

export const STARTER_RULES = ['movement', 'hazards', 'score', 'sound'];

export const MAZE_LAYOUT = [
  [0, 0, 0, 1, 0, 0, 0, 1, 0],
  [1, 1, 0, 1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const RACE_LANES = [365, 480, 595];
const PLAYER_Y = 420;
const CATCHER_Y = 470;

export function hasRule(project, ruleId) {
  return Array.isArray(project?.blocks)
    && project.blocks.some((block) => block?.id === ruleId && block.enabled !== false);
}

export function createGameState(template = 'race') {
  if (!Object.hasOwn(GAME_TEMPLATES, template)) {
    throw new TypeError(`Unsupported game template: ${template}`);
  }
  return {
    template,
    phase: 'ready',
    score: 0,
    lives: 3,
    elapsed: 0,
    lane: 1,
    playerX: CANVAS_WIDTH / 2,
    mazeColumn: 0,
    mazeRow: 0,
    objects: [],
    spawnElapsed: 0,
    worldOffset: 0,
  };
}

export function movePlayer(state, direction, project) {
  if (state.phase !== 'running' || !hasRule(project, 'movement')) return false;
  const directions = {
    left: [-1, 0],
    right: [1, 0],
    up: [0, -1],
    down: [0, 1],
  };
  const delta = directions[direction];
  if (!delta) return false;

  if (state.template === 'race') {
    const nextLane = state.lane + delta[0];
    if (delta[0] === 0 || nextLane < 0 || nextLane >= RACE_LANES.length) return false;
    state.lane = nextLane;
    return true;
  }

  if (state.template === 'catch') {
    if (delta[0] === 0) return false;
    const nextX = state.playerX + delta[0] * 64;
    if (nextX < 82 || nextX > CANVAS_WIDTH - 82) return false;
    state.playerX = nextX;
    return true;
  }

  const nextColumn = state.mazeColumn + delta[0];
  const nextRow = state.mazeRow + delta[1];
  if (nextRow < 0 || nextRow >= MAZE_LAYOUT.length
    || nextColumn < 0 || nextColumn >= MAZE_LAYOUT[0].length
    || (hasRule(project, 'hazards') && MAZE_LAYOUT[nextRow][nextColumn] === 1)) {
    return false;
  }
  state.mazeColumn = nextColumn;
  state.mazeRow = nextRow;
  if (hasRule(project, 'score')) state.score += 1;
  if (nextColumn === MAZE_LAYOUT[0].length - 1 && nextRow === MAZE_LAYOUT.length - 1) {
    state.phase = 'complete';
  }
  return true;
}

export function rectanglesOverlap(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function finishRound(state, phase, events) {
  state.phase = phase;
  events.push(phase === 'complete' ? 'complete' : 'game-over');
}

function advanceRace(state, project, deltaSeconds, random, events) {
  state.worldOffset = (state.worldOffset + 220 * project.speed * deltaSeconds) % 120;
  if (hasRule(project, 'hazards')) {
    state.spawnElapsed += deltaSeconds;
    while (state.spawnElapsed >= 1.15 && state.objects.length < 6) {
      state.spawnElapsed -= 1.15;
      state.objects.push({
        lane: Math.min(2, Math.floor(Math.max(0, Math.min(0.999999, random())) * 3)),
        y: -100,
      });
    }

    const speed = 185 * project.speed;
    state.objects = state.objects.filter((object) => {
      object.y += speed * deltaSeconds;
      const traffic = {
        x: RACE_LANES[object.lane] - 25,
        y: object.y - 36,
        width: 50,
        height: 72,
      };
      const player = {
        x: RACE_LANES[state.lane] - 26,
        y: PLAYER_Y - 36,
        width: 52,
        height: 72,
      };
      if (rectanglesOverlap(traffic, player)) {
        state.lives -= 1;
        events.push('collision');
        return false;
      }
      return object.y < CANVAS_HEIGHT + 80;
    });
  }

  if (hasRule(project, 'score')) state.score = Math.floor(state.elapsed * 10);
  if (state.lives <= 0) finishRound(state, 'over', events);
  else if (state.elapsed >= 45) finishRound(state, 'complete', events);
}

function advanceCatch(state, project, deltaSeconds, random, events) {
  if (!hasRule(project, 'hazards')) return;
  state.spawnElapsed += deltaSeconds;
  while (state.spawnElapsed >= 0.9 && state.objects.length < 8) {
    state.spawnElapsed -= 0.9;
    const position = Math.max(0, Math.min(0.999999, random()));
    state.objects.push({ x: 82 + position * (CANVAS_WIDTH - 164), y: -18 });
  }

  state.objects = state.objects.filter((star) => {
    star.y += 190 * project.speed * deltaSeconds;
    if (star.y >= CATCHER_Y - 30 && Math.abs(star.x - state.playerX) < 46) {
      state.collected = (state.collected || 0) + 1;
      if (hasRule(project, 'score')) state.score += 10;
      events.push('collect');
      return false;
    }
    if (star.y > CANVAS_HEIGHT + 20) {
      state.lives -= 1;
      events.push('miss');
      return false;
    }
    return true;
  });

  if (state.lives <= 0) finishRound(state, 'over', events);
  else if ((state.collected || 0) >= 10) finishRound(state, 'complete', events);
}

export function advanceGame(state, project, deltaSeconds, random = Math.random) {
  const events = [];
  if (state.phase !== 'running') return events;
  const safeDelta = Math.max(0, Math.min(Number(deltaSeconds) || 0, 0.05));
  state.elapsed += safeDelta;

  if (state.template === 'race') advanceRace(state, project, safeDelta, random, events);
  else if (state.template === 'catch') advanceCatch(state, project, safeDelta, random, events);
  return events;
}

function themeColors(theme) {
  if (theme === 'morning') {
    return { sky: '#e5eee9', ground: '#d3e2d5', road: '#525d61', line: '#fff5db', wall: '#486f56' };
  }
  if (theme === 'canopy') {
    return { sky: '#173a2d', ground: '#244c39', road: '#30463b', line: '#d2e8cc', wall: '#789677' };
  }
  return { sky: '#182b3a', ground: '#243c45', road: '#303b42', line: '#d9e8d5', wall: '#5e8270' };
}

function drawCar(context, centerX, centerY, color, width = 54, height = 82) {
  const x = centerX - width / 2;
  const y = centerY - height / 2;
  context.fillStyle = '#101a1d';
  context.fillRect(x - 5, y + 13, 7, 19);
  context.fillRect(x + width - 2, y + 13, 7, 19);
  context.fillRect(x - 5, y + height - 31, 7, 19);
  context.fillRect(x + width - 2, y + height - 31, 7, 19);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x + 8, y + 5);
  context.lineTo(x + width - 8, y + 5);
  context.lineTo(x + width, y + height - 5);
  context.lineTo(x, y + height - 5);
  context.closePath();
  context.fill();
  context.fillStyle = '#b7d9d4';
  context.fillRect(x + 13, y + 18, width - 26, 18);
  context.fillStyle = '#18302f';
  context.fillRect(x + 11, y + 42, width - 22, 14);
  context.fillStyle = '#fff0bd';
  context.fillRect(x + 7, y + height - 11, 9, 4);
  context.fillRect(x + width - 16, y + height - 11, 9, 4);
}

function drawStar(context, centerX, centerY, radius, color) {
  context.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + point * Math.PI / 5;
    const distance = point % 2 === 0 ? radius : radius * 0.45;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

function drawRoad(context, state, colors) {
  const roadLeft = 240;
  const roadWidth = 480;
  context.fillStyle = colors.ground;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = colors.road;
  context.fillRect(roadLeft, 0, roadWidth, CANVAS_HEIGHT);
  context.fillStyle = colors.line;
  context.fillRect(roadLeft - 7, 0, 7, CANVAS_HEIGHT);
  context.fillRect(roadLeft + roadWidth, 0, 7, CANVAS_HEIGHT);
  context.setLineDash([34, 30]);
  context.lineDashOffset = -state.worldOffset;
  context.strokeStyle = 'rgba(230, 239, 222, .68)';
  context.lineWidth = 3;
  for (let lane = 1; lane <= 2; lane += 1) {
    const x = roadLeft + lane * (roadWidth / 3);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CANVAS_HEIGHT);
    context.stroke();
  }
  context.setLineDash([]);
  context.lineDashOffset = 0;
}

function drawRace(context, state, project, colors) {
  drawRoad(context, state, colors);
  state.objects.forEach((traffic) => drawCar(
    context,
    RACE_LANES[traffic.lane],
    traffic.y,
    '#d46b55',
    48,
    72,
  ));
  drawCar(context, RACE_LANES[state.lane], PLAYER_Y, project.playerColor);
}

function drawCatch(context, state, project, colors) {
  context.fillStyle = colors.sky;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = colors.ground;
  context.fillRect(0, CANVAS_HEIGHT - 54, CANVAS_WIDTH, 54);
  context.strokeStyle = 'rgba(215, 236, 220, .2)';
  context.lineWidth = 1;
  for (let x = 70; x < CANVAS_WIDTH; x += 70) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CANVAS_HEIGHT - 54);
    context.stroke();
  }
  state.objects.forEach((star) => drawStar(context, star.x, star.y, 18, '#f4b740'));
  context.fillStyle = project.playerColor;
  context.fillRect(state.playerX - 40, CATCHER_Y, 80, 24);
  context.fillStyle = '#23392d';
  context.fillRect(state.playerX - 32, CATCHER_Y + 7, 64, 5);
}

function drawMaze(context, state, project, colors) {
  context.fillStyle = colors.sky;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const cellSize = 48;
  const gap = 4;
  const mapWidth = MAZE_LAYOUT[0].length * cellSize;
  const mapHeight = MAZE_LAYOUT.length * cellSize;
  const left = (CANVAS_WIDTH - mapWidth) / 2;
  const top = (CANVAS_HEIGHT - mapHeight) / 2;
  const wallsEnabled = hasRule(project, 'hazards');
  MAZE_LAYOUT.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
    const x = left + columnIndex * cellSize;
    const y = top + rowIndex * cellSize;
    context.fillStyle = cell === 1 && wallsEnabled ? colors.wall : '#eef3e8';
    context.fillRect(x + gap / 2, y + gap / 2, cellSize - gap, cellSize - gap);
  }));
  context.fillStyle = '#d5a846';
  context.fillRect(left + (MAZE_LAYOUT[0].length - 1) * cellSize + 12, top + (MAZE_LAYOUT.length - 1) * cellSize + 12, 24, 24);
  context.fillStyle = '#24543a';
  context.fillRect(left + state.mazeColumn * cellSize + 11, top + state.mazeRow * cellSize + 11, 26, 26);
}

function drawOverlay(context, state) {
  if (state.phase === 'running') return;
  context.fillStyle = 'rgba(12, 24, 19, .78)';
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.textAlign = 'center';
  context.fillStyle = '#fff';
  context.font = '700 30px system-ui, sans-serif';
  const title = state.phase === 'complete'
    ? 'You made it!'
    : state.phase === 'over'
      ? 'Round over'
      : state.phase === 'paused'
        ? 'Paused'
        : 'Press Play to begin';
  context.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 7);
  context.fillStyle = '#e0eadf';
  context.font = '16px system-ui, sans-serif';
  const detail = state.phase === 'complete' || state.phase === 'over'
    ? 'Reset the game to play again.'
    : state.template === 'race'
      ? 'Use the left and right arrow keys to steer.'
      : 'Use the arrow keys to move.';
  context.fillText(detail, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
}

export function drawGame(context, state, project) {
  const colors = themeColors(project.stageTheme);
  if (state.template === 'race') drawRace(context, state, project, colors);
  else if (state.template === 'catch') drawCatch(context, state, project, colors);
  else drawMaze(context, state, project, colors);
  drawOverlay(context, state);
}

export class GameCanvas {
  constructor(canvas, onEvent = () => {}, onUpdate = () => {}) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    if (!this.context) throw new Error('This browser could not create the game canvas.');
    this.onEvent = onEvent;
    this.onUpdate = onUpdate;
    this.project = null;
    this.state = null;
    this.frameId = 0;
    this.lastFrameTime = 0;
  }

  setProject(project, reset = false) {
    const modeChanged = !this.state || this.state.template !== project.template;
    this.project = project;
    if (modeChanged || reset) this.state = createGameState(project.template);
    drawGame(this.context, this.state, this.project);
    this.onUpdate(this.state);
  }

  start() {
    if (!this.state || this.state.phase === 'complete' || this.state.phase === 'over') {
      this.state = createGameState(this.project.template);
    }
    this.state.phase = 'running';
    this.lastFrameTime = 0;
    this.drawFrame();
    this.frameId = requestAnimationFrame(this.tick);
  }

  pause() {
    if (this.state?.phase !== 'running') return;
    this.state.phase = 'paused';
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.drawFrame();
  }

  reset() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.lastFrameTime = 0;
    this.state = createGameState(this.project.template);
    this.drawFrame();
  }

  control(direction) {
    if (!this.state || !movePlayer(this.state, direction, this.project)) return false;
    this.drawFrame();
    return true;
  }

  destroy() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  tick = (timestamp) => {
    const delta = this.lastFrameTime === 0 ? 0 : (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    const events = advanceGame(this.state, this.project, delta);
    events.forEach((event) => this.onEvent(event));
    this.drawFrame();
    if (this.state.phase === 'running') {
      this.frameId = requestAnimationFrame(this.tick);
    } else {
      this.frameId = 0;
    }
  };

  drawFrame() {
    drawGame(this.context, this.state, this.project);
    this.onUpdate(this.state);
  }
}

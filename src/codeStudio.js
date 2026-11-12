const STORAGE_KEY = 'idilewa-code-editor-project-v2';
const MAX_SCRIPT_BLOCKS = 20;
const COSTUME_KINDS = new Set(['firefly', 'seedling', 'sunbird']);
const SOUND_PRESETS = {
  chime: { name: 'Morning chime', note: 'Bright, three-note greeting', notes: [440, 554, 659], waveform: 'sine' },
  drum: { name: 'Talking drum', note: 'A warm, gentle rhythm', notes: [196, 147, 220, 165], waveform: 'triangle' },
  rain: { name: 'Rain stick', note: 'A soft, flowing pulse', notes: [392, 330, 440, 349], waveform: 'sine' },
};
const BLOCK_CATEGORIES = {
  motion: {
    title: 'Move blocks',
    blocks: [
      { type: 'move', label: 'move 10 steps', value: 10 },
      { type: 'turn', label: 'turn 15 degrees', value: 15 },
    ],
  },
  looks: {
    title: 'Looks blocks',
    blocks: [
      { type: 'say', label: 'say “Ẹ káàárọ̀!”', text: 'Ẹ káàárọ̀!' },
      { type: 'costume', label: 'switch to next costume', value: 'next' },
    ],
  },
  sound: {
    title: 'Sound blocks',
    blocks: [
      { type: 'sound', label: 'play selected sound' },
      { type: 'sound', label: 'play selected sound again' },
    ],
  },
  events: {
    title: 'Start blocks',
    blocks: [
      { type: 'say', label: 'say “Báwo ni?”', text: 'Báwo ni?' },
      { type: 'move', label: 'start with a small step', value: 5 },
    ],
  },
  control: {
    title: 'Flow blocks',
    blocks: [
      { type: 'wait', label: 'wait 1 second', value: 1 },
      { type: 'wait', label: 'pause for a moment', value: 0.5 },
    ],
  },
  language: {
    title: 'Words blocks',
    blocks: [
      { type: 'say', label: 'say “Ẹ káàárọ̀!”', text: 'Ẹ káàárọ̀!' },
      { type: 'say', label: 'say “Daalụ!”', text: 'Daalụ!' },
      { type: 'say', label: 'say “Asante!”', text: 'Asante!' },
    ],
  },
};
const DEFAULT_PROJECT = {
  version: 2,
  name: 'Ìràwọ̀ says hello',
  script: [
    { id: 'block-move', type: 'move', value: 18 },
    { id: 'block-say', type: 'say', text: 'Ẹ káàárọ̀!' },
    { id: 'block-sound', type: 'sound' },
  ],
  costumes: [
    { id: 'firefly', name: 'Ìràwọ̀ · Firefly', kind: 'firefly', color: '#d99237' },
    { id: 'seedling', name: 'Igi · Seedling', kind: 'seedling', color: '#4d8c59' },
    { id: 'sunbird', name: 'Ẹyẹ · Sunbird', kind: 'sunbird', color: '#d96e48' },
  ],
  activeCostumeId: 'firefly',
  soundId: 'chime',
  soundVolume: 55,
  soundPitch: 1,
};
const PALETTE = {
  ink: '#173a29',
  green: '#17643f',
  leaf: '#4d8c59',
  ochre: '#d99237',
  coral: '#d96e48',
  sky: '#eaf3ea',
  ground: '#dcecdf',
};
const $ = (id) => document.getElementById(id);
let project = readProject();
let activeCategory = 'motion';
let stageState = { x: 0, y: 0, direction: 0, speech: '' };
let audioContext;
let saveTimer;
let activeRun = 0;

function cloneDefaultProject() {
  return JSON.parse(JSON.stringify(DEFAULT_PROJECT));
}

function validateProject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 2) {
    throw new Error('Choose a valid Ìdíléwa Code project file.');
  }
  if (typeof value.name !== 'string' || value.name.trim().length === 0 || value.name.length > 60) {
    throw new Error('Project names must contain 1–60 characters.');
  }
  if (!Array.isArray(value.script) || value.script.length > MAX_SCRIPT_BLOCKS) {
    throw new Error(`Projects can contain up to ${MAX_SCRIPT_BLOCKS} blocks.`);
  }
  const allowedTypes = new Set(['move', 'turn', 'say', 'sound', 'wait', 'costume']);
  const blockIds = new Set();
  const script = value.script.map((block) => {
    if (!block || typeof block !== 'object' || !allowedTypes.has(block.type)
      || typeof block.id !== 'string' || blockIds.has(block.id)) {
      throw new Error('The project contains an invalid or repeated program block.');
    }
    blockIds.add(block.id);
    if (['move', 'turn', 'wait'].includes(block.type)) {
      if (!Number.isFinite(block.value)) throw new Error('A number in the program is invalid.');
      const bounds = block.type === 'move'
        ? [-100, 100]
        : block.type === 'turn'
          ? [-360, 360]
          : [0, 10];
      if (block.value < bounds[0] || block.value > bounds[1]) {
        throw new Error('A program value is outside its supported range.');
      }
    }
    if (block.type === 'say'
      && (typeof block.text !== 'string' || block.text.trim().length === 0 || block.text.length > 120)) {
      throw new Error('Speech blocks must contain 1–120 characters.');
    }
    if (block.type === 'costume'
      && (typeof block.value !== 'string' || (block.value !== 'next'
        && (!Array.isArray(value.costumes) || !value.costumes.some((costume) => costume?.id === block.value))))) {
      throw new Error('A costume block points to a costume that is not in this project.');
    }
    return { ...block };
  });
  if (!Array.isArray(value.costumes) || value.costumes.length === 0 || value.costumes.length > 8) {
    throw new Error('Projects need 1–8 costumes.');
  }
  const costumeIds = new Set();
  const costumes = value.costumes.map((costume) => {
    if (!costume || typeof costume !== 'object'
      || typeof costume.id !== 'string' || !/^[a-z0-9-]{1,48}$/i.test(costume.id)
      || costumeIds.has(costume.id)) {
      throw new Error('The project contains an invalid or repeated costume.');
    }
    costumeIds.add(costume.id);
    if (typeof costume.name !== 'string' || costume.name.trim().length === 0 || costume.name.length > 36
      || !COSTUME_KINDS.has(costume.kind)
      || typeof costume.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(costume.color)) {
      throw new Error('Check the name, style, and color of each costume.');
    }
    return {
      id: costume.id,
      name: costume.name.trim(),
      kind: costume.kind,
      color: costume.color,
    };
  });
  if (!costumeIds.has(value.activeCostumeId)) {
    throw new Error('Choose a costume that belongs to this project.');
  }
  if (!Object.hasOwn(SOUND_PRESETS, value.soundId)) {
    throw new Error('Choose a supported sound.');
  }
  if (!Number.isFinite(value.soundVolume) || value.soundVolume < 0 || value.soundVolume > 100
    || !Number.isFinite(value.soundPitch) || value.soundPitch < 0.5 || value.soundPitch > 1.8) {
    throw new Error('Sound volume or pitch is outside its supported range.');
  }
  return {
    version: 2,
    name: value.name.trim(),
    script,
    costumes,
    activeCostumeId: value.activeCostumeId,
    soundId: value.soundId,
    soundVolume: value.soundVolume,
    soundPitch: value.soundPitch,
  };
}

function readProject() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    queueMicrotask(() => setSaveStatus(`This browser blocked project storage: ${error.message}`, 'error'));
    return cloneDefaultProject();
  }
  if (!saved) return cloneDefaultProject();
  try {
    return validateProject(JSON.parse(saved));
  } catch (error) {
    queueMicrotask(() => setSaveStatus(`Saved project could not be loaded: ${error.message}`, 'error'));
    return cloneDefaultProject();
  }
}

function currentCostume() {
  return project.costumes.find((costume) => costume.id === project.activeCostumeId) || project.costumes[0];
}

function setSaveStatus(message, state = 'saved') {
  $('save-status').textContent = message;
  $('save-status').dataset.state = state;
  $('studio-announcer').textContent = message;
}

function persistProject() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    setSaveStatus('Saved on this device', 'saved');
    return true;
  } catch (error) {
    setSaveStatus(`Project could not be saved: ${error.message}`, 'error');
    return false;
  }
}

function scheduleSave() {
  setSaveStatus('Saving…', 'saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistProject, 250);
}

function setWorkspace(name) {
  document.querySelectorAll('[data-workspace]').forEach((tab) => {
    const active = tab.dataset.workspace === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[data-workspace-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.workspacePanel !== name;
  });
  if (name === 'costumes') drawCostumeWorkspace();
  if (name === 'sounds') drawSoundWorkspace();
}

function addTabKeyboardNavigation(tablist, selector, select) {
  tablist.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...tablist.querySelectorAll(selector)];
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    select(tabs[nextIndex]);
    tabs[nextIndex].focus();
  });
}

function renderPalette() {
  const category = BLOCK_CATEGORIES[activeCategory];
  $('palette-title').textContent = category.title;
  $('palette-blocks').replaceChildren();
  category.blocks.forEach((definition, index) => {
    const button = document.createElement('button');
    button.className = 'code-palette-block';
    button.type = 'button';
    button.draggable = true;
    button.dataset.category = activeCategory;
    button.dataset.definitionIndex = String(index);
    button.dataset.blockType = definition.type;
    const label = document.createElement('span');
    label.textContent = definition.label;
    const plus = document.createElement('span');
    plus.className = 'code-block-plus';
    plus.setAttribute('aria-hidden', 'true');
    plus.textContent = '+';
    button.append(label, plus);
    $('palette-blocks').append(button);
  });
}

function createBlockId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addBlock(category, definitionIndex, insertAt = project.script.length) {
  const definition = BLOCK_CATEGORIES[category]?.blocks[definitionIndex];
  if (!definition) {
    setSaveStatus('That block is not available. Choose another block.', 'error');
    return;
  }
  if (project.script.length >= MAX_SCRIPT_BLOCKS) {
    setSaveStatus(`This program already has ${MAX_SCRIPT_BLOCKS} blocks. Remove one before adding another.`, 'error');
    return;
  }
  const block = { ...definition, id: createBlockId() };
  delete block.label;
  project.script.splice(insertAt, 0, block);
  renderScript();
  scheduleSave();
  setSaveStatus('Block added to your program.', 'saved');
}

function svgToolIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const shapes = {
    up: 'm4 12 6-6 6 6',
    down: 'm4 8 6 6 6-6',
    remove: 'M5 5l10 10M15 5 5 15',
  };
  path.setAttribute('d', shapes[name]);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-width', '1.8');
  svg.append(path);
  return svg;
}

function createBlockTool(label, icon, action, index) {
  const button = document.createElement('button');
  button.className = 'code-block-tool';
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.dataset.scriptAction = action;
  button.dataset.blockIndex = String(index);
  button.append(svgToolIcon(icon));
  return button;
}

function createBlockField(block, index, field, type, value, label) {
  const input = document.createElement('input');
  input.type = type;
  input.value = String(value);
  input.dataset.blockIndex = String(index);
  input.dataset.blockField = field;
  input.setAttribute('aria-label', label);
  if (type === 'number') {
    input.step = block.type === 'wait' ? '0.5' : '1';
    input.min = block.type === 'move' ? '-100' : block.type === 'turn' ? '-360' : '0';
    input.max = block.type === 'move' ? '100' : block.type === 'turn' ? '360' : '10';
  }
  return input;
}

function createCostumeField(block, index) {
  const select = document.createElement('select');
  select.dataset.blockIndex = String(index);
  select.dataset.blockField = 'value';
  select.setAttribute('aria-label', 'Costume to switch to');
  const next = document.createElement('option');
  next.value = 'next';
  next.textContent = 'next costume';
  select.append(next);
  project.costumes.forEach((costume) => {
    const option = document.createElement('option');
    option.value = costume.id;
    option.textContent = costume.name;
    select.append(option);
  });
  select.value = block.value;
  return select;
}

function blockDescription(block, index) {
  const row = document.createElement('article');
  row.className = 'code-script-block';
  row.dataset.blockIndex = String(index);
  row.dataset.blockType = block.type;
  row.draggable = true;
  const appendText = (text) => row.append(document.createTextNode(text));
  if (block.type === 'move') {
    appendText('move');
    row.append(createBlockField(block, index, 'value', 'number', block.value, 'Steps to move'));
    appendText('steps');
  } else if (block.type === 'turn') {
    appendText('turn');
    row.append(createBlockField(block, index, 'value', 'number', block.value, 'Degrees to turn'));
    appendText('degrees');
  } else if (block.type === 'say') {
    appendText('say');
    row.append(createBlockField(block, index, 'text', 'text', block.text, 'Words for the character to say'));
  } else if (block.type === 'sound') {
    appendText('play');
    const soundName = document.createElement('strong');
    soundName.textContent = SOUND_PRESETS[project.soundId].name;
    row.append(soundName);
  } else if (block.type === 'wait') {
    appendText('wait');
    row.append(createBlockField(block, index, 'value', 'number', block.value, 'Seconds to wait'));
    appendText('seconds');
  } else if (block.type === 'costume') {
    appendText('switch costume to');
    row.append(createCostumeField(block, index));
  }

  const tools = document.createElement('span');
  tools.className = 'code-block-tools';
  tools.append(
    createBlockTool('Move block up', 'up', 'up', index),
    createBlockTool('Move block down', 'down', 'down', index),
    createBlockTool('Remove block', 'remove', 'remove', index),
  );
  row.append(tools);
  return row;
}

function renderScript() {
  const stack = $('script-stack');
  stack.replaceChildren();
  const trigger = document.createElement('div');
  trigger.className = 'code-trigger-block';
  const dot = document.createElement('span');
  dot.className = 'code-trigger-dot';
  dot.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = 'When Run is pressed';
  trigger.append(dot, label);
  stack.append(trigger);
  if (project.script.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'code-run-status';
    empty.textContent = 'No blocks yet. Choose one from the palette to start your program.';
    stack.append(empty);
  }
  project.script.forEach((block, index) => stack.append(blockDescription(block, index)));
  $('script-count').textContent = `${project.script.length} ${project.script.length === 1 ? 'block' : 'blocks'}`;
}

function moveBlock(from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to)
    || from < 0 || from >= project.script.length || to < 0 || to >= project.script.length
    || from === to) return;
  const [block] = project.script.splice(from, 1);
  project.script.splice(to, 0, block);
  renderScript();
  scheduleSave();
}

function handleScriptAction(event) {
  const tool = event.target.closest('[data-script-action]');
  if (tool) {
    const index = Number(tool.dataset.blockIndex);
    if (tool.dataset.scriptAction === 'remove') {
      project.script.splice(index, 1);
      renderScript();
      scheduleSave();
    } else if (tool.dataset.scriptAction === 'up') {
      moveBlock(index, index - 1);
    } else if (tool.dataset.scriptAction === 'down') {
      moveBlock(index, index + 1);
    }
  }
}

function updateBlockField(event) {
  const field = event.target.closest('[data-block-field]');
  if (!field) return;
  const index = Number(field.dataset.blockIndex);
  const block = project.script[index];
  if (!block) return;
  const value = field.type === 'number' ? Number(field.value) : field.value;
  if (field.type === 'number' && (!Number.isFinite(value) || field.value === '')) return;
  block[field.dataset.blockField] = value;
  if (block.type === 'say' && value.length > 120) {
    block.text = value.slice(0, 120);
    field.value = block.text;
  }
  scheduleSave();
}

function reorderFromDrop(event) {
  const rawFrom = event.dataTransfer?.getData('application/x-idilewa-script-index');
  if (!rawFrom) return;
  const from = Number(rawFrom);
  const targetBlock = event.target.closest('[data-block-index]');
  const to = targetBlock ? Number(targetBlock.dataset.blockIndex) : project.script.length - 1;
  if (Number.isInteger(from)) moveBlock(from, to);
}

function drawCharacter(context, costume, x, y, direction = 0, scale = 1) {
  context.save();
  context.translate(x, y);
  context.rotate(direction * Math.PI / 180);
  context.scale(scale, scale);
  context.lineWidth = 2.5;
  context.lineJoin = 'round';
  context.lineCap = 'round';

  if (costume.kind === 'firefly') {
    context.fillStyle = '#f3d9a8';
    context.beginPath();
    context.ellipse(-22, -9, 14, 20, -0.45, 0, Math.PI * 2);
    context.ellipse(22, -9, 14, 20, 0.45, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = costume.color;
    context.beginPath();
    context.ellipse(0, 2, 26, 34, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#6f4a24';
    context.beginPath();
    context.moveTo(-10, -26);
    context.quadraticCurveTo(-15, -45, -25, -44);
    context.moveTo(10, -26);
    context.quadraticCurveTo(15, -45, 25, -44);
    context.stroke();
    context.fillStyle = '#173a29';
    context.beginPath();
    context.arc(-9, -4, 3, 0, Math.PI * 2);
    context.arc(9, -4, 3, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ffe08a';
    context.beginPath();
    context.ellipse(0, 15, 11, 9, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#6f4a24';
    context.beginPath();
    context.arc(0, 2, 8, 0.25, Math.PI - 0.25);
    context.stroke();
  } else if (costume.kind === 'seedling') {
    context.fillStyle = costume.color;
    context.beginPath();
    context.ellipse(0, 8, 25, 30, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#d7edbd';
    context.beginPath();
    context.ellipse(-10, -27, 10, 21, -0.7, 0, Math.PI * 2);
    context.ellipse(10, -27, 10, 21, 0.7, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#477647';
    context.beginPath();
    context.moveTo(-10, -43);
    context.lineTo(0, -25);
    context.lineTo(10, -43);
    context.stroke();
    context.fillStyle = '#173a29';
    context.beginPath();
    context.arc(-8, 3, 2.8, 0, Math.PI * 2);
    context.arc(8, 3, 2.8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#173a29';
    context.beginPath();
    context.arc(0, 11, 7, 0.25, Math.PI - 0.25);
    context.stroke();
    context.fillStyle = '#e8b84c';
    context.fillRect(-18, 30, 12, 5);
    context.fillRect(6, 30, 12, 5);
  } else {
    context.fillStyle = costume.color;
    context.beginPath();
    context.ellipse(-1, 4, 28, 22, -0.15, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f4c452';
    context.beginPath();
    context.ellipse(-4, 0, 17, 10, -0.25, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = costume.color;
    context.beginPath();
    context.arc(21, -13, 16, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#c76a30';
    context.beginPath();
    context.moveTo(34, -12);
    context.lineTo(52, -6);
    context.lineTo(34, -2);
    context.closePath();
    context.fill();
    context.fillStyle = '#173a29';
    context.beginPath();
    context.arc(24, -16, 2.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#417b50';
    context.beginPath();
    context.ellipse(-26, -5, 12, 5, -0.45, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#d89a39';
    context.fillRect(-15, 22, 7, 13);
    context.fillRect(8, 22, 7, 13);
  }
  context.restore();
}

function drawStage(canvas, state = stageState, showSpeech = true) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not draw the stage.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f4faf3';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = '#f0c866';
  context.beginPath();
  context.arc(405, 62, 25, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#e5f1e4';
  context.beginPath();
  context.ellipse(92, 223, 112, 62, 0, 0, Math.PI * 2);
  context.ellipse(405, 236, 126, 74, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#d3e8d6';
  context.fillRect(0, 264, canvas.width, 56);

  context.strokeStyle = '#82a981';
  context.lineWidth = 2;
  for (const [x, y] of [[45, 268], [94, 280], [370, 273], [427, 285]]) {
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x, y - 16);
    context.stroke();
    context.fillStyle = '#69976c';
    context.beginPath();
    context.ellipse(x - 5, y - 12, 6, 3, -0.5, 0, Math.PI * 2);
    context.ellipse(x + 5, y - 17, 6, 3, 0.5, 0, Math.PI * 2);
    context.fill();
  }

  const costume = currentCostume();
  const x = Math.max(54, Math.min(canvas.width - 54, canvas.width / 2 + state.x));
  const y = Math.max(78, Math.min(canvas.height - 44, canvas.height / 2 + state.y));
  drawCharacter(context, costume, x, y, state.direction, 1.08);

  if (showSpeech && state.speech) {
    context.fillStyle = '#fff';
    context.strokeStyle = '#b7cdb9';
    context.lineWidth = 1;
    context.fillRect(x - 80, y - 95, 160, 38);
    context.strokeRect(x - 80, y - 95, 160, 38);
    context.fillStyle = PALETTE.ink;
    context.font = '700 13px "Space Grotesk", sans-serif';
    context.textAlign = 'center';
    context.fillText(state.speech, x, y - 71, 146);
  }
}

function renderStageViews() {
  ['stage-canvas', 'costume-stage-canvas', 'sound-stage-canvas'].forEach((id) => {
    drawStage($(id));
  });
  const position = `${Math.round(stageState.x)}, ${Math.round(stageState.y)}`;
  $('stage-position').textContent = position;
  $('stage-sprite-name').textContent = `${currentCostume().name}`;
  $('stage-sprite-name').setAttribute('aria-label', `${currentCostume().name} is selected`);
  const thumbnail = $('sprite-thumb').getContext('2d');
  if (!thumbnail) throw new Error('This browser could not draw the sprite preview.');
  thumbnail.clearRect(0, 0, 72, 72);
  drawCharacter(thumbnail, currentCostume(), 36, 41, 0, 0.62);
}

function renderCostumeWorkspace() {
  const list = $('costume-list');
  list.replaceChildren();
  project.costumes.forEach((costume) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-costume-choice';
    button.classList.toggle('is-selected', costume.id === project.activeCostumeId);
    button.dataset.costumeId = costume.id;
    button.setAttribute('aria-pressed', String(costume.id === project.activeCostumeId));
    const swatch = document.createElement('span');
    swatch.className = 'code-costume-swatch';
    const thumb = document.createElement('canvas');
    thumb.width = 72;
    thumb.height = 72;
    const thumbnailContext = thumb.getContext('2d');
    if (!thumbnailContext) throw new Error('This browser could not draw a costume preview.');
    drawCharacter(thumbnailContext, costume, 36, 41, 0, 0.62);
    swatch.append(thumb);
    const name = document.createElement('span');
    name.className = 'code-asset-name';
    const title = document.createElement('span');
    title.textContent = costume.name;
    const kind = document.createElement('small');
    kind.textContent = costume.kind === 'firefly' ? 'Firefly' : costume.kind === 'seedling' ? 'Seedling' : 'Sunbird';
    name.append(title, kind);
    button.append(swatch, name);
    list.append(button);
  });

  const selected = currentCostume();
  $('costume-name').value = selected.name;
  $('costume-color').value = selected.color;
  const canvas = $('costume-canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not draw the costume editor.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawCharacter(context, selected, canvas.width / 2, canvas.height / 2 + 8, -8, 2);
  renderStageViews();
}

function drawSoundWaveform() {
  const canvas = $('sound-waveform');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser could not draw the sound preview.');
  const preset = SOUND_PRESETS[project.soundId];
  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#f8fbf8';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = '#dce8dd';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  context.strokeStyle = project.soundId === 'drum' ? '#b97924' : project.soundId === 'rain' ? '#438576' : '#6b8c56';
  context.lineWidth = 3;
  context.beginPath();
  for (let x = 0; x < width; x += 1) {
    const progress = x / width;
    const envelope = Math.sin(progress * Math.PI) * (0.32 + 0.68 * Math.abs(Math.sin(progress * Math.PI * 3)));
    const note = preset.notes[Math.min(preset.notes.length - 1, Math.floor(progress * preset.notes.length))];
    const cycles = (note * project.soundPitch / 170) * 2.8;
    const y = height / 2 + Math.sin(progress * Math.PI * 2 * cycles) * envelope * height * 0.34;
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

function renderSoundWorkspace() {
  const list = $('sound-list');
  list.replaceChildren();
  Object.entries(SOUND_PRESETS).forEach(([id, sound]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-sound-choice';
    button.classList.toggle('is-selected', project.soundId === id);
    button.dataset.soundId = id;
    button.setAttribute('aria-pressed', String(project.soundId === id));
    const swatch = document.createElement('span');
    swatch.className = 'code-sound-swatch';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 10v4m4-8v12m4-14v16m4-11v6m4-9v12');
    icon.append(path);
    swatch.append(icon);
    const name = document.createElement('span');
    name.className = 'code-asset-name';
    const title = document.createElement('span');
    title.textContent = sound.name;
    const note = document.createElement('small');
    note.textContent = sound.note;
    name.append(title, note);
    button.append(swatch, name);
    list.append(button);
  });
  $('sound-volume').value = String(project.soundVolume);
  $('sound-volume-value').textContent = `${project.soundVolume}%`;
  $('sound-pitch').value = String(project.soundPitch);
  $('sound-pitch-value').textContent = `${project.soundPitch.toFixed(1)}×`;
  drawSoundWaveform();
  renderStageViews();
  renderScript();
}

function drawCostumeWorkspace() {
  renderCostumeWorkspace();
}

function drawSoundWorkspace() {
  renderSoundWorkspace();
}

function selectCostume(id) {
  if (!project.costumes.some((costume) => costume.id === id)) {
    setSaveStatus('That costume is no longer available. Choose another one.', 'error');
    return;
  }
  project.activeCostumeId = id;
  renderCostumeWorkspace();
  renderScript();
  scheduleSave();
}

function addCostume() {
  if (project.costumes.length >= 8) {
    setSaveStatus('This project already has 8 costumes. Edit an existing costume instead.', 'error');
    return;
  }
  const source = currentCostume();
  let id = `costume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  while (project.costumes.some((costume) => costume.id === id)) {
    id = `costume-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  const costume = {
    ...source,
    id,
    name: `Costume ${project.costumes.length + 1}`,
  };
  project.costumes.push(costume);
  project.activeCostumeId = id;
  renderCostumeWorkspace();
  renderScript();
  scheduleSave();
  setSaveStatus('Costume variation added. Choose its color and name.', 'saved');
}

function setCostumeColor(value) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    setSaveStatus('Choose a valid costume color.', 'error');
    return;
  }
  currentCostume().color = value;
  renderCostumeWorkspace();
  renderScript();
  scheduleSave();
}

function setCostumeName(value) {
  const name = value.trim().slice(0, 36);
  if (!name) {
    setSaveStatus('Costume names cannot be empty.', 'error');
    return;
  }
  currentCostume().name = name;
  renderCostumeWorkspace();
  renderScript();
  scheduleSave();
}

function setSound(id) {
  if (!Object.hasOwn(SOUND_PRESETS, id)) {
    setSaveStatus('Choose one of the available sounds.', 'error');
    return;
  }
  project.soundId = id;
  renderSoundWorkspace();
  scheduleSave();
}

function setSoundVolume(value) {
  const volume = Number(value);
  if (!Number.isFinite(volume) || volume < 0 || volume > 100) {
    setSaveStatus('Sound volume must be between 0 and 100%.', 'error');
    return;
  }
  project.soundVolume = volume;
  $('sound-volume-value').textContent = `${volume}%`;
  scheduleSave();
}

function setSoundPitch(value) {
  const pitch = Number(value);
  if (!Number.isFinite(pitch) || pitch < 0.5 || pitch > 1.8) {
    setSaveStatus('Sound pitch must be between 0.5× and 1.8×.', 'error');
    return;
  }
  project.soundPitch = pitch;
  $('sound-pitch-value').textContent = `${pitch.toFixed(1)}×`;
  drawSoundWaveform();
  scheduleSave();
}

async function playSound() {
  if (project.soundVolume === 0) {
    $('sound-status').textContent = 'Volume is at 0%. Raise it to hear this sound.';
    return false;
  }
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    $('sound-status').textContent = 'Sound could not play: this browser does not support synthesized audio.';
    return false;
  }
  try {
    if (!audioContext || audioContext.state === 'closed') audioContext = new AudioContextConstructor();
    if (audioContext.state !== 'running') {
      const resumed = await Promise.race([
        audioContext.resume().then(() => true),
        wait(1000).then(() => false),
      ]);
      if (!resumed || audioContext.state !== 'running') {
        throw new Error('Audio did not start. Check browser sound permissions and try again.');
      }
    }

    const sound = SOUND_PRESETS[project.soundId];
    const start = audioContext.currentTime;
    const level = Math.max(0.001, project.soundVolume / 100 * 0.13);
    sound.notes.forEach((note, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const time = start + index * 0.17;
      oscillator.type = sound.waveform;
      oscillator.frequency.setValueAtTime(note * project.soundPitch, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(level, time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.16);
    });
    $('sound-status').textContent = `${sound.name} played. Adjust the volume or pitch and try again.`;
    return true;
  } catch (error) {
    $('sound-status').textContent = `Sound could not play: ${error.message}`;
    return false;
  }
}

function updateRunStatus(message) {
  $('run-status').textContent = message;
  $('studio-announcer').textContent = message;
}

function highlightBlock(index) {
  document.querySelectorAll('.code-script-block').forEach((block, blockIndex) => {
    block.classList.toggle('is-running', blockIndex === index);
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function activateCostume(value) {
  let costume = project.costumes.find((entry) => entry.id === value);
  if (value === 'next' || !costume) {
    const index = project.costumes.findIndex((entry) => entry.id === project.activeCostumeId);
    costume = project.costumes[(index + 1) % project.costumes.length];
  }
  project.activeCostumeId = costume.id;
  renderStageViews();
  renderCostumeListOnly();
  scheduleSave();
}

function renderCostumeListOnly() {
  if (!$('workspace-costumes').hidden) renderCostumeWorkspace();
  else renderStageViews();
}

async function executeBlock(block, runId) {
  if (block.type === 'move') {
    const distance = block.value * 3;
    stageState.x = Math.max(-150, Math.min(150, stageState.x + Math.cos(stageState.direction * Math.PI / 180) * distance));
    stageState.y = Math.max(-72, Math.min(72, stageState.y - Math.sin(stageState.direction * Math.PI / 180) * distance));
    renderStageViews();
    await wait(350);
  } else if (block.type === 'turn') {
    stageState.direction = (stageState.direction + block.value) % 360;
    renderStageViews();
    await wait(280);
  } else if (block.type === 'say') {
    stageState.speech = block.text;
    renderStageViews();
    await wait(850);
    if (runId === activeRun) {
      stageState.speech = '';
      renderStageViews();
    }
  } else if (block.type === 'sound') {
    await playSound();
    await wait(300);
  } else if (block.type === 'wait') {
    await wait(Math.max(0, Math.min(block.value * 1000, 10000)));
  } else if (block.type === 'costume') {
    activateCostume(block.value);
    await wait(250);
  }
}

async function runProgram() {
  if (activeRun) return;
  activeRun += 1;
  const runId = activeRun;
  $('run-code').disabled = true;
  $('stop-code').disabled = false;
  if (project.script.length === 0) {
    updateRunStatus('Add a block to your program before running it.');
    activeRun = 0;
    $('run-code').disabled = false;
    $('stop-code').disabled = true;
    return;
  }
  try {
    updateRunStatus('Your program is running…');
    for (let index = 0; index < project.script.length; index += 1) {
      if (runId !== activeRun) return;
      highlightBlock(index);
      await executeBlock(project.script[index], runId);
    }
    if (runId === activeRun) updateRunStatus('Program complete. Change a block and run it again.');
  } catch (error) {
    if (runId === activeRun) updateRunStatus(`Program stopped: ${error.message}`);
  } finally {
    if (runId === activeRun) {
      activeRun = 0;
      $('run-code').disabled = false;
      $('stop-code').disabled = true;
      highlightBlock(-1);
    }
  }
}

function stopProgram() {
  if (!activeRun) return;
  activeRun += 1;
  $('run-code').disabled = false;
  $('stop-code').disabled = true;
  stageState.speech = '';
  highlightBlock(-1);
  renderStageViews();
  activeRun = 0;
  updateRunStatus('Program stopped.');
}

function resetStage() {
  if (activeRun) stopProgram();
  stageState = { x: 0, y: 0, direction: 0, speech: '' };
  renderStageViews();
  updateRunStatus('Stage reset. Ready when you are.');
}

function escapeFileName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'idilewa-project';
}

function exportProject() {
  try {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${escapeFileName(project.name)}.idilewa-code.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaveStatus('Project exported as a JSON file.', 'saved');
  } catch (error) {
    setSaveStatus(`Project could not be exported: ${error.message}`, 'error');
  }
}

async function importProjectFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 100_000) {
    setSaveStatus('Project files must be 100 KB or smaller.', 'error');
    return;
  }
  try {
    const imported = validateProject(JSON.parse(await file.text()));
    project = imported;
    $('project-name').value = project.name;
    renderScript();
    renderCostumeWorkspace();
    renderSoundWorkspace();
    persistProject();
    setSaveStatus(`${project.name} imported and saved on this device.`, 'saved');
  } catch (error) {
    setSaveStatus(`Project could not be imported: ${error.message}`, 'error');
  }
}

function setProjectName(value) {
  const name = value.trim().slice(0, 60);
  project.name = name || 'Untitled project';
  scheduleSave();
}

function bindEvents() {
  const workspaceTabs = document.querySelector('[role="tablist"][aria-label="Editor workspaces"]');
  workspaceTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-workspace]');
    if (tab) setWorkspace(tab.dataset.workspace);
  });
  addTabKeyboardNavigation(workspaceTabs, '[data-workspace]', (tab) => setWorkspace(tab.dataset.workspace));

  const categoryTabs = $('block-categories');
  categoryTabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-category]');
    if (!tab) return;
    activeCategory = tab.dataset.category;
    categoryTabs.querySelectorAll('[data-category]').forEach((category) => {
      const active = category === tab;
      category.classList.toggle('is-active', active);
      category.setAttribute('aria-selected', String(active));
      category.tabIndex = active ? 0 : -1;
    });
    renderPalette();
  });
  addTabKeyboardNavigation(categoryTabs, '[data-category]', (tab) => {
    activeCategory = tab.dataset.category;
    categoryTabs.querySelectorAll('[data-category]').forEach((category) => {
      const active = category === tab;
      category.classList.toggle('is-active', active);
      category.setAttribute('aria-selected', String(active));
      category.tabIndex = active ? 0 : -1;
    });
    renderPalette();
  });

  $('palette-blocks').addEventListener('click', (event) => {
    const button = event.target.closest('[data-definition-index]');
    if (button) addBlock(button.dataset.category, Number(button.dataset.definitionIndex));
  });
  $('palette-blocks').addEventListener('dragstart', (event) => {
    const button = event.target.closest('[data-definition-index]');
    if (!button || !event.dataTransfer) return;
    event.dataTransfer.setData('application/x-idilewa-palette-block', JSON.stringify({
      category: button.dataset.category,
      index: Number(button.dataset.definitionIndex),
    }));
    event.dataTransfer.effectAllowed = 'copy';
  });
  const scriptStack = $('script-stack');
  scriptStack.addEventListener('click', handleScriptAction);
  scriptStack.addEventListener('input', updateBlockField);
  scriptStack.addEventListener('change', updateBlockField);
  scriptStack.addEventListener('dragstart', (event) => {
    const block = event.target.closest('.code-script-block');
    if (!block || !event.dataTransfer) return;
    event.dataTransfer.setData('application/x-idilewa-script-index', block.dataset.blockIndex);
    event.dataTransfer.effectAllowed = 'move';
  });
  scriptStack.addEventListener('dragover', (event) => {
    if (!event.dataTransfer) return;
    event.preventDefault();
    $('script-drop-hint').hidden = false;
  });
  scriptStack.addEventListener('dragleave', (event) => {
    if (!scriptStack.contains(event.relatedTarget)) $('script-drop-hint').hidden = true;
  });
  scriptStack.addEventListener('drop', (event) => {
    event.preventDefault();
    $('script-drop-hint').hidden = true;
    const paletteData = event.dataTransfer?.getData('application/x-idilewa-palette-block');
    if (paletteData) {
      try {
        const { category, index } = JSON.parse(paletteData);
        const target = event.target.closest('.code-script-block');
        addBlock(category, index, target ? Number(target.dataset.blockIndex) : project.script.length);
      } catch (error) {
        setSaveStatus(`Block could not be added: ${error.message}`, 'error');
      }
      return;
    }
    reorderFromDrop(event);
  });

  $('project-name').addEventListener('input', (event) => setProjectName(event.target.value));
  $('run-code').addEventListener('click', () => void runProgram());
  $('stop-code').addEventListener('click', stopProgram);
  $('reset-stage').addEventListener('click', resetStage);
  $('add-costume-from-code').addEventListener('click', () => setWorkspace('costumes'));
  $('add-costume').addEventListener('click', addCostume);
  $('costume-list').addEventListener('click', (event) => {
    const choice = event.target.closest('[data-costume-id]');
    if (choice) selectCostume(choice.dataset.costumeId);
  });
  $('costume-color').addEventListener('input', (event) => setCostumeColor(event.target.value));
  $('costume-name').addEventListener('change', (event) => setCostumeName(event.target.value));
  $('sound-list').addEventListener('click', (event) => {
    const choice = event.target.closest('[data-sound-id]');
    if (choice) setSound(choice.dataset.soundId);
  });
  $('sound-volume').addEventListener('input', (event) => setSoundVolume(event.target.value));
  $('sound-pitch').addEventListener('input', (event) => setSoundPitch(event.target.value));
  $('play-sound-preview').addEventListener('click', () => {
    void playSound().catch((error) => {
      $('sound-status').textContent = `Sound could not play: ${error.message}`;
    });
  });

  $('save-project').addEventListener('click', persistProject);
  $('export-project').addEventListener('click', exportProject);
  $('import-project').addEventListener('click', () => $('project-file').click());
  $('project-file').addEventListener('change', (event) => void importProjectFile(event));
  window.addEventListener('pagehide', () => {
    clearTimeout(saveTimer);
    if (activeRun) stopProgram();
    persistProject();
  });
}

function initialize() {
  $('project-name').value = project.name;
  renderPalette();
  renderScript();
  renderCostumeWorkspace();
  renderSoundWorkspace();
  bindEvents();
}

initialize();

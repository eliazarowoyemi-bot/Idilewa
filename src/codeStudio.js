import { translateText } from './translationEngine.js';
import { translateWithPlotweaver } from './plotweaverClient.js';
import {
  GAME_TEMPLATES,
  GameCanvas,
  RULE_CATALOG,
  STARTER_RULES,
} from './codeStudioEngine.js';

const STORAGE_KEY = 'idilewa-code-studio-project-v1';
const LANGUAGE_NAMES = {
  yo: 'Yorùbá',
  ig: 'Igbo',
  ha: 'Hausa',
  pcm: 'Nigerian Pidgin',
  sw: 'Kiswahili',
};
const DEFAULT_PROJECT = {
  name: 'Road Racer',
  title: 'Road Racer',
  template: 'race',
  stageTheme: 'night',
  playerColor: '#f4b740',
  speed: 1,
  soundEnabled: false,
  soundVolume: 35,
  soundStyle: 'warm',
  tempo: 100,
  blocks: STARTER_RULES.map((id) => ({ id, enabled: true })),
  instruction: GAME_TEMPLATES.race.instruction,
  translation: '',
  targetLanguage: 'yo',
  translatedLanguage: '',
};

const $ = (id) => document.getElementById(id);
const canvas = $('game-stage');
const saveStatus = $('save-status');
const announcer = $('studio-announcer');
const blockStack = $('block-stack');
let project = readProject();
let game;
let audioContext;
let saveTimer;
let canvaConfigured = false;
let canvaPopup = null;
let canvaPopupTimer = 0;

function cloneDefaultProject() {
  return {
    ...DEFAULT_PROJECT,
    blocks: DEFAULT_PROJECT.blocks.map((block) => ({ ...block })),
  };
}

function validateProject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The project file must contain a project object.');
  }
  if (!Object.hasOwn(GAME_TEMPLATES, value.template)) {
    throw new Error('Choose a supported game before importing this project.');
  }
  if (!Array.isArray(value.blocks) || value.blocks.length > 12
    || value.blocks.some((block) => !block || !Object.hasOwn(RULE_CATALOG, block.id)
      || typeof block.enabled !== 'boolean')
    || new Set(value.blocks.map((block) => block.id)).size !== value.blocks.length) {
    throw new Error('The project contains an invalid game rule list.');
  }
  if (typeof value.name !== 'string' || value.name.trim().length === 0 || value.name.length > 60) {
    throw new Error('Project names must contain 1–60 characters.');
  }
  if (typeof value.title !== 'string' || value.title.trim().length === 0 || value.title.length > 48) {
    throw new Error('Game titles must contain 1–48 characters.');
  }
  if (!['night', 'morning', 'canopy'].includes(value.stageTheme)) {
    throw new Error('Choose a supported stage setting.');
  }
  if (typeof value.playerColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.playerColor)) {
    throw new Error('The project contains an invalid player color.');
  }
  if (!Number.isFinite(value.speed) || value.speed < 0.7 || value.speed > 1.8) {
    throw new Error('Game speed must be between 0.7× and 1.8×.');
  }
  if (!Number.isFinite(value.soundVolume) || value.soundVolume < 0 || value.soundVolume > 100) {
    throw new Error('Sound volume must be between 0 and 100%.');
  }
  if (!Number.isFinite(value.tempo) || value.tempo < 60 || value.tempo > 160) {
    throw new Error('Beat tempo must be between 60 and 160 BPM.');
  }
  if (typeof value.soundEnabled !== 'boolean'
    || !['warm', 'clear', 'soft'].includes(value.soundStyle)) {
    throw new Error('The project contains invalid sound settings.');
  }
  if (typeof value.instruction !== 'string' || value.instruction.length > 500
    || typeof value.translation !== 'string' || value.translation.length > 500
    || !Object.hasOwn(LANGUAGE_NAMES, value.targetLanguage)
    || (value.translatedLanguage !== '' && !Object.hasOwn(LANGUAGE_NAMES, value.translatedLanguage))) {
    throw new Error('The project contains invalid language settings.');
  }
  return {
    ...value,
    name: value.name.trim(),
    title: value.title.trim(),
    blocks: value.blocks.map((block) => ({ id: block.id, enabled: block.enabled })),
  };
}

function readProject() {
  let saved;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    queueMicrotask(() => setSaveStatus(`This browser blocked local project storage: ${error.message}`, 'error'));
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

function setSaveStatus(message, state = 'saved') {
  saveStatus.textContent = message;
  saveStatus.dataset.state = state;
  announcer.textContent = message;
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

function getEnabledRules() {
  return project.blocks.filter((block) => block.enabled).map((block) => block.id);
}

function renderRules() {
  if (project.blocks.length === 0) {
    blockStack.innerHTML = '<p class="studio-hint">No rules yet. Add one to change how your game works.</p>';
    return;
  }
  blockStack.innerHTML = project.blocks.map((block, index) => {
    const rule = RULE_CATALOG[block.id];
    const disabledClass = block.enabled ? '' : ' is-disabled';
    const pressed = String(block.enabled);
    return `<article class="studio-rule${disabledClass}">
      <div class="studio-rule-description"><strong>${rule.title}</strong><span>${rule.description}</span></div>
      <button class="studio-rule-toggle" type="button" data-rule-toggle="${index}" aria-pressed="${pressed}" aria-label="${block.enabled ? 'Turn off' : 'Turn on'} ${rule.title}">${block.enabled ? 'On' : 'Off'}</button>
      <button class="studio-rule-remove" type="button" data-rule-remove="${index}" aria-label="Remove ${rule.title}">
        <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M5 6h10M8 6V4.5h4V6m1.5 0-.7 9h-5.6l-.7-9m3 2.2v4.5m2-4.5v4.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" /></svg>
      </button>
    </article>`;
  }).join('');
}

function renderProjectCode() {
  const translationIsCurrent = project.translation
    && project.translatedLanguage === project.targetLanguage;
  const projectCode = {
    project: project.name,
    game: project.template,
    title: project.title,
    stage: project.stageTheme,
    playerColor: project.playerColor,
    speed: Number(project.speed.toFixed(1)),
    rules: project.blocks.map(({ id, enabled }) => ({
      name: RULE_CATALOG[id].title,
      enabled,
    })),
    sound: {
      enabled: project.soundEnabled,
      style: project.soundStyle,
      volume: project.soundVolume,
      tempo: project.tempo,
    },
    language: translationIsCurrent ? project.targetLanguage : 'en',
    instruction: currentInstruction(),
  };
  $('project-code').textContent = JSON.stringify(projectCode, null, 2);
}

function currentInstruction() {
  return project.translation && project.translatedLanguage === project.targetLanguage
    ? project.translation
    : project.instruction;
}

function syncWorkspace() {
  const mazeControls = project.template === 'maze';
  $('workspace-project-title').textContent = project.title;
  $('workspace-project-description').textContent = GAME_TEMPLATES[project.template].description;
  $('game-instruction-preview').textContent = currentInstruction();
  $('game-stage').setAttribute(
    'aria-label',
    `Playable ${GAME_TEMPLATES[project.template].title} preview. Select the stage, then use ${mazeControls ? 'the' : 'left and right'} arrow keys.`,
  );
  document.querySelector('.studio-play-controls > p').textContent = mazeControls
    ? 'Click the stage, then use the arrow keys. On touch screens, use these controls.'
    : 'Use the left and right arrow keys. On touch screens, use these controls.';
  document.querySelectorAll('[data-direction="up"], [data-direction="down"]').forEach((button) => {
    button.hidden = !mazeControls;
  });
  $('speed-value').value = `${Number(project.speed).toFixed(1)}×`;
  $('speed-value').textContent = `${Number(project.speed).toFixed(1)}×`;
  $('volume-value').value = `${project.soundVolume}%`;
  $('volume-value').textContent = `${project.soundVolume}%`;
  $('tempo-value').value = `${project.tempo} BPM`;
  $('tempo-value').textContent = `${project.tempo} BPM`;
  $('sound-status').textContent = project.soundEnabled
    ? `Sound effects are on at ${project.soundVolume}% volume.`
    : 'Sound is off.';
  renderRules();
  renderProjectCode();
  game.setProject(project);
}

function updateProject(patch, { resetGame = false } = {}) {
  project = { ...project, ...patch };
  syncWorkspace();
  if (resetGame) game.reset();
  scheduleSave();
}

function setTab(tablist, selected, attribute) {
  const tabs = [...tablist.querySelectorAll(`[${attribute}]`)];
  tabs.forEach((tab) => {
    const isSelected = tab.getAttribute(attribute) === selected;
    tab.classList.toggle('is-active', isSelected);
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    const panel = $(tab.getAttribute('aria-controls'));
    if (panel) panel.hidden = !isSelected;
  });
}

function addKeyboardTabNavigation(tablist, attribute) {
  tablist.addEventListener('keydown', (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const tabs = [...tablist.querySelectorAll(`[${attribute}]`)];
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    const nextTab = tabs[nextIndex];
    setTab(tablist, nextTab.getAttribute(attribute), attribute);
    nextTab.focus();
  });
}

function eventSound(eventName) {
  if (!project.soundEnabled || !project.blocks.some((block) => block.id === 'sound' && block.enabled)) return;
  void playTone(eventName).catch((error) => {
    $('sound-status').textContent = `Sound could not play: ${error.message}`;
  });
}

async function playTone(eventName = 'preview') {
  if (project.soundVolume === 0) return;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    throw new Error('This browser does not support synthesized audio.');
  }
  if (!audioContext) audioContext = new AudioContextConstructor();
  if (audioContext.state === 'suspended') await audioContext.resume();

  const frequencies = {
    warm: { preview: 330, collect: 660, collision: 145, miss: 175, complete: 523 },
    clear: { preview: 440, collect: 880, collision: 220, miss: 262, complete: 659 },
    soft: { preview: 294, collect: 587, collision: 147, miss: 196, complete: 494 },
  };
  const frequency = frequencies[project.soundStyle][eventName] || frequencies[project.soundStyle].preview;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const duration = Math.max(0.08, 60 / project.tempo / 3);
  oscillator.type = project.soundStyle === 'soft' ? 'sine' : 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(project.soundVolume / 100 * 0.16, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function updateGameReadout(state) {
  const labels = {
    ready: 'Ready to play',
    running: 'Game in progress',
    paused: 'Game paused',
    complete: 'Game complete. Reset to play again.',
    over: 'Game over. Reset to try again.',
  };
  $('game-status').textContent = labels[state.phase];
  $('game-score').textContent = `Score ${state.score} · Lives ${state.lives}`;
  const runButton = $('run-game');
  runButton.querySelector('span').textContent = state.phase === 'running'
    ? 'Pause'
    : state.phase === 'paused'
      ? 'Resume'
      : 'Play';
  if (state.phase === 'complete') announcer.textContent = `${project.title} complete.`;
  if (state.phase === 'over') announcer.textContent = `${project.title} game over.`;
}

function changeSettingsPanel(panel) {
  setTab(document.querySelector('[role="tablist"][aria-label="Project settings"]'), panel, 'data-settings-tab');
}

function changeWorkspacePanel(panel) {
  setTab(document.querySelector('[role="tablist"][aria-label="Workspace view"]'), panel, 'data-workspace-tab');
}

function onRulesAction(event) {
  const toggleButton = event.target.closest('[data-rule-toggle]');
  const removeButton = event.target.closest('[data-rule-remove]');
  if (toggleButton) {
    const index = Number(toggleButton.dataset.ruleToggle);
    if (!Number.isInteger(index) || !project.blocks[index]) return;
    const blocks = project.blocks.map((block, blockIndex) => (
      blockIndex === index ? { ...block, enabled: !block.enabled } : block
    ));
    updateProject({ blocks });
  } else if (removeButton) {
    const index = Number(removeButton.dataset.ruleRemove);
    if (!Number.isInteger(index) || !project.blocks[index]) return;
    updateProject({ blocks: project.blocks.filter((_, blockIndex) => blockIndex !== index) });
  }
}

function onAddRule() {
  const id = $('block-picker').value;
  if (!Object.hasOwn(RULE_CATALOG, id)) {
    setSaveStatus('Choose a rule from the list before adding it.', 'error');
    return;
  }
  const existing = project.blocks.find((block) => block.id === id);
  const blocks = existing
    ? project.blocks.map((block) => block.id === id ? { ...block, enabled: true } : block)
    : [...project.blocks, { id, enabled: true }];
  if (blocks.length > 12) {
    setSaveStatus('A project can have up to 12 rules.', 'error');
    return;
  }
  updateProject({ blocks });
}

function startOrPauseGame() {
  if (game.state.phase === 'running') game.pause();
  else game.start();
  if (
    game.state.phase === 'running'
    && project.soundEnabled
    && project.blocks.some((block) => block.id === 'sound' && block.enabled)
  ) {
    void playTone('preview').catch((error) => {
      if (project.soundEnabled) $('sound-status').textContent = `Sound could not play: ${error.message}`;
    });
  }
}

function setSelectedGame(template) {
  if (!Object.hasOwn(GAME_TEMPLATES, template)) {
    setSaveStatus('Choose one of the available starter games.', 'error');
    return;
  }
  const title = GAME_TEMPLATES[template].title;
  updateProject({
    template,
    name: title,
    title,
    blocks: STARTER_RULES.map((id) => ({ id, enabled: true })),
    instruction: GAME_TEMPLATES[template].instruction,
    translation: '',
    translatedLanguage: '',
  }, { resetGame: true });
  $('project-name').value = project.name;
  $('game-title').value = project.title;
  $('game-instruction').value = project.instruction;
  $('translated-instruction').value = '';
  setSaveStatus(`${title} is ready to build.`, 'saved');
}

async function translateGameInstruction() {
  const source = $('game-instruction').value.trim();
  const targetLanguage = $('target-language').value;
  const button = $('translate-game-text');
  const status = $('translation-status');
  if (!source) {
    status.textContent = 'Enter an English instruction before translating.';
    return;
  }
  if (source.length > 500 || !Object.hasOwn(LANGUAGE_NAMES, targetLanguage)) {
    status.textContent = 'Check the instruction length and choose a supported language.';
    return;
  }

  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  status.textContent = `Translating to ${LANGUAGE_NAMES[targetLanguage]}…`;
  try {
    let translated;
    const phrasebookResult = translateText(source, targetLanguage);
    if (phrasebookResult.exact) {
      translated = phrasebookResult.translated;
    } else {
      const result = await translateWithPlotweaver({
        text: source,
        sourceLanguage: 'en',
        targetLanguage,
      });
      translated = result.translated_text;
    }
    if (typeof translated !== 'string' || !translated.trim()) {
      throw new Error('The translation service returned no text.');
    }
    project = {
      ...project,
      instruction: source,
      translation: translated.trim(),
      targetLanguage,
      translatedLanguage: targetLanguage,
    };
    $('translated-instruction').value = project.translation;
    syncWorkspace();
    scheduleSave();
    status.textContent = `Translation ready in ${LANGUAGE_NAMES[targetLanguage]}. Review it before using it in the game.`;
  } catch (error) {
    status.textContent = `Translation failed: ${error.message}`;
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

function applyTranslation() {
  const translation = $('translated-instruction').value.trim();
  const targetLanguage = $('target-language').value;
  if (!translation) {
    $('translation-status').textContent = 'Translate or enter a game instruction before using it.';
    return;
  }
  project = {
    ...project,
    instruction: $('game-instruction').value.trim(),
    translation,
    targetLanguage,
    translatedLanguage: targetLanguage,
  };
  syncWorkspace();
  scheduleSave();
  $('translation-status').textContent = `${LANGUAGE_NAMES[targetLanguage]} instruction is now shown with the game.`;
}

function setTheme() {
  updateProject({ stageTheme: $('stage-theme').value });
}

function setDesignColor() {
  const value = $('player-color').value;
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    setSaveStatus('Choose a valid player color.', 'error');
    return;
  }
  updateProject({ playerColor: value });
}

function setSpeed() {
  const value = Number($('game-speed').value);
  if (!Number.isFinite(value) || value < 0.7 || value > 1.8) {
    setSaveStatus('Game speed must be between 0.7× and 1.8×.', 'error');
    return;
  }
  updateProject({ speed: value });
}

function setSoundVolume() {
  const value = Number($('sound-volume').value);
  updateProject({ soundVolume: value });
}

function setTempo() {
  updateProject({ tempo: Number($('sound-tempo').value) });
}

function escapeProjectFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'idilewa-game';
}

function exportProject() {
  const projectFile = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(projectFile);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${escapeProjectFileName(project.name)}.idilewa.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setSaveStatus('Project exported as a JSON file.', 'saved');
}

async function importProjectFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 50_000) {
    setSaveStatus('Project files must be 50 KB or smaller.', 'error');
    return;
  }
  try {
    const imported = validateProject(JSON.parse(await file.text()));
    project = imported;
    syncProjectFields();
    syncWorkspace();
    persistProject();
    setSaveStatus(`${project.name} imported and saved on this device.`, 'saved');
  } catch (error) {
    setSaveStatus(`Project could not be imported: ${error.message}`, 'error');
  }
}

function syncProjectFields() {
  $('game-template').value = project.template;
  $('project-name').value = project.name;
  $('game-title').value = project.title;
  $('stage-theme').value = project.stageTheme;
  $('player-color').value = project.playerColor;
  $('game-speed').value = project.speed;
  $('sound-enabled').checked = project.soundEnabled;
  $('sound-volume').value = project.soundVolume;
  $('sound-style').value = project.soundStyle;
  $('sound-tempo').value = project.tempo;
  $('game-instruction').value = project.instruction;
  $('target-language').value = project.targetLanguage;
  $('translated-instruction').value = project.translation;
}

async function copyProjectCode() {
  try {
    await navigator.clipboard.writeText($('project-code').textContent);
    $('studio-announcer').textContent = 'Project settings copied.';
  } catch (error) {
    setSaveStatus(`Project settings could not be copied: ${error.message}`, 'error');
  }
}

async function fetchCanvaStatus() {
  const button = $('open-canva');
  const status = $('canva-status');
  button.disabled = true;
  try {
    const response = await fetch('/api/canva/status', { headers: { Accept: 'application/json' } });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Use the Idilewa production app or run the Vercel API locally to connect Canva.');
    }
    const result = await response.json();
    canvaConfigured = result.configured === true;
    if (!canvaConfigured) {
      status.textContent = result.message || 'Canva is not configured in Vercel yet.';
      button.textContent = 'Canva not set up';
      return;
    }
    status.textContent = result.message || 'Canva is ready. Sign in when you create a game artboard.';
    button.textContent = 'Connect & open Canva';
    button.disabled = false;
  } catch (error) {
    status.textContent = `Canva status could not be checked: ${error.message}`;
    button.textContent = 'Canva unavailable';
  }
}

function canvasPreviewData() {
  try {
    return canvas.toDataURL('image/png');
  } catch (error) {
    throw new Error(`The game preview could not be prepared for Canva: ${error.message}`);
  }
}

async function handleCanvaMessages(event) {
  if (event.origin !== window.location.origin || event.data?.type !== 'idilewa-canva-authorized') return;
  if (!canvaPopup || event.source !== canvaPopup) return;
  const popup = canvaPopup;
  $('canva-status').textContent = 'Authorization complete. Adding the game preview to Canva…';
  try {
    const editUrl = await createCanvaDesign({
      code: event.data.code,
      state: event.data.state,
    });
    if (!popup.closed) popup.location.replace(editUrl);
    $('canva-status').textContent = 'Canva artboard created. The game remains playable in this tab.';
  } catch (error) {
    const message = `Canva could not create the artboard: ${error.message}`;
    if (!popup.closed) {
      popup.postMessage({ type: 'idilewa-canva-error', message }, window.location.origin);
    }
    $('canva-status').textContent = message;
  } finally {
    clearInterval(canvaPopupTimer);
    canvaPopupTimer = 0;
    canvaPopup = null;
    $('open-canva').disabled = !canvaConfigured;
  }
}

function trackCanvaPopup(popup) {
  canvaPopup = popup;
  clearInterval(canvaPopupTimer);
  canvaPopupTimer = setInterval(() => {
    if (popup.closed) {
      clearInterval(canvaPopupTimer);
      canvaPopupTimer = 0;
      canvaPopup = null;
      $('open-canva').disabled = !canvaConfigured;
      $('canva-status').textContent = 'Canva was closed before the artboard was created.';
    }
  }, 700);
}

async function createCanvaDesign(authorization) {
  const response = await fetch('/api/canva/designs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      ...authorization,
      title: project.title,
      preview: canvasPreviewData(),
    }),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Canva returned an unreadable response. Try again.');
  }
  if (!response.ok) {
    const error = new Error(result.error || 'Canva could not create the design.');
    error.status = response.status;
    throw error;
  }
  if (typeof result.editUrl !== 'string') throw new Error('Canva returned no editing link.');
  const editUrl = new URL(result.editUrl);
  if (editUrl.origin !== 'https://www.canva.com') {
    throw new Error('Canva returned an unexpected editing link.');
  }
  return editUrl.href;
}

async function openCanvaDesign() {
  if (!canvaConfigured) {
    $('canva-status').textContent = 'Canva is not configured in Vercel yet.';
    return;
  }
  const popup = window.open('about:blank', '_blank');
  if (!popup) {
    $('canva-status').textContent = 'Allow pop-ups for Idilewa, then try Canva again.';
    return;
  }
  persistProject();
  trackCanvaPopup(popup);
  const button = $('open-canva');
  button.disabled = true;
  try {
    $('canva-status').textContent = 'Continue in the new tab to authorize Canva.';
    popup.location.replace('/api/canva/start');
  } catch (error) {
    if (!popup.closed) popup.close();
    clearInterval(canvaPopupTimer);
    canvaPopupTimer = 0;
    canvaPopup = null;
    button.disabled = !canvaConfigured;
    $('canva-status').textContent = `Canva could not open: ${error.message}`;
  }
}

function handleCanvaFallback() {
  const handoff = new URLSearchParams(window.location.hash.slice(1));
  const code = handoff.get('canva-code');
  const state = handoff.get('canva-state');
  if (!code || !state) return false;
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  $('canva-status').textContent = 'Authorization complete. Adding the game preview to Canva…';
  void createCanvaDesign({ code, state })
    .then((editUrl) => window.location.assign(editUrl))
    .catch((error) => {
      $('canva-status').textContent = `Canva could not create the design: ${error.message}`;
      $('open-canva').disabled = !canvaConfigured;
    });
  return true;
}

function bindEvents() {
  const settingsTablist = document.querySelector('[role="tablist"][aria-label="Project settings"]');
  settingsTablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-settings-tab]');
    if (tab) changeSettingsPanel(tab.dataset.settingsTab);
  });
  addKeyboardTabNavigation(settingsTablist, 'data-settings-tab');

  const workspaceTablist = document.querySelector('[role="tablist"][aria-label="Workspace view"]');
  workspaceTablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-workspace-tab]');
    if (tab) changeWorkspacePanel(tab.dataset.workspaceTab);
  });
  addKeyboardTabNavigation(workspaceTablist, 'data-workspace-tab');

  $('game-template').addEventListener('change', (event) => setSelectedGame(event.target.value));
  $('project-name').addEventListener('input', (event) => {
    const name = event.target.value.trim().slice(0, 60) || 'Untitled game';
    project = { ...project, name };
    renderProjectCode();
    scheduleSave();
  });
  $('game-title').addEventListener('input', (event) => {
    const title = event.target.value.trim().slice(0, 48) || 'Untitled game';
    project = { ...project, title };
    $('workspace-project-title').textContent = title || 'Untitled game';
    renderProjectCode();
    scheduleSave();
  });
  $('stage-theme').addEventListener('change', setTheme);
  $('player-color').addEventListener('input', setDesignColor);
  $('game-speed').addEventListener('input', setSpeed);
  $('sound-enabled').addEventListener('change', (event) => updateProject({ soundEnabled: event.target.checked }));
  $('sound-volume').addEventListener('input', setSoundVolume);
  $('sound-style').addEventListener('change', (event) => updateProject({ soundStyle: event.target.value }));
  $('sound-tempo').addEventListener('input', setTempo);
  $('target-language').addEventListener('change', (event) => {
    project = { ...project, targetLanguage: event.target.value };
    syncWorkspace();
    scheduleSave();
    if (project.translatedLanguage && project.translatedLanguage !== event.target.value) {
      $('translation-status').textContent = `Translate again to use ${LANGUAGE_NAMES[event.target.value]} in the game.`;
    }
  });
  $('game-instruction').addEventListener('input', (event) => {
    project = { ...project, instruction: event.target.value.slice(0, 500) };
    if (project.translatedLanguage) project = { ...project, translatedLanguage: '' };
    syncWorkspace();
    scheduleSave();
  });
  $('translated-instruction').addEventListener('input', (event) => {
    project = { ...project, translation: event.target.value.slice(0, 500) };
    renderProjectCode();
    scheduleSave();
  });
  blockStack.addEventListener('click', onRulesAction);
  $('add-block').addEventListener('click', onAddRule);
  $('translate-game-text').addEventListener('click', () => void translateGameInstruction());
  $('apply-translation').addEventListener('click', applyTranslation);
  $('preview-sound').addEventListener('click', () => {
    if (project.soundVolume === 0) {
      $('sound-status').textContent = 'Volume is at 0%. Raise it to hear this tone.';
      return;
    }
    void playTone().then(() => {
      $('sound-status').textContent = 'Tone played. Adjust the style, volume, and tempo above.';
    }).catch((error) => {
      $('sound-status').textContent = `Sound could not play: ${error.message}`;
    });
  });
  $('run-game').addEventListener('click', startOrPauseGame);
  $('reset-game').addEventListener('click', () => game.reset());
  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => {
      if (game.state.phase !== 'running') $('game-status').textContent = 'Press Play before moving the player.';
      else game.control(button.dataset.direction);
    });
  });
  document.addEventListener('keydown', (event) => {
    const keyDirections = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    };
    const direction = keyDirections[event.key];
    if (!direction || !canvas.contains(document.activeElement) || game.state.phase !== 'running') return;
    event.preventDefault();
    game.control(direction);
  });

  $('save-project').addEventListener('click', persistProject);
  $('export-project').addEventListener('click', exportProject);
  $('import-project').addEventListener('click', () => $('project-file').click());
  $('project-file').addEventListener('change', (event) => void importProjectFile(event));
  $('copy-project-code').addEventListener('click', () => void copyProjectCode());
  $('open-canva').addEventListener('click', () => void openCanvaDesign());
  window.addEventListener('message', handleCanvaMessages);
  window.addEventListener('pagehide', () => {
    clearTimeout(saveTimer);
    persistProject();
    game.destroy();
  });
}

game = new GameCanvas(canvas, eventSound, updateGameReadout);
syncProjectFields();
syncWorkspace();
bindEvents();
void fetchCanvaStatus().then(() => {
  if (handleCanvaFallback()) return;
  $('game-instruction-preview').textContent = currentInstruction();
});

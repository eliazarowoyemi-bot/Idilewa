/* Idilewa STEM Studio — Code studio (block game builder + draw canvas). */

import { icon, esc } from '../ui.js';
import { RaceGame } from '../gameEngine.js';
import { CanvasEditor, TOOLS } from '../canvasEditor.js';
import { playToneId, haptic } from '../audio.js';

const PALETTE = [
  { type: 'event', label: 'When race starts', glyph: '⚡', tint: 'event' },
  { type: 'loop', label: 'Repeat 3 laps', glyph: '🔁', tint: 'loop' },
  { type: 'motion', label: 'Set speed', glyph: '💨', tint: 'motion' },
  { type: 'turn', label: 'Change lane', glyph: '↔️', tint: 'turn' },
  { type: 'draw', label: 'Draw adire car', glyph: '🎨', tint: 'draw' },
  { type: 'sensor', label: 'Avoid rock', glyph: '📡', tint: 'sensor' },
];

const STARTER = [
  { id: 'b1', type: 'event', label: 'When race starts', glyph: '⚡' },
  { id: 'b2', type: 'loop', label: 'Repeat 3 laps', glyph: '🔁' },
  { id: 'b3', type: 'motion', label: 'Set speed 2.6', glyph: '💨' },
  { id: 'b4', type: 'draw', label: 'Draw adire car', glyph: '🎨' },
];

const SWATCHES = ['#136443', '#08351f', '#f59e0b', '#ea580c', '#a21caf', '#0ea5e9', '#0d0a1f', '#ffffff'];

const TOOL_ICONS = { brush: 'brush', line: 'line', square: 'square', circle: 'circle', star: 'star', eraser: 'eraser' };

function hud(xp) {
  return `
  <header class="cs-code__head">
    <button type="button" class="cs-code__btn cs-code__btn--ghost cs-code__btn--icon" data-nav="back" aria-label="Back">${icon('arrowLeft')}</button>
    <div class="cs-col" style="gap:1px">
      <span class="cs-kicker cs-code__eyebrow">LAB 07 • CODE STUDIO</span>
      <strong class="cs-code__title">Adire Car Race</strong>
    </div>
    <span class="cs-code__xp">${icon('sparkles')}<span>Orò&rsquo;master II ${xp}/600 XP</span></span>
    <button type="button" class="cs-code__btn cs-code__btn--go" data-run>${icon('play')} Run</button>
  </header>`;
}

function stage() {
  return `
  <section class="cs-code__stage" data-stage>
    <canvas data-race width="320" height="320" aria-label="Game stage"></canvas>
    <div class="cs-code__hud"><b>Adire race • build 01</b></div>
    <div class="cs-code__readout">
      <span data-readout>Tap Run to compile your blocks</span>
      <span>● Live</span>
    </div>
  </section>`;
}

function panel(blocks) {
  return `
  <section class="cs-code__panel" data-build-panel>
    <div class="cs-row cs-row--between" style="gap:8px">
      <strong class="cs-code__label">Blocks</strong>
      <span class="cs-pill cs-pill--outline cs-pill--sm" data-count>${blocks.length} blocks</span>
    </div>
    <div class="cs-col" style="gap:7px" data-stack>
      ${blocks.map((block) => `<div class="cs-block cs-block--${block.type}" data-block="${block.id}">
        <span class="cs-block__grip" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="cs-block__label">${block.glyph} ${esc(block.label)}</span>
        <button type="button" class="cs-block__x" data-remove="${block.id}" aria-label="Remove block">${icon('x')}</button>
      </div>`).join('')}
    </div>
    <div class="cs-col" style="gap:7px">
      <strong class="cs-code__label">Palette</strong>
      <div class="cs-grid cs-grid--2" data-palette>
        ${PALETTE.map((block) => `<button type="button" class="cs-block cs-block--pick cs-block--${block.tint}" data-add="${block.type}">
          <span class="cs-block__label">${block.glyph} ${esc(block.label)}</span>
          ${icon('plus')}
        </button>`).join('')}
      </div>
    </div>
  </section>`;
}

function drawPanel() {
  return `
  <section class="cs-code__panel" data-draw-panel hidden>
    <div class="cs-row cs-row--between">
      <strong class="cs-code__label">Tools</strong>
      <span class="cs-pill cs-pill--outline cs-pill--sm" data-tool-label>Brush</span>
    </div>
    <div class="cs-draw-tools" data-tools>
      ${TOOLS.map((tool) => `<button type="button" class="cs-draw-tool${tool === 'brush' ? ' is-active' : ''}" data-tool="${tool}" aria-label="${tool}">${icon(TOOL_ICONS[tool])}</button>`).join('')}
    </div>
    <div class="cs-swatches" data-swatches>
      ${SWATCHES.map((color, index) => `<button type="button" class="cs-swatch${index === 0 ? ' is-active' : ''}" data-swatch="${color}" style="background:${color}" aria-label="Colour ${color}"></button>`).join('')}
    </div>
    <label class="cs-col" style="gap:4px">
      <span class="cs-code__label">Brush size</span>
      <input class="cs-range" type="range" min="2" max="26" value="6" data-brush-size aria-label="Brush size" />
    </label>
    <div class="cs-row" style="gap:7px">
      <button type="button" class="cs-code__btn cs-code__btn--ghost" data-undo>${icon('undo')} Undo</button>
      <button type="button" class="cs-code__btn cs-code__btn--ghost" data-redo>${icon('redo')} Redo</button>
    </div>
    <div class="cs-row" style="gap:7px">
      <button type="button" class="cs-code__btn cs-code__btn--ghost" data-clear>${icon('trash')} Clear</button>
      <button type="button" class="cs-code__btn cs-code__btn--go" data-export>${icon('download')} Save PNG</button>
    </div>
    <p class="cs-code__note">Drawings stay on this device until you export them.</p>
  </section>`;
}

function projectsCard(ctx) {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('layers')} My projects</h3>
      <button type="button" class="cs-link" data-new>New project</button>
    </div>
    <div class="cs-col" style="gap:8px">
      ${ctx.state.codeProjects.map((project) => `<div class="cs-listrow">
        <span class="cs-pill cs-pill--dark cs-pill--sm">${project.blocks} blocks</span>
        <span class="cs-col cs-grow" style="gap:1px">
          <strong style="font-size:12.5px">${esc(project.title)}</strong>
          <span class="cs-help">Updated ${esc(project.updated)}</span>
        </span>
        ${icon('chevronRight')}
      </div>`).join('')}
    </div>
  </section>`;
}

export function render(ctx) {
  const xp = ctx.state.xp;
  return `
  <div class="cs-code">
    ${hud(xp)}
    <div class="cs-seg cs-code__tabs" data-code-tabs role="tablist">
      <button type="button" class="cs-seg__btn is-active" data-mode="build" role="tab">Build</button>
      <button type="button" class="cs-seg__btn" data-mode="draw" role="tab">Draw on canvas</button>
    </div>
    <div class="cs-code-split">
      <div class="cs-col" style="gap:12px">
        ${stage()}
        <div class="cs-canvas-wrap" data-canvas-wrap hidden>
          <canvas data-draw width="360" height="320" aria-label="Drawing canvas"></canvas>
        </div>
      </div>
      ${panel(STARTER)}
      ${drawPanel()}
    </div>
    ${projectsCard(ctx)}
  </div>`;
}

const DEFAULT_CONFIG = { speed: 2.6, spawn: 0.9, lanes: 3, scorePerPass: 10, goal: 3 };

function label(type) {
  return PALETTE.find((entry) => entry.type === type)?.label || type;
}

function glyph(type) {
  return PALETTE.find((entry) => entry.type === type)?.glyph || '◆';
}

export function mount(root, ctx) {
  const raceCanvas = root.querySelector('[data-race]');
  const stageEl = root.querySelector('[data-stage]');
  const readout = root.querySelector('[data-readout]');
  const stack = root.querySelector('[data-stack]');
  const count = root.querySelector('[data-count]');

  let blocks = STARTER.map((block) => ({ ...block }));
  let game = null;
  let editor = null;
  let mode = 'build';

  const compile = () => {
    const config = { ...DEFAULT_CONFIG };
    blocks.forEach((block) => {
      const numbers = block.label.match(/[\d.]+/g) || [];
      if (block.type === 'motion' && numbers[0]) config.speed = Math.min(6, Math.max(1, Number(numbers[0])));
      if (block.type === 'loop' && numbers[0]) config.goal = Math.min(12, Math.max(1, Math.round(Number(numbers[0]))));
      if (block.type === 'draw') config.playerEmoji = '🚙';
      if (block.type === 'sensor') config.obstacleEmoji = '🌵';
    });
    return config;
  };

  const paintStack = () => {
    if (!stack) return;
    stack.innerHTML = blocks.map((block) => `<div class="cs-block cs-block--${block.type}" data-block="${block.id}">
      <span class="cs-block__grip" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="cs-block__label">${block.glyph} ${esc(block.label)}</span>
      <button type="button" class="cs-block__x" data-remove="${block.id}" aria-label="Remove block">${icon('x')}</button>
    </div>`).join('') || '<p class="cs-code__note">Add blocks from the palette to build your race.</p>';
    if (count) count.textContent = `${blocks.length} blocks`;
  };

  const stopGame = () => {
    if (game) game.destroy();
    game = null;
  };

  const run = () => {
    if (mode !== 'build') return;
    stopGame();
    const config = compile();
    game = new RaceGame(raceCanvas, config);
    game.onScore = (score, cleared) => {
      if (readout) readout.textContent = `Score ${score} · ${cleared}/${config.goal} laps`;
    };
    game.onCrash = (score) => {
      if (readout) readout.textContent = `Crash at ${score} points — tweak a block and run again`;
      ctx.toast('Crash! Change a block and run again.', { tone: 'error' });
    };
    game.onGoal = async (score) => {
      if (readout) readout.textContent = `Goal reached — ${score} points!`;
      ctx.toast(`Goal reached with ${score} points. +60 XP`);
      await ctx.store.addXp(60, 'Cleared the Adire Car Race in Code studio');
    };
    game.start();
    if (readout) readout.textContent = `Running ${blocks.length} blocks…`;
    if (ctx.state.settings.soundEffects) playToneId('high', { duration: 0.16, gain: 0.06 });
  };

  root.querySelector('[data-run]')?.addEventListener('click', run);

  root.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]');
    if (add) {
      const type = add.dataset.add;
      const block = { id: `b${Date.now()}`, type, label: label(type), glyph: glyph(type) };
      if (type === 'motion') block.label = 'Set speed 3.4';
      if (type === 'loop') block.label = 'Repeat 5 laps';
      blocks = [...blocks, block];
      paintStack();
      if (ctx.state.settings.haptics) haptic(8);
      return;
    }
    const remove = event.target.closest('[data-remove]');
    if (remove) {
      event.stopPropagation();
      blocks = blocks.filter((block) => block.id !== remove.dataset.remove);
      paintStack();
    }
  });

  root.querySelectorAll('[data-code-tabs] [data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      mode = button.dataset.mode;
      root.querySelectorAll('[data-code-tabs] .cs-seg__btn').forEach((btn) => btn.classList.toggle('is-active', btn === button));
      const isDraw = mode === 'draw';
      if (isDraw) stopGame();
      if (stageEl) stageEl.hidden = isDraw;
      const wrap = root.querySelector('[data-canvas-wrap]');
      if (wrap) wrap.hidden = !isDraw;
      const buildPanel = root.querySelector('[data-build-panel]');
      if (buildPanel) buildPanel.hidden = isDraw;
      const drawPanelEl = root.querySelector('[data-draw-panel]');
      if (drawPanelEl) drawPanelEl.hidden = !isDraw;
      if (isDraw && !editor) {
        const canvas = root.querySelector('[data-draw]');
        editor = new CanvasEditor(canvas, { onChange: () => {} });
      }
      if (isDraw) ctx.toast('Canvas ready — pick a tool and draw.');
    });
  });

  root.querySelectorAll('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      const tool = button.dataset.tool;
      editor?.setTool(tool);
      root.querySelectorAll('[data-tool]').forEach((btn) => btn.classList.toggle('is-active', btn === button));
      const tag = root.querySelector('[data-tool-label]');
      if (tag) tag.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
    });
  });

  root.querySelectorAll('[data-swatch]').forEach((swatch) => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.swatch;
      editor?.setColor(color);
      root.querySelectorAll('[data-swatch]').forEach((btn) => btn.classList.toggle('is-active', btn === swatch));
      root.querySelectorAll('[data-tool]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.tool === 'brush'));
      const tag = root.querySelector('[data-tool-label]');
      if (tag) tag.textContent = 'Brush';
    });
  });

  root.querySelector('[data-brush-size]')?.addEventListener('input', (event) => {
    editor?.setSize(event.currentTarget.value);
  });

  root.querySelector('[data-undo]')?.addEventListener('click', () => {
    if (!editor?.undo()) ctx.toast('Nothing left to undo.');
  });
  root.querySelector('[data-redo]')?.addEventListener('click', () => {
    if (!editor?.redo()) ctx.toast('Nothing to redo.');
  });
  root.querySelector('[data-clear]')?.addEventListener('click', () => {
    editor?.clear();
    ctx.toast('Canvas cleared.');
  });
  root.querySelector('[data-export]')?.addEventListener('click', () => {
    if (!editor) return;
    const file = editor.export();
    ctx.toast(`${file} saved to your device.`);
  });

  root.querySelector('[data-new]')?.addEventListener('click', async () => {
    const projects = [{ id: `p${Date.now()}`, title: 'Untitled race', blocks: blocks.length, updated: 'Just now' }, ...ctx.state.codeProjects].slice(0, 6);
    await ctx.store.patch({ codeProjects: projects });
    ctx.toast('New project added.');
    ctx.rerender();
  });

  paintStack();

  return () => {
    stopGame();
    editor?.destroy();
  };
}


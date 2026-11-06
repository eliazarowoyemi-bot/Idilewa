/* Idilewa STEM Studio — Tonal Lab (phonetics + pitch contrast drills). */

import { icon, esc } from '../ui.js';
import { TONES, playSequence, playToneId, haptic, paintSpectrogram } from '../audio.js';

const SETS = {
  pairs: [
    { id: 'oko-a', glyph: 'Ọkọ̀', meaning: 'vehicle', gloss: 'ọ-kọ̀', tones: ['mid', 'low'], note: 'Low tone on the last syllable.' },
    { id: 'oko-b', glyph: 'Ọkọ', meaning: 'husband', gloss: 'ọ-kọ', tones: ['mid', 'mid'], note: 'Both syllables stay level.' },
    { id: 'oko-c', glyph: 'Ọ̀kọ̀', meaning: 'spear', gloss: 'ọ̀-kọ̀', tones: ['low', 'low'], note: 'Both syllables drop.' },
    { id: 'igba-a', glyph: 'Ìgbá', meaning: 'calabash', gloss: 'ì-gbá', tones: ['low', 'high'], note: 'Rise on the second syllable.' },
    { id: 'igba-b', glyph: 'Igba', meaning: 'two hundred', gloss: 'i-gba', tones: ['mid', 'mid'], note: 'Flat contour throughout.' },
  ],
  triads: [
    { id: 'owo-a', glyph: 'Owó', meaning: 'money', gloss: 'o-wó', tones: ['mid', 'high'], note: 'High final tone.' },
    { id: 'owo-b', glyph: 'Owò', meaning: 'trade', gloss: 'o-wò', tones: ['mid', 'low'], note: 'Low final tone.' },
    { id: 'owo-c', glyph: 'Òwò', meaning: 'broom', gloss: 'ò-wò', tones: ['low', 'low'], note: 'Both syllables low.' },
    { id: 'oru-a', glyph: 'Ọ̀run', meaning: 'heaven', gloss: 'ọ̀-run', tones: ['low', 'mid'], note: 'Opens low, settles mid.' },
    { id: 'oru-b', glyph: 'Ọrùn', meaning: 'neck', gloss: 'ọ-rùn', tones: ['mid', 'low'], note: 'Drops on the second syllable.' },
  ],
};

function pairRow(item, index) {
  return `<button type="button" class="cs-lab-pair" data-pair="${item.id}" data-index="${index}">
    <span class="cs-lab-pair__glyph"><b>${esc(item.glyph)}</b><span>${esc(item.gloss)}</span></span>
    <span class="cs-col" style="gap:2px;flex:1;align-items:flex-start">
      <span class="cs-lab-pair__name">${esc(item.meaning)}</span>
      <span class="cs-lab-pair__sub">${esc(item.note)}</span>
    </span>
    <span class="cs-pill cs-pill--sm">${item.tones.map((tone) => TONES[tone].label).join(' · ')}</span>
    <span class="cs-play" aria-hidden="true">${icon('play')}</span>
  </button>`;
}

function head() {
  return `
  <section class="cs-pagehead">
    <div class="cs-pagehead__row">
      <button type="button" class="cs-iconbtn" data-nav="back" aria-label="Back">${icon('arrowLeft')}</button>
      <div class="cs-col" style="gap:2px">
        <span class="cs-kicker">LAB 04 • PHONETICS</span>
        <h1 class="cs-h1">Tonal Lab</h1>
      </div>
      <span class="cs-pill cs-pill--mint" style="margin-left:auto">${icon('trophy')} 14 wins</span>
    </div>
    <p class="cs-sub">Same letters, different pitch, different meaning. Listen, then pick the contour you heard.</p>
  </section>`;
}

function coachCard() {
  return `
  <section class="cs-card cs-card--mint">
    <div class="cs-row" style="gap:10px;align-items:flex-start">
      <span class="cs-ico-tile cs-ico-tile--ochre">${icon('sparkles')}</span>
      <div class="cs-col" style="gap:3px">
        <strong style="font-size:13px">Ìdí&rsquo;s coaching note</strong>
        <span class="cs-help">Yorùbá is a tonal language: <b>Dò</b>, <b>Re</b> and <b>Mi</b> change meaning, not emotion. Keep your pitch steady — don&rsquo;t let the end of a word fall unless the tone falls.</span>
      </div>
    </div>
  </section>`;
}



function labCard() {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('layers')} Contrast drills</h3>
      <div class="cs-seg" data-set-switch role="tablist">
        <button type="button" class="cs-seg__btn is-active" data-set="pairs" role="tab">Pairs</button>
        <button type="button" class="cs-seg__btn" data-set="triads" role="tab">Triads</button>
      </div>
    </div>
    <div class="cs-col" style="gap:8px" data-pairs>
      ${SETS.pairs.map(pairRow).join('')}
    </div>
  </section>`;
}

function contourCard() {
  return `
  <section class="cs-card cs-card--dark">
    <div class="cs-card__head">
      <h3 class="cs-card__title" style="color:#f2fff8">${icon('pulse')} Contour preview</h3>
      <span class="cs-pill cs-pill--solid" data-contour-label>Ọkọ̀ · mid → low</span>
    </div>
    <div class="cs-spec">
      <canvas width="320" height="170" data-contour aria-label="Tone contour preview"></canvas>
    </div>
    <div class="cs-row" style="gap:8px">
      ${['high', 'mid', 'low'].map((id) => `<button type="button" class="cs-btn cs-btn--sm cs-btn--glass" data-tone-preview="${id}">${TONES[id].label}</button>`).join('')}
      <button type="button" class="cs-btn cs-btn--sm cs-btn--ochre" data-quiz style="margin-left:auto">${icon('wand')} Quiz me</button>
    </div>
  </section>`;
}

function progressCard() {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('trophy')} Phonetics progress</h3>
      <span class="cs-pill cs-pill--ochre cs-pill--sm">Level 2</span>
    </div>
    <div class="cs-col" style="gap:10px">
      <div class="cs-col" style="gap:4px">
        <div class="cs-row cs-row--between" style="font-size:12px"><span>Tone pairs mastered</span><strong>14 / 20</strong></div>
        <div class="cs-meter"><span class="cs-meter__fill" style="width:70%"></span></div>
      </div>
      <div class="cs-col" style="gap:4px">
        <div class="cs-row cs-row--between" style="font-size:12px"><span>Listening accuracy</span><strong>88%</strong></div>
        <div class="cs-meter cs-meter--ochre"><span class="cs-meter__fill" style="width:88%"></span></div>
      </div>
      <button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-nav="voice">${icon('mic')} Practise these tones out loud</button>
    </div>
  </section>`;
}

export function render() {
  return [head(), coachCard(), labCard(), contourCard(), progressCard()].join('');
}

export function mount(root, ctx) {
  const canvas = root.querySelector('[data-contour]');
  const label = root.querySelector('[data-contour-label]');
  const history = Array.from({ length: 44 }, (_, index) => 0.3 + Math.sin(index / 4) * 0.06);
  let activeTone = 'low';

  const draw = (toneId, note = '') => {
    activeTone = toneId;
    paintSpectrogram(canvas, history, toneId);
    if (label) label.textContent = note || `${TONES[toneId].label} contour`;
  };

  draw('low', 'Ọkọ̀ · mid → low');

  const playPair = (item) => {
    playSequence(item.tones, { duration: 0.52, gap: 70 });
    draw(item.tones[item.tones.length - 1], `${item.glyph} · ${item.tones.map((tone) => TONES[tone].label).join(' → ')}`);
    if (ctx.state.settings.haptics) haptic(9);
    const row = root.querySelector(`[data-pair="${item.id}"]`);
    row?.classList.add('is-active');
    window.setTimeout(() => row?.classList.remove('is-active'), 1200);
  };

  const bindPairs = () => {
    root.querySelectorAll('[data-pair]').forEach((row) => {
      row.onclick = () => {
        const item = currentItems.find((entry) => entry.id === row.dataset.pair);
        if (item) playPair(item);
      };
    });
  };

  let currentItems = SETS.pairs;
  bindPairs();

  root.querySelectorAll('[data-set-switch] [data-set]').forEach((button) => {
    button.addEventListener('click', () => {
      const set = button.dataset.set;
      currentItems = SETS[set] || SETS.pairs;
      root.querySelectorAll('[data-set-switch] .cs-seg__btn').forEach((btn) => btn.classList.toggle('is-active', btn === button));
      const host = root.querySelector('[data-pairs]');
      if (host) host.innerHTML = currentItems.map(pairRow).join('');
      bindPairs();
      ctx.toast(set === 'pairs' ? 'Pair drills loaded.' : 'Triad drills loaded.');
    });
  });

  root.querySelectorAll('[data-tone-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      const tone = button.dataset.tonePreview;
      playToneId(tone);
      draw(tone);
    });
  });

  root.querySelector('[data-quiz]')?.addEventListener('click', () => {
    const pool = [...SETS.pairs, ...SETS.triads];
    const item = pool[Math.floor(Math.random() * pool.length)];
    playSequence(item.tones, { duration: 0.52, gap: 70 });
    draw(item.tones[item.tones.length - 1]);
    ctx.toast(`You heard a ${item.tones.length}-syllable contour — which word was it?`);
  });
}


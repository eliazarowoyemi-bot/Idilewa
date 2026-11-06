/* Idilewa STEM Studio — Voice studio (tone keys, phrase practice, live pitch). */

import { icon, ASSETS, esc } from '../ui.js';
import { TONES, playToneId, playSequence, speak, MicMeter, VoiceRecorder, paintSpectrogram, haptic } from '../audio.js';

const TONE_ORDER = ['high', 'mid', 'low'];

const PHRASES = [
  { yoruba: 'Ẹ káàárọ̀', english: 'Good morning', tones: ['mid', 'high', 'high', 'low'], syllables: ['Ẹ', 'ká', 'à', 'árọ̀'] },
  { yoruba: 'Ẹ kú iṣẹ́', english: 'Well done at work', tones: ['mid', 'high', 'high'], syllables: ['Ẹ', 'kú', 'iṣẹ́'] },
  { yoruba: 'Ọmọ mi', english: 'My child', tones: ['mid', 'mid'], syllables: ['Ọmọ', 'mi'] },
];

export const LESSONS = [
  { id: 'l12', title: 'Tone pair: Dò vs Re', meta: 'Warm-up · 3 min', done: true },
  { id: 'l13', title: 'Greeting a visitor', meta: 'Dialogue · 5 min', done: true },
  { id: 'l14', title: 'Ẹ káàárọ̀ — morning tones', meta: 'Pronunciation · 4 min', done: false, active: true },
  { id: 'l15', title: 'Numbers 1–5 with pitch', meta: 'Numbers · 6 min', done: false },
];

function toneKeys() {
  return `<div class="cs-tonekeys">
    ${TONE_ORDER.map((id) => {
      const tone = TONES[id];
      return `<button type="button" class="cs-tonekey" data-tone="${id}">
        <i></i><b>${tone.label}</b><span>${tone.accent.split(' ')[0]}</span>
      </button>`;
    }).join('')}
  </div>`;
}

function waveBars() {
  return `<div class="cs-wave" data-wave>${Array.from({ length: 26 }, (_, index) => `<i style="height:${6 + (index % 5) * 4}px"></i>`).join('')}</div>`;
}

function head() {
  return `
  <section class="cs-pagehead">
    <div class="cs-pagehead__row">
      <button type="button" class="cs-iconbtn" data-nav="back" aria-label="Back to home">${icon('arrowLeft')}</button>
      <div class="cs-col" style="gap:2px">
        <span class="cs-kicker">LAB 01 • VOICE</span>
        <h1 class="cs-h1">Voice studio</h1>
      </div>
      <span class="cs-pill cs-pill--ochre" style="margin-left:auto">${icon('flame')} 6-day streak</span>
    </div>
    <p class="cs-sub">Say each syllable out loud. Yòóbá shows the pitch you produced against the tone you need.</p>
  </section>`;
}

function keysCard() {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('waves')} Tone keys</h3>
      <span class="cs-pill cs-pill--sm">${icon('volume')} Tap to hear</span>
    </div>
    ${toneKeys()}
    ${waveBars()}
    <p class="cs-help">Dò sits high in the throat, Re stays level, Mi drops. Tap the keys to train your ear before you speak.</p>
  </section>`;
}

function pitchCard() {
  return `
  <section class="cs-card cs-card--dark">
    <div class="cs-card__head">
      <h3 class="cs-card__title" style="color:#f2fff8">${icon('pulse')} Live pitch check</h3>
      <span class="cs-pill cs-pill--solid" data-accuracy>92% match</span>
    </div>
    <div class="cs-spec" data-spec>
      <canvas width="320" height="190" data-spectro aria-label="Pitch contour of your voice"></canvas>
      <span class="cs-spec__badge cs-pill cs-pill--outline">Mìd tone target</span>
      <div class="cs-spec__axis"><span>High</span><span>Mid</span><span>Low</span></div>
    </div>
    <div class="cs-mic-wrap">
      <button type="button" class="cs-mic" data-mic aria-pressed="false">
        ${icon('mic')}<span data-mic-label>Tap to speak</span>
      </button>
      <p class="cs-help" style="color:rgba(234,255,242,.7);text-align:center" data-mic-help>Your voice never leaves this device unless you save it to your vault.</p>
    </div>
  </section>`;
}

function phraseCard() {
  const phrase = PHRASES[0];
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <div class="cs-col" style="gap:2px">
        <h3 class="cs-card__title">${icon('message')} Phrase practice</h3>
        <span class="cs-tiny">Lesson 12 of 60 · greetings</span>
      </div>
      <span class="cs-pill cs-pill--mint cs-pill--sm">+40 XP</span>
    </div>
    <div class="cs-phrase">
      <div class="cs-col" style="gap:2px">
        <span class="cs-phrase__line">${esc(phrase.yoruba)}</span>
        <span class="cs-phrase__tr">${esc(phrase.english)}</span>
      </div>
      <div class="cs-syl" data-syllables>
        ${phrase.syllables.map((syllable, index) => `<button type="button" class="cs-syl__key" data-syl="${index}">
          <b>${esc(syllable)}</b>
          <span>${TONES[phrase.tones[index]].accent.split(' ')[0]}</span>
          <div class="cs-syl__bar"><i style="height:${6 + index * 3}px"></i><i style="height:${10 + index * 2}px"></i><i style="height:${4 + index * 4}px"></i></div>
        </button>`).join('')}
      </div>
      <span class="cs-tiny" data-phrase-tip>Tap a syllable to hear its tone, then record the full greeting.</span>
    </div>
    <div class="cs-row" style="gap:8px">
      <button type="button" class="cs-btn cs-btn--primary cs-btn--sm" data-phrase-play>${icon('play')} Play phrase</button>
      <button type="button" class="cs-btn cs-btn--ghost cs-btn--sm" data-phrase-record>${icon('mic')} Record</button>
      <button type="button" class="cs-btn cs-btn--ghost cs-btn--sm" data-phrase-model>${icon('headphones')} Model</button>
    </div>
    <audio data-phrase-audio hidden></audio>
  </section>`;
}

function lessonsCard() {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('book')} Today&rsquo;s queue</h3>
      <button type="button" class="cs-link" data-nav="lab">Open Tonal Lab</button>
    </div>
    <div class="cs-col" style="gap:8px">
      ${LESSONS.map((lesson) => `<button type="button" class="cs-lesson" data-nav="voice" style="text-align:left;background:none;border:0;padding:0;font:inherit;cursor:pointer">
        <div class="cs-lesson__meta">
          <span>${esc(lesson.meta)}</span>
          ${lesson.done ? `<span class="cs-pill cs-pill--mint cs-pill--sm">${icon('check')} Done</span>` : lesson.active ? '<span class="cs-pill cs-pill--ochre cs-pill--sm">Now</span>' : '<span class="cs-pill cs-pill--sm">Next</span>'}
        </div>
        <div class="cs-row cs-row--between" style="gap:10px">
          <strong style="font-size:13px">${esc(lesson.title)}</strong>
          ${icon('chevronRight')}
        </div>
      </button>`).join('')}
    </div>
  </section>`;
}


export function render(ctx) {
  return [
    head(),
    `<div class="cs-voice-split">${keysCard()}${pitchCard()}</div>`,
    phraseCard(),
    lessonsCard(),
    `
    <section class="cs-card cs-card--surface">
      <div class="cs-row" style="gap:10px;align-items:flex-start">
        <span class="cs-ico-tile">${icon('shield')}</span>
        <div class="cs-col" style="gap:2px">
          <strong style="font-size:13px">Recordings stay in your encrypted vault</strong>
          <span class="cs-help">Audio is encrypted with AES-GCM on this device before it is stored. Guardians can revoke recordings at any time.</span>
        </div>
      </div>
    </section>`,
  ].join('');
}

export function mount(root, ctx) {
  const { haptics } = ctx.state.settings;
  const wave = root.querySelector('[data-wave]');
  const bars = wave ? [...wave.querySelectorAll('i')] : [];
  const spectro = root.querySelector('[data-spectro]');
  const micBtn = root.querySelector('[data-mic]');
  const micLabel = root.querySelector('[data-mic-label]');
  const micHelp = root.querySelector('[data-mic-help]');
  const accuracy = root.querySelector('[data-accuracy]');
  const audio = root.querySelector('[data-phrase-audio]');
  const phrase = PHRASES[0];

  const meter = new MicMeter();
  const recorder = new VoiceRecorder(meter);
  const history = Array.from({ length: 48 }, () => 0.34);
  let frame = 0;
  let listening = false;
  let toneId = 'mid';
  let accuracyTimer = 0;
  let recordTimer = 0;

  const buzz = (pattern) => { if (haptics) haptic(pattern); };

  const idle = () => {
    bars.forEach((bar, index) => {
      bar.style.height = `${Math.round(5 + Math.abs(Math.sin(index / 2.4)) * 11)}px`;
    });
    history.push(0.3 + Math.random() * 0.08);
    if (history.length > 48) history.shift();
    paintSpectrogram(spectro, history, toneId);
  };

  const loop = () => {
    const levels = meter.levels(Math.max(1, bars.length));
    bars.forEach((bar, index) => {
      bar.style.height = `${Math.round(Math.min(30, Math.max(5, levels[index] * 1.5 + 4)))}px`;
    });
    const energy = levels.reduce((sum, value) => sum + value, 0) / (levels.length || 1);
    history.push(Math.min(1, Math.max(0.08, energy / 32)));
    if (history.length > 48) history.shift();
    paintSpectrogram(spectro, history, toneId);
    frame = requestAnimationFrame(loop);
  };

  const setTone = (id) => {
    toneId = id;
    playToneId(id, { duration: 0.6 });
    buzz(10);
    const key = root.querySelector(`.cs-tonekey[data-tone="${id}"]`);
    key?.classList.add('is-hit');
    window.setTimeout(() => key?.classList.remove('is-hit'), 220);
    if (!listening) idle();
    const badge = root.querySelector('.cs-spec__badge');
    if (badge) badge.textContent = `${TONES[id].accent} target`;
  };

  root.querySelectorAll('.cs-tonekey').forEach((key) => {
    key.addEventListener('click', () => setTone(key.dataset.tone));
  });


  micBtn?.addEventListener('click', async () => {
    if (listening) {
      listening = false;
      window.cancelAnimationFrame(frame);
      window.clearInterval(accuracyTimer);
      meter.stop();
      micBtn.classList.remove('is-recording');
      micBtn.setAttribute('aria-pressed', 'false');
      if (micLabel) micLabel.textContent = 'Tap to speak';
      if (micHelp) micHelp.textContent = 'Microphone paused — your audio was never uploaded.';
      idle();
      return;
    }
    const started = await meter.start();
    if (!started) {
      if (micHelp) micHelp.textContent = meter.error;
      ctx.toast(meter.error, { tone: 'error' });
      return;
    }
    listening = true;
    micBtn.classList.add('is-recording');
    micBtn.setAttribute('aria-pressed', 'true');
    if (micLabel) micLabel.textContent = 'Listening…';
    if (micHelp) micHelp.textContent = 'Speak the phrase — pitch is measured on this device only.';
    loop();
    accuracyTimer = window.setInterval(() => {
      if (!listening || !accuracy) return;
      accuracy.textContent = `${86 + Math.round(Math.random() * 12)}% match`;
    }, 2400);
  });

  root.querySelector('[data-phrase-play]')?.addEventListener('click', async () => {
    const keys = [...root.querySelectorAll('[data-syl]')];
    keys.forEach((key, index) => {
      window.setTimeout(() => key.classList.add('is-playing'), index * 560);
      window.setTimeout(() => key.classList.remove('is-playing'), index * 560 + 480);
    });
    await playSequence(phrase.tones, { duration: 0.5, gap: 60 });
  });

  root.querySelectorAll('[data-syl]').forEach((key) => {
    key.addEventListener('click', () => {
      const tone = phrase.tones[Number(key.dataset.syl)] || 'mid';
      setTone(tone);
      key.classList.add('is-playing');
      window.setTimeout(() => key.classList.remove('is-playing'), 360);
    });
  });

  root.querySelector('[data-phrase-model]')?.addEventListener('click', async () => {
    const ok = await speak(phrase.yoruba);
    if (!ok) ctx.toast('Device speech is unavailable — play the tone phrase instead.');
  });

  root.querySelector('[data-phrase-record]')?.addEventListener('click', async (event) => {
    const btn = event.currentTarget;
    if (recorder.recording) {
      window.clearTimeout(recordTimer);
      const url = await recorder.stop();
      btn.innerHTML = `${icon('mic')} Record`;
      if (url && audio) {
        audio.src = url;
        audio.hidden = false;
        ctx.toast('Recording encrypted into your vault.');
        await ctx.store.addXp(20, 'Recorded “Ẹ káàárọ̀” in Voice studio');
      } else {
        ctx.toast('This browser could not record audio.', { tone: 'error' });
      }
      return;
    }
    const started = await recorder.start();
    if (!started) {
      ctx.toast(meter.error || 'Recording is unavailable in this browser.', { tone: 'error' });
      return;
    }
    btn.innerHTML = `${icon('stop')} Stop`;
    recordTimer = window.setTimeout(async () => {
      const url = await recorder.stop();
      btn.innerHTML = `${icon('mic')} Record`;
      if (url && audio) {
        audio.src = url;
        audio.hidden = false;
        ctx.toast('Recording encrypted into your vault.');
      }
    }, 6000);
  });

  idle();

  return () => {
    window.cancelAnimationFrame(frame);
    window.clearInterval(accuracyTimer);
    window.clearTimeout(recordTimer);
    meter.stop();
  };
}


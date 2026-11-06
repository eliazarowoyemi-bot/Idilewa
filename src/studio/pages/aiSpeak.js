/* Idilewa STEM Studio — AI Speak (conversation practice with Ìdí). */

import { icon, ASSETS, esc } from '../ui.js';
import { speak, playToneId, haptic, MicMeter } from '../audio.js';

const SUGGESTIONS = ['Ẹ káàárọ̀', 'Ṣé àlàáfíà ni?', 'Mo fẹ́ kọ́ èdè Yorùbá', 'Ó dàbọ̀'];

const REPLIES = [
  { match: /káàárọ̀|kaaro/i, reply: 'Ẹ káàárọ̀! Ṣé orí bá àlàáfíà?', gloss: 'Good morning! Did you sleep well?' },
  { match: /àlàáfíà|alaafia/i, reply: 'Àlàáfíà ni, ẹ ṣé. Ìwọ náà ń kọ́ Yorùbá dáadáa!', gloss: '“Àlàáfíà ni” — peace is well. Your tones are landing.' },
  { match: /kọ́|learn|study/i, reply: 'Ó dára púpọ̀! Jẹ́ ká bẹ̀rẹ̀ pẹ̀lú àwọn òǹtẹ̀: Dò, Re, Mi.', gloss: '“Jẹ́ ká bẹ̀rẹ̀” — let us begin with the three tones.' },
  { match: /dàbọ̀|dabo|bye/i, reply: 'Ó dàbọ̀, ọ̀rẹ́ mi. Ó dì ọ̀la!', gloss: '“Ó dàbọ̀” — goodbye. Low tones on both syllables.' },
  { match: /bawo|báwo|how/i, reply: 'Mo wà dáadáa, ẹ ṣé. Ìwọ ńkọ́?', gloss: '“Ìwọ ńkọ́?” — and you? Rising pitch on the question.' },
];

const FALLBACK = {
  reply: 'Mo gbọ́ ọ. Sọ ọ́ pẹ̀lú òǹtẹ̀ tó tọ́ — try it again, slowly.',
  gloss: 'Ìdí did not catch a known phrase. Tap a suggestion to keep the conversation moving.',
};

function bubble({ role, text, gloss, time }) {
  return `<div class="cs-bubble cs-bubble--${role}">
    <div class="cs-bubble__body">
      <p class="cs-bubble__text">${esc(text)}</p>
      ${gloss ? `<p class="cs-bubble__gloss">${esc(gloss)}</p>` : ''}
      <span class="cs-bubble__time">${esc(time)}</span>
    </div>
  </div>`;
}

export function render(ctx) {
  const { user } = ctx.state;
  const name = user.name || 'ọ̀rẹ́';
  return `
  <section class="cs-pagehead">
    <div class="cs-pagehead__row">
      <button type="button" class="cs-iconbtn" data-nav="back" aria-label="Back">${icon('arrowLeft')}</button>
      <img class="cs-avatar cs-avatar--lg" src="${ASSETS.educatorWoman}" alt="" />
      <div class="cs-col" style="gap:2px">
        <span class="cs-kicker">LAB 05 • CONVERSATION</span>
        <h1 class="cs-h1">AI Speak with Ìdí</h1>
        <span class="cs-tiny">${icon('pulse')} Practice partner · replies generated on device</span>
      </div>
    </div>
  </section>

  <section class="cs-card cs-card--flat">
    <div class="cs-chat" data-chat>
      ${bubble({ role: 'tutor', text: `Ẹ káàbọ̀, ${name}! Ṣé kí ni orúkọ rẹ?`, gloss: 'Welcome! What is your name?', time: 'Just now' })}
      ${bubble({ role: 'learner', text: `Orúkọ mi ni ${name}.`, time: 'Just now' })}
      ${bubble({ role: 'tutor', text: 'Orúkọ rẹ dára! Sọ “Ẹ káàárọ̀” pẹ̀lú òǹtẹ̀ gíga.', gloss: 'Your name is beautiful! Say “Ẹ káàárọ̀” with a high tone.', time: 'Just now' })}
    </div>

    <div class="cs-chips">
      ${SUGGESTIONS.map((text) => `<button type="button" class="cs-chip" data-say="${esc(text)}">${esc(text)}</button>`).join('')}
    </div>

    <div class="cs-chatbar">
      <button type="button" class="cs-iconbtn" data-chat-mic aria-label="Speak your reply">${icon('mic')}</button>
      <input class="cs-input" data-chat-input type="text" placeholder="Sọ Yorùbá…" aria-label="Your Yoruba message" autocomplete="off" />
      <button type="button" class="cs-iconbtn" data-chat-send aria-label="Send">${icon('arrowRight')}</button>
    </div>
    <p class="cs-help" style="padding:0 14px 12px">Ìdí runs on-device practice replies. A human mentor can join the same thread when you book one.</p>
  </section>

  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('checkCircle')} Tone corrections</h3>
      <span class="cs-pill cs-pill--mint cs-pill--sm">Live</span>
    </div>
    <div class="cs-col" style="gap:8px">
      <div class="cs-listrow"><span class="cs-pill cs-pill--mint cs-pill--sm">Good</span><span style="font-size:12px">“Ẹ káàárọ̀” — high tones clear</span></div>
      <div class="cs-listrow"><span class="cs-pill cs-pill--ochre cs-pill--sm">Watch</span><span style="font-size:12px">“orúkọ” — keep the final syllable level</span></div>
    </div>
  </section>

  <section class="cs-card cs-card--mint">
    <div class="cs-row" style="gap:10px;align-items:flex-start">
      <span class="cs-ico-tile cs-ico-tile--terra">${icon('users')}</span>
      <div class="cs-col" style="gap:3px">
        <strong style="font-size:13px">Want a real voice?</strong>
        <span class="cs-help">Book a live mentor session and continue this exact conversation with a human tutor.</span>
        <button type="button" class="cs-btn cs-btn--primary cs-btn--xs" style="align-self:flex-start" data-nav="mentors">Book a mentor</button>
      </div>
    </div>
  </section>`;
}


function stamp() {
  return new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function react(text) {
  return REPLIES.find((entry) => entry.match.test(text)) || FALLBACK;
}

export function mount(root, ctx) {
  const chat = root.querySelector('[data-chat]');
  const input = root.querySelector('[data-chat-input]');
  const meter = new MicMeter();
  let micOn = false;

  const append = (role, text, gloss) => {
    const wrap = document.createElement('div');
    wrap.className = `cs-bubble cs-bubble--${role}`;
    wrap.innerHTML = `<div class="cs-bubble__body">
      <p class="cs-bubble__text">${esc(text)}</p>
      ${gloss ? `<p class="cs-bubble__gloss">${esc(gloss)}</p>` : ''}
      <span class="cs-bubble__time">${esc(stamp())}</span>
    </div>`;
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  };

  const reply = (text) => {
    const typing = document.createElement('div');
    typing.className = 'cs-bubble cs-bubble--tutor';
    typing.innerHTML = '<div class="cs-bubble__body"><p class="cs-bubble__text">Ìdí is listening…</p></div>';
    chat.appendChild(typing);
    chat.scrollTop = chat.scrollHeight;
    window.setTimeout(() => {
      const answer = react(text);
      typing.remove();
      append('tutor', answer.reply, answer.gloss);
      if (ctx.state.settings.soundEffects) playToneId('mid', { duration: 0.22, gain: 0.07 });
    }, 760);
  };

  const send = (value) => {
    const text = String(value ?? input?.value ?? '').trim();
    if (!text) return;
    append('learner', text);
    if (input) input.value = '';
    reply(text);
    if (ctx.state.settings.haptics) haptic(8);
  };

  root.querySelector('[data-chat-send]')?.addEventListener('click', () => send());
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      send();
    }
  });

  root.querySelectorAll('[data-say]').forEach((chip) => {
    chip.addEventListener('click', () => {
      send(chip.dataset.say);
      speak(chip.dataset.say);
    });
  });

  root.querySelector('[data-chat-mic]')?.addEventListener('click', async (event) => {
    const btn = event.currentTarget;
    if (micOn) {
      micOn = false;
      meter.stop();
      btn.classList.remove('is-recording');
      ctx.toast('Microphone stopped.');
      return;
    }
    const ok = await meter.start();
    if (!ok) {
      ctx.toast(meter.error, { tone: 'error' });
      return;
    }
    micOn = true;
    btn.classList.add('is-recording');
    ctx.toast('Listening — speak your Yorùbá phrase.');
    window.setTimeout(() => {
      if (!micOn) return;
      micOn = false;
      meter.stop();
      btn.classList.remove('is-recording');
      send(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]);
    }, 3200);
  });

  chat.scrollTop = chat.scrollHeight;

  return () => meter.stop();
}


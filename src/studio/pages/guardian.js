/* Idilewa STEM Studio — guardian console: consent, learners, weekly report. */

import { icon, esc, initials } from '../ui.js';

const WEEK = [
  { day: 'M', value: 62 },
  { day: 'T', value: 48 },
  { day: 'W', value: 80 },
  { day: 'T', value: 34 },
  { day: 'F', value: 71 },
  { day: 'S', value: 92 },
  { day: 'S', value: 28 },
];

function reportCard(state) {
  const total = state.minutes;
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('pulse')} Week 6 report</h3>
      <span class="cs-pill cs-pill--mint cs-pill--sm">On track</span>
    </div>
    <div class="cs-metrics">
      <div class="cs-metric"><span class="cs-metric__label">Minutes</span><strong class="cs-metric__value">${total}</strong><span class="cs-help">+18% vs week 5</span></div>
      <div class="cs-metric"><span class="cs-metric__label">Lessons</span><strong class="cs-metric__value">${state.lessonsDone}</strong><span class="cs-help">3 voice, 4 tonal</span></div>
      <div class="cs-metric"><span class="cs-metric__label">Streak</span><strong class="cs-metric__value">${state.streak}d</strong><span class="cs-help">Best 9d</span></div>
    </div>
    <div class="cs-graph">
      <canvas data-week width="340" height="132" aria-label="Minutes practised each day this week"></canvas>
      <div class="cs-graph__legend">
        <span><i style="background:#fbbf24"></i>Minutes per day</span>
        <span><i style="background:#34d399"></i>Family average</span>
        <button type="button" class="cs-link" data-email-report style="color:#fff;margin-left:auto">${icon('mail')} Email report</button>
      </div>
    </div>
  </section>`;
}

function consentCard(state) {
  const { consent } = state;
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('shield')} Guardian consent</h3>
      <span class="cs-pill cs-pill--${consent.signed ? 'mint' : 'terra'} cs-pill--sm">${consent.signed ? 'Signed' : 'Pending'}</span>
    </div>
    <div class="cs-consent">
      <span class="cs-childrow__ava">${esc(initials(consent.guardianName))}</span>
      <div class="cs-consent__body">
        <strong>${esc(consent.guardianName)}</strong>
        <span>${esc(consent.guardianEmail)}${consent.signed ? ` • signed ${esc(consent.signedAt)}` : ' • awaiting signature'}</span>
      </div>
      <span class="cs-pill cs-pill--${consent.signed ? 'mint' : 'terra'} cs-pill--sm">${consent.signed ? 'Active' : 'Action'}</span>
    </div>
    <div class="cs-consent">
      <span class="cs-ico-tile">${icon('mic')}</span>
      <div class="cs-consent__body">
        <strong>Allow voice recording</strong>
        <span>Needed for pitch practice and AI Speak.</span>
      </div>
      <button type="button" class="cs-toggle${consent.recordingAllowed ? ' is-on' : ''}" data-consent="recordingAllowed" aria-pressed="${consent.recordingAllowed}" aria-label="Allow voice recording"></button>
    </div>
    <div class="cs-consent">
      <span class="cs-ico-tile">${icon('users')}</span>
      <div class="cs-consent__body">
        <strong>Allow live mentors</strong>
        <span>Book verified teachers in 1:1 rooms.</span>
      </div>
      <button type="button" class="cs-toggle${consent.mentorAllowed ? ' is-on' : ''}" data-consent="mentorAllowed" aria-pressed="${consent.mentorAllowed}" aria-label="Allow live mentors"></button>
    </div>
    <button type="button" class="cs-btn cs-btn--${consent.signed ? 'ghost' : 'primary'} cs-btn--block" data-sign-consent>
      ${icon('key')} ${consent.signed ? 'Re-sign consent form' : 'Sign consent form'}
    </button>
  </section>`;
}

function learnersCard(state) {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('users')} Learners</h3>
      <button type="button" class="cs-link" data-add-child>${icon('plus')} Add learner</button>
    </div>
    <div class="cs-lineage">
      ${state.children.map((child) => `<div class="cs-childrow">
        <span class="cs-childrow__ava">${esc(initials(child.name))}</span>
        <div class="cs-childrow__body">
          <strong>${esc(child.name)}</strong>
          <span>${esc(child.grade)} • age ${child.age} • ${child.xp} XP</span>
          <div class="cs-meter cs-meter--slim"><span class="cs-meter__fill" style="width:${Math.min(100, Math.round(child.xp / 6))}%"></span></div>
        </div>
        <button type="button" class="cs-iconbtn" data-child-menu="${child.id}" aria-label="Manage ${esc(child.name)}">${icon('chevronRight')}</button>
      </div>`).join('')}
    </div>
  </section>`;
}

function safeguardCard() {
  return `
  <section class="cs-safeguard">
    <div class="cs-row cs-row--between">
      <h3 class="cs-card__title">${icon('shield')} Safeguarding controls</h3>
      <span class="cs-pill cs-pill--mint cs-pill--sm">Enforced</span>
    </div>
    <div class="cs-safeguard__row">${icon('lock')}<span>Recordings are AES-GCM encrypted in the browser vault and never leave the device unless a guardian exports them.</span></div>
    <div class="cs-safeguard__row">${icon('key')}<span>Six-digit family passcode gates payments, mentor booking and consent changes.</span></div>
    <div class="cs-safeguard__row">${icon('users')}<span>Live rooms open only after guardian approval; mentors are ID-verified.</span></div>
    <div class="cs-safeguard__row">${icon('eye')}<span>Weekly report is the only data shared outside the family pass.</span></div>
    <a class="cs-btn cs-btn--ghost cs-btn--block" href="#/auth">${icon('key')} Change family passcode</a>
  </section>`;
}

function paintWeek(canvas, values) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 320;
  const height = 132;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const pad = 14;
  const barW = (width - pad * 2) / values.length - 8;
  const max = 100;

  ctx.strokeStyle = 'rgba(234,255,242,.12)';
  ctx.lineWidth = 1;
  for (let line = 0; line < 4; line += 1) {
    const y = 8 + ((height - 26) / 3) * line;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  values.forEach((entry, index) => {
    const x = pad + index * ((width - pad * 2) / values.length) + 4;
    const barHeight = ((height - 34) * entry.value) / max;
    const gradient = ctx.createLinearGradient(0, height - 22 - barHeight, 0, height - 22);
    gradient.addColorStop(0, '#fbbf24');
    gradient.addColorStop(1, '#f59e0b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect?.(x, height - 22 - barHeight, barW, barHeight, 5);
    if (!ctx.roundRect) ctx.rect(x, height - 22 - barHeight, barW, barHeight);
    ctx.fill();

    ctx.fillStyle = 'rgba(234,255,242,.7)';
    ctx.font = '700 9px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(entry.day, x + barW / 2, height - 8);
  });
}

export function render(ctx) {
  const state = ctx.state;
  return `
  <div class="cs-stack">
    <section class="cs-pagehead">
      <div class="cs-pagehead__row">
        <span class="cs-ico-tile cs-ico-tile--dark">${icon('shield')}</span>
        <div class="cs-col cs-grow" style="gap:1px">
          <h2 class="cs-h2">Guardian console</h2>
          <span class="cs-help">${esc(state.user.familyName)} • Idilewa Family Pass</span>
        </div>
        <span class="cs-pill cs-pill--mint cs-pill--sm">${state.children.length} learners</span>
      </div>
    </section>
    ${consentCard(state)}
    ${reportCard(state)}
    ${learnersCard(state)}
    ${safeguardCard()}
  </div>`;
}

export function mount(root, ctx) {
  const week = root.querySelector('[data-week]');
  if (week) paintWeek(week, WEEK);

  root.addEventListener('click', async (event) => {
    const toggle = event.target.closest('[data-consent]');
    if (toggle) {
      const key = toggle.dataset.consent;
      const next = !ctx.state.consent[key];
      if (!next && key === 'recordingAllowed') {
        ctx.toast('Recording off — Voice and AI Speak will ask again.', { tone: 'error' });
      }
      toggle.classList.toggle('is-on', next);
      toggle.setAttribute('aria-pressed', next ? 'true' : 'false');
      await ctx.store.patch({ consent: { [key]: next } });
      return;
    }

    if (event.target.closest('[data-email-report]')) {
      ctx.toast(`Week 6 report sent to ${ctx.state.consent.guardianEmail}.`);
      return;
    }

    if (event.target.closest('[data-sign-consent]')) {
      ctx.modal({
        title: 'Sign guardian consent',
        body: `<div class="cs-col" style="gap:10px">
          <p class="cs-help">By signing you confirm you are the parent or legal guardian of the learners on this pass, and you allow encrypted voice practice on this device.</p>
          <label class="cs-field"><span class="cs-label">Guardian full name</span><input class="cs-input" data-guardian-name value="${esc(ctx.state.consent.guardianName)}" /></label>
          <label class="cs-field"><span class="cs-label">Email for weekly reports</span><input class="cs-input" type="email" data-guardian-email value="${esc(ctx.state.consent.guardianEmail)}" /></label>
          <label class="cs-check"><input type="checkbox" data-guardian-agree checked /><span>I agree to the Idilewa family safeguarding terms.</span></label>
        </div>`,
        actions: `<button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-guardian-save>${icon('check')} Sign consent</button>
          <button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-close>Cancel</button>`,
        onMount: (wrap, close) => {
          wrap.querySelector('[data-guardian-save]')?.addEventListener('click', async () => {
            const name = wrap.querySelector('[data-guardian-name]').value.trim() || 'Guardian';
            const email = wrap.querySelector('[data-guardian-email]').value.trim();
            const agree = wrap.querySelector('[data-guardian-agree]').checked;
            if (!agree) {
              ctx.toast('Tick the safeguarding agreement to continue.', { tone: 'error' });
              return;
            }
            close();
            await ctx.store.patch({
              consent: { guardianName: name, guardianEmail: email, signed: true, signedAt: new Date().toISOString().slice(0, 10) },
            });
            ctx.toast('Consent signed and encrypted on this device.');
            ctx.rerender();
          });
        },
      });
    }
  });

  wireLearners(root, ctx);
}

function wireLearners(root, ctx) {
  root.addEventListener('click', async (event) => {
    if (event.target.closest('[data-add-child]')) {
      ctx.modal({
        title: 'Add a learner',
        body: `<div class="cs-col" style="gap:10px">
          <label class="cs-field"><span class="cs-label">First name</span><input class="cs-input" data-child-name placeholder="e.g. Bọ́lá" /></label>
          <div class="cs-formrow">
            <label class="cs-field"><span class="cs-label">Age</span><input class="cs-input" type="number" min="5" max="17" data-child-age placeholder="9" /></label>
            <label class="cs-field"><span class="cs-label">Grade</span><input class="cs-input" data-child-grade placeholder="Grade 4" /></label>
          </div>
        </div>`,
        actions: `<button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-child-save>${icon('plus')} Add learner</button>
          <button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-close>Cancel</button>`,
        onMount: (wrap, close) => {
          wrap.querySelector('[data-child-save]')?.addEventListener('click', async () => {
            const name = wrap.querySelector('[data-child-name]').value.trim();
            const age = Number(wrap.querySelector('[data-child-age]').value) || 9;
            const grade = wrap.querySelector('[data-child-grade]').value.trim() || 'Grade 4';
            if (name.length < 2) {
              ctx.toast('Enter the learner’s first name.', { tone: 'error' });
              return;
            }
            close();
            const children = [...ctx.state.children, { id: `c${Date.now()}`, name, initials: initials(name), age, grade, xp: 0, tone: 'mi' }];
            await ctx.store.patch({ children });
            ctx.toast(`${name} added to the family pass.`);
            ctx.rerender();
          });
        },
      });
      return;
    }

    const menu = event.target.closest('[data-child-menu]');
    if (!menu) return;
    const child = ctx.state.children.find((entry) => entry.id === menu.dataset.childMenu);
    if (!child) return;
    ctx.modal({
      title: child.name,
      body: `<div class="cs-col" style="gap:9px">
        <div class="cs-row cs-row--between"><span class="cs-help">Grade</span><strong style="font-size:12.5px">${esc(child.grade)}</strong></div>
        <div class="cs-row cs-row--between"><span class="cs-help">Age</span><strong style="font-size:12.5px">${child.age}</strong></div>
        <div class="cs-row cs-row--between"><span class="cs-help">XP this term</span><strong style="font-size:12.5px">${child.xp}</strong></div>
      </div>`,
      actions: `<button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-child-remove>${icon('trash')} Remove from pass</button>
        <button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-close>Done</button>`,
      onMount: (wrap, close) => {
        wrap.querySelector('[data-child-remove]')?.addEventListener('click', async () => {
          close();
          await ctx.store.patch({ children: ctx.state.children.filter((entry) => entry.id !== child.id) });
          ctx.toast(`${child.name} removed from the family pass.`);
          ctx.rerender();
        });
      },
    });
  });
}


/* Idilewa STEM Studio — learner profile, badges, settings and account. */

import { ASSETS, icon, esc, initials } from '../ui.js';
import { ROLE_LABELS, LEVELS } from '../store.js';
import { haptic, playToneId } from '../audio.js';

const SETTINGS = [
  { key: 'soundEffects', label: 'Studio sound effects', help: 'Tone cues, correct-answer chimes.' },
  { key: 'haptics', label: 'Haptics', help: 'A short buzz on key taps.' },
  { key: 'reducedMotion', label: 'Reduce motion', help: 'Calmer transitions and meters.' },
  { key: 'offlineVault', label: 'Offline vault', help: 'Keep progress encrypted on this device.' },
  { key: 'shareProgress', label: 'Share progress with guardian', help: 'Weekly report to your family inbox.' },
];

function hero(state, level) {
  const { user } = state;
  return `
  <section class="cs-profile-hero">
    <img class="cs-avatar--hero" src="${ASSETS.kidsCulture}" alt="${esc(user.name)}" />
    <div class="cs-profile-hero__meta">
      <span class="cs-rank">${icon('trophy')} ${esc(level.current.name)}</span>
      <strong>${esc(user.name)}</strong>
      <span>${esc(ROLE_LABELS[user.role] || 'Learner')} • ${esc(user.familyName)}${user.signedIn ? '' : ' • Guest mode'}</span>
      <div class="cs-meter cs-meter--slim" style="background:rgba(255,255,255,.22)"><span class="cs-meter__fill" style="width:${level.pct}%;background:linear-gradient(90deg,#fbbf24,#fde68a)"></span></div>
      <span>${level.xp} XP • next rank ${esc(level.next.name)}</span>
    </div>
  </section>`;
}

function metrics(state) {
  return `
  <div class="cs-metrics">
    <div class="cs-metric"><span class="cs-metric__label">Streak</span><strong class="cs-metric__value">${state.streak} days</strong><span class="cs-help">Best: 9 days</span></div>
    <div class="cs-metric"><span class="cs-metric__label">Practice</span><strong class="cs-metric__value">${state.minutes} min</strong><span class="cs-help">This week</span></div>
    <div class="cs-metric"><span class="cs-metric__label">Lessons</span><strong class="cs-metric__value">${state.lessonsDone}</strong><span class="cs-help">${state.voiceSessions} voice sessions</span></div>
  </div>`;
}

function badges(state) {
  const earned = state.badges.filter((badge) => badge.earned).length;
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('trophy')} Badges</h3>
      <span class="cs-pill cs-pill--mint cs-pill--sm">${earned}/${state.badges.length}</span>
    </div>
    <div class="cs-badges">
      ${state.badges.map((badge) => `<div class="cs-badge"${badge.earned ? '' : ' style="opacity:.45"'}>
        <span style="font-size:19px;line-height:1">${badge.emoji}</span>
        <strong>${esc(badge.name)}</strong>
        <span class="cs-help">${esc(badge.sub)}</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function ladder(level) {
  return `
  <section class="cs-card">
    <div class="cs-card__head"><h3 class="cs-card__title">${icon('sparkles')} Rank ladder</h3></div>
    <div class="cs-col" style="gap:7px">
      ${LEVELS.map((entry) => `<div class="cs-listrow${entry.name === level.current.name ? ' cs-listrow--active' : ''}">
        <span class="cs-pill cs-pill--${entry.name === level.current.name ? 'dark' : 'outline'} cs-pill--sm">${entry.at} XP</span>
        <span class="cs-col cs-grow" style="gap:1px"><strong style="font-size:12.5px">${esc(entry.name)}</strong><span class="cs-help">${esc(entry.sub)}</span></span>
        ${entry.at <= level.xp ? icon('checkCircle') : icon('lock')}
      </div>`).join('')}
    </div>
  </section>`;
}


function settingsCard(state) {
  return `
  <section class="cs-card">
    <div class="cs-card__head"><h3 class="cs-card__title">${icon('settings')} Settings</h3></div>
    <div class="cs-col" style="gap:11px">
      ${SETTINGS.map((setting) => `<div class="cs-row cs-row--between" style="gap:12px">
        <span class="cs-col cs-grow" style="gap:1px"><strong style="font-size:12.5px">${esc(setting.label)}</strong><span class="cs-help">${esc(setting.help)}</span></span>
        <button type="button" class="cs-toggle${state.settings[setting.key] ? ' is-on' : ''}" data-setting="${setting.key}" aria-pressed="${state.settings[setting.key] ? 'true' : 'false'}" aria-label="${esc(setting.label)}"></button>
      </div>`).join('')}
      <div class="cs-row cs-row--between" style="gap:12px">
        <span class="cs-col cs-grow" style="gap:1px"><strong style="font-size:12.5px">Instruction language</strong><span class="cs-help">Switches labels and glosses.</span></span>
        <div class="cs-seg" data-language>
          <button type="button" class="cs-seg__btn${state.settings.language === 'yoruba' ? ' is-active' : ''}" data-lang="yoruba">Yorùbá</button>
          <button type="button" class="cs-seg__btn${state.settings.language === 'english' ? ' is-active' : ''}" data-lang="english">English</button>
        </div>
      </div>
    </div>
  </section>`;
}

function childrenCard(state) {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('users')} Learners on this pass</h3>
      <a class="cs-link" href="#/guardian">Manage</a>
    </div>
    <div class="cs-col" style="gap:7px">
      ${state.children.map((child) => `<div class="cs-listrow">
        <span class="cs-avatar">${esc(initials(child.name))}</span>
        <span class="cs-col cs-grow" style="gap:1px"><strong style="font-size:12.5px">${esc(child.name)}</strong><span class="cs-help">${esc(child.grade)} • age ${child.age}</span></span>
        <span class="cs-pill cs-pill--mint cs-pill--sm">${child.xp} XP</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function accountCard(state) {
  const rows = [
    { id: 'guardian', icon: 'shield', label: 'Guardian consent', value: state.consent.signed ? 'Signed' : 'Pending' },
    { id: 'checkout', icon: 'card', label: 'Idilewa Family Pass', value: '₦48,000 / year' },
    { id: 'mentors', icon: 'users', label: 'Mentors', value: '3 available' },
    { id: 'auth', icon: 'key', label: 'Sign in & passcode', value: state.user.signedIn ? 'Verified' : 'Sign in' },
  ];
  return `
  <section class="cs-card">
    <div class="cs-card__head"><h3 class="cs-card__title">${icon('lock')} Account & privacy</h3></div>
    <div class="cs-col" style="gap:7px">
      ${rows.map((row) => `<a class="cs-settings-link" href="#/${row.id}">
        <span class="cs-ico-tile">${icon(row.icon)}</span>
        <span class="cs-col cs-grow" style="gap:1px"><strong style="font-size:12.5px">${esc(row.label)}</strong><span class="cs-help">${esc(row.value)}</span></span>
        ${icon('chevronRight')}
      </a>`).join('')}
      <button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-signout>${icon('logout')} Sign out</button>
    </div>
  </section>`;
}

export function render(ctx) {
  const state = ctx.state;
  const level = ctx.level || { current: LEVELS[0], next: LEVELS[1], pct: 0, xp: state.xp };
  return `
  <div class="cs-stack">
    ${hero(state, level)}
    ${metrics(state)}
    <div class="cs-grid cs-grid--2">
      ${badges(state)}
      ${settingsCard(state)}
    </div>
    <div class="cs-grid cs-grid--2">
      ${childrenCard(state)}
      ${ladder(level)}
    </div>
    ${accountCard(state)}
    <p class="cs-help cs-center">Progress is encrypted with AES-GCM in your browser vault. Copying or printing keeps your name watermarked.</p>
  </div>`;
}

export function mount(root, ctx) {
  root.addEventListener('click', async (event) => {
    const toggle = event.target.closest('[data-setting]');
    if (toggle) {
      const key = toggle.dataset.setting;
      const next = !ctx.state.settings[key];
      toggle.classList.toggle('is-on', next);
      toggle.setAttribute('aria-pressed', next ? 'true' : 'false');
      await ctx.store.patch({ settings: { [key]: next } }, { silent: true });
      if (key === 'soundEffects' && next) playToneId('mid', { duration: 0.16, gain: 0.05 });
      if (key === 'haptics' && next) haptic(10);
      ctx.toast(`${next ? 'Enabled' : 'Disabled'} — ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      return;
    }
    const lang = event.target.closest('[data-lang]');
    if (lang) {
      await ctx.store.patch({ settings: { language: lang.dataset.lang } });
      ctx.toast(`Language set to ${lang.dataset.lang === 'yoruba' ? 'Yorùbá' : 'English'}.`);
      return;
    }
    if (event.target.closest('[data-signout]')) {
      await ctx.store.signOut();
      ctx.toast('Signed out. Progress stays encrypted on this device.');
      ctx.nav('auth');
    }
  });
}


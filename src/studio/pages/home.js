/* Idilewa STEM Studio — Home (learner command centre). */

import { icon, ASSETS, esc } from '../ui.js';
import { store } from '../store.js';

function badgeRow(badges) {
  return badges.slice(0, 4).map((badge) => `<div class="cs-badge${badge.earned ? '' : ' is-locked'}">
      <i>${badge.emoji}</i><b>${esc(badge.name)}</b><span>${esc(badge.sub)}</span>
    </div>`).join('');
}

function heroBlock(ctx) {
  const { user, xp, streak } = ctx.state;
  const level = store.level();
  const firstName = (user.name || 'friend').split(' ')[0];
  return `
  <section class="cs-greet">
    <div class="cs-greet__row">
      <div class="cs-col" style="gap:4px">
        <span class="cs-kicker">Yorùbá · ${esc(user.role === 'child' ? 'Grade 4' : 'Adult track')}</span>
        <h1 class="cs-h1">Ẹ káàárọ̀, ${esc(firstName)}</h1>
      </div>
      <button type="button" class="cs-iconbtn" data-notify aria-label="Notifications">${icon('bell')}</button>
    </div>
    <p class="cs-sub">${streak}-day streak. One more tonal drill keeps your flame alive.</p>
  </section>

  <section class="cs-hero-home">
    <div class="cs-hero-home__chips"><span>Level 02</span><span>Tone quest</span><span>+60 XP</span></div>
    <div class="cs-col" style="gap:6px">
      <h2 class="cs-h2" style="color:#f2fff8">Three high tones, one checkpoint</h2>
      <p style="font-size:12.5px;color:rgba(234,255,242,.78);line-height:1.5">
        Drill <b>Dò · Re · Mi</b> on the tone keys, then read “Ẹ káàárọ̀” back to the AI tutor.
      </p>
    </div>
    <div class="cs-row" style="gap:8px">
      <button type="button" class="cs-btn cs-btn--ochre cs-btn--sm" data-nav="voice">${icon('play')} Continue lesson</button>
      <button type="button" class="cs-btn cs-btn--sm cs-btn--glass" data-nav="lab">${icon('waves')} Tonal Lab</button>
    </div>
    <div class="cs-col" style="gap:6px">
      <div class="cs-row cs-row--between" style="font-size:11px;font-weight:700;color:rgba(234,255,242,.8)">
        <span>${esc(level.current.name)}</span><span>${xp}/600 XP</span>
      </div>
      <div class="cs-meter cs-meter--warm" style="background:rgba(255,255,255,.2)">
        <span class="cs-meter__fill" style="width:${Math.max(6, level.pct)}%"></span>
      </div>
    </div>
  </section>

  <div class="cs-quick">
    <button type="button" class="cs-quick__btn" data-nav="voice">
      <span class="cs-ico-tile">${icon('mic')}</span>
      <strong>Voice drills</strong><span>60 audio lessons</span>
    </button>
    <button type="button" class="cs-quick__btn" data-nav="lab">
      <span class="cs-ico-tile cs-ico-tile--ochre">${icon('waves')}</span>
      <strong>Tonal Lab</strong><span>Hear pitch pairs</span>
    </button>
    <button type="button" class="cs-quick__btn" data-nav="code">
      <span class="cs-ico-tile cs-ico-tile--dark">${icon('code')}</span>
      <strong>Code studio</strong><span>Blocks + canvas</span>
    </button>
    <button type="button" class="cs-quick__btn" data-nav="speak">
      <span class="cs-ico-tile cs-ico-tile--terra">${icon('sparkles')}</span>
      <strong>AI Speak</strong><span>Talk with Ìdí</span>
    </button>
  </div>`;
}

function missionBlock() {
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <div class="cs-col" style="gap:2px">
        <h3 class="cs-card__title">${icon('checkCircle')} Today&rsquo;s mission</h3>
        <span class="cs-tiny">2 of 3 complete · resets at midnight</span>
      </div>
      <span class="cs-pill cs-pill--ochre">+90 XP</span>
    </div>
    <div class="cs-mission">
      <div class="cs-mission__ring"><i>68%</i></div>
      <div class="cs-col" style="gap:2px">
        <strong style="font-size:13px">Sound the three tones</strong>
        <span style="font-size:11.5px;color:#7c4a03">Tap Dò → Re → Mi without a miss.</span>
      </div>
    </div>
    <div class="cs-col" style="gap:8px">
      <div class="cs-row cs-row--between" style="font-size:12px"><span>Warm-up listening</span><span class="cs-pill cs-pill--mint cs-pill--sm">${icon('check')} Done</span></div>
      <div class="cs-row cs-row--between" style="font-size:12px"><span>Tone keys drill</span><span class="cs-pill cs-pill--mint cs-pill--sm">${icon('check')} Done</span></div>
      <div class="cs-row cs-row--between" style="font-size:12px"><span>Speak the greeting</span><button type="button" class="cs-pill cs-pill--sm" data-nav="speak">Start</button></div>
    </div>
  </section>`;
}

function spotlightBlock() {
  return `
  <section class="cs-card cs-card--surface">
    <div class="cs-spotlight">
      <img class="cs-spotlight__art" src="${ASSETS.educatorWoman}" alt="Yorùbá educator recording a listening lesson" />
      <div class="cs-col" style="gap:4px">
        <span class="cs-kicker">Spotlight · Listening</span>
        <strong style="font-size:14px;letter-spacing:-.01em">Ìtàn Ẹṣin — the horse story</strong>
        <span class="cs-tiny">6 min · Yorùbá with English gloss</span>
        <button type="button" class="cs-btn cs-btn--primary cs-btn--xs" style="align-self:flex-start" data-nav="voice">${icon('headphones')} Listen</button>
      </div>
    </div>
  </section>`;
}

function activityBlock(ctx) {
  const level = store.level();
  return `
  <section class="cs-card">
    <div class="cs-card__head">
      <h3 class="cs-card__title">${icon('trophy')} Badges</h3>
      <button type="button" class="cs-link" data-nav="profile">See all</button>
    </div>
    <div class="cs-badges">${badgeRow(ctx.state.badges)}</div>
  </section>

  <section class="cs-card">
    <div class="cs-card__head">
      <div class="cs-col" style="gap:2px">
        <h3 class="cs-card__title">${icon('pulse')} Recent activity</h3>
        <span class="cs-tiny">Last 3 sessions</span>
      </div>
      <span class="cs-pill cs-pill--mint cs-pill--sm">${esc(level.current.sub)}</span>
    </div>
    <div class="cs-col" style="gap:0">
      ${ctx.state.activity.slice(0, 3).map((item) => `<div class="cs-vaultrow">
        <span class="cs-ico-tile">${icon('sparkles')}</span>
        <div class="cs-vaultrow__txt"><strong>${esc(item.text)}</strong><span>${esc(item.when)}</span></div>
        <span class="cs-pill cs-pill--sm">+${item.xp} XP</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function familyBlock() {
  return `
  <section class="cs-card cs-card--dark">
    <div class="cs-card__head">
      <div class="cs-col" style="gap:4px">
        <span class="cs-kicker">Family pass</span>
        <h3 class="cs-h2" style="color:#f2fff8">One pass, every child</h3>
      </div>
      <span class="cs-pill cs-pill--solid">₦48,000</span>
    </div>
    <p class="cs-sub">Unlimited learners, mentor reviews and guardian reporting — billed yearly.</p>
    <button type="button" class="cs-btn cs-btn--ochre cs-btn--block" data-nav="checkout">${icon('card')} View family pass</button>
  </section>`;
}

function mentorBlock() {
  return `
  <section class="cs-card">
    <div class="cs-card__head"><h3 class="cs-card__title">${icon('users')} Your mentors</h3><button type="button" class="cs-link" data-nav="mentors">Browse</button></div>
    <div class="cs-row" style="gap:10px">
      <img class="cs-thumb" src="${ASSETS.educatorWoman}" alt="" />
      <div class="cs-col cs-grow" style="gap:2px">
        <strong style="font-size:13px">Dr. Folake Adeyemi</strong>
        <span class="cs-tiny">Phonetics · ₦7,500/hr</span>
      </div>
      <button type="button" class="cs-btn cs-btn--sm cs-btn--primary" data-nav="mentors">Book</button>
    </div>
    <div class="cs-row" style="gap:10px">
      <img class="cs-thumb" src="${ASSETS.educatorMan}" alt="" />
      <div class="cs-col cs-grow" style="gap:2px">
        <strong style="font-size:13px">Bàbá Ayọ̀ Ọlá</strong>
        <span class="cs-tiny">Storytelling · ₦6,000/hr</span>
      </div>
      <button type="button" class="cs-btn cs-btn--sm cs-btn--ghost" data-nav="mentors">View</button>
    </div>
  </section>`;
}

export function render(ctx) {
  return [
    heroBlock(ctx),
    missionBlock(),
    spotlightBlock(),
    activityBlock(ctx),
    familyBlock(),
    mentorBlock(),
  ].join('');
}

export function mount(root, ctx) {
  root.querySelector('[data-notify]')?.addEventListener('click', () => {
    ctx.toast('Guardian report for week 6 is ready to review.');
  });
}



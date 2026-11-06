/* Idilewa STEM Studio — mentor marketplace with booking sheet. */

import { ASSETS, icon, esc } from '../ui.js';

export const MENTORS = [
  {
    id: 'folake',
    name: 'Dr. Folake Adeyemi',
    role: 'Yorùbá phonetics & tonal coach',
    price: 7500,
    rating: 4.9,
    sessions: 312,
    tags: ['voice', 'tones'],
    photo: ASSETS.educatorWoman,
    blurb: 'Twenty years teaching tone in Ìbàdàn classrooms. Fixes contour errors in two sessions.',
  },
  {
    id: 'ayo',
    name: 'Ọ̀gbẹ́ni Ayọ̀ Ọlá',
    role: 'Code & robotics mentor',
    price: 6000,
    rating: 4.8,
    sessions: 204,
    tags: ['code'],
    photo: ASSETS.educatorMan,
    blurb: 'Builds block games and micro:bit projects with learners aged 8–14.',
  },
  {
    id: 'kemi',
    name: 'Ìyá Kẹ́mi Adébáyọ̀',
    role: 'Storytelling & early reading',
    price: 5500,
    rating: 5,
    sessions: 187,
    tags: ['story', 'voice'],
    photo: ASSETS.storyGrandmother,
    blurb: 'Uses moonlight tales and call-and-response to grow confident readers.',
  },
];

const FILTERS = [
  { id: 'all', label: 'All mentors' },
  { id: 'voice', label: 'Voice & tones' },
  { id: 'code', label: 'Code' },
  { id: 'story', label: 'Storytelling' },
];

const SLOTS = ['Sat · 10:00 am', 'Sat · 4:30 pm', 'Sun · 1:00 pm', 'Mon · 6:00 pm'];

function card(mentor) {
  return `
  <article class="cs-mentor" data-mentor-card="${mentor.id}">
    <img class="cs-mentor__photo" src="${mentor.photo}" alt="${esc(mentor.name)}" />
    <div class="cs-mentor__body">
      <div class="cs-mentor__meta">
        <strong class="cs-mentor__name">${esc(mentor.name)}</strong>
        <span class="cs-help">${esc(mentor.role)}</span>
        <span class="cs-stars">${icon('star')} ${mentor.rating} • ${mentor.sessions} sessions</span>
      </div>
      <p class="cs-help">${esc(mentor.blurb)}</p>
      <div class="cs-mentor__tags">
        ${mentor.tags.map((tag) => `<span class="cs-pill cs-pill--mint cs-pill--sm">${esc(tag)}</span>`).join('')}
        <span class="cs-pill cs-pill--ochre cs-pill--sm">₦${mentor.price.toLocaleString('en-NG')}/hr</span>
      </div>
      <button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-book="${mentor.id}">${icon('calendar')} Book ${esc(mentor.name.split(' ')[0])}</button>
    </div>
  </article>`;
}


export function render(ctx) {
  return `
  <div class="cs-stack">
    <section class="cs-mentor-hero">
      <div class="cs-mentor-hero__media"><img src="${ASSETS.educatorWoman}" alt="Yorùbá educator teaching a learner" /></div>
      <div class="cs-col" style="gap:8px">
        <span class="cs-kicker">LAB 09 • MENTORSHIP</span>
        <h2 class="cs-h2">Real teachers, live on your family pass</h2>
        <p class="cs-sub">Verified Yorùbá educators and STEM mentors. Guardian approval is required before any child joins a live room.</p>
        <div class="cs-chips">
          <span class="cs-chip">${icon('shield')} Safeguarding checked</span>
          <span class="cs-chip">${icon('video')} 1:1 or family room</span>
          <span class="cs-chip">${icon('card')} KoraPay escrow</span>
        </div>
      </div>
    </section>

    <div class="cs-chips" data-filters>
      ${FILTERS.map((filter, index) => `<button type="button" class="cs-chip${index === 0 ? ' is-active' : ''}" data-filter="${filter.id}">${esc(filter.label)}</button>`).join('')}
    </div>

    <div class="cs-grid cs-grid--2" data-mentor-grid>
      ${MENTORS.map(card).join('')}
    </div>

    <section class="cs-card cs-card--mint">
      <div class="cs-card__head"><h3 class="cs-card__title">${icon('lock')} How guardian approval works</h3></div>
      <div class="cs-steps">
        <div class="cs-step"><strong>1</strong><span>Learner requests a slot.</span></div>
        <div class="cs-step"><strong>2</strong><span>Guardian approves by family passcode.</span></div>
        <div class="cs-step"><strong>3</strong><span>Payment holds in escrow until the class ends.</span></div>
      </div>
    </section>
  </div>`;
}


export function mount(root, ctx) {
  let filter = 'all';

  const paint = () => {
    const grid = root.querySelector('[data-mentor-grid]');
    if (!grid) return;
    const list = filter === 'all' ? MENTORS : MENTORS.filter((mentor) => mentor.tags.includes(filter));
    grid.innerHTML = list.length ? list.map(card).join('') : '<p class="cs-help">No mentors in this track yet — try another filter.</p>';
  };

  root.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter]');
    if (chip) {
      filter = chip.dataset.filter;
      root.querySelectorAll('[data-filter]').forEach((btn) => btn.classList.toggle('is-active', btn === chip));
      paint();
      return;
    }

    const book = event.target.closest('[data-book]');
    if (!book) return;
    if (!ctx.state.consent.mentorAllowed) {
      ctx.toast('A guardian must enable live mentoring in Guardian settings first.', { tone: 'error' });
      return;
    }
    const mentor = MENTORS.find((entry) => entry.id === book.dataset.book);
    if (!mentor) return;
    let slot = SLOTS[0];
    ctx.modal({
      title: `Book ${mentor.name}`,
      body: `<div class="cs-col" style="gap:10px">
        <div class="cs-row" style="gap:10px">
          <img class="cs-mentor__photo" src="${mentor.photo}" alt="" style="width:52px;height:52px" />
          <div class="cs-col cs-grow" style="gap:2px">
            <strong style="font-size:13px">${esc(mentor.role)}</strong>
            <span class="cs-help">₦${mentor.price.toLocaleString('en-NG')}/hr • Escrow protected</span>
          </div>
        </div>
        <div class="cs-col" style="gap:6px" data-slots>
          ${SLOTS.map((entry, index) => `<button type="button" class="cs-listrow${index === 0 ? ' cs-listrow--active' : ''}" data-slot="${esc(entry)}">
            <span class="cs-pill cs-pill--outline cs-pill--sm">${esc(entry.split(' · ')[0])}</span>
            <span class="cs-col cs-grow" style="gap:1px"><strong style="font-size:12.5px">${esc(entry.split(' · ')[1])}</strong><span class="cs-help">45 minutes • 1:1</span></span>
            ${icon('checkCircle')}
          </button>`).join('')}
        </div>
      </div>`,
      actions: `<button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-confirm>${icon('lock')} Request with guardian approval</button>
        <button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-close>Cancel</button>`,
      onMount: (wrap, close) => {
        wrap.querySelectorAll('[data-slot]').forEach((button) => {
          button.addEventListener('click', () => {
            slot = button.dataset.slot;
            wrap.querySelectorAll('[data-slot]').forEach((btn) => btn.classList.toggle('cs-listrow--active', btn === button));
          });
        });
        wrap.querySelector('[data-confirm]')?.addEventListener('click', async () => {
          close();
          ctx.toast(`Request sent to your guardian for ${slot}.`);
          await ctx.store.addXp(15, `Booked ${mentor.name} for ${slot}`);
        });
      },
    });
  });
}

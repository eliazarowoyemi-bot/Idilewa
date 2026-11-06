/* Idilewa STEM Studio — family pass checkout with escrow-protected payment. */

import { icon, esc } from '../ui.js';

const PLANS = [
  {
    id: 'term',
    name: 'Term Pass',
    price: 18000,
    period: 'per term',
    blurb: 'One learner, all labs, 3 months.',
    perks: ['1 learner profile', 'Voice, Tonal Lab, Code Studio', 'Weekly guardian report'],
  },
  {
    id: 'family',
    name: 'Idilewa Family Pass',
    price: 48000,
    period: 'per year',
    blurb: 'Up to 4 learners plus mentor credits.',
    featured: true,
    perks: ['4 learner profiles', 'All labs + AI Speak', '2 mentor credits a term', 'Guardian console & reports'],
  },
  {
    id: 'school',
    name: 'Classroom Pass',
    price: 120000,
    period: 'per year',
    blurb: 'For tutors running a cohort.',
    perks: ['30 seats', 'Teacher dashboard', 'Tonal Lab curriculum pack'],
  },
];

const CHANNELS = [
  { id: 'kora', label: 'KoraPay card', sub: 'Visa, Mastercard, Verve', icon: 'card' },
  { id: 'transfer', label: 'Bank transfer', sub: 'Instant NIBSS confirmation', icon: 'bank' },
  { id: 'ussd', label: 'USSD', sub: '*737# and friends', icon: 'phone' },
];

function planCard(plan, active) {
  return `
  <button type="button" class="cs-plan${plan.featured ? ' cs-plan--featured' : ''}${active ? ' is-active' : ''}" data-plan="${plan.id}">
    <div class="cs-row cs-row--between">
      <strong style="font-size:13px">${esc(plan.name)}</strong>
      ${plan.featured ? '<span class="cs-pill cs-pill--mint cs-pill--sm">Most chosen</span>' : active ? '<span class="cs-pill cs-pill--outline cs-pill--sm">Selected</span>' : ''}
    </div>
    <div class="cs-plan__price"><strong>₦${plan.price.toLocaleString('en-NG')}</strong><span>${esc(plan.period)}</span></div>
    <p class="cs-help"${plan.featured ? ' style="color:rgba(234,255,242,.8)"' : ''}>${esc(plan.blurb)}</p>
    <div class="cs-plan__list">${plan.perks.map((perk) => `<span><i>✓</i>${esc(perk)}</span>`).join('')}</div>
  </button>`;
}

export function render(ctx) {
  const state = ctx.state;
  const active = PLANS.find((plan) => plan.id === state.plan.tier) || PLANS[1];
  return `
  <div class="cs-stack">
    <section class="cs-pagehead">
      <div class="cs-pagehead__row">
        <span class="cs-ico-tile cs-ico-tile--ochre">${icon('card')}</span>
        <div class="cs-col cs-grow" style="gap:1px">
          <h2 class="cs-h2">Choose your pass</h2>
          <span class="cs-help">${esc(state.user.familyName)} • renews ${esc(state.plan.renews)}</span>
        </div>
      </div>
    </section>

    <div class="cs-grid cs-grid--3">
      ${PLANS.map((plan) => planCard(plan, plan.id === active.id)).join('')}
    </div>

    <section class="cs-card">
      <div class="cs-card__head"><h3 class="cs-card__title">${icon('wallet')} Payment channel</h3></div>
      <div class="cs-channels">
        ${CHANNELS.map((channel) => `<button type="button" class="cs-channel${state.plan.channel === channel.id ? ' is-active' : ''}" data-channel="${channel.id}">
          <i>${icon(channel.icon)}</i>
          <span>${esc(channel.label)}</span>
        </button>`).join('')}
      </div>
      <p class="cs-help" style="margin-top:8px">${esc(CHANNELS.find((channel) => channel.id === state.plan.channel)?.sub || '')}</p>
    </section>

    <section class="cs-summary">
      <div class="cs-summary__row"><span>${esc(active.name)}</span><b>₦${active.price.toLocaleString('en-NG')}</b></div>
      <div class="cs-summary__row"><span>Learners on pass</span><b>${state.children.length}</b></div>
      <div class="cs-summary__row"><span>Mentor credits</span><b>2 per term</b></div>
      <div class="cs-summary__row"><span>VAT (7.5%)</span><b>₦${Math.round(active.price * 0.075).toLocaleString('en-NG')}</b></div>
      <div class="cs-summary__row cs-summary__row--total"><span>Total due today</span><b>₦${Math.round(active.price * 1.075).toLocaleString('en-NG')}</b></div>
    </section>

    <div class="cs-escrow">
      ${icon('lock')} KoraPay 256-Bit Escrow Secured
    </div>
    <p class="cs-help cs-center">Funds release to Idilewa only after your first live mentor session — cancel within 14 days for a full refund. Card details are entered on KoraPay’s PCI-DSS page; we never store them.</p>

    <button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-pay>
      ${icon('lock')} Pay ₦${Math.round(active.price * 1.075).toLocaleString('en-NG')} with ${esc(CHANNELS.find((channel) => channel.id === state.plan.channel)?.label || 'KoraPay card')}
    </button>
    <p class="cs-help cs-center">Card details are entered on KoraPay’s PCI-DSS page. Idilewa never stores them.</p>
  </div>`;
}

export function mount(root, ctx) {
  root.addEventListener('click', async (event) => {
    const plan = event.target.closest('[data-plan]');
    if (plan) {
      const chosen = PLANS.find((entry) => entry.id === plan.dataset.plan);
      if (!chosen) return;
      await ctx.store.patch({ plan: { tier: chosen.id, price: chosen.price, period: chosen.period } });
      ctx.toast(`${chosen.name} selected — ₦${chosen.price.toLocaleString('en-NG')}.`);
      ctx.rerender();
      return;
    }

    const channel = event.target.closest('[data-channel]');
    if (channel) {
      await ctx.store.patch({ plan: { channel: channel.dataset.channel } });
      ctx.toast(`Paying with ${CHANNELS.find((entry) => entry.id === channel.dataset.channel)?.label}.`);
      ctx.rerender();
      return;
    }

    if (event.target.closest('[data-pay]')) {
      const tier = PLANS.find((entry) => entry.id === ctx.state.plan.tier) || PLANS[1];
      const total = Math.round(tier.price * 1.075);
      ctx.modal({
        title: 'Confirm payment',
        body: `<div class="cs-col" style="gap:9px">
          <div class="cs-summary__row"><span>Pass</span><strong>${esc(tier.name)}</strong></div>
          <div class="cs-summary__row"><span>Total</span><strong>₦${total.toLocaleString('en-NG')}</strong></div>
          <div class="cs-summary__row"><span>Channel</span><strong>${esc(CHANNELS.find((entry) => entry.id === ctx.state.plan.channel)?.label || 'KoraPay card')}</strong></div>
          <label class="cs-field"><span class="cs-label">Six-digit family passcode</span><input class="cs-input" inputmode="numeric" maxlength="6" data-pay-passcode placeholder="••••••" /></label>
          <p class="cs-help">The passcode is required so a child cannot charge the family card.</p>
        </div>`,
        actions: `<button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-pay-confirm>${icon('lock')} Pay ₦${total.toLocaleString('en-NG')}</button>
          <button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-close>Cancel</button>`,
        onMount: (wrap, close) => {
          const input = wrap.querySelector('[data-pay-passcode]');
          input?.focus();
          wrap.querySelector('[data-pay-confirm]')?.addEventListener('click', async () => {
            const code = input.value.replace(/\D/g, '');
            if (code.length !== 6) {
              ctx.toast('Enter the full six-digit passcode.', { tone: 'error' });
              return;
            }
            close();
            await ctx.store.patch({
              plan: { tier: tier.id, price: tier.price, period: tier.period, renews: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) },
            });
            ctx.modal({
              title: 'Payment held in escrow',
              body: `<div class="cs-col" style="gap:8px">
                <p class="cs-help">₦${total.toLocaleString('en-NG')} is held by KoraPay. Your pass unlocks the moment the transfer settles — usually under 30 seconds.</p>
                <div class="cs-summary__row"><span>Reference</span><strong>IDL-${code.slice(0, 4)}-${Date.now().toString().slice(-4)}</strong></div>
              </div>`,
              actions: `<button type="button" class="cs-btn cs-btn--primary cs-btn--block" data-close>Back to studio</button>`,
            });
            ctx.toast('Pass active — happy learning!');
          });
        },
      });
    }
  });
}


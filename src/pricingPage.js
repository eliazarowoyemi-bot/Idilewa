import { BILLING_CATALOG, formatNaira } from './billingCatalog.js';

const periods = {
  monthly: { label: 'month', button: document.getElementById('monthly') },
  yearly: { label: 'year', button: document.getElementById('yearly') },
};

function setBillingPeriod(period) {
  const selected = periods[period];
  if (!selected) return;

  for (const [key, config] of Object.entries(periods)) {
    const active = key === period;
    config.button.classList.toggle('active', active);
    config.button.setAttribute('aria-pressed', String(active));
  }

  document.querySelectorAll('.price[data-plan]').forEach((element) => {
    const plan = BILLING_CATALOG[element.dataset.plan];
    if (!plan) return;
    const amount = formatNaira(plan.pricesKobo[period]);
    element.replaceChildren(document.createTextNode(amount));
    const suffix = document.createElement('small');
    suffix.textContent = `/ ${selected.label}`;
    element.append(' ', suffix);
  });

  document.querySelectorAll('.plan-link[data-plan]').forEach((link) => {
    const destination = new URL('/payment.html', window.location.origin);
    destination.searchParams.set('plan', link.dataset.plan);
    destination.searchParams.set('billing', period);
    link.href = `${destination.pathname}${destination.search}`;
  });

  const freeLink = document.querySelector('.card .btn[href^="/kids-signup"]');
  if (freeLink) {
    const destination = new URL('/kids-signup.html', window.location.origin);
    destination.searchParams.set('plan', 'free');
    destination.searchParams.set('billing', period);
    freeLink.href = `${destination.pathname}${destination.search}`;
  }
}

periods.monthly.button.addEventListener('click', () => setBillingPeriod('monthly'));
periods.yearly.button.addEventListener('click', () => setBillingPeriod('yearly'));

const initialPeriod = new URLSearchParams(window.location.search).get('billing') === 'yearly'
  ? 'yearly'
  : 'monthly';
setBillingPeriod(initialPeriod);

export const BILLING_CATALOG = Object.freeze({
  free: Object.freeze({
    id: 'free',
    name: 'Free Plan',
    profileLimit: 1,
    pricesKobo: Object.freeze({ monthly: 0, yearly: 0 }),
  }),
  premium: Object.freeze({
    id: 'premium',
    name: 'Premium Plan',
    profileLimit: 1,
    pricesKobo: Object.freeze({ monthly: 150_000, yearly: 1_800_000 }),
  }),
  family: Object.freeze({
    id: 'family',
    name: 'Family Plan',
    profileLimit: 4,
    pricesKobo: Object.freeze({ monthly: 300_000, yearly: 3_600_000 }),
  }),
});

export const BILLING_PERIODS = Object.freeze(['monthly', 'yearly']);

export function getPlanQuote(planId, billingPeriod) {
  const plan = BILLING_CATALOG[planId];
  if (!plan || !BILLING_PERIODS.includes(billingPeriod)) return null;

  return {
    planId: plan.id,
    planName: plan.name,
    billingPeriod,
    amountKobo: plan.pricesKobo[billingPeriod],
    currency: 'NGN',
    profileLimit: plan.profileLimit,
  };
}

export function formatNaira(amountKobo) {
  if (!Number.isSafeInteger(amountKobo) || amountKobo < 0) {
    throw new TypeError('An amount in kobo must be a non-negative safe integer.');
  }
  return `₦${new Intl.NumberFormat('en-NG').format(amountKobo / 100)}`;
}

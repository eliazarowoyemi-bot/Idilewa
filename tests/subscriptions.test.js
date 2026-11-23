import assert from 'node:assert/strict';
import test from 'node:test';
import { formatNaira, getPlanQuote } from '../src/billingCatalog.js';
import { validateChildRegistration } from '../src/server/childRegistration.js';
import {
  validatePaidPlan,
  verifyCompletedStripeSession,
} from '../src/server/billing.js';
import { GuardianConsentError } from '../src/server/guardianConsent.js';

test('server and page billing catalog prices are expressed in kobo', () => {
  assert.equal(getPlanQuote('premium', 'monthly').amountKobo, 150_000);
  assert.equal(getPlanQuote('premium', 'yearly').amountKobo, 1_800_000);
  assert.equal(getPlanQuote('family', 'monthly').amountKobo, 300_000);
  assert.equal(getPlanQuote('family', 'yearly').amountKobo, 3_600_000);
  assert.equal(formatNaira(150_000), '₦1,500');
  assert.throws(() => validatePaidPlan('free', 'monthly'), GuardianConsentError);
  assert.equal(validatePaidPlan('family', 'yearly').amountKobo, 3_600_000);
});

test('child registration requires matching parent identity and valid consent choices', () => {
  const input = {
    childName: 'Ayo',
    ageGroup: '6_8',
    gender: null,
    avatar: 'a1',
    languages: ['yoruba'],
    interests: ['stories'],
    parentName: 'Parent Example',
    parentEmail: 'PARENT@example.com',
    relationship: 'parent',
    consent: true,
    marketingOptIn: false,
  };
  assert.equal(validateChildRegistration(input, 'parent@example.com').childName, 'Ayo');
  assert.throws(() => validateChildRegistration(input, 'different@example.com'), GuardianConsentError);
  assert.throws(
    () => validateChildRegistration({ ...input, consent: false }, 'parent@example.com'),
    GuardianConsentError,
  );
  assert.throws(
    () => validateChildRegistration({ ...input, languages: ['unknown'] }, 'parent@example.com'),
    GuardianConsentError,
  );
});

test('checkout verification rejects any owner, plan, amount, or payment mismatch', () => {
  const attempt = {
    id: 'attempt-1',
    parent_user_id: 'parent-1',
    plan: 'premium',
    billing_period: 'monthly',
    amount_kobo: 150_000,
    stripe_checkout_session_id: 'cs_test_checkout',
  };
  const session = {
    id: attempt.stripe_checkout_session_id,
    mode: 'subscription',
    status: 'complete',
    payment_status: 'paid',
    currency: 'ngn',
    amount_total: attempt.amount_kobo,
    metadata: {
      payment_attempt_id: attempt.id,
      parent_user_id: attempt.parent_user_id,
      plan_id: attempt.plan,
      billing_period: attempt.billing_period,
      amount_kobo: String(attempt.amount_kobo),
    },
    subscription: 'sub_test_subscription',
  };
  assert.equal(verifyCompletedStripeSession(session, attempt), 'sub_test_subscription');
  assert.throws(
    () => verifyCompletedStripeSession({ ...session, amount_total: 1 }, attempt),
    GuardianConsentError,
  );
  assert.throws(
    () => verifyCompletedStripeSession({
      ...session,
      metadata: { ...session.metadata, parent_user_id: 'another-parent' },
    }, attempt),
    GuardianConsentError,
  );
});

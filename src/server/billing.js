import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { getPlanQuote } from '../billingCatalog.js';
import {
  createGuardianAdmin,
  getProductionOrigin,
  GuardianConsentError,
  readJsonBody,
  sendGuardianEmail,
} from './guardianConsent.js';
import {
  requireAuthenticatedProfile,
  sendApiFailure,
  sendApiJson,
} from './authenticatedRequest.js';

const STRIPE_SECRET_KEY_PATTERN = /^sk_(test|live)_[A-Za-z0-9]+$/;
const STRIPE_SESSION_ID_PATTERN = /^cs_(test_|live_)?[A-Za-z0-9]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !STRIPE_SECRET_KEY_PATTERN.test(secretKey)) {
    throw new GuardianConsentError(503, 'Secure checkout is not configured. Please try again later.');
  }
  return new Stripe(secretKey, { timeout: 10_000, maxNetworkRetries: 1 });
}

export function validatePaidPlan(planId, billingPeriod) {
  const quote = getPlanQuote(planId, billingPeriod);
  if (!quote || planId === 'free' || quote.amountKobo <= 0) {
    throw new GuardianConsentError(400, 'Choose a valid paid plan and billing cycle.');
  }
  return quote;
}

export function verifyCompletedStripeSession(session, attempt) {
  if (!session || session.mode !== 'subscription'
    || session.status !== 'complete'
    || session.payment_status !== 'paid'
    || session.currency?.toLowerCase() !== 'ngn'
    || session.amount_total !== attempt.amount_kobo
    || session.id !== attempt.stripe_checkout_session_id
    || session.metadata?.payment_attempt_id !== attempt.id
    || session.metadata?.parent_user_id !== attempt.parent_user_id
    || session.metadata?.plan_id !== attempt.plan
    || session.metadata?.billing_period !== attempt.billing_period
    || session.metadata?.amount_kobo !== String(attempt.amount_kobo)) {
    throw new GuardianConsentError(409, 'Stripe has not confirmed the expected payment. Your subscription is not active.');
  }
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  if (!subscriptionId) {
    throw new GuardianConsentError(409, 'Stripe has not confirmed a subscription for this payment.');
  }
  return subscriptionId;
}

function readQuery(req, key) {
  if (typeof req.query?.[key] === 'string') return req.query[key];
  return new URL(req.url || '/', 'https://idilewa.local').searchParams.get(key) || '';
}

async function findOpenAttempt(admin, parentUserId) {
  const { data, error } = await admin.from('payments')
    .select('id,parent_user_id,plan,billing_period,amount_kobo,currency,status,stripe_checkout_session_id,stripe_subscription_id,receipt_status')
    .eq('parent_user_id', parentUserId)
    .in('status', ['creating', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new GuardianConsentError(503, 'Your existing checkout could not be checked.');
  return data;
}

async function createStripeCheckout(stripe, attempt, quote, origin, parentEmail) {
  const metadata = {
    payment_attempt_id: attempt.id,
    parent_user_id: attempt.parent_user_id,
    plan_id: quote.planId,
    billing_period: quote.billingPeriod,
    amount_kobo: String(quote.amountKobo),
  };
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'ngn',
        unit_amount: quote.amountKobo,
        recurring: { interval: quote.billingPeriod === 'yearly' ? 'year' : 'month' },
        product_data: { name: quote.planName },
      },
    }],
    customer_email: parentEmail,
    client_reference_id: attempt.parent_user_id,
    metadata,
    subscription_data: { metadata },
    allow_promotion_codes: false,
    success_url: `${origin}/payment.html?plan=${quote.planId}&billing=${quote.billingPeriod}&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payment.html?plan=${quote.planId}&billing=${quote.billingPeriod}&checkout=cancelled`,
  }, { idempotencyKey: `idilewa-checkout-${attempt.id}` });

  if (!session.id || !session.url || !/^https:\/\/checkout\.stripe\.com\//.test(session.url)) {
    throw new GuardianConsentError(502, 'Stripe did not return a valid secure checkout page.');
  }
  const { error } = await attempt.admin.from('payments')
    .update({
      stripe_checkout_session_id: session.id,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', attempt.id);
  if (error) throw new GuardianConsentError(503, 'The checkout session could not be saved. Retry safely to continue.');
  return { url: session.url };
}

export async function checkoutHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = readJsonBody(req);
    const quote = validatePaidPlan(body.plan, body.billingPeriod);
    const { admin, profile } = await requireAuthenticatedProfile(req, ['parent']);
    const origin = getProductionOrigin();
    const stripe = createStripeClient();
    let attempt = await findOpenAttempt(admin, profile.id);

    if (attempt) {
      if (attempt.plan !== quote.planId || attempt.billing_period !== quote.billingPeriod) {
        throw new GuardianConsentError(409, 'You already have a checkout in progress. Finish or close that checkout before choosing another plan.');
      }
      if (attempt.status === 'pending' && attempt.stripe_checkout_session_id) {
        const existing = await stripe.checkout.sessions.retrieve(attempt.stripe_checkout_session_id);
        if (existing.status === 'open' && existing.url) {
          return sendApiJson(res, 200, { url: existing.url });
        }
        if (existing.status === 'complete') {
          throw new GuardianConsentError(409, 'This payment is being verified. Refresh the page in a moment.');
        }
        const { error } = await admin.from('payments')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', attempt.id);
        if (error) throw new GuardianConsentError(503, 'The previous checkout could not be closed.');
        attempt = null;
      }
    }

    if (!attempt) {
      const { data, error } = await admin.from('payments').insert({
        parent_user_id: profile.id,
        plan: quote.planId,
        billing_period: quote.billingPeriod,
        amount_kobo: quote.amountKobo,
        currency: 'ngn',
        idempotency_key: randomUUID(),
        status: 'creating',
      }).select('id,parent_user_id,plan,billing_period,amount_kobo,status').single();
      if (error || !data) {
        const existing = await findOpenAttempt(admin, profile.id);
        if (existing?.plan === quote.planId && existing.billing_period === quote.billingPeriod) {
          attempt = existing;
        } else {
          throw new GuardianConsentError(409, 'A checkout is already being prepared. Refresh the page and continue it.');
        }
      } else {
        attempt = { ...data, admin };
      }
    }

    return sendApiJson(res, 200, await createStripeCheckout(stripe, { ...attempt, admin }, quote, origin, profile.email));
  } catch (error) {
    return sendApiFailure(res, error, 'payments/checkout');
  }
}

export async function quoteHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const quote = validatePaidPlan(readQuery(req, 'plan'), readQuery(req, 'billing'));
    return sendApiJson(res, 200, quote);
  } catch (error) {
    return sendApiFailure(res, error, 'payments/quote');
  }
}

function dateFromUnixSeconds(value) {
  return Number.isInteger(value) && value > 0 ? new Date(value * 1_000).toISOString() : null;
}

function getSubscriptionPeriod(subscription) {
  const item = subscription.items?.data?.[0];
  return {
    current_period_start: dateFromUnixSeconds(item?.current_period_start ?? subscription.current_period_start),
    current_period_end: dateFromUnixSeconds(item?.current_period_end ?? subscription.current_period_end),
  };
}

async function saveStripeSubscription(admin, subscription, attempt) {
  const { current_period_start, current_period_end } = getSubscriptionPeriod(subscription);
  const record = {
    parent_user_id: attempt.parent_user_id,
    plan: attempt.plan,
    billing_period: attempt.billing_period,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    status: subscription.status,
    current_period_start,
    current_period_end,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from('subscriptions')
    .upsert(record, { onConflict: 'stripe_subscription_id' });
  if (error) throw new GuardianConsentError(503, 'The verified subscription could not be saved.');
  return record;
}

async function sendPaymentReceipt(admin, attempt, subscriptionId) {
  const { data: claim, error: claimError } = await admin.from('payments')
    .update({ receipt_status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', attempt.id)
    .eq('receipt_status', 'pending')
    .select('id')
    .maybeSingle();
  if (claimError) {
    console.error('[payments] Receipt delivery could not be claimed.');
    return false;
  }
  if (!claim) {
    const { data: receipt, error } = await admin.from('payments')
      .select('receipt_status')
      .eq('id', attempt.id)
      .maybeSingle();
    return !error && receipt?.receipt_status === 'sent';
  }

  let delivered = false;
  try {
    const { data: parent, error: parentError } = await admin.from('profiles')
      .select('email,name')
      .eq('id', attempt.parent_user_id)
      .eq('role', 'parent')
      .maybeSingle();
    if (parentError || !parent?.email) throw new GuardianConsentError(503, 'The receipt recipient could not be loaded.');

    await sendGuardianEmail({
      to: parent.email,
      subject: 'Your Idilewa subscription is confirmed',
      text: `Your ${attempt.plan} subscription is active. Stripe subscription reference: ${subscriptionId}.`,
      html: `<p>Hello ${String(parent.name || 'Parent').replace(/[&<>"']/g, '')},</p><p>Your ${attempt.plan} subscription is active. Your receipt and payment details are available in your Stripe-hosted checkout confirmation.</p>`,
    });
    delivered = true;
  } catch {
    console.error('[payments] Subscription is active, but receipt email delivery failed.');
  }

  const { error } = await admin.from('payments')
    .update({
      receipt_status: delivered ? 'sent' : 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', attempt.id);
  if (error) console.error('[payments] Receipt delivery status could not be saved.');
  return delivered;
}

async function persistCompletedSession(admin, stripe, session) {
  const attemptId = session.metadata?.payment_attempt_id;
  if (typeof attemptId !== 'string' || !UUID_PATTERN.test(attemptId)) {
    throw new GuardianConsentError(400, 'The Stripe session is not associated with a valid checkout.');
  }
  const { data: attempt, error } = await admin.from('payments')
    .select('id,parent_user_id,plan,billing_period,amount_kobo,currency,status,stripe_checkout_session_id,receipt_status')
    .eq('id', attemptId)
    .maybeSingle();
  if (error || !attempt) throw new GuardianConsentError(503, 'The payment record could not be verified.');
  if (attempt.stripe_checkout_session_id && attempt.stripe_checkout_session_id !== session.id) {
    throw new GuardianConsentError(409, 'This Stripe session does not match the saved payment.');
  }

  const verifiedAttempt = { ...attempt, stripe_checkout_session_id: session.id };
  const subscriptionId = verifyCompletedStripeSession(session, verifiedAttempt);
  const subscription = typeof session.subscription === 'object'
    ? session.subscription
    : await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    const { error: pendingError } = await admin.from('payments')
      .update({
        stripe_checkout_session_id: session.id,
        stripe_subscription_id: subscriptionId,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', attempt.id);
    if (pendingError) throw new GuardianConsentError(503, 'The payment status could not be saved.');
    return { status: 'pending', attempt, subscriptionId };
  }

  await saveStripeSubscription(admin, subscription, attempt);
  const { error: paymentError } = await admin.from('payments')
    .update({
      stripe_checkout_session_id: session.id,
      stripe_subscription_id: subscriptionId,
      status: 'succeeded',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', attempt.id);
  if (paymentError) throw new GuardianConsentError(503, 'The verified payment could not be saved.');
  const receiptSent = await sendPaymentReceipt(admin, attempt, subscriptionId);
  return { status: 'paid', attempt, subscriptionId, receiptSent };
}

export async function verifyHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = readJsonBody(req);
    if (typeof body.sessionId !== 'string' || !STRIPE_SESSION_ID_PATTERN.test(body.sessionId)) {
      throw new GuardianConsentError(400, 'A valid Stripe checkout session is required.');
    }
    const { admin, profile } = await requireAuthenticatedProfile(req, ['parent']);
    const { data: attempt, error } = await admin.from('payments')
      .select('id,parent_user_id,plan,billing_period,amount_kobo,currency,status,stripe_checkout_session_id,receipt_status')
      .eq('parent_user_id', profile.id)
      .eq('stripe_checkout_session_id', body.sessionId)
      .maybeSingle();
    if (error || !attempt) throw new GuardianConsentError(404, 'This checkout does not belong to your parent account.');

    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    const result = await persistCompletedSession(admin, stripe, session);
    return sendApiJson(res, 200, {
      status: result.status,
      plan: attempt.plan,
      billingPeriod: attempt.billing_period,
      amountKobo: attempt.amount_kobo,
      ...(result.status === 'paid' ? { receiptSent: result.receiptSent } : {}),
    });
  } catch (error) {
    return sendApiFailure(res, error, 'payments/verify');
  }
}

async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object') {
    throw new GuardianConsentError(400, 'The webhook must be delivered as an unparsed request body.');
  }

  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > 1_000_000) throw new GuardianConsentError(413, 'The webhook payload is too large.');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function stripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !secret.startsWith('whsec_')) {
    throw new GuardianConsentError(503, 'Stripe webhook verification is not configured.');
  }
  return secret;
}

async function storeWebhookEvent(admin, event) {
  const { error } = await admin.from('billing_webhook_events')
    .insert({ event_id: event.id, event_type: event.type, processed_at: new Date().toISOString() });
  if (error?.code === '23505') return;
  if (error) throw new GuardianConsentError(503, 'The verified payment event could not be recorded.');
}

async function processStripeEvent(admin, stripe, event) {
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = await stripe.checkout.sessions.retrieve(event.data.object.id);
    await persistCompletedSession(admin, stripe, session);
    return;
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;
    const attemptId = session.metadata?.payment_attempt_id;
    if (!UUID_PATTERN.test(attemptId || '')) throw new GuardianConsentError(400, 'The Stripe event has no valid payment record.');
    const { error } = await admin.from('payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', attemptId)
      .eq('stripe_checkout_session_id', session.id);
    if (error) throw new GuardianConsentError(503, 'The failed payment status could not be saved.');
    return;
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const { error } = await admin.from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: getSubscriptionPeriod(subscription).current_period_start,
        current_period_end: getSubscriptionPeriod(subscription).current_period_end,
        cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);
    if (error) throw new GuardianConsentError(503, 'The subscription update could not be saved.');
    return;
  }

  if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id
        || invoice.parent?.subscription_details?.subscription;
    if (typeof subscriptionId !== 'string') return;

    const { data: existingSubscription, error: lookupError } = await admin.from('subscriptions')
      .select('parent_user_id,plan,billing_period')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();
    if (lookupError) throw new GuardianConsentError(503, 'The subscription could not be loaded for its billing event.');

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (existingSubscription) {
      await saveStripeSubscription(admin, subscription, existingSubscription);
    }
    if (event.type === 'invoice.payment_failed') {
      const { error } = await admin.from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscriptionId);
      if (error) throw new GuardianConsentError(503, 'The failed renewal status could not be saved.');
      return;
    }
    if (!existingSubscription) return;

    const amountKobo = Number(invoice.amount_paid);
    if (invoice.currency?.toLowerCase() !== 'ngn' || !Number.isSafeInteger(amountKobo) || amountKobo < 0) {
      throw new GuardianConsentError(409, 'The renewal amount or currency did not match the subscription.');
    }
    if (amountKobo > 0) {
      const { error } = await admin.from('payments').upsert({
        parent_user_id: existingSubscription.parent_user_id,
        plan: existingSubscription.plan,
        billing_period: existingSubscription.billing_period,
        amount_kobo: amountKobo,
        currency: 'ngn',
        stripe_subscription_id: subscriptionId,
        stripe_invoice_id: invoice.id,
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      }, { onConflict: 'stripe_invoice_id' });
      if (error) throw new GuardianConsentError(503, 'The renewal payment could not be recorded.');
    }
    if (amountKobo > 0) {
      const { data: payment, error: paymentError } = await admin.from('payments')
        .select('id,parent_user_id,receipt_status')
        .eq('stripe_invoice_id', invoice.id)
        .maybeSingle();
      if (paymentError || !payment) throw new GuardianConsentError(503, 'The renewal receipt could not be prepared.');
      await sendPaymentReceipt(admin, payment, subscriptionId);
    }
  }

}

export async function historyHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { admin, profile } = await requireAuthenticatedProfile(req, ['parent']);
    const [
      { data: subscriptions, error: subscriptionError },
      { data: payments, error: paymentError },
    ] = await Promise.all([
      admin.from('subscriptions')
        .select('id,plan,billing_period,status,current_period_start,current_period_end,cancel_at_period_end,created_at')
        .eq('parent_user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      admin.from('payments')
        .select('id,plan,billing_period,amount_kobo,currency,status,receipt_status,paid_at,created_at')
        .eq('parent_user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);
    if (subscriptionError || paymentError) {
      throw new GuardianConsentError(503, 'Your subscription history could not be loaded.');
    }
    return sendApiJson(res, 200, { subscriptions: subscriptions || [], payments: payments || [] });
  } catch (error) {
    return sendApiFailure(res, error, 'payments/history');
  }
}

export async function cancelSubscriptionHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = readJsonBody(req);
    if (typeof body.subscriptionId !== 'string' || !UUID_PATTERN.test(body.subscriptionId)) {
      throw new GuardianConsentError(400, 'Choose a valid subscription to cancel.');
    }
    const { admin, profile } = await requireAuthenticatedProfile(req, ['parent']);
    const { data: subscription, error } = await admin.from('subscriptions')
      .select('id,stripe_subscription_id,status,cancel_at_period_end')
      .eq('id', body.subscriptionId)
      .eq('parent_user_id', profile.id)
      .maybeSingle();
    if (error || !subscription) throw new GuardianConsentError(404, 'That subscription was not found.');
    if (subscription.cancel_at_period_end) {
      return sendApiJson(res, 200, { message: 'Your subscription is already set to end at the current billing date.' });
    }
    if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
      throw new GuardianConsentError(409, 'This subscription can no longer be cancelled.');
    }

    const stripe = createStripeClient();
    const providerSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    if (providerSubscription.metadata?.parent_user_id !== profile.id) {
      throw new GuardianConsentError(403, 'This subscription does not belong to your parent account.');
    }
    const updated = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    const { error: updateError } = await admin.from('subscriptions')
      .update({
        status: updated.status,
        cancel_at_period_end: true,
        current_period_end: getSubscriptionPeriod(updated).current_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)
      .eq('parent_user_id', profile.id);
    if (updateError) throw new GuardianConsentError(503, 'Cancellation was accepted, but its status could not be saved.');
    return sendApiJson(res, 200, {
      message: 'Your subscription will remain active until the end of the current billing period.',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: getSubscriptionPeriod(updated).current_period_end,
    });
  } catch (error) {
    return sendApiFailure(res, error, 'payments/cancel');
  }
}

export async function webhookHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const signature = req.headers?.['stripe-signature'];
    if (typeof signature !== 'string') throw new GuardianConsentError(400, 'The Stripe signature is missing.');
    const stripe = createStripeClient();
    const rawBody = await readRawBody(req);
    const webhookSecret = stripeWebhookSecret();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new GuardianConsentError(400, 'The Stripe webhook signature is invalid.');
    }

    const admin = createGuardianAdmin();
    const { data: processed, error: eventError } = await admin.from('billing_webhook_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle();
    if (eventError) throw new GuardianConsentError(503, 'The Stripe event status could not be checked.');
    if (processed) return sendApiJson(res, 200, { received: true, duplicate: true });

    await processStripeEvent(admin, stripe, event);
    await storeWebhookEvent(admin, event);
    return sendApiJson(res, 200, { received: true });
  } catch (error) {
    return sendApiFailure(res, error, 'payments/webhook');
  }
}

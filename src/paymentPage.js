import { formatNaira } from './billingCatalog.js';
import { getCurrentUser, getSessionAccessToken, restoreAuthSession } from './supabaseClient.js';

const params = new URLSearchParams(window.location.search);
const plan = params.get('plan');
const billingPeriod = params.get('billing');
const form = document.getElementById('payForm');
const payButton = document.getElementById('payBtn');
const status = document.getElementById('payStatus');
const authLinks = document.getElementById('authLinks');
let quote;
let sessionReady = false;

function showStatus(message, kind = '') {
  status.textContent = message;
  status.classList.toggle('is-error', kind === 'error');
}

function formatNextDate(billing) {
  if (billing !== 'monthly' && billing !== 'yearly') return 'After checkout';
  return billing === 'monthly' ? 'One month after payment' : 'One year after payment';
}

async function readJson(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.ok
      ? 'The secure checkout service returned an unexpected response.'
      : 'Secure checkout could not be reached. Please try again later.');
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error('The secure checkout service returned an unreadable response. Please try again later.', { cause: error });
  }
}

async function loadQuote() {
  if (!['premium', 'family'].includes(plan) || !['monthly', 'yearly'].includes(billingPeriod)) {
    throw new Error('Choose a valid paid plan and billing cycle from the pricing page.');
  }
  const response = await fetch(`/api/payments/quote?plan=${encodeURIComponent(plan)}&billing=${encodeURIComponent(billingPeriod)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const result = await readJson(response);
  if (!response.ok) throw new Error(result?.error || 'The selected plan could not be confirmed.');
  if (result?.planId !== plan || result?.billingPeriod !== billingPeriod
    || !Number.isSafeInteger(result?.amountKobo) || result.amountKobo <= 0
    || result.currency !== 'NGN') {
    throw new Error('The server returned an invalid subscription quote.');
  }

  quote = result;
  document.getElementById('planName').textContent = result.planName;
  document.getElementById('billingText').textContent = `${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'} subscription`;
  document.getElementById('cycle').textContent = billingPeriod === 'yearly' ? 'Yearly' : 'Monthly';
  document.getElementById('nextDate').textContent = formatNextDate(billingPeriod);
  document.getElementById('profiles').textContent = result.profileLimit === 4 ? 'Up to 4 profiles' : '1 profile';
  document.getElementById('summaryPrice').textContent = formatNaira(result.amountKobo);
  document.getElementById('total').textContent = formatNaira(result.amountKobo);
}

function requireParentSignIn() {
  const user = getCurrentUser();
  const isParent = user?.role === 'parent';
  authLinks.hidden = isParent;
  payButton.disabled = !quote || !sessionReady || !isParent;
  if (!isParent) {
    showStatus('Sign in to a verified parent account before starting checkout.', 'error');
    return false;
  }
  return true;
}

async function verifyReturn(sessionId) {
  showStatus('Verifying your payment with Stripe…');
  const token = await getSessionAccessToken();
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ sessionId }),
    cache: 'no-store',
  });
  const result = await readJson(response);
  if (!response.ok) throw new Error(result?.error || 'Stripe could not verify this payment.');
  if (result.status === 'paid') {
    showStatus('Payment confirmed. Your subscription is active. Continue to your family dashboard to set up a child profile.');
    const link = document.createElement('a');
    link.href = '/parents.html#/parent-dashboard';
    link.textContent = ' Open family dashboard';
    status.append(link);
  } else {
    showStatus('Payment is not confirmed yet. Your subscription has not been activated. You can retry checkout when the payment status updates.', 'error');
  }
}

async function initialize() {
  const checkoutState = params.get('checkout');
  const sessionId = params.get('session_id');
  try {
    await loadQuote();
    await restoreAuthSession();
    sessionReady = true;
    requireParentSignIn();

    if (checkoutState === 'success' && sessionId) {
      await verifyReturn(sessionId);
    } else if (checkoutState === 'cancelled') {
      showStatus('Checkout was cancelled. No subscription was activated.');
    } else if (!getCurrentUser() || getCurrentUser()?.role !== 'parent') {
      showStatus('Sign in to a verified parent account before starting checkout.', 'error');
    } else {
      showStatus('');
    }
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'Checkout could not be prepared. Please try again.', 'error');
    payButton.disabled = true;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireParentSignIn()) return;

  payButton.disabled = true;
  payButton.textContent = 'Connecting to Stripe…';
  showStatus('Preparing your secure checkout…');
  try {
    const token = await getSessionAccessToken();
    const response = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ plan, billingPeriod }),
      cache: 'no-store',
    });
    const result = await readJson(response);
    if (!response.ok) throw new Error(result?.error || 'Secure checkout could not be started.');

    const checkoutUrl = new URL(result.url);
    if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com') {
      throw new Error('The payment provider returned an unexpected checkout address.');
    }
    window.location.assign(checkoutUrl.href);
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'Checkout could not be started. Please try again.', 'error');
    payButton.disabled = false;
    payButton.textContent = 'Continue to secure checkout';
  }
});

void initialize();

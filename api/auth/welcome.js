import { createClient } from '@supabase/supabase-js';
import handleAuthEmailCode from '../../src/server/authEmailCode.js';
import handleAuthActivity from '../../src/server/authActivity.js';
import { createWelcomeEmail } from '../../src/server/welcomeEmail.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const config = { maxDuration: 15 };

function sendJson(res, statusCode, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(statusCode).json(body);
}

function readUserId(req) {
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > 1_024) return null;
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return null;
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const userId = body.userId;
  return typeof userId === 'string' && USER_ID_PATTERN.test(userId) ? userId : null;
}

function getConfiguredOrigin() {
  const value = process.env.APP_BASE_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

async function completeGoogleParentSignup(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }
  const match = typeof req.headers?.authorization === 'string'
    ? /^Bearer\s+(\S+)$/i.exec(req.headers.authorization)
    : null;
  if (!match || match[1].length > 4096) {
    return sendJson(res, 401, { error: 'Sign in with Google before completing parent registration.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL
    || process.env.SUPABASE_PUBLIC_URL
    || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return sendJson(res, 503, { error: 'Google parent registration is not configured yet.' });
  }

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await admin.auth.getUser(match[1]);
    const user = authData?.user;
    if (authError || !user) {
      return sendJson(res, 401, { error: 'Your Google session could not be verified. Sign in again.' });
    }
    const providers = user.app_metadata?.providers;
    if (!Array.isArray(providers) || !providers.includes('google')
      || !user.email_confirmed_at || !user.email) {
      return sendJson(res, 403, { error: 'Use a verified Google account to complete parent registration.' });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      console.error('[auth/welcome] Parent Google signup profile lookup failed.', {
        code: profileError.code,
      });
      return sendJson(res, 503, { error: 'Your account profile could not be verified.' });
    }
    if (!profile) {
      return sendJson(res, 409, { error: 'Your Google account profile is not ready. Please try again.' });
    }
    if (profile.role === 'parent') return sendJson(res, 200, { role: 'parent' });
    if (profile.role !== 'adult') {
      return sendJson(res, 409, { error: 'This Google account already belongs to a different Idilewa account type.' });
    }

    const { data: updatedProfile, error: updateError } = await admin
      .from('profiles')
      .update({ role: 'parent', updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .eq('role', 'adult')
      .select('role')
      .maybeSingle();
    if (updateError) {
      console.error('[auth/welcome] Parent Google signup role update failed.', {
        code: updateError.code,
      });
      return sendJson(res, 503, { error: 'Your parent account could not be completed. Please try again.' });
    }
    if (updatedProfile?.role === 'parent') return sendJson(res, 200, { role: 'parent' });

    const { data: currentProfile, error: currentProfileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (currentProfileError) {
      console.error('[auth/welcome] Parent Google signup role confirmation failed.', {
        code: currentProfileError.code,
      });
      return sendJson(res, 503, { error: 'Your parent account could not be verified. Please try again.' });
    }
    if (currentProfile?.role === 'parent') return sendJson(res, 200, { role: 'parent' });
    return sendJson(res, 409, { error: 'This Google account already belongs to a different Idilewa account type.' });
  } catch (error) {
    console.error('[auth/welcome] Parent Google signup failed.', error);
    return sendJson(res, 500, { error: 'Google parent signup could not be completed.' });
  }
}

export default async function handler(req, res) {
  if (req.query?.action === 'complete-google-signup') {
    return completeGoogleParentSignup(req, res);
  }
  if (req.query?.action === 'email-code') {
    return handleAuthEmailCode(req, res);
  }
  if (req.query?.action === 'activity') {
    return handleAuthActivity(req, res);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const userId = readUserId(req);
  if (!userId) return sendJson(res, 400, { error: 'A valid new account is required.' });

  const supabaseUrl = process.env.SUPABASE_URL
    || process.env.SUPABASE_PUBLIC_URL
    || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const origin = getConfiguredOrigin();
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !origin
    || !EMAIL_PATTERN.test(from?.match(/<([^<>]+)>$/)?.[1] || from || '')) {
    return sendJson(res, 503, { error: 'Welcome email delivery is not configured yet.' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    if (error.status === 404) {
      return sendJson(res, 410, { error: 'This welcome email request has expired.' });
    }
    console.error('[auth/welcome] Could not verify the new account with Supabase.', {
      status: error.status,
      code: error.code,
    });
    return sendJson(res, 503, { error: 'Welcome email delivery is temporarily unavailable.' });
  }
  if (!data?.user) {
    console.error('[auth/welcome] Supabase returned no account for the requested user ID.');
    return sendJson(res, 503, { error: 'Welcome email delivery is temporarily unavailable.' });
  }

  const user = data.user;
  const createdAt = Date.parse(user.created_at || '');
  const accountAge = Date.now() - createdAt;
  if (!Number.isFinite(createdAt) || accountAge < -60_000 || accountAge > 15 * 60_000
    || !user.email || !EMAIL_PATTERN.test(user.email)) {
    return sendJson(res, 410, { error: 'This welcome email request has expired.' });
  }

  const name = typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()
    ? user.user_metadata.name.trim().slice(0, 80)
    : user.email.split('@')[0];
  const email = createWelcomeEmail({ name, loginUrl: `${origin}/#/login?mode=signin` });

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `idilewa-welcome-${user.id}`,
      },
      body: JSON.stringify({ from, to: [user.email], ...email }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error('[auth/welcome] Resend request failed.', error);
    return sendJson(res, 502, { error: 'Your account is ready, but the welcome email could not be sent.' });
  }

  if (!response.ok) {
    console.error(`[auth/welcome] Resend rejected the email request (HTTP ${response.status}).`);
    return sendJson(res, 502, { error: 'Your account is ready, but the welcome email could not be sent.' });
  }

  return sendJson(res, 202, { message: 'Welcome email sent.' });
}

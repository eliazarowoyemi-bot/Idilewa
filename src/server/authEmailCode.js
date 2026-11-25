import {
  createGuardianAdmin,
  getClientAddress,
  GuardianConsentError,
  hashGuardianValue,
  normalizeEmail,
  readJsonBody,
  sendGuardianJson,
} from './guardianConsent.js';
import { createAuthCodeEmail } from './authCodeEmail.js';

const PURPOSES = new Set(['recovery']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function enforceEmailCodeLimit(admin, bucket, action, limit, windowSeconds) {
  const { data, error } = await admin.rpc('guardian_rate_limit', {
    p_bucket_hash: hashGuardianValue(`auth_email_code:${action}:${bucket}`),
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new GuardianConsentError(503, 'Email verification is temporarily unavailable.');
  if (data !== true) throw new GuardianConsentError(429, 'Too many code requests. Wait a little before trying again.');
}

function validateRequestBody(body) {
  const email = normalizeEmail(body.email);
  const purpose = body.purpose === 'password-reset' ? 'recovery' : body.purpose;
  if (!PURPOSES.has(purpose)) {
    throw new GuardianConsentError(400, 'Choose a valid email-code request.');
  }
  return { email, purpose };
}

export default async function handleAuthEmailCode(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendGuardianJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { email, purpose } = validateRequestBody(readJsonBody(req));
    const admin = createGuardianAdmin();
    await enforceEmailCodeLimit(admin, email, 'request', 4, 3_600);
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceEmailCodeLimit(admin, clientAddress, 'request_ip', 20, 3_600);
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, role, parent_consent_request_id')
      .eq('email', email)
      .maybeSingle();
    if (profileError) {
      throw new GuardianConsentError(503, 'Email verification is temporarily unavailable.');
    }
    if (!profile?.id) {
      return sendGuardianJson(res, 202, { message: 'If the account exists and needs a code, an email will be sent.' });
    }

    const recipientEmail = email;

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    const user = userData?.user;
    if (userError || !user || user.email?.toLowerCase() !== email) {
      throw new GuardianConsentError(503, 'Email verification is temporarily unavailable.');
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const fromAddress = from?.match(/<([^<>]+)>$/)?.[1] || from || '';
    if (!apiKey || !EMAIL_PATTERN.test(fromAddress)) {
      throw new GuardianConsentError(503, 'Email delivery is not configured yet.');
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: purpose === 'recovery' ? 'recovery' : 'magiclink',
      email,
    });
    const code = linkData?.properties?.email_otp;
    if (linkError || !/^\d{6,8}$/.test(code || '')) {
      console.error('[auth/email-code] Supabase did not generate a valid email code.', {
        status: linkError?.status,
        code: linkError?.code,
      });
      throw new GuardianConsentError(503, 'A code could not be generated. Please try again shortly.');
    }

    const emailContent = createAuthCodeEmail({ code, purpose });
    let response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [recipientEmail], ...emailContent }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      console.error('[auth/email-code] Email provider request failed.', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
      throw new GuardianConsentError(502, 'The code email could not be sent. Please try again shortly.');
    }

    if (!response.ok) {
      let providerCode = '';
      try {
        const result = await response.json();
        providerCode = typeof result?.name === 'string' ? result.name : '';
      } catch {
        providerCode = 'invalid_provider_response';
      }
      console.error('[auth/email-code] Email provider rejected the message.', {
        status: response.status,
        code: providerCode,
      });
      throw new GuardianConsentError(502, 'The code email could not be sent. Please try again shortly.');
    }

    return sendGuardianJson(res, 202, {
      message: 'If the account exists and needs a code, an email will be sent.',
    });
  } catch (error) {
    if (error instanceof GuardianConsentError) {
      return sendGuardianJson(res, error.statusCode, { error: error.message });
    }
    console.error('[auth/email-code] Code email request failed.');
    return sendGuardianJson(res, 500, { error: 'The code email could not be sent. Please try again shortly.' });
  }
}

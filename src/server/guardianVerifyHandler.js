import {
  createGuardianAdmin,
  enforceGuardianRateLimit,
  getClientAddress,
  GuardianConsentError,
  hashGuardianValue,
  normalizeEmail,
  readJsonBody,
  sendGuardianJson,
} from './guardianConsent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendGuardianJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = readJsonBody(req);
    const email = normalizeEmail(body.email);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!/^\d{6}$/.test(code)) {
      throw new GuardianConsentError(400, 'Enter the six-digit code from the approval email.');
    }

    const admin = createGuardianAdmin();
    await enforceGuardianRateLimit(admin, email, 'verify', 5, 900);
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceGuardianRateLimit(admin, clientAddress, 'verify_ip', 20, 900);
    }
    const { data, error } = await admin.rpc('verify_guardian_access_code', {
      p_child_email: email,
      p_code_hash: hashGuardianValue(code),
    });
    if (error) {
      throw new GuardianConsentError(503, 'Guardian code verification is temporarily unavailable.');
    }
    if (typeof data !== 'string' || !/^[0-9a-f-]{36}$/i.test(data)) {
      throw new GuardianConsentError(400, 'That code is invalid, expired, or already used.');
    }
    return sendGuardianJson(res, 200, { approvalId: data });
  } catch (error) {
    if (error instanceof GuardianConsentError) {
      return sendGuardianJson(res, error.statusCode, { error: error.message });
    }
    console.error('[guardian/verify] Code verification failed.');
    return sendGuardianJson(res, 500, { error: 'The code could not be verified.' });
  }
}

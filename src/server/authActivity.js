import {
  createGuardianAdmin,
  enforceGuardianRateLimit,
  getClientAddress,
  getProductionOrigin,
  GuardianConsentError,
  readJsonBody,
  sendGuardianEmail,
  sendGuardianJson,
} from './guardianConsent.js';
import { createAuthActivityEmail } from './authActivityEmail.js';

function readBearerToken(req) {
  const header = req.headers?.authorization;
  const match = typeof header === 'string' ? /^Bearer ([^\s]+)$/.exec(header) : null;
  return match?.[1] || '';
}

export default async function handleAuthActivity(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendGuardianJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { event } = readJsonBody(req);
    if (!['sign-in', 'sign-out'].includes(event)) {
      throw new GuardianConsentError(400, 'Choose a valid account activity.');
    }
    const accessToken = readBearerToken(req);
    if (accessToken.length < 20 || accessToken.length > 4_096) {
      throw new GuardianConsentError(401, 'Sign in again before requesting an account activity email.');
    }

    const admin = createGuardianAdmin();
    const { data, error } = await admin.auth.getUser(accessToken);
    const user = data?.user;
    if (error || !user?.email) {
      throw new GuardianConsentError(401, 'Your account could not be verified for this activity email.');
    }
    await enforceGuardianRateLimit(admin, `${event}:${user.email}`, 'request', 8, 3_600);
    const address = getClientAddress(req);
    if (address) await enforceGuardianRateLimit(admin, `${event}:${address}`, 'request_ip', 30, 3_600);

    const origin = getProductionOrigin();
    const email = createAuthActivityEmail({
      event,
      logoUrl: `${origin}/assets/idilewa-mark.png`,
      timestamp: new Date().toISOString(),
    });
    await sendGuardianEmail({ to: user.email, ...email });
    return sendGuardianJson(res, 202, { message: 'Account activity email sent.' });
  } catch (error) {
    if (error instanceof GuardianConsentError) {
      return sendGuardianJson(res, error.statusCode, { error: error.message });
    }
    console.error('[auth/activity] Account activity email could not be sent.');
    return sendGuardianJson(res, 502, { error: 'The Idilewa account activity email could not be sent.' });
  }
}

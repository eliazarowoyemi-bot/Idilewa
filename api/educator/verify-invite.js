import {
  createGuardianAdmin,
  enforceGuardianRateLimit,
  getClientAddress,
  GuardianConsentError,
  hashGuardianValue,
  normalizeEducatorInviteCode,
  readJsonBody,
  sendGuardianJson,
} from '../../src/server/guardianConsent.js';
import { normalizeEducatorProfile } from '../../src/educatorProfile.js';

const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

function readBearerToken(req) {
  const authorization = req.headers?.authorization;
  const match = typeof authorization === 'string' ? /^Bearer\s+(.+)$/i.exec(authorization) : null;
  if (!match || match[1].length > 4096) {
    throw new GuardianConsentError(401, 'Sign in with Google before completing tutor registration.');
  }
  return match[1];
}

async function completeGoogleSignup(req, res) {
  try {
    const body = readJsonBody(req);
    if (!UUID_PATTERN.test(body.inviteId || '')) {
      throw new GuardianConsentError(400, 'A verified one-time educator invitation is required.');
    }
    if (body.safeguardingAccepted !== true) {
      throw new GuardianConsentError(400, 'Accept the safeguarding requirements before creating a tutor account.');
    }
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    if (!firstName || firstName.length > 40 || !lastName || lastName.length > 40) {
      throw new GuardianConsentError(400, 'Enter a first and last name using no more than 40 characters each.');
    }
    let educatorProfile;
    try {
      educatorProfile = normalizeEducatorProfile(body.educatorProfile);
    } catch (error) {
      throw new GuardianConsentError(400, error instanceof Error ? error.message : 'Complete your tutor profile.');
    }

    const admin = createGuardianAdmin();
    const token = readBearerToken(req);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
      throw new GuardianConsentError(401, 'Your Google session could not be verified. Sign in again and retry.');
    }
    const providers = user.app_metadata?.providers;
    if (!Array.isArray(providers) || !providers.includes('google')
      || !user.email_confirmed_at || !user.email) {
      throw new GuardianConsentError(403, 'Use a verified Google account to complete tutor registration.');
    }

    await enforceGuardianRateLimit(admin, user.id, 'educator_google_signup', 5, 900);
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceGuardianRateLimit(admin, clientAddress, 'educator_google_signup_ip', 20, 900);
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw new GuardianConsentError(503, 'Your account profile could not be verified.');
    if (!profile || !['adult', 'educator'].includes(profile.role)) {
      throw new GuardianConsentError(403, 'Only an adult Google account can register as an educator.');
    }

    const name = `${firstName} ${lastName}`;
    const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name,
        role: 'educator',
        educator_invite_id: body.inviteId,
        country: educatorProfile.country,
        time_zone: educatorProfile.timeZone,
        teaching_subject: educatorProfile.teachingSubject,
        teaching_experience: educatorProfile.teachingExperience,
        qualifications: educatorProfile.qualifications,
        safeguarding_accepted_at: new Date().toISOString(),
      },
    });
    if (metadataError) {
      throw new GuardianConsentError(503, 'Your tutor details could not be saved. Your invitation has not been used; please try again.');
    }

    const { data: completed, error: completionError } = await admin.rpc('complete_educator_google_signup', {
      p_user_id: user.id,
      p_invite_id: body.inviteId,
    });
    if (completionError || completed !== true) {
      throw new GuardianConsentError(400, 'That invitation is invalid, expired, used, or belongs to another account.');
    }

    return sendGuardianJson(res, 200, { role: 'educator' });
  } catch (error) {
    if (error instanceof GuardianConsentError) {
      return sendGuardianJson(res, error.statusCode, { error: error.message });
    }
    console.error('[educator/verify-invite] Google tutor signup failed.', error);
    return sendGuardianJson(res, 500, { error: 'Google tutor signup could not be completed.' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendGuardianJson(res, 405, { error: 'Method not allowed.' });
  }

  if (req.query?.action === 'complete-google-signup') {
    return completeGoogleSignup(req, res);
  }

  try {
    const body = readJsonBody(req);
    const inviteCode = normalizeEducatorInviteCode(body.code);
    const codeHash = hashGuardianValue(inviteCode);
    const admin = createGuardianAdmin();
    await enforceGuardianRateLimit(admin, codeHash, 'educator_verify', 5, 900);
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceGuardianRateLimit(admin, clientAddress, 'educator_verify_ip', 20, 900);
    }

    const { data, error } = await admin
      .from('educator_invites')
      .select('id')
      .eq('code_hash', codeHash)
      .is('redeemed_by', null)
      .is('redeemed_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (error) throw new GuardianConsentError(503, 'Educator invitations are temporarily unavailable.');
    if (!data?.id) throw new GuardianConsentError(400, 'That invitation is invalid, expired, or already used.');
    return sendGuardianJson(res, 200, { inviteId: data.id });
  } catch (error) {
    if (error instanceof GuardianConsentError) {
      return sendGuardianJson(res, error.statusCode, { error: error.message });
    }
    console.error('[educator/verify-invite] Invitation verification failed.');
    return sendGuardianJson(res, 500, { error: 'The educator invitation could not be verified.' });
  }
}

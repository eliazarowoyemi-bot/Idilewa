import {
  createApprovalToken,
  enforceGuardianRateLimit,
  escapeEmailHtml,
  getClientAddress,
  getProductionOrigin,
  GuardianConsentError,
  hashGuardianValue,
  normalizeEmail,
  readFormBody,
  readJsonBody,
  sendGuardianEmail,
  sendGuardianHtml,
} from './guardianConsent.js';
import {
  requireAuthenticatedProfile,
  sendApiFailure,
  sendApiJson,
} from './authenticatedRequest.js';

const AGE_GROUPS = new Set(['under_6', '6_8', '9_12', '13_17']);
const GENDERS = new Set(['boy', 'girl', 'not_specified']);
const AVATARS = new Set(['a1', 'a2', 'a3', 'a4']);
const LANGUAGES = new Set(['yoruba', 'igbo', 'hausa', 'pidgin', 'kiswahili', 'other']);
const INTERESTS = new Set(['stories', 'games', 'songs', 'arts_crafts']);
const RELATIONSHIPS = new Set(['parent', 'legal_guardian', 'authorized_caregiver']);
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,50}$/;
const PRIVACY_POLICY_VERSION = '2026-11-19';
const TERMS_VERSION = '2026-11-19';

function boundedText(value, maxLength, label) {
  if (typeof value !== 'string') throw new GuardianConsentError(400, `Enter a valid ${label}.`);
  const text = value.trim();
  if (!text || text.length > maxLength || /[\u0000-\u001f\u007f]/u.test(text)) {
    throw new GuardianConsentError(400, `Enter a valid ${label}.`);
  }
  return text;
}

function normalizeSelection(value, allowed, label, { required = false, max = allowed.size } = {}) {
  if (!Array.isArray(value) || value.length > max
    || value.some((entry) => typeof entry !== 'string' || !allowed.has(entry))) {
    throw new GuardianConsentError(400, `Choose valid ${label}.`);
  }
  const selection = [...new Set(value)];
  if (required && !selection.length) throw new GuardianConsentError(400, `Choose at least one ${label}.`);
  return selection;
}

export function validateChildRegistration(body, authenticatedEmail) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new GuardianConsentError(400, 'A child profile request is required.');
  }
  const parentEmail = normalizeEmail(body.parentEmail);
  if (parentEmail !== normalizeEmail(authenticatedEmail)) {
    throw new GuardianConsentError(403, 'The guardian email must match your signed-in parent account.');
  }
  const gender = body.gender === null || body.gender === '' ? null : body.gender;
  if (gender !== null && !GENDERS.has(gender)) throw new GuardianConsentError(400, 'Choose a valid gender option.');
  const avatar = typeof body.avatar === 'string' ? body.avatar : '';
  if (!AVATARS.has(avatar)) throw new GuardianConsentError(400, 'Choose a valid avatar.');
  const ageGroup = typeof body.ageGroup === 'string' ? body.ageGroup : '';
  if (!AGE_GROUPS.has(ageGroup)) throw new GuardianConsentError(400, 'Choose a valid age group.');
  const relationship = typeof body.relationship === 'string' ? body.relationship : '';
  if (!RELATIONSHIPS.has(relationship)) throw new GuardianConsentError(400, 'Choose your relationship to the child.');
  if (body.consent !== true) throw new GuardianConsentError(400, 'Parent or guardian consent is required.');
  if (typeof body.marketingOptIn !== 'boolean') {
    throw new GuardianConsentError(400, 'The optional email preference is not valid.');
  }

  return {
    childName: boundedText(body.childName, 80, 'child name'),
    ageGroup,
    gender,
    avatar,
    languages: normalizeSelection(body.languages, LANGUAGES, 'preferred language', { required: true }),
    interests: normalizeSelection(body.interests, INTERESTS, 'learning interest'),
    parentName: boundedText(body.parentName, 100, 'parent or guardian name'),
    parentEmail,
    relationship,
    marketingOptIn: body.marketingOptIn,
  };
}

async function deletePendingChild(admin, childId) {
  const { error } = await admin.from('children')
    .delete()
    .eq('id', childId)
    .eq('status', 'pending_consent');
  if (error) console.error('[guardian/children] An unsent child profile could not be removed.');
}

export async function registerChildHandler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  if (req.method === 'DELETE') {
    try {
      const body = readJsonBody(req);
      if (typeof body.childId !== 'string'
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.childId)) {
        throw new GuardianConsentError(400, 'Choose a valid child profile.');
      }
      const { admin, profile } = await requireAuthenticatedProfile(req, ['parent']);
      const { data, error } = await admin.rpc('withdraw_child_parental_consent', {
        p_child_id: body.childId,
        p_parent_user_id: profile.id,
      });
      if (error) throw new GuardianConsentError(503, 'Consent could not be withdrawn. Please try again.');
      const withdrawn = Array.isArray(data) ? data[0] : data;
      if (!withdrawn?.child_id || !withdrawn.parent_email) {
        throw new GuardianConsentError(404, 'That active child profile was not found.');
      }
      let message = 'Consent is withdrawn. The child profile is no longer active.';
      try {
        await sendGuardianEmail({
          to: withdrawn.parent_email,
          subject: 'Idilewa child-profile consent withdrawn',
          text: `Consent for ${withdrawn.child_name}’s Idilewa child profile has been withdrawn. The profile is no longer active. Contact Idilewa if you also want its stored profile information erased.`,
          html: `<p>Consent for ${escapeEmailHtml(withdrawn.child_name)}’s Idilewa child profile has been withdrawn. The profile is no longer active.</p><p>Contact <a href="mailto:idilewa2026@gmail.com?subject=Child%20profile%20deletion%20request">Idilewa support</a> if you also want its stored profile information erased.</p>`,
        });
      } catch {
        message += ' The profile is inactive, but the confirmation email could not be delivered.';
        console.error('[guardian/children] Consent is withdrawn, but the confirmation email failed.');
      }
      return sendGuardianJson(res, 200, { message });
    } catch (error) {
      return sendApiFailure(res, error, 'guardian/children');
    }
  }

  let admin;
  let childId;
  try {
    const body = readJsonBody(req);
    if (typeof body.website === 'string' && body.website.trim()) {
      throw new GuardianConsentError(400, 'The request could not be completed.');
    }
    const { admin: authenticatedAdmin, profile } = await requireAuthenticatedProfile(req, ['parent']);
    admin = authenticatedAdmin;
    const input = validateChildRegistration(body, profile.email);
    const origin = getProductionOrigin();
    await enforceGuardianRateLimit(admin, input.parentEmail, 'request', 3, 3_600);
    const clientAddress = getClientAddress(req);
    if (clientAddress) await enforceGuardianRateLimit(admin, clientAddress, 'request_ip', 12, 3_600);

    const token = createApprovalToken();
    const tokenHash = hashGuardianValue(token);
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString();
    const { data: createdChildId, error: createError } = await admin.rpc('create_parent_managed_child', {
      p_parent_user_id: profile.id,
      p_parent_email: input.parentEmail,
      p_child_name: input.childName,
      p_age_group: input.ageGroup,
      p_gender: input.gender,
      p_avatar: input.avatar,
      p_preferred_languages: input.languages,
      p_learning_interests: input.interests,
      p_parent_name: input.parentName,
      p_relationship: input.relationship,
      p_privacy_policy_version: PRIVACY_POLICY_VERSION,
      p_terms_version: TERMS_VERSION,
      p_verification_token_hash: tokenHash,
      p_token_expires_at: tokenExpiresAt,
      p_marketing_opt_in: input.marketingOptIn,
      p_marketing_opt_in_at: input.marketingOptIn ? new Date().toISOString() : null,
    });
    if (createError || typeof createdChildId !== 'string') {
      if (createError?.message.startsWith('CHILD_PROFILE_LIMIT_REACHED:')) {
        const familyPlan = createError.message.endsWith(':4');
        throw new GuardianConsentError(409, familyPlan
          ? 'Your Family plan already has four child profiles.'
          : 'Your current plan includes one child profile. Choose the Family plan to add up to four profiles.');
      }
      throw new GuardianConsentError(503, 'The child profile and consent record could not be saved.');
    }
    childId = createdChildId;

    const consentUrl = `${origin}/api/guardian/consent?token=${encodeURIComponent(token)}`;
    const safeChildName = escapeEmailHtml(input.childName);
    try {
      await sendGuardianEmail({
        to: input.parentEmail,
        subject: 'Confirm your child’s Idilewa profile',
        text: `Review and confirm your consent for ${input.childName}’s Idilewa child profile here: ${consentUrl}\n\nThis single-use link expires in 24 hours. The profile remains inactive until you confirm.`,
        html: `<p>Review and confirm your consent for <strong>${safeChildName}</strong>’s Idilewa child profile.</p><p><a href="${consentUrl}">Review and confirm parent or guardian consent</a></p><p>This single-use link expires in 24 hours. The profile remains inactive until you confirm.</p>`,
      });
    } catch (error) {
      await deletePendingChild(admin, childId);
      throw error;
    }

    return sendApiJson(res, 202, {
      message: 'A single-use consent link has been sent to your verified parent email. The child profile will activate only after you confirm it.',
    });
  } catch (error) {
    if (admin && childId && error instanceof GuardianConsentError && error.statusCode >= 500) {
      await deletePendingChild(admin, childId);
    }
    return sendApiFailure(res, error, 'guardian/children');
  }
}

function readConsentToken(req, body = {}) {
  const value = body.token || req.query?.token || new URL(req.url || '/', 'https://idilewa.local').searchParams.get('token') || '';
  if (typeof value !== 'string' || !TOKEN_PATTERN.test(value)) {
    throw new GuardianConsentError(400, 'This consent link is not valid.');
  }
  return value;
}

async function findPendingConsent(admin, tokenHash) {
  const { data: consent, error } = await admin.from('parent_consents')
    .select('id,child_id,parent_user_id,parent_name,parent_email,relationship,status,token_expires_at')
    .eq('verification_token_hash', tokenHash)
    .gt('token_expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new GuardianConsentError(503, 'Parent consent is temporarily unavailable.');
  if (!consent || consent.status !== 'pending') {
    throw new GuardianConsentError(410, 'This consent link has expired or has already been used.');
  }
  const { data: child, error: childError } = await admin.from('children')
    .select('name,status')
    .eq('id', consent.child_id)
    .eq('parent_user_id', consent.parent_user_id)
    .maybeSingle();
  if (childError || !child || child.status !== 'pending_consent') {
    throw new GuardianConsentError(410, 'This child profile is no longer awaiting consent.');
  }
  return { ...consent, childName: child.name };
}

function renderConsentReview(token, childName) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Confirm Idilewa parent consent</title><style>:root{font-family:Inter,system-ui,sans-serif;color:#10251b;background:#f5fbf6}*{box-sizing:border-box}body{margin:0;padding:24px;line-height:1.55}.card{max-width:620px;margin:8vh auto;padding:clamp(24px,5vw,42px);border:1px solid #dce9df;border-radius:20px;background:#fff;box-shadow:0 10px 28px #174c2b12}h1{line-height:1.15;color:#075b32}label{margin:16px 0;display:flex;align-items:flex-start;gap:12px}input{margin-top:5px;accent-color:#078b3d}button{min-height:48px;padding:12px 20px;border:0;border-radius:999px;background:#078b3d;color:#fff;font:inherit;font-weight:800;cursor:pointer}.notice{color:#526459;font-size:14px}a{color:#075b32}</style><main class="card"><p>Ìdíléwa · Family approval</p><h1>Confirm your child’s profile</h1><p>You are reviewing the profile for <strong>${escapeEmailHtml(childName)}</strong>.</p><p>Confirm that you are authorized to provide consent, have reviewed the <a href="/?view=privacy" rel="noreferrer">privacy information</a>, and approve creating this parent-managed child profile.</p><form method="post" action="/api/guardian/consent"><input type="hidden" name="token" value="${escapeEmailHtml(token)}"><label><input type="checkbox" name="authority" value="yes" required> I am the child’s parent or legal guardian, or am otherwise authorized to provide consent.</label><label><input type="checkbox" name="consent" value="yes" required> I confirm my permission for Idilewa to create this profile and process the submitted information to provide its learning service.</label><label><input type="checkbox" name="privacyReviewed" value="yes" required> I have reviewed the privacy information and understand I can withdraw this consent through the parent account.</label><button type="submit">Confirm consent and activate profile</button></form><p class="notice">This link is single-use and expires after 24 hours. If you did not request this, close this page.</p></main></html>`;
}

function renderConsentResult(message, isError = false) {
  const title = isError ? 'Consent not confirmed' : 'Profile activated';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Idilewa</title><style>:root{font-family:Inter,system-ui,sans-serif;color:#10251b;background:#f5fbf6}*{box-sizing:border-box}body{margin:0;padding:24px;line-height:1.55}.card{max-width:620px;margin:8vh auto;padding:clamp(24px,5vw,42px);border:1px solid #dce9df;border-radius:20px;background:#fff;box-shadow:0 10px 28px #174c2b12}h1{line-height:1.15;color:#075b32}a{color:#075b32;font-weight:700}</style><main class="card"><p>Ìdíléwa · Family approval</p><h1>${title}</h1><p>${escapeEmailHtml(message)}</p><a href="/parents.html#/parent-dashboard">Open your family dashboard</a></main></html>`;
}

export async function consentConfirmationHandler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendGuardianHtml(res, 405, renderConsentResult('Method not allowed.', true));
  }

  try {
    const admin = createGuardianAdmin();
    if (req.method === 'GET') {
      const token = readConsentToken(req);
      const consent = await findPendingConsent(admin, hashGuardianValue(token));
      return sendGuardianHtml(res, 200, renderConsentReview(token, consent.childName));
    }

    const body = readFormBody(req);
    const token = readConsentToken(req, body);
    const clientAddress = getClientAddress(req);
    if (clientAddress) await enforceGuardianRateLimit(admin, clientAddress, 'approve_ip', 5, 900);
    if (body.authority !== 'yes' || body.consent !== 'yes' || body.privacyReviewed !== 'yes') {
      throw new GuardianConsentError(400, 'Complete each consent confirmation before continuing.');
    }
    const { data, error } = await admin.rpc('confirm_child_parental_consent', {
      p_token_hash: hashGuardianValue(token),
    });
    const confirmed = Array.isArray(data) ? data[0] : data;
    if (error) throw new GuardianConsentError(503, 'Consent could not be recorded. Please try again.');
    if (!confirmed?.child_id || !confirmed.parent_email) {
      throw new GuardianConsentError(410, 'This consent link has expired or has already been used.');
    }

    let message = 'Consent is recorded and the child profile is active in your family account.';
    try {
      const safeName = escapeEmailHtml(confirmed.child_name);
      await sendGuardianEmail({
        to: confirmed.parent_email,
        subject: 'Your Idilewa child profile is active',
        text: `Your consent is confirmed and ${confirmed.child_name}’s child profile is active in your Idilewa family account.`,
        html: `<p>Your consent is confirmed and <strong>${safeName}</strong>’s child profile is active in your Idilewa family account.</p><p><a href="${getProductionOrigin()}/parents.html#/parent-dashboard">Open your family dashboard</a></p>`,
      });
    } catch {
      message += ' The profile is active, but the confirmation email could not be delivered.';
      console.error('[guardian/consent] Profile is active, but the confirmation email failed.');
    }
    return sendGuardianHtml(res, 200, renderConsentResult(message));
  } catch (error) {
    const statusCode = error instanceof GuardianConsentError ? error.statusCode : 500;
    if (!(error instanceof GuardianConsentError)) console.error('[guardian/consent] Consent confirmation failed.');
    return sendGuardianHtml(
      res,
      statusCode,
      renderConsentResult(error instanceof GuardianConsentError
        ? error.message
        : 'The consent request could not be completed. Please try again later.', true),
    );
  }
}

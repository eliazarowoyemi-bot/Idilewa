import {
  createAccessCode,
  createGuardianAdmin,
  enforceGuardianRateLimit,
  getClientAddress,
  GuardianConsentError,
  hashGuardianValue,
  readFormBody,
  renderApprovalPage,
  renderApprovalResult,
  sendGuardianEmail,
  sendGuardianHtml,
} from './guardianConsent.js';

function readToken(req, body = {}) {
  const value = body.token || req.query?.token || '';
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(value)) {
    throw new GuardianConsentError(400, 'This approval link is not valid.');
  }
  return value;
}

async function findPendingRequest(admin, tokenHash) {
  const { data, error } = await admin
    .from('guardian_access_requests')
    .select('id, learner_alias, tutor_id, status, code_sent_at')
    .eq('approval_token_hash', tokenHash)
    .gt('request_expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) {
    throw new GuardianConsentError(503, 'Guardian approval is temporarily unavailable.');
  }
  if (!data || (data.status !== 'pending' && !(data.status === 'approved' && !data.code_sent_at))) {
    throw new GuardianConsentError(404, 'This approval link is expired or has already been used.');
  }
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendGuardianHtml(res, 405, renderApprovalResult('Method not allowed.'));
  }

  try {
    const admin = createGuardianAdmin();
    if (req.method === 'GET') {
      const token = readToken(req);
      const request = await findPendingRequest(admin, hashGuardianValue(token));
      return sendGuardianHtml(res, 200, renderApprovalPage({
        token,
        learnerAlias: request.learner_alias,
        tutorRequested: Boolean(request.tutor_id),
      }));
    }

    const body = readFormBody(req);
    const token = readToken(req, body);
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceGuardianRateLimit(admin, clientAddress, 'approve_ip', 5, 900);
    }
    if (body.authority !== 'yes' || body.accountConsent !== 'yes' || body.privacyReviewed !== 'yes') {
      throw new GuardianConsentError(400, 'Complete each required approval before continuing.');
    }
    const request = await findPendingRequest(admin, hashGuardianValue(token));
    const accessCode = createAccessCode();
    const { data, error } = await admin.rpc('issue_guardian_access_code', {
      p_token_hash: hashGuardianValue(token),
      p_code_hash: hashGuardianValue(accessCode),
      p_code_lifetime_seconds: 900,
      p_tutor_approved: request.tutor_id ? body.tutorConsent === 'yes' : false,
    });
    const issued = Array.isArray(data) ? data[0] : data;
    if (error || !issued?.id || !issued.child_email) {
      throw new GuardianConsentError(404, 'This approval link is expired or has already been used.');
    }

    await sendGuardianEmail({
      to: issued.child_email,
      subject: 'Your Idilewa one-time sign-up code',
      text: `Your parent or guardian approved your Idilewa account request. Your one-time code is ${accessCode}. Enter it during child account sign-up within 15 minutes. Do not share it with anyone else.`,
      html: `<p>Your parent or guardian approved your Idilewa account request.</p><p>Your one-time sign-up code:</p><p style="font-size:28px;font-weight:700;letter-spacing:5px">${accessCode}</p><p>Enter it during child account sign-up within 15 minutes. Do not share it with anyone else.</p>`,
    });
    const { data: sent, error: sentError } = await admin.rpc('mark_guardian_access_code_sent', {
      p_request_id: issued.id,
    });
    if (sentError || sent !== true) {
      console.error('[guardian/approve] Approval email sent but delivery record update failed.');
      throw new GuardianConsentError(503, 'The code email was sent, but its status could not be confirmed. Please contact support before requesting another code.');
    }

    return sendGuardianHtml(res, 200, renderApprovalResult('The learner’s one-time sign-up code has been emailed to the address provided in the request.'));
  } catch (error) {
    const status = error instanceof GuardianConsentError ? error.statusCode : 500;
    if (!(error instanceof GuardianConsentError)) {
      console.error('[guardian/approve] Approval processing failed.');
    }
    return sendGuardianHtml(
      res,
      status,
      renderApprovalResult(error instanceof GuardianConsentError
        ? error.message
        : 'The approval could not be completed. Please try again later.'),
    );
  }
}

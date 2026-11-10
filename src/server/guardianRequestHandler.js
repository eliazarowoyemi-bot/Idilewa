import {
  createApprovalToken,
  createGuardianAdmin,
  enforceGuardianRateLimit,
  getClientAddress,
  escapeEmailHtml,
  getProductionOrigin,
  GuardianConsentError,
  hashGuardianValue,
  normalizeEmail,
  readJsonBody,
  sendGuardianEmail,
  sendGuardianJson,
} from './guardianConsent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendGuardianJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const body = readJsonBody(req);
    const childEmail = normalizeEmail(body.childEmail);
    const parentEmail = normalizeEmail(body.parentEmail);
    const learnerAlias = typeof body.learnerAlias === 'string' ? body.learnerAlias.trim().slice(0, 28) : '';
    const tutorId = typeof body.tutorId === 'string' ? body.tutorId.trim().slice(0, 64) : '';
    if (childEmail === parentEmail) {
      throw new GuardianConsentError(400, 'Use a separate parent or guardian email address.');
    }
    if (learnerAlias.length < 2 || /[<>]/.test(learnerAlias)) {
      throw new GuardianConsentError(400, 'Enter a short learner nickname.');
    }
    if (body.tutorId && !/^[a-z0-9-]{1,64}$/.test(tutorId)) {
      throw new GuardianConsentError(400, 'The selected tutor is not valid.');
    }

    const productionOrigin = getProductionOrigin();
    const admin = createGuardianAdmin();
    await enforceGuardianRateLimit(admin, parentEmail, 'request', 3, 3_600);
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceGuardianRateLimit(admin, clientAddress, 'request_ip', 12, 3_600);
    }
    const token = createApprovalToken();
    const { data: request, error } = await admin
      .from('guardian_access_requests')
      .insert({
        child_email: childEmail,
        parent_email: parentEmail,
        learner_alias: learnerAlias,
        tutor_id: tutorId || null,
        approval_token_hash: hashGuardianValue(token),
        request_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1_000).toISOString(),
      })
      .select('id')
      .single();
    if (error || !request) {
      throw new GuardianConsentError(503, 'The guardian request could not be saved.');
    }

    const approvalUrl = `${productionOrigin}/api/guardian/approve?token=${encodeURIComponent(token)}`;
    const safeAlias = escapeEmailHtml(learnerAlias);
    try {
      await sendGuardianEmail({
        to: parentEmail,
        subject: 'Review a child learning request on Idilewa',
        text: `${learnerAlias} is requesting a supervised Idilewa learning account. Review and approve it here: ${approvalUrl}\n\nThis approval link expires in 24 hours. If you did not request this, ignore this email.`,
        html: `<p>${safeAlias} is requesting a supervised Idilewa learning account.</p><p><a href="${approvalUrl}">Review the request and decide</a></p><p>This approval link expires in 24 hours. No code is issued until you submit the approval form. If you did not request this, ignore this email.</p>`,
      });
    } catch (error) {
      await admin.from('guardian_access_requests').delete().eq('id', request.id);
      throw error;
    }

    return sendGuardianJson(res, 202, {
      message: 'Request sent. Ask your parent or guardian to review the email before you enter the code.',
    });
  } catch (error) {
    if (error instanceof GuardianConsentError) {
      return sendGuardianJson(res, error.statusCode, { error: error.message });
    }
    console.error('[guardian/request] Internal request failure.');
    return sendGuardianJson(res, 500, { error: 'The guardian request could not be completed.' });
  }
}

import {
  createApprovalToken,
  enforceGuardianRateLimit,
  escapeEmailHtml,
  getClientAddress,
  getProductionOrigin,
  hashGuardianValue,
  normalizeEmail,
  sendGuardianEmail,
} from './guardianConsent.js';
import {
  GuardianConsentError,
  readJsonBody,
  requireAuthenticatedProfile,
  sendApiFailure,
  sendApiJson,
} from './authenticatedRequest.js';

export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { admin, profile } = await requireAuthenticatedProfile(req, ['educator']);
    const body = readJsonBody(req);
    const childEmail = normalizeEmail(body.childEmail);
    const origin = getProductionOrigin();
    await enforceGuardianRateLimit(admin, profile.id, 'educator_connection_request', 5, 3_600);
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceGuardianRateLimit(admin, clientAddress, 'educator_connection_request_ip', 15, 3_600);
    }

    const { data: child, error: childError } = await admin
      .from('profiles')
      .select('id,role,parent_consent_request_id')
      .eq('email', childEmail)
      .maybeSingle();
    if (childError) throw new GuardianConsentError(503, 'A connection request could not be created.');
    if (!child || child.role !== 'child' || !child.parent_consent_request_id) {
      return sendApiJson(res, 202, {
        message: 'If this learner can be connected, the family has been notified or a request is already pending.',
      });
    }

    const { data: guardian, error: guardianError } = await admin
      .from('guardian_access_requests')
      .select('id,parent_email,learner_alias,status,claimed_by')
      .eq('id', child.parent_consent_request_id)
      .maybeSingle();
    if (guardianError) throw new GuardianConsentError(503, 'The family approval could not be checked.');
    if (!guardian
      || guardian.status !== 'used'
      || guardian.claimed_by !== child.id
      || !guardian.parent_email) {
      return sendApiJson(res, 202, {
        message: 'If this learner can be connected, the family has been notified or a request is already pending.',
      });
    }

    const now = new Date().toISOString();
    const { error: expiryError } = await admin
      .from('educator_connection_requests')
      .update({ status: 'expired', decided_at: now })
      .eq('educator_id', profile.id)
      .eq('child_id', child.id)
      .eq('status', 'pending')
      .lte('expires_at', now);
    if (expiryError) throw new GuardianConsentError(503, 'The connection status could not be checked.');

    const { data: existing, error: existingError } = await admin
      .from('educator_connection_requests')
      .select('id')
      .eq('educator_id', profile.id)
      .eq('child_id', child.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();
    if (existingError) throw new GuardianConsentError(503, 'The connection status could not be checked.');
    if (existing) {
      return sendApiJson(res, 202, {
        message: 'If this learner can be connected, the family has been notified or a request is already pending.',
      });
    }

    const token = createApprovalToken();
    const { data: request, error: insertError } = await admin
      .from('educator_connection_requests')
      .insert({
        educator_id: profile.id,
        child_id: child.id,
        guardian_request_id: guardian.id,
        approval_token_hash: hashGuardianValue(token),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString(),
      })
      .select('id')
      .single();
    if (insertError?.code === '23505') {
      return sendApiJson(res, 202, {
        message: 'If this learner can be connected, the family has been notified or a request is already pending.',
      });
    }
    if (insertError || !request) {
      throw new GuardianConsentError(503, 'A consent request could not be created.');
    }

    const approvalUrl = `${origin}/api/educator/connection-approval?token=${encodeURIComponent(token)}`;
    const educatorName = escapeEmailHtml(profile.name || 'An Idilewa educator');
    const learnerName = escapeEmailHtml(guardian.learner_alias || 'Your learner');
    try {
      await sendGuardianEmail({
        to: normalizeEmail(guardian.parent_email),
        subject: 'Review an educator connection request on Idilewa',
        text: `${educatorName} has requested permission to work with ${learnerName} on Idilewa. Review and decide here: ${approvalUrl}\n\nThis consent link expires in 7 days. If you did not expect this request, ignore the email.`,
        html: `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Idilewa educator consent</title><body style="margin:0;background:#f3f6f1;color:#20372b;font:16px/1.6 Arial,Helvetica,sans-serif"><main style="max-width:600px;margin:32px auto;background:white;padding:32px;border:1px solid #e4ebe2;border-radius:18px"><p style="color:#28734d;font-weight:bold;letter-spacing:1px">IDÍLẸ́WÀ · FAMILY CONSENT</p><h1 style="color:#173f32">Review a tutor request</h1><p><strong>${educatorName}</strong> has asked to work with <strong>${learnerName}</strong> on Idilewa.</p><p>No learner information is shared unless you approve. You can approve or decline this specific educator request.</p><p style="margin:28px 0"><a href="${escapeEmailHtml(approvalUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#28734d;color:white;text-decoration:none;font-weight:bold">Review consent request</a></p><p style="font-size:13px;color:#718076">This link expires in 7 days. If you did not expect this request, ignore this email. This approval records your stated decision; it does not independently verify legal identity.</p><p style="font-size:13px;color:#526358">With care,<br><strong>The Idilewa team</strong></p></main></body></html>`,
      });
    } catch (emailError) {
      const { error: cleanupError } = await admin
        .from('educator_connection_requests')
        .delete()
        .eq('id', request.id)
        .eq('status', 'pending');
      if (cleanupError) console.error('[educator/connection-request] Failed to remove an undelivered request.');
      throw emailError;
    }

    return sendApiJson(res, 202, {
      message: 'Consent request sent to the parent or guardian on the learner’s account.',
    });
  } catch (error) {
    return sendApiFailure(res, error, 'educator/connection-request');
  }
}

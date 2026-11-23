import {
  createGuardianAdmin,
  enforceGuardianRateLimit,
  escapeEmailHtml,
  getClientAddress,
  hashGuardianValue,
  normalizeEmail,
  readFormBody,
  renderApprovalResult,
  sendGuardianEmail,
  sendGuardianHtml,
} from './guardianConsent.js';
import {
  GuardianConsentError,
} from './authenticatedRequest.js';

function readToken(req, body = {}) {
  const token = body.token || req.query?.token || '';
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
    throw new GuardianConsentError(400, 'This consent link is not valid.');
  }
  return token;
}

function renderConsentForm({ token, learnerAlias, educatorName }) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Review Idilewa educator consent</title><style>body{font:16px/1.6 system-ui,sans-serif;background:#f7faf6;color:#183326;margin:0;padding:24px}.card{max-width:620px;margin:8vh auto;background:white;padding:clamp(24px,5vw,42px);border-radius:20px;box-shadow:0 16px 45px #18332618}h1{line-height:1.15}label{display:flex;gap:12px;margin:18px 0;align-items:flex-start}input{margin-top:5px;accent-color:#15764a}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}button{background:#15764a;color:white;border:0;border-radius:999px;padding:14px 20px;font:inherit;font-weight:700;cursor:pointer}.decline{background:#59655d}.notice{color:#56665b;font-size:14px}</style><main class="card"><p>Idilewa · Family consent</p><h1>Review this educator request</h1><p><strong>${escapeEmailHtml(educatorName)}</strong> wants to work with <strong>${escapeEmailHtml(learnerAlias)}</strong>.</p><p>No learner learning data is shared unless you approve this named educator. This consent applies only to this connection and may be withdrawn by contacting Idilewa support.</p><form method="post"><input type="hidden" name="token" value="${escapeEmailHtml(token)}"><label><input type="checkbox" name="authority" value="yes" required> I am this learner’s parent/legal guardian or am authorized to make this decision.</label><label><input type="checkbox" name="privacyReviewed" value="yes" required> I understand the educator will see learning progress only after I approve.</label><div class="actions"><button type="submit" name="decision" value="approve">Approve this educator</button><button class="decline" type="submit" name="decision" value="decline">Decline request</button></div></form><p class="notice">This link expires in 7 days. No decision is recorded until you submit the form. This process records your stated authority and consent but does not independently verify legal identity.</p></main></html>`;
}

async function loadRequest(admin, tokenHash) {
  const { data, error } = await admin
    .from('educator_connection_requests')
    .select('id,child_id,guardian_request_id,educator_id,status')
    .eq('approval_token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new GuardianConsentError(503, 'Educator consent is temporarily unavailable.');
  if (!data || data.status !== 'pending') {
    throw new GuardianConsentError(404, 'This consent request is expired or has already been decided.');
  }

  const [{ data: guardian, error: guardianError }, { data: educator, error: educatorError }] = await Promise.all([
    admin.from('guardian_access_requests')
      .select('id,learner_alias,status,claimed_by')
      .eq('id', data.guardian_request_id)
      .maybeSingle(),
    admin.from('profiles')
      .select('id,name,role,email')
      .eq('id', data.educator_id)
      .maybeSingle(),
  ]);
  if (guardianError || educatorError) throw new GuardianConsentError(503, 'Consent details could not be loaded.');
  if (!guardian || guardian.status !== 'used' || guardian.claimed_by !== data.child_id
    || !educator || educator.role !== 'educator') {
    throw new GuardianConsentError(404, 'This consent request is no longer available.');
  }
  return {
    connection: data,
    learnerAlias: guardian.learner_alias || 'Learner',
    educatorName: educator.name || 'Idilewa educator',
    educatorEmail: educator.email || '',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendGuardianHtml(res, 405, renderApprovalResult('Method not allowed.'));
  }

  try {
    const body = req.method === 'POST' ? readFormBody(req) : {};
    const token = readToken(req, body);
    const admin = createGuardianAdmin();
    const tokenHash = hashGuardianValue(token);
    if (req.method === 'GET') {
      const details = await loadRequest(admin, tokenHash);
      return sendGuardianHtml(res, 200, renderConsentForm({
        token,
        learnerAlias: details.learnerAlias,
        educatorName: details.educatorName,
      }));
    }

    if (!['approve', 'decline'].includes(body.decision)
      || body.authority !== 'yes'
      || body.privacyReviewed !== 'yes') {
      throw new GuardianConsentError(400, 'Confirm your authority and review the consent details before deciding.');
    }
    const clientAddress = getClientAddress(req);
    if (clientAddress) {
      await enforceGuardianRateLimit(admin, clientAddress, 'educator_connection_decision_ip', 8, 900);
    }
    const details = await loadRequest(admin, tokenHash);
    const { data: decided, error } = await admin.rpc('decide_educator_connection', {
      p_token_hash: tokenHash,
      p_approve: body.decision === 'approve',
    });
    if (error) throw new GuardianConsentError(503, 'Your consent decision could not be saved.');
    if (decided !== true) throw new GuardianConsentError(409, 'This request has expired or was already decided.');
    const message = body.decision === 'approve'
      ? 'Your approval was recorded. The educator can now see the learner’s learning progress.'
      : 'Your decision to decline was recorded. No learner data will be shared with this educator.';
    let notificationWarning = '';
    try {
      await sendGuardianEmail({
        to: normalizeEmail(details.educatorEmail),
        subject: body.decision === 'approve'
          ? 'A family approved your Idilewa connection request'
          : 'A family declined your Idilewa connection request',
        text: body.decision === 'approve'
          ? `The parent or guardian approved your request to work with ${details.learnerAlias}. You can now view the learner's permitted progress in your educator dashboard.`
          : `The parent or guardian declined your request to work with ${details.learnerAlias}. No learner data has been shared.`,
        html: `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Idilewa connection update</title><body style="margin:0;background:#f3f6f1;color:#20372b;font:16px/1.6 Arial,Helvetica,sans-serif"><main style="max-width:600px;margin:32px auto;background:white;padding:32px;border:1px solid #e4ebe2;border-radius:18px"><p style="color:#28734d;font-weight:bold;letter-spacing:1px">IDÍLẸ́WÀ · CONNECTION UPDATE</p><h1 style="color:#173f32">${body.decision === 'approve' ? 'Connection approved' : 'Request declined'}</h1><p>The family has ${body.decision === 'approve' ? 'approved your request to work with' : 'declined your request to work with'} <strong>${escapeEmailHtml(details.learnerAlias)}</strong>.</p><p>${body.decision === 'approve' ? 'You may now view the learner’s permitted progress in your educator dashboard.' : 'No learner data has been shared with you.'}</p><p style="font-size:13px;color:#718076">With care,<br><strong>The Idilewa team</strong></p></main></body></html>`,
      });
    } catch {
      console.error('[educator/connection-approval] Decision saved but educator notification failed.');
      notificationWarning = ' Your decision was saved, but we could not email the educator.';
    }
    return sendGuardianHtml(res, 200, renderApprovalResult(`${message}${notificationWarning}`));
  } catch (error) {
    if (error instanceof GuardianConsentError) {
      return sendGuardianHtml(res, error.statusCode, renderApprovalResult(error.message));
    }
    console.error('[educator/connection-approval] Consent processing failed.');
    return sendGuardianHtml(
      res,
      500,
      renderApprovalResult('The consent decision could not be completed. Please try again later.'),
    );
  }
}

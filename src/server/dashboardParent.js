import {
  GuardianConsentError,
  readJsonBody,
  requireAuthenticatedProfile,
  sendApiFailure,
  sendApiJson,
} from './authenticatedRequest.js';
import {
  normalizeEmail,
  sendGuardianEmail,
} from './guardianConsent.js';
import { buildLearnerAnalytics } from './dashboardData.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { admin, profile } = await requireAuthenticatedProfile(req, ['parent']);
    if (req.method === 'POST') {
      const body = readJsonBody(req);
      const requestId = typeof body.connectionRequestId === 'string' ? body.connectionRequestId.trim() : '';
      if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
        throw new GuardianConsentError(400, 'Choose a valid educator connection.');
      }
      const { data: familyLinks, error: familyError } = await admin
        .from('guardian_access_requests')
        .select('id,claimed_by')
        .eq('parent_email', profile.email.toLowerCase())
        .eq('status', 'used')
        .not('claimed_by', 'is', null)
        .limit(100);
      if (familyError) throw new GuardianConsentError(503, 'Your family links could not be checked.');
      const familyChildIds = [...new Set((familyLinks || []).map((link) => link.claimed_by).filter(Boolean))];
      const familyRequestIds = new Set((familyLinks || []).map((link) => link.id));
      if (!familyChildIds.length) throw new GuardianConsentError(404, 'That approved educator connection was not found.');

      const { data: connection, error: connectionError } = await admin
        .from('educator_connection_requests')
        .select('id,child_id,guardian_request_id,educator_id')
        .eq('id', requestId)
        .eq('status', 'approved')
        .in('child_id', familyChildIds)
        .maybeSingle();
      if (connectionError) throw new GuardianConsentError(503, 'The educator connection could not be checked.');
      if (!connection || !familyRequestIds.has(connection.guardian_request_id)) {
        throw new GuardianConsentError(404, 'That approved educator connection was not found.');
      }

      const { data: educator, error: educatorError } = await admin
        .from('profiles')
        .select('name,email,role')
        .eq('id', connection.educator_id)
        .eq('role', 'educator')
        .maybeSingle();
      if (educatorError || !educator) {
        throw new GuardianConsentError(503, 'The educator notification could not be prepared.');
      }

      const { data: updated, error: updateError } = await admin
        .from('educator_connection_requests')
        .update({ status: 'withdrawn', decided_at: new Date().toISOString() })
        .eq('id', connection.id)
        .eq('status', 'approved')
        .select('id')
        .maybeSingle();
      if (updateError) throw new GuardianConsentError(503, 'Your consent withdrawal could not be saved.');
      if (!updated) throw new GuardianConsentError(409, 'This educator connection is no longer active.');
      let message = 'Consent withdrawn. The educator can no longer access this learner’s dashboard data.';
      try {
        await sendGuardianEmail({
          to: normalizeEmail(educator.email),
          subject: 'A family withdrew an Idilewa learner connection',
          text: 'A parent or guardian withdrew consent for this learner connection. The learner’s progress is no longer available in your educator dashboard.',
          html: `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Idilewa consent update</title><body style="margin:0;background:#f3f6f1;color:#20372b;font:16px/1.6 Arial,Helvetica,sans-serif"><main style="max-width:600px;margin:32px auto;background:white;padding:32px;border:1px solid #e4ebe2;border-radius:18px"><p style="color:#28734d;font-weight:bold;letter-spacing:1px">IDÍLẸ́WÀ · CONSENT UPDATE</p><h1 style="color:#173f32">Connection ended</h1><p>A parent or guardian withdrew consent for a learner connection. The learner’s progress is no longer available in your educator dashboard.</p><p style="font-size:13px;color:#718076">With care,<br><strong>The Idilewa team</strong></p></main></body></html>`,
        });
      } catch {
        console.error('[dashboard/parent] Consent withdrawn but educator notification failed.');
        message += ' The change is saved, but we could not email the educator.';
      }
      return sendApiJson(res, 200, { message });
    }

    const { data: guardianRequests, error: requestError } = await admin
      .from('guardian_access_requests')
      .select('id,learner_alias,claimed_by,created_at')
      .eq('parent_email', profile.email.toLowerCase())
      .eq('status', 'used')
      .not('claimed_by', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);
    if (requestError) throw new GuardianConsentError(503, 'Family links could not be loaded.');

    const childIds = [...new Set((guardianRequests || []).map((row) => row.claimed_by).filter(Boolean))];
    const { data: managedProfiles, error: managedProfilesError } = await admin.from('children')
      .select('id,name,age_group,preferred_languages,learning_interests,status,created_at')
      .eq('parent_user_id', profile.id)
      .in('status', ['pending_consent', 'active'])
      .order('created_at', { ascending: false })
      .limit(4);
    if (managedProfilesError) throw new GuardianConsentError(503, 'Parent-managed child profiles could not be loaded.');
    const [
      { data: subscriptions, error: subscriptionError },
      { data: payments, error: paymentError },
    ] = await Promise.all([
      admin.from('subscriptions')
        .select('id,plan,billing_period,status,current_period_start,current_period_end,cancel_at_period_end,created_at')
        .eq('parent_user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      admin.from('payments')
        .select('id,plan,billing_period,amount_kobo,currency,status,receipt_status,paid_at,created_at')
        .eq('parent_user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);
    if (subscriptionError || paymentError) {
      throw new GuardianConsentError(503, 'Subscription and payment history could not be loaded.');
    }
    const billing = { subscriptions: subscriptions || [], payments: payments || [] };
    const managedChildren = (managedProfiles || []).map((child) => ({
      id: child.id,
      name: child.name,
      ageGroup: child.age_group,
      preferredLanguages: child.preferred_languages || [],
      learningInterests: child.learning_interests || [],
      profileStatus: child.status,
      managedProfile: true,
      points: 0,
      streak: 0,
      completedLessons: 0,
      codingSessions: 0,
      voicePractices: 0,
      averageVoiceScore: null,
    }));
    if (!childIds.length) {
      return sendApiJson(res, 200, { children: managedChildren, connectionRequests: [], billing });
    }

    const now = new Date().toISOString();
    const { error: expiryError } = await admin
      .from('educator_connection_requests')
      .update({ status: 'expired', decided_at: now })
      .in('child_id', childIds)
      .eq('status', 'pending')
      .lte('expires_at', now);
    if (expiryError) throw new GuardianConsentError(503, 'Family consent request status could not be updated.');

    const [
      { data: profiles, error: profilesError },
      { data: progress, error: progressError },
      { data: codeSubmissions, error: codeError },
      { data: voiceSubmissions, error: voiceError },
      { data: connectionRequests, error: connectionsError },
    ] = await Promise.all([
      admin.from('profiles')
        .select('id,name,role,points,streak,created_at,parent_consent_request_id')
        .in('id', childIds)
        .eq('role', 'child'),
      admin.from('progress')
        .select('user_id,lesson_type,lesson_id,completed_at')
        .in('user_id', childIds)
        .order('completed_at', { ascending: false })
        .limit(2_000),
      admin.from('code_submissions')
        .select('user_id,created_at')
        .in('user_id', childIds)
        .limit(2_000),
      admin.from('voice_submissions')
        .select('user_id,audio_score,created_at')
        .in('user_id', childIds)
        .limit(2_000),
      admin.from('educator_connection_requests')
        .select('id,child_id,educator_id,status,created_at')
        .in('child_id', childIds)
        .in('status', ['pending', 'approved', 'declined', 'withdrawn', 'expired'])
        .order('created_at', { ascending: false })
        .limit(200),
    ]);
    if (profilesError || progressError || codeError || voiceError || connectionsError) {
      throw new GuardianConsentError(503, 'Family learning analytics could not be loaded.');
    }

    const guardianByChild = new Map(guardianRequests.map((request) => [request.claimed_by, request]));
    const validLearners = (profiles || []).filter((learner) => {
      const guardian = guardianByChild.get(learner.id);
      return guardian && learner.parent_consent_request_id === guardian.id;
    });
    const metrics = buildLearnerAnalytics({
      learners: validLearners,
      progress: progress || [],
      codeSubmissions: codeSubmissions || [],
      voiceSubmissions: voiceSubmissions || [],
    });
    const aliases = new Map(guardianRequests.map((request) => [request.claimed_by, request.learner_alias]));
    const children = [
      ...metrics.map((child) => ({ ...child, name: aliases.get(child.id) || 'Learner' })),
      ...managedChildren,
    ];

    const educatorIds = [...new Set((connectionRequests || []).map((request) => request.educator_id))];
    let educators = [];
    if (educatorIds.length) {
      const { data, error } = await admin
        .from('profiles')
        .select('id,name,role')
        .in('id', educatorIds);
      if (error) throw new GuardianConsentError(503, 'Consent requests could not be loaded.');
      educators = (data || []).filter((educator) => educator.role === 'educator');
    }
    const educatorNames = new Map(educators.map((educator) => [educator.id, educator.name || 'Educator']));
    const childNames = new Map(children.map((child) => [child.id, child.name]));
    const safeRequests = (connectionRequests || [])
      .filter((request) => childNames.has(request.child_id))
      .map((request) => ({
        id: request.id,
        learner: childNames.get(request.child_id),
        educator: educatorNames.get(request.educator_id) || 'Educator',
        status: request.status,
        requestedAt: request.created_at,
      }));

    return sendApiJson(res, 200, { children, connectionRequests: safeRequests, billing });
  } catch (error) {
    return sendApiFailure(res, error, 'dashboard/parent');
  }
}

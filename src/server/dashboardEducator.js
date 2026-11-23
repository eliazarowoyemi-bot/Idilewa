import {
  GuardianConsentError,
  requireAuthenticatedProfile,
  sendApiFailure,
  sendApiJson,
} from './authenticatedRequest.js';
import { buildLearnerAnalytics } from './dashboardData.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { admin, profile } = await requireAuthenticatedProfile(req, ['educator']);
    const now = new Date().toISOString();
    const { error: expiryError } = await admin
      .from('educator_connection_requests')
      .update({ status: 'expired', decided_at: now })
      .eq('educator_id', profile.id)
      .eq('status', 'pending')
      .lte('expires_at', now);
    if (expiryError) throw new GuardianConsentError(503, 'Your learner connection status could not be updated.');

    const { data: connections, error: connectionError } = await admin
      .from('educator_connection_requests')
      .select('id,child_id,guardian_request_id,status,created_at')
      .eq('educator_id', profile.id)
      .in('status', ['pending', 'approved', 'declined', 'withdrawn', 'expired'])
      .order('created_at', { ascending: false })
      .limit(200);
    if (connectionError) throw new GuardianConsentError(503, 'Your learner connections could not be loaded.');

    const requestIds = [...new Set((connections || []).map((item) => item.guardian_request_id))];
    let guardianRequests = [];
    if (requestIds.length) {
      const { data, error } = await admin
        .from('guardian_access_requests')
        .select('id,learner_alias,status,claimed_by')
        .in('id', requestIds);
      if (error) throw new GuardianConsentError(503, 'Connection consent details could not be loaded.');
      guardianRequests = data || [];
    }
    const guardianById = new Map(guardianRequests.map((request) => [request.id, request]));
    const validConnections = (connections || []).filter((connection) => {
      const guardian = guardianById.get(connection.guardian_request_id);
      return guardian?.status === 'used' && guardian.claimed_by === connection.child_id;
    });
    const approved = validConnections.filter((item) => item.status === 'approved');
    const childIds = [...new Set(approved.map((item) => item.child_id))];
    let learnerProfiles = [];
    let progress = [];
    let codeSubmissions = [];
    let voiceSubmissions = [];
    if (childIds.length) {
      const { data: profiles, error: profilesError } = await admin.from('profiles')
        .select('id,name,role,points,streak,created_at,parent_consent_request_id')
        .in('id', childIds)
        .eq('role', 'child');
      if (profilesError) throw new GuardianConsentError(503, 'Learner accounts could not be checked.');
      const validProfiles = (profiles || []).filter((learner) =>
        approved.some((connection) => connection.child_id === learner.id
          && connection.guardian_request_id === learner.parent_consent_request_id));
      const authorizedChildIds = validProfiles.map((learner) => learner.id);
      if (authorizedChildIds.length) {
        const [
          { data: progressRows, error: progressError },
          { data: codeRows, error: codeError },
          { data: voiceRows, error: voiceError },
        ] = await Promise.all([
          admin.from('progress')
            .select('user_id,lesson_type,lesson_id,completed_at')
            .in('user_id', authorizedChildIds)
            .order('completed_at', { ascending: false })
            .limit(2_000),
          admin.from('code_submissions')
            .select('user_id,created_at')
            .in('user_id', authorizedChildIds)
            .limit(2_000),
          admin.from('voice_submissions')
            .select('user_id,audio_score,created_at')
            .in('user_id', authorizedChildIds)
            .limit(2_000),
        ]);
        if (progressError || codeError || voiceError) {
          throw new GuardianConsentError(503, 'Learner analytics could not be loaded.');
        }
        progress = progressRows || [];
        codeSubmissions = codeRows || [];
        voiceSubmissions = voiceRows || [];
      }
      learnerProfiles = validProfiles;
    }

    const learnerNames = new Map(guardianRequests.map((request) => [request.claimed_by, request.learner_alias]));
    const analytics = buildLearnerAnalytics({
      learners: learnerProfiles,
      progress,
      codeSubmissions,
      voiceSubmissions,
    }).map((learner) => ({ ...learner, name: learnerNames.get(learner.id) || 'Learner' }));
    const learnerById = new Map(analytics.map((learner) => [learner.id, learner]));

    return sendApiJson(res, 200, {
      educator: { name: profile.name || 'Educator' },
      learners: analytics,
      requests: validConnections.map((connection) => ({
        id: connection.id,
        learner: learnerNames.get(connection.child_id) || 'Learner',
        status: connection.status,
        requestedAt: connection.created_at,
        ...(connection.status === 'approved' ? {
          completedLessons: learnerById.get(connection.child_id)?.completedLessons || 0,
          codingSessions: learnerById.get(connection.child_id)?.codingSessions || 0,
          voicePractices: learnerById.get(connection.child_id)?.voicePractices || 0,
          averageVoiceScore: learnerById.get(connection.child_id)?.averageVoiceScore ?? null,
        } : {}),
      })),
    });
  } catch (error) {
    return sendApiFailure(res, error, 'dashboard/educator');
  }
}

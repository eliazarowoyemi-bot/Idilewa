import { GuardianConsentError } from './guardianConsent.js';

export const FAMILY_TASK_LANGUAGES = Object.freeze([
  'Yorùbá',
  'Igbo',
  'Hausa',
  'Kiswahili',
  'Nigerian Pidgin',
  'English',
]);

export const FAMILY_REWARDS = Object.freeze([
  { code: 'play', name: 'Extra playtime', minutes: 15, points: 50 },
  { code: 'screen', name: 'Extra screen time', minutes: 20, points: 100 },
  { code: 'story', name: 'Choose a story', minutes: 0, points: 40 },
  { code: 'family', name: 'Choose a family activity', minutes: 0, points: 75 },
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireInteger(value, minimum, maximum, message) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new GuardianConsentError(400, message);
  }
  return parsed;
}

export function normalizeFamilyTask(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 120) {
    throw new GuardianConsentError(400, 'Enter a task title of 1 to 120 characters.');
  }
  const language = typeof body.language === 'string' ? body.language : '';
  if (!FAMILY_TASK_LANGUAGES.includes(language)) {
    throw new GuardianConsentError(400, 'Choose a supported task language.');
  }
  const repeat = typeof body.repeat === 'string' ? body.repeat : 'None';
  if (!['None', 'Daily', 'Weekly'].includes(repeat)) {
    throw new GuardianConsentError(400, 'Choose a supported repeat schedule.');
  }
  const dueValue = typeof body.dueAt === 'string' ? body.dueAt.trim() : '';
  let dueAt = null;
  if (dueValue) {
    const parsedDate = new Date(dueValue);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new GuardianConsentError(400, 'Enter a valid task due date.');
    }
    dueAt = parsedDate.toISOString();
  }
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (description.length > 500) {
    throw new GuardianConsentError(400, 'Task details must be 500 characters or fewer.');
  }

  return {
    title,
    description,
    language,
    points: requireInteger(body.points ?? 20, 0, 500, 'Reward points must be between 0 and 500.'),
    due_at: dueAt,
    repeat_rule: repeat,
  };
}

export function normalizeFamilyRewardSettings(body) {
  return {
    points_per_minute: requireInteger(
      body.pointsPerMinute,
      1,
      100,
      'Points per minute must be between 1 and 100.',
    ),
    daily_limit: requireInteger(
      body.dailyLimit,
      0,
      240,
      'The daily reward limit must be between 0 and 240 minutes.',
    ),
  };
}

export function requireFamilyTaskId(value) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new GuardianConsentError(400, 'Choose a valid family task.');
  }
  return value;
}

export function requireFamilyChildId(value) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new GuardianConsentError(400, 'Choose a valid family learner.');
  }
  return value;
}

export function requireFamilyReward(value) {
  const reward = FAMILY_REWARDS.find((item) => item.code === value);
  if (!reward) throw new GuardianConsentError(400, 'Choose an available reward.');
  return reward;
}

export async function resolveFamilyContext(admin, profile) {
  if (profile.role === 'parent') {
    const { data: requests, error: requestsError } = await admin
      .from('guardian_access_requests')
      .select('id,learner_alias,claimed_by')
      .eq('parent_email', String(profile.email || '').trim().toLowerCase())
      .eq('status', 'used')
      .not('claimed_by', 'is', null)
      .limit(100);
    if (requestsError) {
      throw new GuardianConsentError(503, 'Your approved family links could not be checked.');
    }

    const requestByChild = new Map(
      (requests || []).filter((request) => request.claimed_by).map((request) => [request.claimed_by, request]),
    );
    const childIds = [...requestByChild.keys()];
    if (!childIds.length) return { parentId: profile.id, children: [] };

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id,role,points,parent_consent_request_id')
      .in('id', childIds)
      .eq('role', 'child');
    if (profilesError) {
      throw new GuardianConsentError(503, 'Your approved family learners could not be loaded.');
    }
    const children = (profiles || [])
      .filter((child) => requestByChild.get(child.id)?.id === child.parent_consent_request_id)
      .map((child) => ({
        id: child.id,
        name: requestByChild.get(child.id)?.learner_alias || 'Learner',
        points: Number(child.points) || 0,
      }));
    return { parentId: profile.id, children };
  }

  if (profile.role === 'child') {
    if (!profile.parent_consent_request_id) {
      throw new GuardianConsentError(403, 'A verified parent or guardian is required to open family tasks.');
    }
    const { data: request, error: requestError } = await admin
      .from('guardian_access_requests')
      .select('id,parent_email,learner_alias,claimed_by')
      .eq('id', profile.parent_consent_request_id)
      .eq('claimed_by', profile.id)
      .eq('status', 'used')
      .maybeSingle();
    if (requestError) {
      throw new GuardianConsentError(503, 'Your family approval could not be checked.');
    }
    if (!request) {
      throw new GuardianConsentError(403, 'A verified parent or guardian is required to open family tasks.');
    }
    const { data: parent, error: parentError } = await admin
      .from('profiles')
      .select('id,role')
      .eq('email', String(request.parent_email || '').trim().toLowerCase())
      .eq('role', 'parent')
      .maybeSingle();
    if (parentError) {
      throw new GuardianConsentError(503, 'Your family account could not be checked.');
    }
    if (!parent) {
      throw new GuardianConsentError(403, 'A verified parent account is required to open family tasks.');
    }
    return {
      parentId: parent.id,
      children: [{ id: profile.id, name: request.learner_alias || 'Learner', points: Number(profile.points) || 0 }],
    };
  }

  if (profile.role === 'adult') {
    return {
      parentId: profile.id,
      children: [{ id: profile.id, name: profile.name || 'My tasks', points: Number(profile.points) || 0 }],
    };
  }

  throw new GuardianConsentError(403, 'This account cannot open family tasks.');
}

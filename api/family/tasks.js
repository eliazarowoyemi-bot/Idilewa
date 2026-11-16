import {
  GuardianConsentError,
  readJsonBody,
  requireAuthenticatedProfile,
  sendApiFailure,
  sendApiJson,
} from '../../src/server/authenticatedRequest.js';
import {
  FAMILY_REWARDS,
  normalizeFamilyRewardSettings,
  normalizeFamilyTask,
  requireFamilyChildId,
  requireFamilyReward,
  requireFamilyTaskId,
  resolveFamilyContext,
} from '../../src/server/familyTasks.js';

const taskColumns = 'id,parent_id,child_id,owner_role,title,description,language,points,due_at,repeat_rule,status,feedback,minutes_tracked,started_at,created_at,submitted_at,completed_at';
const rewardColumns = 'id,parent_id,child_id,reward_code,name,points,extra_minutes,status,created_at,decided_at';

function failDatabase(error, message) {
  if (error?.message?.includes('FAMILY_TASK_CONFLICT')) {
    throw new GuardianConsentError(409, 'That item has changed. Refresh the page and try again.');
  }
  if (error?.message?.includes('FAMILY_DAILY_LIMIT')) {
    throw new GuardianConsentError(409, 'The daily extra-time limit would be exceeded.');
  }
  if (error?.message?.includes('FAMILY_INSUFFICIENT_POINTS')) {
    throw new GuardianConsentError(409, 'There are not enough available points for that reward.');
  }
  if (error?.message?.includes('FAMILY_ACCESS_DENIED')) {
    throw new GuardianConsentError(403, 'This action is not available for your family account.');
  }
  throw new GuardianConsentError(503, message);
}

function withChildName(row, childrenById) {
  return { ...row, child_name: childrenById.get(row.child_id)?.name || 'Learner' };
}

async function loadSnapshot(admin, profile, context) {
  const childrenById = new Map(context.children.map((child) => [child.id, child]));
  const childIds = [...childrenById.keys()];
  const canList = profile.role === 'adult' || childIds.length > 0;
  let tasks = [];
  let rewards = [];
  if (canList) {
    let taskQuery = admin.from('family_tasks').select(taskColumns)
      .eq('parent_id', context.parentId)
      .order('created_at', { ascending: false })
      .limit(250);
    if (profile.role === 'parent') {
      taskQuery = taskQuery.in('child_id', childIds).eq('owner_role', 'child');
    } else {
      taskQuery = taskQuery.eq('child_id', profile.id);
    }
    const { data: taskRows, error: taskError } = await taskQuery;
    if (taskError) throw new GuardianConsentError(503, 'Family tasks could not be loaded.');
    tasks = (taskRows || []).map((row) => withChildName(row, childrenById));

    if (profile.role !== 'adult') {
      let rewardQuery = admin.from('family_reward_requests').select(rewardColumns)
        .eq('parent_id', context.parentId)
        .order('created_at', { ascending: false })
        .limit(100);
      rewardQuery = profile.role === 'parent'
        ? rewardQuery.in('child_id', childIds)
        : rewardQuery.eq('child_id', profile.id);
      const { data: rewardRows, error: rewardError } = await rewardQuery;
      if (rewardError) throw new GuardianConsentError(503, 'Family rewards could not be loaded.');
      rewards = (rewardRows || []).map((row) => withChildName(row, childrenById));
    }
  }

  let settings = { points_per_minute: 5, daily_limit: 30 };
  if (profile.role !== 'adult') {
    const { data, error } = await admin.from('family_reward_settings')
      .select('points_per_minute,daily_limit')
      .eq('parent_id', context.parentId)
      .maybeSingle();
    if (error) throw new GuardianConsentError(503, 'Family reward settings could not be loaded.');
    if (data) settings = data;
  }

  return {
    role: profile.role,
    children: context.children,
    points: Number(profile.points) || 0,
    tasks,
    rewards,
    settings,
    availableRewards: FAMILY_REWARDS.map((reward) => ({
      ...reward,
      points: reward.minutes ? reward.minutes * settings.points_per_minute : reward.points,
    })),
  };
}

function requireRole(profile, role) {
  if (profile.role !== role) {
    throw new GuardianConsentError(403, 'This action is not available for your account.');
  }
}

async function createTask(admin, profile, context, body) {
  let childId;
  let ownerRole;
  if (profile.role === 'parent') {
    childId = requireFamilyChildId(body.childId);
    if (!context.children.some((child) => child.id === childId)) {
      throw new GuardianConsentError(404, 'That learner is not linked to this family account.');
    }
    ownerRole = 'child';
  } else if (profile.role === 'adult') {
    childId = profile.id;
    ownerRole = 'adult';
  } else {
    throw new GuardianConsentError(403, 'Only a parent or adult can create family tasks.');
  }

  const task = normalizeFamilyTask(body);
  const { data, error } = await admin.from('family_tasks')
    .insert({
      ...task,
      parent_id: context.parentId,
      child_id: childId,
      owner_role: ownerRole,
    })
    .select(taskColumns)
    .single();
  if (error || !data) {
    throw new GuardianConsentError(503, 'The family task could not be saved.');
  }
}

async function updateTask(admin, profile, context, body) {
  const id = requireFamilyTaskId(body.taskId);
  const task = normalizeFamilyTask(body);
  let query = admin.from('family_tasks').update({
    ...task,
    updated_at: new Date().toISOString(),
  })
    .eq('id', id)
    .eq('parent_id', context.parentId)
    .eq('status', 'assigned');
  if (profile.role === 'parent') {
    const childIds = context.children.map((child) => child.id);
    if (!childIds.length) throw new GuardianConsentError(404, 'That family task could not be found.');
    query = query.in('child_id', childIds).eq('owner_role', 'child');
  } else if (profile.role === 'adult') {
    query = query.eq('child_id', profile.id).eq('owner_role', 'adult');
  } else {
    throw new GuardianConsentError(403, 'Only a parent or adult can edit family tasks.');
  }
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw new GuardianConsentError(503, 'The family task could not be updated.');
  if (!data) throw new GuardianConsentError(409, 'Only an assigned task can be edited.');
}

async function deleteTask(admin, profile, context, body) {
  const id = requireFamilyTaskId(body.taskId);
  let query = admin.from('family_tasks').delete()
    .eq('id', id)
    .eq('parent_id', context.parentId)
    .eq('status', 'assigned');
  if (profile.role === 'parent') {
    const childIds = context.children.map((child) => child.id);
    if (!childIds.length) throw new GuardianConsentError(404, 'That family task could not be found.');
    query = query.in('child_id', childIds).eq('owner_role', 'child');
  } else if (profile.role === 'adult') {
    query = query.eq('child_id', profile.id).eq('owner_role', 'adult');
  } else {
    throw new GuardianConsentError(403, 'Only a parent or adult can delete family tasks.');
  }
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw new GuardianConsentError(503, 'The family task could not be deleted.');
  if (!data) throw new GuardianConsentError(409, 'Only an assigned task can be deleted.');
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return sendApiJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { admin, profile } = await requireAuthenticatedProfile(req, ['parent', 'child', 'adult']);
    const context = await resolveFamilyContext(admin, profile);
    if (req.method === 'GET') {
      return sendApiJson(res, 200, await loadSnapshot(admin, profile, context));
    }

    const body = readJsonBody(req);
    if (req.method === 'POST') {
      if (body.type === 'task') {
        await createTask(admin, profile, context, body);
        return sendApiJson(res, 201, { message: 'Task saved.' });
      }
      if (body.type === 'reward-settings') {
        requireRole(profile, 'parent');
        const settings = normalizeFamilyRewardSettings(body);
        const { error } = await admin.from('family_reward_settings').upsert({
          parent_id: profile.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'parent_id' });
        if (error) throw new GuardianConsentError(503, 'Family reward settings could not be saved.');
        return sendApiJson(res, 200, { message: 'Reward settings saved.' });
      }
      if (body.type === 'reward') {
        requireRole(profile, 'child');
        const reward = requireFamilyReward(body.code);
        const { data, error } = await admin.rpc('request_family_reward', {
          p_parent_id: context.parentId,
          p_child_id: profile.id,
          p_reward_code: reward.code,
        });
        if (error) failDatabase(error, 'The reward request could not be saved.');
        return sendApiJson(res, 201, { reward: data });
      }
      throw new GuardianConsentError(400, 'Choose a supported family task action.');
    }

    if (body.action === 'start' || body.action === 'pause' || body.action === 'submit'
      || (profile.role === 'adult' && body.action === 'complete')) {
      if (!['child', 'adult'].includes(profile.role)) {
        throw new GuardianConsentError(403, 'Only the assigned learner can update this task.');
      }
      const { data, error } = await admin.rpc('transition_family_task', {
        p_task_id: requireFamilyTaskId(body.taskId),
        p_user_id: profile.id,
        p_action: body.action,
      });
      if (error) failDatabase(error, 'The task could not be updated.');
      return sendApiJson(res, 200, { task: data });
    }
    if (body.action === 'approve' || body.action === 'revise') {
      requireRole(profile, 'parent');
      const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';
      if (body.action === 'revise' && (!feedback || feedback.length > 500)) {
        throw new GuardianConsentError(400, 'Add feedback of 1 to 500 characters.');
      }
      const { data, error } = await admin.rpc('decide_family_task', {
        p_task_id: requireFamilyTaskId(body.taskId),
        p_parent_id: profile.id,
        p_decision: body.action,
        p_feedback: body.action === 'revise' ? feedback : null,
      });
      if (error) failDatabase(error, 'The task decision could not be saved.');
      return sendApiJson(res, 200, { task: data });
    }
    if (body.action === 'edit') {
      await updateTask(admin, profile, context, body);
      return sendApiJson(res, 200, { message: 'Task updated.' });
    }
    if (body.action === 'delete') {
      await deleteTask(admin, profile, context, body);
      return sendApiJson(res, 200, { message: 'Task deleted.' });
    }
    if (body.action === 'decide-reward') {
      requireRole(profile, 'parent');
      if (!['approve', 'reject'].includes(body.decision)) {
        throw new GuardianConsentError(400, 'Choose whether to approve or decline this reward.');
      }
      const { data, error } = await admin.rpc('decide_family_reward', {
        p_reward_id: requireFamilyTaskId(body.rewardId),
        p_parent_id: profile.id,
        p_decision: body.decision,
      });
      if (error) failDatabase(error, 'The reward decision could not be saved.');
      return sendApiJson(res, 200, { reward: data });
    }
    throw new GuardianConsentError(400, 'Choose a supported family task action.');
  } catch (error) {
    return sendApiFailure(res, error, 'family/tasks');
  }
}

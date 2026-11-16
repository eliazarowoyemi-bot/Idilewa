import { signOut, supabase, isSupabaseConfigured } from './supabaseClient.js';

const main = document.getElementById('familyTaskMain');
const navigation = document.getElementById('familyTaskNavigation');
const roleLabel = document.getElementById('familyTaskRole');
const signOutButton = document.querySelector('[data-action="sign-out"]');
const state = {
  data: null,
  view: 'tasks',
  filter: 'all',
  editTaskId: '',
  revisingId: '',
  message: '',
  messageIsError: false,
  authRequired: false,
  loading: true,
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

function formatDate(value) {
  if (!value) return 'No due date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No due date' : date.toLocaleString();
}

function taskStatus(task) {
  if (task.status === 'assigned' && task.due_at && new Date(task.due_at) < new Date()) return 'Overdue';
  return {
    assigned: 'Assigned',
    in_progress: 'In progress',
    submitted: 'Awaiting approval',
    completed: 'Completed',
  }[task.status] || 'Assigned';
}

function trackedMinutes(task) {
  const elapsed = task.started_at
    ? Math.max(0, Math.floor((Date.now() - new Date(task.started_at).getTime()) / 60_000))
    : 0;
  return (Number(task.minutes_tracked) || 0) + elapsed;
}

function setMessage(message, isError = false) {
  state.message = message;
  state.messageIsError = isError;
}

async function requestApi(method = 'GET', body) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Account storage is not configured. Please contact Idilewa support.');
  }
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error('Your sign-in session could not be checked. Refresh and try again.');
  const token = sessionData.session?.access_token;
  if (!token) {
    const error = new Error('Sign in to open family tasks.');
    error.authRequired = true;
    throw error;
  }

  const response = await fetch('/api/guardian/family-tasks', {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('The family task service returned an invalid response.', { cause: error });
  }
  if (!response.ok) {
    const apiError = new Error(typeof result.error === 'string'
      ? result.error
      : 'The family task request could not be completed.');
    apiError.authRequired = response.status === 401;
    throw apiError;
  }
  return result;
}

function noticeMarkup() {
  if (!state.message) return '';
  return `<p class="ft-notice${state.messageIsError ? ' is-error' : ''}" role="${state.messageIsError ? 'alert' : 'status'}">${escapeHtml(state.message)}</p>`;
}

function renderNavigation() {
  const isAuthenticated = Boolean(state.data);
  navigation.hidden = !isAuthenticated;
  signOutButton.hidden = !isAuthenticated;
  if (!isAuthenticated) return;

  const links = [['tasks', 'Tasks']];
  if (state.data?.role === 'parent' || state.data?.role === 'adult') links.push(['create', 'Create task']);
  if (state.data?.role !== 'adult') links.push(['rewards', 'Rewards']);
  navigation.innerHTML = links.map(([view, label]) => `
    <button class="ft-nav-button" type="button" data-view="${view}" ${state.view === view ? 'aria-current="page"' : ''}>
      ${label}
    </button>`).join('');
}

function pageHeading(title, description, action = '') {
  return `<header class="ft-page-heading"><div><h1>${title}</h1><p>${description}</p></div>${action}</header>`;
}

function emptyState(title, description) {
  return `<div class="ft-empty"><strong>${escapeHtml(title)}</strong>${escapeHtml(description)}</div>`;
}

function taskActions(task) {
  const role = state.data.role;
  const buttons = [];
  if (role === 'parent' && task.status === 'submitted') {
    buttons.push(`<button class="ft-button" type="button" data-action="approve" data-id="${escapeHtml(task.id)}">Approve and award ${Number(task.points) || 0} points</button>`);
    buttons.push(`<button class="ft-button ft-button-quiet" type="button" data-action="revise" data-id="${escapeHtml(task.id)}">Request changes</button>`);
  } else if (role === 'parent' && task.status === 'assigned') {
    buttons.push(`<button class="ft-button ft-button-quiet" type="button" data-action="edit" data-id="${escapeHtml(task.id)}">Edit</button>`);
    buttons.push(`<button class="ft-button ft-button-danger" type="button" data-action="delete" data-id="${escapeHtml(task.id)}">Delete</button>`);
  } else if (role === 'child' && ['assigned', 'in_progress'].includes(task.status)) {
    if (task.status === 'assigned' || !task.started_at) {
      buttons.push(`<button class="ft-button ft-button-quiet" type="button" data-action="start" data-id="${escapeHtml(task.id)}">${task.status === 'assigned' ? 'Start task' : 'Resume timer'}</button>`);
    } else {
      buttons.push(`<button class="ft-button ft-button-quiet" type="button" data-action="pause" data-id="${escapeHtml(task.id)}">Pause timer</button>`);
    }
    buttons.push(`<button class="ft-button" type="button" data-action="submit" data-id="${escapeHtml(task.id)}">Mark finished</button>`);
  } else if (role === 'adult' && ['assigned', 'in_progress'].includes(task.status)) {
    if (task.status === 'assigned') {
      buttons.push(`<button class="ft-button ft-button-quiet" type="button" data-action="start" data-id="${escapeHtml(task.id)}">Start task</button>`);
    }
    buttons.push(`<button class="ft-button" type="button" data-action="complete" data-id="${escapeHtml(task.id)}">Mark complete</button>`);
  }
  if (state.revisingId === task.id) {
    buttons.push(`<form class="ft-revision-form" data-form="revision" data-id="${escapeHtml(task.id)}">
      <label class="ft-field">Feedback for the learner<textarea name="feedback" maxlength="500" required placeholder="What should they review?"></textarea></label>
      <div class="ft-actions"><button class="ft-button" type="submit">Send feedback</button><button class="ft-button ft-button-quiet" type="button" data-action="cancel-revision">Cancel</button></div>
    </form>`);
  }
  return buttons.length ? `<div class="ft-actions">${buttons.join('')}</div>` : '';
}

function renderTask(task) {
  const status = taskStatus(task);
  const statusClass = task.status === 'submitted' ? 'is-submitted' : task.status === 'completed' ? 'is-completed' : '';
  const description = task.description
    ? `<p>${escapeHtml(task.description)}</p>`
    : '';
  const owner = state.data.role === 'parent' ? `<span>For ${escapeHtml(task.child_name)}</span> · ` : '';
  const due = task.due_at ? ` · Due ${escapeHtml(formatDate(task.due_at))}` : '';
  const repeat = task.repeat_rule && task.repeat_rule !== 'None' ? ` · ${escapeHtml(task.repeat_rule)}` : '';
  const feedback = task.feedback ? `<p class="ft-task-feedback"><strong>Feedback:</strong> ${escapeHtml(task.feedback)}</p>` : '';
  return `<article class="ft-task">
    <div class="ft-task-heading"><h3>${escapeHtml(task.title)}</h3><span class="ft-task-status ${statusClass}">${status}</span></div>
    ${description}
    <p class="ft-task-details">${owner}${escapeHtml(task.language)} · ${trackedMinutes(task)} min tracked · ${Number(task.points) || 0} points${repeat}${due}</p>
    ${feedback}
    ${taskActions(task)}
  </article>`;
}

function filteredTasks() {
  const tasks = state.data.tasks || [];
  if (state.filter === 'all') return tasks;
  if (state.filter === 'open') return tasks.filter((task) => ['assigned', 'in_progress'].includes(task.status));
  return tasks.filter((task) => task.status === state.filter);
}

function renderTaskPage() {
  const role = state.data.role;
  const title = role === 'parent' ? 'Keep family routines moving.' : role === 'adult' ? 'Make room for your own goals.' : 'Small steps add up.';
  const description = role === 'parent'
    ? 'Create a task, follow submissions, and approve points only when you are ready.'
    : role === 'adult'
      ? 'Keep personal learning tasks together and track the time you spend.'
      : 'Work through your tasks at your own pace. Points arrive after your parent approves completed work.';
  const pending = state.data.tasks.filter((task) => task.status === 'submitted').length;
  const statusText = role === 'parent'
    ? `${state.data.children.length} linked learner${state.data.children.length === 1 ? '' : 's'} · ${pending} task${pending === 1 ? '' : 's'} awaiting your review`
    : `${state.data.tasks.length} task${state.data.tasks.length === 1 ? '' : 's'} in your family space`;
  const filters = [
    ['all', 'All tasks'],
    ['open', 'In progress'],
    ['submitted', 'Awaiting approval'],
    ['completed', 'Completed'],
  ].map(([filter, label]) => `<button class="ft-filter" type="button" data-filter="${filter}" aria-pressed="${state.filter === filter}">${label}</button>`).join('');
  const tasks = filteredTasks();
  const taskContent = tasks.length ? tasks.map(renderTask).join('') : emptyState(
    state.data.tasks.length ? 'No tasks in this view' : 'No tasks yet',
    role === 'parent' ? 'Create the first task for a linked learner.' : 'Your parent or guardian can add a task for you here.',
  );
  const childrenMarkup = role === 'parent'
    ? `<section class="ft-section"><h2>Linked learners</h2>${state.data.children.length
      ? state.data.children.map((child) => `<div class="ft-child-row"><span><strong>${escapeHtml(child.name)}</strong><small>Family points</small></span><strong>${Number(child.points) || 0}</strong></div>`).join('')
      : emptyState('No linked learners yet', 'Complete family approval in the parent portal before assigning tasks.')}</section>`
    : `<section class="ft-section"><h2>Your points</h2><p><strong>${Number(state.data.points) || 0}</strong> points are available. Points for a task are added only after parent approval.</p></section>`;
  const aside = role === 'parent'
    ? `${childrenMarkup}<section class="ft-section"><h2>Family approvals</h2><p>Submitted tasks appear here for your review. Approving a task awards its points once; requesting changes returns it to the learner’s task list.</p></section>`
    : `${childrenMarkup}<section class="ft-section"><h2>Need help?</h2><p>Ask your parent or guardian if a task needs to change. Only your approved family account can see these tasks.</p></section>`;
  return `${noticeMarkup()}${pageHeading(title, description, role !== 'child' ? '<button class="ft-button" type="button" data-view="create">Create a task</button>' : '')}
    <div class="ft-layout-grid"><section class="ft-section"><p class="ft-summary">${escapeHtml(statusText)}</p>
      <div class="ft-filter-row" aria-label="Filter family tasks">${filters}</div>
      <div class="ft-task-list">${taskContent}</div>
    </section><aside>${aside}</aside></div>`;
}

function taskFormMarkup(task = null) {
  const role = state.data.role;
  const editing = Boolean(task);
  const children = state.data.children || [];
  const assignedChildId = editing ? task.child_id : children[0]?.id || '';
  const childSelector = role === 'parent'
    ? `<label class="ft-field">Assign to<select name="childId" required>${children.map((child) => `<option value="${escapeHtml(child.id)}" ${child.id === assignedChildId ? 'selected' : ''}>${escapeHtml(child.name)}</option>`).join('')}</select></label>`
    : '';
  const dueAt = task?.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : '';
  return `${noticeMarkup()}${pageHeading(editing ? 'Update this task.' : 'Create a family task.', 'Give the task a clear name, a language, and a point value. Child tasks always require parent approval.')}
    ${role === 'parent' && !children.length ? `<section class="ft-section">${emptyState('Family approval is needed first', 'Link a learner in the parent portal before creating tasks.')}<p><a class="ft-button" href="/parents.html#/parent-children">Open family portal</a></p></section>` : `
    <section class="ft-section"><form class="ft-form" data-form="task">
      <input type="hidden" name="taskId" value="${escapeHtml(task?.id || '')}" />
      <div class="ft-fields">
        <label class="ft-field ft-field-full">Task title<input name="title" maxlength="120" required value="${escapeHtml(task?.title || '')}" placeholder="Read a story together" /></label>
        ${childSelector}
        <label class="ft-field">Language<select name="language" required>${['Yorùbá', 'Igbo', 'Hausa', 'Kiswahili', 'Nigerian Pidgin', 'English'].map((language) => `<option ${task?.language === language || (!task && language === 'Yorùbá') ? 'selected' : ''}>${language}</option>`).join('')}</select></label>
        <label class="ft-field">Reward points<input name="points" type="number" min="0" max="500" required value="${Number(task?.points ?? 20)}" /></label>
        <label class="ft-field">Due date and time<input name="dueAt" type="datetime-local" value="${escapeHtml(dueAt)}" /></label>
        <label class="ft-field">Repeat<select name="repeat">${['None', 'Daily', 'Weekly'].map((repeat) => `<option ${task?.repeat_rule === repeat || (!task && repeat === 'None') ? 'selected' : ''}>${repeat}</option>`).join('')}</select></label>
        <label class="ft-field ft-field-full">Task details (optional)<textarea name="description" maxlength="500" placeholder="Add a short, helpful note.">${escapeHtml(task?.description || '')}</textarea></label>
      </div>
      <p class="ft-helper">Repeat schedules are saved as a preference; they do not automatically create future tasks. No screen-time limit is changed by a reward.</p>
      <div class="ft-actions"><button class="ft-button" type="submit">${editing ? 'Save changes' : 'Save task'}</button><button class="ft-button ft-button-quiet" type="button" data-view="tasks">Cancel</button></div>
    </form></section>`}`;
}

function renderRewardsPage() {
  const role = state.data.role;
  if (role === 'parent') {
    const settings = state.data.settings || { points_per_minute: 5, daily_limit: 30 };
    const requests = state.data.rewards || [];
    return `${noticeMarkup()}${pageHeading('Rewards stay in your hands.', 'Review requests and set the family’s daily extra-time allowance. Approving a request does not change device controls.')}
      <div class="ft-layout-grid"><section class="ft-section"><h2>Reward requests</h2>${requests.length
        ? requests.map((reward) => `<article class="ft-reward-row"><span><strong>${escapeHtml(reward.name)}</strong><small>${escapeHtml(reward.child_name)} · ${Number(reward.points)} points${Number(reward.extra_minutes) ? ` · ${Number(reward.extra_minutes)} minutes` : ''} · ${escapeHtml(reward.status)}</small></span>${reward.status === 'pending' ? `<span class="ft-actions"><button class="ft-button" type="button" data-action="decide-reward" data-id="${escapeHtml(reward.id)}" data-decision="approve">Approve</button><button class="ft-button ft-button-quiet" type="button" data-action="decide-reward" data-id="${escapeHtml(reward.id)}" data-decision="reject">Decline</button></span>` : ''}</article>`).join('')
        : emptyState('No reward requests', 'Requests from linked learners will appear here.')}
      </section><aside class="ft-section"><h2>Reward rules</h2><form class="ft-form" data-form="settings">
        <label class="ft-field">Points per minute<input name="pointsPerMinute" type="number" min="1" max="100" value="${Number(settings.points_per_minute) || 5}" required /></label>
        <label class="ft-field">Maximum extra minutes per day<input name="dailyLimit" type="number" min="0" max="240" value="${Number(settings.daily_limit) || 0}" required /></label>
        <p class="ft-helper">The limit is enforced when you approve extra-time requests. Ìdíléwa does not control devices or screen-time settings.</p>
        <button class="ft-button" type="submit">Save reward rules</button>
      </form></aside></div>`;
  }
  const rewards = state.data.availableRewards || [];
  const requests = state.data.rewards || [];
  return `${noticeMarkup()}${pageHeading('Choose a reward to request.', `You have ${Number(state.data.points) || 0} available points. Your parent or guardian must approve each request.`)}
    <div class="ft-layout-grid"><section class="ft-section"><h2>Available rewards</h2>${rewards.map((reward) => `<div class="ft-reward-row"><span><strong>${escapeHtml(reward.name)}</strong><small>${Number(reward.points)} points${Number(reward.minutes) ? ` · ${Number(reward.minutes)} extra minutes` : ''}</small></span><button class="ft-button" type="button" data-action="redeem" data-code="${escapeHtml(reward.code)}" ${Number(state.data.points) < Number(reward.points) ? 'disabled' : ''}>Request</button></div>`).join('')}
      <p class="ft-helper">Points are reserved when you ask. If a parent declines, they are returned to your balance. Extra-time rewards are requests only and do not change a device setting.</p>
    </section><aside class="ft-section"><h2>Your reward history</h2>${requests.length
      ? requests.map((reward) => `<div class="ft-reward-row"><span><strong>${escapeHtml(reward.name)}</strong><small>${Number(reward.points)} points · ${escapeHtml(reward.status)} · ${escapeHtml(formatDate(reward.created_at))}</small></span></div>`).join('')
      : emptyState('No requests yet', 'Your requests and their decisions will appear here.')}</aside></div>`;
}

function renderLoggedOut(message) {
  roleLabel.textContent = 'Sign in required';
  navigation.replaceChildren();
  main.innerHTML = `<section class="ft-auth-panel"><h1>Sign in to open family tasks.</h1><p>${escapeHtml(message || 'Use your existing Ìdíléwa account. Parents can manage tasks; linked learners can complete them.')}</p>
    <div class="ft-auth-links"><a href="/parents.html#/parent-login">Parent sign in</a><a href="/login.html#/login?mode=signin">Learner sign in</a><a href="/login.html#/login?mode=signup">Create an account</a></div></section>`;
}

function render() {
  if (!main) return;
  const isAuthenticated = Boolean(state.data);
  navigation.hidden = !isAuthenticated;
  signOutButton.hidden = !isAuthenticated;
  if (!state.data) {
    if (state.loading) {
      main.innerHTML = '<p class="ft-loading" role="status">Loading your family tasks…</p>';
      return;
    }
    if (state.authRequired) {
      renderLoggedOut(state.message);
      return;
    }
    roleLabel.textContent = 'Family task service';
    navigation.replaceChildren();
    main.innerHTML = `${noticeMarkup()}<section class="ft-auth-panel"><h1>Family tasks are temporarily unavailable.</h1><p>Try again in a moment. If the problem continues, contact Idilewa support.</p><button class="ft-button" type="button" data-action="retry">Try again</button></section>`;
    return;
  }
  roleLabel.textContent = state.data.role === 'parent' ? 'Parent account'
    : state.data.role === 'child' ? 'Learner account' : 'Adult account';
  renderNavigation();
  if (state.loading) {
    main.innerHTML = '<p class="ft-loading" role="status">Refreshing family tasks…</p>';
  } else if (state.view === 'create') {
    const task = state.editTaskId ? state.data.tasks.find((item) => item.id === state.editTaskId) : null;
    main.innerHTML = taskFormMarkup(task);
  } else if (state.view === 'rewards') {
    main.innerHTML = renderRewardsPage();
  } else {
    main.innerHTML = renderTaskPage();
  }
}

navigation?.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-view]') : null;
  if (!target) return;
  state.view = target.dataset.view;
  state.editTaskId = '';
  setMessage('');
  render();
});

async function refresh({ keepMessage = false } = {}) {
  state.loading = true;
  if (!keepMessage) setMessage('');
  render();
  try {
    const data = await requestApi();
    state.loading = false;
    if (!['parent', 'child', 'adult'].includes(data.role)) {
      throw new Error('This account cannot open family tasks.');
    }
    state.authRequired = false;
    state.data = data;
    if (state.view === 'create' && state.data.role === 'child') state.view = 'tasks';
    render();
    return true;
  } catch (error) {
    state.loading = false;
    if (error.authRequired) {
      state.data = null;
      state.authRequired = true;
    }
    setMessage(error instanceof Error ? error.message : 'Family tasks could not be loaded.', true);
    render();
    return false;
  }
}

async function performAction(action, id, options = {}) {
  const { success, ...payload } = options;
  const body = { action, taskId: id, ...payload };
  await requestApi('PATCH', body);
  state.revisingId = '';
  state.editTaskId = '';
  if (await refresh()) {
    setMessage(success || 'Your change has been saved.');
    render();
  }
}

main?.addEventListener('click', async (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-action], [data-view], [data-filter]') : null;
  if (!target) return;
  try {
    if (target.dataset.view) {
      state.view = target.dataset.view;
      state.editTaskId = '';
      setMessage('');
      render();
      return;
    }
    if (target.dataset.filter) {
      state.filter = target.dataset.filter;
      render();
      return;
    }
    const { action, id } = target.dataset;
    if (action === 'refresh' || action === 'retry') {
      await refresh();
    } else if (action === 'sign-out') {
      const result = await signOut();
      if (!result?.signedOut) throw new Error('You could not be signed out. Please try again.');
      window.location.assign('/');
    } else if (action === 'edit') {
      state.editTaskId = id;
      state.view = 'create';
      render();
    } else if (action === 'cancel-revision') {
      state.revisingId = '';
      render();
    } else if (action === 'revise') {
      state.revisingId = id;
      render();
      main.querySelector('[data-form="revision"] textarea')?.focus();
    } else if (action === 'delete') {
      if (window.confirm('Delete this assigned task? Completed work cannot be deleted.')) {
        await performAction('delete', id, { success: 'Task deleted.' });
      }
    } else if (action === 'approve') {
      await performAction('approve', id, { success: 'Task approved and points awarded.' });
    } else if (['start', 'pause', 'submit', 'complete'].includes(action)) {
      await performAction(action, id, { success: action === 'submit' ? 'Task submitted for parent approval.' : 'Task updated.' });
    } else if (action === 'redeem') {
      await requestApi('POST', { type: 'reward', code: target.dataset.code });
      if (await refresh()) {
        setMessage('Reward request sent to your parent.');
        render();
      }
    } else if (action === 'decide-reward') {
      await requestApi('PATCH', { action: 'decide-reward', rewardId: id, decision: target.dataset.decision });
      if (await refresh()) {
        setMessage(target.dataset.decision === 'approve' ? 'Reward approved.' : 'Reward declined and points returned.');
        render();
      }
    }
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'The request could not be completed.', true);
    render();
  }
});

main?.addEventListener('submit', async (event) => {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form) return;
  event.preventDefault();
  try {
    const values = new FormData(form);
    if (form.dataset.form === 'task') {
      const dueValue = String(values.get('dueAt') || '');
      const payload = {
        type: 'task',
        taskId: String(values.get('taskId') || ''),
        childId: String(values.get('childId') || ''),
        title: String(values.get('title') || ''),
        description: String(values.get('description') || ''),
        language: String(values.get('language') || ''),
        points: Number(values.get('points')),
        dueAt: dueValue ? new Date(dueValue).toISOString() : '',
        repeat: String(values.get('repeat') || 'None'),
      };
      if (payload.taskId) {
        await requestApi('PATCH', { ...payload, action: 'edit' });
        setMessage('Task updated.');
      } else {
        await requestApi('POST', payload);
        setMessage('Task created.');
      }
      state.view = 'tasks';
      state.editTaskId = '';
      await refresh({ keepMessage: true });
    } else if (form.dataset.form === 'settings') {
      await requestApi('POST', {
        type: 'reward-settings',
        pointsPerMinute: Number(values.get('pointsPerMinute')),
        dailyLimit: Number(values.get('dailyLimit')),
      });
      await refresh();
      setMessage('Reward rules saved.');
    } else if (form.dataset.form === 'revision') {
      const id = form.dataset.id;
      const feedback = String(values.get('feedback') || '').trim();
      await performAction('revise', id, { feedback, success: 'Feedback sent to the learner.' });
    }
    render();
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'The form could not be saved.', true);
    render();
  }
});

document.querySelector('[data-action="refresh"]')?.addEventListener('click', () => refresh());
document.querySelector('[data-action="sign-out"]')?.addEventListener('click', async () => {
  try {
    const result = await signOut();
    if (!result?.signedOut) throw new Error('You could not be signed out. Please try again.');
    window.location.assign('/');
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Sign out could not be completed.', true);
    render();
  }
});

void refresh();
window.setInterval(() => {
  if (state.view === 'tasks' && state.data?.tasks.some((task) => task.started_at) && !document.hidden) render();
}, 60_000);

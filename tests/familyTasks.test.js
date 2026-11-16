import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  FAMILY_REWARDS,
  normalizeFamilyRewardSettings,
  normalizeFamilyTask,
  requireFamilyChildId,
  requireFamilyReward,
  requireFamilyTaskId,
  resolveFamilyContext,
} from '../src/server/familyTasks.js';

function mockAdmin(tables) {
  return {
    from(table) {
      const filters = [];
      const query = {
        select() { return this; },
        eq(column, value) { filters.push((row) => row[column] === value); return this; },
        not(column, operator, value) {
          filters.push((row) => operator !== 'is' || value !== null || row[column] !== null);
          return this;
        },
        in(column, values) { filters.push((row) => values.includes(row[column])); return this; },
        limit() { return this; },
        result() {
          const rows = (tables[table] || []).filter((row) => filters.every((filter) => filter(row)));
          return { data: rows, error: null };
        },
        maybeSingle() { return Promise.resolve({ ...this.result(), data: this.result().data[0] || null }); },
        then(resolve, reject) { return Promise.resolve(this.result()).then(resolve, reject); },
      };
      return query;
    },
  };
}

test('family tasks normalize supported task fields and ISO due dates', () => {
  assert.deepEqual(normalizeFamilyTask({
    title: '  Read a story  ',
    description: 'Read one page together.',
    language: 'Yorùbá',
    points: '35',
    dueAt: '2026-11-20T16:30:00.000Z',
    repeat: 'Weekly',
  }), {
    title: 'Read a story',
    description: 'Read one page together.',
    language: 'Yorùbá',
    points: 35,
    due_at: '2026-11-20T16:30:00.000Z',
    repeat_rule: 'Weekly',
  });
});

test('family task inputs reject invalid titles, languages, points, and dates', () => {
  const valid = { title: 'Read a story', language: 'Yorùbá', points: 20, repeat: 'None' };
  assert.throws(() => normalizeFamilyTask({ ...valid, title: '  ' }), /task title/);
  assert.throws(() => normalizeFamilyTask({ ...valid, language: 'Unknown' }), /task language/);
  assert.throws(() => normalizeFamilyTask({ ...valid, points: 501 }), /Reward points/);
  assert.throws(() => normalizeFamilyTask({ ...valid, dueAt: 'not-a-date' }), /due date/);
  assert.throws(() => normalizeFamilyTask({ ...valid, repeat: 'Hourly' }), /repeat schedule/);
});

test('family reward settings and IDs are validated before database access', () => {
  assert.deepEqual(normalizeFamilyRewardSettings({ pointsPerMinute: '8', dailyLimit: '45' }), {
    points_per_minute: 8,
    daily_limit: 45,
  });
  assert.throws(() => normalizeFamilyRewardSettings({ pointsPerMinute: 0, dailyLimit: 45 }), /Points per minute/);
  assert.throws(() => normalizeFamilyRewardSettings({ pointsPerMinute: 8, dailyLimit: 241 }), /daily reward limit/);
  assert.equal(FAMILY_REWARDS.length, 4);
  assert.equal(requireFamilyReward('play').points, 50);
  assert.throws(() => requireFamilyReward('unknown'), /available reward/);
  assert.equal(requireFamilyTaskId('123e4567-e89b-42d3-a456-426614174000'), '123e4567-e89b-42d3-a456-426614174000');
  assert.throws(() => requireFamilyTaskId('not-a-uuid'), /family task/);
  assert.throws(() => requireFamilyChildId('not-a-uuid'), /family learner/);
});

test('parent task access includes only learners whose current guardian link matches their profile', async () => {
  const requestId = '123e4567-e89b-42d3-a456-426614174000';
  const mismatchedRequestId = '123e4567-e89b-42d3-b456-426614174001';
  const childId = '123e4567-e89b-42d3-a456-426614174010';
  const mismatchedChildId = '123e4567-e89b-42d3-b456-426614174011';
  const context = await resolveFamilyContext(mockAdmin({
    guardian_access_requests: [
      { id: requestId, parent_email: 'parent@example.com', status: 'used', claimed_by: childId, learner_alias: 'Learner A' },
      { id: mismatchedRequestId, parent_email: 'parent@example.com', status: 'used', claimed_by: mismatchedChildId, learner_alias: 'Learner B' },
    ],
    profiles: [
      { id: childId, role: 'child', points: 15, parent_consent_request_id: requestId },
      { id: mismatchedChildId, role: 'child', points: 30, parent_consent_request_id: '123e4567-e89b-42d3-c456-426614174099' },
    ],
  }), { id: 'parent-id', email: 'PARENT@example.com', role: 'parent' });

  assert.deepEqual(context.children, [{ id: childId, name: 'Learner A', points: 15 }]);
});

test('family task API authenticates every request and scopes task writes by verified role', async () => {
  const apiSource = await readFile(new URL('../api/family/tasks.js', import.meta.url), 'utf8');
  const migrationSource = await readFile(new URL('../supabase/migrations/20261112000000_family_tasks.sql', import.meta.url), 'utf8');
  const clientSource = await readFile(new URL('../src/familyTasks.js', import.meta.url), 'utf8');
  const pageSource = await readFile(new URL('../family-tasks.html', import.meta.url), 'utf8');
  assert.match(apiSource, /requireAuthenticatedProfile\(req, \['parent', 'child', 'adult'\]\)/);
  assert.match(apiSource, /resolveFamilyContext\(admin, profile\)/);
  assert.match(apiSource, /query\.in\('child_id', childIds\)\.eq\('owner_role', 'child'\)/);
  assert.match(apiSource, /requireRole\(profile, 'parent'\)/);
  assert.match(migrationSource, /ALTER TABLE public\.family_tasks ENABLE ROW LEVEL SECURITY/);
  assert.match(migrationSource, /REVOKE ALL ON public\.family_tasks FROM PUBLIC, anon, authenticated/);
  assert.match(migrationSource, /CREATE OR REPLACE FUNCTION public\.is_verified_family_child/);
  assert.match(migrationSource, /CREATE OR REPLACE FUNCTION public\.decide_family_task/);
  assert.match(migrationSource, /CREATE OR REPLACE FUNCTION public\.request_family_reward/);
  assert.match(migrationSource, /GRANT EXECUTE ON FUNCTION public\.decide_family_task/);
  assert.match(clientSource, /supabase\.auth\.getSession\(\)/);
  assert.match(clientSource, /fetch\('\/api\/family\/tasks'/);
  assert.match(clientSource, /navigation\.hidden = !isAuthenticated/);
  assert.match(clientSource, /signOutButton\.hidden = !isAuthenticated/);
  assert.doesNotMatch(clientSource, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
  assert.match(pageSource, /src="\/src\/familyTasks\.js"/);
});

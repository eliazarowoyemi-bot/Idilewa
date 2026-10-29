import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const supabaseClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const authCallbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');

test('Tutor Portal provides independent routes for every supplied interface', () => {
  for (const route of [
    'tutor', 'tutor-login', 'tutor-signup', 'tutor-dashboard', 'tutor-find-child',
    'tutor-consent', 'tutor-students', 'tutor-lesson', 'tutor-messages',
    'tutor-profile', 'tutor-availability', 'tutor-settings'
  ]) {
    assert.match(appSource, new RegExp(`'${route}'`));
    assert.match(appSource, new RegExp(`case '${route}':`));
  }
  assert.match(appSource, /label: 'For Tutors', route: 'tutor'/);
  assert.match(appSource, /const action = signup \? 'tutor-signup' : 'tutor-login'/);
  assert.match(appSource, /data-form="\$\{action\}"/);
});

test('educator registration verifies invitation and preserves the educator role', () => {
  assert.match(appSource, /verifyEducatorInvite\(inviteCode\)/);
  assert.match(appSource, /role: 'educator',\s*educatorInviteId,\s*redirectRoute: 'tutor-login'/);
  assert.match(supabaseClientSource, /export async function verifyEducatorInvite\(code\)/);
  assert.match(supabaseClientSource, /role === 'educator'.*educatorInviteId/);
  assert.match(authCallbackSource, /'tutor-login'/);
});

test('learner connections use guardian approval and educator-only dashboard data', () => {
  assert.match(appSource, /submitEducatorConnectionRequest\(childEmail\)/);
  assert.match(appSource, /getRoleDashboard\('\/api\/dashboard\/educator'\)/);
  assert.match(appSource, /student details are not available|No learner information is shared before consent/);
  assert.match(appSource, /A parent or guardian must approve before any learner details are shared/);
  assert.match(appSource, /Messages aren’t enabled in this portal yet/);
});

test('Tutor Portal has responsive layouts and functional availability and preference controls', () => {
  assert.match(styleSource, /\.tutor-workspace\s*\{[^}]*grid-template-columns:\s*195px/s);
  assert.match(styleSource, /@media \(max-width: 760px\)[\s\S]*?\.tutor-workspace\s*\{[^}]*display:\s*block/s);
  assert.match(appSource, /data-form="tutor-availability"/);
  assert.match(appSource, /localStorage\.setItem\(TUTOR_AVAILABILITY_KEY/);
  assert.match(appSource, /data-action="tutor-toggle-preference"/);
});

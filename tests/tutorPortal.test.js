import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeEducatorProfile } from '../src/supabaseClient.js';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const authDialogSource = await readFile(new URL('../src/authDialog.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const supabaseClientSource = await readFile(new URL('../src/supabaseClient.js', import.meta.url), 'utf8');
const authCallbackSource = await readFile(new URL('../src/authCallback.js', import.meta.url), 'utf8');
const tutorNavigationSource = await readFile(new URL('../src/tutorNavigation.js', import.meta.url), 'utf8');
const migrationSource = await readFile(new URL('../supabase/migrations/20261126141500_open_educator_registration.sql', import.meta.url), 'utf8');
const tutorProfileMigrationSource = await readFile(new URL('../supabase/migrations/20261127120000_private_tutor_profiles.sql', import.meta.url), 'utf8');

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
  assert.match(appSource, /if \(page === 'tutor-login'\) return renderAuthRoutePlaceholder\('tutor', 'signin'\)/);
  assert.match(authDialogSource, /data-auth-form="tutor"/);
});

test('tutor landing, authentication, and workspace link back to the main Idilewa home', () => {
  assert.match(appSource, /function renderTutorHomeLink\(\)[\s\S]*?href="\/" aria-label="Go to Idilewa home"/);
  assert.match(appSource, /function renderAuthRoutePlaceholder\(role, mode\)/);
  assert.match(appSource, /tutor-topbar-home[^>]*href="\/"/);
});

test('educator registration is open and preserves profile validation and child approval', () => {
  assert.doesNotMatch(authDialogSource, /verifyEducatorInvite|id-auth-tutor-invite|inviteCode/);
  assert.match(authDialogSource, /role: 'educator',\s*educatorProfile/);
  assert.match(authDialogSource, /educatorProfile:/);
  assert.doesNotMatch(supabaseClientSource, /educatorInviteId|educator_invite_id/);
  assert.match(supabaseClientSource, /role === 'educator'[\s\S]*?normalizeEducatorProfile\(educatorProfile\)/);
  assert.match(supabaseClientSource, /teaching_subject: normalizedEducatorProfile\.teachingSubject/);
  assert.match(supabaseClientSource, /safeguarding_accepted_at: new Date\(\)\.toISOString\(\)/);
  assert.match(migrationSource, /IF v_role = 'child' THEN[\s\S]*?guardian_access_requests/);
  assert.doesNotMatch(migrationSource, /educator_invites|educator_invite_id/);
  assert.match(authCallbackSource, /'tutor-login'/);
  assert.match(authDialogSource, /redirectRoute: state\.returnToHomepage \? 'index' : 'tutor-login'/);
});

test('educator signup captures and validates profile details before authentication', () => {
  const profile = normalizeEducatorProfile({
    country: ' Nigeria ',
    timeZone: 'Africa/Lagos',
    teachingSubject: 'Yorùbá',
    teachingExperience: '4–7 years',
    qualifications: '  Classroom and community teaching  ',
  });
  assert.deepEqual(profile, {
    country: 'Nigeria',
    timeZone: 'Africa/Lagos',
    teachingSubject: 'Yorùbá',
    teachingExperience: '4–7 years',
    qualifications: 'Classroom and community teaching',
  });
  assert.throws(() => normalizeEducatorProfile({ ...profile, teachingSubject: 'Learner records' }), /teaching subject/);
  assert.throws(() => normalizeEducatorProfile({ ...profile, qualifications: 'x'.repeat(601) }), /600 characters/);
  assert.match(authDialogSource, /name="firstName"/);
  assert.match(authDialogSource, /name="lastName"/);
  assert.match(authDialogSource, /name="timeZone"/);
  assert.match(authDialogSource, /name="teachingExperience"/);
});

test('legacy tutor application and dashboard navigation enter real educator auth routes', () => {
  assert.match(tutorNavigationSource, /createPortalLink\('tutor-signup', 'Become a Tutor'\)/);
  assert.doesNotMatch(tutorNavigationSource, /invitation code/);
  assert.match(tutorNavigationSource, /createPortalLink\('tutor-dashboard', 'Tutor Dashboard'\)/);
  assert.match(tutorNavigationSource, /link\.href = `\.\/educator-portal\.html#\/\$\{route\}`/);
  assert.doesNotMatch(tutorNavigationSource, /link\.href = `\.\/index\.html#\//);
  assert.match(tutorNavigationSource, /applicationForm\.replaceWith\(signupPanel\)/);
  assert.doesNotMatch(tutorNavigationSource, /Preview Application/);
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

test('educator profiles and private images are scoped to the signed-in tutor', () => {
  const dashboardSource = appSource.slice(appSource.indexOf('function renderTutorDashboard'), appSource.indexOf('function renderTutorFindChild'));
  assert.match(appSource, /getProfileDetailsStorageKey\(userId = getCurrentUser\(\)\?\.id\)/);
  assert.match(appSource, /tutorDashboardDataUserId === user\.id/);
  assert.match(appSource, /data-form="tutor-profile-settings"/);
  assert.match(appSource, /data-tutor-image="avatar"/);
  assert.match(appSource, /data-tutor-image="background"/);
  assert.doesNotMatch(dashboardSource, /Onilude Hammed|onilsonly@gmail\.com|Sample Learners|yoruba-educator-woman\.jpg/);
  assert.match(supabaseClientSource, /export async function updateEducatorProfile/);
  assert.match(supabaseClientSource, /\.eq\('id', user\.id\)[\s\S]*?\.eq\('role', 'educator'\)/);
  assert.match(supabaseClientSource, /createSignedUrl\(path, 60 \* 60\)/);
  assert.match(supabaseClientSource, /upsert: false/);
  assert.match(tutorProfileMigrationSource, /'tutor-profile-media'[\s\S]*?FALSE/);
  assert.match(tutorProfileMigrationSource, /CREATE POLICY "Educators can read their own tutor profile media"[\s\S]*?auth\.uid\(\)::TEXT/);
  assert.match(tutorProfileMigrationSource, /CREATE POLICY "Educators can upload their own tutor profile media"[\s\S]*?auth\.uid\(\)::TEXT/);
  assert.match(tutorProfileMigrationSource, /CREATE POLICY "Educators can remove their own tutor profile media"[\s\S]*?auth\.uid\(\)::TEXT/);
});

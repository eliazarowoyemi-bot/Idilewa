import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  getVoiceGradeLessonSlice,
  getVoiceGradePath,
  VOICE_GRADE_PATHS
} from '../src/voiceGradeCurriculum.js';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const stylesSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const academyHeroImage = await readFile(new URL('../assets/landing-home-hero.webp', import.meta.url));
const academyJourneyImage = await readFile(new URL('../assets/landing-journey-learners.webp', import.meta.url));

test('homepage follows the supplied academy reference and keeps language selection connected', () => {
  const home = appSource.slice(
    appSource.indexOf('function renderHome()'),
    appSource.indexOf('function renderFullHome()')
  );
  assert.equal(academyHeroImage.subarray(0, 4).toString(), 'RIFF');
  assert.equal(academyHeroImage.subarray(8, 12).toString(), 'WEBP');
  assert.match(home, /Our Language\.<br \/>[\s\S]*Our Future\./);
  assert.match(home, /landingHomeHeroUrl/);
  assert.match(appSource, /import landingHomeHeroUrl from '\.\/assets\/landing-home-hero\.webp'/);
  assert.match(home, /renderAcademyLanguageChoices\(\)/);
  assert.match(home, /routeLink\('voice_lessons'/);
  assert.match(appSource, /data-route="voice-grade" data-lang="\$\{language\.id\}"/);
  assert.match(home, /Learn\. Speak\. Connect\./);
});

test('Voice Lessons uses the supplied learner artwork and links to working learning tools', () => {
  const dashboard = appSource.slice(
    appSource.indexOf('function renderVoiceLessonsDashboard()'),
    appSource.indexOf('function renderVoiceProgress()')
  );
  assert.equal(academyJourneyImage.subarray(0, 4).toString(), 'RIFF');
  assert.equal(academyJourneyImage.subarray(8, 12).toString(), 'WEBP');
  assert.match(dashboard, /landingJourneyLearnersUrl/);
  assert.match(appSource, /import landingJourneyLearnersUrl from '\.\/assets\/landing-journey-learners\.webp'/);
  assert.match(dashboard, /renderAcademyLanguageChoices\(\)/);
  for (const route of ['voice-translation', 'voice-text-to-speech', 'voice-speech-to-text', 'voice-cloning', 'voice-progress']) {
    assert.ok(dashboard.includes(`'${route}'`), `${route} should be linked from Voice Lessons`);
  }
  assert.match(dashboard, /state\.trainer\.completed/);
  assert.match(dashboard, /state\.translationLessons/);
  assert.doesNotMatch(dashboard, /voice-lessons-welcome\.jpg|curriculum-tools-hotspot|curriculum-dashboard-hotspot/);
});

test('voice progress shows an open-ended completion count without a lesson cap', () => {
  const progress = appSource.slice(
    appSource.indexOf('function renderVoiceProgress()'),
    appSource.indexOf('function renderOral()')
  );
  assert.match(progress, /Object\.keys\(state\.trainer\.completed \|\| \{\}\)\.length/);
  assert.match(progress, /completedCount === 1 \? 'lesson' : 'lessons'/);
  assert.doesNotMatch(progress, /of 60|\/ 60|Lesson 1 of 60/);
  assert.match(appSource, /case 'voice-progress': return renderVoiceProgress\(\);/);
});

test('narrow language cards and voice lesson dashboard targets fit mobile screens', () => {
  assert.match(stylesSource, /@media \(max-width: 375px\) \{[\s\S]*?\.language-choice-grid \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  assert.match(stylesSource, /\.curriculum-dashboard-hotspot-grade \{ left: 33%; width: 22%; \}/);
  assert.match(stylesSource, /\.curriculum-dashboard-hotspot-start \{ top: 57%; left: 55%; width: max\(15%, 44px\); height: max\(10%, 44px\); \}/);
});

test('each grade has its own non-overlapping lesson set within its difficulty band', () => {
  const lessons = Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }));
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    const grades = VOICE_GRADE_PATHS.filter((grade) => grade.level === level);
    const assigned = grades.map((grade) => getVoiceGradeLessonSlice(grade.id, lessons).map((lesson) => lesson.id));
    assert.ok(assigned.every((set) => set.length > 0));
    assert.equal(new Set(assigned.flat()).size, lessons.length);
    assert.ok(assigned.every((set, index) => index === 0 || set[0] > assigned[index - 1].at(-1)));
  }
});

test('all four supported languages provide distinct lesson content for every grade', () => {
  const curriculumMatch = appSource.match(/const TRAINER_CURRICULUM = (\{[\s\S]*?\});/);
  assert.ok(curriculumMatch, 'Voice lesson curriculum data should be present');
  const curricula = JSON.parse(curriculumMatch[1]);
  for (const language of ['yoruba', 'igbo', 'hausa', 'swahili']) {
    const assignedLessonIds = new Set();
    for (const grade of VOICE_GRADE_PATHS) {
      const lessons = curricula[language][grade.level];
      const gradeLessons = getVoiceGradeLessonSlice(grade.id, lessons);
      assert.ok(gradeLessons.length > 0, `${language} ${grade.name} should have lessons`);
      for (const lesson of gradeLessons) {
        assert.ok(!assignedLessonIds.has(lesson.id), `${language} lesson ${lesson.id} should belong to one grade only`);
        assignedLessonIds.add(lesson.id);
      }
    }
    assert.equal(assignedLessonIds.size, 60, `${language} should assign all 60 lessons exactly once`);
  }
});

test('voice curriculum does not contain generated placeholder translations', () => {
  const curriculumMatch = appSource.match(/const TRAINER_CURRICULUM = (\{[\s\S]*?\});/);
  assert.ok(curriculumMatch, 'Voice lesson curriculum data should be present');
  const curricula = JSON.parse(curriculumMatch[1]);
  const translations = Object.values(curricula)
    .flatMap((language) => Object.values(language).flat())
    .filter((lesson) => lesson.translation)
    .map((lesson) => lesson.translation);

  assert.deepEqual(translations, []);
});

test('voice tools have no visible lesson counter and practice navigation can continue indefinitely', () => {
  const curriculumMatch = appSource.match(/const TRAINER_CURRICULUM = (\{[\s\S]*?\});/);
  assert.ok(curriculumMatch, 'Voice lesson curriculum data should be present');
  const curricula = JSON.parse(curriculumMatch[1]);

  for (const language of ['yoruba', 'igbo', 'hausa', 'swahili']) {
    const lessons = Object.values(curricula[language]).flat();
    const authoredLessonCount = Object.values(curricula[language])
      .reduce((total, levelLessons) => total + levelLessons.length, 0);
    assert.ok(lessons.length > 50, `${language} should expose lessons beyond the old 50-lesson cap`);
    assert.equal(lessons.length, authoredLessonCount, `${language} should expose every authored lesson`);
    assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, authoredLessonCount);
  }

  assert.match(appSource, /renderVoicePracticeLessonNavigation/);
  assert.match(appSource, /function renderVoiceFeatureLessonNavigation/);
  assert.match(appSource, /Previous lesson/);
  assert.match(appSource, /Next lesson/);
  assert.match(appSource, /const previousIndex = \(lessonIndex - 1 \+ lessons\.length\) % lessons\.length/);
  assert.match(appSource, /const nextIndex = \(lessonIndex \+ 1\) % lessons\.length/);
  assert.match(appSource, /Object\.values\(langData\)\.flat\(\)/);
  assert.doesNotMatch(appSource, /Lesson \$\{featureLessonNumber\} of \$\{featureLessons\.length\}/);
  assert.doesNotMatch(appSource, /60 (?:Audio )?Lessons|60 lessons/);
  assert.doesNotMatch(appSource, /Course complete/);
  assert.match(appSource, /voiceLessonDisplayTitle\(featureLesson,/);
  assert.match(appSource, /Explore this phrase, or enter any English phrase below to translate it\./);
  assert.match(appSource, /replace\(\/\^lesson\\s\+\\d\+/);
  assert.match(appSource, /lessons\[\(currentIndex \+ 1\) % lessons\.length\]/);
  assert.match(appSource, /lessons\[\(currentIndex - 1 \+ lessons\.length\) % lessons\.length\]/);
  assert.doesNotMatch(appSource, /VOICE_FEATURE_LESSON_COUNT/);
  assert.match(appSource, /'voice-text-to-speech', 'voice-speech-to-text', 'voice-translation', 'voice-cloning'/);
  assert.match(appSource, /data-action="start-voice-transcription"/);
  assert.match(appSource, /data-action="plotweaver-speak-text"/);
});

test('the retired Trainer page redirects to Voice Lessons and remaining lesson paths stay available', async () => {
  const voiceLessonsHome = appSource.slice(
    appSource.indexOf('function renderVoiceLessonsHome()'),
    appSource.indexOf('function renderVoiceLessonsDashboard()')
  );
  const routes = appSource.match(/const ROUTES = \[([\s\S]*?)\n  \];/)?.[1] || '';
  const locationParser = appSource.slice(
    appSource.indexOf('function parseLocation()'),
    appSource.indexOf('function navigate(')
  );
  const pageRouter = appSource.slice(
    appSource.indexOf('function renderPage('),
    appSource.indexOf('function renderHomePreviewMotion(')
  );
  const trainerShell = await readFile(new URL('../trainer.html', import.meta.url), 'utf8');

  assert.doesNotMatch(routes, /trainer/);
  assert.match(locationParser, /if \(page === 'trainer'\) \{\s*page = 'voice_lessons';/);
  assert.match(locationParser, /#\/voice_lessons/);
  assert.match(trainerShell, /data-default-route="voice_lessons"/);
  assert.match(appSource, /case 'voice_lessons': return renderVoiceLessonsHome\(\);/);
  assert.doesNotMatch(pageRouter, /case 'trainer': return renderTrainer/);
  assert.match(voiceLessonsHome, /renderVoiceLessonsDashboard\(\)/);
  assert.doesNotMatch(voiceLessonsHome, /voice-foundations|trainerStudio|trainer-hero/);
  assert.match(appSource, /import landingJourneyLearnersUrl from '\.\/assets\/landing-journey-learners\.webp'/);
  assert.match(appSource, /Choose your language/);
  assert.doesNotMatch(voiceLessonsHome, /Explore sound foundations/);
  assert.doesNotMatch(appSource, /routeLink\('trainer'|route: 'trainer'/);
});

test('choosing a voice lesson language opens age-adaptive paths before the lessons', () => {
  const languagePicker = appSource.slice(
    appSource.indexOf("if (page === 'voice-language')"),
    appSource.indexOf("} else if (page === 'voice-grade')")
  );
  assert.match(languagePicker, /data-route="voice-grade" data-lang="\$\{id\}"/);
  assert.doesNotMatch(languagePicker, /Open \$\{name\} lessons/);
  assert.doesNotMatch(languagePicker, /Continue with/);
  assert.match(appSource, /function renderVoicePracticeLessonNavigation/);
  assert.match(appSource, /Previous lesson/);
  assert.match(appSource, /Next lesson/);
  assert.match(appSource, /data-route="voice-audio" data-lang="\$\{language\}"/);
});

test('Yoruba lesson 3 displays its English meaning instead of repeating its Yoruba pronunciation', () => {
  assert.match(
    appSource,
    /TRAINER_CURRICULUM\.yoruba\.beginner\.find\(\(lesson\) => lesson\.id === 3\)\.translation\s*=\s*'My name is Temitope, and I am happy\.'/
  );
  assert.match(appSource, /voice-practice-translation/);
  assert.match(appSource, /English translation/);
});

test('grade paths increase in difficulty and provide distinct developmental goals', () => {
  assert.equal(VOICE_GRADE_PATHS.length, 9);
  assert.equal(getVoiceGradePath('kindergarten').level, 'beginner');
  assert.equal(getVoiceGradePath('grade-3').level, 'intermediate');
  assert.equal(getVoiceGradePath('grade-6').level, 'advanced');
  assert.notEqual(getVoiceGradePath('kindergarten').focus, getVoiceGradePath('grade-8').focus);
  assert.equal(getVoiceGradePath('unknown'), null);
});

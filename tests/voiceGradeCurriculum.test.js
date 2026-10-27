import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  getVoiceFeatureLessonSlice,
  getVoiceGradeLessonSlice,
  getVoiceGradePath,
  VOICE_FEATURE_LESSON_COUNT,
  VOICE_GRADE_PATHS
} from '../src/voiceGradeCurriculum.js';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

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

test('voice feature pages each receive 50 guided lessons per language', () => {
  const curriculumMatch = appSource.match(/const TRAINER_CURRICULUM = (\{[\s\S]*?\});/);
  assert.ok(curriculumMatch, 'Voice lesson curriculum data should be present');
  const curricula = JSON.parse(curriculumMatch[1]);

  for (const language of ['yoruba', 'igbo', 'hausa', 'swahili']) {
    const lessons = getVoiceFeatureLessonSlice(Object.values(curricula[language]).flat());
    assert.equal(lessons.length, VOICE_FEATURE_LESSON_COUNT, `${language} should have 50 feature lessons`);
    assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, VOICE_FEATURE_LESSON_COUNT);
  }

  assert.match(appSource, /renderVoiceFeatureLessonNavigation/);
  assert.match(appSource, /'voice-text-to-speech', 'voice-speech-to-text', 'voice-translation', 'voice-cloning'/);
  assert.match(appSource, /data-action="start-voice-transcription"/);
  assert.match(appSource, /data-action="plotweaver-speak-text"/);
});

test('Voice Lessons opens a compact navigation hub and keeps detailed practice on its own route', () => {
  const voiceLessonsHome = appSource.slice(
    appSource.indexOf('function renderVoiceLessonsHome()'),
    appSource.indexOf('function renderVoiceLessonsDashboard()')
  );
  const trainerPage = appSource.slice(
    appSource.indexOf('function renderTrainer(params)'),
    appSource.indexOf('function formatDashboardDate')
  );

  assert.match(appSource, /case 'voice_lessons': return renderVoiceLessonsHome\(\);/);
  assert.match(appSource, /case 'trainer': return renderTrainer\(params\);/);
  assert.match(voiceLessonsHome, /renderVoiceLessonsDashboard\(\)/);
  assert.doesNotMatch(voiceLessonsHome, /voice-foundations|trainerStudio|trainer-hero/);
  assert.match(appSource, /Your Voice Lessons/);
  assert.match(appSource, /Start a guided lesson/);
  assert.match(appSource, /Explore sound foundations/);
  assert.doesNotMatch(trainerPage, /renderVoiceLessonsDashboard\(\)/);
  assert.match(trainerPage, /Back to Voice Lessons/);
  assert.match(trainerPage, /voice-foundations/);
  assert.match(trainerPage, /Choose what to try next/);
  assert.match(trainerPage, /Start a guided lesson/);
  assert.match(trainerPage, /Practice a phrase/);
  assert.match(trainerPage, /<details class="voice-trainer-expanded">/);
  assert.match(trainerPage, /<summary><span>More practice options<\/span>/);
  assert.match(trainerPage, /trainer-hero/);
  const foundationSection = trainerPage.slice(
    trainerPage.indexOf('<section class="voice-foundations"'),
    trainerPage.indexOf('<section class="voice-foundations-next"')
  );
  assert.doesNotMatch(foundationSection, /renderVoiceCloneTools/);
});

test('choosing a voice lesson language opens lessons directly with back and lesson navigation', () => {
  const languagePicker = appSource.slice(
    appSource.indexOf("if (page === 'voice-language')"),
    appSource.indexOf("} else if (page === 'voice-grade')")
  );
  assert.match(languagePicker, /data-route="voice-audio" data-lang="\$\{id\}"/);
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

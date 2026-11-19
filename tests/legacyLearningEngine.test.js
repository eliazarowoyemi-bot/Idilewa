import assert from 'node:assert/strict';
import test from 'node:test';
import {
  explainCode,
  getPronunciationGuide,
  normalizeLearningText,
  translateCuratedText,
} from '../src/legacyLearningEngine.js';

const yorubaEntries = [
  ['Ẹ káàárọ̀', 'Good morning'],
  ['Omi', 'Water'],
  ['Orúkọ mi ni Adé', 'My name is Ade'],
];

test('normalizes tonal marks, underdots, punctuation and whitespace for phrase matching', () => {
  assert.equal(normalizeLearningText('  E KAARO! '), normalizeLearningText('Ẹ káàárọ̀'));
  assert.equal(normalizeLearningText(' KEDU, ka ị mere? '), 'kedu ka i mere');
});

test('translation resolves curated phrases in both directions without losing their authored spelling', () => {
  assert.deepEqual(translateCuratedText({
    text: 'e kaaaro',
    entries: yorubaEntries,
    language: 'Yorùbá',
    reverse: false,
  }), {
    translated: 'Good morning',
    status: 'Curated',
    gloss: [{ source: 'e kaaaro', target: 'Good morning' }],
  });
  assert.equal(translateCuratedText({
    text: 'water',
    entries: yorubaEntries,
    language: 'Yorùbá',
    reverse: true,
  }).translated, 'Omi');
});

test('composes supported sentence patterns and labels incomplete glosses honestly', () => {
  const composed = translateCuratedText({
    text: 'I want water',
    entries: yorubaEntries,
    language: 'Yorùbá',
    reverse: true,
  });
  assert.equal(composed.translated, 'Mo fẹ́ Omi');
  assert.equal(composed.status, 'Composed');

  const gloss = translateCuratedText({
    text: 'water unknown',
    entries: yorubaEntries,
    language: 'Yorùbá',
    reverse: true,
  });
  assert.equal(gloss.translated, 'Omi unknown');
  assert.equal(gloss.status, 'Word-by-word gloss');
  assert.equal(gloss.matchedCount, 1);
});

test('does not invent unsupported translations or lexical pitch guidance', () => {
  assert.equal(translateCuratedText({
    text: 'a completely new sentence',
    entries: yorubaEntries,
    language: 'Yorùbá',
    reverse: true,
  }).status, 'Not found');
  assert.match(getPronunciationGuide('Habari', 'Swahili'), /no lexical tone/);
  assert.match(getPronunciationGuide('Ruwa', 'Hausa'), /not consistently shown/);
});

test('code explanations identify simple concepts and return localized vocabulary', () => {
  const loop = explainCode('repeat this loop', 'sw');
  assert.equal(loop.concept, 'loop');
  assert.equal(loop.language, 'Kiswahili');
  assert.ok(loop.glossary.some(([term]) => term === 'Collision'));
  assert.match(explainCode('let score = 1', 'yo').reasoning, /tọ́jú ìwífún/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  CODE_TERMS,
  HERITAGE_STORIES,
  LAB_LANGUAGES,
  LAB_LEVELS,
  PHONETICS,
  buildTutorReply,
  contourFeedback,
  describeTones,
  detectCodeConstruct,
  detectPitch,
  explainCodeReasoning,
  gameWordGroups,
  getHeritageStories,
  getPhonetics,
  normalizeLanguageName,
  parseSyllables,
  stripDiacritics,
  toneContour,
  translatePhrase,
} from '../src/languageLab.js';

const moduleSource = await readFile(new URL('../src/languageLab.js', import.meta.url), 'utf8');

test('language names resolve to one canonical label', () => {
  assert.deepEqual(
    ['yo', 'Yoruba', 'Yorùbá', 'sw', 'Swahili', 'Kiswahili', 'sw-KE', 'ig', 'hausa'].map(normalizeLanguageName),
    ['Yorùbá', 'Yorùbá', 'Yorùbá', 'Kiswahili', 'Kiswahili', 'Kiswahili', 'Kiswahili', 'Igbo', 'Hausa'],
  );
  assert.deepEqual(LAB_LANGUAGES, ['Yorùbá', 'Igbo', 'Hausa', 'Kiswahili']);
});

test('diacritics are optional on input but preserved in output', () => {
  assert.equal(stripDiacritics('Ẹ káàárọ̀'), 'e kaaaro');
  assert.equal(stripDiacritics('Ọmọ Ụlọ Ṣiré'), 'omo ulo sire');
  assert.equal(stripDiacritics('Ɓoye Ɗaya Ƙafa Ƴaƴa'), 'boye daya kafa yaya');
  const result = translatePhrase('e kaaro', { language: 'Yorùbá' });
  assert.equal(result.output, 'Ẹ káàárọ̀');
  assert.equal(result.status, 'curated');
  assert.equal(result.confidence, 'high');
  assert.equal(translatePhrase('E KAARO!', { language: 'Yorùbá' }).output, 'Ẹ káàárọ̀');
  assert.equal(translatePhrase('oruko mi ni ade', { language: 'Yorùbá' }).output, 'Orúkọ mi ni Adé');
  assert.equal(translatePhrase('child', { language: 'Yorùbá' }).output, 'Ọmọ');
});

test('every language ships vowels, consonants, tone contrasts and a note', () => {
  const expectedVowels = { 'Yorùbá': 8, Igbo: 8, Hausa: 5, Kiswahili: 5 };
  for (const language of LAB_LANGUAGES) {
    const info = getPhonetics(language);
    assert.equal(info.vowels.length, expectedVowels[language], `${language} vowels`);
    assert.ok(info.consonants.length >= 5, `${language} consonants`);
    assert.ok(info.tones.length >= 1, `${language} tone rows`);
    assert.ok(info.note.length > 40, `${language} note`);
    assert.ok(info.tones.every((row) => row.contrast && row.meanings && row.cue));
  }
  assert.equal(PHONETICS['Yorùbá'].vowels[2].sym, 'ẹ');
  assert.equal(PHONETICS.Igbo.vowels[3].sym, 'ị');
  assert.equal(PHONETICS.Hausa.consonants[0].sym, 'ɓ');
  assert.match(PHONETICS.Kiswahili.intro, /penultimate/i);
});

test('tone parsing follows each orthography and keeps the dots', () => {
  const high = parseSyllables('igbá', 'Yorùbá');
  const low = parseSyllables('ìgbà', 'Yorùbá');
  assert.deepEqual(high.map((syllable) => syllable.tone), ['M', 'H']);
  assert.deepEqual(low.map((syllable) => syllable.tone), ['L', 'L']);
  assert.equal(describeTones('igbá', 'Yorùbá'), 'i mid · gbá high');
  assert.equal(describeTones('ìgbà', 'Yorùbá'), 'ì low · gbà low');
  assert.equal(
    describeTones('Àgbájọ ọwọ́ la fi ń sọ̀yà.', 'Yorùbá'),
    'À low · gbá high · jọ mid · ọ mid · wọ mid · la mid · fi mid · ń high · sọ̀ low · yà low',
  );

  const igbo = parseSyllables('ákwá', 'Igbo');
  assert.deepEqual(igbo.map((syllable) => syllable.tone), ['H', 'H']);
  assert.deepEqual(parseSyllables('àkwá', 'Igbo').map((syllable) => syllable.tone), ['L', 'H']);
  assert.deepEqual(parseSyllables('Aka', 'Igbo').map((syllable) => syllable.tone), ['unknown', 'unknown']);
  assert.deepEqual(parseSyllables('Ruwa', 'Hausa').map((syllable) => syllable.tone), ['unknown', 'unknown']);

  const swahili = parseSyllables('asante', 'Kiswahili').map((syllable) => syllable.tone);
  assert.deepEqual(swahili, ['plain', 'stress', 'plain']);
  assert.ok(toneContour('ìgbà', 'Yorùbá').every((point) => point.multiplier < 1));
});

test('translation is curated, composed or honestly glossed — never invented', () => {
  const curated = translatePhrase('good morning', { language: 'Igbo' });
  assert.equal(curated.output, 'Ụtụtụ ọma');

  const reverse = translatePhrase('Asante', { language: 'Kiswahili' });
  assert.equal(reverse.output, 'Thank you');
  assert.equal(reverse.direction, 'native-en');

  assert.equal(translatePhrase('e kaaro', { language: 'Yorùbá', direction: 'native-en' }).output, 'Good morning');
  const spellingHelp = buildTutorReply('oruko mi ni ade', { language: 'Yorùbá' });
  assert.match(spellingHelp.text, /Target: Orúkọ mi ni Adé/);
  assert.match(spellingHelp.text, /Meaning: English: My name is Ade/);
  assert.equal(spellingHelp.speech.text, 'Orúkọ mi ni Adé');

  const composed = translatePhrase('my name is Tobi', { language: 'Yorùbá' });
  assert.equal(composed.status, 'composed');
  assert.equal(composed.output, 'Orúkọ mi ni Tobi');

  const composedSwahili = translatePhrase('where is water', { language: 'Kiswahili' });
  assert.equal(composedSwahili.status, 'composed');
  assert.equal(composedSwahili.output, 'Maji yako wapi?');
  assert.equal(translatePhrase('where is mother', { language: 'Kiswahili' }).status, 'missing');

  const gloss = translatePhrase('water house', { language: 'Hausa' });
  assert.equal(gloss.status, 'gloss');
  assert.equal(gloss.confidence, 'low');
  assert.deepEqual(gloss.gloss.map((item) => item.target), ['Ruwa', 'Gida']);

  const unknown = translatePhrase('quantum physics', { language: 'Yorùbá' });
  assert.equal(unknown.status, 'missing');
  assert.equal(unknown.output, '');
  assert.match(unknown.note, /Nothing is guessed/i);

  const unknownSlot = translatePhrase('where is the elephant', { language: 'Igbo' });
  assert.equal(unknownSlot.status, 'missing');
  assert.equal(unknownSlot.output, '');
});

test('the tutor answers every domain with the five required parts', () => {
  const prompts = [
    'teach me vowels',
    'teach me consonants',
    'how do tone marks work?',
    'tell me a proverb',
    'explain code loops and conditions',
    'how many?',
    'family words please',
    'hello',
    'how do you say water?',
  ];
  for (const language of LAB_LANGUAGES) {
    for (const level of LAB_LEVELS) {
      for (const prompt of prompts) {
        const reply = buildTutorReply(prompt, { language, level });
        for (const part of ['Target:', 'Pronunciation:', 'Meaning:', 'Note:', 'Your turn:']) {
          assert.ok(reply.text.includes(part), `${language}/${level}/${prompt} is missing ${part}`);
        }
        assert.ok(reply.speech?.text, 'each reply offers something to hear');
        assert.ok(!/undefined|\[object Object\]/i.test(reply.text), 'no template leaks');
      }
    }
  }

  const menu = buildTutorReply('sing me a song about robots', { language: 'Hausa' });
  assert.equal(menu.intent, 'menu');
  assert.match(menu.text, /will not invent/i);
  assert.equal(buildTutorReply('vowels', { language: 'Yorùbá', level: 'Elementary' }).intent, 'vowels');
  assert.equal(buildTutorReply('loop', { language: 'Yorùbá' }).intent, 'code');
  const swahiliStress = buildTutorReply('how do tone marks work?', { language: 'Kiswahili' });
  assert.match(swahiliStress.text, /second-to-last syllable/);
  assert.doesNotMatch(swahiliStress.text, /clear rise|clear fall/i);
  assert.equal(buildTutorReply('hello', { language: 'English' }).intent, 'greeting');
});

test('heritage stories carry a proverb, both meanings, vocabulary and one correct answer', () => {
  for (const language of LAB_LANGUAGES) {
    const stories = getHeritageStories(language);
    assert.ok(stories.length >= 2, `${language} needs at least two stories`);
    for (const story of stories) {
      assert.ok(story.native.length > 10);
      assert.ok(story.literal && story.idiomatic && story.literal !== story.idiomatic);
      assert.ok(story.moral.length > 40);
      assert.equal(story.options.length, 3);
      assert.ok(Number.isInteger(story.correct) && story.correct >= 0 && story.correct < 3);
      assert.ok(story.explanation.length > 40);
      assert.ok(story.vocabulary.length >= 3);
    }
  }
  assert.equal(Object.keys(HERITAGE_STORIES).length, 4);
});

test('code reasoning explains the same construct in English and the chosen language', () => {
  const yo = explainCodeReasoning('why does the loop repeat?', 'yo');
  assert.equal(yo.construct, 'loop');
  assert.match(yo.english, /repeat/i);
  assert.match(yo.native, /àṣẹ àtúnṣe/i);
  assert.equal(detectCodeConstruct('explain an if statement'), 'condition');
  assert.equal(detectCodeConstruct('why does the ball hit the paddle?'), 'collision');

  const sw = explainCodeReasoning('why does the paddle collide with the ball?', 'sw');
  assert.equal(sw.construct, 'collision');
  assert.match(sw.native, /Mgongano/);

  const ha = explainCodeReasoning('what is a variable?', 'ha');
  assert.equal(ha.construct, 'variable');
  assert.ok(ha.descriptive.length > 0, 'Hausa marks descriptive equivalents');

  const output = explainCodeReasoning('Hello, Ìdíléwa!', 'ig');
  assert.equal(output.construct, 'output');
  assert.match(output.native, /ihuenyo/);

  for (const code of ['yo', 'ig', 'ha', 'sw']) {
    assert.equal(gameWordGroups(code).length, 5);
    assert.ok(CODE_TERMS[code].words.some((word) => word.en === 'Condition'));
  }
});

test('voice-mirror feedback names the syllable to fix and stays honest', () => {
  const target = toneContour('ìgbà', 'Yorùbá');
  const flat = Array.from({ length: 24 }, () => 200);
  const feedback = contourFeedback(target, flat, 'Yorùbá');
  assert.match(feedback, /should drop to a low tone/);
  assert.match(feedback, /not a pronunciation certificate/);

  const short = contourFeedback(target, [200], 'Yorùbá');
  assert.match(short, /Not enough voiced pitch/);
  assert.match(contourFeedback([], [200, 210, 220, 230]), /Choose a stage phrase first/);
  assert.match(contourFeedback(toneContour('asante', 'Kiswahili'), flat, 'Kiswahili'), /cannot assess stress/i);
  assert.match(contourFeedback(toneContour('Aka', 'Igbo'), flat, 'Igbo'), /does not mark enough tone/i);
});

test('pitch detection finds a sung tone and ignores silence', () => {
  const sampleRate = 22050;
  const buffer = new Float32Array(1024);
  for (let index = 0; index < buffer.length; index += 1) {
    buffer[index] = Math.sin((2 * Math.PI * 200 * index) / sampleRate) * 0.5;
  }
  const detected = detectPitch(buffer, sampleRate);
  assert.ok(Math.abs(detected - 200) <= 8, `expected ~200 Hz, received ${detected}`);
  assert.equal(detectPitch(new Float32Array(1024), sampleRate), 0);
});

test('the lab never blocks the page with alerts and renders through text nodes', () => {
  assert.doesNotMatch(moduleSource, /\balert\s*\(/);
  assert.match(moduleSource, /textContent/);
  assert.match(moduleSource, /installLanguageLab/);
  assert.match(moduleSource, /window\.recordDemo/);
  assert.match(moduleSource, /getUserMedia/);
});

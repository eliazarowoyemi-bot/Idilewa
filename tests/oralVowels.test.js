import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  getOralVowelSequenceSpeechText,
  getOralVowelSpeechText,
  ORAL_VOWELS,
  ORAL_VOWEL_TONES
} from '../src/vowelsConsonantsData.js';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('oral vowel soundboard presents only the three tone-marked seven-vowel sequences', () => {
  assert.equal(ORAL_VOWELS.length, 7);
  assert.ok(ORAL_VOWELS.every((vowel) => vowel.toneExamples.length === 3));
  assert.deepEqual(
    ORAL_VOWELS.map((vowel) => vowel.toneExamples.map((example) => example.char)),
    [
      ['Á', 'A', 'À'],
      ['É', 'E', 'È'],
      ['Ẹ́', 'Ẹ', 'Ẹ̀'],
      ['Í', 'I', 'Ì'],
      ['Ó', 'O', 'Ò'],
      ['Ọ́', 'Ọ', 'Ọ̀'],
      ['Ú', 'U', 'Ù']
    ]
  );
  assert.doesNotMatch(appSource, /oralVowelSounds|item\.toneExamples\.map|getOralVowelSpeechText/);
  assert.match(appSource, /class="voice-vowel-sequences"/);
  assert.match(appSource, /<h3>Oral vowels<\/h3>[\s\S]*?\$\{oralVowelSequences\}/);
  assert.doesNotMatch(appSource, /voice-diphthong-note|Nasal vowels &amp; vowel pairs/);
});

test('oral vowel speech text includes the tone-marked vowel and omits the English gloss', () => {
  const highToneẸ = ORAL_VOWELS.find((vowel) => vowel.char === 'Ẹ')
    .toneExamples.find((example) => example.tone.includes('High'));

  assert.equal(getOralVowelSpeechText(highToneẸ), 'Ẹ́. Ẹ́yẹ');
  assert.doesNotMatch(getOralVowelSpeechText(highToneẸ), /\(Bird\)/);
});

test('vowel sequence playback sends all seven vowels with the selected tone marks', () => {
  assert.deepEqual(
    ORAL_VOWEL_TONES.map(({ id }) => getOralVowelSequenceSpeechText(id)),
    [
      'Á. É. Ẹ́. Í. Ó. Ọ́. Ú',
      'A. E. Ẹ. I. O. Ọ. U',
      'À. È. Ẹ̀. Ì. Ò. Ọ̀. Ù'
    ]
  );
  assert.throws(() => getOralVowelSequenceSpeechText('unknown'), RangeError);
  assert.match(appSource, /getOralVowelSequenceSpeechText\(tone\.id\)/);
  assert.match(appSource, /Listen for all seven vowel sounds in each tone/);
  assert.match(appSource, /data-action="speak-yoruba-vowel-sequence"/);
  assert.match(appSource, /getRecommendedPlotweaverVoice\('yo'\)/);
  assert.match(appSource, /voiceId: voice\.voice_id,\s*allowDeviceFallback: false/);
  assert.doesNotMatch(appSource, /data-phrase="A\. I\. E\. O\. U\."/);
});

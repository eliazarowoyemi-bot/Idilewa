import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_CONVERSATION_LANGUAGES,
  getAiConversationLanguage,
} from '../src/aiConversationLanguages.js';

test('AI Conversation language config contains four distinct guides and speech settings', () => {
  assert.deepEqual(AI_CONVERSATION_LANGUAGES.map(({ id }) => id), ['yo', 'ig', 'ha', 'sw']);
  assert.equal(new Set(AI_CONVERSATION_LANGUAGES.map(({ teacher }) => teacher.image)).size, 4);

  for (const language of AI_CONVERSATION_LANGUAGES) {
    assert.ok(language.name);
    assert.ok(language.nativeName);
    assert.ok(language.teacher.name);
    assert.ok(language.teacher.title);
    assert.ok(language.teacher.image);
    assert.ok(language.teacher.description);
    assert.ok(language.conversationInstructions);
    assert.ok(language.inputPlaceholder);
    assert.ok(language.speechRecognitionLocale);
    assert.ok(language.textToSpeechLocale);
    assert.equal(language.translationTarget, language.id);
  }
});

test('the language config preserves the requested localized conversation instructions', () => {
  assert.deepEqual(
    AI_CONVERSATION_LANGUAGES.map(({ id, conversationInstructions }) => [id, conversationInstructions]),
    [
      ['yo', 'Type an English phrase to see it translated into Yorùbá.'],
      ['ig', "Dee ahịrịokwu Bekee ka ị hụ ntụgharị ya n'Igbo."],
      ['ha', 'Rubuta jumlar Turanci domin a fassara ta zuwa Hausa.'],
      ['sw', 'Andika sentensi ya Kiingereza ili itafsiriwe kwa Kiswahili.'],
    ],
  );
  assert.equal(getAiConversationLanguage('sw').translationProvider, 'google');
  assert.equal(getAiConversationLanguage('sw').speechRecognitionSupported, false);
  assert.equal(getAiConversationLanguage('unknown').id, 'yo');
});

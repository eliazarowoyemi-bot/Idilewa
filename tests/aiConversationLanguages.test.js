import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_CONVERSATION_LANGUAGES,
  getAiConversationLanguage,
} from '../src/aiConversationLanguages.js';

test('AI Conversation language config contains five guides and speech settings', () => {
  assert.deepEqual(AI_CONVERSATION_LANGUAGES.map(({ id }) => id), ['yo', 'ig', 'ha', 'sw', 'pcm']);
  assert.equal(new Set(AI_CONVERSATION_LANGUAGES.slice(0, 4).map(({ teacher }) => teacher.image)).size, 4);

  for (const language of AI_CONVERSATION_LANGUAGES) {
    assert.ok(language.name);
    assert.ok(language.nativeName);
    assert.ok(language.teacher.name);
    assert.ok(language.teacher.title);
    if (language.teacher.image) {
      assert.ok(language.teacher.imageAlt);
    } else {
      assert.equal(language.id, 'pcm');
    }
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
      ['yo', 'Send a message to start chatting in Yorùbá.'],
      ['ig', 'Ziga ozi ka ị malite mkparịta ụka n’Igbo.'],
      ['ha', 'Aika saƙo domin fara hira da Hausa.'],
      ['sw', 'Tuma ujumbe ili kuanza mazungumzo kwa Kiswahili.'],
      ['pcm', 'Send a message to start chatting in Nigerian Pidgin.'],
    ],
  );
  assert.equal(getAiConversationLanguage('sw').translationProvider, 'google');
  assert.equal(getAiConversationLanguage('sw').speechRecognitionSupported, false);
  assert.equal(getAiConversationLanguage('pcm').speechRecognitionSupported, true);
  assert.equal(getAiConversationLanguage('unknown').id, 'yo');
});

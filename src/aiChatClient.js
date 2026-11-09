import { translateWithGoogle, translateWithPlotweaver } from './plotweaverClient.js';

const TRANSLATION_PROVIDERS = new Map([
  ['yo', 'plotweaver'],
  ['ig', 'plotweaver'],
  ['ha', 'plotweaver'],
  ['sw', 'google'],
]);

export async function sendAiChatMessage({ language, translationProvider, messages, signal }) {
  const expectedProvider = TRANSLATION_PROVIDERS.get(language);
  if (!expectedProvider) {
    throw new Error('Choose Yorùbá, Igbo, Hausa, or Swahili for AI Conversation.');
  }
  if (translationProvider && translationProvider !== expectedProvider) {
    throw new Error(`The selected language requires the ${expectedProvider} translation service.`);
  }
  const latestMessage = [...messages].reverse().find((message) => message.role === 'user');
  if (typeof latestMessage?.text !== 'string' || !latestMessage.text.trim()) {
    throw new Error('Type an English phrase before requesting a translation.');
  }

  const text = latestMessage.text.trim();
  const result = expectedProvider === 'google'
    ? await translateWithGoogle({ text, targetLanguage: language, signal })
    : await translateWithPlotweaver({
      text,
      sourceLanguage: 'en',
      targetLanguage: language,
      signal,
    });
  return {
    reply: result.translated_text || result.translated,
    translation: text,
    provider: expectedProvider === 'google' ? 'Google Cloud Translation' : 'Plotweaver',
  };
}

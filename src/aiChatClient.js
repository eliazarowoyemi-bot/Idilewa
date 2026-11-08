import { translateWithPlotweaver } from './plotweaverClient.js';

const SUPPORTED_CHAT_LANGUAGES = new Set(['yo', 'ig', 'ha']);

export async function sendAiChatMessage({ language, messages, signal }) {
  if (!SUPPORTED_CHAT_LANGUAGES.has(language)) {
    throw new Error('Choose Yorùbá, Igbo, or Hausa for translation practice.');
  }
  const latestMessage = [...messages].reverse().find((message) => message.role === 'user');
  if (typeof latestMessage?.text !== 'string' || !latestMessage.text.trim()) {
    throw new Error('Type an English phrase before requesting a translation.');
  }

  const result = await translateWithPlotweaver({
    text: latestMessage.text.trim(),
    sourceLanguage: 'en',
    targetLanguage: language,
    signal,
  });
  return {
    reply: result.translated_text,
    translation: latestMessage.text.trim(),
    provider: 'Plotweaver',
  };
}

import { getOptionalSessionAccessToken } from './supabaseClient.js';

const SUPPORTED_LANGUAGES = new Set(['yo', 'ig', 'ha', 'sw', 'pcm']);
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1_000;

/**
 * The conversation endpoint rejects history entries that are empty or
 * oversized. Local UI state can contain either (for example a guide message
 * whose translation was cleared), so normalise before sending rather than
 * letting the request fail with a 400.
 */
function normalizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
    .map((item) => ({
      role: item.role,
      text: typeof item.text === 'string' ? item.text.trim() : '',
    }))
    .filter((item) => item.text && item.text.length <= MAX_MESSAGE_LENGTH)
    .slice(-MAX_HISTORY_MESSAGES);
}

async function requestConversation(url, options = {}) {
  const accessToken = await getOptionalSessionAccessToken();
  const headers = { Accept: 'application/json', ...options.headers };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('AI Conversation returned an invalid response. Please try again.', { cause: error });
  }
  if (!response.ok) {
    const error = new Error(typeof result?.error === 'string'
      ? result.error
      : 'AI Conversation could not complete this request. Please try again.');
    error.status = response.status;
    throw error;
  }
  return result;
}

export async function sendAiChatMessage({
  language,
  ageGroup = '9-12',
  level = 'Elementary',
  message,
  conversationId = '',
  messages = [],
  signal,
}) {
  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw new Error('Choose Yorùbá, Igbo, Hausa, Kiswahili, or Nigerian Pidgin for AI Conversation.');
  }
  if (!['3-5', '6-8', '9-12', '13-17', '18+'].includes(ageGroup)) {
    throw new Error('Choose a supported learner age group.');
  }
  if (!['Elementary', 'Intermediate', 'Advanced'].includes(level)) {
    throw new Error('Choose Elementary, Intermediate, or Advanced.');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Type a message before sending it.');
  }
  const result = await requestConversation('/api/ai/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language,
      ageGroup,
      level,
      message: message.trim(),
      conversationId: conversationId || undefined,
      messages: normalizeHistory(messages),
    }),
    signal,
  });
  if (typeof result.reply !== 'string' || !result.reply.trim() || result.language !== language) {
    throw new Error('AI Conversation returned an incomplete reply. Please try again.');
  }
  return {
    reply: result.reply.trim(),
    language: result.language,
    conversationId: typeof result.conversationId === 'string' ? result.conversationId : '',
    persisted: result.persisted === true,
    provider: typeof result.provider === 'string' ? result.provider : '',
    sources: Array.isArray(result.sources) ? result.sources : [],
  };
}

export async function loadAiChatConversation({ conversationId, signal }) {
  if (!/^[0-9a-f-]{36}$/i.test(conversationId || '')) {
    throw new Error('Choose a valid saved conversation.');
  }
  const result = await requestConversation(
    `/api/ai/conversation?id=${encodeURIComponent(conversationId)}`,
    { method: 'GET', signal },
  );
  if (result.conversation?.id !== conversationId || !Array.isArray(result.messages)) {
    throw new Error('AI Conversation returned an incomplete saved conversation.');
  }
  return result;
}

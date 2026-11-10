import { getOptionalSessionAccessToken } from './supabaseClient.js';

const SUPPORTED_LANGUAGES = new Set(['yo', 'ig', 'ha', 'sw', 'pcm']);

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
  message,
  conversationId = '',
  messages = [],
  signal,
}) {
  if (!SUPPORTED_LANGUAGES.has(language)) {
    throw new Error('Choose Yorùbá, Igbo, Hausa, Kiswahili, or Nigerian Pidgin for AI Conversation.');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Type a message before sending it.');
  }
  const result = await requestConversation('/api/ai/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language,
      message: message.trim(),
      conversationId: conversationId || undefined,
      messages,
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

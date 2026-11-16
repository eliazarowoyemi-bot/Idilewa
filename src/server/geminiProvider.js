/**
 * Gemini provider for Ìdíléwa AI conversation.
 *
 * Talks to the Google Generative Language REST API directly through fetch so the
 * deployment needs no extra SDK bundle. Selected with AI_PROVIDER=gemini.
 */
import { AiServiceError, MAX_AI_HISTORY_MESSAGES } from './aiConversation.js';

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_REPLY_LENGTH = 8_000;

function toGeminiRole(role) {
  return role === 'assistant' || role === 'model' ? 'model' : 'user';
}

export function toGeminiContents(messages, message) {
  const history = messages
    .filter((item) => item && typeof item.content === 'string' && item.content.trim())
    .slice(-MAX_AI_HISTORY_MESSAGES)
    .map((item) => ({ role: toGeminiRole(item.role), parts: [{ text: item.content.trim() }] }));
  return [...history, { role: 'user', parts: [{ text: message }] }];
}

function geminiHttpError(status) {
  if (status === 429) {
    return new AiServiceError('The AI service is busy. Wait a moment and try again.', 429);
  }
  if (status === 400 || status === 401 || status === 403) {
    return new AiServiceError('The AI service rejected this deployment\u2019s credentials. Check GEMINI_API_KEY.', 503);
  }
  if (status === 404) {
    return new AiServiceError('The configured Gemini model is unavailable. Check GEMINI_MODEL.', 503);
  }
  return new AiServiceError('The AI service could not complete this message. Try again shortly.', 503);
}

export async function requestGeminiReply({
  systemPrompt,
  message,
  messages = [],
  config,
  fetchImpl = globalThis.fetch,
}) {
  const requestUrl = [config.baseUrl, 'models', encodeURIComponent(config.model) + ':generateContent'].join('/');

  let response;
  try {
    response = await fetchImpl(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: toGeminiContents(messages, message),
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new AiServiceError('The AI model host could not be reached. Try again shortly.', 503, { cause: error });
  }

  if (!response.ok) throw geminiHttpError(response.status);

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new AiServiceError('The AI service returned an unreadable response.', 502, { cause: error });
  }

  const candidate = result?.candidates?.[0];
  const reply = (candidate?.content?.parts || [])
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();

  if (!reply || reply.length > MAX_REPLY_LENGTH) {
    const blocked = Boolean(result?.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY');
    throw new AiServiceError(
      blocked
        ? 'That message could not be answered. Try rephrasing it.'
        : 'The AI service returned no usable reply. Please try again.',
      502,
    );
  }

  return { reply, model: config.model, provider: 'gemini' };
}

export async function createGeminiEmbedding(text, config, fetchImpl = globalThis.fetch) {
  const requestUrl = [config.baseUrl, 'models', encodeURIComponent(config.embeddingModel) + ':embedContent'].join('/');

  let response;
  try {
    response = await fetchImpl(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        model: 'models/' + config.embeddingModel,
        content: { parts: [{ text }] },
      }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    throw new AiServiceError('The language knowledge embedding model could not be reached.', 503, { cause: error });
  }
  if (!response.ok) {
    throw new AiServiceError('The language knowledge embedding model is unavailable.', 503);
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new AiServiceError('The language knowledge embedding response was invalid.', 502, { cause: error });
  }

  const embedding = result?.embedding?.values;
  if (!Array.isArray(embedding) || embedding.length !== 768
    || embedding.some((value) => !Number.isFinite(value))) {
    throw new AiServiceError('The configured embedding model must return 768 numeric values.', 503);
  }
  return '[' + embedding.join(',') + ']';
}

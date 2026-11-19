import { Ollama } from 'ollama';
import { AiServiceError, MAX_AI_HISTORY_MESSAGES } from './aiConversation.js';

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_REPLY_LENGTH = 8_000;

function getOllamaError(error) {
  const status = Number(error?.status_code);
  if (status === 401 || status === 403) {
    return new AiServiceError('The local Ollama server rejected the request. Check its local access settings.', 503, { cause: error });
  }
  if (status === 404) {
    return new AiServiceError('The local Ollama model was not found. Pull the configured model and try again.', 404, { cause: error });
  }
  if (status === 429) {
    return new AiServiceError('The local Ollama server is busy. Wait a moment and try again.', 429, { cause: error });
  }
  if (status >= 400) {
    return new AiServiceError('The local Ollama server could not complete this message.', status >= 500 ? 503 : 502, { cause: error });
  }
  return new AiServiceError(
    'Could not connect to the local Ollama server. Start Ollama Desktop and verify its local API is running.',
    503,
    { cause: error },
  );
}

export async function requestOllamaReply({
  systemPrompt,
  message,
  messages = [],
  config,
  clientFactory = (options) => new Ollama(options),
}) {
  const history = messages
    .filter((item) => item && ['user', 'assistant'].includes(item.role)
      && typeof item.content === 'string' && item.content.trim())
    .slice(-MAX_AI_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content: content.trim() }));
  const client = clientFactory({
    host: config.host,
    fetch: (input, init = {}) => globalThis.fetch(input, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }),
  });

  let result;
  try {
    result = await client.chat({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message },
      ],
      stream: false,
    });
  } catch (error) {
    throw getOllamaError(error);
  }

  const reply = typeof result?.message?.content === 'string'
    ? result.message.content.trim()
    : '';
  if (!reply || reply.length > MAX_REPLY_LENGTH) {
    throw new AiServiceError('The local Ollama server returned no usable reply.', 502);
  }

  return { reply, model: config.model, provider: 'ollama' };
}

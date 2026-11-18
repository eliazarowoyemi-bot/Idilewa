const MAX_MESSAGE_LENGTH = 1_000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_REQUEST_BYTES = 14 * 1024;

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

export async function sendSupportAssistantMessage({ message, messages = [], signal }) {
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('Type a question before sending it.');
  }
  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Questions must be ${MAX_MESSAGE_LENGTH.toLocaleString('en-US')} characters or shorter.`);
  }

  const history = normalizeHistory(messages);
  let payload = { mode: 'support', message: message.trim(), messages: history };
  const encoder = new TextEncoder();
  while (history.length && encoder.encode(JSON.stringify(payload)).byteLength > MAX_REQUEST_BYTES) {
    history.shift();
    payload = { mode: 'support', message: message.trim(), messages: history };
  }

  const response = await fetch('/api/ai/conversation', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
    credentials: 'omit',
    signal,
  });

  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('The Idilewa assistant returned an invalid response. Please try again.', { cause: error });
  }
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string'
      ? result.error
      : 'The Idilewa assistant could not complete this request. Please try again.');
  }
  if (typeof result.reply !== 'string' || !result.reply.trim() || !Array.isArray(result.sources)) {
    throw new Error('The Idilewa assistant returned an incomplete reply. Please try again.');
  }

  const sources = result.sources
    .filter((source) => source
      && typeof source.title === 'string'
      && typeof source.url === 'string'
      && source.url.startsWith('/')
      && !source.url.startsWith('//'))
    .map(({ title, label, url }) => ({
      title: title.trim(),
      label: typeof label === 'string' ? label.trim() : '',
      url,
    }))
    .filter((source) => source.title);

  return { reply: result.reply.trim(), sources };
}

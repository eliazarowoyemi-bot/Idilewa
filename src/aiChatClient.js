export async function sendAiChatMessage({ language, messages, signal }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language, messages }),
    signal,
  });

  let result;
  try {
    result = await response.json();
  } catch {
    result = null;
  }
  if (!response.ok) {
    throw new Error(result?.error || `AI conversation request failed (${response.status}).`);
  }
  if (typeof result?.reply !== 'string'
    || !result.reply.trim()
    || typeof result.translation !== 'string'
    || !result.translation.trim()) {
    throw new Error('The AI conversation service returned an invalid reply.');
  }
  return result;
}

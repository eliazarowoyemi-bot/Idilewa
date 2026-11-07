import assert from 'node:assert/strict';
import test from 'node:test';
import { sendAiChatMessage } from '../src/aiChatClient.js';

test('AI chat client sends the selected language and bounded conversation to its server route', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/chat');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), {
      language: 'yo',
      messages: [{ role: 'user', text: 'How are you?' }],
    });
    return new Response(JSON.stringify({
      reply: 'Báwo ni?',
      translation: 'How are you?',
      provider: 'Google Gemini',
    }));
  };

  try {
    const result = await sendAiChatMessage({
      language: 'yo',
      messages: [{ role: 'user', text: 'How are you?' }],
    });
    assert.equal(result.reply, 'Báwo ni?');
    assert.equal(result.translation, 'How are you?');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('AI chat client surfaces server failures and malformed success responses', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: 'Live AI chat is not configured on this deployment.',
  }), { status: 503 });

  try {
    await assert.rejects(
      sendAiChatMessage({ language: 'yo', messages: [{ role: 'user', text: 'Hello' }] }),
      /not configured/,
    );

    globalThis.fetch = async () => new Response(JSON.stringify({ reply: 'Báwo ni?' }));
    await assert.rejects(
      sendAiChatMessage({ language: 'yo', messages: [{ role: 'user', text: 'Hello' }] }),
      /invalid reply/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

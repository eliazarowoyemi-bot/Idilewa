import assert from 'node:assert/strict';
import test from 'node:test';
import { sendAiChatMessage } from '../src/aiChatClient.js';

test('translation practice sends the latest English phrase to Plotweaver in the selected language', async () => {
  const originalFetch = globalThis.fetch;
  const signal = new AbortController().signal;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/plotweaver/translations');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), {
      text: 'How are you?',
      source_language: 'en',
      target_language: 'yo',
    });
    assert.equal(options.signal, signal);
    return new Response(JSON.stringify({ translated_text: 'Báwo ni?' }));
  };

  try {
    const result = await sendAiChatMessage({
      language: 'yo',
      messages: [
        { role: 'user', text: 'Hello' },
        { role: 'model', text: 'Ẹ káàárọ̀' },
        { role: 'user', text: ' How are you? ' },
      ],
      signal,
    });
    assert.equal(result.reply, 'Báwo ni?');
    assert.equal(result.translation, 'How are you?');
    assert.equal(result.provider, 'Plotweaver');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('translation practice surfaces Plotweaver failures and rejects unsupported languages', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: 'Idilewa voice service reached a rate or usage limit.',
  }), { status: 429 });

  try {
    await assert.rejects(
      sendAiChatMessage({ language: 'yo', messages: [{ role: 'user', text: 'Hello' }] }),
      /rate or usage limit/,
    );
    await assert.rejects(
      sendAiChatMessage({ language: 'sw', messages: [{ role: 'user', text: 'Hello' }] }),
      /Yorùbá, Igbo, or Hausa/,
    );
    await assert.rejects(
      sendAiChatMessage({ language: 'yo', messages: [] }),
      /Type an English phrase/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

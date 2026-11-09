import assert from 'node:assert/strict';
import test from 'node:test';
import { sendAiChatMessage } from '../src/aiChatClient.js';

test('AI Conversation sends the latest English phrase to Plotweaver in the selected language', async () => {
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

test('AI Conversation surfaces Plotweaver failures and rejects unsupported languages', async () => {
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
      sendAiChatMessage({ language: 'pcm', messages: [{ role: 'user', text: 'Hello' }] }),
      /Yorùbá, Igbo, Hausa, or Swahili/,
    );
    await assert.rejects(
      sendAiChatMessage({ language: 'yo', messages: [] }),
      /Type an English phrase/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Swahili uses the existing Google Cloud translation endpoint', async () => {
  const originalFetch = globalThis.fetch;
  const signal = new AbortController().signal;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/translate');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), {
      text: 'Good morning',
      target: 'sw',
    });
    assert.equal(options.signal, signal);
    return new Response(JSON.stringify({
      translated: 'Habari za asubuhi',
      target: 'sw',
      provider: 'Google Cloud Translation',
    }));
  };

  try {
    const result = await sendAiChatMessage({
      language: 'sw',
      translationProvider: 'google',
      messages: [{ role: 'user', text: 'Good morning' }],
      signal,
    });
    assert.equal(result.reply, 'Habari za asubuhi');
    assert.equal(result.translation, 'Good morning');
    assert.equal(result.provider, 'Google Cloud Translation');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

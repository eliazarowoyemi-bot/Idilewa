import assert from 'node:assert/strict';
import test from 'node:test';
import { loadAiChatConversation, sendAiChatMessage } from '../src/aiChatClient.js';

test('AI Conversation sends selected language, message and assistant history to its backend', async () => {
  const originalFetch = globalThis.fetch;
  const signal = new AbortController().signal;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/ai/conversation');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), {
      language: 'yo',
      message: 'Báwo ni?',
      messages: [
        { role: 'user', text: 'Hello' },
        { role: 'assistant', text: 'Ẹ káárọ̀' },
      ],
    });
    assert.equal(options.signal, signal);
    return new Response(JSON.stringify({
      reply: 'Mo wà dáadáa.',
      language: 'yo',
      conversationId: '4a0f1d88-32f1-46ae-bcb2-e185cc167992',
      persisted: true,
      provider: 'Ollama · qwen2.5:7b',
      sources: [],
    }));
  };

  try {
    const result = await sendAiChatMessage({
      language: 'yo',
      message: ' Báwo ni? ',
      messages: [
        { role: 'user', text: 'Hello' },
        { role: 'assistant', text: 'Ẹ káárọ̀' },
      ],
      signal,
    });
    assert.equal(result.reply, 'Mo wà dáadáa.');
    assert.equal(result.language, 'yo');
    assert.equal(result.conversationId, '4a0f1d88-32f1-46ae-bcb2-e185cc167992');
    assert.equal(result.persisted, true);
    assert.equal(result.provider, 'Ollama · qwen2.5:7b');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('AI Conversation surfaces backend failures and rejects unsupported languages', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: 'The AI service is busy. Wait a moment and try again.',
  }), { status: 429 });

  try {
    await assert.rejects(
      sendAiChatMessage({ language: 'yo', message: 'Hello', messages: [{ role: 'user', text: 'Hello' }] }),
      /AI service is busy/,
    );
    await assert.rejects(
      sendAiChatMessage({ language: 'xx', message: 'Hello', messages: [{ role: 'user', text: 'Hello' }] }),
      /Yorùbá, Igbo, Hausa, Kiswahili, or Nigerian Pidgin/,
    );
    await assert.rejects(
      sendAiChatMessage({ language: 'yo', message: '', messages: [] }),
      /Type a message/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('anonymous conversation requests omit bearer auth and validate API response shape', async () => {
  const originalFetch = globalThis.fetch;
  const signal = new AbortController().signal;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/ai/conversation');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), { language: 'sw', message: 'Habari', messages: [] });
    assert.equal(options.signal, signal);
    return new Response(JSON.stringify({
      reply: 'Habari! Unaendeleaje?',
      language: 'sw',
      persisted: false,
      sources: [],
    }));
  };

  try {
    const result = await sendAiChatMessage({
      language: 'sw',
      message: 'Habari',
      messages: [],
      signal,
    });
    assert.equal(result.reply, 'Habari! Unaendeleaje?');
    assert.equal(result.language, 'sw');
    assert.equal(result.persisted, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saved conversation reads are authenticated by the client when configured', async () => {
  const originalFetch = globalThis.fetch;
  const conversationId = '4a0f1d88-32f1-46ae-bcb2-e185cc167992';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `/api/ai/conversation?id=${conversationId}`);
    assert.equal(options.method, 'GET');
    return new Response(JSON.stringify({
      conversation: { id: conversationId, language_code: 'yo' },
      messages: [],
    }));
  };
  try {
    const result = await loadAiChatConversation({ conversationId });
    assert.equal(result.conversation.id, conversationId);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

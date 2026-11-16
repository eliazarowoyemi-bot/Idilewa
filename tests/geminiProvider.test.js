import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AiServiceError,
  createAiKnowledgeEmbedding,
  DEFAULT_GEMINI_MODEL,
  generateAiConversationReply,
  getAiProviderConfig,
  getGeminiConfig,
  resolveAiProvider,
} from '../src/server/aiConversation.js';
import { geminiModelChain } from '../src/server/geminiProvider.js';

const GEMINI_TEST_CONFIG = {
  provider: 'gemini',
  apiKey: 'server-only-test-key',
  baseUrl: 'https://gemini.example.test/v1beta',
  model: 'gemini-flash-latest',
};

test('Gemini configuration defaults, validation and provider selection', () => {
  assert.equal(resolveAiProvider({}), 'gemini');
  assert.equal(resolveAiProvider({ AI_PROVIDER: 'Gemini' }), 'gemini');
  assert.equal(resolveAiProvider({ GEMINI_API_KEY: 'k' }), 'gemini');
  assert.equal(resolveAiProvider({ GOOGLE_AI_API_KEY: 'k' }), 'gemini');
  assert.throws(
    () => resolveAiProvider({ AI_PROVIDER: 'ollama' }),
    (error) => error instanceof AiServiceError && /not supported/.test(error.message),
  );

  assert.throws(
    () => getGeminiConfig({}),
    (error) => error instanceof AiServiceError
      && error.code === 'AI_PROVIDER_NOT_CONFIGURED'
      && /GEMINI_API_KEY/.test(error.message),
  );

  const config = getGeminiConfig({ GEMINI_API_KEY: 'placeholder-key' });
  assert.equal(config.provider, 'gemini');
  assert.equal(config.model, DEFAULT_GEMINI_MODEL);
  assert.equal(config.baseUrl, 'https://generativelanguage.googleapis.com/v1beta');
  assert.equal(config.embeddingModel, '');

  assert.equal(
    getGeminiConfig({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'models/gemini-flash-latest' }).model,
    'gemini-flash-latest',
  );
  assert.throws(
    () => getGeminiConfig({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'bad model!' }),
    /not valid/,
  );
  assert.throws(
    () => getGeminiConfig({ GEMINI_API_KEY: 'k', GEMINI_BASE_URL: 'ftp://invalid.example' }),
    /valid URL/,
  );

  assert.equal(getAiProviderConfig({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'k' }).provider, 'gemini');
  assert.throws(() => getAiProviderConfig({ AI_PROVIDER: 'openai' }), /not supported/);
});

test('Gemini receives system instructions, mapped history and returns its reply', async () => {
  let received;
  const result = await generateAiConversationReply({
    language: 'yo',
    message: 'Báwo ni?',
    messages: [
      { role: 'assistant', content: 'Ẹ káàbọ̀.' },
      { role: 'user', content: 'Ṣé dáadáa?' },
    ],
    knowledge: [{ title: 'Greetings', content: 'Use tone marks.', source_name: 'Reviewed notes' }],
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async (url, options) => {
      received = { url, options };
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Mo wà dáadáa.' }] }, finishReason: 'STOP' }],
      }), { status: 200 });
    },
  });

  assert.equal(
    received.url,
    'https://gemini.example.test/v1beta/models/gemini-flash-latest:generateContent',
  );
  assert.equal(received.options.headers['x-goog-api-key'], 'server-only-test-key');
  assert.equal(received.options.headers.Authorization, undefined);

  const body = JSON.parse(received.options.body);
  assert.match(body.systemInstruction.parts[0].text, /Yorùbá/);
  assert.match(body.systemInstruction.parts[0].text, /Greetings/);
  assert.deepEqual(body.contents.map((item) => item.role), ['model', 'user', 'user']);
  assert.equal(body.contents[0].parts[0].text, 'Ẹ káàbọ̀.');
  assert.equal(body.contents[2].parts[0].text, 'Báwo ni?');
  assert.equal(body.generationConfig.temperature, 0.4);

  assert.equal(result.reply, 'Mo wà dáadáa.');
  assert.equal(result.provider, 'gemini');
  assert.equal(result.model, 'gemini-flash-latest');
});
test('Gemini concatenates multi-part candidates and rejects unusable replies', async () => {
  const result = await generateAiConversationReply({
    language: 'ig',
    message: 'Ndewo',
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Ndewo' }, { text: ' nne.' }] } }],
    })),
  });
  assert.equal(result.reply, 'Ndewo nne.');

  await assert.rejects(generateAiConversationReply({
    language: 'ha',
    message: 'Sannu',
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async () => new Response(JSON.stringify({
      promptFeedback: { blockReason: 'SAFETY' },
    })),
  }), /rephrasing/);

  await assert.rejects(generateAiConversationReply({
    language: 'sw',
    message: 'Habari',
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async () => new Response(JSON.stringify({ candidates: [] })),
  }), /no usable reply/);
});

test('Gemini HTTP failures stay explicit and never produce success-shaped replies', async () => {
  await assert.rejects(generateAiConversationReply({
    language: 'ha',
    message: 'Sannu',
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async () => new Response('{}', { status: 429 }),
  }), (error) => error.statusCode === 429);

  await assert.rejects(generateAiConversationReply({
    language: 'ha',
    message: 'Sannu',
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async () => new Response('{}', { status: 400 }),
  }), /credentials/);

  await assert.rejects(generateAiConversationReply({
    language: 'ha',
    message: 'Sannu',
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async () => new Response('{}', { status: 404 }),
  }), /model is unavailable/);

  await assert.rejects(generateAiConversationReply({
    language: 'sw',
    message: 'Habari',
    config: GEMINI_TEST_CONFIG,
    fetchImpl: async () => { throw new TypeError('network failure'); },
  }), /could not be reached/);
});

test('Gemini knowledge embeddings use embedContent and require 768 numeric values', async () => {
  let received;
  const vector = Array.from({ length: 768 }, (_value, index) => index / 768);
  const embedding = await createAiKnowledgeEmbedding(
    'Ìbà',
    { ...GEMINI_TEST_CONFIG, embeddingModel: 'text-embedding-004' },
    async (url, options) => {
      received = { url, options };
      return new Response(JSON.stringify({ embedding: { values: vector } }));
    },
  );

  assert.equal(
    received.url,
    'https://gemini.example.test/v1beta/models/text-embedding-004:embedContent',
  );
  assert.equal(received.options.headers['x-goog-api-key'], 'server-only-test-key');
  const body = JSON.parse(received.options.body);
  assert.equal(body.model, 'models/text-embedding-004');
  assert.equal(body.content.parts[0].text, 'Ìbà');
  assert.ok(embedding.startsWith('[') && embedding.endsWith(']'));

  await assert.rejects(createAiKnowledgeEmbedding(
    'Ìbà',
    { ...GEMINI_TEST_CONFIG, embeddingModel: 'text-embedding-004' },
    async () => new Response(JSON.stringify({ embedding: { values: [1, 2, 3] } })),
  ), /768 numeric values/);
});

test('Gemini falls back to the next model when the primary is retired or overloaded', async () => {
  const calls = [];
  const result = await generateAiConversationReply({
    language: 'yo',
    message: 'Báwo ni?',
    config: { ...GEMINI_TEST_CONFIG, fallbackModels: ['gemini-3.5-flash', 'gemini-2.5-flash'] },
    fetchImpl: async (url) => {
      calls.push(url);
      if (calls.length === 1) {
        return new Response(JSON.stringify({ error: { code: 503, status: 'UNAVAILABLE' } }), { status: 503 });
      }
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Mo wà dáadáa.' }] }, finishReason: 'STOP' }],
      }), { status: 200 });
    },
  });

  assert.deepEqual(calls, [
    'https://gemini.example.test/v1beta/models/gemini-flash-latest:generateContent',
    'https://gemini.example.test/v1beta/models/gemini-3.5-flash:generateContent',
  ]);
  assert.equal(result.reply, 'Mo wà dáadáa.');
  assert.equal(result.model, 'gemini-3.5-flash');
});

test('Gemini stops immediately on credential, quota and request errors', async () => {
  for (const status of [400, 401, 403, 429]) {
    let calls = 0;
    await assert.rejects(generateAiConversationReply({
      language: 'ha',
      message: 'Sannu',
      config: { ...GEMINI_TEST_CONFIG, fallbackModels: ['gemini-3.5-flash', 'gemini-2.5-flash'] },
      fetchImpl: async () => {
        calls += 1;
        return new Response('{}', { status });
      },
    }));
    assert.equal(calls, 1, `status ${status} must not cycle through fallback models`);
  }
});

test('Gemini reports an overload message only after the whole model chain fails', async () => {
  let calls = 0;
  await assert.rejects(generateAiConversationReply({
    language: 'sw',
    message: 'Habari',
    config: { ...GEMINI_TEST_CONFIG, fallbackModels: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-lite-latest'] },
    fetchImpl: async () => {
      calls += 1;
      return new Response('{}', { status: 503 });
    },
  }), (error) => error instanceof AiServiceError
    && error.statusCode === 503
    && /overloaded/i.test(error.message));
  assert.equal(calls, 3, 'the chain is capped at three attempts');
});

test('Gemini configuration exposes an ordered, de-duplicated fallback chain', () => {
  const config = getGeminiConfig({ GEMINI_API_KEY: 'placeholder-key' });
  assert.equal(config.model, DEFAULT_GEMINI_MODEL);
  assert.deepEqual(config.fallbackModels, ['gemini-3.5-flash', 'gemini-2.5-flash']);
  assert.ok(!config.fallbackModels.includes(config.model));

  const pinned = getGeminiConfig({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'gemini-3.5-flash' });
  assert.equal(pinned.model, 'gemini-3.5-flash');
  assert.ok(!pinned.fallbackModels.includes('gemini-3.5-flash'));

  const custom = getGeminiConfig({
    GEMINI_API_KEY: 'k',
    GEMINI_FALLBACK_MODELS: 'models/gemini-3.5-flash, gemini-2.5-pro',
  });
  assert.deepEqual(custom.fallbackModels, ['gemini-3.5-flash', 'gemini-2.5-pro']);

  assert.deepEqual(geminiModelChain({ model: 'primary-model', fallbackModels: ['primary-model', 'second-model', '  '] }), [
    'primary-model',
    'second-model',
  ]);
  assert.deepEqual(geminiModelChain({}), []);
});


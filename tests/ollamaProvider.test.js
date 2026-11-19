import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAiKnowledgeEmbedding,
  DEFAULT_OLLAMA_MODEL,
  generateAiConversationReply,
  getAiProviderConfig,
} from '../src/server/aiConversation.js';
import { requestOllamaReply } from '../src/server/ollamaProvider.js';

const config = {
  provider: 'ollama',
  host: 'http://localhost:11434',
  model: DEFAULT_OLLAMA_MODEL,
};

test('local Ollama receives system instructions, history and the current message without cloud auth', async () => {
  let clientOptions;
  let chatRequest;
  const result = await generateAiConversationReply({
    language: 'yo',
    message: 'Báwo ni?',
    messages: [
      { role: 'assistant', content: 'Ẹ káàbọ̀.' },
      { role: 'user', content: 'Ṣé dáadáa?' },
    ],
    knowledge: [{ title: 'Greetings', content: 'Use tone marks.' }],
    config,
    ollamaFactory: (options) => {
      clientOptions = options;
      return {
        chat: async (request) => {
          chatRequest = request;
          return { message: { content: 'Mo wà dáadáa.' } };
        },
      };
    },
  });

  assert.equal(clientOptions.host, 'http://localhost:11434');
  assert.equal(clientOptions.headers, undefined);
  assert.equal(typeof clientOptions.fetch, 'function');
  assert.equal(chatRequest.model, 'llama3.2');
  assert.equal(chatRequest.stream, false);
  assert.deepEqual(chatRequest.messages.map(({ role }) => role), ['system', 'assistant', 'user', 'user']);
  assert.match(chatRequest.messages[0].content, /Yorùbá/);
  assert.match(chatRequest.messages[0].content, /Greetings/);
  assert.equal(chatRequest.messages.at(-1).content, 'Báwo ni?');
  assert.deepEqual(result, {
    reply: 'Mo wà dáadáa.',
    model: 'llama3.2',
    provider: 'ollama',
  });
});

test('local Ollama config needs neither a cloud key nor Gemini credentials', () => {
  assert.equal(
    getAiProviderConfig({ AI_PROVIDER: 'ollama' }).model,
    DEFAULT_OLLAMA_MODEL,
  );
  assert.equal(getAiProviderConfig({ AI_PROVIDER: 'ollama' }).host, 'http://localhost:11434');
});

test('local Ollama failures stay explicit for auth, model and rate-limit errors', async () => {
  const cases = [
    [401, 503, /local Ollama server rejected/],
    [404, 404, /local Ollama model was not found/],
    [429, 429, /local Ollama server is busy/],
  ];
  for (const [upstreamStatus, expectedStatus, expectedMessage] of cases) {
    await assert.rejects(
      requestOllamaReply({
        systemPrompt: 'instructions',
        message: 'Hello',
        config,
        clientFactory: () => ({
          chat: async () => {
            throw Object.assign(new Error('Private upstream response'), { status_code: upstreamStatus });
          },
        }),
      }),
      (error) => error.statusCode === expectedStatus && expectedMessage.test(error.message),
    );
  }
});

test('Ollama returns errors for network failures and unusable replies', async () => {
  await assert.rejects(
    requestOllamaReply({
      systemPrompt: 'instructions',
      message: 'Hello',
      config,
      clientFactory: () => ({ chat: async () => { throw new TypeError('network failure'); } }),
    }),
    (error) => error.statusCode === 503 && /Could not connect to the local Ollama server/.test(error.message),
  );

  await assert.rejects(
    requestOllamaReply({
      systemPrompt: 'instructions',
      message: 'Hello',
      config,
      clientFactory: () => ({ chat: async () => ({ message: { content: ' ' } }) }),
    }),
    (error) => error.statusCode === 502 && /local Ollama server returned no usable reply/.test(error.message),
  );
});

test('Ollama selection skips Gemini-only knowledge embeddings', async () => {
  let fetched = false;
  const embedding = await createAiKnowledgeEmbedding('A language note', config, async () => {
    fetched = true;
    throw new Error('an Ollama selection must not call Gemini');
  });
  assert.equal(embedding, null);
  assert.equal(fetched, false);
});

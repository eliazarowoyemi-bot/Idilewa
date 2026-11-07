import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import translateHandler from '../api/translate.js';

const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

function createResponse() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function withMocks({ apiKey = 'test-gemini-key', fetchMock, run }) {
  const previousKey = process.env.GEMINI_API_KEY;
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  if (apiKey === null) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = apiKey;
  if (fetchMock) globalThis.fetch = fetchMock;
  console.error = () => {};
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  }
}

function request({ method = 'POST', body, headers = {} } = {}) {
  return { method, url: '/api/translate?service=chat', body, headers };
}

function geminiResponse(reply = 'Ẹ káàárọ̀.', translation = 'Good morning.') {
  return new Response(JSON.stringify({
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({ reply, translation }),
        }],
      },
    }],
  }));
}

test('AI chat is routed through the shared serverless translation function', () => {
  assert.ok(vercelConfig.rewrites.some(({ source, destination }) =>
    source === '/api/chat' && destination === '/api/translate?service=chat'));
});

test('AI chat rejects unsupported methods and reports missing server configuration', async () => {
  await withMocks({
    apiKey: null,
    fetchMock: async () => {
      throw new Error('Gemini must not be called without a configured key.');
    },
    run: async () => {
      const method = createResponse();
      await translateHandler(request({ method: 'GET' }), method);
      assert.equal(method.statusCode, 405);
      assert.equal(method.headers.Allow, 'POST');

      const unconfigured = createResponse();
      await translateHandler(request({ body: { language: 'yo', messages: [{ role: 'user', text: 'Hello' }] } }), unconfigured);
      assert.equal(unconfigured.statusCode, 503);
      assert.match(unconfigured.body.error, /not configured/i);
    },
  });
});

test('AI chat validates language, history, message shape, and request size before calling Gemini', async () => {
  await withMocks({
    fetchMock: async () => {
      throw new Error('Invalid chat requests must not reach Gemini.');
    },
    run: async () => {
      const invalidRequests = [
        [{ language: 'unsupported', messages: [{ role: 'user', text: 'Hello' }] }, 400],
        [{ language: 'yo', messages: [] }, 400],
        [{ language: 'yo', messages: [{ role: 'assistant', text: 'Hello' }] }, 400],
        [{ language: 'yo', messages: [{ role: 'model', text: 'Hello' }] }, 400],
        [{ language: 'yo', messages: [{ role: 'user', text: 'Hello' }, { role: 'user', text: 'Again' }] }, 400],
        [{ language: 'yo', messages: [{ role: 'user', text: 'x'.repeat(601) }] }, 400],
        [{ language: 'yo', messages: Array.from({ length: 13 }, () => ({ role: 'user', text: 'Hello' })) }, 400],
      ];

      for (const [body, expectedStatus] of invalidRequests) {
        const response = createResponse();
        await translateHandler(request({ body }), response);
        assert.equal(response.statusCode, expectedStatus);
      }

      const oversized = createResponse();
      await translateHandler(request({
        body: { language: 'yo', messages: [{ role: 'user', text: 'Hello' }] },
        headers: { 'content-length': '12000' },
      }), oversized);
      assert.equal(oversized.statusCode, 413);
    },
  });
});

test('AI chat keeps the Gemini key in a header and returns a bounded bilingual reply', async () => {
  await withMocks({
    fetchMock: async (url, options) => {
      assert.equal(String(url), 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
      assert.equal(options.headers['x-goog-api-key'], 'test-gemini-key');
      assert.doesNotMatch(String(url), /key=/i);
      const body = JSON.parse(options.body);
      assert.equal(body.contents.at(-1).role, 'user');
      assert.deepEqual(body.contents.at(-1).parts, [{ text: 'How are you?' }]);
      assert.match(body.systemInstruction.parts[0].text, /children and families/);
      assert.deepEqual(body.generationConfig.responseSchema.required, ['reply', 'translation']);
      return geminiResponse();
    },
    run: async () => {
      const response = createResponse();
      await translateHandler(request({
        body: {
          language: 'yo',
          messages: [
            { role: 'user', text: 'Hello' },
            { role: 'model', text: 'Ẹ káàárọ̀.' },
            { role: 'user', text: ' How are you? ' },
          ],
        },
      }), response);

      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['Cache-Control'], 'no-store');
      assert.equal(response.headers['X-Content-Type-Options'], 'nosniff');
      assert.deepEqual(response.body, {
        reply: 'Ẹ káàárọ̀.',
        translation: 'Good morning.',
        provider: 'Google Gemini',
      });
    },
  });
});

test('AI chat sanitizes provider and malformed-response errors', async () => {
  await withMocks({
    fetchMock: async () => new Response(JSON.stringify({
      error: { message: 'private upstream response' },
    }), { status: 429 }),
    run: async () => {
      const rateLimited = createResponse();
      await translateHandler(request({
        body: { language: 'yo', messages: [{ role: 'user', text: 'Hello' }] },
      }), rateLimited);
      assert.equal(rateLimited.statusCode, 429);
      assert.match(rateLimited.body.error, /try again shortly/i);
      assert.doesNotMatch(JSON.stringify(rateLimited.body), /private upstream response/);
    },
  });

  await withMocks({
    fetchMock: async () => new Response(JSON.stringify({
      error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. private detail' },
    }), { status: 400 }),
    run: async () => {
      const invalidKey = createResponse();
      await translateHandler(request({
        body: { language: 'yo', messages: [{ role: 'user', text: 'Hello' }] },
      }), invalidKey);
      assert.equal(invalidKey.statusCode, 503);
      assert.match(invalidKey.body.error, /Gemini API key/i);
      assert.doesNotMatch(JSON.stringify(invalidKey.body), /private detail/i);
    },
  });

  await withMocks({
    fetchMock: async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'not JSON' }] } }],
    })),
    run: async () => {
      const invalid = createResponse();
      await translateHandler(request({
        body: { language: 'yo', messages: [{ role: 'user', text: 'Hello' }] },
      }), invalid);
      assert.equal(invalid.statusCode, 502);
      assert.match(invalid.body.error, /temporarily unavailable/i);
    },
  });
});

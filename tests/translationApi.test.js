import assert from 'node:assert/strict';
import test from 'node:test';
import translateHandler from '../api/translate.js';

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

async function withTranslationMocks({ apiKey = 'test-plotweaver-key', fetchMock, run }) {
  const previousKey = process.env.PLOTWEAVER_API_KEY;
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  if (apiKey === null) delete process.env.PLOTWEAVER_API_KEY;
  else process.env.PLOTWEAVER_API_KEY = apiKey;
  globalThis.fetch = fetchMock;
  console.error = () => {};
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (previousKey === undefined) delete process.env.PLOTWEAVER_API_KEY;
    else process.env.PLOTWEAVER_API_KEY = previousKey;
  }
}

test('translation endpoint validates methods, configuration and request bodies', async () => {
  await withTranslationMocks({
    apiKey: null,
    fetchMock: async () => {
      throw new Error('Translation must not call Plotweaver without a configured key.');
    },
    run: async () => {
      const unconfigured = createResponse();
      await translateHandler({ method: 'POST', headers: {}, body: {} }, unconfigured);
      assert.equal(unconfigured.statusCode, 503);

      const method = createResponse();
      await translateHandler({ method: 'DELETE', headers: {} }, method);
      assert.equal(method.statusCode, 405);
      assert.equal(method.headers.Allow, 'GET, POST');
    },
  });

  await withTranslationMocks({
    fetchMock: async () => {
      throw new Error('Validation should prevent upstream calls.');
    },
    run: async () => {
      for (const [body, expectedStatus] of [
        [{ text: '', target: 'yo' }, 400],
        [{ text: 'Hello', target: 'bad value' }, 400],
        [{ text: 'Hello', target: 'yo', source: 'bad value' }, 400],
        [{ text: 'x'.repeat(2_001), target: 'yo' }, 413],
      ]) {
        const response = createResponse();
        await translateHandler({ method: 'POST', headers: {}, body }, response);
        assert.equal(response.statusCode, expectedStatus, JSON.stringify(body));
      }
    },
  });
});

test('translation endpoint lists Plotweaver translation languages', async () => {
  await withTranslationMocks({
    fetchMock: async (url, options) => {
      assert.equal(
        String(url),
        'https://api.plotweaver.app/v1/languages?service=translation',
      );
      assert.equal(options.headers['X-API-Key'], 'test-plotweaver-key');
      return new Response(JSON.stringify([
        { code: 'yo', name: 'Yoruba', services: ['tts', 'translation'] },
        { code: 'en', name: 'English', services: ['asr', 'translation'] },
        { code: '../bad', name: 'Invalid', services: ['translation'] },
      ]), { status: 200 });
    },
    run: async () => {
      const response = createResponse();
      await translateHandler({ method: 'GET', headers: {} }, response);
      assert.equal(response.statusCode, 200);
      assert.deepEqual(response.body.languages, [
        { code: 'en', name: 'English' },
        { code: 'yo', name: 'Yoruba' },
      ]);
      assert.match(response.headers['Cache-Control'], /s-maxage=86400/);
    },
  });
});

test('translation endpoint sends plain text to Plotweaver and returns machine translation', async () => {
  await withTranslationMocks({
    fetchMock: async (url, options) => {
      assert.equal(String(url), 'https://api.plotweaver.app/v1/translations');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers['X-API-Key'], 'test-plotweaver-key');
      assert.equal(options.headers['Content-Type'], 'application/json; charset=utf-8');
      assert.deepEqual(JSON.parse(options.body), {
        text: 'God is good to everyone today.',
        source_language: 'en',
        target_language: 'yo',
      });
      return new Response(JSON.stringify({
        translated_text: 'Ọlọ́run dára sí gbogbo ènìyàn lónìí.',
      }), { status: 200 });
    },
    run: async () => {
      const response = createResponse();
      await translateHandler({
        method: 'POST',
        headers: {},
        body: { text: ' God is good to everyone today. ', target: 'yo' },
      }, response);
      assert.equal(response.statusCode, 200);
      assert.deepEqual(response.body, {
        translated: 'Ọlọ́run dára sí gbogbo ènìyàn lónìí.',
        source: 'en',
        target: 'yo',
        provider: 'Plotweaver',
        machineTranslated: true,
      });
      assert.equal(response.headers['Cache-Control'], 'no-store');
    },
  });
});

test('translation endpoint explains Plotweaver account problems instead of claiming success', async () => {
  const cases = [
    [403, 503, /not enabled for the configured account/],
    [401, 503, /credentials/],
    [429, 429, /rate limit/],
    [500, 502, /temporarily unavailable/],
  ];
  for (const [upstreamStatus, expectedStatus, pattern] of cases) {
    await withTranslationMocks({
      fetchMock: async () => new Response('{}', { status: upstreamStatus }),
      run: async () => {
        const response = createResponse();
        await translateHandler({
          method: 'POST',
          headers: {},
          body: { text: 'Hello', target: 'yo' },
        }, response);
        assert.equal(response.statusCode, expectedStatus, `upstream ${upstreamStatus}`);
        assert.match(response.body.error, pattern);
        assert.equal(response.body.translated, undefined);
      },
    });
  }
});

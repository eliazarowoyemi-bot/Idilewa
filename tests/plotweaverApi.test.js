import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';
import plotweaverHandler from '../api/plotweaver/[...path].js';

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
    send(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

async function withMocks({ apiKey = 'test-plotweaver-key', fetchMock, run }) {
  const previousKey = process.env.PLOTWEAVER_API_KEY;
  const previousAlias = process.env.Idilewa;
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  if (apiKey === null) {
    delete process.env.PLOTWEAVER_API_KEY;
    delete process.env.Idilewa;
  } else {
    process.env.PLOTWEAVER_API_KEY = apiKey;
  }
  globalThis.fetch = fetchMock;
  console.error = () => {};
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (previousKey === undefined) delete process.env.PLOTWEAVER_API_KEY;
    else process.env.PLOTWEAVER_API_KEY = previousKey;
    if (previousAlias === undefined) delete process.env.Idilewa;
    else process.env.Idilewa = previousAlias;
  }
}

function request({ method = 'GET', path, headers = {}, body }) {
  const req = Readable.from(body === undefined ? [] : [body]);
  req.method = method;
  req.url = `/api/plotweaver/${path}`;
  req.headers = headers;
  return req;
}

test('language lookup is public while protected services require a configured key', async () => {
  await withMocks({
    apiKey: null,
    fetchMock: async (url, options) => {
      assert.equal(String(url), 'https://api.plotweaver.app/v1/languages?service=tts');
      assert.equal(options.headers['X-API-Key'], undefined);
      return new Response(JSON.stringify([{ code: 'yo', name: 'Yoruba', services: ['tts'] }]));
    },
    run: async () => {
      const languages = createResponse();
      await plotweaverHandler(request({ path: 'languages?service=tts' }), languages);
      assert.equal(languages.statusCode, 200);
      assert.equal(languages.body[0].code, 'yo');

      const voices = createResponse();
      await plotweaverHandler(request({ path: 'voices' }), voices);
      assert.equal(voices.statusCode, 503);
    },
  });
});

test('speech requests keep the key server-side and return provider audio', async () => {
  await withMocks({
    fetchMock: async (url, options) => {
      assert.equal(String(url), 'https://api.plotweaver.app/v1/speech');
      assert.equal(options.headers['X-API-Key'], 'test-plotweaver-key');
      assert.deepEqual(JSON.parse(options.body), {
        text: 'Á. É. Ẹ́. Í. Ó. Ọ́. Ú',
        language: 'yo',
        voice_id: 'morenike',
      });
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'audio/wav', 'X-Model': 'storm-v1' },
      });
    },
    run: async () => {
      const response = createResponse();
      const body = Buffer.from(JSON.stringify({
        text: 'Á. É. Ẹ́. Í. Ó. Ọ́. Ú',
        language: 'yo',
        voice_id: 'morenike',
      }));
      await plotweaverHandler(request({
        method: 'POST',
        path: 'speech',
        headers: { 'content-type': 'application/json', 'content-length': String(body.length) },
        body,
      }), response);
      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['Content-Type'], 'audio/wav');
      assert.equal(response.headers['x-model'], 'storm-v1');
      assert.deepEqual(response.body, Buffer.from([1, 2, 3]));
    },
  });
});

test('the existing Idilewa environment variable is accepted as a server-side key alias', async () => {
  const previousKey = process.env.PLOTWEAVER_API_KEY;
  const previousAlias = process.env.Idilewa;
  const originalFetch = globalThis.fetch;
  delete process.env.PLOTWEAVER_API_KEY;
  process.env.Idilewa = 'test-legacy-key';
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers['X-API-Key'], 'test-legacy-key');
    return new Response(JSON.stringify({ translated_text: 'Báwo ni?' }));
  };
  try {
    const response = createResponse();
    const body = Buffer.from(JSON.stringify({
      text: 'How are you?',
      source_language: 'en',
      target_language: 'yo',
    }));
    await plotweaverHandler(request({
      method: 'POST',
      path: 'translations',
      headers: { 'content-type': 'application/json' },
      body,
    }), response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.translated_text, 'Báwo ni?');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.PLOTWEAVER_API_KEY;
    else process.env.PLOTWEAVER_API_KEY = previousKey;
    if (previousAlias === undefined) delete process.env.Idilewa;
    else process.env.Idilewa = previousAlias;
  }
});

test('translation validation and provider errors are surfaced without upstream details', async () => {
  await withMocks({
    fetchMock: async (_url, options) => {
      assert.deepEqual(JSON.parse(options.body), {
        text: 'Hello',
        source_language: 'en',
        target_language: 'yo',
      });
      return new Response(JSON.stringify({ detail: 'private provider error' }), { status: 429 });
    },
    run: async () => {
      const invalidBody = Buffer.from(JSON.stringify({
        text: 'x'.repeat(2_001),
        source_language: 'en',
        target_language: 'yo',
      }));
      const invalid = createResponse();
      await plotweaverHandler(request({
        method: 'POST',
        path: 'translations',
        headers: { 'content-type': 'application/json' },
        body: invalidBody,
      }), invalid);
      assert.equal(invalid.statusCode, 400);

      const body = Buffer.from(JSON.stringify({
        text: 'Hello',
        source_language: 'en',
        target_language: 'yo',
      }));
      const response = createResponse();
      await plotweaverHandler(request({
        method: 'POST',
        path: 'translations',
        headers: { 'content-type': 'application/json' },
        body,
      }), response);
      assert.equal(response.statusCode, 429);
      assert.match(response.body.error, /rate or usage limit/i);
      assert.match(response.body.error, /Idilewa/i);
      assert.doesNotMatch(response.body.error, /Plotweaver/i);
      assert.doesNotMatch(JSON.stringify(response.body), /private provider error/);
    },
  });
});

test('transcription uploads audio as multipart data and returns Plotweaver text', async () => {
  await withMocks({
    fetchMock: async (url, options) => {
      assert.equal(String(url), 'https://api.plotweaver.app/v1/transcriptions');
      assert.equal(options.headers['X-API-Key'], 'test-plotweaver-key');
      assert.ok(options.body instanceof FormData);
      assert.equal(options.body.get('language'), 'yo');
      assert.equal(options.body.get('file').name, 'practice.webm');
      return new Response(JSON.stringify({ text: 'Ẹ káàárọ̀', language: 'yo' }));
    },
    run: async () => {
      const form = new FormData();
      form.append('file', new Blob(['audio bytes'], { type: 'audio/webm' }), 'practice.webm');
      form.append('language', 'yo');
      const multipartRequest = new Request('https://idilewa.local/upload', {
        method: 'POST',
        body: form,
      });
      const body = Buffer.from(await multipartRequest.arrayBuffer());
      const response = createResponse();
      await plotweaverHandler(request({
        method: 'POST',
        path: 'transcriptions',
        headers: {
          'content-type': multipartRequest.headers.get('content-type'),
          'content-length': String(body.length),
        },
        body,
      }), response);
      assert.equal(response.statusCode, 200);
      assert.equal(response.body.text, 'Ẹ káàárọ̀');
    },
  });
});

test('voice cloning requires explicit consent before any upstream request', async () => {
  await withMocks({
    fetchMock: async () => {
      throw new Error('A request without consent must not reach the provider.');
    },
    run: async () => {
      const boundary = 'test-boundary';
      const body = Buffer.from([
        `--${boundary}`,
        'Content-Disposition: form-data; name="name"',
        '',
        'My voice',
        `--${boundary}--`,
        '',
      ].join('\r\n'));
      const response = createResponse();
      await plotweaverHandler(request({
        method: 'POST',
        path: 'voices',
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
        body,
      }), response);
      assert.equal(response.statusCode, 400);
      assert.match(response.body.error, /permission to clone/i);
    },
  });
});

test('voice cloning forwards an opted-in recording and omits the consent field upstream', async () => {
  await withMocks({
    fetchMock: async (url, options) => {
      assert.equal(String(url), 'https://api.plotweaver.app/v1/voices');
      assert.ok(options.body instanceof FormData);
      assert.equal(options.body.get('name'), 'Family narrator');
      assert.equal(options.body.get('language'), 'yo');
      assert.equal(options.body.get('consent'), null);
      assert.equal(options.body.get('file').name, 'voice.wav');
      return new Response(JSON.stringify({ id: 'cloned-voice-1' }), { status: 201 });
    },
    run: async () => {
      const form = new FormData();
      form.append('name', 'Family narrator');
      form.append('language', 'yo');
      form.append('file', new Blob(['audio bytes'], { type: 'audio/wav' }), 'voice.wav');
      form.append('consent', 'yes');
      const multipartRequest = new Request('https://idilewa.local/upload', {
        method: 'POST',
        body: form,
      });
      const body = Buffer.from(await multipartRequest.arrayBuffer());
      const response = createResponse();
      await plotweaverHandler(request({
        method: 'POST',
        path: 'voices',
        headers: { 'content-type': multipartRequest.headers.get('content-type') },
        body,
      }), response);
      assert.equal(response.statusCode, 201);
      assert.equal(response.body.id, 'cloned-voice-1');
    },
  });
});

test('voice cloning rejects browser-only recording formats before contacting Plotweaver', async () => {
  await withMocks({
    fetchMock: async () => {
      throw new Error('Unsupported clone audio must not reach the provider.');
    },
    run: async () => {
      const form = new FormData();
      form.append('name', 'Family narrator');
      form.append('language', 'yo');
      form.append('file', new Blob(['audio bytes'], { type: 'audio/webm' }), 'voice.webm');
      form.append('consent', 'yes');
      const multipartRequest = new Request('https://idilewa.local/upload', {
        method: 'POST',
        body: form,
      });
      const response = createResponse();
      await plotweaverHandler(request({
        method: 'POST',
        path: 'voices',
        headers: { 'content-type': multipartRequest.headers.get('content-type') },
        body: Buffer.from(await multipartRequest.arrayBuffer()),
      }), response);
      assert.equal(response.statusCode, 400);
      assert.match(response.body.error, /WAV, MP3, FLAC, OGG, or M4A/i);
    },
  });
});

test('unsupported methods and origins are rejected', async () => {
  await withMocks({
    fetchMock: async () => {
      throw new Error('Unsupported requests must not reach the provider.');
    },
    run: async () => {
      const method = createResponse();
      await plotweaverHandler(request({
        method: 'DELETE',
        path: 'speech',
        headers: {},
      }), method);
      assert.equal(method.statusCode, 405);
      assert.equal(method.headers.Allow, 'POST');

      const clonedVoices = createResponse();
      await plotweaverHandler(request({
        path: 'voices?type=cloned',
      }), clonedVoices);
      assert.equal(clonedVoices.statusCode, 400);
      assert.match(clonedVoices.body.error, /only lists built-in voices/i);

      const privateVoice = createResponse();
      await plotweaverHandler(request({
        path: 'voices/private-clone',
      }), privateVoice);
      assert.equal(privateVoice.statusCode, 404);

      const origin = createResponse();
      await plotweaverHandler(request({
        path: 'languages',
        headers: { origin: 'https://not-idilewa.example' },
      }), origin);
      assert.equal(origin.statusCode, 403);
    },
  });
});

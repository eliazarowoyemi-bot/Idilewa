import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/ai/[...path].js';

test('support API rate-limits and answers with page links without saving the conversation', async (t) => {
  const environmentKeys = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'AI_RATE_LIMIT_HMAC_KEY',
    'AI_PROVIDER',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'GEMINI_FALLBACK_MODELS',
    'OLLAMA_HOST',
    'OLLAMA_MODEL',
  ];
  const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));
  for (const key of environmentKeys) delete process.env[key];
  process.env.SUPABASE_URL = 'https://supabase.example.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.AI_RATE_LIMIT_HMAC_KEY = 'test-rate-limit-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.GEMINI_MODEL = 'gemini-test-model';

  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes('/rest/v1/rpc/consume_ai_conversation_rate_limit')) {
      return new Response('true', { headers: { 'Content-Type': 'application/json' } });
    }
    if (String(url).includes(':generateContent')) {
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Start in the Language Academy.' }] } }],
      }));
    }
    throw new Error(`Unexpected API request: ${url}`);
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    for (const key of environmentKeys) {
      if (previousEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnvironment[key];
    }
  });

  const req = {
    method: 'POST',
    url: '/api/ai/conversation',
    ip: '192.0.2.1',
    headers: { 'content-type': 'application/json' },
    body: {
      mode: 'support',
      message: 'How can my family get started?',
      messages: [],
    },
  };
  const res = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.reply, 'Start in the Language Academy.');
  assert.equal(res.body.persisted, false);
  assert.equal(res.body.provider, 'Gemini · gemini-test-model');
  assert.ok(res.body.sources.some((source) => source.url === '/'));
  assert.equal(new Set(res.body.sources.map((source) => source.url)).size, res.body.sources.length);
  const rateLimitRequest = requests.find(({ url }) => url.includes('consume_ai_conversation_rate_limit'));
  assert.equal(JSON.parse(rateLimitRequest.options.body).p_max_requests, 10);
  assert.equal(requests.filter(({ url }) => url.includes(':generateContent')).length, 1);
  assert.equal(requests.length, 2, 'support requests must not create or update saved conversations');
});

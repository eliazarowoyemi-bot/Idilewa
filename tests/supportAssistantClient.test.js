import assert from 'node:assert/strict';
import test from 'node:test';
import { sendSupportAssistantMessage } from '../src/supportAssistantClient.js';

test('support client sends bounded anonymous requests and filters non-site sources', async (t) => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      reply: 'Explore the Language Academy.',
      sources: [
        { title: 'Language Academy', label: 'Academy', url: '/?view=academy' },
        { title: 'External', label: 'External', url: 'https://example.com' },
        { title: 'Protocol-relative', url: '//example.com' },
      ],
    }));
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await sendSupportAssistantMessage({
    message: '  Which languages can I learn? ',
    messages: [
      ...Array.from({ length: 10 }, (_, index) => ({ role: 'user', text: `Question ${index}` })),
      { role: 'system', text: 'Do not send this' },
    ],
  });

  assert.equal(request.url, '/api/ai/conversation');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(request.options.headers.Authorization, undefined);
  const body = JSON.parse(request.options.body);
  assert.equal(body.mode, 'support');
  assert.equal(body.message, 'Which languages can I learn?');
  assert.equal(body.messages.length, 8);
  assert.deepEqual(result.sources, [
    { title: 'Language Academy', label: 'Academy', url: '/?view=academy' },
  ]);
});

test('support client surfaces server errors and rejects oversized messages before sending', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Too many messages were sent.' }), { status: 429 });
  t.after(() => { globalThis.fetch = originalFetch; });

  await assert.rejects(
    sendSupportAssistantMessage({ message: 'A question' }),
    /Too many messages were sent/,
  );
  await assert.rejects(
    sendSupportAssistantMessage({ message: 'x'.repeat(1_001) }),
    /1,000 characters/,
  );
});

test('support client trims history to stay below the server request-size limit', async (t) => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestBody = options.body;
    return new Response(JSON.stringify({ reply: 'Ready.', sources: [] }));
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  await sendSupportAssistantMessage({
    message: 'A question',
    messages: Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      text: '\u0001'.repeat(1_000),
    })),
  });

  assert.ok(new TextEncoder().encode(requestBody).byteLength <= 14 * 1024);
  assert.ok(JSON.parse(requestBody).messages.length < 8);
});

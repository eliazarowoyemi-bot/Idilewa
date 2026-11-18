import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../src/server/authActivity.js';
import { createAuthActivityEmail } from '../src/server/authActivityEmail.js';

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

test('account activity emails are branded and accept only supported events', () => {
  const email = createAuthActivityEmail({
    event: 'sign-in',
    logoUrl: 'https://idilewa.com/assets/idilewa-mark.png',
    timestamp: '2026-10-23T06:00:00.000Z',
  });
  assert.match(email.subject, /sign-in to your Idilewa account/i);
  assert.match(email.html, /idilewa-mark\.png/);
  assert.match(email.html, /Ìdíléwa[\s\S]*Our Language\. Our Future\./);
  assert.match(email.text, /2026-10-23T06:00:00\.000Z/);
  assert.throws(() => createAuthActivityEmail({
    event: 'password',
    logoUrl: 'https://idilewa.com/assets/idilewa-mark.png',
    timestamp: '2026-10-23T06:00:00.000Z',
  }));
  assert.throws(() => createAuthActivityEmail({
    event: 'sign-in',
    logoUrl: 'http://idilewa.com/assets/idilewa-mark.png',
    timestamp: '2026-10-23T06:00:00.000Z',
  }));
});

test('activity endpoint requires a bearer session and sends only to the authenticated user', async () => {
  const envNames = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GUARDIAN_TOKEN_SECRET',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'APP_BASE_URL',
  ];
  const previousEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const requests = [];
  Object.assign(process.env, {
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    GUARDIAN_TOKEN_SECRET: 'test-only-secret-that-is-at-least-32-characters',
    RESEND_API_KEY: 'test-resend-key',
    RESEND_FROM_EMAIL: 'Idilewa <no-reply@example.com>',
    APP_BASE_URL: 'https://idilewa.com',
  });
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    const body = init.body ? JSON.parse(init.body) : null;
    requests.push({ url, body });
    if (url.endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'adult@example.com',
      }), { status: 200 });
    }
    if (url.includes('/rpc/guardian_rate_limit')) {
      return new Response('true', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url === 'https://api.resend.com/emails') {
      return new Response(JSON.stringify({ id: 'test-email-id' }), { status: 200 });
    }
    throw new Error(`Unexpected request URL: ${url}`);
  };

  try {
    const unauthorized = createResponse();
    await handler({
      method: 'POST',
      headers: {},
      body: { event: 'sign-in' },
    }, unauthorized);
    assert.equal(unauthorized.statusCode, 401);

    const response = createResponse();
    await handler({
      method: 'POST',
      headers: { authorization: 'Bearer test-session-access-token-1234567890' },
      body: { event: 'sign-in' },
    }, response);
    assert.equal(response.statusCode, 202);
    const emailRequest = requests.find(({ url }) => url === 'https://api.resend.com/emails');
    assert.deepEqual(emailRequest.body.to, ['adult@example.com']);
    assert.match(emailRequest.body.html, /idilewa-mark\.png/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of envNames) {
      if (previousEnv[name] === undefined) delete process.env[name];
      else process.env[name] = previousEnv[name];
    }
  }
});

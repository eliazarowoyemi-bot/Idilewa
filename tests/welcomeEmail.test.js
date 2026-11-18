import assert from 'node:assert/strict';
import test from 'node:test';
import welcomeHandler from '../api/auth/welcome.js';
import { createWelcomeEmail } from '../src/server/welcomeEmail.js';

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

test('welcome endpoint rejects unsupported methods and malformed account ids', async () => {
  const methodResponse = createResponse();
  await welcomeHandler({ method: 'GET', headers: {} }, methodResponse);
  assert.equal(methodResponse.statusCode, 405);
  assert.equal(methodResponse.headers.Allow, 'POST');

  const bodyResponse = createResponse();
  await welcomeHandler({ method: 'POST', headers: {}, body: { userId: 'not-a-uuid' } }, bodyResponse);
  assert.equal(bodyResponse.statusCode, 400);
});

test('welcome endpoint distinguishes an unknown account from admin-key failure', async () => {
  const envNames = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'APP_BASE_URL',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
  ];
  const previousEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  process.env.SUPABASE_URL = 'https://test-project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.APP_BASE_URL = 'https://www.idilewa.com';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.RESEND_FROM_EMAIL = 'Idilewa <no-reply@idilewa.com>';
  console.error = () => {};

  try {
    globalThis.fetch = async () => new Response(
      JSON.stringify({ code: 'user_not_found', message: 'User not found' }),
      { status: 404 }
    );
    const missingResponse = createResponse();
    await welcomeHandler({
      method: 'POST',
      headers: {},
      body: { userId: '550e8400-e29b-41d4-a716-446655440000' },
    }, missingResponse);
    assert.equal(missingResponse.statusCode, 410);

    globalThis.fetch = async () => new Response(
      JSON.stringify({ code: 'bad_jwt', message: 'Invalid JWT' }),
      { status: 401 }
    );
    const rejectedKeyResponse = createResponse();
    await welcomeHandler({
      method: 'POST',
      headers: {},
      body: { userId: '550e8400-e29b-41d4-a716-446655440000' },
    }, rejectedKeyResponse);
    assert.equal(rejectedKeyResponse.statusCode, 503);
    assert.equal(rejectedKeyResponse.body.error, 'Welcome email delivery is temporarily unavailable.');
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    for (const name of envNames) {
      if (previousEnv[name] === undefined) delete process.env[name];
      else process.env[name] = previousEnv[name];
    }
  }
});

test('welcome email includes a clear sign-in action and matching plain text', () => {
  const email = createWelcomeEmail({
    name: 'Ayo',
    loginUrl: 'https://www.idilewa.com/#/login?mode=signin',
  });

  assert.match(email.subject, /Welcome to Idilewa/);
  assert.match(email.html, /idilewa-mark\.png/);
  assert.match(email.html, /Ìdíléwa[\s\S]*Our Language\. Our Future\./);
  assert.match(email.html, /Welcome, Ayo\./);
  assert.match(email.html, /href="https:\/\/www\.idilewa\.com\/#\/login\?mode=signin"/);
  assert.match(email.html, /Four ways to begin/);
  assert.match(email.text, /FOUR WAYS TO BEGIN/);
  for (const section of ['Learn a language', 'Listen, speak and explore', 'Discover stories and culture', 'Create with code']) {
    assert.match(email.html, new RegExp(section));
    assert.match(email.text, new RegExp(section));
  }
  assert.match(email.text, /https:\/\/www\.idilewa\.com\/#\/login\?mode=signin/);
  assert.match(email.html, /<!doctype html>/i);
});

test('welcome email escapes user-controlled name and URL values', () => {
  const email = createWelcomeEmail({
    name: '<img src=x onerror=alert(1)>',
    loginUrl: 'https://www.idilewa.com/#/login?mode=signin&a=1&b="2"',
  });

  assert.doesNotMatch(email.html, /<img src=x/);
  assert.match(email.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(email.html, /&amp;b=&quot;2&quot;/);
});

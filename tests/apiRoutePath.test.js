import assert from 'node:assert/strict';
import test from 'node:test';
import { getApiRoutePath } from '../src/server/apiRoutePath.js';
import aiHandler from '../api/ai/[...path].js';
import dashboardHandler from '../api/dashboard/[...path].js';
import educatorHandler from '../api/educator/[...path].js';
import paymentsHandler from '../api/payments/[...path].js';

test('resolves endpoint paths from the request URL and ignores query path values', () => {
  assert.equal(
    getApiRoutePath({
      url: '/api/payments/quote?plan=premium',
      query: { path: ['unexpected'] },
    }, '/api/payments'),
    'quote',
  );
});

test('uses the Vercel catch-all path parameter when the request URL is rewritten', () => {
  assert.equal(
    getApiRoutePath({ url: '/api/dispatch', query: { '...path': ['connection', 'request'] } }, '/api/educator'),
    'connection/request',
  );
});

test('dispatches each consolidated API path to its existing method guard', async () => {
  const endpoints = [
    { handler: paymentsHandler, url: '/api/payments/quote', method: 'POST', allow: 'GET' },
    { handler: educatorHandler, url: '/api/educator/verify-invite', method: 'GET', allow: 'POST' },
    { handler: dashboardHandler, url: '/api/dashboard/educator', method: 'DELETE', allow: 'GET' },
    { handler: aiHandler, url: '/api/ai/knowledge', method: 'DELETE', allow: 'GET, POST, PATCH' },
  ];

  for (const endpoint of endpoints) {
    const res = {
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    await endpoint.handler({ method: endpoint.method, url: endpoint.url }, res);
    assert.equal(res.statusCode, 405, endpoint.url);
    assert.equal(res.headers.Allow, endpoint.allow, endpoint.url);
  }
});

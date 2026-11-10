import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/guardian/[...path].js';

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    body: null,
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
  };
}

test('guardian router preserves the request and verification endpoints', async () => {
  for (const path of ['request', ['request'], 'verify', ['verify']]) {
    const response = createResponse();
    await handler({ method: 'GET', query: { path } }, response);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'POST');
    assert.deepEqual(response.body, { error: 'Method not allowed.' });
  }
});

test('guardian router preserves approval endpoint method handling', async () => {
  const response = createResponse();
  await handler({ method: 'DELETE', query: { path: ['approve'] } }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'GET, POST');
  assert.match(response.headers['Content-Type'], /^text\/html/);
  assert.match(response.body, /Method not allowed\./);
});

test('guardian router rejects unknown and nested routes', async () => {
  for (const path of ['missing', ['request', 'extra']]) {
    const response = createResponse();
    await handler({ method: 'GET', query: { path } }, response);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { error: 'Guardian endpoint not found.' });
  }
});

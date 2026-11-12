import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { test } from 'node:test';
import startCanva from '../lib/canva/start.js';
import canvaCallback from '../lib/canva/callback.js';
import canvaStatus from '../lib/canva/status.js';
import createCanvaDesign from '../lib/canva/designs.js';
import { handleCanvaRequest } from '../lib/canva/handler.js';
import translateHandler from '../api/translate.js';

const CANVA_ENV = {
  CANVA_CLIENT_ID: 'test-client-id',
  CANVA_CLIENT_SECRET: 'test-client-secret',
  CANVA_REDIRECT_URI: 'https://www.idilewa.com/api/canva/callback',
  NODE_ENV: 'production',
};
const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));

async function withCanvaEnv(action) {
  const previous = Object.fromEntries(
    Object.keys(CANVA_ENV).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, CANVA_ENV);
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    end(body = '') {
      this.body = body;
      return this;
    },
  };
}

async function createAuthorization() {
  const response = createResponse();
  await startCanva({
    method: 'GET',
    headers: { host: 'www.idilewa.com' },
    url: '/api/canva/start',
  }, response);
  const stateCookie = response.headers['Set-Cookie'].split(';')[0];
  const authorizationUrl = new URL(response.headers.Location);
  return {
    cookieHeader: stateCookie,
    state: authorizationUrl.searchParams.get('state'),
    response,
  };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function validPreviewDataUrl() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(960, 0);
  header.writeUInt32BE(540, 4);
  header[8] = 8;
  header[9] = 6;
  const transparentPixels = Buffer.alloc((960 * 4 + 1) * 540);
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(transparentPixels)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

test('Canva start uses PKCE and an HttpOnly state cookie', async () => {
  await withCanvaEnv(async () => {
    const { response } = await createAuthorization();
    const url = new URL(response.headers.Location);
    const cookie = response.headers['Set-Cookie'];

    assert.equal(response.statusCode, 302);
    assert.equal(url.origin, 'https://www.canva.com');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.ok(url.searchParams.get('code_challenge'));
    assert.match(url.searchParams.get('scope'), /asset:read/);
    assert.match(url.searchParams.get('scope'), /asset:write/);
    assert.match(url.searchParams.get('scope'), /design:content:write/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /Max-Age=600/);
  });
});

test('Canva callback rejects mismatched OAuth state and clears the state cookie', async () => {
  await withCanvaEnv(async () => {
    const { cookieHeader } = await createAuthorization();
    const response = createResponse();
    canvaCallback({
      method: 'GET',
      headers: { cookie: cookieHeader },
      url: '/api/canva/callback?code=short-lived-code&state=wrong-state',
    }, response);

    assert.equal(response.statusCode, 400);
    assert.match(response.body, /could not be verified/);
    assert.match(response.headers['Set-Cookie'], /Max-Age=0/);
  });
});

test('Canva callback hands off the one-time authorization code without storing tokens', async () => {
  await withCanvaEnv(async () => {
    const { cookieHeader, state } = await createAuthorization();
    const response = createResponse();
    canvaCallback({
      method: 'GET',
      headers: { cookie: cookieHeader },
      url: `/api/canva/callback?code=short-lived-code&state=${encodeURIComponent(state)}`,
    }, response);

    assert.equal(response.statusCode, 200);
    assert.match(response.body, /idilewa-canva-authorized/);
    assert.match(response.body, /short-lived-code/);
    assert.match(response.body, /https:\/\/www\.idilewa\.com/);
    assert.match(response.body, /\/\?view=codeLab/);
    assert.doesNotMatch(response.body, /code-studio\.html/);
    assert.equal(response.headers['Set-Cookie'], undefined);
    assert.doesNotMatch(response.body, /access_token|refresh_token/);
  });
});

test('Canva design exchanges the one-time code and uploads the validated preview', async () => {
  await withCanvaEnv(async () => {
    const { cookieHeader, state } = await createAuthorization();
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url: String(url), options });
      if (String(url).endsWith('/oauth/token')) {
        return Response.json({ access_token: 'short-lived-access-token' });
      }
      if (String(url).endsWith('/asset-uploads')) {
        return Response.json({
          job: { id: 'upload-1', status: 'success', asset: { id: 'asset-1' } },
        });
      }
      if (String(url).endsWith('/designs')) {
        return Response.json({
          design: { urls: { edit_url: 'https://www.canva.com/design/abc/edit' } },
        });
      }
      throw new Error(`Unexpected Canva request: ${url}`);
    };

    try {
      const response = createResponse();
      await createCanvaDesign({
        method: 'POST',
        headers: {
          cookie: cookieHeader,
          origin: 'https://www.idilewa.com',
        },
        body: {
          code: 'short-lived-code',
          state,
          title: 'Road Racer',
          preview: validPreviewDataUrl(),
        },
      }, response);

      assert.equal(response.statusCode, 200);
      assert.equal(response.payload.editUrl, 'https://www.canva.com/design/abc/edit');
      assert.equal(calls.length, 3);
      assert.match(calls[0].options.headers.Authorization, /^Basic /);
      assert.equal(calls[1].options.headers.Authorization, 'Bearer short-lived-access-token');
      assert.equal(calls[2].options.headers.Authorization, 'Bearer short-lived-access-token');
      assert.equal(calls[2].options.headers['Content-Type'], 'application/json');
      assert.match(response.headers['Set-Cookie'], /Max-Age=0/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Canva design rejects a cross-origin request before calling Canva', async () => {
  await withCanvaEnv(async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Canva must not be called for a rejected origin.');
    };

    try {
      const response = createResponse();
      await createCanvaDesign({
        method: 'POST',
        headers: { origin: 'https://attacker.example' },
        body: {},
      }, response);

      assert.equal(response.statusCode, 403);
      assert.equal(response.payload.error, 'Request origin is not allowed.');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('Canva status names missing setup variables without exposing values', async () => {
  const previous = Object.fromEntries(
    Object.keys(CANVA_ENV).map((key) => [key, process.env[key]]),
  );
  for (const key of Object.keys(CANVA_ENV)) delete process.env[key];
  try {
    const response = createResponse();
    canvaStatus({ method: 'GET', headers: {} }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.configured, false);
    assert.match(response.payload.message, /CANVA_CLIENT_ID/);
    assert.match(response.payload.message, /CANVA_CLIENT_SECRET/);
    assert.match(response.payload.message, /CANVA_REDIRECT_URI/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('Canva endpoints rewrite through the existing translation function', async () => {
  const operations = ['status', 'start', 'callback', 'designs'];
  for (const operation of operations) {
    assert.ok(vercelConfig.rewrites.some(({ source, destination }) =>
      source === `/api/canva/${operation}`
      && destination === `/api/translate?service=canva&operation=${operation}`));
  }

  await withCanvaEnv(async () => {
    const response = createResponse();
    await translateHandler({
      method: 'GET',
      url: '/api/translate?service=canva&operation=status',
      headers: {},
    }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.configured, true);

    const { cookieHeader, state } = await createAuthorization();
    const callback = createResponse();
    await translateHandler({
      method: 'GET',
      url: `/api/translate?service=canva&operation=callback&code=short-lived-code&state=${encodeURIComponent(state)}`,
      headers: { cookie: cookieHeader },
    }, callback);
    assert.equal(callback.statusCode, 200);
    assert.match(callback.body, /short-lived-code/);

    const unknown = createResponse();
    handleCanvaRequest({
      method: 'GET',
      url: '/api/translate?service=canva&operation=unknown',
      headers: {},
    }, unknown, 'unknown');
    assert.equal(unknown.statusCode, 404);
  });
});

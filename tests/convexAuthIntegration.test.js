import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  connectSupabaseAuthToConvex,
  createSupabaseTokenFetcher,
} from '../src/convexAuth.js';

test('Supabase token fetcher returns the current access token and refreshes an existing session on request', async () => {
  const calls = [];
  const supabase = {
    auth: {
      async getSession() {
        calls.push('getSession');
        return { data: { session: { access_token: 'current-token' } }, error: null };
      },
      async refreshSession() {
        calls.push('refreshSession');
        return { data: { session: { access_token: 'refreshed-token' } }, error: null };
      },
    },
  };
  const fetchToken = createSupabaseTokenFetcher(supabase);

  assert.equal(await fetchToken({ forceRefreshToken: false }), 'current-token');
  assert.equal(await fetchToken({ forceRefreshToken: true }), 'refreshed-token');
  assert.deepEqual(calls, ['getSession', 'getSession', 'refreshSession']);
});

test('Supabase token fetcher reports session errors and clears missing sessions', async () => {
  const authError = new Error('session unavailable');
  const fetchToken = createSupabaseTokenFetcher({
    auth: {
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async refreshSession() {
        throw new Error('Refresh must not run without an existing session.');
      },
    },
  });

  assert.equal(await fetchToken({ forceRefreshToken: false }), null);
  assert.equal(await fetchToken({ forceRefreshToken: true }), null);

  const fetchWithError = createSupabaseTokenFetcher({
    auth: {
      async getSession() {
        return { data: { session: null }, error: authError };
      },
    },
  });
  await assert.rejects(fetchWithError({ forceRefreshToken: false }), { cause: authError });
});

test('Convex auth is refreshed on Supabase auth changes and can be unsubscribed', async () => {
  let authListener;
  let unsubscribeCount = 0;
  let setAuthCount = 0;
  const supabase = {
    auth: {
      onAuthStateChange(listener) {
        authListener = listener;
        return { data: { subscription: { unsubscribe: () => unsubscribeCount++ } } };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async refreshSession() {
        return { data: { session: null }, error: null };
      },
    },
  };
  const convexClient = { setAuth: () => setAuthCount++ };
  const disconnect = connectSupabaseAuthToConvex(supabase, convexClient);

  assert.equal(setAuthCount, 1);
  authListener('SIGNED_IN');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(setAuthCount, 2);

  disconnect();
  assert.equal(unsubscribeCount, 1);
});

test('Convex verifies Idilewa Supabase ES256 access tokens against the project JWKS', async () => {
  const config = await readFile(new URL('../convex/auth.config.ts', import.meta.url), 'utf8');
  assert.match(config, /type: "customJwt"/);
  assert.match(config, /applicationID: "authenticated"/);
  assert.match(config, /issuer: "https:\/\/jimiykxrjetomvpeoaeu\.supabase\.co\/auth\/v1"/);
  assert.match(config, /jwks: "https:\/\/jimiykxrjetomvpeoaeu\.supabase\.co\/auth\/v1\/\.well-known\/jwks\.json"/);
  assert.match(config, /algorithm: "ES256"/);
});

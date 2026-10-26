import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAuthError } from '../src/supabaseClient.js';

test('authentication errors explain the next step for invalid credentials and unconfirmed email', () => {
  assert.match(
    normalizeAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials', status: 400 }, 'signin'),
    /email or password is incorrect/i,
  );
  assert.match(
    normalizeAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed', status: 400 }, 'signin'),
    /confirm your email/i,
  );
});

test('signup errors distinguish duplicate accounts, password policy and profile provisioning', () => {
  assert.match(
    normalizeAuthError({ code: 'user_already_exists', message: 'User already registered', status: 422 }, 'signup'),
    /sign in or use Forgot password/i,
  );
  assert.match(
    normalizeAuthError({ code: 'weak_password', message: 'Password is too weak', status: 422 }, 'signup'),
    /stronger password/i,
  );
  assert.match(
    normalizeAuthError({ message: 'Database error saving new user', status: 500 }, 'signup'),
    /profile setup failed/i,
  );
});

test('temporary service and network errors are actionable without exposing provider details', () => {
  assert.match(
    normalizeAuthError({ message: 'upstream timeout', status: 502 }, 'signin'),
    /temporarily unavailable/i,
  );
  assert.match(normalizeAuthError(new TypeError('Failed to fetch'), 'signin'), /check your connection/i);
});

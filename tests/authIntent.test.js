import assert from 'node:assert/strict';
import test from 'node:test';
import { getAuthIntent } from '../src/authIntent.js';

test('legacy parent and tutor auth URLs resolve to the shared account dialog', () => {
  assert.deepEqual(getAuthIntent({ href: '/parents.html#/parent-signup' }), {
    role: 'parent',
    mode: 'signup',
  });
  assert.deepEqual(getAuthIntent({ href: '/educator-portal.html#/tutor-login' }), {
    role: 'tutor',
    mode: 'signin',
  });
  assert.deepEqual(getAuthIntent({ href: '/login' }), {
    role: 'parent',
    mode: 'signin',
  });
});

test('child profile links open the parent-managed child flow, not a child account', () => {
  assert.deepEqual(getAuthIntent({ href: '/kids-signup.html?plan=free' }), {
    role: 'child',
    mode: 'signup',
  });
  assert.deepEqual(getAuthIntent({
    href: '/parents.html#/parent-signup',
    role: 'child',
    mode: 'signup',
  }), {
    role: 'child',
    mode: 'signup',
  });
});

test('homepage signup calls and role-specific sign-in labels are recognized', () => {
  assert.deepEqual(getAuthIntent({ label: 'Get Started' }), {
    role: 'parent',
    mode: 'signup',
  });
  assert.deepEqual(getAuthIntent({ label: 'Tutor Login', href: '/login' }), {
    role: 'tutor',
    mode: 'signin',
  });
  assert.equal(getAuthIntent({ href: '/?view=academy', label: 'Start Learning' }), null);
});

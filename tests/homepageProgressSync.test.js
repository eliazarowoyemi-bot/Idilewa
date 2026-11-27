import assert from 'node:assert/strict';
import test from 'node:test';
import { createHomepageProgressSync } from '../src/homepageProgressSync.js';

const completion = {
  language: 'Yorùbá',
  level: 'Elementary',
  age: '6–8',
  stage: 2,
};

test('homepage academy stages load and save through the signed-in progress account', async () => {
  const calls = [];
  const applied = [];
  const statuses = [];
  const sessionChecks = [];
  const existing = {
    lessonType: 'homepage-academy-stage',
    lessonId: 'old-stage',
    meta: { ...completion, stage: 1 },
  };
  const sync = createHomepageProgressSync({
    restoreSession: async () => ({ id: 'learner-1' }),
    getProgress: async (userId) => {
      calls.push(['load', userId]);
      return [existing, { lessonType: 'coding', lessonId: 'game', meta: {} }];
    },
    save: async (payload) => {
      calls.push(['save', payload]);
      return { lessonType: payload.lessonType, lessonId: payload.lessonId, meta: payload.meta };
    },
    applyProgress: (records) => applied.push(records),
    setStatus: (message) => statuses.push(message),
    onAuthSessionChecked: (result) => sessionChecks.push(result),
  });

  await sync.initialize();
  await sync.handleCompletion(completion);

  assert.deepEqual(calls[0], ['load', 'learner-1']);
  assert.equal(applied[0].length, 1);
  assert.deepEqual(sessionChecks, [{ user: { id: 'learner-1' }, error: null }]);
  assert.equal(applied[0][0].lessonType, 'homepage-academy-stage');
  assert.deepEqual(calls[1], ['save', {
    userId: 'learner-1',
    lessonType: 'homepage-academy-stage',
    lessonId: 'Yor%C3%B9b%C3%A1:Elementary:6%E2%80%938:stage-3',
    meta: { ...completion, stage: 3 },
  }]);
  assert.equal(applied[1].length, 2);
  assert.equal(statuses.at(-1), 'Stage progress synced to your account.');
});

test('homepage progress reports guest and failed session checks for the sign-up gate', async () => {
  const sessionChecks = [];
  const statuses = [];
  const guestSync = createHomepageProgressSync({
    restoreSession: async () => null,
    onAuthSessionChecked: (result) => sessionChecks.push(result),
  });
  await guestSync.initialize();
  assert.deepEqual(sessionChecks, [{ user: null, error: null }]);

  const failure = new Error('Session verification failed.');
  const failedSync = createHomepageProgressSync({
    restoreSession: async () => { throw failure; },
    onAuthSessionChecked: (result) => sessionChecks.push(result),
    setStatus: (message) => statuses.push(message),
  });
  await failedSync.initialize();
  assert.deepEqual(sessionChecks[1], { user: null, error: failure });
  assert.match(statuses.at(-1), /account progress could not be loaded/i);
});

test('homepage academy progress stays local for guests and reports account write failures', async () => {
  let saveCalls = 0;
  const statuses = [];
  const guestSync = createHomepageProgressSync({
    restoreSession: async () => null,
    save: async () => { saveCalls += 1; },
    setStatus: (message) => statuses.push(message),
  });

  await guestSync.handleCompletion(completion);
  assert.equal(saveCalls, 0);
  assert.match(statuses.at(-1), /saved on this device/i);

  const signedInSync = createHomepageProgressSync({
    restoreSession: async () => ({ id: 'learner-1' }),
    getProgress: async () => [],
    save: async () => { throw new Error('Lesson progress could not be saved to your account.'); },
    setStatus: (message) => statuses.push(message),
  });

  await signedInSync.handleCompletion(completion);
  assert.match(statuses.at(-1), /remains saved on this device.*could not be saved/i);
});

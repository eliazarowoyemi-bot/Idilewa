import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createCommunityProverbRepository } from '../src/communityProverbs.js';

const validContribution = {
  language: 'Igbo',
  text: 'Nwata kwocha aka, ọ soro okenye rie nri.',
  meaning: 'A child who washes their hands may eat with elders.',
  context: 'A family saying',
};

function createClient({ userId = 'user-1', rows = [], insertError = null, sessionError = null } = {}) {
  const calls = [];
  const client = {
    calls,
    auth: {
      async getSession() {
        return {
          data: { session: userId ? { user: { id: userId } } : null },
          error: sessionError,
        };
      },
    },
    from(table) {
      calls.push(['from', table]);
      return {
        select(columns) {
          calls.push(['select', columns]);
          return {
            eq(column, value) {
              calls.push(['eq', column, value]);
              return {
                async order(columnName, options) {
                  calls.push(['order', columnName, options]);
                  return { data: rows, error: null };
                },
              };
            },
          };
        },
        insert(value) {
          calls.push(['insert', value]);
          return {
            select(columns) {
              calls.push(['select-inserted', columns]);
              return {
                async single() {
                  return {
                    data: insertError ? null : {
                      id: 'contribution-1',
                      created_at: '2026-11-18T00:00:00.000Z',
                      ...value,
                    },
                    error: insertError,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  return client;
}

test('proverb contributions load only the signed-in owner’s records', async () => {
  const client = createClient({
    rows: [{
      id: 'contribution-1',
      user_id: 'user-1',
      language: 'Igbo',
      yoruba: validContribution.text,
      meaning: validContribution.meaning,
      context: validContribution.context,
      created_at: '2026-11-18T00:00:00.000Z',
    }],
  });

  const contributions = await createCommunityProverbRepository(client).listMine();

  assert.deepEqual(contributions, [{
    id: 'contribution-1',
    userId: 'user-1',
    language: 'Igbo',
    text: validContribution.text,
    meaning: validContribution.meaning,
    context: validContribution.context,
    createdAt: '2026-11-18T00:00:00.000Z',
  }]);
  assert.ok(client.calls.some(([operation, column, value]) => (
    operation === 'eq' && column === 'user_id' && value === 'user-1'
  )));
});

test('proverb contributions are inserted as unapproved account-owned records', async () => {
  const client = createClient();
  const contribution = await createCommunityProverbRepository(client).saveMine(validContribution);
  const insert = client.calls.find(([operation]) => operation === 'insert')[1];

  assert.equal(contribution.userId, 'user-1');
  assert.equal(insert.user_id, 'user-1');
  assert.equal(insert.language, 'Igbo');
  assert.equal(insert.yoruba, validContribution.text);
  assert.equal(insert.approved, false);
});

test('proverb contribution validation rejects invalid fields before database writes', async () => {
  const client = createClient();
  const repository = createCommunityProverbRepository(client);

  await assert.rejects(repository.saveMine({ ...validContribution, language: 'Twi' }), /supported languages/i);
  await assert.rejects(repository.saveMine({ ...validContribution, text: ' ' }), /1–240 characters/);
  await assert.rejects(repository.saveMine({ ...validContribution, meaning: 'x'.repeat(321) }), /1–320 characters/);
  await assert.rejects(repository.saveMine({ ...validContribution, context: 'x'.repeat(121) }), /120 characters or fewer/);
  assert.equal(client.calls.some(([operation]) => operation === 'from'), false);
});

test('proverb contributions require a live account session and surface storage failures', async () => {
  const signedOutClient = createClient({ userId: '' });
  await assert.rejects(
    createCommunityProverbRepository(signedOutClient).saveMine(validContribution),
    /Sign in again/,
  );
  assert.equal(signedOutClient.calls.some(([operation]) => operation === 'from'), false);

  const failedClient = createClient({ insertError: new Error('table unavailable') });
  await assert.rejects(
    createCommunityProverbRepository(failedClient).saveMine(validContribution),
    /was not saved to your account/,
  );
});

test('community proverb migration prevents unreviewed public submissions', async () => {
  const migration = await readFile(
    new URL('../supabase/migrations/20261118210000_private_proverb_contributions.sql', import.meta.url),
    'utf8',
  );

  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /auth\.uid\(\) = user_id AND approved = false/);
  assert.match(migration, /CREATE POLICY "Anyone can view approved proverbs"/);
});

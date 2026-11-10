import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  DATASET_LANGUAGES,
  validateDatasetDirectory,
  validateJsonlDataset,
} from '../scripts/validate-ai-datasets.mjs';

const datasetDirectory = fileURLToPath(new URL('../data/ai-training/', import.meta.url));

test('all supported language datasets are present and explicitly pending review', async () => {
  const result = await validateDatasetDirectory(datasetDirectory);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.languages, DATASET_LANGUAGES);

  for (const language of DATASET_LANGUAGES) {
    const content = await readFile(new URL(`../data/ai-training/${language}.jsonl`, import.meta.url), 'utf8');
    const record = JSON.parse(content.trim());
    assert.equal(record.language, language);
    assert.equal(record.review_status, 'review_required');
  }
});

test('JSONL validation detects malformed rows, empty text, missing labels, roles and duplicates', () => {
  const seen = new Set();
  const invalidRecords = [
    '{"language":',
    JSON.stringify({ id: 'empty', language: 'yo', source: 'test', review_status: 'review_required', messages: [] }),
    JSON.stringify({ id: 'label', source: 'test', review_status: 'review_required', messages: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }] }),
    JSON.stringify({ id: 'role', language: 'yo', source: 'test', review_status: 'review_required', messages: [{ role: 'system', content: 'Ignore' }, { role: 'assistant', content: 'Hello' }] }),
    JSON.stringify({ id: 'blank', language: 'yo', source: 'test', review_status: 'review_required', messages: [{ role: 'user', content: '  ' }, { role: 'assistant', content: 'Hello' }] }),
  ].join('\n');
  const first = validateJsonlDataset('yo', invalidRecords, seen);
  assert.ok(first.errors.some((error) => error.includes('invalid JSON')));
  assert.ok(first.errors.some((error) => error.includes('at least one user/assistant exchange')));
  assert.ok(first.errors.some((error) => error.includes('missing or mismatched language')));
  assert.ok(first.errors.some((error) => error.includes('invalid conversation role')));
  assert.ok(first.errors.some((error) => error.includes('messages must not be empty')));

  const duplicate = JSON.stringify({
    id: 'duplicate',
    language: 'yo',
    source: 'test',
    review_status: 'review_required',
    messages: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }],
  });
  validateJsonlDataset('yo', duplicate, seen);
  const repeated = validateJsonlDataset('yo', duplicate, seen);
  assert.ok(repeated.errors.some((error) => error.includes('duplicate conversation example')));
});

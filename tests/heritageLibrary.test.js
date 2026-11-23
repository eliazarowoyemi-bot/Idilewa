import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterHeritageRecords,
  getHeritageCollectionCounts,
} from '../src/heritageLibrary.js';

const records = [
  { id: 'YO-01', title: 'Ìjàpá àti Àwọn Ẹyẹ', category: 'Folktales', language: 'Yorùbá', story: 'A tortoise learns gratitude.' },
  { id: 'ED17-1', title: 'The Weaver and the Rain Cloud', category: 'Folktales', language: 'Yorùbá', age: '6–8', body: 'A young weaver asks for help.' },
  { id: 'IG-01', title: 'Mbe na Enyi', category: 'History', language: 'Igbo', story: 'A community remembers its past.' },
];

test('heritage filters combine search, category, language, and assigned age without mutating records', () => {
  const result = filterHeritageRecords(records, {
    query: 'WEAVER',
    category: 'Folktales',
    language: 'Yorùbá',
    age: '6–8',
  });

  assert.deepEqual(result.map((record) => record.id), ['ED17-1']);
  assert.equal(records.length, 3);
});

test('heritage age filtering excludes catalogue entries without editorial age assignment', () => {
  const result = filterHeritageRecords(records, { age: '6–8' });

  assert.deepEqual(result.map((record) => record.id), ['ED17-1']);
});

test('collection counts use the records actually available', () => {
  assert.deepEqual(getHeritageCollectionCounts(records, ['Folktales', 'History', 'Poetry']), {
    Folktales: 2,
    History: 1,
    Poetry: 0,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_KNOWLEDGE_CATEGORIES,
  AiServiceError,
  createAiKnowledgeEmbedding,
  parseAiKnowledgeEntry,
  parseAiKnowledgeReview,
  parseAiConversationRequest,
} from '../src/server/aiConversation.js';

const validEntry = {
  language: 'yo',
  category: 'vocabulary',
  title: 'Family greeting',
  content: 'Ẹ káàárọ̀ is a morning greeting.',
  source_name: 'Reviewed language guide',
  source_url: 'https://example.test/yoruba/greetings',
};

test('language knowledge entries validate language, category, content, and HTTPS attribution', () => {
  const parsed = parseAiKnowledgeEntry(validEntry);
  assert.deepEqual(parsed.value, {
    language_code: 'yo',
    category: 'vocabulary',
    title: 'Family greeting',
    content: 'Ẹ káàárọ̀ is a morning greeting.',
    source_name: 'Reviewed language guide',
    source_url: 'https://example.test/yoruba/greetings',
  });
  assert.equal(AI_KNOWLEDGE_CATEGORIES.length, 8);
  assert.match(parseAiKnowledgeEntry({ ...validEntry, language: 'constructor' }).error, /supported language/);
  assert.match(parseAiKnowledgeEntry({ ...validEntry, category: 'uncategorized' }).error, /category/);
  assert.match(parseAiKnowledgeEntry({ ...validEntry, content: ' ' }).error, /content/);
  assert.match(parseAiKnowledgeEntry({ ...validEntry, source_url: 'javascript:alert(1)' }).error, /HTTPS/);
  assert.match(parseAiKnowledgeEntry({ ...validEntry, source_url: 12 }).error, /must be text/);
  assert.match(parseAiKnowledgeEntry({ ...validEntry, source_url: 'not a URL' }).error, /valid HTTPS/);
});

test('knowledge review requires a valid note ID and a final decision', () => {
  const id = '4a0f1d88-32f1-46ae-bcb2-e185cc167992';
  assert.deepEqual(parseAiKnowledgeReview({ id, review_status: 'approved' }).value, {
    id,
    review_status: 'approved',
  });
  assert.deepEqual(parseAiKnowledgeReview({ id, review_status: 'rejected' }).value, {
    id,
    review_status: 'rejected',
  });
  assert.match(parseAiKnowledgeReview({ id: 'bad-id', review_status: 'approved' }).error, /valid language note/);
  assert.match(parseAiKnowledgeReview({ id, review_status: 'pending' }).error, /approve or reject/);
});

test('knowledge embeddings are optional but must have the configured 768-value shape', async () => {
  let called = false;
  assert.equal(await createAiKnowledgeEmbedding('hello', {
    embeddingModel: '',
    baseUrl: 'https://model.example.test',
  }, async () => { called = true; }), null);
  assert.equal(called, false);

  const embedding = Array.from({ length: 768 }, (_, index) => index / 768);
  const vector = await createAiKnowledgeEmbedding('hello', {
    embeddingModel: 'nomic-embed-text',
    baseUrl: 'https://model.example.test',
    apiKey: '',
  }, async (url, options) => {
    assert.equal(url, 'https://model.example.test/api/embed');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { model: 'nomic-embed-text', input: 'hello' });
    return new Response(JSON.stringify({ embeddings: [embedding] }));
  });
  assert.match(vector, /^\[0,0\.001302/);
  assert.equal(vector.slice(1, -1).split(',').length, 768);
  await assert.rejects(createAiKnowledgeEmbedding('hello', {
    embeddingModel: 'bad-model',
    baseUrl: 'https://model.example.test',
    apiKey: '',
  }, async () => new Response(JSON.stringify({ embeddings: [[1, 2]] }))), (error) => (
    error instanceof AiServiceError && /768 numeric values/.test(error.message)
  ));
});

test('conversation language validation rejects inherited object properties', () => {
  assert.match(parseAiConversationRequest({
    language: 'constructor',
    message: 'Hello',
  }).error, /Choose/);
});

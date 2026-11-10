import { createClient } from '@supabase/supabase-js';
import {
  AiServiceError,
  createAiKnowledgeEmbedding,
  getOllamaConfig,
  parseAiKnowledgeEntry,
  parseAiKnowledgeReview,
} from '../../src/server/aiConversation.js';

const MAX_BODY_BYTES = 16 * 1024;
const KNOWLEDGE_FIELDS = 'id,language_code,category,title,content,source_name,source_url,review_status,created_by,created_at,reviewed_by,reviewed_at';

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(body);
}

function parseBody(req) {
  const size = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(size) && size > MAX_BODY_BYTES) {
    return { error: { status: 413, message: 'This language note is too large.' } };
  }
  let body = req.body;
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(Buffer.isBuffer(body) ? body.toString('utf8') : body);
    } catch {
      return { error: { status: 400, message: 'The request body must contain valid JSON.' } };
    }
  }
  if (body && typeof body === 'object' && Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return { error: { status: 413, message: 'This language note is too large.' } };
  }
  return { body };
}

function createServiceClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.SUPABASE_PUBLIC_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new AiServiceError('The language knowledge database is not configured.', 503);
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getBearerToken(req) {
  const authorization = req.headers?.authorization;
  if (typeof authorization !== 'string') return '';
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
}

async function getEducator(req, database) {
  const token = getBearerToken(req);
  if (!token) throw new AiServiceError('Sign in with an educator account to manage language notes.', 401);
  const { data, error } = await database.auth.getUser(token);
  if (error || !data?.user) throw new AiServiceError('Your sign-in session could not be verified.', 401);
  const { data: profile, error: profileError } = await database
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) throw new AiServiceError('Your educator permissions could not be checked.', 503);
  if (profile?.role !== 'educator') {
    throw new AiServiceError('Only verified educators can manage language notes.', 403);
  }
  return data.user;
}

async function listNotes(req, res, database) {
  const status = new URL(req.url || '/', 'https://idilewa.local').searchParams.get('status') || 'pending';
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return sendJson(res, 400, { error: 'Choose pending, approved, or rejected notes.' });
  }
  const { data, error } = await database
    .from('ai_language_knowledge')
    .select(KNOWLEDGE_FIELDS)
    .eq('review_status', status)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new AiServiceError('Language notes could not be loaded.', 503);
  return sendJson(res, 200, { notes: data || [] });
}

async function addNote(req, res, database, user) {
  const parsedBody = parseBody(req);
  if (parsedBody.error) {
    return sendJson(res, parsedBody.error.status, { error: parsedBody.error.message });
  }
  const parsedEntry = parseAiKnowledgeEntry(parsedBody.body);
  if (parsedEntry.error) return sendJson(res, 400, { error: parsedEntry.error });

  let embedding = null;
  if (process.env.OLLAMA_EMBEDDING_MODEL?.trim()) {
    const config = getOllamaConfig();
    embedding = await createAiKnowledgeEmbedding(
      `${parsedEntry.value.title}\n${parsedEntry.value.content}`,
      config,
    );
  }
  const { data, error } = await database
    .from('ai_language_knowledge')
    .insert({
      ...parsedEntry.value,
      review_status: 'pending',
      created_by: user.id,
      ...(embedding ? { embedding } : {}),
    })
    .select(KNOWLEDGE_FIELDS)
    .single();
  if (error) throw new AiServiceError('The language note could not be submitted for review.', 503);
  return sendJson(res, 201, { note: data });
}

async function reviewNote(req, res, database, user) {
  const parsedBody = parseBody(req);
  if (parsedBody.error) {
    return sendJson(res, parsedBody.error.status, { error: parsedBody.error.message });
  }
  const parsedReview = parseAiKnowledgeReview(parsedBody.body);
  if (parsedReview.error) return sendJson(res, 400, { error: parsedReview.error });

  const { data: existing, error: readError } = await database
    .from('ai_language_knowledge')
    .select('id,created_by,review_status')
    .eq('id', parsedReview.value.id)
    .maybeSingle();
  if (readError) throw new AiServiceError('The language note could not be checked.', 503);
  if (!existing) return sendJson(res, 404, { error: 'This language note was not found.' });
  if (existing.created_by === user.id) {
    return sendJson(res, 403, { error: 'A different educator must review your language note.' });
  }
  if (existing.review_status !== 'pending') {
    return sendJson(res, 409, { error: 'This language note has already been reviewed.' });
  }

  let update = database
    .from('ai_language_knowledge')
    .update({
      review_status: parsedReview.value.review_status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsedReview.value.id)
    .eq('review_status', 'pending');
  update = existing.created_by
    ? update.neq('created_by', user.id)
    : update.is('created_by', null);
  const { data, error } = await update.select(KNOWLEDGE_FIELDS).maybeSingle();
  if (error) throw new AiServiceError('The language note could not be reviewed.', 503);
  if (!data) return sendJson(res, 409, { error: 'This language note has already been reviewed.' });
  return sendJson(res, 200, { note: data });
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  let user;
  try {
    const database = createServiceClient();
    user = await getEducator(req, database);
    if (req.method === 'GET') return await listNotes(req, res, database);
    if (req.method === 'POST') return await addNote(req, res, database, user);
    return await reviewNote(req, res, database, user);
  } catch (error) {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 503;
    console.error('[ai-knowledge] Request failed.', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
      status,
      userId: user?.id || null,
    });
    return sendJson(res, status, {
      error: error instanceof AiServiceError
        ? error.message
        : 'Language knowledge management is temporarily unavailable.',
    });
  }
}

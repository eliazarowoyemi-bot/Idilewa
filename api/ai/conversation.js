import { createHmac, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  AiServiceError,
  AI_CONVERSATION_LANGUAGES,
  createAiKnowledgeEmbedding,
  generateAiConversationReply,
  getOllamaConfig,
  parseAiConversationRequest,
} from '../../src/server/aiConversation.js';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_KNOWLEDGE_ITEMS = 4;
const MAX_KNOWLEDGE_CHARS = 700;
const MAX_HISTORY_TO_STORE = 24;

export const config = { maxDuration: 60 };

function sendJson(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(body);
}

function getBearerToken(req) {
  const authorization = req.headers?.authorization;
  if (typeof authorization !== 'string') return '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function getClientIdentity(req, userId = '') {
  if (userId) return `user:${userId}`;
  if (req.ip) return `ip:${req.ip}`;
  const forwarded = req.headers?.['x-forwarded-for'];
  const address = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return `ip:${address || req.socket?.remoteAddress || 'unknown'}`;
}

function createServiceClient() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.SUPABASE_PUBLIC_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new AiServiceError('The AI conversation database is not configured on this deployment.', 503);
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getAuthenticatedUser(req, database) {
  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await database.auth.getUser(token);
  if (error || !data?.user) {
    throw new AiServiceError('Your sign-in session could not be verified. Sign in again and retry.', 401);
  }

  const { data: profile, error: profileError } = await database
    .from('profiles')
    .select('role,parent_consent_request_id,email')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError) {
    throw new AiServiceError('Your account permissions could not be checked. Try again shortly.', 503);
  }
  if (!profile) throw new AiServiceError('Your Idilewa account profile is missing.', 403);
  if (profile.role === 'child') {
    if (!profile.parent_consent_request_id) {
      throw new AiServiceError('A parent or guardian must approve this child account before using saved conversations.', 403);
    }
    const { data: guardian, error: guardianError } = await database
      .from('guardian_access_requests')
      .select('status,claimed_by,child_email')
      .eq('id', profile.parent_consent_request_id)
      .eq('claimed_by', data.user.id)
      .maybeSingle();
    if (guardianError) {
      throw new AiServiceError('Child account approval could not be verified. Try again shortly.', 503);
    }
    if (guardian?.status !== 'used'
      || guardian.child_email?.toLowerCase() !== (profile.email || data.user.email || '').toLowerCase()) {
      throw new AiServiceError('A parent or guardian must approve this child account before using saved conversations.', 403);
    }
  }
  return data.user;
}

function safeSourceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

async function enforceRateLimit(database, req, userId = '') {
  const hmacKey = process.env.AI_RATE_LIMIT_HMAC_KEY?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!hmacKey) {
    throw new AiServiceError('AI request protection is not configured on this deployment.', 503);
  }
  const bucketHash = createHmac('sha256', hmacKey)
    .update(getClientIdentity(req, userId))
    .digest('hex');
  const { data, error } = await database.rpc('consume_ai_conversation_rate_limit', {
    p_bucket_hash: bucketHash,
    p_max_requests: 20,
    p_window_seconds: 60,
  });
  if (error) {
    throw new AiServiceError('AI request protection is unavailable. Try again shortly.', 503);
  }
  if (data !== true) throw new AiServiceError('Too many messages were sent. Wait a minute and try again.', 429);
}

async function getKnowledge(database, language, message, config) {
  const queryEmbedding = await createAiKnowledgeEmbedding(message, config);

  const { data, error } = await database.rpc('search_ai_language_knowledge', {
    p_language_code: language,
    p_query_text: message,
    p_query_embedding: queryEmbedding,
    p_match_count: MAX_KNOWLEDGE_ITEMS,
  });
  if (error) {
    throw new AiServiceError('The language knowledge base is unavailable. Apply the latest Idilewa database migration and retry.', 503);
  }
  if (!Array.isArray(data)) {
    throw new AiServiceError('The language knowledge base returned invalid results.', 502);
  }
  return data.map((item) => ({
    id: item.id,
    title: String(item.title || 'Language note').slice(0, 120),
    content: String(item.content || '').slice(0, MAX_KNOWLEDGE_CHARS),
    source_name: String(item.source_name || '').slice(0, 120),
    source_url: safeSourceUrl(item.source_url).slice(0, 500),
  })).filter((item) => item.content);
}

async function readConversation(database, conversationId, userId, language) {
  const { data: conversation, error: conversationError } = await database
    .from('ai_conversations')
    .select('id,language_code')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (conversationError) {
    throw new AiServiceError('Your conversation history could not be loaded. Apply the latest Idilewa database migration and retry.', 503);
  }
  if (!conversation) throw new AiServiceError('This conversation was not found for your account.', 404);
  if (conversation.language_code !== language) {
    throw new AiServiceError('Start a new conversation when you change languages.', 409);
  }

  const { data: rows, error } = await database
    .from('ai_conversation_messages')
    .select('role,content,created_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_TO_STORE);
  if (error) throw new AiServiceError('Your conversation history could not be loaded.', 503);
  return (rows || []).reverse();
}

async function saveConversation(database, conversationId, userId, language, userMessage, reply) {
  const id = conversationId || randomUUID();
  if (!conversationId) {
    const { error } = await database.from('ai_conversations').insert({
      id,
      user_id: userId,
      language_code: language,
      title: `${AI_CONVERSATION_LANGUAGES[language]} practice`,
    });
    if (error) throw new AiServiceError('Your reply was ready, but the conversation could not be saved.', 503);
  } else {
    const { data, error } = await database
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();
    if (error || !data) throw new AiServiceError('Your reply was ready, but the conversation could not be saved.', 503);
  }

  const now = new Date().toISOString();
  const { error } = await database.from('ai_conversation_messages').insert([
    { conversation_id: id, user_id: userId, role: 'user', content: userMessage, created_at: now },
    { conversation_id: id, user_id: userId, role: 'assistant', content: reply, created_at: new Date(Date.now() + 1).toISOString() },
  ]);
  if (error) throw new AiServiceError('Your reply was ready, but the conversation could not be saved.', 503);
  return id;
}

function parseBody(req) {
  const size = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(size) && size > MAX_BODY_BYTES) {
    return { error: { status: 413, message: 'This conversation request is too large.' } };
  }
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return { error: { status: 400, message: 'The request body must contain valid JSON.' } };
    }
  }
  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString('utf8'));
    } catch {
      return { error: { status: 400, message: 'The request body must contain valid JSON.' } };
    }
  }
  if (body && typeof body === 'object' && Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
    return { error: { status: 413, message: 'This conversation request is too large.' } };
  }
  return { body };
}

async function handleGet(req, res, database, user) {
  if (!user) return sendJson(res, 401, { error: 'Sign in to restore a saved conversation.' });
  const id = new URL(req.url || '/', 'https://idilewa.local').searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return sendJson(res, 400, { error: 'Choose a valid conversation.' });
  }

  const { data: conversation, error: conversationError } = await database
    .from('ai_conversations')
    .select('id,language_code,title,created_at,updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (conversationError) throw new AiServiceError('Saved conversations are unavailable. Apply the latest Idilewa database migration.', 503);
  if (!conversation) return sendJson(res, 404, { error: 'This conversation was not found for your account.' });

  const { data: messages, error } = await database
    .from('ai_conversation_messages')
    .select('role,content,created_at')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_TO_STORE);
  if (error) throw new AiServiceError('Saved messages could not be loaded.', 503);
  return sendJson(res, 200, { conversation, messages: (messages || []).reverse() });
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  let user;
  try {
    const database = createServiceClient();
    user = await getAuthenticatedUser(req, database);

    if (req.method === 'GET') return await handleGet(req, res, database, user);

    const parsedBody = parseBody(req);
    if (parsedBody.error) return sendJson(res, parsedBody.error.status, { error: parsedBody.error.message });
    const request = parseAiConversationRequest(parsedBody.body);
    if (request.error) return sendJson(res, 400, { error: request.error });
    if (request.conversationId && !user) {
      return sendJson(res, 401, { error: 'Sign in to continue a saved conversation.' });
    }

    const providerConfig = getOllamaConfig();
    await enforceRateLimit(database, req, user?.id);

    let messages = request.messages;
    if (request.conversationId && user) {
      const stored = await readConversation(database, request.conversationId, user.id, request.language);
      messages = stored.map((item) => ({ role: item.role, content: item.content }));
    }

    const knowledge = await getKnowledge(database, request.language, request.message, providerConfig);
    const result = await generateAiConversationReply({
      language: request.language,
      message: request.message,
      messages,
      knowledge,
      config: providerConfig,
    });

    const conversationId = user
      ? await saveConversation(
        database,
        request.conversationId,
        user.id,
        request.language,
        request.message,
        result.reply,
      )
      : null;
    return sendJson(res, 200, {
      reply: result.reply,
      language: request.language,
      conversationId,
      persisted: Boolean(conversationId),
      provider: `Ollama · ${result.model}`,
      sources: knowledge.map(({ id, title, source_name, source_url }) => ({
        id, title, name: source_name, url: source_url,
      })),
    });
  } catch (error) {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 503;
    console.error('[ai-conversation] Request failed.', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
      status,
      userId: user?.id || null,
    });
    return sendJson(res, status, {
      error: error instanceof AiServiceError
        ? error.message
        : 'AI Conversation is temporarily unavailable. Try again shortly.',
    });
  }
}

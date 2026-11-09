const PLOTWEAVER_BASE_URL = 'https://api.plotweaver.app/v1';
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;
const ALLOWED_ORIGINS = new Set([
  'https://www.idilewa.com',
  'https://idilewa.com',
  'https://tpsalm.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8001',
  'http://127.0.0.1:8001',
]);

export const config = {
  api: { bodyParser: false },
  maxDuration: 60,
};

function sendJson(res, statusCode, body, headers = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  return res.status(statusCode).json(body);
}

function getApiKey() {
  return process.env.PLOTWEAVER_API_KEY?.trim()
    || process.env.Idilewa?.trim()
    || null;
}

function applyCors(req, res) {
  const origin = req.headers?.origin;
  const configuredOrigins = (process.env.IDILEWA_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!origin) return true;
  if (!ALLOWED_ORIGINS.has(origin) && !configuredOrigins.includes(origin)) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
  return true;
}

function getRoute(req) {
  const url = new URL(req.url || '/', 'https://idilewa.local');
  const prefix = '/api/plotweaver';
  const path = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '')
    : '';
  return { path, searchParams: url.searchParams };
}

async function readRequestBody(req) {
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { error: { status: 413, message: 'Audio uploads must be 4 MB or smaller.' } };
  }

  if (Buffer.isBuffer(req.body)) return { body: req.body };
  if (typeof req.body === 'string') return { body: Buffer.from(req.body) };

  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_REQUEST_BYTES) {
        return { error: { status: 413, message: 'Audio uploads must be 4 MB or smaller.' } };
      }
      chunks.push(buffer);
    }
  } catch {
    return { error: { status: 400, message: 'The request body could not be read.' } };
  }
  return { body: Buffer.concat(chunks) };
}

function parseJsonBody(body) {
  try {
    const value = JSON.parse(body.toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { error: { status: 400, message: 'A JSON request body is required.' } };
    }
    return { value };
  } catch {
    return { error: { status: 400, message: 'The request body must contain valid JSON.' } };
  }
}

function validateJsonRequest(path, value) {
  if (path === 'speech') {
    if (typeof value.text !== 'string' || !value.text.trim() || value.text.length > 1_000) {
      return { status: 400, message: 'Speech text must contain 1–1,000 characters.' };
    }
    if (typeof value.language !== 'string' || !LANGUAGE_CODE_PATTERN.test(value.language)) {
      return { status: 400, message: 'Choose a supported speech language.' };
    }
    if (value.voice_id !== undefined
      && (typeof value.voice_id !== 'string' || value.voice_id.length > 120)) {
      return { status: 400, message: 'Choose a valid voice.' };
    }
    return null;
  }

  if (path === 'translations') {
    if (typeof value.text !== 'string' || !value.text.trim() || value.text.length > 2_000) {
      return { status: 400, message: 'Translation text must contain 1–2,000 characters.' };
    }
    if (typeof value.source_language !== 'string'
      || !LANGUAGE_CODE_PATTERN.test(value.source_language)
      || typeof value.target_language !== 'string'
      || !LANGUAGE_CODE_PATTERN.test(value.target_language)) {
      return { status: 400, message: 'Choose supported source and target languages.' };
    }
    return null;
  }

  return { status: 400, message: 'Unsupported Idilewa voice service request.' };
}

async function parseMultipart(body, contentType, path) {
  if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) {
    return { error: { status: 400, message: 'An audio upload is required.' } };
  }

  let incoming;
  try {
    incoming = await new Request('https://idilewa.local/upload', {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body,
    }).formData();
  } catch {
    return { error: { status: 400, message: 'The audio upload is not valid multipart data.' } };
  }

  const isClone = path === 'voices' || path === 'speech/clone';
  if (isClone && incoming.get('consent') !== 'yes') {
    return { error: { status: 400, message: 'Confirm that you own the voice or have permission to clone it.' } };
  }

  const file = incoming.get(path === 'speech/clone' ? 'reference_audio' : 'file');
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_REQUEST_BYTES) {
    return { error: { status: 400, message: 'Choose an audio file no larger than 4 MB.' } };
  }
  const allowedFile = isClone
    ? /\.(wav|mp3|flac|ogg|m4a)$/i.test(file.name)
    : /\.(wav|mp3|flac|ogg|m4a|webm|mp4)$/i.test(file.name);
  if (!allowedFile) {
    return { error: { status: 400, message: isClone
      ? 'Use a WAV, MP3, FLAC, OGG, or M4A voice sample.'
      : 'Use a WAV, MP3, FLAC, OGG, M4A, MP4, or WebM recording.' } };
  }

  const language = incoming.get('language');
  if (typeof language !== 'string' || !LANGUAGE_CODE_PATTERN.test(language)) {
    return { error: { status: 400, message: 'Choose a supported audio language.' } };
  }
  if (isClone) {
    const voiceName = incoming.get('name');
    const referenceText = incoming.get('reference_text');
    if (path === 'voices' && (typeof voiceName !== 'string' || !voiceName.trim() || voiceName.length > 80)) {
      return { error: { status: 400, message: 'Enter a voice name of 80 characters or fewer.' } };
    }
    if (!['yo', 'ha', 'ig', 'pcm', 'en'].includes(language) && !referenceText?.trim()) {
      return { error: { status: 400, message: 'A transcript is required for this language.' } };
    }
  }

  const outgoing = new FormData();
  for (const [name, value] of incoming.entries()) {
    if (name === 'consent') continue;
    if (value instanceof File) {
      outgoing.append(name, value, value.name);
    } else {
      outgoing.append(name, value);
    }
  }
  return { formData: outgoing };
}

function errorForUpstreamStatus(status) {
  if (status === 401) return 'Idilewa voice service rejected the configured account credentials.';
  if (status === 402) return 'Idilewa voice service billing or account setup is required.';
  if (status === 403) return 'This Idilewa voice service is not enabled for the configured account.';
  if (status === 404) return 'The requested Idilewa voice or resource was not found.';
  if (status === 413) return 'The audio upload is too large for this deployment.';
  if (status === 429) return 'Idilewa reached a rate or usage limit. Try again later.';
  if (status >= 500) return 'Idilewa is temporarily unavailable. Try again later.';
  return 'Idilewa could not complete this request. Check the selected language and input.';
}

async function proxyRequest({ path, method, apiKey, body, contentType, searchParams, res }) {
  const upstreamUrl = new URL(`${PLOTWEAVER_BASE_URL}/${path}`);
  if (path === 'languages') {
    const service = searchParams.get('service');
    if (service && !['tts', 'tts_clone', 'asr', 'translation'].includes(service)) {
      return sendJson(res, 400, { error: 'Choose a supported Idilewa voice service.' });
    }
    if (service) upstreamUrl.searchParams.set('service', service);
  }
  if (path === 'voices') {
    for (const name of ['language', 'type']) {
      const value = searchParams.get(name);
      if (value) upstreamUrl.searchParams.set(name, value);
    }
  }

  const headers = { Accept: 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;
  if (contentType && !(body instanceof FormData)) headers['Content-Type'] = contentType;
  const options = { method, headers, signal: AbortSignal.timeout(55_000) };
  if (body !== undefined) options.body = body;

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, options);
  } catch (error) {
    console.error('[plotweaver] Upstream request failed.', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return sendJson(res, 502, { error: 'Idilewa voice service is unavailable. Try again later.' });
  }

  if (!upstream.ok) {
    console.error('[plotweaver] Upstream rejected a request.', { upstreamStatus: upstream.status });
    return sendJson(res, upstream.status, {
      error: errorForUpstreamStatus(upstream.status),
      providerStatus: upstream.status,
    }, {
      ...(upstream.headers.get('retry-after')
        ? { 'Retry-After': upstream.headers.get('retry-after') }
        : {}),
    });
  }

  const responseType = upstream.headers.get('content-type') || '';
  if (responseType.startsWith('audio/')) {
    res.setHeader('Content-Type', responseType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    for (const name of ['x-model', 'x-voice', 'x-language', 'x-request-id']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    return res.status(upstream.status).send(Buffer.from(await upstream.arrayBuffer()));
  }

  let responseBody;
  try {
    responseBody = await upstream.json();
  } catch {
    return sendJson(res, 502, { error: 'Idilewa voice service returned an invalid response.' });
  }
  return sendJson(res, upstream.status, responseBody);
}

export default async function handler(req, res) {
  if (!applyCors(req, res)) {
    return sendJson(res, 403, { error: 'This origin is not allowed to use the Idilewa voice service.' });
  }
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { path, searchParams } = getRoute(req);
  const supportedRoute = path === 'languages'
    || path === 'voices'
    || path === 'speech'
    || path === 'speech/clone'
    || path === 'transcriptions'
    || path === 'translations';
  if (!supportedRoute) return sendJson(res, 404, { error: 'Idilewa voice service resource not found.' });

  const allowedMethods = path === 'languages'
    ? ['GET']
    : path === 'voices'
      ? ['GET', 'POST']
      : ['POST'];
  if (!allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods.join(', '));
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const requiresKey = path !== 'languages';
  const apiKey = getApiKey();
  if (requiresKey && !apiKey) {
    return sendJson(res, 503, { error: 'Idilewa voice service is not configured on this deployment.' });
  }

  let body;
  let contentType = req.headers?.['content-type'] || '';
  if (req.method === 'POST') {
    const read = await readRequestBody(req);
    if (read.error) return sendJson(res, read.error.status, { error: read.error.message });

    if (path === 'transcriptions' || path === 'voices' || path === 'speech/clone') {
      const parsed = await parseMultipart(read.body, contentType, path);
      if (parsed.error) return sendJson(res, parsed.error.status, { error: parsed.error.message });
      body = parsed.formData;
      contentType = '';
    } else {
      if (!contentType.toLowerCase().includes('application/json')) {
        return sendJson(res, 400, { error: 'Send a JSON request body.' });
      }
      const parsed = parseJsonBody(read.body);
      if (parsed.error) return sendJson(res, parsed.error.status, { error: parsed.error.message });
      const invalid = validateJsonRequest(path, parsed.value);
      if (invalid) return sendJson(res, invalid.status, { error: invalid.message });
      body = JSON.stringify(parsed.value);
    }
  }

  if (req.method === 'GET' && path === 'voices') {
    const language = searchParams.get('language');
    const type = searchParams.get('type');
    if (language && !LANGUAGE_CODE_PATTERN.test(language)) {
      return sendJson(res, 400, { error: 'Choose a valid voice language.' });
    }
    if (type && type !== 'builtin') {
      return sendJson(res, 400, { error: 'The public voice library only lists built-in voices.' });
    }
  }

  return proxyRequest({
    path,
    method: req.method,
    apiKey,
    body,
    contentType,
    searchParams,
    res,
  });
}

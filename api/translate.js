import { handleCanvaRequest } from '../lib/canva/handler.js';

const MAX_TEXT_LENGTH = 5_000;
const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

export const config = { maxDuration: 30 };

function sendJson(res, statusCode, body, headers = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
  return res.status(statusCode).json(body);
}

function getApiKey() {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!apiKey) return null;
  return apiKey;
}

function parseTranslationRequest(req) {
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_TEXT_LENGTH + 1_024) {
    return { error: { status: 413, message: 'Text must be 5,000 characters or shorter.' } };
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return { error: { status: 400, message: 'The request body must contain valid JSON.' } };
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: { status: 400, message: 'A JSON request body is required.' } };
  }
  if (typeof body.text !== 'string' || !body.text.trim()) {
    return { error: { status: 400, message: 'Enter text to translate.' } };
  }
  if (Buffer.byteLength(body.text, 'utf8') > MAX_TEXT_LENGTH) {
    return { error: { status: 413, message: 'Text must be 5,000 characters or shorter.' } };
  }
  if (typeof body.target !== 'string' || !LANGUAGE_CODE_PATTERN.test(body.target)) {
    return { error: { status: 400, message: 'Choose a supported target language.' } };
  }
  return { text: body.text.trim(), target: body.target };
}

async function readGoogleResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw Object.assign(new Error('Google Cloud Translation returned an invalid response.'), {
      statusCode: 502,
    });
  }

  if (!response.ok) {
    const statusCode = response.status === 429
      ? 429
      : response.status === 400
        ? 422
        : response.status >= 500
          ? 502
          : 503;
    throw Object.assign(new Error('Google Cloud Translation rejected the request.'), {
      statusCode,
      upstreamStatus: response.status,
    });
  }
  return payload;
}

async function listLanguages(apiKey) {
  const url = new URL(`${GOOGLE_TRANSLATE_URL}/languages`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('target', 'en');
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await readGoogleResponse(response);
  const languages = payload?.data?.languages;
  if (!Array.isArray(languages)) {
    throw Object.assign(new Error('Google Cloud Translation returned an invalid language list.'), {
      statusCode: 502,
    });
  }
  return languages
    .filter((language) => typeof language?.language === 'string'
      && LANGUAGE_CODE_PATTERN.test(language.language)
      && typeof language?.name === 'string')
    .map(({ language, name }) => ({ code: language, name }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

async function translateText(apiKey, text, target) {
  const url = new URL(GOOGLE_TRANSLATE_URL);
  url.searchParams.set('key', apiKey);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      q: text,
      source: 'en',
      target,
      format: 'text',
      model: 'nmt',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await readGoogleResponse(response);
  const translation = payload?.data?.translations?.[0];
  if (typeof translation?.translatedText !== 'string' || !translation.translatedText.trim()) {
    throw Object.assign(new Error('Google Cloud Translation returned no translated text.'), {
      statusCode: 502,
    });
  }
  return {
    translated: translation.translatedText,
    target,
    provider: 'Google Cloud Translation',
    machineTranslated: true,
  };
}

export default async function handler(req, res) {
  const requestUrl = new URL(req.url || '/', 'https://idilewa.local');
  const service = requestUrl.searchParams.get('service');
  if (service === 'canva') {
    return handleCanvaRequest(req, res, requestUrl.searchParams.get('operation'));
  }

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return sendJson(res, 503, { error: 'Machine translation is not configured on this deployment.' });
  }

  try {
    if (req.method === 'GET') {
      const languages = await listLanguages(apiKey);
      return sendJson(res, 200, { languages }, {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      });
    }

    const request = parseTranslationRequest(req);
    if (request.error) {
      return sendJson(res, request.error.status, { error: request.error.message });
    }
    const result = await translateText(apiKey, request.text, request.target);
    return sendJson(res, 200, result, { 'Cache-Control': 'no-store' });
  } catch (error) {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 502;
    console.error('[translate] Google Cloud Translation request failed.', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
      upstreamStatus: Number.isInteger(error?.upstreamStatus) ? error.upstreamStatus : null,
    });
    return sendJson(res, status, {
      error: status === 429
        ? 'The translation service quota or rate limit was reached. Try again later.'
        : status === 422
          ? 'Google Cloud Translation does not support that target language for this request.'
          : status === 503
            ? 'Google Cloud Translation is not available. Check its API and key configuration.'
            : 'The translation service is temporarily unavailable. Try again later.',
    });
  }
}

import { handleCanvaRequest } from '../lib/canva/handler.js';

const PLOTWEAVER_BASE_URL = 'https://api.plotweaver.app/v1';
const MAX_TEXT_LENGTH = 2_000;
const DEFAULT_SOURCE_LANGUAGE = 'en';
const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

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
  return process.env.PLOTWEAVER_API_KEY?.trim()
    || process.env.Idilewa?.trim()
    || '';
}

function parseTranslationRequest(req) {
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_TEXT_LENGTH + 1_024) {
    return { error: { status: 413, message: `Text must be ${MAX_TEXT_LENGTH.toLocaleString('en-US')} characters or shorter.` } };
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
    return { error: { status: 413, message: `Text must be ${MAX_TEXT_LENGTH.toLocaleString('en-US')} characters or shorter.` } };
  }
  if (typeof body.target !== 'string' || !LANGUAGE_CODE_PATTERN.test(body.target)) {
    return { error: { status: 400, message: 'Choose a supported target language.' } };
  }
  const source = body.source === undefined || body.source === null || body.source === ''
    ? DEFAULT_SOURCE_LANGUAGE
    : body.source;
  if (typeof source !== 'string' || !LANGUAGE_CODE_PATTERN.test(source)) {
    return { error: { status: 400, message: 'Choose a supported source language.' } };
  }
  return { value: { text: body.text.trim(), source, target: body.target } };
}

function statusForUpstream(status) {
  if ([401, 402, 403].includes(status)) return 503;
  if (status === 400 || status === 422) return 422;
  if (status === 429) return 429;
  return 502;
}

function messageForUpstreamStatus(status) {
  if (status === 401) return 'Plotweaver rejected the configured account credentials. Check PLOTWEAVER_API_KEY.';
  if (status === 402) return 'Plotweaver billing or account setup is required before translation can run.';
  if (status === 403) return 'Plotweaver translation is not enabled for the configured account. Enable the translation service on the Plotweaver account or upgrade the plan, then try again.';
  if (status === 400 || status === 422) return 'Plotweaver does not support that language pair for this text.';
  if (status === 429) return 'The translation service quota or rate limit was reached. Try again later.';
  if (status >= 500) return 'Plotweaver is temporarily unavailable. Try again later.';
  return 'The translation service could not complete this request. Check the selected language and input.';
}

async function readPlotweaverResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw Object.assign(new Error('Idilewa voice service returned an invalid response.'), {
      statusCode: 502,
    });
  }

  if (!response.ok) {
    throw Object.assign(new Error(messageForUpstreamStatus(response.status)), {
      statusCode: statusForUpstream(response.status),
      upstreamStatus: response.status,
    });
  }
  return payload;
}

function plotweaverHeaders(apiKey, extra = {}) {
  return {
    Accept: 'application/json',
    ...(apiKey ? { 'X-API-Key': apiKey } : {}),
    ...extra,
  };
}


async function listLanguages(apiKey) {
  const url = new URL(`${PLOTWEAVER_BASE_URL}/languages`);
  url.searchParams.set('service', 'translation');
  const response = await fetch(url, {
    headers: plotweaverHeaders(apiKey),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await readPlotweaverResponse(response);
  if (!Array.isArray(payload)) {
    throw Object.assign(new Error('Idilewa voice service returned an invalid language list.'), {
      statusCode: 502,
    });
  }
  return payload
    .filter((language) => typeof language?.code === 'string'
      && LANGUAGE_CODE_PATTERN.test(language.code)
      && typeof language?.name === 'string')
    .map(({ code, name }) => ({ code, name }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

async function translateText({ apiKey, text, source, target }) {
  const response = await fetch(`${PLOTWEAVER_BASE_URL}/translations`, {
    method: 'POST',
    headers: plotweaverHeaders(apiKey, { 'Content-Type': 'application/json; charset=utf-8' }),
    body: JSON.stringify({
      text,
      source_language: source,
      target_language: target,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await readPlotweaverResponse(response);
  const translated = typeof payload?.translated_text === 'string' ? payload.translated_text.trim() : '';
  if (!translated) {
    throw Object.assign(new Error('Idilewa voice service returned no translated text.'), {
      statusCode: 502,
    });
  }
  return {
    translated,
    source,
    target,
    provider: 'Plotweaver',
    machineTranslated: true,
  };
}

export default async function handler(req, res) {
  const requestUrl = new URL(req.url || '/', 'https://idilewa.local');
  if (requestUrl.searchParams.get('service') === 'canva') {
    return handleCanvaRequest(req, res, requestUrl.searchParams.get('operation'));
  }

  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const apiKey = getApiKey();
  try {
    if (req.method === 'GET') {
      // The upstream language list is public, so it stays available even when
      // this deployment has no Plotweaver key configured.
      const languages = await listLanguages(apiKey);
      return sendJson(res, 200, { languages }, {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      });
    }

    if (!apiKey) {
      return sendJson(res, 503, {
        error: 'Machine translation is not configured on this deployment. Add PLOTWEAVER_API_KEY.',
      });
    }

    const request = parseTranslationRequest(req);
    if (request.error) {
      return sendJson(res, request.error.status, { error: request.error.message });
    }
    const result = await translateText({ apiKey, ...request.value });
    return sendJson(res, 200, result, { 'Cache-Control': 'no-store' });
  } catch (error) {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 502;
    console.error('[translate] Plotweaver translation request failed.', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
      upstreamStatus: Number.isInteger(error?.upstreamStatus) ? error.upstreamStatus : null,
    });
    return sendJson(res, status, {
      error: status === 429
        ? 'The translation service quota or rate limit was reached. Try again later.'
        : error instanceof Error && Number.isInteger(error.statusCode)
          ? error.message
          : 'The translation service is temporarily unavailable. Try again later.',
    });
  }
}

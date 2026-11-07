import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

export const OAUTH_STATE_COOKIE = 'idilewa_canva_oauth';
export const CANVA_API_BASE = 'https://api.canva.com/rest/v1';
const STATE_MAX_AGE = 10 * 60;

export function getCanvaConfig() {
  const clientId = process.env.CANVA_CLIENT_ID?.trim();
  const clientSecret = process.env.CANVA_CLIENT_SECRET?.trim();
  const redirectUri = process.env.CANVA_REDIRECT_URI?.trim();
  let validRedirectUri = false;
  try {
    const parsedRedirectUri = new URL(redirectUri);
    const localDevelopmentRedirect = process.env.NODE_ENV !== 'production'
      && parsedRedirectUri.protocol === 'http:'
      && ['localhost', '127.0.0.1'].includes(parsedRedirectUri.hostname);
    validRedirectUri = (parsedRedirectUri.protocol === 'https:' || localDevelopmentRedirect)
      && !parsedRedirectUri.username
      && !parsedRedirectUri.password
      && parsedRedirectUri.pathname === '/api/canva/callback'
      && !parsedRedirectUri.search
      && !parsedRedirectUri.hash;
  } catch {
    validRedirectUri = false;
  }
  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: Boolean(clientId && clientSecret && validRedirectUri),
    missing: [
      !clientId && 'CANVA_CLIENT_ID',
      !clientSecret && 'CANVA_CLIENT_SECRET',
      !validRedirectUri && 'CANVA_REDIRECT_URI (must be a valid HTTPS callback URL)',
    ].filter(Boolean),
  };
}

export function sendJson(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(payload);
}

export function serializeCookie(name, value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${value}; Path=/api/canva; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearOAuthStateCookie(res) {
  res.setHeader('Set-Cookie', serializeCookie(OAUTH_STATE_COOKIE, '', 0));
}

export function setOAuthStateCookie(res, value) {
  res.setHeader('Set-Cookie', serializeCookie(OAUTH_STATE_COOKIE, value, STATE_MAX_AGE));
}

export function readOAuthStateCookie(req, secret) {
  const rawCookie = req.headers.cookie || '';
  const value = rawCookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.slice(OAUTH_STATE_COOKIE.length + 1);
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (
      typeof parsed.state !== 'string'
      || typeof parsed.verifier !== 'string'
      || !Number.isInteger(parsed.expiresAt)
      || parsed.expiresAt < Date.now()
    ) return null;
    const expectedSignature = createHmac('sha256', secret)
      .update(`${parsed.state}.${parsed.verifier}.${parsed.expiresAt}`)
      .digest();
    const receivedSignature = Buffer.from(parsed.signature || '', 'base64url');
    if (
      receivedSignature.length !== expectedSignature.length
      || !timingSafeEqual(receivedSignature, expectedSignature)
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createOAuthState(secret) {
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const expiresAt = Date.now() + STATE_MAX_AGE * 1000;
  const signature = createHmac('sha256', secret)
    .update(`${state}.${verifier}.${expiresAt}`)
    .digest('base64url');
  const cookie = Buffer.from(JSON.stringify({
    state,
    verifier,
    expiresAt,
    signature,
  })).toString('base64url');
  return { state, verifier, cookie };
}

export function matchesOAuthState(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string' || expected.length !== actual.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }
  return difference === 0;
}

export function createCodeChallenge(verifier) {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function requireSameOrigin(req, res, allowedOrigin) {
  const origin = req.headers.origin;
  if (origin !== allowedOrigin) {
    sendJson(res, 403, { error: 'Request origin is not allowed.' });
    return false;
  }
  return true;
}

export function parseJsonBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

export function validatePreview(preview) {
  if (typeof preview !== 'string' || preview.length > 2_000_000) {
    return { error: 'The game preview is missing or too large.' };
  }
  const match = preview.match(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return { error: 'The game preview must be a PNG image.' };
  const buffer = Buffer.from(match[1], 'base64');
  if (
    buffer.length < 24
    || buffer.length > 1_500_000
    || buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
    || buffer.toString('ascii', 12, 16) !== 'IHDR'
  ) return { error: 'The game preview is not a valid PNG image.' };
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== 960 || height !== 540) {
    return { error: 'The game preview must be 960 by 540 pixels.' };
  }
  return { buffer };
}

export async function fetchCanvaJson(url, options) {
  const response = await fetch(url, options);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Canva returned an unreadable response.');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Canva returned an invalid response.');
  }
  if (!response.ok) {
    const error = new Error(payload.error?.message || payload.message || 'Canva request failed.');
    error.statusCode = response.status;
    throw error;
  }
  return payload;
}

export function getRequestOrigin(redirectUri) {
  return new URL(redirectUri).origin;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

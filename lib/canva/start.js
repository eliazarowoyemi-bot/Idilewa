import {
  createCodeChallenge,
  createOAuthState,
  getCanvaConfig,
  sendJson,
  setOAuthStateCookie,
} from './shared.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Use GET to start Canva authorization.' });
  }

  const config = getCanvaConfig();
  if (!config.configured) {
    return sendJson(res, 503, {
      error: `Canva is not configured. Add ${config.missing.join(', ')} in Vercel and register the callback URL.`,
    });
  }

  const { state, verifier, cookie } = createOAuthState(config.clientSecret);
  const authorizationUrl = new URL('https://www.canva.com/api/oauth/authorize');
  authorizationUrl.searchParams.set('client_id', config.clientId);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', 'asset:read asset:write design:content:write');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('redirect_uri', config.redirectUri);
  authorizationUrl.searchParams.set('code_challenge', createCodeChallenge(verifier));
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  setOAuthStateCookie(res, cookie);
  res.status(302).setHeader('Location', authorizationUrl.href);
  return res.end();
}

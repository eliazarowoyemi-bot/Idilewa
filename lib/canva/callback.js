import {
  clearOAuthStateCookie,
  escapeHtml,
  getCanvaConfig,
  getRequestOrigin,
  matchesOAuthState,
  readOAuthStateCookie,
} from './shared.js';

function sendCallbackPage(res, statusCode, title, message, handoff) {
  const safeOrigin = JSON.stringify(handoff.origin || '').replaceAll('<', '\\u003c');
  const safeCode = JSON.stringify(handoff.code || '').replaceAll('<', '\\u003c');
  const safeState = JSON.stringify(handoff.state || '').replaceAll('<', '\\u003c');
  const script = handoff.code
    ? `<script>
        const appOrigin = ${safeOrigin};
        const authorization = { type: 'idilewa-canva-authorized', code: ${safeCode}, state: ${safeState} };
        if (window.opener) {
          window.opener.postMessage(authorization, appOrigin);
          window.addEventListener('message', (event) => {
            if (event.origin !== appOrigin || event.source !== window.opener) return;
            if (event.data?.type === 'idilewa-canva-error') {
              document.getElementById('canva-result').textContent = event.data.message;
            }
          });
          document.getElementById('canva-result').textContent = 'Canva authorization was received. Return to Code Lab.';
        } else {
          window.location.replace('/?view=codeLab');
        }
      </script>`
    : '';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  );
  return res.status(statusCode).end(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(title)} | Idilewa</title>
        <style>
          body{margin:0;padding:32px;background:#f3f8f3;color:#15291f;font:16px/1.55 system-ui,sans-serif}
          main{max-width:560px;margin:12vh auto;padding:24px;background:#fff;border:1px solid #d7e2d9;border-radius:8px}
          h1{margin-top:0;font-size:24px}
          #canva-result{color:#40554a}
          a{display:inline-flex;min-height:44px;align-items:center;margin-top:16px;color:#135e3d;font-weight:700}
        </style>
      </head>
      <body><main><h1>${escapeHtml(title)}</h1><p id="canva-result">${escapeHtml(message)}</p>
        <a href="/?view=codeLab">Continue to Code Lab</a>
        ${script}
      </main></body>
    </html>`);
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendCallbackPage(res, 405, 'Canva connection failed', 'Return to Ìdíléwa and try again.', {});
  }

  const config = getCanvaConfig();
  if (!config.configured) {
    return sendCallbackPage(res, 503, 'Canva is not configured', 'Add the required Canva environment variables in Vercel, then try again.', {});
  }

  const params = new URL(req.url || '/', config.redirectUri).searchParams;
  if (params.get('error')) {
    clearOAuthStateCookie(res);
    return sendCallbackPage(res, 400, 'Canva was not connected', 'Canva authorization was cancelled. No design was created.', {});
  }

  const code = params.get('code');
  const receivedState = params.get('state');
  const stateCookie = readOAuthStateCookie(req, config.clientSecret);
  if (
    !code
    || code.length > 2_000
    || !stateCookie
    || !matchesOAuthState(receivedState, stateCookie.state)
  ) {
    clearOAuthStateCookie(res);
    return sendCallbackPage(
      res,
      400,
      'Canva connection could not be verified',
      'The authorization response was missing or invalid. Return to Ìdíléwa and try again.',
      {},
    );
  }

  const origin = getRequestOrigin(config.redirectUri);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  return sendCallbackPage(
    res,
    200,
    'Canva authorization complete',
    'Authorization complete. Creating your game artboard…',
    { code, state: receivedState, origin },
  );
}

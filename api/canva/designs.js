import {
  CANVA_API_BASE,
  clearOAuthStateCookie,
  fetchCanvaJson,
  getCanvaConfig,
  matchesOAuthState,
  parseJsonBody,
  readOAuthStateCookie,
  requireSameOrigin,
  sendJson,
  validatePreview,
} from './shared.js';

const MAX_REQUEST_BYTES = 1_450_000;
const MAX_PREVIEW_BYTES = 1_000_000;

export const config = {
  api: { bodyParser: { sizeLimit: '2mb' } },
  maxDuration: 45,
};

function validateTitle(value) {
  if (typeof value !== 'string') return '';
  const title = value.trim();
  if (!title || title.length > 48 || /[\u0000-\u001f\u007f]/.test(title)) return '';
  return title;
}

async function exchangeAuthorizationCode(code, stateCookie, config) {
  const result = await fetchCanvaJson(`${CANVA_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: stateCookie.verifier,
      redirect_uri: config.redirectUri,
    }),
  });
  if (typeof result.access_token !== 'string' || !result.access_token) {
    throw new Error('Canva returned an invalid authorization response.');
  }
  return result.access_token;
}

async function uploadPreview(accessToken, title, preview) {
  const imageName = `Idilewa ${title.slice(0, 29)} preview.png`;
  const uploadResult = await fetchCanvaJson(`${CANVA_API_BASE}/asset-uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Asset-Upload-Metadata': JSON.stringify({
        name_base64: Buffer.from(imageName).toString('base64'),
      }),
      'Content-Type': 'application/octet-stream',
      Accept: 'application/json',
    },
    body: preview,
  });
  let job = uploadResult.job;
  if (!job || typeof job.id !== 'string') {
    throw new Error('Canva did not start the game-preview upload.');
  }

  for (let attempt = 0; job.status === 'in_progress' && attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const result = await fetchCanvaJson(
      `${CANVA_API_BASE}/asset-uploads/${encodeURIComponent(job.id)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      },
    );
    job = result.job;
    if (!job || typeof job.status !== 'string') {
      throw new Error('Canva returned an invalid preview-upload status.');
    }
  }

  if (job.status === 'failed') {
    const message = job.error?.code === 'file_too_big'
      ? 'Canva rejected the preview because it is too large.'
      : 'Canva could not import the game preview. Try again.';
    throw new Error(message);
  }
  if (job.status !== 'success' || typeof job.asset?.id !== 'string') {
    throw new Error('Canva is still processing the preview. Try again in a moment.');
  }
  return job.asset.id;
}

async function createDesign(accessToken, title, assetId) {
  const result = await fetchCanvaJson(`${CANVA_API_BASE}/designs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      type: 'type_and_asset',
      design_type: { type: 'custom', width: 960, height: 540 },
      asset_id: assetId,
      title: `Idilewa ${title} - Game artboard`.slice(0, 255),
    }),
  });
  const editUrl = result.design?.urls?.edit_url;
  if (typeof editUrl !== 'string') {
    throw new Error('Canva created no editing link for the game artboard.');
  }
  const parsedEditUrl = new URL(editUrl);
  if (parsedEditUrl.origin !== 'https://www.canva.com') {
    throw new Error('Canva returned an unexpected editing link.');
  }
  return parsedEditUrl.href;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Use POST to create a Canva artboard.' });
  }

  const config = getCanvaConfig();
  if (!config.configured) {
    return sendJson(res, 503, {
      error: `Canva is not configured. Add ${config.missing.join(', ')} in Vercel.`,
    });
  }
  if (!requireSameOrigin(req, res, new URL(config.redirectUri).origin)) {
    return;
  }

  const body = parseJsonBody(req);
  if (!body) return sendJson(res, 400, { error: 'Provide the Canva authorization and game preview.' });
  if (Buffer.byteLength(JSON.stringify(body)) > MAX_REQUEST_BYTES) {
    return sendJson(res, 413, { error: 'The game preview is too large to send to Canva.' });
  }
  const code = typeof body.code === 'string' ? body.code : '';
  const state = typeof body.state === 'string' ? body.state : '';
  if (!code || code.length > 2_000) {
    return sendJson(res, 400, { error: 'The Canva authorization code is missing or invalid.' });
  }
  const title = validateTitle(body.title);
  if (!title) return sendJson(res, 400, { error: 'Game titles must contain 1–48 safe characters.' });
  const previewResult = validatePreview(body.preview);
  if (previewResult.error) return sendJson(res, 400, { error: previewResult.error });
  if (previewResult.buffer.length > MAX_PREVIEW_BYTES) {
    return sendJson(res, 400, { error: 'The game preview must be smaller than 1 MB.' });
  }

  const stateCookie = readOAuthStateCookie(req, config.clientSecret);
  if (!stateCookie || !matchesOAuthState(state, stateCookie.state)) {
    clearOAuthStateCookie(res);
    return sendJson(res, 401, { error: 'Canva authorization expired. Start the Canva connection again.' });
  }
  clearOAuthStateCookie(res);

  try {
    const accessToken = await exchangeAuthorizationCode(code, stateCookie, config);
    const assetId = await uploadPreview(accessToken, title, previewResult.buffer);
    const editUrl = await createDesign(accessToken, title, assetId);
    return sendJson(res, 200, { editUrl });
  } catch (error) {
    console.error('[canva] Artboard creation failed:', error.message);
    const status = error.statusCode === 429 ? 429 : 502;
    return sendJson(res, status, { error: error.message });
  }
}

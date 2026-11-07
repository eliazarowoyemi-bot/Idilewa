import { getCanvaConfig, sendJson } from './shared.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Use GET to check Canva setup.' });
  }

  const config = getCanvaConfig();
  if (!config.configured) {
    return sendJson(res, 200, {
      configured: false,
      message: `Canva is not configured in Vercel yet. Add ${config.missing.join(', ')} and register the callback URL.`,
    });
  }

  return sendJson(res, 200, {
    configured: true,
    message: 'Canva is ready. Sign in when you create a game artboard.',
  });
}

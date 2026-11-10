import requestGuardianAccess from '../../src/server/guardianRequestHandler.js';
import verifyGuardianCode from '../../src/server/guardianVerifyHandler.js';
import approveGuardianRequest from '../../src/server/guardianApproveHandler.js';
import { sendGuardianJson } from '../../src/server/guardianConsent.js';

const handlers = {
  request: requestGuardianAccess,
  verify: verifyGuardianCode,
  approve: approveGuardianRequest,
};

export const config = { maxDuration: 15 };

function getRoute(req) {
  const { pathname } = new URL(req.url || '/', 'https://idilewa.local');
  const prefix = '/api/guardian';
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return '';
  return pathname.slice(prefix.length).replace(/^\/+|\/+$/g, '');
}

export default async function handler(req, res) {
  const route = getRoute(req);
  const endpoint = typeof route === 'string' && Object.hasOwn(handlers, route)
    ? handlers[route]
    : null;

  if (!endpoint) {
    return sendGuardianJson(res, 404, { error: 'Guardian endpoint not found.' });
  }

  return endpoint(req, res);
}

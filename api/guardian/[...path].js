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

export default async function handler(req, res) {
  const route = Array.isArray(req.query?.path)
    ? req.query.path.length === 1 ? req.query.path[0] : ''
    : req.query?.path;
  const endpoint = typeof route === 'string' && Object.hasOwn(handlers, route)
    ? handlers[route]
    : null;

  if (!endpoint) {
    return sendGuardianJson(res, 404, { error: 'Guardian endpoint not found.' });
  }

  return endpoint(req, res);
}

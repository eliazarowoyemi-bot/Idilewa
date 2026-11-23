import connectionApprovalHandler from '../../src/server/educatorConnectionApproval.js';
import connectionRequestHandler from '../../src/server/educatorConnectionRequest.js';
import verifyInviteHandler from '../../src/server/educatorVerifyInvite.js';
import { getApiRoutePath } from '../../src/server/apiRoutePath.js';
import { sendApiJson } from '../../src/server/authenticatedRequest.js';

const handlers = {
  'connection-approval': connectionApprovalHandler,
  'connection-request': connectionRequestHandler,
  'verify-invite': verifyInviteHandler,
};

export const config = { maxDuration: 15 };

export default function handler(req, res) {
  const routeHandler = handlers[getApiRoutePath(req, '/api/educator')];
  if (!routeHandler) return sendApiJson(res, 404, { error: 'Educator endpoint not found.' });
  return routeHandler(req, res);
}

import educatorDashboardHandler from '../../src/server/dashboardEducator.js';
import parentDashboardHandler from '../../src/server/dashboardParent.js';
import { getApiRoutePath } from '../../src/server/apiRoutePath.js';
import { sendApiJson } from '../../src/server/authenticatedRequest.js';

const handlers = {
  educator: educatorDashboardHandler,
  parent: parentDashboardHandler,
};

export default function handler(req, res) {
  const routeHandler = handlers[getApiRoutePath(req, '/api/dashboard')];
  if (!routeHandler) return sendApiJson(res, 404, { error: 'Dashboard endpoint not found.' });
  return routeHandler(req, res);
}

import {
  cancelSubscriptionHandler,
  checkoutHandler,
  historyHandler,
  quoteHandler,
  verifyHandler,
} from '../../src/server/billing.js';
import { getApiRoutePath } from '../../src/server/apiRoutePath.js';
import { sendApiJson } from '../../src/server/authenticatedRequest.js';

const handlers = {
  cancel: cancelSubscriptionHandler,
  checkout: checkoutHandler,
  history: historyHandler,
  quote: quoteHandler,
  verify: verifyHandler,
};

export const config = { maxDuration: 15 };

export default function handler(req, res) {
  const routeHandler = handlers[getApiRoutePath(req, '/api/payments')];
  if (!routeHandler) return sendApiJson(res, 404, { error: 'Payment endpoint not found.' });
  return routeHandler(req, res);
}

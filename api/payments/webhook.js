import { webhookHandler } from '../../src/server/billing.js';

export const config = {
  api: { bodyParser: false },
  maxDuration: 15,
};

export default webhookHandler;

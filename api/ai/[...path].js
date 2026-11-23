import conversationHandler from '../../src/server/aiConversationHandler.js';
import knowledgeHandler from '../../src/server/aiKnowledgeHandler.js';
import { getApiRoutePath } from '../../src/server/apiRoutePath.js';
import { sendApiJson } from '../../src/server/authenticatedRequest.js';

const handlers = {
  conversation: conversationHandler,
  knowledge: knowledgeHandler,
};

export const config = { maxDuration: 60 };

export default function handler(req, res) {
  const routeHandler = handlers[getApiRoutePath(req, '/api/ai')];
  if (!routeHandler) return sendApiJson(res, 404, { error: 'AI endpoint not found.' });
  return routeHandler(req, res);
}

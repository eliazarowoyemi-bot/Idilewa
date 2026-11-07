import canvaCallback from './callback.js';
import createCanvaDesign from './designs.js';
import canvaStart from './start.js';
import canvaStatus from './status.js';
import { sendJson } from './shared.js';

const OPERATIONS = {
  callback: canvaCallback,
  designs: createCanvaDesign,
  start: canvaStart,
  status: canvaStatus,
};

export function handleCanvaRequest(req, res, operation) {
  if (!Object.hasOwn(OPERATIONS, operation)) {
    return sendJson(res, 404, { error: 'Canva operation not found.' });
  }
  return OPERATIONS[operation](req, res);
}

import { readFileSync } from 'node:fs';

const source = readFileSync('app.js', 'utf8');
const patterns = {
  iframe: /<iframe/gi,
  newWorker: /new Worker\(/g,
  evalCall: /[^.\w]eval\(/g,
  newFunction: /new Function\(/g,
  youtube: /youtube|vimeo/gi,
  blobUrl: /URL\.createObjectURL/g,
  webSocket: /new WebSocket\(/g,
};

for (const [name, pattern] of Object.entries(patterns)) {
  const matches = source.match(pattern) || [];
  console.log(`${name}: ${matches.length}${matches.length ? ` (first: ${matches[0]})` : ''}`);
}

import { readFileSync } from 'node:fs';

const source = readFileSync('app.js', 'utf8');
const handled = new Set([...source.matchAll(/case '([a-z0-9-]+)':/g)].map((match) => match[1]));
const usedActionAttrs = new Set([...source.matchAll(/data-action="([^"]+)"/g)].map((match) => match[1]));
const usedActions = new Set([...source.matchAll(/data-action='([^']+)'/g)].map((match) => match[1]));

const missing = [...usedActionAttrs, ...usedActions].filter((action) => !handled.has(action)).sort();

console.log(`handled actions: ${handled.size}`);
console.log(`referenced actions: ${usedActionAttrs.size + usedActions.size}`);
console.log(`missing handlers (${missing.length}): ${missing.join(', ') || 'none'}`);

const declared = [...handled].sort();
console.log(`\nunused handlers (${declared.filter((action) => !usedActionAttrs.has(action) && !usedActions.has(action)).length}): ${declared.filter((action) => !usedActionAttrs.has(action) && !usedActions.has(action)).join(', ')}`);

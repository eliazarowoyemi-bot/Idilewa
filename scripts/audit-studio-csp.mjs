import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const files = walk('src/studio').filter((file) => /\.(js|css|html)$/.test(file));
const report = { files: files.length, iframe: [], eval: [], handlers: [], styleAttrs: 0, inlineScriptTags: [] };

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (/<iframe/i.test(source)) report.iframe.push(file);
  if (/[^.\w]eval\(|new Function\(/.test(source)) report.eval.push(file);
  const handlers = source.match(/\son[a-z]+=/gi);
  if (handlers) report.handlers.push(`${file} (${handlers.length})`);
  report.styleAttrs += (source.match(/style="/g) || []).length;
  if (/<script(?![^>]*\bsrc=)/i.test(source)) report.inlineScriptTags.push(file);
}

console.log(JSON.stringify(report, null, 2));

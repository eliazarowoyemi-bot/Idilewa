import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATASET_LANGUAGES = Object.freeze(['yo', 'ig', 'ha', 'sw', 'pcm']);
const VALID_ROLES = new Set(['user', 'assistant']);

export function validateJsonlDataset(language, text, seen = new Set()) {
  const errors = [];
  const records = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const lineNumber = index + 1;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      errors.push(`${language}:${lineNumber}: invalid JSON`);
      return;
    }

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      errors.push(`${language}:${lineNumber}: record must be a JSON object`);
      return;
    }
    if (record.language !== language || !DATASET_LANGUAGES.includes(record.language)) {
      errors.push(`${language}:${lineNumber}: missing or mismatched language label`);
    }
    if (typeof record.id !== 'string' || !record.id.trim()) {
      errors.push(`${language}:${lineNumber}: id is required`);
    }
    if (typeof record.source !== 'string' || !record.source.trim()) {
      errors.push(`${language}:${lineNumber}: source is required`);
    }
    if (!['review_required', 'reviewed'].includes(record.review_status)) {
      errors.push(`${language}:${lineNumber}: review_status must be review_required or reviewed`);
    }
    if (!Array.isArray(record.messages) || record.messages.length < 2) {
      errors.push(`${language}:${lineNumber}: at least one user/assistant exchange is required`);
      return;
    }

    let previousRole = '';
    const normalizedMessages = [];
    for (const message of record.messages) {
      if (!message || !VALID_ROLES.has(message.role)) {
        errors.push(`${language}:${lineNumber}: invalid conversation role`);
        continue;
      }
      if (message.role === previousRole) {
        errors.push(`${language}:${lineNumber}: conversation roles must alternate`);
      }
      if (typeof message.content !== 'string' || !message.content.trim()) {
        errors.push(`${language}:${lineNumber}: messages must not be empty`);
      } else {
        normalizedMessages.push(`${message.role}:${message.content.trim().toLowerCase().replace(/\s+/g, ' ')}`);
      }
      previousRole = message.role;
    }
    if (record.messages[0]?.role !== 'user' || record.messages.at(-1)?.role !== 'assistant') {
      errors.push(`${language}:${lineNumber}: conversations must begin with a user and end with an assistant`);
    }

    const duplicateKey = `${language}:${normalizedMessages.join('|')}`;
    if (seen.has(duplicateKey)) errors.push(`${language}:${lineNumber}: duplicate conversation example`);
    seen.add(duplicateKey);
    records.push(record);
  });

  return { errors, records };
}

export async function validateDatasetDirectory(directory) {
  const files = await readdir(directory);
  const seen = new Set();
  const errors = [];
  const loadedLanguages = new Set();

  for (const language of DATASET_LANGUAGES) {
    const filename = `${language}.jsonl`;
    if (!files.includes(filename)) {
      errors.push(`${filename}: dataset file is missing`);
      continue;
    }
    loadedLanguages.add(language);
    const content = await readFile(resolve(directory, filename), 'utf8');
    const result = validateJsonlDataset(language, content, seen);
    errors.push(...result.errors);
    if (result.records.length === 0) errors.push(`${filename}: dataset must contain at least one example`);
  }

  for (const filename of files.filter((entry) => entry.endsWith('.jsonl'))) {
    if (!DATASET_LANGUAGES.includes(filename.slice(0, -6))) {
      errors.push(`${filename}: unsupported language dataset`);
    }
  }
  return { errors, languages: [...loadedLanguages] };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const directory = resolve(process.cwd(), 'data', 'ai-training');
  const result = await validateDatasetDirectory(directory);
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${result.languages.length} language datasets.`);
  }
}

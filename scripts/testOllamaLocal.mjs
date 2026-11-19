import { generateAiConversationReply, getAiProviderConfig } from '../src/server/aiConversation.js';

try {
  const config = getAiProviderConfig(process.env);
  const result = await generateAiConversationReply({
    language: 'yo',
    ageGroup: '18+',
    level: 'Elementary',
    message: 'Give a short greeting in Yorùbá and explain its English meaning.',
    config,
  });
  process.stdout.write(`${result.reply}\n`);
} catch (error) {
  const status = Number(error?.statusCode);
  const prefix = Number.isInteger(status) ? `Local Ollama request failed (HTTP ${status})` : 'Local Ollama request failed';
  console.error(`${prefix}: ${error?.message || 'Unknown error'}`);
  process.exitCode = 1;
}

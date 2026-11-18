import { searchSupportKnowledge } from './supportAssistantSearch.js';
import { supportPageKnowledge } from './supportAssistantKnowledge.js';

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getSources(urls) {
  return urls
    .map((url) => supportPageKnowledge.find((page) => page.url === url))
    .filter(Boolean)
    .map(({ title, label, url }) => ({ title, label, url }));
}

function createReply(reply, urls) {
  return { reply, sources: getSources(urls) };
}

export function getLocalSupportAssistantReply(question) {
  const normalized = normalize(question);
  if (!normalized) return null;

  if (/^(hi|hello|hey|hiya|good morning|good afternoon|good evening)$/.test(normalized)) {
    return createReply(
      'Hello! I can help you explore Idilewa. Ask me about language learning, family accounts, Code, Creative Studio, Voice Lessons, or privacy.',
      ['/', '/faq'],
    );
  }

  if (/\b(language|languages|yoruba|igbo|hausa|kiswahili|swahili|pidgin)\b/.test(normalized)) {
    return createReply(
      [
        'Languages you can explore',
        'The Language Academy currently highlights Yorùbá, Igbo, Hausa, and Kiswahili. Its beginner-friendly activities include lessons, listening, and pronunciation practice.',
        'Nigerian Pidgin is available in AI Conversation and selected Plotweaver voice tools. Availability varies by service.',
        'A good next step: choose a language in the Academy, then try Voice Lessons to practise listening and speaking.',
      ].join('\n\n'),
      ['/?view=academy', '/voice_lessons', '/ai-conversation'],
    );
  }

  if (/\b(family|families|parent|parents|guardian|guardians|child|children)\b/.test(normalized)
    && /\b(start|started|begin|account|sign up|signup|join|safe|safety)\b/.test(normalized)) {
    return createReply(
      [
        'Getting started as a family',
        '1. Explore the Academy and choose a language or activity together. You can browse before creating an account.',
        '2. When you want to save supported progress, an adult can create a family account in the Parent Portal.',
        '3. A child account needs parent or guardian approval by email before the learner can sign in. Tutor connections need separate approval.',
        'For privacy, avoid entering a child’s full legal name, school, address, phone number, or other sensitive details.',
      ].join('\n\n'),
      ['/', '/parents', '/parents.html#/privacy'],
    );
  }

  if (/\b(code|coding|programming|creative|creativity|studio|drawing|animation|3d)\b/.test(normalized)) {
    return createReply(
      [
        'Code and Creative Studio',
        'Code Playground: try beginner-friendly coding, computational-thinking activities, language-connected lessons, and games. Code execution depends on the configured runner service.',
        'Creative Studio: explore drawing, toon creation, 3D scenes, animation, and storytelling. Saving and returning to a project can depend on the device and browser.',
        'They are separate experiences, so you can create art in Creative Studio and switch to Code when you want to build or experiment with programming.',
      ].join('\n\n'),
      ['/code', '/creative-studio'],
    );
  }

  const matches = searchSupportKnowledge(question, 3);
  if (!matches.length) return null;

  return {
    reply: [
      'Here’s what I found in the Idilewa help guide:',
      ...matches.map(({ title, content }) => `${title}\n${content}`),
    ].join('\n\n'),
    sources: matches.map(({ title, label, url }) => ({ title, label, url })),
  };
}

import { faqCategories, faqEntries } from './faqKnowledge.js';

const stopWords = new Set([
  'a', 'about', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'how', 'i',
  'have', 'in', 'is', 'it', 'learn', 'learning', 'me', 'my', 'of', 'on',
  'see', 'the', 'to', 'available', 'what', 'when', 'where', 'which', 'who',
  'with', 'work', 'you', 'your',
]);

const aliases = {
  art: ['creative', 'studio', 'drawing'],
  book: ['booking', 'tutor'],
  booking: ['book', 'tutor'],
  child: ['children', 'family', 'parent'],
  coding: ['code', 'programming'],
  contact: ['support', 'email'],
  cost: ['price', 'pricing', 'plan', 'paid', 'free'],
  culture: ['heritage', 'tradition'],
  drawing: ['creative', 'studio', 'art'],
  fee: ['price', 'pricing', 'plan'],
  forgot: ['password', 'reset'],
  hausa: ['language', 'academy'],
  help: ['support', 'contact'],
  igbo: ['language', 'academy'],
  language: ['languages', 'academy'],
  languages: ['language', 'academy'],
  nigerian: ['language', 'academy'],
  parent: ['parents', 'guardian', 'family'],
  parents: ['parent', 'guardian', 'family'],
  pay: ['paid', 'price', 'billing'],
  payment: ['paid', 'price', 'billing'],
  pidgin: ['language', 'academy'],
  price: ['pricing', 'plan', 'cost'],
  pricing: ['price', 'plan', 'cost'],
  program: ['coding', 'code'],
  programming: ['coding', 'code'],
  story: ['stories', 'storytelling', 'heritage'],
  stories: ['story', 'storytelling', 'heritage'],
  subscription: ['plan', 'pricing', 'paid'],
  support: ['help', 'contact'],
  swahili: ['kiswahili', 'language', 'academy'],
  kiswahili: ['swahili', 'language', 'academy'],
  teacher: ['tutor', 'educator'],
  teachers: ['tutors', 'educators'],
  tutor: ['tutors', 'teacher', 'booking'],
  tutors: ['tutor', 'teachers', 'booking'],
  yoruba: ['language', 'academy'],
};

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getTerms(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((term) => term && !stopWords.has(term))
    .map((term) => {
      if (term.length > 5 && term.endsWith('ies')) return `${term.slice(0, -3)}y`;
      if (term.length > 4 && term.endsWith('s') && !term.endsWith('ss')) {
        return term.slice(0, -1);
      }
      return term;
    });
}

function getSource(question, answer, category) {
  const content = normalize(`${question} ${answer}`);
  if (category === 1) return { url: '/about.html', label: 'About Ìdíléwa' };
  if (category === 2) return { url: '/?view=academy', label: 'Language Academy' };
  if (category === 3 && /creative|draw|stor/.test(content)) {
    return { url: '/creative-studio.html', label: 'Creative Studio' };
  }
  if (category === 3) return { url: '/development-center.html', label: 'Development Center' };
  if (category === 4) return { url: '/?view=heritageLab', label: 'Heritage Library' };
  if (category === 5) return { url: '/tutor.html', label: 'Tutorship' };
  if (category === 6 && /task/.test(content)) {
    return { url: '/family-tasks.html', label: 'Family Tasks' };
  }
  if (category === 6) return { url: '/parents.html', label: 'For Families' };
  if (category === 7 && /plan|price|paid|free|billing/.test(content)) {
    return { url: '/pricing.html', label: 'Pricing' };
  }
  return { url: '/faq.html', label: 'Help Centre' };
}

export function searchFaq(query, limit = 3) {
  const terms = getTerms(query);
  if (!terms.length) return [];

  const normalizedQuery = normalize(query);
  const expandedTerms = new Set(terms);
  for (const term of terms) {
    for (const alias of aliases[term] || []) {
      for (const aliasTerm of getTerms(alias)) expandedTerms.add(aliasTerm);
    }
  }

  const rankedEntries = faqEntries.map(([question, answer, category], index) => {
    const questionText = normalize(question);
    const questionTerms = new Set(getTerms(question));
    const answerTerms = new Set(getTerms(answer));
    const categoryTerms = new Set(getTerms(faqCategories[category]));
    const directQuestionMatches = terms.filter((term) => questionTerms.has(term)).length;
    const directAnswerMatches = terms.filter((term) => answerTerms.has(term)).length;
    const categoryMatches = terms.filter((term) => categoryTerms.has(term)).length;
    const aliasQuestionMatches = [...expandedTerms]
      .filter((term) => !terms.includes(term) && questionTerms.has(term)).length;
    const aliasAnswerMatches = [...expandedTerms]
      .filter((term) => !terms.includes(term) && answerTerms.has(term)).length;
    const aliasCategoryMatches = [...expandedTerms]
      .filter((term) => !terms.includes(term) && categoryTerms.has(term)).length;
    const exactPhraseMatch = normalizedQuery.length > 2 && questionText.includes(normalizedQuery);
    const score = directQuestionMatches * 4
      + directAnswerMatches * 1.4
      + categoryMatches * 0.75
      + aliasQuestionMatches * 1.5
      + aliasAnswerMatches * 0.5
      + aliasCategoryMatches * 1.25
      + (exactPhraseMatch ? 6 : 0);

    return {
      question,
      answer,
      category: faqCategories[category],
      ...getSource(question, answer, category),
      index,
      score,
    };
  });

  const sortedEntries = rankedEntries
    .filter((entry) => entry.score >= 2.5)
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const relevanceThreshold = (sortedEntries[0]?.score || 0) * 0.72;
  return sortedEntries
    .filter((entry) => entry.score >= relevanceThreshold)
    .slice(0, Math.max(0, limit));
}

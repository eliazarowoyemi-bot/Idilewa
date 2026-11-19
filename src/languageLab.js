// Ìdíléwa Language Lab — deterministic (no-API) tutor, phonetics, voice mirror,
// translation, heritage and code-reasoning engine for the homepage sections
// (#aiChat, #learning, #phoneticsLab, #studio, #heritageLab, #codeLab).
//
// Everything here runs from curated data and the browser's own Web Speech and
// Web Audio APIs. No network request is made, so nothing can be fabricated as a
// "live AI answer" and no API key is required.
//
// Pure helpers are exported for `node --test`; browser wiring only runs when a
// document exists.

export const LAB_LANGUAGES = Object.freeze(['Yorùbá', 'Igbo', 'Hausa', 'Kiswahili']);

export const LAB_LEVELS = Object.freeze(['Elementary', 'Intermediate', 'Advanced']);

const SPEECH_LOCALES = Object.freeze({
  'Yorùbá': 'yo-NG',
  'Igbo': 'ig-NG',
  'Hausa': 'ha-NG',
  'Kiswahili': 'sw-KE',
  English: 'en-US',
});

const LANGUAGE_CODES = Object.freeze({ 'Yorùbá': 'yo', Igbo: 'ig', Hausa: 'ha', Kiswahili: 'sw' });

export function speechLocaleFor(language) {
  return SPEECH_LOCALES[normalizeLanguageName(language)] || 'en-US';
}

export function languageCodeFor(language) {
  return LANGUAGE_CODES[normalizeLanguageName(language)] || 'yo';
}

/**
 * Resolve every spelling of a language name used across the site
 * ("Swahili", "Kiswahili", "sw-KE", "yo", …) to one canonical label.
 */
export function normalizeLanguageName(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 'Yorùbá';
  if (raw === 'yo' || raw.startsWith('yor')) return 'Yorùbá';
  if (raw === 'ig' || raw.startsWith('igb')) return 'Igbo';
  if (raw === 'ha' || raw.startsWith('hau')) return 'Hausa';
  if (raw === 'sw' || raw.startsWith('sw') || raw.includes('swahili') || raw.includes('kiswahili')) return 'Kiswahili';
  if (raw.startsWith('en')) return 'English';
  return 'Yorùbá';
}

const SUB_DOTTED = {
  ẹ: 'e', ọ: 'o', ị: 'i', ụ: 'u', ṣ: 's', ṅ: 'n',
  ɓ: 'b', ɗ: 'd', ƙ: 'k', ƴ: 'y',
};

/**
 * Reduce a phrase to comparable ASCII: learners routinely type "e kaaro"
 * for "Ẹ káàárọ̀" and "ngozi" for "Ngọzi". Tone marks, underdots and hooked
 * letters are folded so lookups can succeed without them.
 */
export function stripDiacritics(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ẹọịụṣṅɓɗƙƴẸỌỊỤṢṄƁƊƘƳ]/g, (char) => SUB_DOTTED[char.toLowerCase()] ?? char)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function baseLetter(char) {
  return stripDiacritics(char).slice(0, 1);
}

function isVowel(char) {
  return VOWELS.has(baseLetter(char));
}

// Tone conventions differ per language, so the "unmarked" syllable is labelled
// the way each orthography defines it.
const UNMARKED_TONE = Object.freeze({
  'Yorùbá': 'M',
  Igbo: 'unknown',
  Hausa: 'unknown',
  Kiswahili: 'stress',
});

function syllableTone(syllable, language) {
  const decomposed = String(syllable ?? '').normalize('NFD');
  if (decomposed.includes('\u0301')) return 'H';
  if (decomposed.includes('\u0300')) return 'L';
  return UNMARKED_TONE[language] ?? 'M';
}

/**
 * Split a phrase into syllables and label the tone (or, for Kiswahili, the
 * penultimate stress) of each one. Deterministic and diacritic-driven.
 */
export function parseSyllables(phrase, language = 'Yorùbá') {
  const resolved = normalizeLanguageName(language);
  const words = String(phrase ?? '').trim().split(/\s+/).filter(Boolean);
  const syllables = [];

  words.forEach((word) => {
    const clean = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!clean) return;
    const chars = (clean.normalize('NFD').match(/\P{M}\p{M}*/gu) ?? [])
      .map((character) => character.normalize('NFC'));
    let buffer = '';
    const wordStart = syllables.length;

    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index];
      buffer += char;
      if (!isVowel(char)) continue;

      // Swallow a nasal coda ("an", "ọn", "un") into the same syllable.
      const next = chars[index + 1];
      if (next && (baseLetter(next) === 'n' || baseLetter(next) === 'm')) {
        const after = chars[index + 2];
        if (!after || !isVowel(after)) {
          buffer += next;
          index += 1;
        }
      }

      syllables.push({ text: buffer, tone: syllableTone(buffer, resolved), word: clean });
      buffer = '';
    }

    if (buffer.trim()) {
      if (syllables.length > wordStart) syllables[syllables.length - 1].text += buffer;
      else syllables.push({ text: buffer, tone: syllableTone(buffer, resolved), word: clean });
    }

    if (resolved === 'Kiswahili') {
      const own = syllables.slice(wordStart);
      own.forEach((syllable, offset) => {
        syllable.tone = offset === Math.max(0, own.length - 2) ? 'stress' : 'plain';
      });
    }
  });

  return syllables;
}

export const TONE_LABELS = Object.freeze({
  H: 'high',
  L: 'low',
  M: 'mid',
  unknown: 'not marked',
  stress: 'stress',
  plain: 'unstressed',
});

/** Human-readable tone line, e.g. "Ẹ mid · ká high · à low". */
export function describeTones(phrase, language = 'Yorùbá') {
  const resolved = normalizeLanguageName(language);
  return parseSyllables(phrase, resolved)
    .map((syllable) => `${syllable.text} ${TONE_LABELS[syllable.tone] ?? syllable.tone}`)
    .join(' · ');
}

/** Pitch multipliers used to synthesise the target contour. */
export function toneContour(phrase, language = 'Yorùbá') {
  return parseSyllables(phrase, language).map((syllable) => ({
    text: syllable.text,
    tone: syllable.tone,
    multiplier: { H: 1.24, L: 0.8, M: 1, stress: 1.12, plain: 1 }[syllable.tone] ?? 1,
  }));
}

/* ---------------------------------------------------------------------------
   Phonetics — vowels, consonants and tone/stress contrasts per language.
   Content is curated from standard descriptions of each language; the note
   field tells the learner where a label is a descriptive equivalent.
   ------------------------------------------------------------------------- */

export const PHONETICS = Object.freeze({
  'Yorùbá': {
    intro: 'Yorùbá has seven oral vowels (a, e, ẹ, i, o, ọ, u), nasal vowels written with n (an, ẹn, in, ọn, un), three tones — high (´), mid (unmarked) and low (`) — and the double stops gb and kp (written p).',
    vowels: [
      { sym: 'a', ipa: '/a/', example: 'Ajá', english: 'dog', tone: 'M-H', cue: 'Open the mouth wide, as in “father”.' },
      { sym: 'e', ipa: '/e/', example: 'Ewé', english: 'leaf', tone: 'M-H', cue: 'Tongue forward and high, lips relaxed — between “ay” and “eh”.' },
      { sym: 'ẹ', ipa: '/ɛ/', example: 'Ẹja', english: 'fish', tone: 'M-M', cue: 'Open the mouth more than for e, as in “bed”. The dot below marks a different vowel.' },
      { sym: 'i', ipa: '/i/', example: 'Ilé', english: 'house', tone: 'M-H', cue: 'As in “see”, with the lips spread.' },
      { sym: 'o', ipa: '/o/', example: 'Omi', english: 'water', tone: 'M-M', cue: 'Lips firmly rounded, tongue high.' },
      { sym: 'ọ', ipa: '/ɔ/', example: 'Ọmọ', english: 'child', tone: 'M-M', cue: 'Open rounded vowel as in “law”. Swapping ọ for o changes the word.' },
      { sym: 'u', ipa: '/u/', example: 'Ìlú', english: 'town', tone: 'L-H', cue: 'As in “too”, lips rounded.' },
      { sym: 'an ẹn in ọn un', ipa: '/ã ɛ̃ ĩ ɔ̃ ũ/', example: 'Ìtàn', english: 'story', tone: 'L-H', cue: 'Nasal vowels: let air pass through the nose. Do not add a separate English “n”.' },
    ],
    consonants: [
      { sym: 'gb', ipa: '/ɡ͡b/', example: 'Igbá', english: 'calabash', tone: 'M-H', cue: 'Close the lips and the back of the tongue, then release both at the same moment.' },
      { sym: 'p', ipa: '/k͡p/', example: 'Pupa', english: 'red', tone: 'M-M', cue: 'Yorùbá p is k and p released together — never the English p.' },
      { sym: 'ṣ', ipa: '/ʃ/', example: 'Ẹ ṣé', english: 'thank you', tone: 'M-H', cue: 'As “sh” in “shoe”.' },
      { sym: 'j', ipa: '/d͡ʒ/', example: 'Oúnjẹ', english: 'food', tone: 'H-M', cue: 'As “j” in “jam”.' },
      { sym: 'r', ipa: '/ɾ/', example: 'Rìn', english: 'walk', tone: 'L', cue: 'A single light tap of the tongue behind the top teeth.' },
      { sym: 'w · y', ipa: '/w j/', example: 'Wá · Ìyá', english: 'come · mother', tone: 'H · L-H', cue: 'Smooth glides, close to English w and y.' },
    ],
    tones: [
      { contrast: 'igbá · igba · ìgbà', meanings: 'calabash · two hundred · time', tones: 'M-H · M-M · L-L', cue: 'The consonants and vowels are identical; only pitch separates the three words.' },
      { contrast: 'ọkọ́ · ọkọ · ọkọ̀', meanings: 'hoe · husband · vehicle', tones: 'M-H · M-M · M-L', cue: 'Listen for the final syllable: it rises, stays level, or falls.' },
    ],
    note: 'Yorùbá leaves the mid tone unmarked, so a vowel with no accent is mid — not “silent”. Ẹ (with the dot) is also the polite plural “you”, used when greeting an elder.',
  },
  Igbo: {
    intro: 'Igbo has eight vowels in two vowel-harmony sets (a, i, o, u and e, ị, ọ, ụ), digraph consonants such as gb, kp, gw, kw, nw, ny, ṅ, gh and ch, and high, low and downstep tones.',
    vowels: [
      { sym: 'a', ipa: '/a/', example: 'Aka', english: 'hand', tone: 'H-H', cue: 'Open central vowel (heavy set).' },
      { sym: 'e', ipa: '/e/', example: 'Ego', english: 'money', tone: 'H-H', cue: 'Close-mid front vowel (light set).' },
      { sym: 'i', ipa: '/i/', example: 'Isi', english: 'head', tone: 'H-H', cue: 'Tense high front vowel (heavy set).' },
      { sym: 'ị', ipa: '/ɪ/', example: 'Ịhụ', english: 'to see', tone: 'L-H', cue: 'Lax vowel as in “bit” (light set). The dot below is part of the letter.' },
      { sym: 'o', ipa: '/o/', example: 'Obi', english: 'heart', tone: 'H-H', cue: 'Rounded close-mid back vowel (heavy set).' },
      { sym: 'ọ', ipa: '/ɔ/', example: 'Ọnụ', english: 'mouth', tone: 'H-H', cue: 'Open rounded vowel as in “ought” (light set).' },
      { sym: 'u', ipa: '/u/', example: 'Udo', english: 'peace', tone: 'H-H', cue: 'Tense rounded back vowel (heavy set).' },
      { sym: 'ụ', ipa: '/ʊ/', example: 'Ụlọ', english: 'house', tone: 'L-L', cue: 'Lax rounded vowel as in “book” (light set).' },
    ],
    consonants: [
      { sym: 'gb · kp', ipa: '/ɡ͡b k͡p/', example: 'Ịgba · Mkpi', english: 'drum · he-goat', tone: 'L-H', cue: 'Velar and bilabial closures released together.' },
      { sym: 'gw · kw', ipa: '/ɡʷ kʷ/', example: 'Gwuo · Akwụkwọ', english: 'play · book', tone: 'H-L', cue: 'Round the lips while releasing g or k.' },
      { sym: 'ṅ', ipa: '/ŋ/', example: 'Aṅụ', english: 'bee · sweetness', tone: 'H-H', cue: 'The “ng” of “sing”, with no hard g.' },
      { sym: 'nw · ny', ipa: '/ŋʷ ɲ/', example: 'Nwa · Anya', english: 'child · eye', tone: 'H', cue: 'Labialised and palatal nasals; one sound each.' },
      { sym: 'gh', ipa: '/ɣ/', example: 'Agha', english: 'war', tone: 'H-H', cue: 'A soft voiced sound from the back of the throat, not a hard g.' },
      { sym: 'ch · sh', ipa: '/t͡ʃ ʃ/', example: 'Chị · Shọ', english: 'day · to seek', tone: 'H · H', cue: 'As “ch” in “chair” and “sh” in “shoe”.' },
    ],
    tones: [
      { contrast: 'ákwá · àkwá · ákwà', meanings: 'weeping · egg · cloth', tones: 'H-H · L-H · H-L', cue: 'Same letters, different pitch: high-high, low-high, high-low.' },
    ],
    note: 'Some Igbo teaching materials mark high tone with an acute accent and may leave low tone unmarked. This lab labels explicit marks only; an unmarked spelling alone is not enough to infer every syllable tone. Vowel-harmony descriptions can also vary by dialect.',
  },
  Hausa: {
    intro: 'Hausa has five vowel qualities, each of which can be short or long, glottalised consonants (ɓ, ɗ, ƙ, ƴ, ts) and lexical tone. Length and tone both change meaning, so they are learned with every new word.',
    vowels: [
      { sym: 'a · aa', ipa: '/a aː/', example: 'Gari · gaari', english: 'town · flour', tone: 'short · long', cue: 'Hold the long vowel roughly twice as long; the meaning changes.' },
      { sym: 'e · ee', ipa: '/e eː/', example: 'Gefe', english: 'side', tone: 'H-L', cue: 'A pure mid front vowel, without the English “ey” glide.' },
      { sym: 'i · ii', ipa: '/i iː/', example: 'Kifi', english: 'fish', tone: 'H-L', cue: 'Clear high front vowel; length is meaningful.' },
      { sym: 'o · oo', ipa: '/o oː/', example: 'Zomo', english: 'hare', tone: 'H-L', cue: 'Pure rounded back vowel, with no glide.' },
      { sym: 'u · uu', ipa: '/u uː/', example: 'Uwa', english: 'mother', tone: 'H-H', cue: 'Clear high back vowel; keep long vowels long.' },
    ],
    consonants: [
      { sym: 'ɓ', ipa: '/ɓ/', example: 'Ɓoye', english: 'hide', tone: 'H-L', cue: 'Implosive b: draw air gently inward at the lips.' },
      { sym: 'ɗ', ipa: '/ɗ/', example: 'Ɗaya', english: 'one', tone: 'H-L', cue: 'Implosive d: a light inward pull with the tongue tip on the ridge.' },
      { sym: 'ƙ', ipa: '/kʼ/', example: 'Ƙafa', english: 'foot', tone: 'H-L', cue: 'Ejective k: a sharp pop from the throat, with no breathy air.' },
      { sym: 'ts', ipa: '/t͡sʼ/', example: 'Tsuntsu', english: 'bird', tone: 'H-H', cue: 'An ejective “ts” burst.' },
      { sym: 'ƴ', ipa: '/ʔʲ/', example: 'Ƴaƴa', english: 'children', tone: 'H-L', cue: 'A glottalised y with a brief catch in the throat.' },
      { sym: 'r', ipa: '/r/', example: 'Ruwa', english: 'water', tone: 'H-H', cue: 'A tapped or rolled r, not the English approximant.' },
    ],
    tones: [
      { contrast: 'gari · gaari', meanings: 'town · flour', tones: 'short · long', cue: 'Vowel length carries this contrast.' },
      { contrast: 'baba · babba', meanings: 'father · big', tones: 'short · long consonant', cue: 'A held consonant also changes the word.' },
    ],
    note: 'Hausa is tonal, but tone is usually omitted from everyday spelling. This lab labels explicit tone marks only and does not infer a tone from an unmarked syllable; learn each word with a trusted speaker.',
  },
  Kiswahili: {
    intro: 'Kiswahili is not a tone language. It has five pure vowels and predictable stress on the penultimate (second-to-last) syllable, plus digraphs such as ng’, ny, dh, th, gh, ch and sh.',
    vowels: [
      { sym: 'a', ipa: '/ɑ/', example: 'Mama', english: 'mother', tone: 'MA-ma', cue: 'Open “ah”, stressed on the penultimate syllable.' },
      { sym: 'e', ipa: '/ɛ/', example: 'Ndege', english: 'bird', tone: 'nde-GE', cue: 'Clean “eh” as in “bed”, never “ay”.' },
      { sym: 'i', ipa: '/i/', example: 'Maji', english: 'water', tone: 'MA-ji', cue: 'Clean “ee” as in “see”.' },
      { sym: 'o', ipa: '/ɔ/', example: 'Soko', english: 'market', tone: 'SO-ko', cue: 'Open rounded “oh”, without a glide.' },
      { sym: 'u', ipa: '/u/', example: 'Nyumba', english: 'house', tone: 'NYU-mba', cue: 'Pure “oo”; the nasal belongs to the same syllable.' },
    ],
    consonants: [
      { sym: 'ng’', ipa: '/ŋ/', example: 'Ng’ombe', english: 'cow', tone: 'NG’O-mbe', cue: 'One “ng” sound as in “singer”, with no hard g.' },
      { sym: 'ny', ipa: '/ɲ/', example: 'Nyumba', english: 'house', tone: 'NYU-mba', cue: 'As “ny” in “canyon”.' },
      { sym: 'dh', ipa: '/ð/', example: 'Dhahabu', english: 'gold', tone: 'dha-ha-BU', cue: 'As “th” in “this”, voiced.' },
      { sym: 'th', ipa: '/θ/', example: 'Thelathini', english: 'thirty', tone: 'the-la-THI-ni', cue: 'As “th” in “thin”, voiceless.' },
      { sym: 'gh', ipa: '/ɣ/', example: 'Ghali', english: 'expensive', tone: 'GHA-li', cue: 'A soft voiced sound from the throat.' },
      { sym: 'ch · sh', ipa: '/t͡ʃ ʃ/', example: 'Chakula · Shule', english: 'food · school', tone: 'cha-KU-la · SHU-le', cue: 'As “ch” in “chair” and “sh” in “shoe”.' },
    ],
    tones: [
      { contrast: 'asante', meanings: 'thank you', tones: 'a-SAN-te', cue: 'Stress the penultimate syllable; the others stay light.' },
      { contrast: 'habari · karibu · shikamoo', meanings: 'how are you · welcome · respectful greeting', tones: 'ha-BA-ri · ka-RI-bu · shi-ka-MO-o', cue: 'Same rule every time: the second-to-last syllable carries the stress.' },
    ],
    note: 'Kiswahili greetings encode respect: “shikamoo” is answered with “marahaba”, and “habari” is answered with “nzuri” or “salama”. Stress is predictable, so no tone marks are needed.',
  },
});

export function getPhonetics(language) {
  return PHONETICS[normalizeLanguageName(language)] || PHONETICS['Yorùbá'];
}

/* ---------------------------------------------------------------------------
   Heritage — proverb-first stories with literal and idiomatic meaning,
   etiquette, key vocabulary and a three-option comprehension check.
   ------------------------------------------------------------------------- */

export const HERITAGE_STORIES = Object.freeze({
  'Yorùbá': [
    {
      title: 'Àgbájọ ọwọ́ — working together',
      native: 'Àgbájọ ọwọ́ la fi ń sọ̀yà.',
      literal: 'It is with joined hands that a bundle is beaten.',
      idiomatic: 'People finish together what one person cannot finish alone.',
      english: 'A family sweeps the compound before a festival. One child alone fills a single basket; the whole household clears the yard before the drummers arrive.',
      moral: 'Ọmọlúàbí — good character grows where everyone contributes. Sharing work is a form of respect for the household.',
      vocabulary: [
        { native: 'àgbájọ', english: 'group · joined together' },
        { native: 'ọwọ́', english: 'hand' },
        { native: 'ilé', english: 'house · household' },
      ],
      question: 'What does “Àgbájọ ọwọ́ la fi ń sọ̀yà” ask a household to do?',
      options: ['Work and decide together', 'Finish quickly and leave', 'Keep the work for one person'],
      correct: 0,
      explanation: 'The proverb joins àgbájọ (group) with ọwọ́ (hands): the bundle is beaten because many hands hold it. Cooperation is the value being taught.',
    },
    {
      title: 'Ọmọ tí a kò kọ́ — the child we do not train',
      native: 'Ọmọ tí a kò kọ́ ni yóò gbé ilé tí a kọ́ tà.',
      literal: 'The child we did not train is the one who will sell the house we built.',
      idiomatic: 'A child left without guidance can undo the family’s work; upbringing protects what the family builds.',
      english: 'An elder explains why every adult in the compound teaches the youngest children: training is shared, never left to one tired person.',
      moral: 'Ìkọ́ni — training and correction — is a duty of parents, elders and older siblings, and it is done with patience rather than anger.',
      vocabulary: [
        { native: 'ọmọ', english: 'child' },
        { native: 'kọ́', english: 'to train · to teach' },
        { native: 'ilé', english: 'house' },
      ],
      question: 'What is the proverb warning a family about?',
      options: ['Building too many houses', 'Neglecting a child’s training', 'Selling land too early'],
      correct: 1,
      explanation: 'The contrast is between building a house and failing to build the child. Yorùbá teaching stresses ìkọ́ni (training) as the real inheritance.',
    },
  ],
  Igbo: [
    {
      title: 'Ọjị — the kola nut of welcome',
      native: 'Onye wetara ọjị wetara ndụ.',
      literal: 'Whoever brings kola nut brings life.',
      idiomatic: 'The saying links shared kola with life and welcome.',
      english: 'At one gathering, an elder shares kola with a visitor before conversation begins.',
      moral: 'In some Igbo communities, sharing kola is a gesture of welcome. The order and meaning of the ritual vary; ask a local host how to take part respectfully.',
      vocabulary: [
        { native: 'ọjị', english: 'kola nut' },
        { native: 'ndụ', english: 'life' },
        { native: 'nwanne', english: 'sibling · kin' },
      ],
      question: 'What does ọjị (kola nut) stand for when it is shared?',
      options: ['Life, peace and welcome', 'A quiet house', 'A competition between guests'],
      correct: 0,
      explanation: '“Onye wetara ọjị wetara ndụ” links kola with ndụ (life) and welcome. The details of sharing vary by community.',
    },
    {
      title: 'Onye aghala nwanne ya — leave no sibling behind',
      native: 'Onye aghala nwanne ya.',
      literal: 'Let no one abandon their sibling.',
      idiomatic: 'No one should be left behind when the community moves forward.',
      english: 'When a village builds a bridge, the strongest workers carry materials for the household whose father is ill, so the crossing opens for everyone on the same day.',
      moral: 'Solidarity (ịdị n’otu) is practical: the group is only as strong as the member it refuses to leave behind.',
      vocabulary: [
        { native: 'onye', english: 'person · someone' },
        { native: 'aghala', english: 'should not abandon' },
        { native: 'nwanne', english: 'sibling' },
      ],
      question: 'How is “Onye aghala nwanne ya” practised in the story?',
      options: ['By finishing the bridge as a group, including the family in need', 'By sending one family away', 'By waiting for another year'],
      correct: 0,
      explanation: 'The saying is not only sympathy; it is a rule for shared work. The bridge opens for everyone because nobody was left out of the labour.',
    },
  ],
  Hausa: [
    {
      title: 'Haƙuri — patience in greeting',
      native: 'Haƙuri maganin duniya.',
      literal: 'Patience is the medicine of the world.',
      idiomatic: 'Patience settles what haste cannot; it heals quarrels and keeps relationships whole.',
      english: 'A younger neighbour greets an elder with “Ina kwana?” and waits. The elder answers slowly, asks after the family, and only then discusses the matter at hand.',
      moral: 'Gaisuwa (greeting) is not a formality. Asking after someone’s health and household before business is how respect is shown.',
      vocabulary: [
        { native: 'haƙuri', english: 'patience' },
        { native: 'magani', english: 'medicine · remedy' },
        { native: 'ina kwana?', english: 'good morning (how did you sleep?)' },
      ],
      question: 'What does the proverb call patience?',
      options: ['A medicine for the world', 'A long journey', 'A kind of greeting'],
      correct: 0,
      explanation: 'Magani means medicine, so the proverb presents patience as a remedy rather than a delay. The greeting scene shows the same value in everyday life.',
    },
    {
      title: 'Komai nisan jifa — the stone returns to the ground',
      native: 'Komai nisan jifa, ƙasa zai dawo.',
      literal: 'However far the throw goes, it returns to the ground.',
      idiomatic: 'Wherever a person travels, they remain tied to their home and origins.',
      english: 'A young man leaves the village for work in the city. Years later he returns, bringing what he learned, and the compound receives him with food and questions.',
      moral: 'Belonging is not weakened by distance. Returning with respect — and sharing what was learned — honours the people who raised you.',
      vocabulary: [
        { native: 'jifa', english: 'a throw' },
        { native: 'ƙasa', english: 'ground · land · country' },
        { native: 'komai', english: 'however much · no matter' },
      ],
      question: 'What does the thrown stone teach in this proverb?',
      options: ['Distance does not break a person’s link to home', 'Throwing stones is a game for children', 'Travel should be avoided'],
      correct: 0,
      explanation: 'The stone always meets ƙasa (the ground). In the same way, the proverb says, a person’s origin still matters however far they travel.',
    },
  ],
  Kiswahili: [
    {
      title: 'Haraka haraka — the cost of rushing',
      native: 'Haraka haraka haina baraka.',
      literal: 'Hurry, hurry has no blessing.',
      idiomatic: 'Rushing a task spoils it; patient work is the work that lasts.',
      english: 'A learner wants to finish a drumming lesson first. The teacher replies “pole pole” (slowly, gently) and repeats the rhythm until the learner’s hands keep time.',
      moral: 'Pole pole (gently, steadily) is a value, not a delay. It also carries courtesy: “pole” is used to sympathise when someone is tired or unwell.',
      vocabulary: [
        { native: 'haraka', english: 'hurry' },
        { native: 'baraka', english: 'blessing' },
        { native: 'pole', english: 'gently · sorry · take it easy' },
      ],
      question: 'What is the proverb warning against?',
      options: ['Rushing and spoiling the work', 'Greeting too slowly', 'Learning a drum rhythm'],
      correct: 0,
      explanation: 'Baraka (blessing) is withheld from haraka haraka. The lesson is that steady practice, not speed, produces the good result.',
    },
    {
      title: 'Umoja ni nguvu — unity is strength',
      native: 'Umoja ni nguvu, utengano ni udhaifu.',
      literal: 'Unity is strength, separation is weakness.',
      idiomatic: 'A community that works as one carries what no individual could carry alone.',
      english: 'Neighbours repair a water point together: one family provides tools, another food, the young ones carry stones, and the tap runs again before the week ends.',
      moral: 'Harambee — pulling together — is a modern expression of the same value: shared effort, shared benefit, and no one left outside the work.',
      vocabulary: [
        { native: 'umoja', english: 'unity' },
        { native: 'nguvu', english: 'strength · power' },
        { native: 'utengano', english: 'separation · division' },
      ],
      question: 'Which pair does the proverb contrast?',
      options: ['Unity and division', 'Water and food', 'Youth and age'],
      correct: 0,
      explanation: 'Umoja (unity) is set against utengano (division). The water point is repaired because the neighbours choose the first over the second.',
    },
  ],
});

export function getHeritageStories(language) {
  return HERITAGE_STORIES[normalizeLanguageName(language)] || HERITAGE_STORIES['Yorùbá'];
}

/* ---------------------------------------------------------------------------
   Translation — curated phrases, curated sentence patterns, and honest
   word-by-word glossing. Diacritics are optional on input.
   ------------------------------------------------------------------------- */

export const PHRASES = Object.freeze({
  'Yorùbá': [
    { en: 'Good morning', native: 'Ẹ káàárọ̀' },
    { en: 'Good afternoon', native: 'Ẹ káàsán' },
    { en: 'My name is Ade', native: 'Orúkọ mi ni Adé' },
    { en: 'Mother', native: 'Ìyá' },
    { en: 'One', native: 'Ọ̀kan' },
    { en: 'Red', native: 'Pupa' },
    { en: 'Water', native: 'Omi' },
    { en: 'House', native: 'Ilé' },
    { en: 'Dog', native: 'Ajá' },
    { en: 'Eye', native: 'Ojú' },
    { en: 'Walk', native: 'Rìn' },
    { en: 'Today', native: 'Òní' },
    { en: 'Market', native: 'Ọjà' },
    { en: 'How are you?', native: 'Báwo ni?' },
    { en: 'Story', native: 'Ìtàn' },
    { en: 'I want to learn Yorùbá', native: 'Mo fẹ́ kọ́ èdè Yorùbá' },
    { en: 'Thank you', native: 'Ẹ ṣé' },
    { en: 'Goodbye', native: 'Ó dàbọ̀' },
    { en: 'Please', native: 'Ẹ jọ̀ọ́' },
    { en: 'Welcome back', native: 'Ẹ kú àbọ̀' },
  ],
  Igbo: [
    { en: 'Good morning', native: 'Ụtụtụ ọma' },
    { en: 'Good afternoon', native: 'Ehihie ọma' },
    { en: 'My name is Ada', native: 'Aha m bụ Ada' },
    { en: 'Mother', native: 'Nne' },
    { en: 'One', native: 'Otu' },
    { en: 'Red', native: 'Uhie' },
    { en: 'Water', native: 'Mmiri' },
    { en: 'House', native: 'Ụlọ' },
    { en: 'Dog', native: 'Nkịta' },
    { en: 'Eye', native: 'Anya' },
    { en: 'Journey', native: 'Ije' },
    { en: 'Today', native: 'Taa' },
    { en: 'Market', native: 'Ahịa' },
    { en: 'How are you?', native: 'Kedu ka ị mere?' },
    { en: 'Story', native: 'Akụkọ' },
    { en: 'I want to learn Igbo', native: 'Achọrọ m ịmụ Igbo' },
    { en: 'Thank you', native: 'Daalụ' },
    { en: 'Goodbye', native: 'Ka ọ dị' },
    { en: 'Please', native: 'Biko' },
    { en: 'Welcome', native: 'Nnọọ' },
  ],
  Hausa: [
    { en: 'Good morning', native: 'Ina kwana' },
    { en: 'Good afternoon', native: 'Barka da rana' },
    { en: 'My name is Amina', native: 'Sunana Amina' },
    { en: 'Mother', native: 'Uwa' },
    { en: 'One', native: 'Ɗaya' },
    { en: 'Red', native: 'Ja' },
    { en: 'Water', native: 'Ruwa' },
    { en: 'House', native: 'Gida' },
    { en: 'Dog', native: 'Kare' },
    { en: 'Eye', native: 'Ido' },
    { en: 'Journey', native: 'Tafiya' },
    { en: 'Today', native: 'Yau' },
    { en: 'Market', native: 'Kasuwa' },
    { en: 'How are you?', native: 'Yaya kake?' },
    { en: 'Story', native: 'Labari' },
    { en: 'I want to learn Hausa', native: 'Ina son koyon Hausa' },
    { en: 'Thank you', native: 'Na gode' },
    { en: 'See you later', native: 'Sai an jima' },
    { en: 'Please', native: 'Don Allah' },
    { en: 'Welcome', native: 'Barka da zuwa' },
  ],
  Kiswahili: [
    { en: 'Good morning', native: 'Habari za asubuhi' },
    { en: 'Good afternoon', native: 'Habari za mchana' },
    { en: 'My name is Asha', native: 'Jina langu ni Asha' },
    { en: 'Mother', native: 'Mama' },
    { en: 'One', native: 'Moja' },
    { en: 'Red', native: 'Nyekundu' },
    { en: 'Water', native: 'Maji' },
    { en: 'House', native: 'Nyumba' },
    { en: 'Dog', native: 'Mbwa' },
    { en: 'Eye', native: 'Jicho' },
    { en: 'To walk', native: 'Kutembea' },
    { en: 'Today', native: 'Leo' },
    { en: 'Market', native: 'Soko' },
    { en: 'How are you?', native: 'Habari yako?' },
    { en: 'Story', native: 'Hadithi' },
    { en: 'I want to learn Kiswahili', native: 'Ninataka kujifunza Kiswahili' },
    { en: 'Thank you', native: 'Asante' },
    { en: 'Goodbye', native: 'Kwaheri' },
    { en: 'Please', native: 'Tafadhali' },
    { en: 'Welcome', native: 'Karibu' },
  ],
});

const GLOSSARY = Object.freeze({
  water: { yo: 'Omi', ig: 'Mmiri', ha: 'Ruwa', sw: 'Maji' },
  house: { yo: 'Ilé', ig: 'Ụlọ', ha: 'Gida', sw: 'Nyumba' },
  home: { yo: 'Ilé', ig: 'Ụlọ', ha: 'Gida', sw: 'Nyumbani' },
  mother: { yo: 'Ìyá', ig: 'Nne', ha: 'Uwa', sw: 'Mama' },
  father: { yo: 'Bàbá', ig: 'Nna', ha: 'Uba', sw: 'Baba' },
  child: { yo: 'Ọmọ', ig: 'Nwa', ha: 'Yaro', sw: 'Mtoto' },
  food: { yo: 'Oúnjẹ', ig: 'Nri', ha: 'Abinci', sw: 'Chakula' },
  school: { yo: 'Ilé ìwé', ig: 'Ụlọ akwụkwọ', ha: 'Makaranta', sw: 'Shule' },
  teacher: { yo: 'Olùkọ́', ig: 'Onye nkuzi', ha: 'Malami', sw: 'Mwalimu' },
  dog: { yo: 'Ajá', ig: 'Nkịta', ha: 'Kare', sw: 'Mbwa' },
  book: { yo: 'Ìwé', ig: 'Akwụkwọ', ha: 'Littafi', sw: 'Kitabu' },
  friend: { yo: 'Ọ̀rẹ́', ig: 'Enyi', ha: 'Aboki', sw: 'Rafiki' },
  market: { yo: 'Ọjà', ig: 'Ahịa', ha: 'Kasuwa', sw: 'Soko' },
  name: { yo: 'Orúkọ', ig: 'Aha', ha: 'Suna', sw: 'Jina' },
  peace: { yo: 'Àlàáfíà', ig: 'Udo', ha: 'Lafiya', sw: 'Amani' },
  love: { yo: 'Ìfẹ́', ig: 'Ịhụnanya', ha: 'Ƙauna', sw: 'Upendo' },
  money: { yo: 'Owó', ig: 'Ego', ha: 'Kuɗi', sw: 'Pesa' },
  road: { yo: 'Ọ̀nà', ig: 'Ụzọ', ha: 'Hanya', sw: 'Barabara' },
  eye: { yo: 'Ojú', ig: 'Anya', ha: 'Ido', sw: 'Jicho' },
  hand: { yo: 'Ọwọ́', ig: 'Aka', ha: 'Hannu', sw: 'Mkono' },
  bird: { yo: 'Ẹyẹ', ig: 'Nnụnụ', ha: 'Tsuntsu', sw: 'Ndege' },
  fish: { yo: 'Ẹja', ig: 'Azụ', ha: 'Kifi', sw: 'Samaki' },
  tree: { yo: 'Igi', ig: 'Osisi', ha: 'Itace', sw: 'Mti' },
  sun: { yo: 'Òòrùn', ig: 'Anyanwụ', ha: 'Rana', sw: 'Jua' },
  yoruba: { yo: 'Yorùbá', ig: 'Yoruba', ha: 'Yarbanci', sw: 'Kiyoruba' },
  igbo: { yo: 'Igbo', ig: 'Igbo', ha: 'Ibo', sw: 'Kiigbo' },
  hausa: { yo: 'Hausa', ig: 'Hausa', ha: 'Hausa', sw: 'Kihausa' },
  swahili: { yo: 'Swahili', ig: 'Swahili', ha: 'Swahili', sw: 'Kiswahili' },
  kiswahili: { yo: 'Swahili', ig: 'Swahili', ha: 'Swahili', sw: 'Kiswahili' },
});

const PATTERN_TEMPLATES = Object.freeze({
  'Yorùbá': {
    name: (slot) => `Orúkọ mi ni ${slot}`,
    want: (slot) => `Mo fẹ́ ${slot}`,
    wantLearn: (slot) => `Mo fẹ́ kọ́ èdè ${slot}`,
    where: (slot) => `Níbo ni ${slot} wà?`,
    howMany: (slot) => `${slot} mélòó?`,
    like: (slot) => `Mo fẹ́ràn ${slot}`,
    greet: (slot) => `Báwo ni ${slot}?`,
  },
  Igbo: {
    name: (slot) => `Aha m bụ ${slot}`,
    want: (slot) => `Achọrọ m ${slot}`,
    wantLearn: (slot) => `Achọrọ m ịmụ ${slot}`,
    where: (slot) => `Kedu ebe ${slot} dị?`,
    howMany: (slot) => `${slot} ole?`,
    like: (slot) => `Ahụrụ m ${slot} n’anya`,
    greet: (slot) => `Ndewo ${slot}`,
  },
  Hausa: {
    name: (slot) => `Sunana ${slot}`,
    want: (slot) => `Ina son ${slot}`,
    wantLearn: (slot) => `Ina son koyon ${slot}`,
    where: (slot) => `Ina ${slot}?`,
    howMany: (slot) => `${slot} nawa?`,
    like: (slot) => `Ina son ${slot}`,
    greet: (slot) => `Sannu ${slot}`,
  },
  Kiswahili: {
    name: (slot) => `Jina langu ni ${slot}`,
    want: (slot) => `Ninataka ${slot}`,
    wantLearn: (slot) => `Ninataka kujifunza ${slot}`,
    where: (_slot, key) => ({
      water: 'Maji yako wapi?',
      house: 'Nyumba iko wapi?',
    })[key] ?? '',
    howMany: (slot) => `${slot} ngapi?`,
    like: (slot) => `Ninapenda ${slot}`,
    greet: (slot) => `Habari ${slot}`,
  },
});

const indexCache = new Map();
const nativeGlossaryCache = new Map();

function loosen(value) {
  return stripDiacritics(value).replace(/(.)\1+/g, '$1');
}

function phraseIndex(language) {
  if (!indexCache.has(language)) {
    const english = new Map();
    const native = new Map();
    const englishLoose = new Map();
    const nativeLoose = new Map();
    for (const phrase of PHRASES[language] ?? []) {
      english.set(stripDiacritics(phrase.en), phrase);
      native.set(stripDiacritics(phrase.native), phrase);
      englishLoose.set(loosen(phrase.en), phrase);
      nativeLoose.set(loosen(phrase.native), phrase);
    }
    indexCache.set(language, { english, native, englishLoose, nativeLoose });
  }
  return indexCache.get(language);
}

function nativeGlossary(language) {
  if (!nativeGlossaryCache.has(language)) {
    const code = languageCodeFor(language);
    const map = new Map();
    Object.entries(GLOSSARY).forEach(([english, entry]) => {
      const value = entry[code];
      if (value) map.set(stripDiacritics(value), english);
    });
    nativeGlossaryCache.set(language, map);
  }
  return nativeGlossaryCache.get(language);
}

function tidySlot(value) {
  return String(value ?? '').trim().replace(/[.?!,;:]+$/, '').trim();
}

function matchPattern(input) {
  const text = String(input ?? '').trim();
  const rules = [
    { key: 'name', pattern: /^(?:my name is|i am called|i'm called)\s+(.+)$/i, properNoun: true },
    { key: 'wantLearn', pattern: /^i want to learn\s+(.+)$/i },
    { key: 'want', pattern: /^i want\s+(.+)$/i },
    { key: 'where', pattern: /^where is\s+(.+)$/i },
    { key: 'howMany', pattern: /^how many\s+(.+)$/i },
    { key: 'like', pattern: /^i like\s+(.+)$/i },
    { key: 'greet', pattern: /^(?:hello|hi)\s+(.+)$/i },
  ];
  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (match) return { key: rule.key, slot: tidySlot(match[1]), properNoun: Boolean(rule.properNoun) };
  }
  return null;
}

function glossTokens(text, language, direction) {
  const code = languageCodeFor(language);
  const tokens = stripDiacritics(text).split(' ').filter(Boolean);
  const nativeMap = nativeGlossary(language);
  return tokens.map((token) => {
    if (direction === 'en-native') {
      const entry = GLOSSARY[token] ?? GLOSSARY[loosen(token)];
      const target = entry?.[code] ?? '';
      return { source: token, target, known: Boolean(target) };
    }
    const english = nativeMap.get(token) ?? nativeMap.get(loosen(token));
    return { source: token, target: english ?? '', known: Boolean(english) };
  });
}

const STATUS_LABELS = Object.freeze({
  curated: 'Curated',
  composed: 'Composed from a pattern',
  gloss: 'Word-by-word gloss',
  missing: 'Not in the lesson data yet',
});

function hasDiacritics(value) {
  const raw = String(value ?? '');
  return /[\u0300-\u036f]/.test(raw.normalize('NFD')) || /[ẹọịụṣṅɓɗƙƴ]/i.test(raw);
}

export function translatePhrase(input, { language = 'Yorùbá', direction = 'auto' } = {}) {
  const resolved = normalizeLanguageName(language);
  const code = languageCodeFor(resolved);
  const text = String(input ?? '').trim();
  const base = {
    input: text,
    language: resolved,
    direction: 'en-native',
    output: '',
    status: 'missing',
    statusLabel: STATUS_LABELS.missing,
    confidence: 'low',
    tones: '',
    gloss: [],
    note: '',
  };
  if (!text) return { ...base, note: 'Type a word or a short phrase first.' };

  const index = phraseIndex(resolved);
  const key = stripDiacritics(text);
  const looseKey = loosen(text);
  const tokens = key.split(' ').filter(Boolean);
  let resolvedDirection = direction;

  if (resolvedDirection === 'auto') {
    const englishHit = index.english.has(key) || index.englishLoose.has(looseKey)
      || tokens.some((token) => GLOSSARY[token]);
    const nativeHit = index.native.has(key) || index.nativeLoose.has(looseKey)
      || tokens.some((token) => nativeGlossary(resolved).has(token));
    if (englishHit && !nativeHit) resolvedDirection = 'en-native';
    else if (nativeHit && !englishHit) resolvedDirection = 'native-en';
    else resolvedDirection = matchPattern(text) ? 'en-native' : 'native-en';
  }

  const englishEntry = index.english.get(key) ?? index.englishLoose.get(looseKey);
  const nativeEntry = index.native.get(key) ?? index.nativeLoose.get(looseKey);
  const typedWithoutMarks = !hasDiacritics(text);
  const canonicalNeedsMarks = hasDiacritics(nativeEntry?.native || '');

  if (nativeEntry && !englishEntry) {
    if (typedWithoutMarks && canonicalNeedsMarks && direction === 'auto') {
      return {
        ...base,
        direction: 'native-en',
        output: nativeEntry.native,
        native: nativeEntry.native,
        english: nativeEntry.en,
        status: 'curated',
        statusLabel: 'Curated spelling',
        confidence: 'high',
        tones: describeTones(nativeEntry.native, resolved),
        note: `You typed without diacritics; the standard spelling is “${nativeEntry.native}” (${nativeEntry.en}). Diacritics are part of the word, so keep them in written work.`,
      };
    }
    if (resolvedDirection === 'native-en' || resolvedDirection === 'auto') {
      return {
        ...base,
        direction: 'native-en',
        output: nativeEntry.en,
        native: nativeEntry.native,
        status: 'curated',
        statusLabel: STATUS_LABELS.curated,
        confidence: 'high',
        tones: describeTones(nativeEntry.native, resolved),
        note: typedWithoutMarks && canonicalNeedsMarks
          ? `Curated lesson phrase. Standard spelling: “${nativeEntry.native}”.`
          : 'Curated lesson phrase, matched with or without diacritics.',
      };
    }
  }

  if (englishEntry && !nativeEntry) {
    return {
      ...base,
      direction: 'en-native',
      output: englishEntry.native,
      english: englishEntry.en,
      status: 'curated',
      statusLabel: STATUS_LABELS.curated,
      confidence: 'high',
      tones: describeTones(englishEntry.native, resolved),
      note: 'Curated lesson phrase. Tone marks are part of the spelling, so keep them in written work.',
    };
  }

  if (englishEntry && nativeEntry) {
    if (resolvedDirection === 'native-en') {
      return {
        ...base,
        direction: 'native-en',
        output: nativeEntry.en,
        native: nativeEntry.native,
        status: 'curated',
        statusLabel: STATUS_LABELS.curated,
        confidence: 'high',
        tones: describeTones(nativeEntry.native, resolved),
        note: 'Curated lesson phrase, matched with or without diacritics.',
      };
    }
    return {
      ...base,
      direction: 'en-native',
      output: englishEntry.native,
      english: englishEntry.en,
      status: 'curated',
      statusLabel: STATUS_LABELS.curated,
      confidence: 'high',
      tones: describeTones(englishEntry.native, resolved),
      note: 'Curated lesson phrase. Tone marks are part of the spelling, so keep them in written work.',
    };
  }

  const pattern = matchPattern(text);
  if (resolvedDirection === 'en-native' && pattern) {
    const template = PATTERN_TEMPLATES[resolved]?.[pattern.key];
    const slotKey = stripDiacritics(pattern.slot);
    const glossaryEntry = GLOSSARY[slotKey];
    const slot = pattern.properNoun ? pattern.slot : glossaryEntry?.[code];
    if (template && slot) {
      const output = template(slot, slotKey);
      if (!output) {
        return {
          ...base,
          direction: 'en-native',
          note: `The noun-class agreement for “${pattern.slot}” has not been reviewed in this lesson data, so no sentence was composed.`,
        };
      }
      return {
        ...base,
        direction: 'en-native',
        output,
        status: 'composed',
        statusLabel: STATUS_LABELS.composed,
        confidence: 'medium',
        tones: describeTones(output, resolved),
        gloss: [{ source: pattern.slot, target: slot, known: true }],
        note: 'Built from one of the lesson sentence patterns. Longer sentences need a fluent speaker’s check.',
      };
    }
    return {
      ...base,
      direction: 'en-native',
      output: '',
      status: 'missing',
      statusLabel: STATUS_LABELS.missing,
      note: `The pattern is taught, but “${pattern.slot}” is not in the reviewed lesson glossary yet. Try water, house, mother, father, child, food, school, book, friend, market, peace, love, money, road, eye, hand, bird, fish, tree or sun.`,
    };
  }

  const gloss = glossTokens(text, resolved, resolvedDirection);
  const known = gloss.filter((item) => item.known);
  if (known.length) {
    const output = gloss.map((item) => (item.known ? item.target : '…')).join(' ');
    return {
      ...base,
      direction: resolvedDirection,
      output,
      status: 'gloss',
      statusLabel: STATUS_LABELS.gloss,
      confidence: 'low',
      tones: resolvedDirection === 'native-en' ? describeTones(text, resolved) : '',
      gloss,
      note: `${known.length} of ${gloss.length} word${gloss.length === 1 ? '' : 's'} found in the lesson glossary. Word order and grammar are not adjusted — this is a gloss, not a finished sentence.`,
    };
  }

  return {
    ...base,
    direction: resolvedDirection,
    note: `No curated entry for “${text}” in ${resolved} yet. Nothing is guessed here: choose a lesson phrase or ask a fluent speaker to confirm a new word before using it in written work.`,
  };
}

/* ---------------------------------------------------------------------------
   Code reasoning — the Code Playground explains the same construct in English
   and in the learner's language. Terms with no settled technical equivalent are
   labelled as descriptive.
   ------------------------------------------------------------------------- */

export const CODE_TERMS = Object.freeze({
  yo: {
    name: 'Yorùbá',
    words: [
      { en: 'Code', native: 'Kóòdù' },
      { en: 'Variable', native: 'Àpótí ìpamọ́', descriptive: true },
      { en: 'Condition', native: 'Ìpò tí a ṣàyẹ̀wò', descriptive: true },
      { en: 'Loop', native: 'Àṣẹ àtúnṣe', descriptive: true },
      { en: 'Output', native: 'Ìfiránṣẹ́ jáde', descriptive: true },
      { en: 'Event', native: 'Ìṣẹ̀lẹ̀' },
      { en: 'Speed', native: 'Ìyára' },
      { en: 'Collision', native: 'Ìfarakanra', descriptive: true },
      { en: 'Score', native: 'Àmì' },
      { en: 'Error', native: 'Àṣìṣe' },
    ],
    reason: {
      output: (value) => `Kọ̀ǹpútà gbọ́ àṣẹ rẹ, ó sì fi “${value}” hàn lójú ìbòjú.`,
      variable: 'Àpótí ìpamọ́ ni orúkọ kan fún nọ́mbà tàbí ọ̀rọ̀. Àmì (score) àti Ìyára (speed) jẹ́ àpótí ìpamọ́.',
      condition: 'Bí ohun kan bá ṣẹlẹ̀, kọ̀ǹpútà yóò yan ìgbésẹ̀ mìíràn. Bí bọ́ọ̀lù bá kan ọ̀pá, ó yípa.',
      loop: 'Àṣẹ àtúnṣe ń sọ pé kí iṣẹ́ kan máa ṣẹlẹ̀ lẹ́ẹ̀kọ̀ọ̀kan títí ète yóò fi pé.',
      event: 'Ìṣẹ̀lẹ̀ ni ohun tí ó ṣẹlẹ̀, bí títẹ̀ bọ́tìnì tàbí gbígbọ́ orin.',
      collision: 'Ìfarakanra ni nígbà tí ohun méjì bá kan ara wọn, bí bọ́ọ̀lù àti ọ̀pá.',
      speed: 'Ìyára sọ bí ohun ṣe ń lọ kánkán; nọ́mbà tó pọ̀ túmọ̀ sí ìrìn tó yára.',
      error: 'Àṣìṣe ni àṣẹ tí kọ̀ǹpútà kò lóye. Ka ìfiránṣẹ́ àṣìṣe, kí o sì tún kóòdù ṣe.',
    },
  },
  ig: {
    name: 'Igbo',
    words: [
      { en: 'Code', native: 'Koodu' },
      { en: 'Variable', native: 'Igbe nchekwa', descriptive: true },
      { en: 'Condition', native: 'Ọnọdụ koodu', descriptive: true },
      { en: 'Loop', native: 'Ntụgharị mmegharị', descriptive: true },
      { en: 'Output', native: 'Mpụta' },
      { en: 'Event', native: 'Omume' },
      { en: 'Speed', native: 'Ọsọ' },
      { en: 'Collision', native: 'Nkụkọ ihe abụọ', descriptive: true },
      { en: 'Score', native: 'Akara' },
      { en: 'Error', native: 'Njehie' },
    ],
    reason: {
      output: (value) => `Kọmputa gụrụ ntụziaka gị wee gosipụta “${value}” na ihuenyo.`,
      variable: 'Igbe nchekwa bụ aha maka nọmba ma ọ bụ okwu. Akara (score) na Ọsọ (speed) bụ igbe nchekwa.',
      condition: 'Ọ bụrụ na ihe emee, kọmputa na-ahọrọ usoro ọzọ. Ọ bụrụ na bọọlụ kụrụ osisi, ọ na-atụgharị.',
      loop: 'Ntụziaka mmegharị na-agwa kọmputa ka ọ megharịa otu ihe ruo mgbe ebumnuche ruru.',
      event: 'Omume bụ ihe na-eme: ịpị bọtịnụ ma ọ bụ ịnụ ụda.',
      collision: 'Nkụkọ bụ mgbe ihe abụọ metụrụ onwe ha, dịka bọọlụ na osisi.',
      speed: 'Ọsọ na-egosi otú ihe si aga ngwa ngwa; nọmba ka ukwuu pụtara njem ka ukwuu.',
      error: 'Njehie bụ ntụziaka kọmputa na-aghọtaghị. Gụọ ozi njehie wee dezie koodu.',
    },
  },
  ha: {
    name: 'Hausa',
    words: [
      { en: 'Code', native: 'Koodu / Lamba' },
      { en: 'Variable', native: 'Akwatin ajiya', descriptive: true },
      { en: 'Condition', native: 'Sharadi' },
      { en: 'Loop', native: 'Maimaitawa' },
      { en: 'Output', native: 'Fitarwa' },
      { en: 'Event', native: 'Aukuwa' },
      { en: 'Speed', native: 'Gudu' },
      { en: 'Collision', native: 'Karo' },
      { en: 'Score', native: 'Maki' },
      { en: 'Error', native: 'Kuskure' },
    ],
    reason: {
      output: (value) => `Kwamfuta ta karanta umarninka sannan ta nuna “${value}” a allo.`,
      variable: 'Akwatin ajiya suna ne don lamba ko kalma. Maki (score) da Gudu (speed) akwatunan ajiya ne.',
      condition: 'Idan wani abu ya faru, kwamfuta za ta zaɓi wani mataki. Idan ƙwallo ta bugi katako, tana juyawa.',
      loop: 'Umarnin maimaitawa yana gaya wa kwamfuta ta maimaita aiki ɗaya har manufa ta cimma.',
      event: 'Aukuwa shine abin da ya faru: danna maɓalli ko jin sauti.',
      collision: 'Karo shine lokacin da abu biyu suka taɓa juna, kamar ƙwallo da katako.',
      speed: 'Gudu yana nuna yadda abu ke tafiya da sauri; babban lamba yana nufin nisa mai yawa.',
      error: 'Kuskure shine umarnin da kwamfuta ba ta fahimta ba. Karanta saƙon kuskure sannan ka gyara koodu.',
    },
  },
  sw: {
    name: 'Kiswahili',
    words: [
      { en: 'Code', native: 'Msimbo' },
      { en: 'Variable', native: 'Kisanduku cha data' },
      { en: 'Condition', native: 'Sharti' },
      { en: 'Loop', native: 'Kitanzi' },
      { en: 'Output', native: 'Matokeo' },
      { en: 'Event', native: 'Tukio' },
      { en: 'Speed', native: 'Kasi' },
      { en: 'Collision', native: 'Mgongano' },
      { en: 'Score', native: 'Alama' },
      { en: 'Error', native: 'Hitilafu' },
    ],
    reason: {
      output: (value) => `Kompyuta ilisoma amri yako na kuonyesha “${value}” kwenye skrini.`,
      variable: 'Kisanduku cha data ni jina la nambari au neno. Alama (score) na Kasi (speed) ni visanduku vya data.',
      condition: 'Kama jambo fulani likitokea, kompyuta huchagua hatua nyingine. Kama mpira ukigonga ubao, hugeuka.',
      loop: 'Amri ya kurudia humwambia kompyuta irudie kazi moja hadi lengo litimie.',
      event: 'Tukio ni kile kinachotokea: kubonyeza kitufe au kusikia sauti.',
      collision: 'Mgongano ni pale vitu viwili vinapogusana, kama mpira na ubao.',
      speed: 'Kasi huonyesha jinsi kitu kinavyosonga haraka; nambari kubwa humaanisha umbali zaidi.',
      error: 'Hitilafu ni amri ambayo kompyuta haikuelewa. Soma ujumbe wa hitilafu kisha urekebishe msimbo.',
    },
  },
});

const ENGLISH_CODE_REASONING = Object.freeze({
  output: (value) => `The computer reads the instruction in order and displays “${value}” on the screen.`,
  variable: 'A variable is a named box that stores a value. The score and the speed are both variables: each has a name and a value that can change.',
  condition: 'A condition asks a question (“if …”). When the answer is true the program runs one block; otherwise it runs the else block. That is why a paddle bounces only when the ball reaches it.',
  loop: 'A loop repeats the same steps until a goal is reached or the program is told to stop. Without a stop condition a loop would run for ever.',
  event: 'An event is a moment the program listens for — a key press, a click, a timer tick. The code inside the handler runs only when that moment happens.',
  collision: 'A collision is detected when two shapes overlap. The program then reacts: the ball bounces, a point is added, or a life is lost.',
  speed: 'Speed is how far an object moves each frame. A higher number covers more distance in the same time, so the game feels faster.',
  error: 'An error means the program met an instruction it could not run. Read the message, find the line it names, change one thing, then run again.',
});

const GAME_WORD_GROUPS = Object.freeze({
  yo: [
    'Play — Ṣeré · Pause — Dúró díẹ̀ · Restart — Bẹ̀rẹ̀ lẹ́ẹ̀kan sí i · Score — Àmì · Level — Ìpele',
    'Code — Kóòdù · Variable — Àpótí ìpamọ́ · Condition — Ìpò tí a ṣàyẹ̀wò · Loop — Àṣẹ àtúnṣe · Output — Ìfiránṣẹ́ jáde',
    'Speed — Ìyára · Size — Ìwọ̀n · Lives — Ẹ̀mí · Level — Ìpele · Colour — Àwọ̀',
    'Move — Gbé · Hide — Farapamọ́ · Collect — Kó jọ · Start — Bẹ̀rẹ̀',
    'Change — Yí padà · Create — Ṣẹ̀dà · Game — Eré · Rules — Àwọn òfin',
  ],
  ig: [
    'Play — Gwuo egwu · Pause — Kwụsịtụ · Restart — Malite ọzọ · Score — Akara · Level — Ọkwa',
    'Code — Koodu · Variable — Igbe nchekwa · Condition — Ọnọdụ koodu · Loop — Ntụgharị mmegharị · Output — Mpụta',
    'Speed — Ọsọ · Size — Nha · Lives — Ndụ · Level — Ọkwa · Colour — Agba',
    'Move — Gagharịa · Hide — Zoo · Collect — Chịkọta · Start — Malite',
    'Change — Gbanwee · Create — Mepụta · Game — Egwuregwu · Rules — Iwu',
  ],
  ha: [
    'Play — Yi wasa · Pause — Dakatar · Restart — Sake farawa · Score — Maki · Level — Mataki',
    'Code — Koodu / Lamba · Variable — Akwatin ajiya · Condition — Sharadi · Loop — Maimaitawa · Output — Fitarwa',
    'Speed — Gudu · Size — Girma · Lives — Rayuka · Level — Mataki · Colour — Launi',
    'Move — Motsa · Hide — Ɓoye · Collect — Tattara · Start — Fara',
    'Change — Canja · Create — Ƙirƙira · Game — Wasa · Rules — Dokoki',
  ],
  sw: [
    'Play — Cheza · Pause — Sitisha · Restart — Anza tena · Score — Alama · Level — Kiwango',
    'Code — Msimbo · Variable — Kisanduku cha data · Condition — Sharti · Loop — Kitanzi · Output — Matokeo',
    'Speed — Kasi · Size — Ukubwa · Lives — Maisha · Level — Kiwango · Colour — Rangi',
    'Move — Sogea · Hide — Jificha · Collect — Kusanya · Start — Anza',
    'Change — Badilisha · Create — Unda · Game — Mchezo · Rules — Sheria',
  ],
});

export function gameWordGroups(languageCode) {
  return GAME_WORD_GROUPS[languageCode] ?? GAME_WORD_GROUPS.yo;
}

export function detectCodeConstruct(input) {
  const text = String(input ?? '').toLowerCase();
  if (/\b(loop|repeat|while|for each|iterate|again and again)\b/.test(text)) return 'loop';
  if (/\b(collide|collision|hit|touch|bounce|overlap)\b/.test(text)) return 'collision';
  if (/\b(if|else|when|condition|branch)\b/.test(text)) return 'condition';
  if (/\b(event|click|press|keydown|key)\b/.test(text)) return 'event';
  if (/\b(speed|fast|slow|velocity|pace)\b/.test(text)) return 'speed';
  if (/\b(error|bug|wrong|crash|fail)\b/.test(text)) return 'error';
  if (/\b(variable|let|const|score|lives|size|store|value)\b/.test(text)) return 'variable';
  return 'output';
}

export function explainCodeReasoning(input, languageCode = 'yo') {
  const entry = CODE_TERMS[languageCode] ?? CODE_TERMS.yo;
  const construct = detectCodeConstruct(input);
  const value = String(input ?? '').trim() || 'Hello, Ìdíléwa!';
  const english = ENGLISH_CODE_REASONING[construct];
  const native = entry.reason[construct];
  return {
    construct,
    languageName: entry.name,
    languageCode: CODE_TERMS[languageCode] ? languageCode : 'yo',
    english: typeof english === 'function' ? english(value) : english,
    native: typeof native === 'function' ? native(value) : native,
    words: entry.words,
    descriptive: entry.words.filter((word) => word.descriptive).map((word) => word.en),
  };
}

/* ---------------------------------------------------------------------------
   Ìjìròrò tutor replies — one deterministic knowledge base, five required parts
   in every answer: target, pronunciation/tone, meaning, note, follow-up.
   ------------------------------------------------------------------------- */

const LESSON_SETS = Object.freeze({
  'Yorùbá': {
    greeting: { native: 'Ẹ káàárọ̀', english: 'Good morning.', note: 'Ẹ is the polite form for an elder or for more than one person; “O káàárọ̀” is for one age-mate. Greetings come before business.', followUp: 'Say it twice — once slowly, then at speaking speed.' },
    numbers: [['Ọ̀kan', 'one'], ['Èjì', 'two'], ['Ẹ̀ta', 'three'], ['Ẹ̀rin', 'four'], ['Àrún', 'five']],
    family: [['Ìyá', 'mother'], ['Bàbá', 'father'], ['Ọmọ', 'child'], ['Ẹ̀gbọ́n', 'older sibling'], ['Àbúrò', 'younger sibling']],
    pattern: 'Mo fẹ́ kọ́ èdè Yorùbá — I want to learn Yorùbá.',
  },
  Igbo: {
    greeting: { native: 'Ụtụtụ ọma', english: 'Good morning.', note: '“Kedu?” is the everyday “how are you?”; answer with “Ọ dị mma” (I am well). Greet elders first.', followUp: 'Greet one person at home and tell me what they answered.' },
    numbers: [['Otu', 'one'], ['Abụọ', 'two'], ['Atọ', 'three'], ['Anọ', 'four'], ['Ise', 'five']],
    family: [['Nne', 'mother'], ['Nna', 'father'], ['Nwa', 'child'], ['Nwanne', 'sibling'], ['Nna nna', 'grandfather']],
    pattern: 'Achọrọ m ịmụ Igbo — I want to learn Igbo.',
  },
  Hausa: {
    greeting: { native: 'Ina kwana', english: 'Good morning (how did you sleep?).', note: 'The answer is “Lafiya lau” (fine, peacefully). Ask after the household before raising your own business.', followUp: 'Practise the question and the answer as a pair.' },
    numbers: [['Ɗaya', 'one'], ['Biyu', 'two'], ['Uku', 'three'], ['Huɗu', 'four'], ['Biyar', 'five']],
    family: [['Uwa', 'mother'], ['Uba', 'father'], ['Yaro', 'child (boy)'], ['Ɗan’uwa', 'sibling'], ['Kaka', 'grandparent']],
    pattern: 'Ina son koyon Hausa — I want to learn Hausa.',
  },
  Kiswahili: {
    greeting: { native: 'Habari za asubuhi', english: 'Good morning (news of the morning).', note: 'Answer “Nzuri” (good) or “Salama” (peaceful). To an elder say “Shikamoo”, answered with “Marahaba”.', followUp: 'Try the elder greeting and its answer with someone at home.' },
    numbers: [['Moja', 'one'], ['Mbili', 'two'], ['Tatu', 'three'], ['Nne', 'four'], ['Tano', 'five']],
    family: [['Mama', 'mother'], ['Baba', 'father'], ['Mtoto', 'child'], ['Ndugu', 'sibling · relative'], ['Bibi', 'grandmother']],
    pattern: 'Ninataka kujifunza Kiswahili — I want to learn Kiswahili.',
  },
});

function lessonCount(level) {
  return level === 'Elementary' ? 3 : level === 'Intermediate' ? 4 : 5;
}

function replyParts({ target, pronunciation, meaning, note, followUp }) {
  return [
    `Target: ${target}`,
    `Pronunciation: ${pronunciation}`,
    `Meaning: ${meaning}`,
    `Note: ${note}`,
    `Your turn: ${followUp}`,
  ].join('\n');
}

function phraseReply(language, phrase, english, note, followUp) {
  return replyParts({
    target: phrase,
    pronunciation: describeTones(phrase, language) || 'No tone marks in this phrase; keep the syllables even.',
    meaning: english,
    note,
    followUp,
  });
}

const INTENT_PATTERNS = [
  { intent: 'vowels', pattern: /\b(vowels?|faweli|udaume|wasali|irabo|nasals?)\b/i },
  { intent: 'consonants', pattern: /\b(consonants?|konsonan|konsonanti|mgbochiume|digraphs?|implosives?|gb|kp)\b/i },
  { intent: 'tones', pattern: /\b(tones?|pitch|stress|pronounc\w*|voice|ohùn|ohun|olu|murya|sauti)\b/i },
  { intent: 'heritage', pattern: /\b(heritage|culture|stor(?:y|ies)|proverbs?|owe|ilu|methali|etiquette|respect|asa)\b/i },
  { intent: 'code', pattern: /\b(code|coding|loops?|variables?|conditions?|programs?|computer|koodu|msimbo)\b/i },
  { intent: 'numbers', pattern: /\b(numbers?|count|counting|one|two|three|digits)\b/i },
  { intent: 'family', pattern: /\b(family|mother|father|child|sibling|parents|brother|sister)\b/i },
  { intent: 'greeting', pattern: /\b(hello|hi|hey|greet\w*|morning|afternoon|evening|kaaro|ndewo|sannu|habari|jambo)\b/i },
  { intent: 'lesson', pattern: /\b(lesson|lessons|advanced|intermediate|elementary|practice|sentences?)\b/i },
];

export function detectTutorIntent(input) {
  const text = String(input ?? '');
  for (const rule of INTENT_PATTERNS) {
    if (rule.pattern.test(text)) return rule.intent;
  }
  if (/^how do you say\b|^what does\b|^translate\b/i.test(text.trim())) return 'translate';
  return 'translation';
}

export function buildTutorReply(input, { language = 'Yorùbá', level = 'Elementary' } = {}) {
  const normalizedLanguage = normalizeLanguageName(language);
  const resolved = LESSON_SETS[normalizedLanguage] ? normalizedLanguage : 'Yorùbá';
  const resolvedLevel = LAB_LEVELS.includes(level) ? level : 'Elementary';
  const set = LESSON_SETS[resolved];
  const info = getPhonetics(resolved);
  const count = lessonCount(resolvedLevel);
  const intent = detectTutorIntent(input);

  if (intent === 'vowels') {
    const vowels = info.vowels.slice(0, count);
    return {
      intent,
      text: replyParts({
        target: vowels.map((vowel) => vowel.sym).join(' · '),
        pronunciation: vowels.map((vowel) => `${vowel.sym} ${vowel.ipa} — ${vowel.example} (${vowel.english})`).join('; '),
        meaning: `Vowels of ${resolved}.`,
        note: `${info.note} ${resolvedLevel === 'Advanced'
          ? resolved === 'Yorùbá'
            ? 'Compare ẹ with e and ọ with o in your own recording.'
            : 'Compare the sound contrasts shown in these examples in your own recording.'
          : resolved === 'Yorùbá'
            ? 'Listen for the dot below the letter: it marks a different vowel, not decoration.'
            : 'Use the language-specific examples to hear how each vowel differs.'}`,
        followUp: 'Open Sounds & Vowels, play the first three cards, then say each example aloud.',
      }),
      speech: { text: vowels[0].example, language: resolved },
    };
  }

  if (intent === 'consonants') {
    const consonants = info.consonants.slice(0, count);
    return {
      intent,
      text: replyParts({
        target: consonants.map((item) => item.sym).join(' · '),
        pronunciation: consonants.map((item) => `${item.sym} ${item.ipa} — ${item.example} (${item.english})`).join('; '),
        meaning: `Consonants of ${resolved}.`,
        note: 'Place your tongue and lips first, then release the sound. gb and kp are single sounds, not two letters read in a row.',
        followUp: 'Listen to a trusted speaker, then repeat the sound slowly before adding it to a word.',
      }),
      speech: { text: consonants[0].example, language: resolved },
    };
  }

  if (intent === 'tones') {
    const tones = info.tones.slice(0, resolvedLevel === 'Elementary' ? 1 : 2);
    const isStressLanguage = resolved === 'Kiswahili';
    return {
      intent,
      text: replyParts({
        target: tones.map((tone) => tone.contrast).join(' · '),
        pronunciation: tones.map((tone) => `${tone.contrast} — ${tone.tones}`).join('; '),
        meaning: tones.map((tone) => `${tone.contrast} = ${tone.meanings}`).join('; '),
        note: `${tones[0].cue} ${info.note}`,
        followUp: isStressLanguage
          ? 'Say each word naturally and give the second-to-last syllable a clear beat; do not force a pitch rise.'
          : 'Say the pair once with a clear rise and once with a clear fall, then check the contour in the Voice Mirror.',
      }),
      speech: { text: tones[0].contrast.split(' · ')[0], language: resolved },
    };
  }

  if (intent === 'heritage') {
    const story = getHeritageStories(resolved)[0];
    return {
      intent,
      text: replyParts({
        target: story.native,
        pronunciation: describeTones(story.native, resolved),
        meaning: `Literal: ${story.literal} Idiomatic: ${story.idiomatic}`,
        note: `${story.moral} Wording and customs vary by community; confirm the example with a fluent local speaker. Question: ${story.question} (${story.options.join(' / ')})`,
        followUp: 'Open Heritage Stories and choose the answer that fits the proverb.',
      }),
      speech: { text: story.native, language: resolved },
    };
  }

  if (intent === 'code') {
    const reasoning = explainCodeReasoning(String(input ?? ''), languageCodeFor(resolved));
    const codeWord = CODE_TERMS[languageCodeFor(resolved)].words[0];
    return {
      intent,
      text: replyParts({
        target: `${codeWord.en} — ${codeWord.native}`,
        pronunciation: describeTones(codeWord.native, resolved) || 'Read the term as written.',
        meaning: reasoning.english,
        note: reasoning.native,
        followUp: 'Open the Code Playground, change one value in the message or the speed, and predict the result before running it.',
      }),
      speech: { text: codeWord.native, language: resolved },
    };
  }

  return completeTutorReply({ input, resolved, resolvedLevel, set, intent, count });
}

export function completeTutorReply({ input, resolved, resolvedLevel, set, intent, count }) {
  if (intent === 'numbers' || intent === 'family') {
    const items = (intent === 'numbers' ? set.numbers : set.family).slice(0, count);
    return {
      intent,
      text: replyParts({
        target: items.map(([native]) => native).join(' · '),
        pronunciation: items.map(([native, english]) => `${native} (${english}) — ${describeTones(native, resolved)}`).join('; '),
        meaning: intent === 'numbers' ? 'Numbers one to five.' : 'Family words.',
        note: resolvedLevel === 'Advanced'
          ? `${set.pattern} Notice how the possessive follows the noun in this language family.`
          : 'Learn one word at a time and use it in a full phrase before adding the next.',
        followUp: intent === 'numbers' ? 'Count three objects near you aloud.' : 'Name two people at home with the words above.',
      }),
      speech: { text: items[0][0], language: resolved },
    };
  }

  if (intent === 'lesson') {
    const [nativeSentence, englishSentence] = set.pattern.split(' — ');
    return {
      intent,
      text: replyParts({
        target: nativeSentence,
        pronunciation: describeTones(nativeSentence, resolved),
        meaning: englishSentence || 'A lesson sentence pattern.',
        note: resolvedLevel === 'Advanced'
          ? 'At this level, change one word and keep the word order: the verb of wanting comes first, then the action.'
          : 'Sentence patterns are the quickest way to move from single words to real conversation. Learn this frame, then swap one word.',
        followUp: 'Replace one word in the sentence with a family word or a food word you already know.',
      }),
      speech: { text: nativeSentence, language: resolved },
    };
  }

  if (intent === 'greeting') {
    const greeting = set.greeting;
    return {
      intent,
      text: phraseReply(resolved, greeting.native, greeting.english, greeting.note, greeting.followUp),
      speech: { text: greeting.native, language: resolved },
    };
  }

  const translation = translatePhrase(input, { language: resolved, direction: 'auto' });
  if (translation.status !== 'missing') {
    return {
      intent: 'translate',
      text: replyParts({
        target: translation.statusLabel === 'Curated spelling'
          ? translation.native ?? translation.output
          : translation.output,
        pronunciation: translation.tones || describeTones(translation.output, resolved),
        meaning: translation.direction === 'native-en'
          ? `English: ${translation.english ?? translation.output}`
          : `English source: ${translation.input}`,
        note: `${translation.statusLabel}. ${translation.note}`,
        followUp: 'Say it aloud, then ask me for one more word from the same lesson.',
      }),
      speech: {
        text: translation.direction === 'native-en'
          ? translation.native ?? translation.input
          : translation.output,
        language: resolved,
      },
    };
  }

  return {
    intent: 'menu',
    text: replyParts({
      target: set.greeting.native,
      pronunciation: describeTones(set.greeting.native, resolved),
      meaning: set.greeting.english,
      note: `I do not have a curated answer for “${String(input ?? '').trim()}”, and I will not invent one. I can teach vowels, consonants, tones, numbers, family words, proverbs, code reasoning, or translate a word from the lesson glossary.`,
      followUp: 'Try “teach me vowels”, “tell me a proverb”, or “how do you say water?”.',
    }),
    speech: { text: set.greeting.native, language: resolved },
  };
}

/* ---------------------------------------------------------------------------
   Browser wiring. Everything below is guarded: the module also loads on pages
   that do not contain these sections (or in Node, where it does nothing).
   ------------------------------------------------------------------------- */

const VOICE_DEFAULTS = Object.freeze({ H: 1.24, L: 0.8, M: 1, stress: 1, plain: 1 });

let audioContext = null;
let activeRecording = null;
let recordingPending = false;
let recordingTimeout = 0;
let recordedUrl = '';
let userContour = [];
let userBaseline = 0;
let animationHandle = 0;
let currentPhrase = '';
let currentLanguage = 'Yorùbá';
let phonTab = 'vowels';
let heritageIndex = 0;
let heritageLanguage = 'Yorùbá';
let tutorStarted = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    if (!audioContext) audioContext = new Ctor();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch((error) => {
        setStatus(`Audio could not start (${error?.name || 'browser error'}). Use the browser's audio controls and try again.`);
      });
    }
    return audioContext;
  } catch (error) {
    setStatus(`Audio is unavailable (${error?.name || 'browser error'}).`);
    return null;
  }
}

function setStatus(message, elementIds = ['labAudioStatus']) {
  elementIds.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = message;
  });
}

function pickVoice(synth, locale) {
  if (!synth || typeof synth.getVoices !== 'function') return null;
  const voices = synth.getVoices() || [];
  const wanted = String(locale || '').toLowerCase();
  const base = wanted.split('-')[0];
  return voices.find((voice) => voice.lang?.toLowerCase() === wanted)
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith(base))
    || null;
}

/**
 * Speak a phrase with the device voice, or synthesise the tone contour when the
 * device has no voice for the language. Never alerts; the outcome is reported
 * through a status line when one is on screen.
 */
export function speakPhrase(text, localeOrLanguage = 'en-US', rate = 1) {
  const phrase = String(text ?? '').trim();
  if (!phrase || typeof window === 'undefined') return 'none';
  const looksLikeLocale = /^[a-z]{2}(-[a-z]{2,})?$/i.test(String(localeOrLanguage ?? ''));
  const locale = looksLikeLocale ? String(localeOrLanguage) : speechLocaleFor(localeOrLanguage);
  const language = locale.toLowerCase().startsWith('en') ? 'English' : normalizeLanguageName(localeOrLanguage);
  const synth = window.speechSynthesis;

  if (synth && typeof window.SpeechSynthesisUtterance === 'function') {
    const voice = pickVoice(synth, locale);
    if (voice || language === 'English') {
      try {
        const utterance = new window.SpeechSynthesisUtterance(phrase);
        utterance.lang = locale;
        utterance.rate = Math.min(1.4, Math.max(0.5, rate));
        if (voice) utterance.voice = voice;
        synth.cancel();
        synth.speak(utterance);
        setStatus('Playing the device voice.');
        return 'device';
      } catch {
        // fall through to the tone guide
      }
    }
  }

  if (language === 'English') {
    setStatus('This browser has no speech voice available, so nothing was played.');
    return 'none';
  }

  if (playToneContour(phrase, language, { rate })) {
    setStatus('No device voice for this language, so the marked tone contour was played instead.');
    return 'tones';
  }
  setStatus('No device voice is available, and this spelling does not provide a reliable pitch contour to synthesize.');
  return 'none';
}

function hasReliablePitchTargets(phrase, language) {
  const resolved = normalizeLanguageName(language);
  const contour = toneContour(phrase, resolved);
  if (!contour.length || resolved === 'Kiswahili') return false;
  if (resolved === 'Yorùbá') return true;
  return contour.every((point) => point.tone === 'H' || point.tone === 'L');
}

/** Play the phrase's tone contour as a sequence of short tones. */
export function playToneContour(phrase, language = 'Yorùbá', { rate = 1, baseHz = 0 } = {}) {
  if (!hasReliablePitchTargets(phrase, language)) {
    setStatus('No reliable lexical-tone target is available for this language or spelling.');
    return false;
  }
  const ctx = getAudioContext();
  if (!ctx) return false;
  const contour = toneContour(phrase, language);
  const register = baseHz > 0 ? baseHz : 196;
  const step = 0.34 / Math.min(1.5, Math.max(0.5, rate));
  try {
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    contour.forEach((item, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const multiplier = VOICE_DEFAULTS[item.tone] ?? 1;
      oscillator.type = 'triangle';
      oscillator.frequency.value = register * multiplier;
      const start = ctx.currentTime + index * step;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.9, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + step * 0.92);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + step);
    });
    return true;
  } catch (error) {
    setStatus(`Tone playback failed (${error?.name || 'audio error'}).`);
    return false;
  }
}

/** Normalised autocorrelation pitch detector for a short time-domain buffer. */
export function detectPitch(buffer, sampleRate) {
  if (!buffer?.length || !sampleRate) return 0;
  let energy = 0;
  for (let index = 0; index < buffer.length; index += 1) energy += buffer[index] * buffer[index];
  const rms = Math.sqrt(energy / buffer.length);
  if (rms < 0.008) return 0;

  const size = buffer.length;
  const correlations = new Float32Array(size);
  for (let lag = 0; lag < size; lag += 1) {
    let sum = 0;
    for (let index = 0; index < size - lag; index += 1) sum += buffer[index] * buffer[index + lag];
    correlations[lag] = sum;
  }

  let dip = 0;
  while (dip < size - 1 && correlations[dip] > correlations[dip + 1]) dip += 1;

  let best = -1;
  let bestIndex = -1;
  for (let index = dip; index < size; index += 1) {
    if (correlations[index] > best) {
      best = correlations[index];
      bestIndex = index;
    }
  }
  if (bestIndex <= 0) return 0;

  const previous = correlations[bestIndex - 1] ?? 0;
  const current = correlations[bestIndex];
  const next = correlations[bestIndex + 1] ?? 0;
  const a = (previous + next - 2 * current) / 2;
  const b = (next - previous) / 2;
  const peak = a ? bestIndex - b / (2 * a) : bestIndex;
  const frequency = sampleRate / peak;
  return frequency >= 70 && frequency <= 500 ? Math.round(frequency) : 0;
}

const VOICE_MIRROR_MARKUP = `
  <div class="id-voice-mirror__head">
    <div>
      <p class="id-voice-mirror__eyebrow">Acoustic voice mirror</p>
      <h2 class="id-voice-mirror__title">Tone studio</h2>
    </div>
    <span class="id-voice-mirror__badge" id="voiceProfileBadge">Register: not calibrated</span>
  </div>
  <p class="id-lab-copy" id="vmPhraseLine">The current stage phrase loads here.</p>
  <div class="id-syllable-row" id="syllableBreakdown"></div>
  <canvas class="id-contour" id="toneCanvas" width="640" height="140" role="img" aria-label="Target tone contour for the current phrase"></canvas>
  <div class="id-lab-actions">
    <button type="button" class="secondary" id="vmRecordBtn">Record my voice</button>
    <button type="button" class="secondary" id="vmTargetBtn">Hear target tones</button>
    <button type="button" class="secondary" id="vmPlayBtn">Play my recording</button>
    <button type="button" class="secondary" id="vmMirrorBtn">Mirror in my register</button>
  </div>
  <p class="id-lab-feedback" id="vmFeedback" aria-live="polite">Recording lasts up to 10 seconds and stays in this browser tab; nothing is uploaded. The microphone is requested only after you press Record.</p>
  <p class="muted" id="labAudioStatus" role="status"></p>
`;

function readLessonContext() {
  const phraseNode = document.getElementById('lessonNative');
  const titleNode = document.getElementById('courseTitle');
  const phrase = phraseNode?.textContent?.trim() || '';
  const title = titleNode?.textContent || '';
  return { phrase, language: normalizeLanguageName(title.split('·')[0] || title) };
}

function mountVoiceMirror() {
  const panel = document.getElementById('voiceMirrorPanel');
  if (!panel || panel.dataset.ready === 'true') return false;
  panel.innerHTML = VOICE_MIRROR_MARKUP;
  panel.dataset.ready = 'true';
  document.getElementById('vmRecordBtn')?.addEventListener('click', () => toggleVoiceRecording());
  document.getElementById('vmTargetBtn')?.addEventListener('click', () => {
    if (playToneContour(currentPhrase, currentLanguage, { baseHz: userBaseline })) {
      setStatus(`Target tones played${userBaseline ? ` around your ${userBaseline} Hz register` : ' at a practice register'}.`);
    }
  });
  document.getElementById('vmPlayBtn')?.addEventListener('click', playOwnRecording);
  document.getElementById('vmMirrorBtn')?.addEventListener('click', mirrorRegister);
  return true;
}

function drawContour(target, samples = []) {
  const canvas = document.getElementById('toneCanvas');
  const context = canvas?.getContext?.('2d');
  if (!canvas || !context) return;
  const width = canvas.width;
  const height = canvas.height;
  const styles = typeof window !== 'undefined' && window.getComputedStyle
    ? window.getComputedStyle(document.documentElement)
    : null;
  const ink = styles?.getPropertyValue('--id-forest').trim() || '#1b4332';
  const accent = styles?.getPropertyValue('--id-clay').trim() || '#b08968';
  const grid = styles?.getPropertyValue('--id-stone-200').trim() || '#e2e8e4';

  context.clearRect(0, 0, width, height);
  context.strokeStyle = grid;
  context.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach((ratio) => {
    context.beginPath();
    context.moveTo(0, height * ratio);
    context.lineTo(width, height * ratio);
    context.stroke();
  });

  const points = target.length ? target : [{ multiplier: 1 }];
  const stepX = width / Math.max(1, points.length);
  const yFor = (multiplier) => height - ((multiplier - 0.7) / 0.66) * height;

  context.strokeStyle = ink;
  context.lineWidth = 3;
  context.beginPath();
  points.forEach((point, index) => {
    const x = stepX * index + stepX / 2;
    const y = yFor(point.multiplier ?? 1);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  context.fillStyle = ink;
  points.forEach((point, index) => {
    const x = stepX * index + stepX / 2;
    const y = yFor(point.multiplier ?? 1);
    context.beginPath();
    context.arc(x, y, 4, 0, Math.PI * 2);
    context.fill();
  });

  if (samples.length > 1) {
    const median = samples.slice().sort((a, b) => a - b)[Math.floor(samples.length / 2)] || 1;
    context.strokeStyle = accent;
    context.lineWidth = 2;
    context.beginPath();
    samples.forEach((sample, index) => {
      const x = (width / (samples.length - 1)) * index;
      const y = yFor(Math.min(1.5, Math.max(0.7, sample / median)));
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }

  canvas.setAttribute(
    'aria-label',
    target.length
      ? `Target tone contour: ${target.map((point) => `${point.text} ${TONE_LABELS[point.tone] ?? point.tone}`).join(', ')}${samples.length > 1 ? '. Your recording is drawn as a second line.' : ''}`
      : 'No reliable pitch contour is available for this phrase.',
  );
}

function syncVoiceMirror() {
  if (!mountVoiceMirror()) return;
  const context = readLessonContext();
  if (context.phrase) {
    currentPhrase = context.phrase;
    currentLanguage = context.language;
  }
  if (!currentPhrase) return;

  const line = document.getElementById('vmPhraseLine');
  if (line) line.textContent = `${currentPhrase} · ${describeTones(currentPhrase, currentLanguage)}`;

  const breakdown = document.getElementById('syllableBreakdown');
  if (breakdown) {
    breakdown.replaceChildren();
    parseSyllables(currentPhrase, currentLanguage).forEach((syllable, index) => {
      const pill = document.createElement('span');
      pill.className = 'id-syllable';
      pill.dataset.tone = syllable.tone;
      pill.textContent = `${index + 1}. ${syllable.text} · ${TONE_LABELS[syllable.tone] ?? syllable.tone}`;
      breakdown.appendChild(pill);
    });
  }

  const hasTarget = hasReliablePitchTargets(currentPhrase, currentLanguage);
  const recording = Boolean(activeRecording);
  const recordButton = document.getElementById('vmRecordBtn');
  const targetButton = document.getElementById('vmTargetBtn');
  const playButton = document.getElementById('vmPlayBtn');
  const mirrorButton = document.getElementById('vmMirrorBtn');
  const feedback = document.getElementById('vmFeedback');
  if (recordButton) recordButton.disabled = recordingPending || (!hasTarget && !recording);
  if (targetButton) targetButton.disabled = !hasTarget;
  if (playButton) playButton.disabled = !recordedUrl;
  if (mirrorButton) mirrorButton.disabled = !hasTarget || !userBaseline;
  if (!hasTarget && !recording && feedback) {
    feedback.textContent = currentLanguage === 'Kiswahili'
      ? 'Kiswahili uses predictable stress rather than lexical tone; this pitch-only mirror cannot assess it.'
      : 'This spelling does not mark enough tone information for a reliable pitch comparison. Listen to a fluent speaker instead.';
  }
  const canvas = document.getElementById('toneCanvas');
  if (canvas) canvas.hidden = !hasTarget;
  drawContour(hasTarget ? toneContour(currentPhrase, currentLanguage) : [], hasTarget ? userContour : []);
}

function segmentMeans(samples, count) {
  const size = Math.max(1, Math.floor(samples.length / count));
  return Array.from({ length: count }, (_, index) => {
    const slice = samples.slice(index * size, index * size + size);
    return slice.length ? slice.reduce((total, value) => total + value, 0) / slice.length : Number.NaN;
  });
}

/**
 * Compare the learner's pitch shape with the target shape. This is shape
 * feedback for practice — it is never presented as a pronunciation score.
 */
export function contourFeedback(target, samples, language = 'Yorùbá') {
  if (!target.length) return 'Choose a stage phrase first.';
  const resolved = normalizeLanguageName(language);
  if (resolved === 'Kiswahili') {
    return 'Kiswahili uses predictable penultimate stress, not lexical tone. This pitch-only tool cannot assess stress; listen to a trusted speaker and emphasize the second-to-last syllable.';
  }
  if (resolved !== 'Yorùbá' && target.some((point) => point.tone !== 'H' && point.tone !== 'L')) {
    return 'This spelling does not mark enough tone information for a reliable pitch comparison. Listen to a fluent speaker instead.';
  }
  if (!samples.length || samples.length < 4) {
    return 'Not enough voiced pitch was captured. Hold each syllable a little longer, closer to the microphone, and try again.';
  }
  const baseline = samples.slice().sort((a, b) => a - b)[Math.floor(samples.length / 2)] || 1;
  const segments = segmentMeans(samples, target.length).map((value) => value / baseline);
  const mismatches = [];
  const matches = [];

  target.forEach((point, index) => {
    const wanted = (point.multiplier ?? 1) - 1;
    const userValue = segments[index];
    if (!Number.isFinite(userValue)) return;
    const did = userValue - 1;
    const label = `${point.text} (${TONE_LABELS[point.tone] ?? point.tone})`;
    if (Math.sign(wanted) === Math.sign(did) && Math.abs(did) > 0.04) {
      matches.push(`${label} ${did > 0 ? 'rose' : 'dropped'} with the target`);
    } else if (Math.abs(wanted) >= 0.05) {
      mismatches.push(`${label} should ${wanted > 0 ? 'rise to a high tone' : 'drop to a low tone'}, but your pitch ${Math.abs(did) < 0.04 ? 'stayed level' : did > 0 ? 'rose' : 'dropped'}`);
    } else {
      matches.push(`${label} stayed level as it should`);
    }
  });

  const opening = matches.length
    ? `Good: ${matches.slice(0, 2).join('; ')}.`
    : 'Your contour did not follow the target shape yet.';
  const correction = mismatches.length
    ? ` Work on this next: ${mismatches.slice(0, 2).join('; ')}.`
    : ' Now keep the same shape at speaking speed.';
  return `${opening}${correction} Repeat once slowly, then compare again. This compares pitch shape only; it is practice feedback, not a pronunciation certificate.`;
}

async function toggleVoiceRecording() {
  const button = document.getElementById('vmRecordBtn');
  const feedback = document.getElementById('vmFeedback');
  if (activeRecording) {
    try {
      if (activeRecording.state !== 'inactive') activeRecording.stop();
    } catch (error) {
      if (feedback) feedback.textContent = `Recording could not stop (${error?.name || 'browser error'}).`;
    }
    return;
  }
  if (recordingPending) return;
  if (!hasReliablePitchTargets(currentPhrase, currentLanguage)) {
    if (feedback) {
      feedback.textContent = currentLanguage === 'Kiswahili'
        ? 'Kiswahili uses predictable stress rather than lexical tone; this pitch-only mirror cannot assess it.'
        : 'This spelling does not mark enough tone information for a reliable pitch comparison. Listen to a fluent speaker instead.';
    }
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
    if (feedback) feedback.textContent = 'This browser cannot record audio. You can still hear the target tones and compare by ear.';
    return;
  }

  recordingPending = true;
  if (button) {
    button.disabled = true;
    button.textContent = 'Requesting microphone…';
  }
  let stream = null;
  let source = null;
  let recorder = null;
  let recorderError = '';
  const releaseAfterStopFailure = (error) => {
    recorderError = [recorderError, `could not stop (${error?.name || 'browser error'})`]
      .filter(Boolean)
      .join('; ');
    if (recordingTimeout) window.clearTimeout(recordingTimeout);
    recordingTimeout = 0;
    window.cancelAnimationFrame(animationHandle);
    stream?.getTracks().forEach((track) => track.stop());
    try {
      source?.disconnect();
    } catch (cleanupError) {
      recorderError += `; audio cleanup failed (${cleanupError?.name || 'browser error'})`;
    }
    activeRecording = null;
    if (button) {
      button.disabled = false;
      button.textContent = 'Record my voice';
    }
    if (feedback) feedback.textContent = `Recording failed (${recorderError}).`;
  };
  const stopRecorder = () => {
    if (!recorder || recorder.state === 'inactive') return;
    try {
      recorder.stop();
    } catch (error) {
      releaseAfterStopFailure(error);
    }
  };
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = getAudioContext();
    if (!context) {
      stream.getTracks().forEach((track) => track.stop());
      if (feedback) feedback.textContent = 'Audio analysis is not available in this browser.';
      return;
    }
    const phrase = currentPhrase;
    const language = currentLanguage;
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    source = context.createMediaStreamSource(stream);
    source.connect(analyser);
    const buffer = new Float32Array(analyser.fftSize);
    const chunks = [];
    let frames = 0;
    let autoStopped = false;
    userContour = [];

    recorder = new window.MediaRecorder(stream);
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) chunks.push(event.data);
    });
    recorder.addEventListener('error', (event) => {
      recorderError = event.error?.name || event.error?.message || 'recording error';
      stopRecorder();
    });
    recorder.addEventListener('stop', () => {
      if (recordingTimeout) window.clearTimeout(recordingTimeout);
      recordingTimeout = 0;
      window.cancelAnimationFrame(animationHandle);
      try {
        source?.disconnect();
      } catch (error) {
        recorderError = [recorderError, `audio cleanup failed (${error?.name || 'browser error'})`]
          .filter(Boolean)
          .join('; ');
      } finally {
        stream.getTracks().forEach((track) => track.stop());
        activeRecording = null;
        if (button) {
          button.disabled = false;
          button.textContent = 'Record my voice';
        }
      }

      if (recorderError) {
        if (feedback) feedback.textContent = `Recording failed (${recorderError}).`;
        syncVoiceMirror();
        return;
      }
      if (chunks.length) {
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        recordedUrl = URL.createObjectURL(new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' }));
      }
      if (userContour.length) {
        userBaseline = Math.round(userContour.slice().sort((a, b) => a - b)[Math.floor(userContour.length / 2)]);
        const badge = document.getElementById('voiceProfileBadge');
        if (badge) badge.textContent = `Register: ${userBaseline} Hz`;
      }
      const target = toneContour(phrase, language);
      drawContour(target, userContour);
      if (feedback) {
        const result = contourFeedback(target, userContour, language);
        feedback.textContent = autoStopped
          ? `Recording stopped at the 10-second limit. ${result}`
          : result;
      }
      syncVoiceMirror();
    });

    recorder.start();
    activeRecording = recorder;
    if (button) button.textContent = 'Stop recording';
    if (feedback) feedback.textContent = 'Listening — say the phrase once, clearly, then stop. Recording is processed locally.';

    const sample = () => {
      if (activeRecording !== recorder) return;
      frames += 1;
      try {
        if (frames % 2 === 0) {
          analyser.getFloatTimeDomainData(buffer);
          const pitch = detectPitch(buffer, context.sampleRate);
          if (pitch) userContour.push(pitch);
        }
      } catch (error) {
        recorderError = `audio analysis failed (${error?.name || 'browser error'})`;
        stopRecorder();
        return;
      }
      animationHandle = window.requestAnimationFrame(sample);
    };
    sample();
    recordingTimeout = window.setTimeout(() => {
      if (activeRecording !== recorder || recorder.state === 'inactive') return;
      autoStopped = true;
      recorder.stop();
    }, 10_000);
  } catch (error) {
    recorderError = `recording failed (${error?.name || 'browser error'})`;
    if (recorder && activeRecording === recorder) {
      stopRecorder();
      if (activeRecording === recorder) return;
    }
    stream?.getTracks().forEach((track) => track.stop());
    try {
      source?.disconnect();
    } catch (cleanupError) {
      recorderError += `; audio cleanup failed (${cleanupError?.name || 'browser error'})`;
    }
    if (feedback) {
      feedback.textContent = error?.name === 'NotAllowedError'
        ? 'Microphone access was refused. Allow it in the browser settings and try again; no audio was recorded.'
        : `${recorderError}. No audio was uploaded.`;
    }
  } finally {
    recordingPending = false;
    if (button) {
      button.disabled = false;
      if (!activeRecording) button.textContent = 'Record my voice';
    }
  }
}

function playOwnRecording() {
  const feedback = document.getElementById('vmFeedback');
  if (!recordedUrl) {
    if (feedback) feedback.textContent = 'Record your voice first, then the playback becomes available.';
    return;
  }
  const audio = new Audio(recordedUrl);
  audio.play().catch(() => {
    if (feedback) feedback.textContent = 'The recording could not be played in this browser.';
  });
}

function mirrorRegister() {
  const feedback = document.getElementById('vmFeedback');
  if (!userBaseline) {
    if (feedback) feedback.textContent = 'Record your voice once so the studio can learn your pitch register.';
    playToneContour(currentPhrase, currentLanguage);
    return;
  }
  const played = playToneContour(currentPhrase, currentLanguage, { baseHz: userBaseline });
  if (played && feedback) {
    feedback.textContent = `Target contour played at ${userBaseline} Hz, the register measured from your recording.`;
  }
}

function phoneticsTabItems(info) {
  if (phonTab === 'consonants') return info.consonants;
  if (phonTab === 'tones') return info.tones;
  return info.vowels;
}

function renderPhonetics() {
  const grid = document.getElementById('phonGrid');
  if (!grid) return;
  const select = document.getElementById('phonLang');
  const language = normalizeLanguageName(select?.value || currentLanguage);
  const info = getPhonetics(language);

  const intro = document.getElementById('phonIntro');
  if (intro) intro.textContent = `${info.intro} ${info.note}`;

  document.querySelectorAll('[data-phon-tab]').forEach((button) => {
    const active = button.dataset.phonTab === phonTab;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('is-active', active);
  });

  grid.replaceChildren();
  phoneticsTabItems(info).forEach((item) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'id-phon-card';

    const symbol = document.createElement('strong');
    symbol.className = 'id-phon-card__sym';
    symbol.textContent = item.sym || item.contrast || '';

    const meta = document.createElement('span');
    meta.className = 'id-phon-card__meta';
    meta.textContent = phonTab === 'tones'
      ? `${item.tones} — ${item.meanings}`
      : `${item.ipa} · ${item.example} (${item.english})`;

    card.append(symbol, meta);
    card.addEventListener('click', () => {
      const detail = document.getElementById('phonDetail');
      const example = phonTab === 'tones'
        ? item.contrast.split(' · ')[0]
        : item.example.split(' · ')[0];
      if (detail) {
        detail.textContent = phonTab === 'tones'
          ? `${item.contrast} — ${item.meanings} [${item.tones}]. ${item.cue}`
          : `${item.sym} ${item.ipa} — ${item.example} (${item.english}) [${item.tone}]. ${item.cue}`;
      }
      currentPhrase = example;
      currentLanguage = language;
      if (playToneContour(example, language)) {
        setStatus(`Tone contour played for “${example}”.`, ['phonStatus', 'labAudioStatus']);
      } else {
        setStatus('No reliable lexical-tone contour is available for this example.', ['phonStatus', 'labAudioStatus']);
      }
    });
    grid.appendChild(card);
  });
}

function wirePhoneticsLab() {
  const lab = document.getElementById('phoneticsLab');
  if (!lab || lab.dataset.ready === 'true') return;
  lab.dataset.ready = 'true';
  document.getElementById('phonLang')?.addEventListener('change', renderPhonetics);
  document.querySelectorAll('[data-phon-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      phonTab = button.dataset.phonTab || 'vowels';
      renderPhonetics();
    });
  });
  renderPhonetics();
}

function renderHeritage() {
  const panel = document.getElementById('heritagePanel');
  if (!panel) return;
  const stories = getHeritageStories(heritageLanguage);
  const story = stories[heritageIndex % stories.length];

  panel.replaceChildren();

  const controls = document.createElement('div');
  controls.className = 'id-lab-controls';

  const label = document.createElement('label');
  label.className = 'muted';
  label.setAttribute('for', 'heritageLang');
  label.textContent = 'Language';

  const select = document.createElement('select');
  select.id = 'heritageLang';
  LAB_LANGUAGES.forEach((language) => {
    const option = document.createElement('option');
    option.value = language;
    option.textContent = language;
    option.selected = language === heritageLanguage;
    select.appendChild(option);
  });
  select.addEventListener('change', () => {
    heritageLanguage = normalizeLanguageName(select.value);
    heritageIndex = 0;
    renderHeritage();
  });

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'secondary';
  nextButton.textContent = 'Next story';
  nextButton.addEventListener('click', () => {
    heritageIndex = (heritageIndex + 1) % stories.length;
    renderHeritage();
  });

  const counter = document.createElement('span');
  counter.className = 'muted';
  counter.textContent = `Story ${(heritageIndex % stories.length) + 1} of ${stories.length}`;

  controls.append(label, select, nextButton, counter);

  const article = document.createElement('article');
  article.className = 'id-heritage';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'id-heritage__eyebrow';
  eyebrow.textContent = `Proverb example · ${heritageLanguage}`;

  const heading = document.createElement('h2');
  heading.textContent = story.title;

  const reviewNote = document.createElement('p');
  reviewNote.className = 'id-lab-copy';
  reviewNote.textContent = 'Wording, interpretation, and customs may vary by community. Use this example for practice and confirm it with a fluent local speaker.';

  const native = document.createElement('p');
  native.className = 'id-heritage__proverb';
  native.lang = speechLocaleFor(heritageLanguage);
  native.textContent = story.native;

  const tones = document.createElement('p');
  tones.className = 'id-heritage__tones';
  tones.textContent = describeTones(story.native, heritageLanguage);

  const meanings = document.createElement('dl');
  meanings.className = 'id-heritage__meanings';
  [['Literal meaning', story.literal], ['Idiomatic meaning', story.idiomatic]].forEach(([term, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    meanings.append(dt, dd);
  });

  const storyText = document.createElement('p');
  storyText.textContent = story.english;

  const moral = document.createElement('p');
  moral.className = 'id-heritage__moral';
  moral.textContent = story.moral;

  const vocabulary = document.createElement('ul');
  vocabulary.className = 'id-heritage__vocab';
  story.vocabulary.forEach((item) => {
    const entry = document.createElement('li');
    const strong = document.createElement('strong');
    strong.lang = speechLocaleFor(heritageLanguage);
    strong.textContent = item.native;
    entry.append(strong, document.createTextNode(` — ${item.english}`));
    vocabulary.appendChild(entry);
  });

  const hear = document.createElement('button');
  hear.type = 'button';
  hear.className = 'secondary';
  hear.textContent = 'Hear the proverb';
  hear.addEventListener('click', () => speakPhrase(story.native, heritageLanguage, 0.85));

  const question = document.createElement('h3');
  question.textContent = story.question;

  const choices = document.createElement('div');
  choices.className = 'id-heritage__choices';
  const feedback = document.createElement('p');
  feedback.className = 'id-lab-feedback';
  feedback.setAttribute('aria-live', 'polite');
  feedback.textContent = 'Choose the answer that fits the proverb.';

  story.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.dataset.correct = String(index === story.correct);
    button.textContent = option;
    button.addEventListener('click', () => {
      const correct = index === story.correct;
      Array.from(choices.children).forEach((child) => child.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      feedback.textContent = correct
        ? `Correct. ${story.explanation}`
        : `Not quite — the answer is “${story.options[story.correct]}”. ${story.explanation}`;
    });
    choices.appendChild(button);
  });

  article.append(eyebrow, heading, reviewNote, native, tones, meanings, storyText, moral, vocabulary, hear, question, choices, feedback);
  panel.append(controls, article);
}

function tutorState() {
  return {
    language: normalizeLanguageName(document.getElementById('aiLang')?.value || currentLanguage),
    level: document.getElementById('aiLevel')?.value || 'Elementary',
  };
}

function appendTutorBubble(text, { mine = false, speech = null } = {}) {
  const log = document.getElementById('chatLog');
  if (!log) return;
  const bubble = document.createElement('div');
  bubble.className = `chatBubble${mine ? ' mine' : ''}`;
  bubble.textContent = text;
  if (!mine && speech?.text) {
    const listen = document.createElement('button');
    listen.type = 'button';
    listen.className = 'secondary id-bubble-action';
    listen.textContent = 'Hear it';
    listen.addEventListener('click', () => speakPhrase(speech.text, speech.language || tutorState().language, 0.85));
    bubble.appendChild(listen);
  }
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

function resetTutor() {
  const log = document.getElementById('chatLog');
  if (!log) return;
  const { language, level } = tutorState();
  log.replaceChildren();
  const greeting = LESSON_SETS[language].greeting;
  appendTutorBubble(
    `Ìjìròrò here, your ${language} tutor on the ${level} track.\n\nTarget: ${greeting.native}\nPronunciation: ${describeTones(greeting.native, language)}\nMeaning: ${greeting.english}\nNote: Every answer comes from the lesson knowledge base and shows these five parts. Nothing is generated live, so nothing is invented.\nYour turn: ask for vowels, consonants, tones, numbers, family words, a proverb, code reasoning, or “how do you say water?”.`,
    { speech: { text: greeting.native, language } },
  );
  tutorStarted = true;
}

function ensureTutorWelcome() {
  const log = document.getElementById('chatLog');
  if (!log) return;
  if (!tutorStarted || !log.childElementCount) resetTutor();
}

function sendTutorMessage(customText) {
  const field = document.getElementById('chatInput');
  const value = String(customText ?? field?.value ?? '').trim();
  if (!value) return;
  ensureTutorWelcome();
  appendTutorBubble(value, { mine: true });
  if (field && customText === undefined) field.value = '';

  const { language, level } = tutorState();
  const reply = buildTutorReply(value, { language, level });
  appendTutorBubble(reply.text, { speech: reply.speech });
}

function wireTutor() {
  const section = document.getElementById('aiChat');
  if (!section || section.dataset.ready === 'true') return;
  section.dataset.ready = 'true';
  document.getElementById('aiLang')?.addEventListener('change', resetTutor);
  document.getElementById('aiLevel')?.addEventListener('change', resetTutor);
  ensureTutorWelcome();
}

function studioLanguage() {
  const select = document.getElementById('studioLang');
  return normalizeLanguageName(select?.value || currentLanguage);
}

function studioDirection() {
  const direction = document.getElementById('direction')?.textContent || '';
  return direction.trim().toLowerCase().startsWith('english') ? 'en-native' : 'native-en';
}

function renderTranslationDetail(result) {
  const panel = document.getElementById('translationDetail');
  if (!panel) return;
  panel.replaceChildren();

  const status = document.createElement('p');
  status.className = 'id-translation__status';
  status.textContent = result.status === 'missing'
    ? 'Not translated'
    : `${result.statusLabel} · confidence ${result.confidence}`;
  panel.appendChild(status);

  if (result.tones) {
    const tones = document.createElement('p');
    tones.className = 'id-translation__row';
    const label = document.createElement('span');
    label.textContent = 'Tones';
    const value = document.createElement('span');
    value.textContent = result.tones;
    tones.append(label, value);
    panel.appendChild(tones);
  }

  if (result.gloss.length) {
    const list = document.createElement('ul');
    list.className = 'id-translation__gloss';
    result.gloss.forEach((item) => {
      const entry = document.createElement('li');
      entry.textContent = item.known
        ? `${item.source} — ${item.target}`
        : `${item.source} — not in the lesson glossary`;
      list.appendChild(entry);
    });
    panel.appendChild(list);
  }

  const note = document.createElement('p');
  note.className = 'id-lab-copy';
  note.textContent = result.note;
  panel.appendChild(note);

  if (result.output) {
    const listen = document.createElement('button');
    listen.type = 'button';
    listen.className = 'secondary';
    listen.textContent = 'Hear the translation';
    listen.addEventListener('click', () => {
      speakPhrase(result.direction === 'native-en' ? result.input : result.output, result.language, 0.85);
    });
    panel.appendChild(listen);
  }
}

function runStudioTranslation() {
  const source = document.getElementById('source');
  const target = document.getElementById('target');
  const message = document.getElementById('studioMsg');
  const language = studioLanguage();
  const result = translatePhrase(source?.value ?? '', { language, direction: studioDirection() });

  if (target) target.value = result.output;
  if (message) {
    message.textContent = result.status === 'missing'
      ? result.note
      : `${result.statusLabel} · ${result.direction === 'en-native' ? `English to ${language}` : `${language} to English`}`;
  }
  renderTranslationDetail(result);
  return result;
}

function syncCodeVocabulary() {
  const select = document.getElementById('academyLanguage');
  const code = select?.value || 'yo';
  const groups = gameWordGroups(code);
  const bodies = document.querySelectorAll('#codeLab .id-accordion-rack .id-learning-accordion .id-acc-body p');
  bodies.forEach((node, index) => {
    if (groups[index]) node.textContent = groups[index];
  });
  const status = document.getElementById('academyLanguageStatus');
  const entry = CODE_TERMS[code] ?? CODE_TERMS.yo;
  if (status) status.textContent = `English + ${entry.name} · game controls, coding words and code reasoning update together`;
}

function runCodeExplanation() {
  const input = document.getElementById('codeMessage');
  const result = document.getElementById('codeResult');
  const select = document.getElementById('academyLanguage');
  const code = select?.value || 'yo';
  const value = input?.value ?? '';
  const reasoning = explainCodeReasoning(value, code);
  if (!result) return;
  result.textContent = [
    `Output: ${value}`,
    '',
    `English reasoning: ${reasoning.english}`,
    `${reasoning.languageName}: ${reasoning.native}`,
    '',
    'Key coding words:',
    reasoning.words.map((word) => `${word.en} — ${word.native}${word.descriptive ? ' (descriptive equivalent)' : ''}`).join(' · '),
  ].join('\n');
}

function wireCodeLab() {
  const select = document.getElementById('academyLanguage');
  if (!select || select.dataset.ready === 'true') return;
  select.dataset.ready = 'true';
  select.addEventListener('change', syncCodeVocabulary);
  syncCodeVocabulary();
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Wire the lab to the homepage. Safe to call more than once; every step is
 * guarded so pages without these sections are untouched.
 */
export function installLanguageLab() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;

  window.speakText = (text, localeOrLanguage, rate = 1) => speakPhrase(text, localeOrLanguage, rate);

  window.recordDemo = function recordDemo() {
    const panel = document.getElementById('voiceMirrorPanel');
    panel?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    syncVoiceMirror();
    if (!activeRecording) toggleVoiceRecording();
  };

  window.translateText = runStudioTranslation;
  window.sendIdilewaChat = () => sendTutorMessage();
  window.chatPrompt = (text) => sendTutorMessage(text);
  window.answerHeritage = () => renderHeritage();
  window.runIdilewaCode = runCodeExplanation;

  window.IjiroroAI = {
    send: (text) => sendTutorMessage(text),
    resetWelcome: resetTutor,
    ensureWelcome: ensureTutorWelcome,
  };
  window.IdilewaVoice = {
    playPhraseToneGuide: (phrase, language, rate = 1) => playToneContour(phrase, language || currentLanguage, { rate }),
    toggleRecord: toggleVoiceRecording,
    syncWithCurrentLesson: syncVoiceMirror,
    playTargetContour: () => playToneContour(currentPhrase, currentLanguage, { baseHz: userBaseline }),
    playOwnRecording,
    playMirroredRegister: mirrorRegister,
  };
  window.IdilewaPhonetics = {
    render: renderPhonetics,
    setTab: (tab) => {
      phonTab = tab;
      renderPhonetics();
    },
  };
  window.IdilewaHeritage = { render: renderHeritage };
  window.IdilewaCodeTranslator = {
    syncAll: syncCodeVocabulary,
    explainCode: (input) => explainCodeReasoning(input, document.getElementById('academyLanguage')?.value || 'yo'),
  };
  window.IdilewaLanguageLab = {
    translate: (text, options) => translatePhrase(text, options),
    tutor: (text, options) => buildTutorReply(text, options),
    contour: (phrase, language) => toneContour(phrase, language),
    describeTones,
  };

  const previousGo = window.go;
  if (typeof previousGo === 'function' && !window.__idilewaLanguageLabGo) {
    window.__idilewaLanguageLabGo = true;
    window.go = function go(id) {
      const result = previousGo.apply(this, arguments);
      if (id === 'learning') syncVoiceMirror();
      if (id === 'phoneticsLab') renderPhonetics();
      if (id === 'heritageLab') renderHeritage();
      if (id === 'aiChat') ensureTutorWelcome();
      if (id === 'studio') runStudioTranslation();
      if (id === 'codeLab') syncCodeVocabulary();
      return result;
    };
  }

  mountVoiceMirror();
  syncVoiceMirror();
  wirePhoneticsLab();
  renderHeritage();
  wireTutor();
  wireCodeLab();

  // Deep links such as /?view=phoneticsLab (used by the header and drawer).
  const requestedView = new URLSearchParams(window.location.search).get('view');
  if (requestedView && requestedView !== 'home' && document.getElementById(requestedView)) {
    window.setTimeout(() => {
      if (typeof window.go !== 'function') {
        setStatus(`The requested view “${requestedView}” could not be opened.`);
        return;
      }
      window.go(requestedView);
    }, 0);
  }

  return true;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => installLanguageLab(), { once: true });
  } else {
    installLanguageLab();
  }
}


















/* END OF MODULE PART 2 */


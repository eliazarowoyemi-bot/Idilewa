// Yoruba Alphabet: Vowels (Fawẹli), Consonants (Kọnsọnanti), and Tones (Àmì Ohùn)

export const ORAL_VOWELS = [
  {
    char: 'A',
    lower: 'a',
    ipa: '/a/',
    name: 'A',
    toneExamples: [
      { char: 'Á', tone: 'Òkè (High)', sound: 'Mí', word: 'Ákàtì (Ruler)', en: 'High tone vowel' },
      { char: 'A', tone: 'Àárín (Mid)', sound: 'Re', word: 'Agbàdo (Corn)', en: 'Mid tone vowel' },
      { char: 'À', tone: 'Ìsàlẹ̀ (Low)', sound: 'Dò', word: 'Àbúrò (Sibling)', en: 'Low tone vowel' }
    ],
    example: 'Agbàdo',
    translation: 'Corn / Maize',
    desc: 'Bíi "a" ninu "father" ninu èdè Gẹ̀ẹ́sì.',
    icon: '🌾'
  },
  {
    char: 'E',
    lower: 'e',
    ipa: '/e/',
    name: 'E',
    toneExamples: [
      { char: 'É', tone: 'Òkè (High)', sound: 'Mí', word: 'Ékúró (Palm kernel)', en: 'High tone vowel' },
      { char: 'E', tone: 'Àárín (Mid)', sound: 'Re', word: 'Epo (Palm oil)', en: 'Mid tone vowel' },
      { char: 'È', tone: 'Ìsàlẹ̀ (Low)', sound: 'Dò', word: 'Èkó (Lagos / Corn meal)', en: 'Low tone vowel' }
    ],
    example: 'Epo',
    translation: 'Oil / Palm oil',
    desc: 'Bíi "ay" ninu "say" ṣugbọn kukuru.',
    icon: '🏺'
  },
  {
    char: 'Ẹ',
    lower: 'ẹ',
    ipa: '/ɛ/',
    name: 'Ẹ (E pẹlu àmì abẹ́)',
    toneExamples: [
      { char: 'Ẹ́', tone: 'Òkè (High)', sound: 'Mí', word: 'Ẹ́yẹ (Bird)', en: 'High tone vowel' },
      { char: 'Ẹ', tone: 'Àárín (Mid)', sound: 'Re', word: 'Ẹja (Fish)', en: 'Mid tone vowel' },
      { char: 'Ẹ̀', tone: 'Ìsàlẹ̀ (Low)', sound: 'Dò', word: 'Ẹ̀kọ́ (Education / Lesson)', en: 'Low tone vowel' }
    ],
    example: 'Ẹja',
    translation: 'Fish',
    desc: 'Bíi "e" ninu "bed" tabi "get".',
    icon: '🐟'
  },
  {
    char: 'I',
    lower: 'i',
    ipa: '/i/',
    name: 'I',
    toneExamples: [
      { char: 'Í', tone: 'Òkè (High)', sound: 'Mí', word: 'Íwé (Book)', en: 'High tone vowel' },
      { char: 'I', tone: 'Àárín (Mid)', sound: 'Re', word: 'Irin (Iron / Metal)', en: 'Mid tone vowel' },
      { char: 'Ì', tone: 'Ìsàlẹ̀ (Low)', sound: 'Dò', word: 'Ìtàn (Story / History)', en: 'Low tone vowel' }
    ],
    example: 'Irin',
    translation: 'Iron / Metal',
    desc: 'Bíi "ee" ninu "see" tabi "feet".',
    icon: '⚙️'
  },
  {
    char: 'O',
    lower: 'o',
    ipa: '/o/',
    name: 'O',
    toneExamples: [
      { char: 'Ó', tone: 'Òkè (High)', sound: 'Mí', word: 'Ókè (Hill / Top)', en: 'High tone vowel' },
      { char: 'O', tone: 'Àárín (Mid)', sound: 'Re', word: 'Omi (Water)', en: 'Mid tone vowel' },
      { char: 'Ò', tone: 'Ìsàlẹ̀ (Low)', sound: 'Dò', word: 'Òwe (Proverb)', en: 'Low tone vowel' }
    ],
    example: 'Omi',
    translation: 'Water',
    desc: 'Bíi "o" ninu "go" tabi "home".',
    icon: '💧'
  },
  {
    char: 'Ọ',
    lower: 'ọ',
    ipa: '/ɔ/',
    name: 'Ọ (O pẹlu àmì abẹ́)',
    toneExamples: [
      { char: 'Ọ́', tone: 'Òkè (High)', sound: 'Mí', word: 'Ọ́kọ̀ (Spear)', en: 'High tone vowel' },
      { char: 'Ọ', tone: 'Àárín (Mid)', sound: 'Re', word: 'Ọ̀bẹ (Knife)', en: 'Mid tone vowel' },
      { char: 'Ọ̀', tone: 'Ìsàlẹ̀ (Low)', sound: 'Dò', word: 'Ọ̀rẹ́ (Friend)', en: 'Low tone vowel' }
    ],
    example: 'Ọkọ̀',
    translation: 'Vehicle / Car / Boat',
    desc: 'Bíi "aw" ninu "saw" tabi "law".',
    icon: '🚗'
  },
  {
    char: 'U',
    lower: 'u',
    ipa: '/u/',
    name: 'U',
    toneExamples: [
      { char: 'Ú', tone: 'Òkè (High)', sound: 'Mí', word: 'Úra (Grace)', en: 'High tone vowel' },
      { char: 'U', tone: 'Àárín (Mid)', sound: 'Re', word: 'Uka (Ring - dialect)', en: 'Mid tone vowel' },
      { char: 'Ù', tone: 'Ìsàlẹ̀ (Low)', sound: 'Dò', word: 'Ùrà (Supplication)', en: 'Low tone vowel' }
    ],
    example: 'Úra',
    translation: 'Grace / Supplication',
    desc: 'Bíi "oo" ninu "moon" tabi "food".',
    icon: '✨'
  }
];

export function getOralVowelSpeechText(toneExample) {
  const exampleWord = toneExample.word.replace(/\s+\([^)]*\)$/, '');
  return `${toneExample.char}. ${exampleWord}`;
}

export const ORAL_VOWEL_TONES = [
  { id: 'high', label: 'High tone (Mí)', exampleIndex: 0 },
  { id: 'mid', label: 'Mid tone (Re)', exampleIndex: 1 },
  { id: 'low', label: 'Low tone (Dò)', exampleIndex: 2 }
];

export function getOralVowelSequenceSpeechText(tone) {
  const toneSequence = ORAL_VOWEL_TONES.find((item) => item.id === tone);
  if (!toneSequence) throw new RangeError(`Unknown Yorùbá vowel tone: ${tone}`);
  return ORAL_VOWELS
    .map((vowel) => vowel.toneExamples[toneSequence.exampleIndex].char)
    .join('. ');
}

export const NASAL_VOWELS = [
  { char: 'An', lower: 'an', example: 'Ìtàn', translation: 'Story / Heritage', sound: 'ahn (nasal)', icon: '📜' },
  { char: 'Ẹn', lower: 'ẹn', example: 'Ẹ̀nìyàn', translation: 'Human being', sound: 'ehn (nasal)', icon: '👥' },
  { char: 'In', lower: 'in', example: 'Ìrìn', translation: 'Walk / Journey', sound: 'een (nasal)', icon: '🚶' },
  { char: 'Ọn', lower: 'ọn', example: 'Ọ̀nà', translation: 'Road / Path', sound: 'awn (nasal)', icon: '🛣️' },
  { char: 'Un', lower: 'un', example: 'Ìbùn', translation: 'Gift / Blessing', sound: 'oon (nasal)', icon: '🎁' }
];

export const CONSONANTS = [
  { char: 'B', example: 'Bàbá', translation: 'Father', sound: 'b', desc: 'Bilabial stop' },
  { char: 'D', example: 'Dùndú', translation: 'Fried yam', sound: 'd', desc: 'Alveolar stop' },
  { char: 'F', example: 'Fìlà', translation: 'Cap / Hat', sound: 'f', desc: 'Labiodental fricative' },
  { char: 'G', example: 'Gèlè', translation: 'Headwrap', sound: 'g', desc: 'Velar stop' },
  { char: 'GB', example: 'Gbọ́ngbọ́n', translation: 'Wisdom / Strength', sound: 'ɡ͡b', desc: 'Labial-velar stop (Unique sound)' },
  { char: 'H', example: 'Hausa', translation: 'Hausa person / culture', sound: 'h', desc: 'Glottal fricative' },
  { char: 'J', example: 'Jẹ', translation: 'Eat', sound: 'd͡ʒ', desc: 'Postalveolar affricate' },
  { char: 'K', example: 'Kọ̀mpútà', translation: 'Computer', sound: 'k', desc: 'Velar stop' },
  { char: 'L', example: 'Ilé', translation: 'House / Home', sound: 'l', desc: 'Alveolar lateral' },
  { char: 'M', example: 'Mọ̀tò', translation: 'Motor vehicle', sound: 'm', desc: 'Bilabial nasal' },
  { char: 'N', example: 'Nọ́mbà', translation: 'Number', sound: 'n', desc: 'Alveolar nasal' },
  { char: 'P', example: 'Pátákó', translation: 'Blackboard / Plaque', sound: 'k͡p', desc: 'Labial-velar voiceless (Unique sound)' },
  { char: 'R', example: 'Rere', translation: 'Goodness', sound: 'r', desc: 'Alveolar tap' },
  { char: 'S', example: 'Sùn', translation: 'Sleep', sound: 's', desc: 'Alveolar fricative' },
  { char: 'Ṣ', example: 'Ṣiré', translation: 'Play', sound: 'ʃ', desc: 'Postalveolar fricative (sh)' },
  { char: 'T', example: 'Tadé', translation: 'Tade (Name)', sound: 't', desc: 'Alveolar stop' },
  { char: 'W', example: 'Wúrà', translation: 'Gold', sound: 'w', desc: 'Labial-velar approximant' },
  { char: 'Y', example: 'Yorùbá', translation: 'Yoruba People', sound: 'j', desc: 'Palatal approximant' }
];

export const TONE_MARKS = [
  {
    name: 'Òkè (High Tone)',
    symbol: '´ (Ákṣẹ́ntì Òkè)',
    solfa: 'Mí',
    pitch: 'High Frequency (~370Hz)',
    color: 'tone-yellow',
    examples: [
      { word: 'Wá', meaning: 'Come', tone: 'Mí' },
      { word: 'Bá', meaning: 'Meet / Accompany', tone: 'Mí' },
      { word: 'Rí', meaning: 'See', tone: 'Mí' }
    ]
  },
  {
    name: 'Àárín (Mid Tone)',
    symbol: '¯ (Láìsí àmì)',
    solfa: 'Re',
    pitch: 'Mid Frequency (~294Hz)',
    color: 'tone-mint',
    examples: [
      { word: 'Wa', meaning: 'Look for / Seek', tone: 'Re' },
      { word: 'Ba', meaning: 'Perch / Hide', tone: 'Re' },
      { word: 'Ri', meaning: 'Sink / Drown', tone: 'Re' }
    ]
  },
  {
    name: 'Ìsàlẹ̀ (Low Tone)',
    symbol: '` (Ákṣẹ́ntì Ìsàlẹ̀)',
    solfa: 'Dò',
    pitch: 'Low Frequency (~220Hz)',
    color: 'tone-blue',
    examples: [
      { word: 'Wà', meaning: 'Exist / Be present', tone: 'Dò' },
      { word: 'Bà', meaning: 'Land / Alight', tone: 'Dò' },
      { word: 'Rì', meaning: 'Submerge', tone: 'Dò' }
    ]
  }
];

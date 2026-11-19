const VOWELS = /[aeiouẹọịụ]/i;
const TONE_VOWELS = /([aeiouẹọịụ])(\u0323)?([\u0300\u0301])?/giu;

const PHONETICS = {
  Yorùbá: {
    vowels: [
      ['a e ẹ i o ọ u', 'Seven oral vowels. ẹ and ọ are distinct vowels, not decorated versions of e and o.'],
      ['an in ọn un', 'Introductory nasal-vowel spellings; vowel quality and dialect can vary.'],
    ],
    consonants: [
      ['gb', 'A voiced labial-velar stop: make the back-of-tongue and lip closures together.'],
      ['p (often taught as kp)', 'A voiceless labial-velar stop in standard Yorùbá pronunciation.'],
      ['ṣ', 'A postalveolar sound like English “sh”; keep it distinct from s.'],
    ],
    tones: [
      ['igbá · igba · ìgbà', 'Compare tone marks carefully; exact lexical meanings depend on the complete word and context.'],
      ['Dò · Re · Mí', 'Low, mid, and high pitch references. Unmarked vowels are generally mid in basic Yorùbá tone notation.'],
    ],
  },
  Igbo: {
    vowels: [
      ['a i o u', 'Often grouped as the advanced-tongue-root vowel set.'],
      ['e ị ọ ụ', 'Vowels commonly presented in the retracted-tongue-root set; details vary by dialect.'],
    ],
    consonants: [
      ['gb · kp', 'Labial-velar consonants: close at the back of the tongue and lips together.'],
      ['gw · kw', 'Labialized velars; round the lips as the consonant is released.'],
      ['ṅ · nw · ny · gh', 'Nasal or dialect-sensitive spellings; listen to a trusted speaker for the local sound.'],
    ],
    tones: [
      ['ákwá · ákwà · àkwá · àkwà', 'A spelling contrast for noticing high and low tone marks; confirm word meanings with a fluent speaker.'],
      ['High · Low · Downstep', 'Igbo tone patterns are contextual; do not infer every tone from an unmarked spelling.'],
    ],
  },
  Hausa: {
    vowels: [
      ['a · e · i · o · u', 'Five vowel qualities. Vowel length can distinguish words; long vowels are often doubled in teaching examples.'],
      ['a / aa · i / ii · u / uu', 'Hold a long vowel for more time without adding an extra syllable.'],
    ],
    consonants: [
      ['ɓ · ɗ', 'Implosives: form the consonant closure and draw the larynx down as the sound begins.'],
      ['ƙ · ts · c · ƴ', 'Consonants with language-specific articulation; use a native-speaker recording as the model.'],
    ],
    tones: [
      ['High · Low · Falling', 'Hausa is tonal, but tone is not consistently written in everyday orthography. This lab does not score pitch from spelling alone.'],
    ],
  },
  Swahili: {
    vowels: [
      ['a · e · i · o · u', 'Five steady vowel qualities; avoid adding an English-style glide.'],
    ],
    consonants: [
      ["ng' · ny", 'ng’ is a velar nasal; ny is a palatal nasal.'],
      ['dh · th · gh · ch · sh', 'Digraph pronunciation varies by sound; compare each with a reliable Kiswahili audio example.'],
    ],
    tones: [
      ['ha-BA-ri · a-SAN-te', 'Kiswahili has no lexical tone system like Yorùbá; stress usually falls on the penultimate syllable.'],
    ],
  },
};

const CODE_WORDS = {
  yo: {
    name: 'Yorùbá',
    words: [
      ['Code', 'Kóòdù'], ['Variable', 'Àpótí ìpamọ́'], ['Condition', 'Ìpò tí a ṣàyẹ̀wò'],
      ['Loop', 'Àṣẹ àtúnṣe'], ['Output', 'Ohun tí ètò ṣe jáde'], ['Speed', 'Ìyára'],
      ['Collision', 'Ìkọlù'], ['Error', 'Àṣìṣe'],
    ],
    explain: {
      output: 'Kọ̀ǹpútà ka àṣẹ náà, ó sì fi ìfiránṣẹ́ hàn lójú ìbòjú.',
      loop: 'Àṣẹ àtúnṣe máa ń ṣe iṣẹ́ kan lẹ́ẹ̀kọ̀ọ̀kan gẹ́gẹ́ bí òfin tí a kọ sí i.',
      condition: 'Ètò náà ṣàyẹ̀wò bóyá òfin kan ṣẹ; ìdáhùn ló pinnu ìgbésẹ̀ tó tẹ̀ lé.',
      variable: 'Àyípadà ń tọ́jú ìwífún, bí àkọsílẹ̀ àmì eré tàbí ìyára.',
    },
  },
  ig: {
    name: 'Igbo',
    words: [
      ['Code', 'Koodu'], ['Variable', 'Igbe nchekwa'], ['Condition', 'Ọnọdụ'],
      ['Loop', 'Ntụgharị ugboro ugboro'], ['Output', 'Ihe mmemme gosipụtara'], ['Speed', 'Ọsọ'],
      ['Collision', 'Mmekọrịta ihe'], ['Error', 'Njehie'],
    ],
    explain: {
      output: 'Kọmputa gụrụ iwu ahụ wee gosi ozi ahụ na ihuenyo.',
      loop: 'Loop na-eme ka mmemme megharịa otu ọrụ dịka iwu ahụ si kwuo.',
      condition: 'Mmemme na-enyocha ma ọnọdụ ahụ ọ dị; azịza ya na-ekpebi ihe ga-eme ọzọ.',
      variable: 'Variable na-echekwa ozi, dịka akara egwuregwu ma ọ bụ ọsọ.',
    },
  },
  ha: {
    name: 'Hausa',
    words: [
      ['Code', 'Lamba / Koodu'], ['Variable', 'Akwatin bayanai'], ['Condition', 'Sharadi'],
      ['Loop', 'Maimaitawa'], ['Output', 'Sakamako'], ['Speed', 'Gudu'],
      ['Collision', 'Haɗuwar abubuwa'], ['Error', 'Kuskure'],
    ],
    explain: {
      output: 'Kwamfuta ta karanta umarnin, sannan ta nuna saƙon a allo.',
      loop: 'Umarnin maimaitawa yana gudanar da aiki sau da yawa bisa ƙaida.',
      condition: 'Shirin yana duba ko sharadi ya cika; sakamakon yana zaɓar mataki na gaba.',
      variable: 'Variable yana adana bayani, kamar maki ko gudun wasa.',
    },
  },
  sw: {
    name: 'Kiswahili',
    words: [
      ['Code', 'Msimbo'], ['Variable', 'Kisanduku cha data'], ['Condition', 'Sharti'],
      ['Loop', 'Kitanzi'], ['Output', 'Matokeo'], ['Speed', 'Kasi'],
      ['Collision', 'Mgongano'], ['Error', 'Hitilafu'],
    ],
    explain: {
      output: 'Kompyuta ilisoma amri kisha ikaonyesha ujumbe kwenye skrini.',
      loop: 'Kitanzi hurudia kazi kulingana na masharti yaliyowekwa.',
      condition: 'Msimbo hukagua sharti; jibu huamua hatua inayofuata.',
      variable: 'Variable huhifadhi taarifa kama alama au kasi ya mchezo.',
    },
  },
};

const TEMPLATES = {
  'Yorùbá': [
    [/^my name is (.+)$/i, 'Orúkọ mi ni $1'],
    [/^i want (.+)$/i, 'Mo fẹ́ $1'],
    [/^i like (.+)$/i, 'Mo fẹ́ràn $1'],
    [/^where is (.+)\??$/i, 'Níbo ni $1 wà?'],
  ],
  Igbo: [
    [/^my name is (.+)$/i, 'Aha m bụ $1'],
    [/^i want (.+)$/i, 'Achọrọ m $1'],
    [/^i like (.+)$/i, 'Ọ na-amasị m $1'],
    [/^where is (.+)\??$/i, 'Ebee ka $1 dị?'],
  ],
  Hausa: [
    [/^my name is (.+)$/i, 'Sunana $1'],
    [/^i want (.+)$/i, 'Ina son $1'],
    [/^i like (.+)$/i, 'Ina son $1'],
    [/^where is (.+)\??$/i, 'Ina $1 yake?'],
  ],
  Swahili: [
    [/^my name is (.+)$/i, 'Jina langu ni $1'],
    [/^i want (.+)$/i, 'Ninataka $1'],
    [/^i like (.+)$/i, 'Ninapenda $1'],
    [/^where is (.+)\??$/i, '$1 iko wapi?'],
  ],
};

export function normalizeLearningText(value) {
  const normalized = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ẹẸ]/g, (letter) => letter === 'Ẹ' ? 'E' : 'e')
    .replace(/[ọỌ]/g, (letter) => letter === 'Ọ' ? 'O' : 'o')
    .replace(/[ịỊ]/g, (letter) => letter === 'Ị' ? 'I' : 'i')
    .replace(/[ụỤ]/g, (letter) => letter === 'Ụ' ? 'U' : 'u')
    .replace(/[ṣṢ]/g, (letter) => letter === 'Ṣ' ? 'S' : 's')
    .replace(/[ɓƁ]/g, (letter) => letter === 'Ɓ' ? 'B' : 'b')
    .replace(/[ɗƊ]/g, (letter) => letter === 'Ɗ' ? 'D' : 'd')
    .replace(/[ƙƘ]/g, (letter) => letter === 'Ƙ' ? 'K' : 'k')
    .replace(/[ƴƳ]/g, (letter) => letter === 'Ƴ' ? 'Y' : 'y')
    .toLowerCase()
    .replace(/[?!.,'":;()[\]-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized === 'e kaaro' ? 'e kaaaro' : normalized;
}

export function translateCuratedText({ text, entries, language, reverse }) {
  const raw = String(text ?? '').trim();
  if (!raw) return { translated: '', status: 'empty', gloss: [] };
  const normalized = normalizeLearningText(raw);
  const sourceIndex = reverse ? 1 : 0;
  const targetIndex = reverse ? 0 : 1;
  const exact = entries.find((entry) => normalizeLearningText(entry[sourceIndex]) === normalized);
  if (exact) {
    return {
      translated: exact[targetIndex],
      status: 'Curated',
      gloss: [{ source: raw, target: exact[targetIndex] }],
    };
  }

  if (reverse) {
    for (const [pattern, template] of TEMPLATES[language] || []) {
      const match = raw.match(pattern);
      if (!match) continue;
      const argument = match[1].trim();
      const word = entries.find((entry) => normalizeLearningText(entry[1]) === normalizeLearningText(argument));
      const translated = template.replace('$1', word?.[0] || argument);
      return {
        translated,
        status: 'Composed',
        gloss: [{ source: raw, target: translated }],
      };
    }
  }

  const tokens = raw.split(/\s+/);
  const gloss = tokens.map((token) => {
    const tokenKey = normalizeLearningText(token);
    const match = entries.find((entry) => normalizeLearningText(entry[sourceIndex]) === tokenKey);
    return { source: token, target: match ? match[targetIndex] : token, matched: Boolean(match) };
  });
  const matchedCount = gloss.filter((item) => item.matched).length;
  return {
    translated: matchedCount ? gloss.map((item) => item.target).join(' ') : '',
    status: matchedCount ? 'Word-by-word gloss' : 'Not found',
    gloss,
    matchedCount,
  };
}

export function getPronunciationGuide(phrase, language) {
  if (language === 'Swahili') {
    return 'Kiswahili has no lexical tone; stress usually falls on the penultimate syllable.';
  }
  if (language === 'Hausa') {
    return 'Hausa tone is not consistently shown in everyday spelling; this spelling alone is not enough to score pitch.';
  }
  if (!['Yorùbá', 'Igbo'].includes(language)) return 'Listen to a trusted speaker and repeat at a comfortable pace.';

  const tones = [];
  for (const match of String(phrase).normalize('NFD').matchAll(TONE_VOWELS)) {
    const mark = match[3];
    tones.push(mark === '\u0301' ? 'H' : mark === '\u0300' ? 'L' : 'M');
  }
  if (!tones.length) return 'Listen to a trusted speaker; this spelling does not show enough tone information for an estimate.';
  return `Approximate syllable-tone sequence: ${tones.join(' · ')} (H high, M mid, L low).`;
}

export function explainCode(message, languageCode = 'yo') {
  const language = CODE_WORDS[languageCode] || CODE_WORDS.yo;
  const input = String(message ?? '').trim();
  const kind = /\b(for|while|repeat|loop)\b/i.test(input)
    ? 'loop'
    : /\b(if|else|when|condition|collid|hit)\b/i.test(input)
      ? 'condition'
      : /\b(let|const|var|variable|score|speed|size)\b/i.test(input)
        ? 'variable'
        : 'output';
  return {
    language: language.name,
    output: input,
    reasoning: language.explain[kind],
    concept: kind,
    glossary: language.words,
  };
}

function element(tag, text = '', className = '') {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function addLearningStyles() {
  if (document.getElementById('legacy-learning-styles')) return;
  const style = element('style');
  style.id = 'legacy-learning-styles';
  style.textContent = `
    .learning-tools-row,.learning-module-toolbar,.legacy-chat-audience,.legacy-phonetics-controls,.legacy-voice-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
    .learning-tools-row{margin-top:16px}
    .legacy-chat-audience,.legacy-phonetics-controls{padding:12px;border:1px solid #dce8df;border-radius:14px;background:#f8fcf9}
    .legacy-chat-audience label,.legacy-phonetics-controls label{display:grid;gap:5px;font-weight:700}
    .legacy-chat-audience select,.legacy-phonetics-controls select{min-height:44px;padding:8px 12px;border:1px solid #9aada0;border-radius:10px;background:#fff;color:#183324;font:inherit}
    .legacy-learning-panel{margin-top:18px;padding:20px;border:1px solid #dce8df;border-radius:20px;background:#fff}
    .legacy-learning-panel canvas{display:block;width:100%;height:150px;margin:12px 0;border:1px solid #dce8df;border-radius:12px;background:#f7fbf8}
    .legacy-learning-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:12px;margin-top:16px}
    .legacy-learning-card{min-height:72px;padding:12px;border:1px solid #dce8df;border-radius:12px;background:#fff;text-align:left;color:#183324;font:inherit;cursor:pointer}
    .legacy-learning-card:hover,.legacy-learning-card:focus-visible{border-color:#168344;outline:2px solid #168344;outline-offset:2px}
    .legacy-learning-detail,.legacy-learning-feedback{margin-top:12px;padding:12px;border-radius:12px;background:#f2f8f3;color:#193626;line-height:1.55}
    .legacy-chat-audience{margin-bottom:14px}
    .legacy-chat-audience label{flex:1 1 155px}
    .legacy-phonetics-controls{justify-content:space-between}
    .legacy-phonetics-tabs button[aria-pressed="true"]{background:#1b4332;color:#fff}
    .legacy-story-note{padding:12px;border-left:3px solid #2d8a4e;background:#f7fbf8}
    @media(max-width:600px){.legacy-learning-panel{padding:14px}.legacy-learning-panel .toolbar button{min-height:44px}}
  `;
  document.head.append(style);
}

function appendDetails(container, label, value) {
  const paragraph = element('p');
  const strong = element('strong', `${label}: `);
  paragraph.append(strong, document.createTextNode(value));
  container.append(paragraph);
}

function createToneCanvas(canvas, tones, samples = []) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.strokeStyle = '#d7e8dc';
  context.lineWidth = 1;
  [24, 72, 120, 168].forEach((y) => {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  });
  context.fillStyle = '#52675a';
  context.font = '12px system-ui';
  context.fillText('Higher pitch', 8, 18);
  context.fillText('Lower pitch', 8, height - 8);

  const toneY = { H: 34, M: 88, L: 142 };
  if (tones.length > 1) {
    context.strokeStyle = '#087c38';
    context.lineWidth = 3;
    context.beginPath();
    tones.forEach((tone, index) => {
      const x = 70 + index / (tones.length - 1) * (width - 90);
      const y = toneY[tone] || toneY.M;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }

  if (samples.length > 1) {
    const sorted = [...samples].sort((a, b) => a - b);
    const baseline = sorted[Math.floor(sorted.length / 2)];
    context.strokeStyle = '#e58a00';
    context.lineWidth = 2;
    context.beginPath();
    samples.forEach((pitch, index) => {
      const x = 70 + index / (samples.length - 1) * (width - 90);
      const semitones = 12 * Math.log2(pitch / baseline);
      const y = Math.max(12, Math.min(height - 12, 88 - semitones * 14));
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function detectPitch(buffer, sampleRate) {
  let energy = 0;
  for (const sample of buffer) energy += sample * sample;
  if (Math.sqrt(energy / buffer.length) < 0.015) return null;

  const minLag = Math.floor(sampleRate / 420);
  const maxLag = Math.min(Math.floor(sampleRate / 70), buffer.length - 1);
  let bestLag = 0;
  let bestCorrelation = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let index = 0; index < buffer.length - lag; index += 1) {
      correlation += buffer[index] * buffer[index + lag];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }
  return bestLag ? sampleRate / bestLag : null;
}

function buildSyllableTonePattern(phrase, language) {
  if (!['Yorùbá', 'Igbo'].includes(language)) return [];
  return [...String(phrase).normalize('NFD').matchAll(TONE_VOWELS)]
    .map((match) => match[3] === '\u0301' ? 'H' : match[3] === '\u0300' ? 'L' : 'M');
}

function createVoiceMirror(language, getPhrase) {
  const panel = element('section', '', 'legacy-learning-panel');
  panel.id = 'voiceMirrorPanel';
  panel.setAttribute('aria-labelledby', 'legacy-voice-heading');
  panel.append(
    element('p', 'VOICE & TONE PRACTICE · MICROPHONE ANALYSIS STAYS ON THIS DEVICE', 'muted'),
    element('h2', 'Local pitch mirror', ''),
    element('p', 'Record a short practice phrase to compare your pitch contour. Audio is not saved or sent by this exercise; feedback is an estimate, not a pronunciation score.'),
  );
  panel.querySelector('h2').id = 'legacy-voice-heading';
  const profile = element('p', 'Pitch baseline: not calibrated', 'muted');
  profile.id = 'voiceProfileBadge';
  const breakdown = element('div', '', 'legacy-learning-feedback');
  breakdown.id = 'syllableBreakdown';
  const canvas = element('canvas');
  canvas.id = 'toneCanvas';
  canvas.width = 700;
  canvas.height = 180;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Pitch contour guide; green is the estimated target and orange is your recorded contour');
  const controls = element('div', '', 'toolbar legacy-voice-controls');
  const recordButton = element('button', 'Record target phrase (10 seconds max)');
  recordButton.type = 'button';
  recordButton.className = 'primary';
  recordButton.id = 'vmRecordBtn';
  const playButton = element('button', 'Hear target tones in my register');
  playButton.type = 'button';
  const feedback = element('p', 'Choose Record and say the current lesson phrase. Microphone access is requested only after you press the button.', 'legacy-learning-feedback');
  feedback.id = 'vmFeedback';
  feedback.setAttribute('aria-live', 'polite');
  controls.append(recordButton, playButton);
  panel.append(profile, breakdown, canvas, controls, feedback);

  let context;
  let stream;
  let analyser;
  let timer;
  let samples = [];
  let baseline = 195;
  let recording = false;

  function currentLanguage() {
    return language();
  }

  function render() {
    const phrase = getPhrase();
    const lang = currentLanguage();
    const tones = buildSyllableTonePattern(phrase, lang);
    breakdown.textContent = tones.length
      ? `Estimated spelling cues: ${tones.map((tone, index) => `syllable ${index + 1} ${tone}`).join(' · ')}`
      : getPronunciationGuide(phrase, lang);
    createToneCanvas(canvas, tones);
  }

  function finishRecording() {
    if (timer) window.clearInterval(timer);
    timer = null;
    recording = false;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    if (context && context.state !== 'closed') void context.close();
    context = null;
    recordButton.textContent = 'Record target phrase (10 seconds max)';
    if (!samples.length) {
      feedback.textContent = 'No steady voice pitch was detected. Try again in a quiet place and speak at a comfortable volume.';
      return;
    }
    baseline = median(samples);
    baselineForPlayback = baseline;
    profile.textContent = `Pitch baseline: approximately ${Math.round(baseline)} Hz`;
    const phrase = getPhrase();
    const tones = buildSyllableTonePattern(phrase, currentLanguage());
    createToneCanvas(canvas, tones, samples);
    if (tones.length < 2) {
      feedback.textContent = getPronunciationGuide(phrase, currentLanguage());
      return;
    }
    const target = tones.map((tone) => ({ H: 2, M: 0, L: -2 })[tone] || 0);
    const aligned = target.map((_, index) => samples[Math.round(index * (samples.length - 1) / (target.length - 1))]);
    const userMedian = median(aligned);
    const errors = aligned.map((pitch, index) => {
      const actual = 12 * Math.log2(pitch / userMedian);
      return Math.abs(actual - target[index]);
    });
    const averageError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    feedback.textContent = averageError < 2
      ? 'Your recorded pitch followed the reference contour closely. Keep the vowels clear and practise at a comfortable pitch.'
      : 'You recorded a clear contour. Try matching each syllable’s relative rise or fall more slowly; this local estimate is not a fluency score.';
  }

  recordButton.addEventListener('click', async () => {
    if (recording) {
      finishRecording();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) {
      feedback.textContent = 'Local pitch analysis is unavailable in this browser. You can still use the text pronunciation guide.';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      context = new window.AudioContext();
      const source = context.createMediaStreamSource(stream);
      analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      samples = [];
      recording = true;
      recordButton.textContent = 'Stop recording';
      feedback.textContent = 'Listening… say the displayed lesson phrase, then stop.';
      const sample = () => {
        if (!recording || !analyser || !context) return;
        analyser.getFloatTimeDomainData(buffer);
        const pitch = detectPitch(buffer, context.sampleRate);
        if (pitch && pitch >= 70 && pitch <= 420) samples.push(pitch);
      };
      timer = window.setInterval(sample, 80);
      window.setTimeout(() => {
        if (recording) finishRecording();
      }, 10_000);
    } catch (error) {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      stream = null;
      recording = false;
      recordButton.textContent = 'Record target phrase (10 seconds max)';
      feedback.textContent = error?.name === 'NotAllowedError'
        ? 'Microphone permission was denied. Allow microphone access in browser settings, or use the text pronunciation guide.'
        : `Microphone recording could not start: ${error instanceof Error ? error.message : 'unknown browser error'}`;
    }
  });

  playButton.addEventListener('click', () => {
    if (!window.AudioContext) {
      feedback.textContent = 'Tone playback is unavailable in this browser.';
      return;
    }
    const lang = currentLanguage();
    const tones = buildSyllableTonePattern(getPhrase(), lang);
    if (!tones.length) {
      feedback.textContent = getPronunciationGuide(getPhrase(), lang);
      return;
    }
    try {
      const audio = new window.AudioContext();
      const start = audio.currentTime;
      const scale = { L: 0.84, M: 1, H: 1.2 };
      tones.forEach((tone, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(baseline * scale[tone], start + index * 0.28);
        gain.gain.setValueAtTime(0.001, start + index * 0.28);
        gain.gain.exponentialRampToValueAtTime(0.08, start + index * 0.28 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, start + (index + 1) * 0.28);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(start + index * 0.28);
        oscillator.stop(start + (index + 1) * 0.28);
      });
      feedback.textContent = `Playing the spelling-derived tone guide around your ${Math.round(baseline)} Hz baseline.`;
      window.setTimeout(() => { if (audio.state !== 'closed') void audio.close(); }, tones.length * 300 + 100);
    } catch (error) {
      feedback.textContent = `Tone playback failed: ${error instanceof Error ? error.message : 'audio device error'}`;
    }
  });

  return { element: panel, render };
}

export function initializeLegacyLearningExperience(bindings) {
  if (!bindings || typeof bindings.getState !== 'function') {
    throw new TypeError('Legacy language-learning state is unavailable.');
  }
  addLearningStyles();
  const state = () => bindings.getState();
  const langName = () => state().lang;
  const languageCode = () => ({ Yorùbá: 'yo', Igbo: 'ig', Hausa: 'ha', Swahili: 'sw' })[langName()] || 'yo';
  const entries = () => bindings.data?.[langName()] || bindings.data?.Yorùbá || [];
  const currentPhrase = () => entries()[state().stage]?.[0] || entries()[0]?.[0] || '';

  function addNavButtons() {
    const row = document.querySelector('#learning > .row');
    if (!row || row.querySelector('[data-open-phonetics]')) return;
    const button = element('button', 'Sounds & Vowels');
    button.type = 'button';
    button.className = 'secondary';
    button.dataset.openPhonetics = 'true';
    button.addEventListener('click', () => window.go('phoneticsLab'));
    row.append(button);
    const academy = document.querySelector('#academy .labTop');
    if (academy && !academy.querySelector('[data-open-phonetics]')) {
      const link = button.cloneNode(true);
      link.addEventListener('click', () => window.go('phoneticsLab'));
      academy.append(link);
    }
  }

  function mountChat() {
    const panel = document.querySelector('#aiChat .labPanel');
    const log = document.getElementById('chatLog');
    const input = document.getElementById('chatInput');
    if (!panel || !log || !input || panel.dataset.enhanced === 'true') return;
    panel.dataset.enhanced = 'true';
    const audience = element('div', '', 'legacy-chat-audience');
    for (const [id, label, options, selected] of [
      ['legacy-ai-language', 'Learning language', Object.keys(bindings.data), langName()],
      ['legacy-ai-level', 'Learning level', ['Elementary', 'Intermediate', 'Advanced'], state().level],
      ['legacy-ai-age', 'Age group', ['3–5', '6–8', '9–12', '13–17', '18+'], state().age],
    ]) {
      const field = element('label', label);
      const select = element('select');
      select.id = id;
      options.forEach((value) => {
        const option = element('option', value);
        option.value = value;
        option.selected = value === selected;
        select.append(option);
      });
      field.append(select);
      audience.append(field);
      select.addEventListener('change', () => {
        if (id === 'legacy-ai-language') bindings.setLanguage(select.value);
        if (id === 'legacy-ai-level') bindings.setLevel(select.value);
        if (id === 'legacy-ai-age') bindings.setAge(select.value);
        resetChat();
      });
    }
    panel.insertBefore(audience, log);
    const oldControls = input.closest('.chatControls');
    if (oldControls) {
      const form = element('form', '', 'chatControls');
      form.setAttribute('aria-label', 'Ask the language tutor');
      oldControls.replaceWith(form);
      [...oldControls.childNodes].forEach((child) => form.append(child));
      input.removeAttribute('onkeydown');
      input.setAttribute('aria-label', 'Ask the language tutor');
      const send = form.querySelector('button');
      if (send) {
        send.type = 'submit';
        send.removeAttribute('onclick');
      }
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        sendChat();
      });
    }
    document.querySelectorAll('#aiChat .toolbar button').forEach((button) => {
      button.removeAttribute('onclick');
      const prompt = button.textContent.trim();
      button.addEventListener('click', () => sendChat(prompt));
    });
    resetChat();
  }

  function resetChat() {
    const log = document.getElementById('chatLog');
    if (!log) return;
    log.replaceChildren();
    addBubble(`Hello! I am Ìjìròrò, your ${langName()} learning guide. Your explanations are set to ${state().level} for ages ${state().age}. Try asking about sounds, tones, a phrase, culture, or code.`);
  }

  function addBubble(text, mine = false) {
    const log = document.getElementById('chatLog');
    if (!log) return;
    const bubble = element('div', text, `chatBubble${mine ? ' mine' : ''}`);
    bubble.style.whiteSpace = 'pre-wrap';
    log.append(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function sendChat(customText) {
    const input = document.getElementById('chatInput');
    const value = String(customText ?? input?.value ?? '').trim();
    if (!value) return;
    addBubble(value, true);
    if (input) input.value = '';
    const normalized = normalizeLearningText(value);
    const topic = /vowel|nasal|consonant|gb|kp|digraph/.test(normalized)
      ? 'sounds'
      : /tone|pitch|stress|pronounc|voice/.test(normalized)
        ? 'tones'
        : /culture|heritage|story|proverb|respect/.test(normalized)
          ? 'culture'
          : /code|loop|variable|condition|program|computer/.test(normalized)
            ? 'code'
            : 'language';
    const langData = entries();
    const found = langData.find((entry) => normalizeLearningText(entry[0]) === normalized
      || normalizeLearningText(entry[1]) === normalized
      || normalized.includes(normalizeLearningText(entry[1])));
    const phrase = found || langData[state().stage] || langData[0];
    if (!phrase) {
      addBubble('There is no reviewed phrase available for this language yet. Please choose another language or ask a fluent speaker to review a phrase.');
      return;
    }
    let learningNote = 'This is an introductory phrasebook example; usage can vary by family and region.';
    let followUp = `Can you say “${phrase[0]}” aloud?`;
    if (topic === 'sounds') {
      const info = PHONETICS[langName()] || PHONETICS.Swahili;
      learningNote = `Sound practice: ${info.consonants[0][1]} Check the Sounds & Vowels lab for the selected language.`;
      followUp = 'Which sound would you like to practise first?';
    } else if (topic === 'tones') {
      learningNote = getPronunciationGuide(phrase[0], langName());
      followUp = 'Would you like to listen and repeat the phrase slowly?';
    } else if (topic === 'culture') {
      learningNote = 'Respectful greetings and etiquette vary by community; this example is not a substitute for local guidance.';
      followUp = 'What respectful greeting do people use in your community?';
    } else if (topic === 'code') {
      const explanation = explainCode(value, languageCode());
      learningNote = `${explanation.reasoning} Technical terms are descriptive teaching equivalents, not programming keywords.`;
      followUp = 'Would you like to try a variable, condition, or loop next?';
    }
    const short = ['3–5', '6–8'].includes(state().age);
    const response = [
      `Target phrase: ${phrase[0]}`,
      `Pronunciation / tone: ${getPronunciationGuide(phrase[0], langName())}`,
      `English meaning: ${phrase[1]}`,
      `Grammar / cultural note: ${learningNote}`,
      `Your turn: ${short ? 'Can you repeat it?' : followUp}`,
    ].join('\n');
    addBubble(response);
  }

  function mountTranslator() {
    const source = document.getElementById('source');
    const target = document.getElementById('target');
    if (!source || !target || source.dataset.enhanced === 'true') return;
    source.dataset.enhanced = 'true';
    let details = document.getElementById('studioDetails');
    if (!details) {
      details = element('div', '', 'legacy-learning-detail');
      details.id = 'studioDetails';
      details.setAttribute('aria-live', 'polite');
      target.parentElement.append(details);
    }
    window.translateText = () => {
      const selection = document.getElementById('studioLang')?.value || langName();
      const text = source.value;
      const result = translateCuratedText({
        text,
        entries: bindings.data?.[selection] || [],
        language: selection,
        reverse: Boolean(state().reverse),
      });
      target.value = result.translated || (result.status === 'Not found' ? 'No curated match yet.' : '');
      details.replaceChildren();
      appendDetails(details, 'Status', result.status === 'Not found' ? 'Not found · no translation invented' : result.status);
      if (result.gloss.length) {
        appendDetails(details, 'Word-by-word gloss', result.gloss.map((item) => `${item.source} → ${item.target}`).join(' · '));
      }
      if (result.translated) appendDetails(details, 'Pronunciation / tone', getPronunciationGuide(result.translated, state().reverse ? selection : 'English'));
      const message = document.getElementById('studioMsg');
      if (message) {
        message.textContent = result.status === 'Composed'
          ? 'Composed from a basic sentence pattern and phrasebook vocabulary. Ask a fluent speaker to review natural phrasing.'
          : result.status === 'Word-by-word gloss'
            ? `Glossed ${result.matchedCount} word(s); this is not a natural sentence translation.`
            : result.status === 'Not found'
              ? 'Only curated phrases and labelled grammar patterns are translated offline.'
              : result.status === 'Curated'
                ? 'Curated phrasebook match. Please verify pronunciation and usage with a fluent speaker.'
                : 'Enter a phrase from the curated phrasebook.';
      }
    };
    source.addEventListener('input', window.translateText);
    const originalRenderStudio = window.renderStudio;
    if (typeof originalRenderStudio === 'function') {
      window.renderStudio = function (...args) {
        const result = originalRenderStudio.apply(this, args);
        window.translateText();
        return result;
      };
    }
    const originalSwap = window.swap;
    if (typeof originalSwap === 'function') {
      window.swap = function (...args) {
        const result = originalSwap.apply(this, args);
        window.translateText();
        return result;
      };
    }
    window.translateText();
  }

  function mountCodeReasoning() {
    const input = document.getElementById('codeMessage');
    const output = document.getElementById('codeResult');
    const language = document.getElementById('academyLanguage');
    if (!input || !output || input.dataset.reasoningReady === 'true') return;
    input.dataset.reasoningReady = 'true';
    const button = input.parentElement?.querySelector('button.primary');
    if (button) button.removeAttribute('onclick');
    window.runIdilewaCode = () => {
      const result = explainCode(input.value, language?.value || 'yo');
      const trace = result.output ? `1. Read the message: “${result.output}”.\n2. Display it as the program output.` : 'No message was provided, so the program has nothing to display.';
      output.textContent = [
        `Output: ${result.output}`,
        `Execution trace:\n${trace}`,
        `English reasoning: The program reads the message value and displays it. The input field is a safe demonstration, not executable source code.`,
        `${result.language} reasoning: ${result.reasoning}`,
        `Coding words: ${result.glossary.map(([english, native]) => `${english} — ${native}`).join(' · ')}`,
      ].join('\n\n');
    };
    button?.addEventListener('click', window.runIdilewaCode);
    language?.addEventListener('change', window.runIdilewaCode);
  }

  function mountPhonetics() {
    if (document.getElementById('phoneticsLab')) return document.getElementById('phoneticsLab');
    const main = document.querySelector('main');
    if (!main) return null;
    const section = element('section', '', 'hidden');
    section.id = 'phoneticsLab';
    const header = element('div', '', 'labTop');
    const title = element('h1', 'Vowel, Consonant & Tone Lab');
    const back = element('button', '← Back to Academy', 'secondary');
    back.type = 'button';
    back.addEventListener('click', () => window.go('academy'));
    header.append(title, back);
    const panel = element('div', '', 'panel');
    const controls = element('div', '', 'legacy-phonetics-controls');
    const label = element('label', 'Language');
    const select = element('select');
    select.id = 'phonLang';
    for (const lang of Object.keys(PHONETICS)) {
      const option = element('option', lang);
      option.value = lang === 'Swahili' ? 'Swahili' : lang;
      option.selected = option.value === langName();
      select.append(option);
    }
    label.append(select);
    const tabs = element('div', '', 'legacy-phonetics-tabs');
    let activeTab = 'vowels';
    const grid = element('div', '', 'legacy-learning-grid');
    const detail = element('div', 'Choose a sound card for articulation guidance.', 'legacy-learning-detail');
    detail.id = 'phonDetail';
    detail.setAttribute('aria-live', 'polite');
    const intro = element('p', '', 'muted');
    intro.id = 'phonIntro';
    for (const tab of ['vowels', 'consonants', 'tones']) {
      const button = element('button', tab === 'tones' ? 'Tone contrasts' : `${tab[0].toUpperCase()}${tab.slice(1)}`, 'secondary');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(tab === activeTab));
      button.addEventListener('click', () => { activeTab = tab; render(); });
      tabs.append(button);
    }
    controls.append(label, tabs);
    panel.append(controls, intro, grid, detail);
    section.append(header, panel);
    main.append(section);

    function render() {
      const selectedLanguage = select.value;
      const information = PHONETICS[selectedLanguage] || PHONETICS.Swahili;
      intro.textContent = selectedLanguage === 'Yorùbá'
        ? 'Yorùbá has seven oral vowels, nasal vowels, and three lexical tones.'
        : selectedLanguage === 'Igbo'
          ? 'Igbo vowel harmony and tone patterns vary across dialects.'
          : selectedLanguage === 'Hausa'
            ? 'Hausa distinguishes short and long vowels; tone is not consistently shown in everyday spelling.'
            : 'Kiswahili has five vowels and predictable penultimate stress, not lexical tone.';
      grid.replaceChildren();
      document.querySelectorAll('.legacy-phonetics-tabs button').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.textContent.toLowerCase().startsWith(activeTab === 'tones' ? 'tone' : activeTab)));
      });
      (information[activeTab] || []).forEach(([symbol, guidance]) => {
        const card = element('button', '', 'legacy-learning-card');
        card.type = 'button';
        card.append(element('strong', symbol), element('p', guidance, 'muted'));
        card.addEventListener('click', () => {
          detail.textContent = `${symbol}: ${guidance}`;
          if (activeTab === 'tones') voiceMirror?.playPhrase(symbol, selectedLanguage);
        });
        grid.append(card);
      });
    }
    select.addEventListener('change', render);
    render();
    return section;
  }

  function mountHeritage() {
    const panel = document.querySelector('#heritageLab .labPanel');
    if (!panel || panel.dataset.enhanced === 'true') return;
    panel.dataset.enhanced = 'true';
    const language = element('select');
    language.id = 'heritageLanguage';
    language.setAttribute('aria-label', 'Heritage learning language');
    Object.keys(bindings.data).forEach((name) => {
      const option = element('option', name);
      option.value = name;
      language.append(option);
    });
    language.value = langName();
    const languageLabel = element('label', 'Learning language');
    languageLabel.append(language);
    const originalStory = 'A child sees an elderly neighbour carrying a heavy basket. The child offers to help, and they walk home together. The neighbour thanks the child for being thoughtful.';
    const phraseByLanguage = {
      'Yorùbá': ['Ẹ jọ̀ọ́', 'Please'],
      Igbo: ['Biko', 'Please'],
      Hausa: ['Don Allah', 'Please'],
      Swahili: ['Tafadhali', 'Please'],
    };
    const noteByLanguage = {
      'Yorùbá': 'Respectful greetings and address forms depend on age, relationship, and local practice.',
      Igbo: 'Hospitality customs vary among Igbo communities; ask a knowledgeable community member for context.',
      Hausa: 'Greeting forms can vary by time, relationship, and local custom.',
      Swahili: 'Greeting forms vary across regions and relationships; Shikamoo/Marahaba has context-specific use.',
    };
    const title = element('h2', 'The Helpful Neighbour');
    const sourceLabel = element('span', 'Original classroom story · not a traditional folktale', 'muted');
    const story = element('p', originalStory);
    const bilingual = element('p', '', 'legacy-story-note');
    const literal = element('p');
    const cultural = element('p');
    const vocabulary = element('p');
    const question = element('h3', 'What did the child show?');
    const choices = element('div', '', 'heritageChoices');
    const result = element('div', 'Choose an answer.', 'labResult');
    result.setAttribute('aria-live', 'polite');
    ['Impatience', 'Kindness', 'Dishonesty'].forEach((choice, index) => {
      const button = element('button', choice);
      button.type = 'button';
      button.addEventListener('click', () => {
        result.textContent = index === 1
          ? `Correct! Helping shows kindness. ${noteByLanguage[language.value]}`
          : `Not quite. The helpful action shows kindness and care for a neighbour. ${noteByLanguage[language.value]}`;
      });
      choices.append(button);
    });
    function render() {
      const name = language.value;
      const [phrase, meaning] = phraseByLanguage[name];
      bilingual.textContent = `Key phrase: ${phrase} — ${meaning}. The story itself remains in English because a reviewed, fluent translation is not available in this demonstration.`;
      literal.textContent = `Phrase meaning: “${meaning}”. No proverb is attributed to this original story.`;
      cultural.textContent = `Cultural note: ${noteByLanguage[name]}`;
      vocabulary.textContent = `Key vocabulary: ${phrase} · ${meaning}. Pronunciation should be checked with a fluent speaker.`;
      result.textContent = 'Choose an answer.';
    }
    language.addEventListener('change', render);
    panel.replaceChildren(languageLabel, sourceLabel, title, story, bilingual, literal, cultural, vocabulary, question, choices, result);
    render();
  }

  const voiceMirror = createVoiceMirror(langName, currentPhrase);
  const learning = document.getElementById('learning');
  const lesson = learning?.querySelector('.lesson');
  if (lesson && !document.getElementById('voiceMirrorPanel')) lesson.after(voiceMirror.element);
  addNavButtons();
  mountChat();
  mountTranslator();
  mountCodeReasoning();
  mountPhonetics();
  mountHeritage();
  voiceMirror.render();

  const originalGo = window.go;
  if (typeof originalGo === 'function') {
    window.go = function (id, ...args) {
      if (id === 'phoneticsLab') {
        document.querySelectorAll('main>section').forEach((section) => section.classList.add('hidden'));
        document.getElementById('phoneticsLab')?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const result = originalGo.call(this, id, ...args);
      if (id === 'learning') voiceMirror.render();
      if (id === 'studio') window.translateText?.();
      return result;
    };
  }
  window.IdilewaVoice = {
    playPhrase(phrase, language = langName()) {
      const tones = buildSyllableTonePattern(phrase, language);
      if (tones.length < 2 || !window.AudioContext) return;
      try {
        const audio = new window.AudioContext();
        const start = audio.currentTime;
        const scale = { L: 0.84, M: 1, H: 1.2 };
        tones.forEach((tone, index) => {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          oscillator.frequency.setValueAtTime(baselineForPlayback, start + index * 0.25);
          oscillator.frequency.linearRampToValueAtTime(baselineForPlayback * scale[tone], start + index * 0.25 + 0.04);
          gain.gain.setValueAtTime(0.001, start + index * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.07, start + index * 0.25 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, start + (index + 1) * 0.25);
          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.start(start + index * 0.25);
          oscillator.stop(start + (index + 1) * 0.25);
        });
        window.setTimeout(() => { if (audio.state !== 'closed') void audio.close(); }, tones.length * 260 + 100);
      } catch (error) {
        const feedback = document.getElementById('vmFeedback');
        if (feedback) feedback.textContent = `Tone playback failed: ${error instanceof Error ? error.message : 'audio device error'}`;
      }
    },
    syncWithCurrentLesson: voiceMirror.render,
    toggleRecord: () => document.getElementById('vmRecordBtn')?.click(),
  };
  window.recordDemo = () => {
    document.getElementById('voiceMirrorPanel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.IdilewaVoice.toggleRecord();
  };
  window.chatPrompt = sendChat;
  window.sendIdilewaChat = () => sendChat();
}

let baselineForPlayback = 195;

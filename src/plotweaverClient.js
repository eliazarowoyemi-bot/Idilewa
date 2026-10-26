function getApiBase() {
  const configured = import.meta.env?.VITE_PLOTWEAVER_API_BASE_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined'
    && (window.location.hostname.endsWith('.github.io')
      || window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1')) {
    return 'https://www.idilewa.com';
  }
  return '';
}

function endpoint(path) {
  return `${getApiBase()}/api/plotweaver/${path}`;
}

async function responseError(response) {
  let result;
  try {
    result = await response.json();
  } catch {
    result = null;
  }
  return new Error(result?.error || `Idilewa voice service request failed (${response.status}).`);
}

export async function getPlotweaverLanguages(service) {
  const query = service ? `?service=${encodeURIComponent(service)}` : '';
  const response = await fetch(endpoint(`languages${query}`), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await responseError(response);
  const languages = await response.json();
  if (!Array.isArray(languages)) throw new Error('Idilewa voice service returned an invalid language list.');
  return languages.filter((language) => typeof language?.code === 'string'
    && typeof language?.name === 'string'
    && Array.isArray(language?.services));
}

export async function getPlotweaverVoices({ language, type } = {}) {
  const query = new URLSearchParams();
  if (language) query.set('language', language);
  if (type) query.set('type', type);
  const suffix = query.size ? `?${query}` : '';
  const response = await fetch(endpoint(`voices${suffix}`), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw await responseError(response);
  const voices = await response.json();
  if (!Array.isArray(voices)) throw new Error('Idilewa voice service returned an invalid voice list.');
  return voices.filter((voice) => typeof voice?.voice_id === 'string'
    && typeof voice?.name === 'string');
}

export async function synthesizePlotweaverSpeech({ text, language, voiceId }) {
  const response = await fetch(endpoint('speech'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
    body: JSON.stringify({
      text,
      language,
      ...(voiceId ? { voice_id: voiceId } : {}),
    }),
  });
  if (!response.ok) throw await responseError(response);
  return response.blob();
}

export function speakWithDeviceVoice(text, language) {
  const voiceWindow = typeof window === 'undefined' ? null : window;
  if (!voiceWindow?.speechSynthesis
    || typeof voiceWindow.SpeechSynthesisUtterance !== 'function') {
    return Promise.reject(new Error('Device speech is not available in this browser.'));
  }

  const utterance = new voiceWindow.SpeechSynthesisUtterance(text);
  utterance.lang = language;
  return new Promise((resolve, reject) => {
    utterance.onend = resolve;
    utterance.onerror = (event) => reject(new Error(
      `Device speech could not play this phrase${event?.error ? ` (${event.error})` : ''}.`,
    ));
    try {
      voiceWindow.speechSynthesis.cancel();
      voiceWindow.speechSynthesis.speak(utterance);
    } catch (error) {
      reject(error);
    }
  });
}

export async function translateWithPlotweaver({ text, sourceLanguage, targetLanguage }) {
  const response = await fetch(endpoint('translations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      text,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    }),
  });
  if (!response.ok) throw await responseError(response);
  const result = await response.json();
  if (typeof result?.translated_text !== 'string' || !result.translated_text.trim()) {
    throw new Error('Idilewa voice service returned no translated text.');
  }
  return result;
}

export async function transcribeWithPlotweaver(audio, language) {
  const formData = new FormData();
  const extension = audio.type.includes('ogg') ? 'ogg'
    : audio.type.includes('mp4') ? 'm4a'
      : audio.type.includes('wav') ? 'wav'
        : 'webm';
  formData.append('file', audio, `voice-practice.${extension}`);
  formData.append('language', language);
  const response = await fetch(endpoint('transcriptions'), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });
  if (!response.ok) throw await responseError(response);
  const result = await response.json();
  if (typeof result?.text !== 'string') throw new Error('Idilewa voice service returned no transcription.');
  return result;
}

export async function createPlotweaverVoice(formData) {
  const response = await fetch(endpoint('voices'), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });
  if (!response.ok) throw await responseError(response);
  return response.json();
}

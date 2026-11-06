/* Idilewa STEM Studio — audio engine.
 * Web Audio oscillators stand in for the three Yorùbá tones (no network assets),
 * plus a mic meter / spectrogram painter and a MediaRecorder wrapper. */

let ctx = null;

export function audioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export const TONES = {
  high: { id: 'high', label: 'Dò', accent: 'High tone', freq: 330, hue: '#f59e0b' },
  mid: { id: 'mid', label: 'Re', accent: 'Mid tone', freq: 233, hue: '#136443' },
  low: { id: 'low', label: 'Mi', accent: 'Low tone', freq: 165, hue: '#6366f1' },
  rising: { id: 'rising', label: 'Dò–Re', accent: 'Rising glide', freq: 233, to: 330, hue: '#ea580c' },
  falling: { id: 'falling', label: 'Re–Mi', accent: 'Falling glide', freq: 300, to: 175, hue: '#a21caf' },
};

export function toneById(id) {
  return TONES[id] || TONES.mid;
}

/**
 * Play a single tone. Resolves when the tone ends.
 */
export function playTone({ freq = 233, to = null, duration = 0.62, type = 'sine', gain = 0.14, when = 0 } = {}) {
  const audio = audioContext();
  if (!audio) return Promise.resolve();
  const start = audio.currentTime + when;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.04);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.04);
  return new Promise((resolve) => window.setTimeout(resolve, (when + duration) * 1000));
}

export function playToneId(id, options = {}) {
  const tone = toneById(id);
  return playTone({ freq: tone.freq, to: tone.to || null, ...options });
}

/** Play an ordered list of tone ids as a melodic phrase. */
export async function playSequence(ids, { gap = 90, duration = 0.5 } = {}) {
  let elapsed = 0;
  ids.forEach((id) => {
    const tone = toneById(id);
    playTone({ freq: tone.freq, to: tone.to || null, duration, when: elapsed });
    elapsed += duration + gap / 1000;
  });
  await new Promise((resolve) => window.setTimeout(resolve, elapsed * 1000));
}

export function haptic(pattern = 12) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* unsupported */ }
  }
}

/** Device speech for phrase pronunciation (falls back silently). */
export function speak(text, lang = 'yo-NG') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve(false);
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.92;
    utterance.pitch = 1.02;
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

/* ------------------------------- microphone -------------------------------- */

export class MicMeter {
  constructor() {
    this.stream = null;
    this.analyser = null;
    this.data = null;
    this.error = '';
  }

  get active() {
    return Boolean(this.stream);
  }

  async start() {
    if (this.stream) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error = 'This browser cannot access the microphone.';
      return false;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const audio = audioContext();
      if (!audio) throw new Error('Audio is unavailable.');
      const source = audio.createMediaStreamSource(this.stream);
      this.analyser = audio.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.75;
      source.connect(this.analyser);
      this.data = new Uint8Array(this.analyser.frequencyBinCount);
      this.error = '';
      return true;
    } catch (error) {
      this.error = error?.name === 'NotAllowedError'
        ? 'Microphone permission was declined. You can still practise by tapping the tone keys.'
        : 'Microphone is unavailable — tap the tone keys instead.';
      this.stream = null;
      return false;
    }
  }

  levels(count = 28) {
    if (!this.analyser || !this.data) return Array.from({ length: count }, () => 4 + Math.random() * 6);
    this.analyser.getByteFrequencyData(this.data);
    const step = Math.floor(this.data.length / count) || 1;
    return Array.from({ length: count }, (_, index) => {
      const slice = this.data.slice(index * step, index * step + step);
      const avg = slice.reduce((sum, value) => sum + value, 0) / (slice.length || 1);
      return Math.max(4, (avg / 255) * 32);
    });
  }

  stop() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.analyser = null;
    this.data = null;
  }
}

export class VoiceRecorder {
  constructor(meter) {
    this.meter = meter;
    this.recorder = null;
    this.chunks = [];
    this.url = '';
  }

  get recording() {
    return this.recorder?.state === 'recording';
  }

  async start() {
    const ready = await this.meter.start();
    if (!ready || typeof MediaRecorder === 'undefined') return null;
    this.chunks = [];
    this.recorder = new MediaRecorder(this.meter.stream);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start();
    return this.recorder;
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        resolve('');
        return;
      }
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType || 'audio/webm' });
        if (this.url) URL.revokeObjectURL(this.url);
        this.url = URL.createObjectURL(blob);
        resolve(this.url);
      };
      this.recorder.stop();
    });
  }
}

/* -------------------------------- painting --------------------------------- */

export function paintWave(canvas, levels, { color = '#136443', dim = '#bfe3cd' } = {}) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 240;
  const height = canvas.clientHeight || 32;
  if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
  if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, width, height);
  const gap = 3;
  const barWidth = Math.max(2, (width - gap * (levels.length - 1)) / levels.length);
  levels.forEach((level, index) => {
    const barHeight = Math.min(height, Math.max(3, (level / 34) * height));
    g.fillStyle = index % 3 === 0 ? color : dim;
    const x = index * (barWidth + gap);
    const y = (height - barHeight) / 2;
    g.fillRect(x, y, barWidth, barHeight);
  });
}

export function paintSpectrogram(canvas, history, toneId = 'mid') {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 320;
  const height = canvas.clientHeight || 190;
  if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
  if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, width, height);

  g.strokeStyle = 'rgba(122, 217, 173, .13)';
  g.lineWidth = 1;
  for (let line = 0; line <= 4; line += 1) {
    const gy = (height / 4) * line;
    g.beginPath();
    g.moveTo(0, gy);
    g.lineTo(width, gy);
    g.stroke();
  }

  const tone = toneById(toneId);
  const targetY = height - (height * 0.78) * ((tone.freq - 120) / 260);

  g.lineWidth = 2.4;
  g.strokeStyle = tone.hue;
  g.beginPath();
  history.forEach((value, index) => {
    const x = (width / Math.max(1, history.length - 1)) * index;
    const wobble = Math.sin(index / 3.1) * 5 + (value - 0.4) * 20;
    const y = Math.max(8, Math.min(height - 8, targetY + wobble));
    if (index === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  });
  g.stroke();

  const grad = g.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(19, 100, 67, .18)');
  g.fillStyle = grad;
  g.fillRect(0, 0, width, height);

  g.fillStyle = 'rgba(234, 255, 242, .55)';
  g.font = '600 9px "Space Grotesk", sans-serif';
  g.fillText(`${tone.accent.toUpperCase()} · ${tone.freq} HZ`, 10, 16);
}



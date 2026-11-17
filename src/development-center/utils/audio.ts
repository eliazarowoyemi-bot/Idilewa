import { SoundAsset } from '../types/scratch';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function generateWaveform(preset: SoundAsset['preset']): number[] {
  const bars = 64;
  const result: number[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1);
    let amp = 0.2;
    if (preset === 'meow') {
      const env = Math.sin(Math.PI * Math.pow(t, 0.75));
      amp = env * (0.55 + 0.45 * Math.abs(Math.sin(i * 0.9)));
    } else if (preset === 'pop') {
      amp = Math.exp(-t * 7) * (0.7 + 0.3 * Math.cos(i * 1.4));
    } else if (preset === 'laser') {
      amp = (1 - t * 0.75) * (0.6 + 0.4 * Math.sin(i * 1.8));
    } else if (preset === 'chime') {
      amp = Math.exp(-t * 3.5) * (0.65 + 0.35 * Math.sin(i * 0.6));
    } else if (preset === 'drum') {
      amp = Math.exp(-t * 9) * (0.85 + 0.15 * Math.sin(i * 2.1));
    } else if (preset === 'boing') {
      amp = Math.sin(Math.PI * t) * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.2)));
    } else if (preset === 'coin') {
      amp = (t < 0.25 ? 0.85 : Math.exp(-(t - 0.25) * 4)) * (0.7 + 0.3 * Math.sin(i * 0.8));
    } else if (preset === 'bite') {
      amp = (t < 0.4 ? 0.9 : 0.15) * (0.6 + 0.4 * Math.abs(Math.cos(i * 2.5)));
    } else {
      amp = Math.sin(Math.PI * t) * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.5)));
    }
    result.push(Math.max(0.06, Math.min(1, amp)));
  }
  return result;
}

export function playSoundAsset(sound: SoundAsset): void {
  const ctx = getAudioContext();
  if (!ctx || sound.muted) return;

  const now = ctx.currentTime;
  const speed = Math.max(0.4, Math.min(2.5, sound.speedMultiplier || 1));
  const dur = Math.max(0.12, (sound.duration || 0.6) / speed);
  const vol = Math.max(0.03, Math.min(0.8, 0.28 * (sound.volumeMultiplier || 1)));

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(sound.robot ? 900 : 2800, now);

  gain.gain.setValueAtTime(0.001, now);

  if (sound.preset === 'meow') {
    osc.type = sound.robot ? 'square' : 'triangle';
    const startF = sound.reversed ? 380 : 520;
    const peakF = 760;
    const endF = sound.reversed ? 620 : 340;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(peakF, now + dur * 0.35);
    osc.frequency.exponentialRampToValueAtTime(endF, now + dur);
    gain.gain.linearRampToValueAtTime(vol, now + dur * (sound.fadeIn ? 0.45 : 0.1));
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else if (sound.preset === 'pop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(sound.reversed ? 260 : 480, now);
    osc.frequency.exponentialRampToValueAtTime(sound.reversed ? 720 : 180, now + dur);
    gain.gain.linearRampToValueAtTime(vol * 1.1, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else if (sound.preset === 'laser') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(sound.reversed ? 220 : 1100, now);
    osc.frequency.exponentialRampToValueAtTime(sound.reversed ? 1100 : 180, now + dur);
    gain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else if (sound.preset === 'chime') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174.66, now + dur * 0.35);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else if (sound.preset === 'drum') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + dur);
    gain.gain.linearRampToValueAtTime(vol * 1.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else if (sound.preset === 'coin') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + dur * 0.25);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else if (sound.preset === 'boing') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + dur * 0.5);
    osc.frequency.exponentialRampToValueAtTime(320, now + dur);
    gain.gain.linearRampToValueAtTime(vol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else if (sound.preset === 'bite') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + dur);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + dur);
    gain.gain.linearRampToValueAtTime(vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  }

  if (sound.fadeOut) {
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.85);
  }

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function playMidiNote(midi: number, beats = 0.25): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const dur = Math.max(0.08, Math.min(2, beats * 0.6));

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.24, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

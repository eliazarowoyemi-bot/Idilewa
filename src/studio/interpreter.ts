import { translateEnglish } from './translation';
import { synthesizePlotweaverSpeech } from '../plotweaverClient.js';
import type { BlockNode, InterpreterHooks, LanguageCode, SpriteState } from './types';

const MAX_LOOP_COUNT = 1000;
const MAX_WAIT_MS = 30_000;
let activeAudio: HTMLAudioElement | null = null;

function abortError(): DOMException {
  return new DOMException('Execution stopped', 'AbortError');
}

async function playAudioBlob(blob: Blob, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw abortError();
  activeAudio?.pause();
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio(objectUrl);
  activeAudio = audio;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      signal?.removeEventListener('abort', abort);
      audio.removeEventListener('ended', finish);
      audio.removeEventListener('error', fail);
      URL.revokeObjectURL(objectUrl);
      if (activeAudio === audio) activeAudio = null;
    };
    const finish = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error('The generated speech audio could not be played.')); };
    const abort = () => {
      audio.pause();
      cleanup();
      reject(abortError());
    };
    signal?.addEventListener('abort', abort, { once: true });
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', fail, { once: true });
    void audio.play().catch((error: unknown) => {
      cleanup();
      reject(error instanceof Error ? error : new Error('The generated speech audio could not be played.'));
    });
  });
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(new DOMException('Execution stopped', 'AbortError'));
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Execution stopped', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
  });
}

export type SpeechProvider = 'online' | 'device' | 'device-fallback';

export function speakText(text: string, language: LanguageCode, signal?: AbortSignal): Promise<SpeechProvider> {
  if (!text.trim()) return Promise.resolve('device');
  if (signal?.aborted) return Promise.reject(abortError());
  const hasDeviceSpeech = 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';
  if (hasDeviceSpeech) window.speechSynthesis.cancel();
  const deviceSpeech = () => new Promise<void>((resolve, reject) => {
    if (!hasDeviceSpeech) {
      reject(new Error('Device speech is not available in this browser.'));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'pcm' ? 'en-NG' : {
      yo: 'yo-NG',
      ig: 'ig-NG',
      ha: 'ha-NG',
      sw: 'sw-KE',
      pcm: 'en-NG',
    }[language];
    utterance.rate = 0.88;
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const abort = () => {
      cleanup();
      window.speechSynthesis.cancel();
      reject(abortError());
    };
    utterance.onend = () => { cleanup(); resolve(); };
    utterance.onerror = (event) => {
      cleanup();
      reject(signal?.aborted
        ? abortError()
        : new Error(`Speech could not be played (${event.error}).`));
    };
    signal?.addEventListener('abort', abort, { once: true });
    window.speechSynthesis.speak(utterance);
  });
  if (!['yo', 'ig', 'ha', 'pcm'].includes(language)) return deviceSpeech().then(() => 'device');
  return synthesizePlotweaverSpeech({ text, language, signal })
    .then((blob) => playAudioBlob(blob, signal))
    .then(() => 'online' as const)
    .catch((providerError: unknown) => {
      if (signal?.aborted) throw abortError();
      if (!hasDeviceSpeech) {
        const detail = providerError instanceof Error ? providerError.message : 'The voice service is unavailable.';
        throw new Error(`Could not play speech. ${detail}`);
      }
      return deviceSpeech().then(() => 'device-fallback' as const).catch((deviceError: unknown) => {
        const detail = deviceError instanceof Error ? deviceError.message : 'Device speech is unavailable.';
        const providerDetail = providerError instanceof Error ? providerError.message : 'The voice service is unavailable.';
        throw new Error(`Could not play speech with the online voice (${providerDetail}) or this device (${detail}).`);
      });
    });
}

export async function runBlocks(
  blocks: BlockNode[],
  initial: SpriteState,
  hooks: InterpreterHooks,
): Promise<SpriteState> {
  let state = { ...initial };
  const update = (patch: Partial<SpriteState>) => {
    state = { ...state, ...patch };
    hooks.onState(state);
  };
  const ensureRunning = () => {
    if (hooks.signal.aborted) throw new DOMException('Execution stopped', 'AbortError');
  };

  const execute = async (nodes: BlockNode[], depth = 0): Promise<void> => {
    if (depth > 8) throw new Error('This block stack is nested too deeply to run.');
    for (const node of nodes) {
      ensureRunning();
      const inputs = node.inputs;
      switch (node.type) {
        case 'when_flag_clicked':
        case 'when_sprite_clicked':
          break;
        case 'move_steps': {
          const steps = Number(inputs.steps ?? 10);
          const radians = (state.direction * Math.PI) / 180;
          update({
            x: Math.max(-145, Math.min(145, state.x + Math.cos(radians) * steps)),
            y: Math.max(-100, Math.min(100, state.y + Math.sin(radians) * steps)),
          });
          await pause(120, hooks.signal);
          break;
        }
        case 'turn_degrees':
          update({ direction: (state.direction + Number(inputs.degrees ?? 15)) % 360 });
          await pause(100, hooks.signal);
          break;
        case 'say_message':
          update({ message: String(inputs.text ?? '') });
          break;
        case 'translate_text': {
          const language = (inputs.targetLanguage ?? 'yo') as LanguageCode;
          const translation = await translateEnglish(String(inputs.text ?? ''), language, hooks.signal);
          update({ translation: translation.text, spokenText: translation.text, spokenLanguage: language });
          hooks.onStatus(translation.provider === 'machine'
            ? 'Machine translation ready. Check the wording with a fluent speaker.'
            : 'Translation ready from the Idilewa phrasebook.');
          break;
        }
        case 'display_speech_bubble': {
          const language = (inputs.targetLanguage ?? 'yo') as LanguageCode;
          const translation = await translateEnglish(String(inputs.text ?? ''), language, hooks.signal);
          update({
            message: String(inputs.text ?? ''),
            translation: translation.text,
            spokenText: translation.text,
            spokenLanguage: language,
          });
          break;
        }
        case 'speak_text': {
          const language = (inputs.targetLanguage ?? 'yo') as LanguageCode;
          const phrase = String(inputs.text ?? state.translation);
          update({ spokenText: phrase, spokenLanguage: language });
          hooks.onSpeaking(true);
          try {
            const provider = await speakText(phrase, language, hooks.signal);
            hooks.onStatus(provider === 'online'
              ? 'Playing speech from the Idilewa voice service.'
              : provider === 'device-fallback'
                ? 'The online voice was unavailable; using your device voice.'
                : 'Playing speech with your device voice.');
          } finally {
            hooks.onSpeaking(false);
          }
          break;
        }
        case 'wait_seconds':
          await pause(Math.max(0, Math.min(MAX_WAIT_MS, Number(inputs.seconds ?? 1) * 1000)), hooks.signal);
          break;
        case 'repeat_times': {
          const count = Math.max(0, Math.min(MAX_LOOP_COUNT, Math.floor(Number(inputs.times ?? 1))));
          for (let index = 0; index < count; index += 1) await execute(node.children, depth + 1);
          break;
        }
        case 'forever_loop':
          while (true) {
            ensureRunning();
            await execute(node.children, depth + 1);
            await pause(40, hooks.signal);
          }
        case 'if_then_conditional': {
          const condition = String(inputs.condition ?? '').trim().toLowerCase();
          if (condition && condition !== 'false' && condition !== 'no') await execute(node.children, depth + 1);
          break;
        }
      }
    }
  };

  await execute(blocks);
  hooks.onStatus('Project finished.');
  return state;
}

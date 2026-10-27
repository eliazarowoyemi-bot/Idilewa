import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRecommendedPlotweaverVoice,
  speakWithDeviceVoice
} from '../src/plotweaverClient.js';

test('device speech uses the requested language and resolves when playback ends', async () => {
  const previousWindow = globalThis.window;
  const utterances = [];
  class MockUtterance {
    constructor(text) {
      this.text = text;
    }
  }
  globalThis.window = {
    SpeechSynthesisUtterance: MockUtterance,
    speechSynthesis: {
      cancel() {},
      speak(utterance) {
        utterances.push(utterance);
        queueMicrotask(() => utterance.onend());
      },
    },
  };

  try {
    await speakWithDeviceVoice('Ẹ káàárọ̀', 'yo');
    assert.equal(utterances[0].text, 'Ẹ káàárọ̀');
    assert.equal(utterances[0].lang, 'yo');
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('device speech reports playback errors instead of pretending audio played', async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    SpeechSynthesisUtterance: class {},
    speechSynthesis: {
      cancel() {},
      speak(utterance) {
        queueMicrotask(() => utterance.onerror({ error: 'voice-unavailable' }));
      },
    },
  };

  try {
    await assert.rejects(
      speakWithDeviceVoice('Ẹ káàárọ̀', 'yo'),
      /Device speech could not play this phrase \(voice-unavailable\)/,
    );
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('recommended Plotweaver voice lookup chooses the recommended native voice for Yorùbá', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), '/api/plotweaver/voices?language=yo&type=builtin');
    return new Response(JSON.stringify([
      {
        voice_id: 'cross-lingual',
        name: 'Cross-lingual',
        languages: ['yo'],
        native_languages: ['en'],
        is_native: false,
        recommended: true
      },
      {
        voice_id: 'yoruba-native',
        name: 'Yoruba Native',
        languages: ['yo'],
        native_languages: ['yo'],
        is_native: true,
        recommended: true
      }
    ]));
  };

  try {
    const voice = await getRecommendedPlotweaverVoice('yo');
    assert.equal(voice.voice_id, 'yoruba-native');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('recommended Plotweaver voice lookup rejects when no native voice is available', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify([
    {
      voice_id: 'cross-lingual',
      name: 'Cross-lingual',
      languages: ['yo'],
      native_languages: ['en'],
      is_native: false,
      recommended: true
    }
  ]));

  try {
    await assert.rejects(getRecommendedPlotweaverVoice('yo'), /No native Plotweaver voice/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

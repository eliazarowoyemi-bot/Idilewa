import assert from 'node:assert/strict';
import test from 'node:test';
import { speakWithDeviceVoice } from '../src/plotweaverClient.js';

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

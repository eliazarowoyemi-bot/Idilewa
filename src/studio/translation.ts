import { translateText } from '../translationEngine.js';
import { translateWithPlotweaver } from '../plotweaverClient.js';
import type { LanguageCode } from './types';

export interface Translation {
  text: string;
  language: LanguageCode;
  found: boolean;
  phonetic: string;
  provider: 'phrasebook' | 'machine';
}

export async function translateEnglish(text: string, language: LanguageCode, signal?: AbortSignal): Promise<Translation> {
  const result = translateText(text, language);
  if (result.translated && !result.notFound) {
    return {
      text: result.translated,
      language,
      found: true,
      phonetic: result.phonetic ?? '',
      provider: 'phrasebook',
    };
  }
  if (!text.trim()) {
    return { text: '', language, found: false, phonetic: '', provider: 'phrasebook' };
  }
  if (signal?.aborted) throw new DOMException('Translation cancelled.', 'AbortError');

  try {
    const translated = await translateWithPlotweaver({
      text: text.trim(),
      sourceLanguage: 'en',
      targetLanguage: language,
      signal,
    });
    if (signal?.aborted) throw new DOMException('Translation cancelled.', 'AbortError');
    return {
      text: translated.translated_text,
      language,
      found: true,
      phonetic: '',
      provider: 'machine',
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    const reason = error instanceof Error ? error.message : 'The translation service could not be reached.';
    throw new Error(`This phrase is not in the offline phrasebook. ${reason}`, { cause: error });
  }
}

export interface TranslationResult {
  translated: string;
  phonetic?: string;
  tone?: string;
  transliteration?: string;
  targetLang: string;
  exact: boolean;
  notFound?: boolean;
}

export function translateText(englishText: string, targetLang?: string): TranslationResult;

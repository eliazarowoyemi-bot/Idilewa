export function synthesizePlotweaverSpeech(options: {
  text: string;
  language: string;
  voiceId?: string;
  signal?: AbortSignal;
}): Promise<Blob>;

export function translateWithPlotweaver(options: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  signal?: AbortSignal;
}): Promise<{ translated_text: string }>;

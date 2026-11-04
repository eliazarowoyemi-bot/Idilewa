export const LANGUAGES = [
  { code: 'yo', name: 'Yorùbá', locale: 'yo-NG', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', locale: 'ig-NG', flag: '🇳🇬' },
  { code: 'pcm', name: 'Pidgin', locale: 'en-NG', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', locale: 'ha-NG', flag: '🇳🇬' },
  { code: 'sw', name: 'Swahili', locale: 'sw-KE', flag: '🇰🇪' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type BlockCategory = 'Events' | 'Motion' | 'Looks' | 'Language' | 'Control';
export type BlockType =
  | 'when_flag_clicked'
  | 'when_sprite_clicked'
  | 'move_steps'
  | 'turn_degrees'
  | 'say_message'
  | 'translate_text'
  | 'speak_text'
  | 'display_speech_bubble'
  | 'wait_seconds'
  | 'repeat_times'
  | 'forever_loop'
  | 'if_then_conditional';

export interface BlockInputs {
  steps?: number;
  degrees?: number;
  text?: string;
  targetLanguage?: LanguageCode;
  language?: LanguageCode;
  seconds?: number;
  times?: number;
  condition?: string;
  translatedText?: string;
}

export interface BlockNode {
  id: string;
  type: BlockType;
  inputs: BlockInputs;
  children: BlockNode[];
}

export interface SpriteState {
  x: number;
  y: number;
  direction: number;
  visible: boolean;
  message: string;
  translation: string;
  spokenText: string;
  spokenLanguage: LanguageCode;
}

export type StarterCategory = 'Translation Sandbox' | 'Animation' | 'Games' | 'Culture';

export interface StarterTemplate {
  id: string;
  title: string;
  description: string;
  category: StarterCategory;
  thumbnail_url: string | null;
  default_blocks_json: BlockNode[];
  default_assets_json: { name: string; kind: 'sprite' | 'backdrop'; icon: string }[];
  is_published: boolean;
}

export interface ProjectDraft {
  id: string;
  templateId: string | null;
  title: string;
  blocks: BlockNode[];
  assets: { name: string; kind: 'sprite' | 'backdrop'; icon: string }[];
  updatedAt: string;
}

export interface InterpreterHooks {
  signal: AbortSignal;
  onState: (state: SpriteState) => void;
  onStatus: (status: string) => void;
  onSpeaking: (speaking: boolean) => void;
}

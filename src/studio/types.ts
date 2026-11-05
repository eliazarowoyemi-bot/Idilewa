export const LANGUAGES = [
  { code: 'yo', name: 'Yorùbá', locale: 'yo-NG', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', locale: 'ig-NG', flag: '🇳🇬' },
  { code: 'pcm', name: 'Pidgin', locale: 'en-NG', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', locale: 'ha-NG', flag: '🇳🇬' },
  { code: 'sw', name: 'Swahili', locale: 'sw-KE', flag: '🇰🇪' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export type BlockCategory = 'Motion' | 'Looks' | 'Sound' | 'Events' | 'Control' | 'Sensing' | 'Language';
export type BlockType =
  | 'when_flag_clicked'
  | 'when_sprite_clicked'
  | 'when_key_pressed'
  | 'move_steps'
  | 'turn_degrees'
  | 'go_to_xy'
  | 'change_x'
  | 'change_y'
  | 'set_x'
  | 'set_y'
  | 'point_direction'
  | 'if_on_edge_bounce'
  | 'say_message'
  | 'show_sprite'
  | 'hide_sprite'
  | 'change_size'
  | 'set_size'
  | 'next_costume'
  | 'play_sound'
  | 'stop_sounds'
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
  x?: number;
  y?: number;
  size?: number;
  direction?: number;
  key?: string;
  sound?: string;
  pitch?: number;
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
  size: number;
  costumeIndex: number;
}

export interface CostumeAsset {
  id: string;
  name: string;
  spriteName: string;
  dataUrl: string;
}

export interface SoundAsset {
  id: string;
  name: string;
  dataUrl: string;
  duration: number;
  playbackRate?: number;
  volume?: number;
  reversed?: boolean;
  muted?: boolean;
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
  costumes: CostumeAsset[];
  sounds: SoundAsset[];
  updatedAt: string;
}

export interface InterpreterHooks {
  signal: AbortSignal;
  onState: (state: SpriteState) => void;
  onStatus: (status: string) => void;
  onSpeaking: (speaking: boolean) => void;
  sounds: SoundAsset[];
}

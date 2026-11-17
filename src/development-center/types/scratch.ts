export type BlockCategory =
  | 'motion'
  | 'looks'
  | 'sound'
  | 'events'
  | 'control'
  | 'sensing'
  | 'operators'
  | 'variables'
  | 'myblocks'
  | 'pen'
  | 'music';

export type BlockShape =
  | 'hat'
  | 'stack'
  | 'c-block'
  | 'c-else'
  | 'cap'
  | 'reporter'
  | 'boolean';

export type InputKind = 'number' | 'text' | 'dropdown' | 'color' | 'boolean';

export interface BlockInputSpec {
  id: string;
  kind: InputKind;
  defaultValue: string;
  options?: string[];
}

export interface BlockSegment {
  type: 'label' | 'input' | 'icon';
  text?: string;
  inputId?: string;
  iconName?: 'green-flag' | 'rotate-right' | 'rotate-left' | 'stop';
}

export interface BlockDefinition {
  opcode: string;
  category: BlockCategory;
  shape: BlockShape;
  segments: BlockSegment[];
  inputs: Record<string, BlockInputSpec>;
  hasMonitorCheckbox?: boolean;
  monitorLabel?: string;
  defaultValue?: string;
  isDividerAfter?: boolean;
}

export interface WorkspaceBlock {
  id: string;
  opcode: string;
  inputs: Record<string, string>;
  children?: WorkspaceBlock[];
  elseChildren?: WorkspaceBlock[];
  comment?: string;
}

export interface ScriptStack {
  id: string;
  x: number;
  y: number;
  blocks: WorkspaceBlock[];
}

export interface CostumeAsset {
  id: string;
  name: string;
  svg: string;
  width: number;
  height: number;
  rotationCenterX: number;
  rotationCenterY: number;
  bitmapMode?: boolean;
}

export interface SoundAsset {
  id: string;
  name: string;
  preset: 'meow' | 'pop' | 'laser' | 'chime' | 'drum' | 'boing' | 'coin' | 'bite' | 'space';
  duration: number;
  speedMultiplier: number;
  volumeMultiplier: number;
  reversed: boolean;
  robot: boolean;
  muted: boolean;
  fadeIn: boolean;
  fadeOut: boolean;
  waveform: number[];
}

export type RotationStyle = 'all around' | 'left-right' | "don't rotate";

export interface SpriteData {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: number;
  size: number;
  visible: boolean;
  rotationStyle: RotationStyle;
  currentCostumeIndex: number;
  costumes: CostumeAsset[];
  sounds: SoundAsset[];
  scripts: ScriptStack[];
  bubble?: {
    type: 'say' | 'think';
    text: string;
  } | null;
  effects: {
    color: number;
    ghost: number;
    brightness: number;
  };
  penDown: boolean;
  penColor: string;
  penSize: number;
}

export interface StageVariable {
  id: string;
  name: string;
  value: string | number;
  visible: boolean;
}

export interface StageMonitor {
  id: string;
  label: string;
  color: string;
  value: string | number;
  visible: boolean;
}

export interface PenStroke {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  size: number;
}

export interface BackdropAsset {
  id: string;
  name: string;
  category: string;
  svg: string;
}

export interface LibrarySpriteTemplate {
  id: string;
  name: string;
  category: string;
  costumes: CostumeAsset[];
  sounds: SoundAsset[];
}

export interface TutorialStep {
  title: string;
  description: string;
  hintBlocks?: Array<{
    text: string;
    color: string;
    shape: 'hat' | 'stack' | 'c-block';
  }>;
  illustrationType: 'move' | 'flag' | 'sound' | 'backdrop' | 'animate' | 'chase' | 'music' | 'story';
}

export interface TutorialItem {
  id: string;
  title: string;
  category: 'Animation' | 'Art' | 'Music' | 'Games' | 'Stories';
  accentColor: string;
  summary: string;
  steps: TutorialStep[];
}

export interface ExtensionItem {
  id: 'music' | 'pen' | 'videoSensing' | 'tts' | 'translate' | 'makeyMakey' | 'microbit' | 'ev3';
  name: string;
  description: string;
  badgeText?: string;
  accentColor: string;
  requires?: string;
  functional: boolean;
}

export type ActiveTab = 'code' | 'costumes' | 'sounds';
export type StageSizeMode = 'small' | 'default' | 'fullscreen';

export type ActiveModal =
  | null
  | 'sprite-library'
  | 'costume-library'
  | 'backdrop-library'
  | 'sound-library'
  | 'extension-library'
  | 'tutorials-library'
  | 'signin'
  | 'join'
  | 'project-page';

import { LANGUAGES, type BlockCategory, type BlockNode, type BlockType, type StarterTemplate } from './types';

export const BLOCK_CATEGORIES: { name: BlockCategory; color: string; icon: string }[] = [
  { name: 'Motion', color: '#4c97ff', icon: '↗' },
  { name: 'Looks', color: '#9966ff', icon: '◉' },
  { name: 'Sound', color: '#cf63cf', icon: '♫' },
  { name: 'Events', color: '#ffbf00', icon: '⚑' },
  { name: 'Control', color: '#ffab19', icon: '↻' },
  { name: 'Sensing', color: '#5cb1d6', icon: '☝' },
  { name: 'Language', color: '#139d92', icon: '✳' },
];

export const BLOCK_LABELS: Record<BlockType, string> = {
  when_flag_clicked: 'when 🟢 clicked',
  when_sprite_clicked: 'when this sprite is clicked',
  when_key_pressed: 'when key pressed',
  move_steps: 'move steps',
  turn_degrees: 'turn degrees',
  go_to_xy: 'go to x: y:',
  change_x: 'change x by',
  change_y: 'change y by',
  set_x: 'set x to',
  set_y: 'set y to',
  point_direction: 'point in direction',
  if_on_edge_bounce: 'if on edge, bounce',
  say_message: 'say',
  show_sprite: 'show',
  hide_sprite: 'hide',
  change_size: 'change size by',
  set_size: 'set size to',
  next_costume: 'next costume',
  play_sound: 'play sound',
  stop_sounds: 'stop all sounds',
  translate_text: 'translate to',
  speak_text: 'speak translation',
  display_speech_bubble: 'show speech bubble',
  wait_seconds: 'wait seconds',
  repeat_times: 'repeat',
  forever_loop: 'forever',
  if_then_conditional: 'if / then',
};

export const TYPE_CATEGORY: Record<BlockType, BlockCategory> = {
  when_flag_clicked: 'Events',
  when_sprite_clicked: 'Events',
  when_key_pressed: 'Events',
  move_steps: 'Motion',
  turn_degrees: 'Motion',
  go_to_xy: 'Motion',
  change_x: 'Motion',
  change_y: 'Motion',
  set_x: 'Motion',
  set_y: 'Motion',
  point_direction: 'Motion',
  if_on_edge_bounce: 'Motion',
  say_message: 'Looks',
  show_sprite: 'Looks',
  hide_sprite: 'Looks',
  change_size: 'Looks',
  set_size: 'Looks',
  next_costume: 'Looks',
  play_sound: 'Sound',
  stop_sounds: 'Sound',
  translate_text: 'Language',
  speak_text: 'Language',
  display_speech_bubble: 'Language',
  wait_seconds: 'Control',
  repeat_times: 'Control',
  forever_loop: 'Control',
  if_then_conditional: 'Control',
};

export function createBlock(type: BlockType): BlockNode {
  const inputs: BlockNode['inputs'] = {};
  switch (type) {
    case 'move_steps':
      inputs.steps = 10;
      break;
    case 'turn_degrees':
      inputs.degrees = 15;
      break;
    case 'go_to_xy':
      inputs.x = 0;
      inputs.y = 0;
      break;
    case 'change_x':
    case 'change_y':
    case 'set_x':
    case 'set_y':
      inputs.steps = 10;
      break;
    case 'point_direction':
      inputs.direction = 90;
      break;
    case 'change_size':
    case 'set_size':
      inputs.size = 10;
      break;
    case 'when_key_pressed':
      inputs.key = 'space';
      break;
    case 'play_sound':
      inputs.sound = 'Meow';
      break;
    case 'say_message':
    case 'translate_text':
    case 'display_speech_bubble':
      inputs.text = 'Hello!';
      inputs.targetLanguage = 'yo';
      inputs.translatedText = '';
      break;
    case 'speak_text':
      inputs.targetLanguage = 'yo';
      inputs.text = '';
      break;
    case 'wait_seconds':
      inputs.seconds = 1;
      break;
    case 'repeat_times':
      inputs.times = 3;
      break;
    case 'if_then_conditional':
      inputs.condition = 'true';
      break;
    case 'when_flag_clicked':
    case 'when_sprite_clicked':
    case 'if_on_edge_bounce':
    case 'show_sprite':
    case 'hide_sprite':
    case 'next_costume':
    case 'stop_sounds':
    case 'forever_loop':
      break;
  }
  return { id: crypto.randomUUID(), type, inputs, children: [] };
}

const event = (type: 'when_flag_clicked' | 'when_sprite_clicked') => createBlock(type);
const block = (type: BlockType, values: BlockNode['inputs'] = {}, children: BlockNode[] = []): BlockNode => {
  const created = createBlock(type);
  return { ...created, inputs: { ...created.inputs, ...values }, children };
};

export const LOCAL_TEMPLATES: StarterTemplate[] = [
  {
    id: 'a0e7f60b-4806-4ff1-9000-000000000001',
    title: 'Say hello in Yorùbá',
    description: 'Meet a new friend and let them greet you in Yorùbá.',
    category: 'Translation Sandbox',
    thumbnail_url: null,
    default_blocks_json: [
      event('when_flag_clicked'),
      block('say_message', { text: 'Hello!' }),
      block('translate_text', { text: 'Hello!', targetLanguage: 'yo' }),
      block('display_speech_bubble', { text: 'Hello!', targetLanguage: 'yo' }),
      block('speak_text', { text: '', targetLanguage: 'yo' }),
    ],
    default_assets_json: [{ name: 'Ayo', kind: 'sprite', icon: '🧑🏿' }, { name: 'Sunshine', kind: 'backdrop', icon: '🌤️' }],
    is_published: true,
  },
  {
    id: 'a0e7f60b-4806-4ff1-9000-000000000002',
    title: 'A little greeting dance',
    description: 'Translate a greeting, then make your character dance.',
    category: 'Animation',
    thumbnail_url: null,
    default_blocks_json: [
      event('when_flag_clicked'),
      block('translate_text', { text: 'Good morning', targetLanguage: 'ig' }),
      block('display_speech_bubble', { text: 'Good morning', targetLanguage: 'ig' }),
      block('repeat_times', { times: 4 }, [block('move_steps', { steps: 18 }), block('turn_degrees', { degrees: 45 })]),
    ],
    default_assets_json: [{ name: 'Ayo', kind: 'sprite', icon: '🧑🏿' }, { name: 'Village path', kind: 'backdrop', icon: '🌿' }],
    is_published: true,
  },
  {
    id: 'a0e7f60b-4806-4ff1-9000-000000000003',
    title: 'Storytime: a clever tortoise',
    description: 'Add a line of dialogue and share a tiny folktale.',
    category: 'Culture',
    thumbnail_url: null,
    default_blocks_json: [
      event('when_flag_clicked'),
      block('say_message', { text: 'Once upon a time, a clever tortoise set off to visit a friend.' }),
      block('translate_text', { text: 'Thank you', targetLanguage: 'ha' }),
      block('display_speech_bubble', { text: 'Thank you', targetLanguage: 'ha' }),
      block('speak_text', { text: '', targetLanguage: 'ha' }),
    ],
    default_assets_json: [{ name: 'Tortoise', kind: 'sprite', icon: '🐢' }, { name: 'Story grove', kind: 'backdrop', icon: '🌳' }],
    is_published: true,
  },
  {
    id: 'a0e7f60b-4806-4ff1-9000-000000000004',
    title: 'Pidgin phrase explorer',
    description: 'Explore a friendly greeting and hear it spoken aloud.',
    category: 'Translation Sandbox',
    thumbnail_url: null,
    default_blocks_json: [
      event('when_flag_clicked'),
      block('translate_text', { text: 'Hello', targetLanguage: 'pcm' }),
      block('display_speech_bubble', { text: 'Hello', targetLanguage: 'pcm' }),
      block('speak_text', { text: '', targetLanguage: 'pcm' }),
    ],
    default_assets_json: [{ name: 'Ayo', kind: 'sprite', icon: '🧑🏿' }, { name: 'Sunny day', kind: 'backdrop', icon: '☀️' }],
    is_published: true,
  },
  {
    id: 'a0e7f60b-4806-4ff1-9000-000000000005',
    title: 'Swahili story spark',
    description: 'Start a story in English, then translate the greeting.',
    category: 'Culture',
    thumbnail_url: null,
    default_blocks_json: [
      event('when_flag_clicked'),
      block('say_message', { text: 'Welcome, friend!' }),
      block('translate_text', { text: 'Welcome', targetLanguage: 'sw' }),
      block('display_speech_bubble', { text: 'Welcome', targetLanguage: 'sw' }),
    ],
    default_assets_json: [{ name: 'Storyteller', kind: 'sprite', icon: '🧑🏿‍🎨' }, { name: 'Baobab', kind: 'backdrop', icon: '🌳' }],
    is_published: true,
  },
  {
    id: 'a0e7f60b-4806-4ff1-9000-000000000006',
    title: 'Move, turn, repeat',
    description: 'Build your first loop with a few bright steps.',
    category: 'Games',
    thumbnail_url: null,
    default_blocks_json: [
      event('when_flag_clicked'),
      block('repeat_times', { times: 6 }, [block('move_steps', { steps: 20 }), block('turn_degrees', { degrees: 60 })]),
      block('say_message', { text: 'You made a pattern!' }),
    ],
    default_assets_json: [{ name: 'Ayo', kind: 'sprite', icon: '🧑🏿' }, { name: 'Play field', kind: 'backdrop', icon: '🏞️' }],
    is_published: true,
  },
];

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === 'string' && Object.hasOwn(BLOCK_LABELS, value);
}

export function isBlockNode(value: unknown): value is BlockNode {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const inputs = candidate.inputs;
  if (typeof candidate.id !== 'string' || !isBlockType(candidate.type)
    || !inputs || typeof inputs !== 'object' || Array.isArray(inputs)
    || !Array.isArray(candidate.children) || !candidate.children.every(isBlockNode)) return false;
  const values = inputs as Record<string, unknown>;
  const languageCodes: readonly string[] = LANGUAGES.map((language) => language.code);
  return ['steps', 'degrees', 'seconds', 'times', 'x', 'y', 'size', 'direction', 'pitch'].every((key) => values[key] === undefined || (typeof values[key] === 'number' && Number.isFinite(values[key])))
    && ['text', 'condition', 'translatedText', 'key', 'sound'].every((key) => values[key] === undefined || typeof values[key] === 'string')
    && ['targetLanguage', 'language'].every((key) => values[key] === undefined || (typeof values[key] === 'string' && languageCodes.includes(values[key])));
}

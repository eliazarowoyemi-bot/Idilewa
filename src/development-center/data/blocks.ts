import { BlockCategory, BlockDefinition } from '../types/scratch';

export interface CategoryMeta {
  id: BlockCategory;
  label: string;
  color: string;
  secondary: string;
  tertiary: string;
}

export const BLOCK_CATEGORIES: CategoryMeta[] = [
  { id: 'motion', label: 'Motion', color: '#4C97FF', secondary: '#4280D7', tertiary: '#3373CC' },
  { id: 'looks', label: 'Looks', color: '#9966FF', secondary: '#855CD6', tertiary: '#774DCB' },
  { id: 'sound', label: 'Sound', color: '#CF63CF', secondary: '#C94FC9', tertiary: '#BD42BD' },
  { id: 'events', label: 'Events', color: '#FFBF00', secondary: '#E6AC00', tertiary: '#CC9900' },
  { id: 'control', label: 'Control', color: '#FFAB19', secondary: '#EC9C13', tertiary: '#CF8B17' },
  { id: 'sensing', label: 'Sensing', color: '#5CB1D6', secondary: '#47A8D1', tertiary: '#2E8EB8' },
  { id: 'operators', label: 'Operators', color: '#59C059', secondary: '#46B946', tertiary: '#389438' },
  { id: 'variables', label: 'Variables', color: '#FF8C1A', secondary: '#FF8000', tertiary: '#DB6E00' },
  { id: 'myblocks', label: 'My Blocks', color: '#FF6680', secondary: '#FF4D6A', tertiary: '#FF3355' },
];

export const EXTENSION_CATEGORY_META: Record<'pen' | 'music', CategoryMeta> = {
  pen: { id: 'pen', label: 'Pen', color: '#0FBD8C', secondary: '#0DA57A', tertiary: '#0B8E69' },
  music: { id: 'music', label: 'Music', color: '#0FBD8C', secondary: '#0DA57A', tertiary: '#0B8E69' },
};

export function getCategoryMeta(category: BlockCategory): CategoryMeta {
  if (category === 'pen' || category === 'music') {
    return EXTENSION_CATEGORY_META[category];
  }
  return BLOCK_CATEGORIES.find((c) => c.id === category) || BLOCK_CATEGORIES[0];
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ================= MOTION =================
  {
    opcode: 'motion_movesteps',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'move' },
      { type: 'input', inputId: 'STEPS' },
      { type: 'label', text: 'steps' },
    ],
    inputs: { STEPS: { id: 'STEPS', kind: 'number', defaultValue: '10' } },
  },
  {
    opcode: 'motion_turnright',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'turn' },
      { type: 'icon', iconName: 'rotate-right' },
      { type: 'input', inputId: 'DEGREES' },
      { type: 'label', text: 'degrees' },
    ],
    inputs: { DEGREES: { id: 'DEGREES', kind: 'number', defaultValue: '15' } },
  },
  {
    opcode: 'motion_turnleft',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'turn' },
      { type: 'icon', iconName: 'rotate-left' },
      { type: 'input', inputId: 'DEGREES' },
      { type: 'label', text: 'degrees' },
    ],
    inputs: { DEGREES: { id: 'DEGREES', kind: 'number', defaultValue: '15' } },
    isDividerAfter: true,
  },
  {
    opcode: 'motion_goto',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'go to' },
      { type: 'input', inputId: 'TO' },
    ],
    inputs: {
      TO: { id: 'TO', kind: 'dropdown', defaultValue: 'random position', options: ['random position', 'mouse-pointer'] },
    },
  },
  {
    opcode: 'motion_gotoxy',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'go to x:' },
      { type: 'input', inputId: 'X' },
      { type: 'label', text: 'y:' },
      { type: 'input', inputId: 'Y' },
    ],
    inputs: {
      X: { id: 'X', kind: 'number', defaultValue: '0' },
      Y: { id: 'Y', kind: 'number', defaultValue: '0' },
    },
  },
  {
    opcode: 'motion_glidesecstoxy',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'glide' },
      { type: 'input', inputId: 'SECS' },
      { type: 'label', text: 'secs to x:' },
      { type: 'input', inputId: 'X' },
      { type: 'label', text: 'y:' },
      { type: 'input', inputId: 'Y' },
    ],
    inputs: {
      SECS: { id: 'SECS', kind: 'number', defaultValue: '1' },
      X: { id: 'X', kind: 'number', defaultValue: '0' },
      Y: { id: 'Y', kind: 'number', defaultValue: '0' },
    },
    isDividerAfter: true,
  },
  {
    opcode: 'motion_pointindirection',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'point in direction' },
      { type: 'input', inputId: 'DIRECTION' },
    ],
    inputs: { DIRECTION: { id: 'DIRECTION', kind: 'number', defaultValue: '90' } },
  },
  {
    opcode: 'motion_pointtowards',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'point towards' },
      { type: 'input', inputId: 'TOWARDS' },
    ],
    inputs: {
      TOWARDS: { id: 'TOWARDS', kind: 'dropdown', defaultValue: 'mouse-pointer', options: ['mouse-pointer'] },
    },
    isDividerAfter: true,
  },
  {
    opcode: 'motion_changexby',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'change x by' },
      { type: 'input', inputId: 'DX' },
    ],
    inputs: { DX: { id: 'DX', kind: 'number', defaultValue: '10' } },
  },
  {
    opcode: 'motion_setx',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set x to' },
      { type: 'input', inputId: 'X' },
    ],
    inputs: { X: { id: 'X', kind: 'number', defaultValue: '0' } },
  },
  {
    opcode: 'motion_changeyby',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'change y by' },
      { type: 'input', inputId: 'DY' },
    ],
    inputs: { DY: { id: 'DY', kind: 'number', defaultValue: '10' } },
  },
  {
    opcode: 'motion_sety',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set y to' },
      { type: 'input', inputId: 'Y' },
    ],
    inputs: { Y: { id: 'Y', kind: 'number', defaultValue: '0' } },
    isDividerAfter: true,
  },
  {
    opcode: 'motion_ifonedgebounce',
    category: 'motion',
    shape: 'stack',
    segments: [{ type: 'label', text: 'if on edge, bounce' }],
    inputs: {},
  },
  {
    opcode: 'motion_setrotationstyle',
    category: 'motion',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set rotation style' },
      { type: 'input', inputId: 'STYLE' },
    ],
    inputs: {
      STYLE: {
        id: 'STYLE',
        kind: 'dropdown',
        defaultValue: 'left-right',
        options: ['left-right', "don't rotate", 'all around'],
      },
    },
    isDividerAfter: true,
  },
  {
    opcode: 'motion_xposition',
    category: 'motion',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'x position' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'x position',
  },
  {
    opcode: 'motion_yposition',
    category: 'motion',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'y position' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'y position',
  },
  {
    opcode: 'motion_direction',
    category: 'motion',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'direction' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'direction',
  },

  // ================= LOOKS =================
  {
    opcode: 'looks_sayforsecs',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'say' },
      { type: 'input', inputId: 'MESSAGE' },
      { type: 'label', text: 'for' },
      { type: 'input', inputId: 'SECS' },
      { type: 'label', text: 'seconds' },
    ],
    inputs: {
      MESSAGE: { id: 'MESSAGE', kind: 'text', defaultValue: 'Hello!' },
      SECS: { id: 'SECS', kind: 'number', defaultValue: '2' },
    },
  },
  {
    opcode: 'looks_say',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'say' },
      { type: 'input', inputId: 'MESSAGE' },
    ],
    inputs: { MESSAGE: { id: 'MESSAGE', kind: 'text', defaultValue: 'Hello!' } },
  },
  {
    opcode: 'looks_thinkforsecs',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'think' },
      { type: 'input', inputId: 'MESSAGE' },
      { type: 'label', text: 'for' },
      { type: 'input', inputId: 'SECS' },
      { type: 'label', text: 'seconds' },
    ],
    inputs: {
      MESSAGE: { id: 'MESSAGE', kind: 'text', defaultValue: 'Hmm...' },
      SECS: { id: 'SECS', kind: 'number', defaultValue: '2' },
    },
  },
  {
    opcode: 'looks_think',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'think' },
      { type: 'input', inputId: 'MESSAGE' },
    ],
    inputs: { MESSAGE: { id: 'MESSAGE', kind: 'text', defaultValue: 'Hmm...' } },
    isDividerAfter: true,
  },
  {
    opcode: 'looks_switchcostumeto',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'switch costume to' },
      { type: 'input', inputId: 'COSTUME' },
    ],
    inputs: {
      COSTUME: { id: 'COSTUME', kind: 'dropdown', defaultValue: 'costume2', options: ['costume1', 'costume2'] },
    },
  },
  {
    opcode: 'looks_nextcostume',
    category: 'looks',
    shape: 'stack',
    segments: [{ type: 'label', text: 'next costume' }],
    inputs: {},
  },
  {
    opcode: 'looks_switchbackdropto',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'switch backdrop to' },
      { type: 'input', inputId: 'BACKDROP' },
    ],
    inputs: {
      BACKDROP: {
        id: 'BACKDROP',
        kind: 'dropdown',
        defaultValue: 'backdrop1',
        options: ['backdrop1', 'Blue Sky', 'Galaxy', 'Underwater', 'Xy-grid'],
      },
    },
  },
  {
    opcode: 'looks_nextbackdrop',
    category: 'looks',
    shape: 'stack',
    segments: [{ type: 'label', text: 'next backdrop' }],
    inputs: {},
    isDividerAfter: true,
  },
  {
    opcode: 'looks_changesizeby',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'change size by' },
      { type: 'input', inputId: 'CHANGE' },
    ],
    inputs: { CHANGE: { id: 'CHANGE', kind: 'number', defaultValue: '10' } },
  },
  {
    opcode: 'looks_setsizeto',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set size to' },
      { type: 'input', inputId: 'SIZE' },
      { type: 'label', text: '%' },
    ],
    inputs: { SIZE: { id: 'SIZE', kind: 'number', defaultValue: '100' } },
    isDividerAfter: true,
  },
  {
    opcode: 'looks_changeeffectby',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'change' },
      { type: 'input', inputId: 'EFFECT' },
      { type: 'label', text: 'effect by' },
      { type: 'input', inputId: 'CHANGE' },
    ],
    inputs: {
      EFFECT: { id: 'EFFECT', kind: 'dropdown', defaultValue: 'color', options: ['color', 'ghost', 'brightness'] },
      CHANGE: { id: 'CHANGE', kind: 'number', defaultValue: '25' },
    },
  },
  {
    opcode: 'looks_seteffectto',
    category: 'looks',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set' },
      { type: 'input', inputId: 'EFFECT' },
      { type: 'label', text: 'effect to' },
      { type: 'input', inputId: 'VALUE' },
    ],
    inputs: {
      EFFECT: { id: 'EFFECT', kind: 'dropdown', defaultValue: 'color', options: ['color', 'ghost', 'brightness'] },
      VALUE: { id: 'VALUE', kind: 'number', defaultValue: '0' },
    },
  },
  {
    opcode: 'looks_cleargraphiceffects',
    category: 'looks',
    shape: 'stack',
    segments: [{ type: 'label', text: 'clear graphic effects' }],
    inputs: {},
    isDividerAfter: true,
  },
  {
    opcode: 'looks_show',
    category: 'looks',
    shape: 'stack',
    segments: [{ type: 'label', text: 'show' }],
    inputs: {},
  },
  {
    opcode: 'looks_hide',
    category: 'looks',
    shape: 'stack',
    segments: [{ type: 'label', text: 'hide' }],
    inputs: {},
    isDividerAfter: true,
  },
  {
    opcode: 'looks_costumenumbername',
    category: 'looks',
    shape: 'reporter',
    segments: [
      { type: 'label', text: 'costume' },
      { type: 'input', inputId: 'NUMBER_NAME' },
    ],
    inputs: {
      NUMBER_NAME: { id: 'NUMBER_NAME', kind: 'dropdown', defaultValue: 'number', options: ['number', 'name'] },
    },
    hasMonitorCheckbox: true,
    monitorLabel: 'costume number',
  },
  {
    opcode: 'looks_size',
    category: 'looks',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'size' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'size',
  },

  // ================= SOUND =================
  {
    opcode: 'sound_playuntildone',
    category: 'sound',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'play sound' },
      { type: 'input', inputId: 'SOUND_MENU' },
      { type: 'label', text: 'until done' },
    ],
    inputs: {
      SOUND_MENU: { id: 'SOUND_MENU', kind: 'dropdown', defaultValue: 'Meow', options: ['Meow', 'Pop'] },
    },
  },
  {
    opcode: 'sound_play',
    category: 'sound',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'start sound' },
      { type: 'input', inputId: 'SOUND_MENU' },
    ],
    inputs: {
      SOUND_MENU: { id: 'SOUND_MENU', kind: 'dropdown', defaultValue: 'Meow', options: ['Meow', 'Pop'] },
    },
  },
  {
    opcode: 'sound_stopallsounds',
    category: 'sound',
    shape: 'stack',
    segments: [{ type: 'label', text: 'stop all sounds' }],
    inputs: {},
    isDividerAfter: true,
  },
  {
    opcode: 'sound_changevolumeby',
    category: 'sound',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'change volume by' },
      { type: 'input', inputId: 'VOLUME' },
    ],
    inputs: { VOLUME: { id: 'VOLUME', kind: 'number', defaultValue: '-10' } },
  },
  {
    opcode: 'sound_setvolumeto',
    category: 'sound',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set volume to' },
      { type: 'input', inputId: 'VOLUME' },
      { type: 'label', text: '%' },
    ],
    inputs: { VOLUME: { id: 'VOLUME', kind: 'number', defaultValue: '100' } },
  },
  {
    opcode: 'sound_volume',
    category: 'sound',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'volume' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'volume',
  },

  // ================= EVENTS =================
  {
    opcode: 'event_whenflagclicked',
    category: 'events',
    shape: 'hat',
    segments: [
      { type: 'label', text: 'when' },
      { type: 'icon', iconName: 'green-flag' },
      { type: 'label', text: 'clicked' },
    ],
    inputs: {},
  },
  {
    opcode: 'event_whenkeypressed',
    category: 'events',
    shape: 'hat',
    segments: [
      { type: 'label', text: 'when' },
      { type: 'input', inputId: 'KEY_OPTION' },
      { type: 'label', text: 'key pressed' },
    ],
    inputs: {
      KEY_OPTION: {
        id: 'KEY_OPTION',
        kind: 'dropdown',
        defaultValue: 'space',
        options: ['space', 'up arrow', 'down arrow', 'right arrow', 'left arrow', 'any', 'a', 'b', 'c'],
      },
    },
  },
  {
    opcode: 'event_whenthisspriteclicked',
    category: 'events',
    shape: 'hat',
    segments: [{ type: 'label', text: 'when this sprite clicked' }],
    inputs: {},
  },
  {
    opcode: 'event_whenbackdropswitchesto',
    category: 'events',
    shape: 'hat',
    segments: [
      { type: 'label', text: 'when backdrop switches to' },
      { type: 'input', inputId: 'BACKDROP' },
    ],
    inputs: {
      BACKDROP: { id: 'BACKDROP', kind: 'dropdown', defaultValue: 'backdrop1', options: ['backdrop1', 'Blue Sky', 'Galaxy'] },
    },
    isDividerAfter: true,
  },
  {
    opcode: 'event_whenbroadcastreceived',
    category: 'events',
    shape: 'hat',
    segments: [
      { type: 'label', text: 'when I receive' },
      { type: 'input', inputId: 'BROADCAST_OPTION' },
    ],
    inputs: {
      BROADCAST_OPTION: { id: 'BROADCAST_OPTION', kind: 'dropdown', defaultValue: 'message1', options: ['message1', 'New message'] },
    },
  },
  {
    opcode: 'event_broadcast',
    category: 'events',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'broadcast' },
      { type: 'input', inputId: 'BROADCAST_INPUT' },
    ],
    inputs: {
      BROADCAST_INPUT: { id: 'BROADCAST_INPUT', kind: 'dropdown', defaultValue: 'message1', options: ['message1', 'New message'] },
    },
  },
  {
    opcode: 'event_broadcastandwait',
    category: 'events',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'broadcast' },
      { type: 'input', inputId: 'BROADCAST_INPUT' },
      { type: 'label', text: 'and wait' },
    ],
    inputs: {
      BROADCAST_INPUT: { id: 'BROADCAST_INPUT', kind: 'dropdown', defaultValue: 'message1', options: ['message1', 'New message'] },
    },
  },

  // ================= CONTROL =================
  {
    opcode: 'control_wait',
    category: 'control',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'wait' },
      { type: 'input', inputId: 'DURATION' },
      { type: 'label', text: 'seconds' },
    ],
    inputs: { DURATION: { id: 'DURATION', kind: 'number', defaultValue: '1' } },
    isDividerAfter: true,
  },
  {
    opcode: 'control_repeat',
    category: 'control',
    shape: 'c-block',
    segments: [
      { type: 'label', text: 'repeat' },
      { type: 'input', inputId: 'TIMES' },
    ],
    inputs: { TIMES: { id: 'TIMES', kind: 'number', defaultValue: '10' } },
  },
  {
    opcode: 'control_forever',
    category: 'control',
    shape: 'c-block',
    segments: [{ type: 'label', text: 'forever' }],
    inputs: {},
    isDividerAfter: true,
  },
  {
    opcode: 'control_if',
    category: 'control',
    shape: 'c-block',
    segments: [
      { type: 'label', text: 'if' },
      { type: 'input', inputId: 'CONDITION' },
      { type: 'label', text: 'then' },
    ],
    inputs: { CONDITION: { id: 'CONDITION', kind: 'boolean', defaultValue: '' } },
  },
  {
    opcode: 'control_if_else',
    category: 'control',
    shape: 'c-else',
    segments: [
      { type: 'label', text: 'if' },
      { type: 'input', inputId: 'CONDITION' },
      { type: 'label', text: 'then' },
    ],
    inputs: { CONDITION: { id: 'CONDITION', kind: 'boolean', defaultValue: '' } },
  },
  {
    opcode: 'control_wait_until',
    category: 'control',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'wait until' },
      { type: 'input', inputId: 'CONDITION' },
    ],
    inputs: { CONDITION: { id: 'CONDITION', kind: 'boolean', defaultValue: '' } },
    isDividerAfter: true,
  },
  {
    opcode: 'control_stop',
    category: 'control',
    shape: 'cap',
    segments: [
      { type: 'label', text: 'stop' },
      { type: 'input', inputId: 'STOP_OPTION' },
    ],
    inputs: {
      STOP_OPTION: { id: 'STOP_OPTION', kind: 'dropdown', defaultValue: 'all', options: ['all', 'this script', 'other scripts in sprite'] },
    },
  },
  {
    opcode: 'control_create_clone_of',
    category: 'control',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'create clone of' },
      { type: 'input', inputId: 'CLONE_OPTION' },
    ],
    inputs: {
      CLONE_OPTION: { id: 'CLONE_OPTION', kind: 'dropdown', defaultValue: 'myself', options: ['myself'] },
    },
  },

  // ================= SENSING =================
  {
    opcode: 'sensing_touchingobject',
    category: 'sensing',
    shape: 'boolean',
    segments: [
      { type: 'label', text: 'touching' },
      { type: 'input', inputId: 'TOUCHINGOBJECTMENU' },
      { type: 'label', text: '?' },
    ],
    inputs: {
      TOUCHINGOBJECTMENU: { id: 'TOUCHINGOBJECTMENU', kind: 'dropdown', defaultValue: 'mouse-pointer', options: ['mouse-pointer', 'edge'] },
    },
  },
  {
    opcode: 'sensing_keypressed',
    category: 'sensing',
    shape: 'boolean',
    segments: [
      { type: 'label', text: 'key' },
      { type: 'input', inputId: 'KEY_OPTION' },
      { type: 'label', text: 'pressed?' },
    ],
    inputs: {
      KEY_OPTION: {
        id: 'KEY_OPTION',
        kind: 'dropdown',
        defaultValue: 'space',
        options: ['space', 'up arrow', 'down arrow', 'right arrow', 'left arrow', 'any'],
      },
    },
  },
  {
    opcode: 'sensing_mousedown',
    category: 'sensing',
    shape: 'boolean',
    segments: [{ type: 'label', text: 'mouse down?' }],
    inputs: {},
    isDividerAfter: true,
  },
  {
    opcode: 'sensing_askandwait',
    category: 'sensing',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'ask' },
      { type: 'input', inputId: 'QUESTION' },
      { type: 'label', text: 'and wait' },
    ],
    inputs: { QUESTION: { id: 'QUESTION', kind: 'text', defaultValue: "What's your name?" } },
  },
  {
    opcode: 'sensing_answer',
    category: 'sensing',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'answer' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'answer',
    isDividerAfter: true,
  },
  {
    opcode: 'sensing_mousex',
    category: 'sensing',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'mouse x' }],
    inputs: {},
  },
  {
    opcode: 'sensing_mousey',
    category: 'sensing',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'mouse y' }],
    inputs: {},
  },
  {
    opcode: 'sensing_timer',
    category: 'sensing',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'timer' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'timer',
  },
  {
    opcode: 'sensing_resettimer',
    category: 'sensing',
    shape: 'stack',
    segments: [{ type: 'label', text: 'reset timer' }],
    inputs: {},
  },

  // ================= OPERATORS =================
  {
    opcode: 'operator_add',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { type: 'input', inputId: 'NUM1' },
      { type: 'label', text: '+' },
      { type: 'input', inputId: 'NUM2' },
    ],
    inputs: {
      NUM1: { id: 'NUM1', kind: 'number', defaultValue: '' },
      NUM2: { id: 'NUM2', kind: 'number', defaultValue: '' },
    },
  },
  {
    opcode: 'operator_subtract',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { type: 'input', inputId: 'NUM1' },
      { type: 'label', text: '-' },
      { type: 'input', inputId: 'NUM2' },
    ],
    inputs: {
      NUM1: { id: 'NUM1', kind: 'number', defaultValue: '' },
      NUM2: { id: 'NUM2', kind: 'number', defaultValue: '' },
    },
  },
  {
    opcode: 'operator_multiply',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { type: 'input', inputId: 'NUM1' },
      { type: 'label', text: '*' },
      { type: 'input', inputId: 'NUM2' },
    ],
    inputs: {
      NUM1: { id: 'NUM1', kind: 'number', defaultValue: '' },
      NUM2: { id: 'NUM2', kind: 'number', defaultValue: '' },
    },
  },
  {
    opcode: 'operator_divide',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { type: 'input', inputId: 'NUM1' },
      { type: 'label', text: '/' },
      { type: 'input', inputId: 'NUM2' },
    ],
    inputs: {
      NUM1: { id: 'NUM1', kind: 'number', defaultValue: '' },
      NUM2: { id: 'NUM2', kind: 'number', defaultValue: '' },
    },
    isDividerAfter: true,
  },
  {
    opcode: 'operator_random',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { type: 'label', text: 'pick random' },
      { type: 'input', inputId: 'FROM' },
      { type: 'label', text: 'to' },
      { type: 'input', inputId: 'TO' },
    ],
    inputs: {
      FROM: { id: 'FROM', kind: 'number', defaultValue: '1' },
      TO: { id: 'TO', kind: 'number', defaultValue: '10' },
    },
    isDividerAfter: true,
  },
  {
    opcode: 'operator_gt',
    category: 'operators',
    shape: 'boolean',
    segments: [
      { type: 'input', inputId: 'OPERAND1' },
      { type: 'label', text: '>' },
      { type: 'input', inputId: 'OPERAND2' },
    ],
    inputs: {
      OPERAND1: { id: 'OPERAND1', kind: 'text', defaultValue: '' },
      OPERAND2: { id: 'OPERAND2', kind: 'text', defaultValue: '50' },
    },
  },
  {
    opcode: 'operator_lt',
    category: 'operators',
    shape: 'boolean',
    segments: [
      { type: 'input', inputId: 'OPERAND1' },
      { type: 'label', text: '<' },
      { type: 'input', inputId: 'OPERAND2' },
    ],
    inputs: {
      OPERAND1: { id: 'OPERAND1', kind: 'text', defaultValue: '' },
      OPERAND2: { id: 'OPERAND2', kind: 'text', defaultValue: '50' },
    },
  },
  {
    opcode: 'operator_equals',
    category: 'operators',
    shape: 'boolean',
    segments: [
      { type: 'input', inputId: 'OPERAND1' },
      { type: 'label', text: '=' },
      { type: 'input', inputId: 'OPERAND2' },
    ],
    inputs: {
      OPERAND1: { id: 'OPERAND1', kind: 'text', defaultValue: '' },
      OPERAND2: { id: 'OPERAND2', kind: 'text', defaultValue: '50' },
    },
  },
  {
    opcode: 'operator_join',
    category: 'operators',
    shape: 'reporter',
    segments: [
      { type: 'label', text: 'join' },
      { type: 'input', inputId: 'STRING1' },
      { type: 'input', inputId: 'STRING2' },
    ],
    inputs: {
      STRING1: { id: 'STRING1', kind: 'text', defaultValue: 'apple ' },
      STRING2: { id: 'STRING2', kind: 'text', defaultValue: 'banana' },
    },
  },

  // ================= VARIABLES =================
  {
    opcode: 'data_variable',
    category: 'variables',
    shape: 'reporter',
    segments: [{ type: 'label', text: 'my variable' }],
    inputs: {},
    hasMonitorCheckbox: true,
    monitorLabel: 'my variable',
  },
  {
    opcode: 'data_setvariableto',
    category: 'variables',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set' },
      { type: 'input', inputId: 'VARIABLE' },
      { type: 'label', text: 'to' },
      { type: 'input', inputId: 'VALUE' },
    ],
    inputs: {
      VARIABLE: { id: 'VARIABLE', kind: 'dropdown', defaultValue: 'my variable', options: ['my variable'] },
      VALUE: { id: 'VALUE', kind: 'text', defaultValue: '0' },
    },
  },
  {
    opcode: 'data_changevariableby',
    category: 'variables',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'change' },
      { type: 'input', inputId: 'VARIABLE' },
      { type: 'label', text: 'by' },
      { type: 'input', inputId: 'VALUE' },
    ],
    inputs: {
      VARIABLE: { id: 'VARIABLE', kind: 'dropdown', defaultValue: 'my variable', options: ['my variable'] },
      VALUE: { id: 'VALUE', kind: 'number', defaultValue: '1' },
    },
  },
  {
    opcode: 'data_showvariable',
    category: 'variables',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'show variable' },
      { type: 'input', inputId: 'VARIABLE' },
    ],
    inputs: {
      VARIABLE: { id: 'VARIABLE', kind: 'dropdown', defaultValue: 'my variable', options: ['my variable'] },
    },
  },
  {
    opcode: 'data_hidevariable',
    category: 'variables',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'hide variable' },
      { type: 'input', inputId: 'VARIABLE' },
    ],
    inputs: {
      VARIABLE: { id: 'VARIABLE', kind: 'dropdown', defaultValue: 'my variable', options: ['my variable'] },
    },
  },

  // ================= MY BLOCKS =================
  {
    opcode: 'procedures_definition',
    category: 'myblocks',
    shape: 'hat',
    segments: [{ type: 'label', text: 'define jump' }],
    inputs: {},
  },
  {
    opcode: 'procedures_call',
    category: 'myblocks',
    shape: 'stack',
    segments: [{ type: 'label', text: 'jump' }],
    inputs: {},
  },

  // ================= PEN EXTENSION =================
  {
    opcode: 'pen_clear',
    category: 'pen',
    shape: 'stack',
    segments: [{ type: 'label', text: 'erase all' }],
    inputs: {},
  },
  {
    opcode: 'pen_stamp',
    category: 'pen',
    shape: 'stack',
    segments: [{ type: 'label', text: 'stamp' }],
    inputs: {},
  },
  {
    opcode: 'pen_penDown',
    category: 'pen',
    shape: 'stack',
    segments: [{ type: 'label', text: 'pen down' }],
    inputs: {},
  },
  {
    opcode: 'pen_penUp',
    category: 'pen',
    shape: 'stack',
    segments: [{ type: 'label', text: 'pen up' }],
    inputs: {},
  },
  {
    opcode: 'pen_setPenColorToColor',
    category: 'pen',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set pen color to' },
      { type: 'input', inputId: 'COLOR' },
    ],
    inputs: { COLOR: { id: 'COLOR', kind: 'color', defaultValue: '#4C97FF' } },
  },
  {
    opcode: 'pen_setPenSizeTo',
    category: 'pen',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'set pen size to' },
      { type: 'input', inputId: 'SIZE' },
    ],
    inputs: { SIZE: { id: 'SIZE', kind: 'number', defaultValue: '3' } },
  },

  // ================= MUSIC EXTENSION =================
  {
    opcode: 'music_playDrumForBeats',
    category: 'music',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'play drum' },
      { type: 'input', inputId: 'DRUM' },
      { type: 'label', text: 'for' },
      { type: 'input', inputId: 'BEATS' },
      { type: 'label', text: 'beats' },
    ],
    inputs: {
      DRUM: { id: 'DRUM', kind: 'dropdown', defaultValue: '(1) Snare Drum', options: ['(1) Snare Drum', '(2) Bass Drum', '(4) Crash Cymbal'] },
      BEATS: { id: 'BEATS', kind: 'number', defaultValue: '0.25' },
    },
  },
  {
    opcode: 'music_playNoteForBeats',
    category: 'music',
    shape: 'stack',
    segments: [
      { type: 'label', text: 'play note' },
      { type: 'input', inputId: 'NOTE' },
      { type: 'label', text: 'for' },
      { type: 'input', inputId: 'BEATS' },
      { type: 'label', text: 'beats' },
    ],
    inputs: {
      NOTE: { id: 'NOTE', kind: 'number', defaultValue: '60' },
      BEATS: { id: 'BEATS', kind: 'number', defaultValue: '0.25' },
    },
  },
];

export function getBlockDefinition(opcode: string): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find((b) => b.opcode === opcode);
}

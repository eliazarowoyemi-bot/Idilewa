import {
  BackdropAsset,
  ExtensionItem,
  LibrarySpriteTemplate,
  SoundAsset,
  SpriteData,
  TutorialItem,
} from '../types/scratch';
import { generateWaveform } from '../utils/audio';

export const SCRATCH_CAT_COSTUME_1_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 100" width="96" height="100">
  <!-- Tail -->
  <path d="M22 68 C10 66 6 54 14 48 C18 45 21 50 18 55 C16 59 20 62 27 62 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Back Leg -->
  <path d="M34 74 L28 91 C27 94 31 96 36 95 L41 94 C44 93 43 89 39 88 L42 75 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Torso -->
  <path d="M31 50 C25 58 26 74 36 77 C48 80 57 73 56 60 C55 52 49 48 42 48 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- White Belly -->
  <path d="M40 53 C36 59 38 71 45 73 C51 74 54 67 53 59 C52 54 46 51 40 53 Z" fill="#FFFFFF"/>
  <!-- Back Arm -->
  <path d="M51 53 L64 60 C67 61 68 65 65 66 C61 67 57 63 49 58 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Front Leg -->
  <path d="M46 74 L52 90 C54 94 59 95 62 93 C65 91 61 87 57 87 L52 73 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Front Arm -->
  <path d="M35 55 L26 67 C24 70 27 73 31 71 C35 69 37 64 40 58 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Head & Ears -->
  <path d="M28 24 L24 7 L40 16 C45 14 52 14 57 17 L72 8 L69 25 C74 31 75 40 70 46 C64 53 45 55 34 49 C24 44 23 32 28 24 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Inner Ears -->
  <polygon points="29,21 27,12 36,17" fill="#FFFFFF"/>
  <polygon points="66,22 69,13 60,18" fill="#FFFFFF"/>
  <!-- Muzzle & Cheek -->
  <path d="M32 36 C32 30 42 29 50 30 C60 31 71 34 71 41 C71 47 60 51 48 50 C37 49 32 43 32 36 Z" fill="#FFFFFF"/>
  <!-- Left Eye -->
  <ellipse cx="44" cy="29" rx="5.5" ry="7" fill="#FFFFFF" stroke="#000" stroke-width="1.8"/>
  <circle cx="45.5" cy="30" r="2.5" fill="#000000"/>
  <!-- Right Eye -->
  <ellipse cx="60" cy="29" rx="5.5" ry="7" fill="#FFFFFF" stroke="#000" stroke-width="1.8"/>
  <circle cx="61.5" cy="30" r="2.5" fill="#000000"/>
  <!-- Nose -->
  <ellipse cx="55" cy="36.5" rx="3.2" ry="2.2" fill="#000000"/>
  <!-- Smile -->
  <path d="M46 42 C49 46 57 46 61 41" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
  <!-- Whiskers -->
  <line x1="21" y1="35" x2="32" y2="37" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="20" y1="41" x2="31" y2="41" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="69" y1="37" x2="81" y2="35" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="70" y1="42" x2="81" y2="42" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

export const SCRATCH_CAT_COSTUME_2_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 100" width="96" height="100">
  <!-- Tail -->
  <path d="M22 65 C10 61 8 48 16 44 C20 42 22 47 19 52 C17 56 21 59 27 60 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Back Leg (running) -->
  <path d="M36 74 L21 86 C19 88 21 92 25 91 L30 90 C32 89 31 85 28 84 L41 75 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Torso -->
  <path d="M31 50 C25 58 26 74 36 77 C48 80 57 73 56 60 C55 52 49 48 42 48 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- White Belly -->
  <path d="M40 53 C36 59 38 71 45 73 C51 74 54 67 53 59 C52 54 46 51 40 53 Z" fill="#FFFFFF"/>
  <!-- Back Arm -->
  <path d="M51 53 L66 56 C69 57 70 61 66 62 C62 63 57 60 49 58 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Front Leg (running) -->
  <path d="M47 73 L63 85 C66 87 69 84 67 80 C65 77 61 78 58 79 L52 71 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Front Arm -->
  <path d="M35 55 L23 61 C20 63 22 67 26 66 C31 65 35 61 40 58 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <!-- Head & Ears -->
  <path d="M28 24 L24 7 L40 16 C45 14 52 14 57 17 L72 8 L69 25 C74 31 75 40 70 46 C64 53 45 55 34 49 C24 44 23 32 28 24 Z" fill="#FFAB19" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
  <polygon points="29,21 27,12 36,17" fill="#FFFFFF"/>
  <polygon points="66,22 69,13 60,18" fill="#FFFFFF"/>
  <path d="M32 36 C32 30 42 29 50 30 C60 31 71 34 71 41 C71 47 60 51 48 50 C37 49 32 43 32 36 Z" fill="#FFFFFF"/>
  <ellipse cx="44" cy="29" rx="5.5" ry="7" fill="#FFFFFF" stroke="#000" stroke-width="1.8"/>
  <circle cx="45.5" cy="30" r="2.5" fill="#000000"/>
  <ellipse cx="60" cy="29" rx="5.5" ry="7" fill="#FFFFFF" stroke="#000" stroke-width="1.8"/>
  <circle cx="61.5" cy="30" r="2.5" fill="#000000"/>
  <ellipse cx="55" cy="36.5" rx="3.2" ry="2.2" fill="#000000"/>
  <path d="M46 42 C49 46 57 46 61 41" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="21" y1="35" x2="32" y2="37" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="20" y1="41" x2="31" y2="41" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="69" y1="37" x2="81" y2="35" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="70" y1="42" x2="81" y2="42" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

export function createSound(
  id: string,
  name: string,
  preset: SoundAsset['preset'],
  duration = 0.65
): SoundAsset {
  return {
    id,
    name,
    preset,
    duration,
    speedMultiplier: 1,
    volumeMultiplier: 1,
    reversed: false,
    robot: false,
    muted: false,
    fadeIn: false,
    fadeOut: false,
    waveform: generateWaveform(preset),
  };
}

export const INITIAL_SPRITE: SpriteData = {
  id: 'sprite-1',
  name: 'Sprite1',
  x: 0,
  y: 0,
  direction: 90,
  size: 100,
  visible: true,
  rotationStyle: 'all around',
  currentCostumeIndex: 0,
  costumes: [
    {
      id: 'costume1',
      name: 'costume1',
      svg: SCRATCH_CAT_COSTUME_1_SVG,
      width: 96,
      height: 100,
      rotationCenterX: 48,
      rotationCenterY: 50,
    },
    {
      id: 'costume2',
      name: 'costume2',
      svg: SCRATCH_CAT_COSTUME_2_SVG,
      width: 96,
      height: 100,
      rotationCenterX: 48,
      rotationCenterY: 50,
    },
  ],
  sounds: [createSound('sound-meow', 'Meow', 'meow', 0.72)],
  scripts: [],
  bubble: null,
  effects: { color: 0, ghost: 0, brightness: 0 },
  penDown: false,
  penColor: '#4C97FF',
  penSize: 3,
};

export const SPRITE_LIBRARY: LibrarySpriteTemplate[] = [
  {
    id: 'lib-cat',
    name: 'Cat',
    category: 'Animals',
    costumes: INITIAL_SPRITE.costumes,
    sounds: [createSound('cat-meow', 'Meow', 'meow', 0.72)],
  },
  {
    id: 'lib-gobo',
    name: 'Gobo',
    category: 'Fantasy',
    costumes: [
      {
        id: 'gobo-a',
        name: 'gobo-a',
        width: 90,
        height: 96,
        rotationCenterX: 45,
        rotationCenterY: 48,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 96" width="90" height="96">
          <path d="M24 22 L15 8 L33 17 L45 5 L57 17 L75 8 L66 22 C74 30 74 47 64 56 L66 76 L54 76 L52 63 L38 63 L36 76 L24 76 L26 56 C16 47 16 30 24 22 Z" fill="#FFAB19" stroke="#222" stroke-width="2.2" stroke-linejoin="round"/>
          <ellipse cx="36" cy="34" rx="5.5" ry="7" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="37" cy="35" r="2.5" fill="#222"/>
          <ellipse cx="54" cy="34" rx="5.5" ry="7" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="55" cy="35" r="2.5" fill="#222"/>
          <path d="M36 46 Q45 54 54 46" fill="none" stroke="#222" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`,
      },
    ],
    sounds: [createSound('gobo-pop', 'Pop', 'pop', 0.25)],
  },
  {
    id: 'lib-pico',
    name: 'Pico',
    category: 'Fantasy',
    costumes: [
      {
        id: 'pico-a',
        name: 'pico-a',
        width: 90,
        height: 96,
        rotationCenterX: 45,
        rotationCenterY: 48,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 96" width="90" height="96">
          <circle cx="20" cy="32" r="8" fill="#FF8C1A" stroke="#222" stroke-width="2"/>
          <circle cx="70" cy="32" r="8" fill="#FF8C1A" stroke="#222" stroke-width="2"/>
          <rect x="28" y="54" width="34" height="24" rx="10" fill="#FF8C1A" stroke="#222" stroke-width="2"/>
          <ellipse cx="45" cy="35" rx="24" ry="22" fill="#FFAB19" stroke="#222" stroke-width="2"/>
          <ellipse cx="36" cy="31" rx="5" ry="6.5" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="37" cy="32" r="2.5" fill="#222"/>
          <ellipse cx="54" cy="31" rx="5" ry="6.5" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="55" cy="32" r="2.5" fill="#222"/>
          <path d="M36 42 Q45 50 54 42" fill="#FFF" stroke="#222" stroke-width="2"/>
          <rect x="31" y="76" width="10" height="11" rx="4" fill="#FF8C1A" stroke="#222" stroke-width="2"/>
          <rect x="49" y="76" width="10" height="11" rx="4" fill="#FF8C1A" stroke="#222" stroke-width="2"/>
        </svg>`,
      },
    ],
    sounds: [createSound('pico-boing', 'Boing', 'boing', 0.45)],
  },
  {
    id: 'lib-tera',
    name: 'Tera',
    category: 'Fantasy',
    costumes: [
      {
        id: 'tera-a',
        name: 'tera-a',
        width: 90,
        height: 96,
        rotationCenterX: 45,
        rotationCenterY: 48,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 96" width="90" height="96">
          <path d="M30 55 L58 55 L64 78 L26 78 Z" fill="#4C97FF" stroke="#222" stroke-width="2"/>
          <circle cx="45" cy="34" r="22" fill="#5CB1D6" stroke="#222" stroke-width="2"/>
          <ellipse cx="45" cy="14" rx="10" ry="6" fill="#4C97FF" stroke="#222" stroke-width="2"/>
          <ellipse cx="37" cy="32" rx="4.5" ry="6" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="38" cy="33" r="2.3" fill="#222"/>
          <ellipse cx="53" cy="32" rx="4.5" ry="6" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="54" cy="33" r="2.3" fill="#222"/>
          <path d="M37 43 Q45 49 53 43" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          <rect x="33" y="78" width="9" height="10" rx="4" fill="#5CB1D6" stroke="#222" stroke-width="2"/>
          <rect x="48" y="78" width="9" height="10" rx="4" fill="#5CB1D6" stroke="#222" stroke-width="2"/>
        </svg>`,
      },
    ],
    sounds: [createSound('tera-chime', 'Chime', 'chime', 0.55)],
  },
  {
    id: 'lib-nano',
    name: 'Nano',
    category: 'Fantasy',
    costumes: [
      {
        id: 'nano-a',
        name: 'nano-a',
        width: 90,
        height: 96,
        rotationCenterX: 45,
        rotationCenterY: 48,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 96" width="90" height="96">
          <rect x="28" y="53" width="34" height="24" rx="8" fill="#59C059" stroke="#222" stroke-width="2"/>
          <path d="M22 36 C22 18 32 14 45 14 C58 14 68 18 68 36 C68 48 58 55 45 55 C32 55 22 48 22 36 Z" fill="#8CD95B" stroke="#222" stroke-width="2"/>
          <ellipse cx="37" cy="34" rx="4.5" ry="6" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="38" cy="35" r="2.2" fill="#222"/>
          <ellipse cx="53" cy="34" rx="4.5" ry="6" fill="#FFF" stroke="#222" stroke-width="1.8"/>
          <circle cx="54" cy="35" r="2.2" fill="#222"/>
          <path d="M37 44 Q45 50 53 44" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"/>
          <rect x="32" y="77" width="9" height="10" rx="4" fill="#59C059" stroke="#222" stroke-width="2"/>
          <rect x="49" y="77" width="9" height="10" rx="4" fill="#59C059" stroke="#222" stroke-width="2"/>
        </svg>`,
      },
    ],
    sounds: [createSound('nano-pop', 'Pop', 'pop', 0.25)],
  },
  {
    id: 'lib-apple',
    name: 'Apple',
    category: 'Food',
    costumes: [
      {
        id: 'apple',
        name: 'apple',
        width: 80,
        height: 88,
        rotationCenterX: 40,
        rotationCenterY: 44,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 88" width="80" height="88">
          <path d="M40 24 C40 14 45 10 49 9" fill="none" stroke="#6E4726" stroke-width="4" stroke-linecap="round"/>
          <path d="M41 18 C49 10 60 12 60 20 C52 24 44 22 41 18 Z" fill="#59C059" stroke="#2E7D32" stroke-width="1.8"/>
          <path d="M40 26 C26 20 14 31 16 50 C18 68 30 79 40 76 C50 79 62 68 64 50 C66 31 54 20 40 26 Z" fill="#E53935" stroke="#B71C1C" stroke-width="2"/>
          <ellipse cx="28" cy="39" rx="4" ry="8" transform="rotate(-20 28 39)" fill="#FF8A80" opacity="0.65"/>
        </svg>`,
      },
    ],
    sounds: [createSound('apple-bite', 'Chomp', 'bite', 0.35)],
  },
  {
    id: 'lib-basketball',
    name: 'Basketball',
    category: 'Sports',
    costumes: [
      {
        id: 'basketball',
        name: 'basketball',
        width: 80,
        height: 80,
        rotationCenterX: 40,
        rotationCenterY: 40,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
          <circle cx="40" cy="40" r="34" fill="#FF8C1A" stroke="#222" stroke-width="2.5"/>
          <line x1="6" y1="40" x2="74" y2="40" stroke="#222" stroke-width="2.2"/>
          <line x1="40" y1="6" x2="40" y2="74" stroke="#222" stroke-width="2.2"/>
          <path d="M18 14 Q34 40 18 66" fill="none" stroke="#222" stroke-width="2.2"/>
          <path d="M62 14 Q46 40 62 66" fill="none" stroke="#222" stroke-width="2.2"/>
        </svg>`,
      },
    ],
    sounds: [createSound('bball-boing', 'Basketball Bounce', 'boing', 0.35)],
  },
  {
    id: 'lib-ball',
    name: 'Ball',
    category: 'Sports',
    costumes: [
      {
        id: 'ball-a',
        name: 'ball-a',
        width: 72,
        height: 72,
        rotationCenterX: 36,
        rotationCenterY: 36,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">
          <defs><radialGradient id="bg1" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#FFF3B0"/><stop offset="100%" stop-color="#FFAB19"/></radialGradient></defs>
          <circle cx="36" cy="36" r="30" fill="url(#bg1)" stroke="#CC7A00" stroke-width="2"/>
        </svg>`,
      },
      {
        id: 'ball-b',
        name: 'ball-b',
        width: 72,
        height: 72,
        rotationCenterX: 36,
        rotationCenterY: 36,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="72" height="72">
          <circle cx="36" cy="36" r="30" fill="#4C97FF" stroke="#2E6AD1" stroke-width="2"/>
          <circle cx="26" cy="24" r="7" fill="#FFFFFF" opacity="0.4"/>
        </svg>`,
      },
    ],
    sounds: [createSound('ball-pop', 'Pop', 'pop', 0.25)],
  },
  {
    id: 'lib-star',
    name: 'Star',
    category: 'Fantasy',
    costumes: [
      {
        id: 'star',
        name: 'star',
        width: 80,
        height: 80,
        rotationCenterX: 40,
        rotationCenterY: 40,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
          <polygon points="40,6 49,27 72,29 54,44 60,67 40,54 20,67 26,44 8,29 31,27" fill="#FFD500" stroke="#E0A800" stroke-width="2.5" stroke-linejoin="round"/>
        </svg>`,
      },
    ],
    sounds: [createSound('star-coin', 'Collect', 'coin', 0.45)],
  },
  {
    id: 'lib-rocket',
    name: 'Rocketship',
    category: 'Fantasy',
    costumes: [
      {
        id: 'rocket-a',
        name: 'rocketship-a',
        width: 96,
        height: 96,
        rotationCenterX: 48,
        rotationCenterY: 48,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
          <path d="M40 72 L48 92 L56 72 Z" fill="#FF8C1A"/>
          <path d="M29 56 L18 74 L35 69 Z" fill="#E53935" stroke="#222" stroke-width="2"/>
          <path d="M67 56 L78 74 L61 69 Z" fill="#E53935" stroke="#222" stroke-width="2"/>
          <path d="M48 10 C62 24 64 52 60 72 L36 72 C32 52 34 24 48 10 Z" fill="#FFFFFF" stroke="#222" stroke-width="2.2"/>
          <path d="M48 10 C54 17 58 24 59 30 L37 30 C38 24 42 17 48 10 Z" fill="#E53935"/>
          <circle cx="48" cy="46" r="9" fill="#5CB1D6" stroke="#222" stroke-width="2"/>
        </svg>`,
      },
    ],
    sounds: [createSound('rocket-laser', 'Space Flyby', 'laser', 0.65)],
  },
  {
    id: 'lib-butterfly',
    name: 'Butterfly 1',
    category: 'Animals',
    costumes: [
      {
        id: 'butterfly-a',
        name: 'butterfly1-a',
        width: 90,
        height: 90,
        rotationCenterX: 45,
        rotationCenterY: 45,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="90" height="90">
          <path d="M45 42 C25 14 6 24 14 44 C20 55 34 52 45 46 Z" fill="#9966FF" stroke="#222" stroke-width="2"/>
          <path d="M45 42 C65 14 84 24 76 44 C70 55 56 52 45 46 Z" fill="#9966FF" stroke="#222" stroke-width="2"/>
          <path d="M45 48 C30 50 18 68 30 74 C38 78 44 64 45 52 Z" fill="#CF63CF" stroke="#222" stroke-width="2"/>
          <path d="M45 48 C60 50 72 68 60 74 C52 78 46 64 45 52 Z" fill="#CF63CF" stroke="#222" stroke-width="2"/>
          <ellipse cx="45" cy="48" rx="4" ry="18" fill="#333"/>
          <path d="M43 31 Q37 19 32 20" fill="none" stroke="#333" stroke-width="1.8"/>
          <path d="M47 31 Q53 19 58 20" fill="none" stroke="#333" stroke-width="1.8"/>
        </svg>`,
      },
    ],
    sounds: [createSound('butterfly-pop', 'Pop', 'pop', 0.25)],
  },
  {
    id: 'lib-drum',
    name: 'Drum Kit',
    category: 'Music',
    costumes: [
      {
        id: 'drum-a',
        name: 'drum-a',
        width: 90,
        height: 90,
        rotationCenterX: 45,
        rotationCenterY: 45,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="90" height="90">
          <rect x="20" y="34" width="50" height="36" rx="4" fill="#E53935" stroke="#222" stroke-width="2.2"/>
          <ellipse cx="45" cy="34" rx="25" ry="9" fill="#FFF8E7" stroke="#222" stroke-width="2.2"/>
          <line x1="26" y1="40" x2="36" y2="68" stroke="#FFD500" stroke-width="2.5"/>
          <line x1="36" y1="42" x2="45" y2="69" stroke="#FFD500" stroke-width="2.5"/>
          <line x1="54" y1="42" x2="45" y2="69" stroke="#FFD500" stroke-width="2.5"/>
          <line x1="64" y1="40" x2="54" y2="68" stroke="#FFD500" stroke-width="2.5"/>
        </svg>`,
      },
    ],
    sounds: [createSound('drum-bass', 'Bass Drum', 'drum', 0.45)],
  },
];

export const BACKDROP_LIBRARY: BackdropAsset[] = [
  {
    id: 'backdrop1',
    name: 'backdrop1',
    category: 'All',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <rect width="480" height="360" fill="#FFFFFF"/>
    </svg>`,
  },
  {
    id: 'blue-sky',
    name: 'Blue Sky',
    category: 'Outdoors',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <rect width="480" height="360" fill="#89CFF0"/>
      <ellipse cx="110" cy="85" rx="42" ry="20" fill="#FFFFFF" opacity="0.9"/>
      <ellipse cx="135" cy="78" rx="30" ry="18" fill="#FFFFFF" opacity="0.9"/>
      <ellipse cx="350" cy="65" rx="48" ry="22" fill="#FFFFFF" opacity="0.9"/>
      <ellipse cx="380" cy="72" rx="32" ry="16" fill="#FFFFFF" opacity="0.9"/>
      <path d="M0 285 Q120 265 240 280 T480 275 L480 360 L0 360 Z" fill="#59C059"/>
      <rect x="0" y="305" width="480" height="55" fill="#46B946"/>
    </svg>`,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    category: 'Space',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <defs>
        <linearGradient id="gal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#130933"/>
          <stop offset="55%" stop-color="#301860"/>
          <stop offset="100%" stop-color="#0D1B4C"/>
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#gal)"/>
      <circle cx="95" cy="80" r="2" fill="#FFF"/>
      <circle cx="150" cy="40" r="1.5" fill="#FFF"/>
      <circle cx="240" cy="90" r="2.2" fill="#FFD500"/>
      <circle cx="380" cy="65" r="2" fill="#FFF"/>
      <circle cx="420" cy="145" r="1.5" fill="#FFF"/>
      <circle cx="65" cy="240" r="2" fill="#FFF"/>
      <circle cx="330" cy="260" r="2" fill="#FFF"/>
      <circle cx="410" cy="300" r="2.5" fill="#89CFF0"/>
      <ellipse cx="240" cy="180" rx="140" ry="60" transform="rotate(-18 240 180)" fill="#855CD6" opacity="0.22"/>
      <circle cx="110" cy="120" r="26" fill="#FF8C1A"/>
      <circle cx="370" cy="240" r="34" fill="#5CB1D6"/>
      <ellipse cx="370" cy="240" rx="56" ry="12" transform="rotate(-15 370 240)" fill="none" stroke="#FFD500" stroke-width="4" opacity="0.8"/>
    </svg>`,
  },
  {
    id: 'underwater',
    name: 'Underwater 1',
    category: 'Underwater',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#0369A1"/>
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#sea)"/>
      <path d="M0 305 Q140 285 280 305 T480 295 L480 360 L0 360 Z" fill="#FDE68A"/>
      <path d="M60 315 Q50 265 65 220 Q75 265 68 315" fill="#10B981"/>
      <path d="M405 315 Q395 250 415 200 Q425 255 415 315" fill="#059669"/>
      <circle cx="120" cy="120" r="8" fill="#FFF" opacity="0.35"/>
      <circle cx="135" cy="90" r="5" fill="#FFF" opacity="0.4"/>
      <circle cx="340" cy="140" r="10" fill="#FFF" opacity="0.3"/>
    </svg>`,
  },
  {
    id: 'concert',
    name: 'Concert',
    category: 'Music',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <rect width="480" height="360" fill="#2A144D"/>
      <polygon points="80,0 160,0 240,280 20,280" fill="#855CD6" opacity="0.25"/>
      <polygon points="320,0 400,0 460,280 240,280" fill="#CF63CF" opacity="0.25"/>
      <rect x="0" y="275" width="480" height="85" fill="#1E1B4B"/>
      <rect x="0" y="275" width="480" height="6" fill="#FFAB19"/>
    </svg>`,
  },
  {
    id: 'forest',
    name: 'Forest',
    category: 'Outdoors',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <rect width="480" height="360" fill="#CBEBFB"/>
      <rect x="0" y="270" width="480" height="90" fill="#63B85D"/>
      <rect x="65" y="130" width="22" height="150" fill="#7C4A2D"/>
      <circle cx="76" cy="115" r="50" fill="#3B873E"/>
      <rect x="370" y="140" width="24" height="140" fill="#7C4A2D"/>
      <circle cx="382" cy="120" r="56" fill="#469D49"/>
      <rect x="215" y="175" width="16" height="105" fill="#7C4A2D"/>
      <circle cx="223" cy="160" r="38" fill="#59C059"/>
    </svg>`,
  },
  {
    id: 'desert',
    name: 'Desert',
    category: 'Outdoors',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <rect width="480" height="360" fill="#9CE5FF"/>
      <circle cx="395" cy="68" r="30" fill="#FFD500"/>
      <path d="M0 240 Q120 205 250 245 T480 225 L480 360 L0 360 Z" fill="#F4A261"/>
      <path d="M0 285 Q160 260 320 295 T480 285 L480 360 L0 360 Z" fill="#E76F51"/>
      <rect x="85" y="185" width="14" height="80" rx="7" fill="#2A9D8F"/>
      <path d="M85 215 L69 215 L69 195" fill="none" stroke="#2A9D8F" stroke-width="10" stroke-linecap="round"/>
      <path d="M99 225 L115 225 L115 202" fill="none" stroke="#2A9D8F" stroke-width="10" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'xy-grid',
    name: 'Xy-grid',
    category: 'Patterns',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360">
      <rect width="480" height="360" fill="#FFFFFF"/>
      <g stroke="#E2E8F0" stroke-width="1">
        <line x1="40" y1="0" x2="40" y2="360"/><line x1="140" y1="0" x2="140" y2="360"/>
        <line x1="340" y1="0" x2="340" y2="360"/><line x1="440" y1="0" x2="440" y2="360"/>
        <line x1="0" y1="80" x2="480" y2="80"/><line x1="0" y1="280" x2="480" y2="280"/>
      </g>
      <line x1="240" y1="0" x2="240" y2="360" stroke="#4C97FF" stroke-width="2"/>
      <line x1="0" y1="180" x2="480" y2="180" stroke="#FF8C1A" stroke-width="2"/>
      <circle cx="240" cy="180" r="4" fill="#575E75"/>
      <text x="248" y="196" font-size="11" fill="#575E75" font-family="sans-serif">(0, 0)</text>
      <text x="246" y="18" font-size="11" fill="#4C97FF" font-family="sans-serif">y: 180</text>
      <text x="434" y="172" font-size="11" fill="#FF8C1A" font-family="sans-serif">x: 240</text>
    </svg>`,
  },
];

export const SOUND_LIBRARY_ITEMS: Array<{ name: string; category: string; preset: SoundAsset['preset']; duration: number }> = [
  { name: 'Meow', category: 'Animals', preset: 'meow', duration: 0.72 },
  { name: 'Pop', category: 'Effects', preset: 'pop', duration: 0.22 },
  { name: 'Laser1', category: 'Space', preset: 'laser', duration: 0.45 },
  { name: 'Chime', category: 'Notes', preset: 'chime', duration: 0.6 },
  { name: 'Drum Bass', category: 'Percussion', preset: 'drum', duration: 0.35 },
  { name: 'Boing', category: 'Wacky', preset: 'boing', duration: 0.48 },
  { name: 'Coin', category: 'Effects', preset: 'coin', duration: 0.42 },
  { name: 'Chomp', category: 'Effects', preset: 'bite', duration: 0.3 },
  { name: 'Space Ripple', category: 'Space', preset: 'space', duration: 0.85 },
];

export const EXTENSIONS_CATALOG: ExtensionItem[] = [
  {
    id: 'music',
    name: 'Music',
    description: 'Play instruments and drums.',
    accentColor: '#0FBD8C',
    functional: true,
  },
  {
    id: 'pen',
    name: 'Pen',
    description: 'Draw with your sprites.',
    accentColor: '#0FBD8C',
    functional: true,
  },
  {
    id: 'videoSensing',
    name: 'Video Sensing',
    description: 'Sense motion with the camera.',
    accentColor: '#0FBD8C',
    requires: 'Webcam',
    functional: false,
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    description: 'Make your projects talk.',
    badgeText: 'Amazon Web Services',
    accentColor: '#0FBD8C',
    functional: false,
  },
  {
    id: 'translate',
    name: 'Translate',
    description: 'Translate text into many languages.',
    badgeText: 'Google',
    accentColor: '#0FBD8C',
    functional: false,
  },
  {
    id: 'makeyMakey',
    name: 'Makey Makey',
    description: 'Make anything into a key.',
    accentColor: '#0FBD8C',
    functional: false,
  },
  {
    id: 'microbit',
    name: 'micro:bit',
    description: 'Connect your projects with the world.',
    requires: 'Bluetooth',
    accentColor: '#0FBD8C',
    functional: false,
  },
  {
    id: 'ev3',
    name: 'LEGO MINDSTORMS EV3',
    description: 'Build interactive robots and more.',
    requires: 'Bluetooth',
    accentColor: '#0FBD8C',
    functional: false,
  },
];

export const TUTORIALS_CATALOG: TutorialItem[] = [
  {
    id: 'getStarted',
    title: 'Getting Started',
    category: 'Animation',
    accentColor: '#4C97FF',
    summary: 'Learn the basics of coding in Scratch by making the cat move, talk, and play sounds.',
    steps: [
      {
        title: 'Add a Move block',
        description: 'Drag a "move 10 steps" block from the Motion palette into the coding area, then click it to see the Scratch Cat move!',
        illustrationType: 'move',
        hintBlocks: [
          { text: 'move (10) steps', color: '#4C97FF', shape: 'stack' },
        ],
      },
      {
        title: 'Add a Sound',
        description: 'Click the Sound category and snap a "start sound Meow" block underneath your Move block.',
        illustrationType: 'sound',
        hintBlocks: [
          { text: 'move (10) steps', color: '#4C97FF', shape: 'stack' },
          { text: 'start sound [Meow v]', color: '#CF63CF', shape: 'stack' },
        ],
      },
      {
        title: 'Start with a Green Flag',
        description: 'Open Events and snap "when green flag clicked" onto the top of your stack. Click the Green Flag above the Stage to run!',
        illustrationType: 'flag',
        hintBlocks: [
          { text: 'when ⚑ clicked', color: '#FFBF00', shape: 'hat' },
          { text: 'move (10) steps', color: '#4C97FF', shape: 'stack' },
          { text: 'start sound [Meow v]', color: '#CF63CF', shape: 'stack' },
        ],
      },
      {
        title: 'Add a Backdrop & More!',
        description: 'Try clicking Choose a Backdrop in the bottom-right corner, or switch to the Looks category to make your sprite say "Hello!"',
        illustrationType: 'backdrop',
        hintBlocks: [
          { text: 'say [Hello!] for (2) seconds', color: '#9966FF', shape: 'stack' },
        ],
      },
    ],
  },
  {
    id: 'animateName',
    title: 'Animate a Name',
    category: 'Animation',
    accentColor: '#9966FF',
    summary: 'Animate the letters of your name, initials, or favorite word.',
    steps: [
      {
        title: 'Pick a letter or sprite',
        description: 'Click Choose a Sprite to add new characters or letters to your stage.',
        illustrationType: 'animate',
      },
      {
        title: 'Spin or change color when clicked',
        description: 'Use "when this sprite clicked" with "change color effect by 25" or "turn 15 degrees".',
        illustrationType: 'animate',
        hintBlocks: [
          { text: 'when this sprite clicked', color: '#FFBF00', shape: 'hat' },
          { text: 'change [color v] effect by (25)', color: '#9966FF', shape: 'stack' },
        ],
      },
    ],
  },
  {
    id: 'imagineWorld',
    title: 'Imagine a World',
    category: 'Stories',
    accentColor: '#59C059',
    summary: 'Imagine a world where anything is possible!',
    steps: [
      {
        title: 'Make a sprite say something',
        description: 'Use the "say Hello! for 2 seconds" block in Looks to start your story.',
        illustrationType: 'story',
        hintBlocks: [
          { text: 'when ⚑ clicked', color: '#FFBF00', shape: 'hat' },
          { text: 'say [Welcome to my world!] for (2) seconds', color: '#9966FF', shape: 'stack' },
        ],
      },
      {
        title: 'Switch backdrops',
        description: 'Add a second backdrop from the Backdrop Library and use "next backdrop" to change scenes.',
        illustrationType: 'backdrop',
      },
    ],
  },
  {
    id: 'makeMusic',
    title: 'Make Music',
    category: 'Music',
    accentColor: '#CF63CF',
    summary: 'Choose instruments, add sounds, and press keys to play music.',
    steps: [
      {
        title: 'Add the Music Extension',
        description: 'Click the purple Add Extension button at the bottom-left and choose Music.',
        illustrationType: 'music',
      },
      {
        title: 'Play a note when a key is pressed',
        description: 'Snap "play note 60 for 0.25 beats" under "when space key pressed".',
        illustrationType: 'music',
        hintBlocks: [
          { text: 'when [space v] key pressed', color: '#FFBF00', shape: 'hat' },
          { text: 'play note (60) for (0.25) beats', color: '#0FBD8C', shape: 'stack' },
        ],
      },
    ],
  },
  {
    id: 'chaseGame',
    title: 'Make a Chase Game',
    category: 'Games',
    accentColor: '#FF8C1A',
    summary: 'Make a game where you chase a character to score points.',
    steps: [
      {
        title: 'Move with Arrow Keys',
        description: 'Use "when right arrow key pressed" + "change x by 10" to steer your player.',
        illustrationType: 'chase',
        hintBlocks: [
          { text: 'when [right arrow v] key pressed', color: '#FFBF00', shape: 'hat' },
          { text: 'change x by (10)', color: '#4C97FF', shape: 'stack' },
        ],
      },
      {
        title: 'Keep Score with Variables',
        description: 'Go to Variables and use "change my variable by 1" whenever you catch the star!',
        illustrationType: 'chase',
      },
    ],
  },
  {
    id: 'createStory',
    title: 'Create a Story',
    category: 'Stories',
    accentColor: '#5CB1D6',
    summary: 'Choose characters, add conversation, and bring your story to life.',
    steps: [
      {
        title: 'Set the Scene',
        description: 'Pick a backdrop and place two sprites facing each other.',
        illustrationType: 'story',
      },
      {
        title: 'Start a Conversation',
        description: 'Combine "say" and "wait" blocks so characters take turns speaking.',
        illustrationType: 'story',
      },
    ],
  },
];

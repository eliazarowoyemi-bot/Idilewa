import * as THREE from 'three';
import brandLogoUrl from './assets/idilewa-brand.png';
import landingHomeHeroUrl from './assets/landing-home-hero.webp';
import landingFeatureVoiceUrl from './assets/landing-feature-voice.webp';
import landingFeatureCodeUrl from './assets/landing-feature-code.webp';
import landingFeatureAiUrl from './assets/landing-feature-ai.webp';
import landingFeatureHeritageUrl from './assets/landing-feature-heritage.webp';
import landingJourneyLearnersUrl from './assets/landing-journey-learners.webp';
import './src/convexClient.js';
import {
  init3DCodeRobotGlyphs,
  init3DAuthCanvas,
  init3DStoryCanvas,
  init3DAudioVisualizer,
  init3DTiltEngine,
  autoMount3DElements,
  isWebGLAvailable,
  prefersReducedMotion
} from './src/threeScene.js';
import { AI_CONVERSATION_LANGUAGES, getAiConversationLanguage } from './src/aiConversationLanguages.js';
import {
  DICTIONARY,
  translateText,
  playTonePitch
} from './src/translationEngine.js';
import {
  createPlotweaverVoice,
  getPlotweaverLanguages,
  getRecommendedPlotweaverVoice,
  getPlotweaverVoices,
  speakWithDeviceVoice,
  synthesizePlotweaverSpeech,
  transcribeWithPlotweaver,
  translateWithPlotweaver,
  translateWithGoogle
} from './src/plotweaverClient.js';
import { loadAiChatConversation, sendAiChatMessage } from './src/aiChatClient.js';
import {
  NASAL_VOWELS,
  CONSONANTS,
  TONE_MARKS,
  ORAL_VOWEL_TONES,
  getOralVowelSequenceSpeechText
} from './src/vowelsConsonantsData.js';
import {
  YORUBA_KEYWORDS,
  YORUBA_COLOR_MAP,
  YORUBA_CODE_LESSONS,
  executeYorubaCode,
  transpileYorubaToJS,
  speakYorubaTerm
} from './src/yorubaCodeEngine.js';
import {
  supabase,
  isSupabaseConfigured,
  getCurrentUser,
  getOptionalSessionAccessToken,
  getRoleDashboard,
  getAdultLearningSummary,
  submitEducatorConnectionRequest,
  withdrawEducatorConnection,
  updateUserProfile,
  signOut as signOutAccount,
  signIn as signInAccount,
  signUp as signUpAccount,
  verifyEducatorInvite,
  resendSignupConfirmation,
  restoreAuthSession,
  requestSigninOtp,
  verifySigninOtp,
  sendAuthActivityEmail,
  updateAccountPassword,
  isSignupPasswordValid,
  saveProgress,
  getUserProgress,
  saveCodeSubmission
} from './src/supabaseClient.js';
import {
  getVoiceGradeLessonSlice,
  getVoiceGradePath,
  VOICE_GRADE_PATHS
} from './src/voiceGradeCurriculum.js';

/* Idilewa responsive learning prototype — dependency free, client-side demo. */
(async () => {
  'use strict';

  const canonicalHost = 'www.idilewa.com';
  const redirectHosts = new Set([
    'idlewa.com',
    'www.idlewa.com',
    'idilewa-com.vercel.app',
    'idilewa-com-tapee2.vercel.app',
  ]);
  if (redirectHosts.has(window.location.hostname.toLowerCase())) {
    const destination = new URL(window.location.href);
    destination.protocol = 'https:';
    destination.hostname = canonicalHost;
    destination.port = '';
    window.location.replace(destination.href);
    return;
  }

  const ROUTES = [
    'voice_lessons',
    'voice-progress',
    'ai-conversation',
    'voice-language', 'voice-grade', 'voice-audio', 'voice-practice',
    'voice-text-to-speech', 'voice-cloning', 'voice-speech-to-text', 'voice-translation',
    'families', 'parent-login', 'parent-signup', 'parent-dashboard', 'parent-children',
    'parent-progress', 'parent-messages', 'parent-settings', 'parent-welcome',
    'tutor', 'tutor-login', 'tutor-signup', 'tutor-dashboard', 'tutor-find-child', 'tutor-students',
    'tutor-consent', 'tutor-lesson', 'tutor-messages', 'tutor-profile', 'tutor-availability', 'tutor-settings',
    'mentors',
    'index', 'about', 'connect_students', 'connect_teachers', 'consent', 'contact', 'privacy', 'course',
    'keepers',
    'kids', 'languages', 'lesson', 'login', 'oral', 'oral_genre', 'oriki', 'owe',
    'owe_add', 'owe_detail', 'owe_story', 'owe_reflection', 'pricing', 'profile',
    'voices'
  ];
  const REMOVED_ROUTES = new Set([
    'adult', 'parent_dashboard', 'educator_dashboard', 'world', 'explore', 'undefined',
    'coding', 'coding-studio', 'method', 'base', 'human', 'guides', 'game', 'library',
    'individuals', 'schools', 'ifa', 'ifa_odu', 'curriculum', 'learn', 'payment'
  ]);
  const OWE_ROUTE_SECTIONS = {
    owe_detail: 'meaning',
    owe_story: 'story',
    owe_reflection: 'reflection'
  };

  const LANGUAGES = [
    { id: 'yoruba', name: 'Yorùbá', native: 'Èdè Yorùbá', greeting: 'Ẹ káàárọ̀', hello: 'Báwo ni?', translation: 'Good morning', glyph: 'È', region: 'Nigeria · Benin · Togo', tint: 'mint', lessons: 'Practice at your own pace' },
    { id: 'igbo', name: 'Igbo', native: 'Asụsụ Igbo', greeting: 'Ndewo', hello: 'Kedu?', translation: 'Hello', glyph: 'Ị', region: 'South-eastern Nigeria', tint: 'peach', lessons: 'Practice at your own pace' },
    { id: 'hausa', name: 'Hausa', native: 'Harshen Hausa', greeting: 'Sannu', hello: 'Yaya dai?', translation: 'Hello', glyph: 'H', region: 'West & Central Africa', tint: 'blue', lessons: 'Practice at your own pace' },
    { id: 'swahili', name: 'Swahili', native: 'Kiswahili', greeting: 'Habari', hello: 'Hujambo?', translation: 'How are you?', glyph: 'S', region: 'East Africa', tint: 'lilac', lessons: 'Practice at your own pace' }
  ];

  const SOON_LANGUAGES = [
    { id: 'twi', name: 'Twi', region: 'Ghana', glyph: 'T' },
    { id: 'wolof', name: 'Wolof', region: 'Senegal · The Gambia', glyph: 'W' },
    { id: 'zulu', name: 'isiZulu', region: 'Southern Africa', glyph: 'Z' },
    { id: 'fulfulde', name: 'Fulfulde', region: 'Across the Sahel', glyph: 'F' }
  ];

  const ICONS = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowUp: '<path d="M12 19V5m-7 7 7-7 7 7"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h7"/>',
    headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="13" width="4" height="7" rx="2"/><rect x="17" y="13" width="4" height="7" rx="2"/>',
    code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-11-4 14"/>',
    leaf: '<path d="M20.8 3.2C13 2.6 6.7 4.5 4 8.3c-2.2 3.1-.6 7.1 2.7 7.8 3.6.8 8.4-1.9 10.2-5.8-2.8 5.1-7.2 7.9-12.7 9.4"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    play: '<path d="m9 6 10 6-10 6z" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    sparkles: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z"/>',
    people: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    school: '<path d="m3 10 9-6 9 6-9 6zM5 12v5c4.4 3.4 9.6 3.4 14 0v-5M21 10v7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    music: '<path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Zm12-2a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z"/>',
    quote: '<path d="M3 11h7v8H3zM14 11h7v8h-7zM3 11a7 7 0 0 1 7-7M14 11a7 7 0 0 1 7-7"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    heart: '<path d="M20.8 8.6c0 5.4-8.8 11-8.8 11s-8.8-5.6-8.8-11A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.4Z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    send: '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
    filter: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    globe2: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    volume: '<path d="M4 10v4h4l5 4V6l-5 4zM17 9a5 5 0 0 1 0 6m2.5-8.5a9 9 0 0 1 0 11"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    trophy: '<path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0zM7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
    settings: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.7a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z"/>',
    chart: '<path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.7 9a7 7 0 0 1 12-2L20 12M4 12l2.3 5a7 7 0 0 0 12-2"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z"/>',
    translate: '<path d="M4 5h10M9 3v2c0 4-2.5 7.5-6 9"/><path d="M6 12c1.6 2.6 4 4.4 7 5M13 21l4-10 4 10m-6.8-3h5.6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 4-2 5-2 5h16s-2-1-2-5"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
    'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    gamepad: '<rect x="2" y="7" width="20" height="10" rx="4"/><path d="M7 10v4m-2-2h4m7 0h.01M17.5 13.5h.01"/>',
    moon: '<path d="M21 13a8.5 8.5 0 1 1-9.9-9.6 7 7 0 0 0 9.9 9.6Z"/>',
    landmark: '<path d="M3 21h18M4 21V10m5 11V10m6 11V10m5 11V10M3 10l9-6 9 6z"/>',
    smartphone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    phone: '<path d="M7 3h3l2 5-2.5 1.5a12 12 0 0 0 5 5L16 12l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 5 5.2 2 2 0 0 1 7 3Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20m-16 5h3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
    activity: '<path d="M3 12h4l2.5-7 5 14 2.5-7h4"/>',
    lightbulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11.2V16h6v-1.8A6 6 0 0 0 12 3Z"/>',
    arrowLeft: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    bot: '<circle cx="12" cy="3.4" r="1.3" fill="currentColor" stroke="none"/><path d="M12 4.7v2.7"/><rect x="3.8" y="7.4" width="16.4" height="12.6" rx="4.6"/><circle cx="9" cy="12.4" r="1.25" fill="currentColor" stroke="none"/><circle cx="15" cy="12.4" r="1.25" fill="currentColor" stroke="none"/><path d="M9.6 16.2h4.8"/>',
    library: '<path d="M4 3.2h3.6v17.6H4zM9.2 3.2h3.6v17.6H9.2zM15.6 4.4l3.4.9-4.5 16.3-3.4-.9z"/>',
    speed: '<path d="M4.2 16a9 9 0 1 1 15.6 0"/><path d="m12 13 4.2-4.2"/><circle cx="12" cy="13.4" r="1.5" fill="currentColor" stroke="none"/>',

  };

  const PAGE_META = {
    voice_lessons: {
      title: 'Master African Tonal Pitch with Interactive Voice Practice.',
      eyebrow: 'Voice Lessons',
      desc: 'Interactive speech studio with pitch detection, tone melody soundboards, and voice synthesis across African languages.',
      icon: 'mic', image: 'listening-reader.jpg', imageAlt: 'A learner practicing voice pronunciation with interactive audio',
      active: 0, flow: ['Select Language', 'Hear Native Tones', 'Record & Analyze', 'Earn Certificate'],
      cta: 'Open Voice Lessons', ctaRoute: 'voice_lessons',
      cards: [
        { title: 'Tonal Pitch Melody', text: 'Hear high, mid, and low tonal frequencies with dynamic soundboard keys.', icon: 'music', route: 'voice_lessons', tone: 'mint' },
        { title: 'Speech Evaluation', text: 'Practice pronunciation, rhythm, and clarity with feedback.', icon: 'mic', route: 'voice_lessons', tone: 'yellow' },
        { title: 'Guided Audio Lessons', text: 'Start with Yoruba sounds, then explore beginner, intermediate, and advanced lessons.', icon: 'book', route: 'voice_lessons', tone: 'blue' }
      ]
    },
    adult: {
      title: 'Adult Learning',
      eyebrow: 'For independent adult learners',
      desc: 'Build practical confidence in African languages, coding, robotics and creative technology at your own pace.',
      icon: 'compass', image: 'code-kids.jpg', imageAlt: 'Learners exploring creative technology',
      active: 1, flow: ['Choose a goal', 'Learn a concept', 'Build a project', 'Reflect and grow'],
      cta: 'Start a language path', ctaRoute: 'languages',
      cards: [
        { title: 'Learn a language', text: 'Practice real-world listening and speaking in supported African language paths.', icon: 'volume', route: 'languages', tone: 'mint' },
        { title: 'Practice with a mentor', text: 'Meet heritage scholars for guided speaking and cultural context.', icon: 'people', route: 'mentors', tone: 'blue' },
        { title: 'Read and listen', text: 'Explore proverbs, oral history and cultural notes at your own pace.', icon: 'headphones', route: 'oral', tone: 'peach' }
      ]
    },
    about: {
      title: 'Culture is not a chapter. It is the whole story.',
      eyebrow: 'About Idilewa',
      desc: 'A welcoming digital home where African languages, living heritage and future-facing skills grow together.',
      icon: 'leaf', image: 'story', imageAlt: 'A grandmother sharing a story with children',
      active: 2, flow: ['Belong', 'Discover', 'Learn', 'Pass it on'],
      cta: 'Explore our approach', ctaRoute: 'about',
      cards: [
        { title: 'Language lives in community', text: 'Learning grows through everyday words, family stories and the voices of people who carry them.', icon: 'people', route: 'families', tone: 'mint' },
        { title: 'Culture belongs in the classroom', text: 'Proverbs, oral traditions and cultural context sit beside language practice—not on the sidelines.', icon: 'book', route: 'oral', tone: 'peach' },
        { title: 'Practice speaking', text: 'Guided voice lessons help learners build confidence and warmth.', icon: 'mic', route: 'voice_lessons', tone: 'blue' }
      ]
    },
    kids: {
      title: 'Big worlds begin with a few good words.',
      eyebrow: 'A learning space for kids',
      desc: 'Short lessons, warm stories and creative challenges help young learners explore language, culture and technology.',
      icon: 'sparkles', image: 'kids', imageAlt: 'Three children in Yorùbá traditional attire learning together',
      active: 0, flow: ['Pick a language', 'Meet new words', 'Play and practice', 'Share a story'],
      cta: 'Start a kid-friendly path', ctaRoute: 'languages',
      cards: [
        { title: 'Words you can use today', text: 'Learn friendly greetings and everyday phrases with clear audio prompts.', icon: 'volume', route: 'course', tone: 'mint' },
        { title: 'Learn together', text: 'Explore language, culture and creative challenges as a family.', icon: 'book', route: 'oral', tone: 'peach' }
      ]
    },
    keepers: {
      title: 'Listen first. Credit the people behind the knowledge.',
      eyebrow: 'Language & culture keepers',
      desc: 'Idilewa is designed to centre the people who teach, record and care for language and cultural knowledge.',
      icon: 'heart', image: 'story', imageAlt: 'A cultural elder sharing a story',
      active: 2, flow: ['Listen well', 'Understand context', 'Give credit', 'Share with care'],
      cta: 'Explore our approach', ctaRoute: 'about',
      cards: [
        { title: 'Oral historians', text: 'Help place stories and expressions in their local and historical context.', icon: 'quote', route: 'oral', tone: 'peach' },
        { title: 'Language teachers', text: 'Support accurate, welcoming learning experiences for every level.', icon: 'school', route: 'families', tone: 'mint' },
        { title: 'Community voices', text: 'Shape what is shared, how it is attributed and what should remain private.', icon: 'shield', route: 'about', tone: 'blue' }
      ]
    },
  };

  const NAV = [
    { label: 'Home', route: 'index', group: 'home' },
    { label: 'Voice Lessons', route: 'voice_lessons', group: 'trainer' },
    { label: 'AI Conversation', route: 'ai-conversation', group: 'conversation' },
    { label: 'For Tutors', route: 'tutor', group: 'tutor' }
  ];
  const MENU_NAV = [...NAV,
    { label: 'Mentors', route: 'mentors', group: 'mentors' },
    { label: 'For Parents', route: 'families', group: 'families' },
    { label: 'Read & listen', route: 'oral', group: 'read' },
    { label: 'About', route: 'about', group: 'about' }
  ];

  const NAV_GROUPS = {
    families: 'families',
    'parent-login': 'families',
    'parent-signup': 'families',
    'parent-dashboard': 'families',
    'parent-children': 'families',
    'parent-progress': 'families',
    'parent-messages': 'families',
    'parent-settings': 'families',
    'parent-welcome': 'families',
    tutor: 'tutor',
    mentors: 'mentors',
    'tutor-login': 'tutor',
    'tutor-signup': 'tutor',
    'tutor-dashboard': 'tutor',
    'tutor-find-child': 'tutor',
    'tutor-students': 'tutor',
    'tutor-consent': 'tutor',
    'tutor-lesson': 'tutor',
    'tutor-messages': 'tutor',
    'tutor-profile': 'tutor',
    'tutor-availability': 'tutor',
    'tutor-settings': 'tutor',
    voice_lessons: 'trainer', 'ai-conversation': 'conversation',
    languages: 'read', course: 'read', lesson: 'read', kids: 'read',
    oral: 'read', oral_genre: 'read', oriki: 'read', owe: 'read', owe_add: 'read',
    owe_detail: 'read', owe_story: 'read', owe_reflection: 'read', voices: 'read',
    connect_students: 'about', connect_teachers: 'about', consent: 'about', contact: 'about', privacy: 'about',
    about: 'about',
    keepers: 'culture'
  };

  const LABELS = Object.fromEntries(ROUTES.map((r) => [r, r === 'index' ? 'Home' : r.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())]));
  Object.assign(LABELS, {
    'voice-language': 'Choose a voice lesson language',
    'ai-conversation': 'AI Conversation',
    'voice-grade': 'Choose a voice lesson grade',
    'voice-audio': 'Voice audio lessons',
    'voice-practice': 'Voice lesson practice',
    'voice-text-to-speech': 'Text to Speech',
    'voice-cloning': 'Voice Cloning',
    'voice-speech-to-text': 'Speech to Text',
    'voice-translation': 'Translation',
  });
  LABELS.ifa_odu = 'Odu culture note';
  LABELS.owe = 'Owe';
  LABELS.owe_add = 'Share a proverb';
  LABELS.owe_detail = 'Owe'; LABELS.owe_story = 'Owe'; LABELS.owe_reflection = 'Owe';
  LABELS.connect_students = 'Connect with Students'; LABELS.connect_teachers = 'Connect with Teachers';
  LABELS.consent = 'Parent & guardian consent';
  LABELS.contact = 'Contact';
  LABELS.privacy = 'Privacy';
  LABELS.library = 'Library';
  LABELS.game = 'Tile game';
  LABELS.voice_lessons = 'Voice Lessons';
  LABELS['voice-progress'] = 'Voice progress';
  Object.assign(LABELS, {
    families: 'For Parents',
    'parent-login': 'Parent Login',
    'parent-signup': 'Create Parent Account',
    'parent-dashboard': 'Family Dashboard',
    'parent-children': 'My Children',
    'parent-progress': 'Learning Progress',
    'parent-messages': 'Messages',
    'parent-settings': 'Settings',
    'parent-welcome': 'You’re all set',
    tutor: 'Tutor Portal',
    'tutor-login': 'Tutor sign in',
    'tutor-signup': 'Create tutor account',
    'tutor-dashboard': 'Tutor dashboard',
    'tutor-find-child': 'Find a child',
    'tutor-students': 'My students',
    'tutor-consent': 'Parent consent',
    'tutor-lesson': 'Today’s lesson',
    'tutor-messages': 'Tutor messages',
    'tutor-profile': 'Tutor profile',
    'tutor-availability': 'Tutor availability',
    'tutor-settings': 'Tutor settings'
  });

  const defaults = {
    currentLang: 'yoruba',
    level: 'beginner',
    points: 0,
    streak: 0,
    completed: [],
    lessonResponses: {},
    quizResults: {},
    rewarded: {},
    saved: [],
    savedTranslations: [],
    translationLessons: [],
    savedProverbs: [],
    reflections: [],
    reflectionFeeling: '',
    teacherRequests: [],
    teacherReplies: [],
    teacherFilter: 'all',
    interested: [],
    available: { yoruba: true, igbo: true, hausa: true, swahili: true, twi: false, wolof: false, zulu: false, fulfulde: false },
    loginMode: 'signin',
    authRole: 'adult',
    billing: 'monthly',
    consent: {
      requestCode: '', approvedCode: '', approved: false,
      learnerAlias: 'Young learner', accountApproved: false,
      tutorApproved: false, tutorId: '', childVerified: false,
      tutorValidatedFor: '', assignmentAccepted: false,
      requestedAt: '', approvedAt: '', expiresAt: 0
    },
    coding: {
      stage: 0, techId: 'html', level: 'beginner', missionId: 'hello',
      helperLanguage: 'yoruba', search: '', points: 0, streak: 0,
      filter: 'all', category: 'all', lessonSearch: '', completedLessons: [],
      lastPracticeDate: '', completed: [], draft: '', result: '',
      questCommands: [], questTrail: [], questResult: '',
      ideLang: 'yoruba', idePresetId: 'hello_world',
      ideCode: '# Kí Ilé Ayé ní Èdè Yorùbá\njẹ́ orúkọ = "Ọmọ Yorùbá"\ntẹ_jade("Ẹ n lẹ́ o, " + orúkọ + "! Ẹ káàbọ̀ sí Idíléwà.")\ntẹ_jade("A n kọ́ koodu ní èdè abínibí wa lónìí! ✨")',
      ideOutput: '> [Idilewa Engine v2.4 Online]\n> Ẹ n lẹ́ o, Ọmọ Yorùbá! Ẹ káàbọ̀ sí Idíléwà.\n> A n kọ́ koodu ní èdè abínibí wa lónìí! ✨\n✓ Àṣeyọrí: Execution completed in 0.02ms (+10 Maker XP)',
      ideTab: 'terminal', ideRuntime: '0.02ms', ideXp: 10, ideOutputHeight: 240,
      ideSidebar: 'explorer', ideInstalledExtensions: [], ideAssistantMessages: []
    },
    trainer: {
      lang: 'yoruba',
      level: 'beginner',
      activeLessonId: 1,
      speed: 1.0,
      voiceId: '',
      clonedVoices: [],
      isRecording: false,
      score: null,
      analysis: null,
      completed: {},
      xp: 220,
      streak: 5
    },
  };

  function readState() {
    try {
      const stored = JSON.parse(localStorage.getItem('idilewa-demo-state') || '{}');
      const storedCoding = { ...(stored.coding || {}) };
      for (const key of [
        'codeCategory', 'codeCharacter', 'codeMessage', 'codeSourceLanguage', 'codeTargetLanguage',
        'codeBlocks', 'codeUndo', 'codeRedo', 'codeOutput', 'codeStatus', 'playScreen', 'playGame',
        'playMode', 'playCharacter', 'playBlocks', 'playSaved', 'playScore', 'playStepCount', 'playBilingual'
      ]) delete storedCoding[key];
      return {
        ...defaults,
        ...stored,
        available: { ...defaults.available, ...(stored.available || {}) },
        consent: { ...defaults.consent, ...(stored.consent || {}) },
        trainer: {
          ...defaults.trainer,
          ...(stored.trainer || {}),
          voiceId: typeof stored.trainer?.voiceId === 'string' ? stored.trainer.voiceId.slice(0, 120) : '',
          clonedVoices: Array.isArray(stored.trainer?.clonedVoices)
            ? stored.trainer.clonedVoices
              .filter((voice) => typeof voice?.voice_id === 'string'
                && voice.voice_id.length <= 120
                && typeof voice?.name === 'string')
              .slice(0, 20)
              .map(({ voice_id, name }) => ({ voice_id, name: name.slice(0, 80), type: 'cloned' }))
            : [],
          completed: typeof stored.trainer?.completed === 'object' && stored.trainer.completed !== null ? stored.trainer.completed : {}
        },
        coding: {
          ...defaults.coding,
          ...storedCoding,
          completed: Array.isArray(stored.coding?.completed) ? stored.coding.completed : [],
          completedLessons: Array.isArray(stored.coding?.completedLessons) ? stored.coding.completedLessons : [],
          filter: typeof stored.coding?.filter === 'string' ? stored.coding.filter : 'all',
          category: typeof stored.coding?.category === 'string' ? stored.coding.category : 'all',
          lessonSearch: typeof stored.coding?.lessonSearch === 'string' ? stored.coding.lessonSearch : '',
          questCommands: Array.isArray(stored.coding?.questCommands) ? stored.coding.questCommands.filter((step) => ['up', 'right', 'down', 'left'].includes(step)).slice(0, 12) : [],
          questTrail: Array.isArray(stored.coding?.questTrail) ? stored.coding.questTrail.filter((cell) => typeof cell === 'string').slice(0, 20) : [],
          questResult: typeof stored.coding?.questResult === 'string' ? stored.coding.questResult : '',
          ideSidebar: ['explorer', 'extensions'].includes(stored.coding?.ideSidebar) ? stored.coding.ideSidebar : 'explorer',
          ideOutputHeight: Number.isInteger(stored.coding?.ideOutputHeight)
            ? Math.min(900, Math.max(170, stored.coding.ideOutputHeight))
            : defaults.coding.ideOutputHeight,
          ideInstalledExtensions: Array.isArray(stored.coding?.ideInstalledExtensions) ? stored.coding.ideInstalledExtensions.filter((id) => typeof id === 'string') : [],
          ideAssistantMessages: Array.isArray(stored.coding?.ideAssistantMessages) ? stored.coding.ideAssistantMessages.filter((message) => message && ['user', 'assistant'].includes(message.role) && typeof message.text === 'string').slice(-12) : [],
          search: typeof stored.coding?.search === 'string' ? stored.coding.search : '',
          draft: typeof stored.coding?.draft === 'string' ? stored.coding.draft : '',
          result: typeof stored.coding?.result === 'string' ? stored.coding.result : ''
        },
        lessonResponses: { ...(stored.lessonResponses || {}) },
        quizResults: { ...(stored.quizResults || {}) },
        rewarded: { ...(stored.rewarded || {}) },
        saved: Array.isArray(stored.saved) ? stored.saved : [],
        savedTranslations: Array.isArray(stored.savedTranslations)
          ? stored.savedTranslations.filter((item) => item && typeof item.id === 'string'
            && typeof item.source === 'string' && typeof item.translated === 'string'
            && typeof item.sourceLanguage === 'string' && typeof item.targetLanguage === 'string')
            .slice(0, 50)
            .map((item) => ({
              id: item.id.slice(0, 80),
              source: item.source.slice(0, 500),
              translated: item.translated.slice(0, 2_000),
              sourceLanguage: item.sourceLanguage.slice(0, 20),
              targetLanguage: item.targetLanguage.slice(0, 20),
            }))
          : [],
        translationLessons: Array.isArray(stored.translationLessons)
          ? stored.translationLessons.filter((item) => item && typeof item.id === 'string'
            && typeof item.source === 'string' && typeof item.translated === 'string'
            && typeof item.sourceLanguage === 'string' && typeof item.targetLanguage === 'string')
            .slice(0, 50)
            .map((item) => ({
              id: item.id.slice(0, 80),
              source: item.source.slice(0, 500),
              translated: item.translated.slice(0, 2_000),
              sourceLanguage: item.sourceLanguage.slice(0, 20),
              targetLanguage: item.targetLanguage.slice(0, 20),
              languageName: typeof item.languageName === 'string' ? item.languageName.slice(0, 40) : '',
            }))
          : [],
        savedProverbs: Array.isArray(stored.savedProverbs) ? stored.savedProverbs : [],
        reflections: Array.isArray(stored.reflections) ? stored.reflections : [],
        teacherRequests: Array.isArray(stored.teacherRequests) ? stored.teacherRequests : [],
        teacherReplies: Array.isArray(stored.teacherReplies) ? stored.teacherReplies : [],
        teacherFilter: typeof stored.teacherFilter === 'string' ? stored.teacherFilter : 'all',
        reflectionFeeling: typeof stored.reflectionFeeling === 'string' ? stored.reflectionFeeling : '',
        authRole: stored.authRole === 'child' ? 'child' : 'adult',
        completed: Array.isArray(stored.completed) ? stored.completed : defaults.completed.slice(),
        interested: Array.isArray(stored.interested) ? stored.interested : []
      };
    } catch (_) { return { ...defaults, available: { ...defaults.available }, trainer: { ...defaults.trainer } }; }
  }
  const state = readState();
  let pendingSignupEmail = '';
  for (const key of [
    'idilewa-pending-signup-email',
    'idilewa-pending-signin-otp',
    'idilewa-password-reset-verified',
    'idilewa-guardian-signup',
  ]) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }
  let signupEmailForSignin = '';
  let pendingSignin = null;
  let passwordResetVerified = false;
  let verifiedGuardianSignup = (() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('idilewa-guardian-signup') || 'null');
      return saved && /^[0-9a-f-]{36}$/i.test(saved.approvalId || '') && typeof saved.email === 'string'
        ? { approvalId: saved.approvalId, email: saved.email.toLowerCase() }
        : null;
    } catch (_) {
      return null;
    }
  })();
  if (state.level === 'growing') state.level = 'intermediate';
  if (state.level === 'fluent') state.level = 'advanced';
  if (!['beginner', 'intermediate', 'advanced'].includes(state.level)) state.level = 'beginner';

  function saveState() {
    try { localStorage.setItem('idilewa-demo-state', JSON.stringify(state)); } catch (_) { /* private browsing */ }
  }

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const imageUrl = (filename) => window.__IDILEWA_ASSETS__?.[filename] || `/assets/${filename}`;
  const icon = (name, size = 20, extraClass = '') => `<svg class="icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sparkles}</svg>`;
  const getLanguage = (id = state.currentLang) => {
    const active = LANGUAGES.find((l) => l.id === id);
    if (active) return active;
    const planned = SOON_LANGUAGES.find((l) => l.id === id);
    return planned ? { ...planned, native: planned.name, tint: 'peach', greeting: '', hello: '', translation: '', lessons: 'Learning materials in preparation', upcoming: true } : LANGUAGES[0];
  };

  let defaultAuthEntryInitialized = false;
  let authRouteInitialized = false;
  let authIntroPending = !window.location.hash;
  function parseLocation() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      const defaultPage = document.body?.dataset?.defaultRoute || 'login';
      if (OWE_ROUTE_SECTIONS[defaultPage]) {
        const section = OWE_ROUTE_SECTIONS[defaultPage];
        history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/owe?section=${section}`);
        return { page: 'owe', params: { section }, removedRoute: false };
      }
      if (defaultPage === 'login' && !defaultAuthEntryInitialized) {
        state.loginMode = 'signin';
        state.authRole = 'adult';
        defaultAuthEntryInitialized = true;
        authRouteInitialized = true;
      }
      return { page: ROUTES.includes(defaultPage) ? defaultPage : 'index', params: {}, removedRoute: false };
    }
    const [path, query = ''] = hash.split('?');
    let page = path.split('/')[0] || 'index';
    const params = Object.fromEntries(new URLSearchParams(query));
    if (page === 'trainer') {
      page = 'voice_lessons';
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/voice_lessons${query ? `?${query}` : ''}`);
    }
    if (OWE_ROUTE_SECTIONS[page]) {
      params.section = params.section || OWE_ROUTE_SECTIONS[page];
      page = 'owe';
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/owe?section=${encodeURIComponent(params.section)}`);
    }
    if (page === 'login') {
      const nextMode = ['signin', 'signup'].includes(params.mode) ? params.mode : 'signin';
      if (!authRouteInitialized || state.loginMode !== nextMode) state.authRole = 'adult';
      state.loginMode = nextMode;
      authRouteInitialized = true;
    }
    return {
      page: REMOVED_ROUTES.has(page) || !ROUTES.includes(page) ? 'index' : page,
      params,
      removedRoute: REMOVED_ROUTES.has(page) || !ROUTES.includes(page)
    };
  }

  function navigate(route, params = {}, replace = false) {
    const section = OWE_ROUTE_SECTIONS[route];
    if (section) {
      route = 'owe';
      params = { ...params, section: params.section || section };
    }
    const page = ROUTES.includes(route) ? route : 'index';
    const query = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const next = `#/${page}${query ? `?${query}` : ''}`;
    if (window.location.hash === next) render();
    else if (replace) history.replaceState(null, '', next), render();
    else window.location.hash = next;
    closeMobileMenu();
    if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function roleHomeRoute(role) {
    if (role === 'parent') return 'parent-dashboard';
    if (role === 'educator') return 'tutor-dashboard';
    return 'index';
  }

  function routeLink(route, label, cls = '', attrs = '') {
    const section = OWE_ROUTE_SECTIONS[route];
    const destination = section ? 'owe' : route;
    const query = section ? `?section=${section}` : '';
    const sectionAttr = section ? `data-section="${section}"` : '';
    return `<a class="${cls}" href="#/${destination}${query}" data-route="${destination}" ${sectionAttr} ${attrs}>${label}</a>`;
  }

  function brandLogo(alt = '') {
    return `<img class="brand-logo" src="${brandLogoUrl}" alt="${esc(alt)}" />`;
  }

  function renderHeader(page) {
    const academyShell = page === 'index' || page === 'voice_lessons' || page.startsWith('voice-');
    document.body.classList.toggle('academy-reference-shell', academyShell);
    if (page === 'login' || page === 'ai-conversation' || page.startsWith('tutor') || page.startsWith('parent') || page === 'families') {
      document.getElementById('site-header').innerHTML = '';
      return;
    }
    const currentUser = getCurrentUser();
    const currentGroup = NAV_GROUPS[page] || (page === 'index'
      ? 'home'
      : page === 'voice_lessons' || page.startsWith('voice-')
        ? 'trainer'
        : '');
    const academyNav = [
      { route: 'index', label: 'Home' },
      { route: 'voice_lessons', label: 'Learn' },
      { route: 'voice-translation', label: 'Translate & Listen' },
      { route: 'voice-progress', label: 'Progress' }
    ];
    const nav = (academyShell ? academyNav : NAV).map((item) => {
      const active = academyShell
        ? item.route === page || (item.route === 'voice_lessons' && (page === 'voice_lessons' || (page.startsWith('voice-') && page !== 'voice-progress' && page !== 'voice-translation')))
        : currentGroup === item.group;
      const current = active ? ' aria-current="page"' : '';
      return academyShell
        ? `<a class="nav-link ${active ? 'active' : ''}" href="#/${item.route}" data-route="${item.route}"${current}>${item.label}</a>`
        : item.href
        ? `<a class="nav-link ${active ? 'active' : ''}" href="${item.href}"${current}>${item.label}</a>`
        : `<a class="nav-link ${active ? 'active' : ''}" href="#/${item.route}" data-route="${item.route}"${current}>${item.label}</a>`;
    }).join('');
    const avatarLabel = currentUser?.name?.trim()?.charAt(0)?.toUpperCase() || 'S';
    const profileAvatar = profilePhoto
      ? `<img src="${esc(profilePhoto)}" alt="" />`
      : esc(avatarLabel);
    const accountActions = currentUser
      ? `<a class="header-profile ${page === 'profile' ? 'active' : ''}" href="#/profile" data-route="profile" aria-label="Open profile"${page === 'profile' ? ' aria-current="page"' : ''}><span class="header-avatar">${profileAvatar}</span><span class="header-profile-label">${esc(currentUser.name || 'Profile')}</span></a><button class="header-signout" type="button" data-action="account-sign-out">Sign out</button>`
      : academyShell
        ? `${routeLink('login', 'Log in', 'header-signin', 'data-mode="signin"')}${routeLink('voice_lessons', 'Start Learning', 'button button-primary header-cta')}`
        : `${routeLink('login', 'Log in', 'header-signin', 'data-mode="signin"')}${routeLink('login', 'Get started', 'button button-primary header-cta', 'data-mode="signup"')}`;
    const mobileShortcuts = [
      { route: 'profile', label: 'Profile', ico: 'user' }
    ].map((item) => `<a class="mobile-menu-link ${page === item.route ? 'active' : ''}" href="#/${item.route}" data-route="${item.route}">${icon(item.ico, 19)}<span>${item.label}</span>${icon('arrow', 16)}</a>`).join('');
    const menu = MENU_NAV.map((item) => {
      const iconName = item.href ? 'code' : item.group === 'home' ? 'home' : item.group === 'trainer' ? 'mic' : item.group === 'learn' ? 'book' : item.group === 'read' ? 'headphones' : item.group === 'code' ? 'code' : item.group === 'stories' ? 'quote' : item.group === 'community' ? 'people' : 'sparkles';
      const active = currentGroup === item.group ? 'active' : '';
      return item.href
        ? `<a class="mobile-menu-link ${active}" href="${item.href}">${icon(iconName, 19)}<span>${item.label}</span>${icon('arrow', 16)}</a>`
        : `<a class="mobile-menu-link ${active}" href="#/${item.route}" data-route="${item.route}">${icon(iconName, 19)}<span>${item.label}</span>${icon('arrow', 16)}</a>`;
    }).join('') + mobileShortcuts;
    document.getElementById('mobile-menu')?.remove();
    document.getElementById('site-header').innerHTML = `
      <div class="header-inner ${academyShell ? 'academy-reference-header' : ''}">
        <a class="brand" href="#/index" data-route="index" aria-label="Idilewa home">
          ${brandLogo('Idilewa · Language · Culture · Future')}
        </a>
        <nav class="desktop-nav" aria-label="Main navigation">${nav}</nav>
        <div class="header-actions">
          <button class="icon-button search-button" type="button" data-action="open-search" aria-label="Search Idilewa">${icon('search', 18)}</button>
          ${accountActions}
          <button class="icon-button menu-toggle" type="button" data-action="toggle-menu" aria-label="Open navigation" aria-expanded="false">${icon('menu', 21)}</button>
        </div>
      </div>
      <div id="mobile-menu" class="mobile-menu" aria-hidden="true">
        <button class="mobile-menu-backdrop" type="button" data-action="toggle-menu" aria-label="Close navigation" tabindex="-1"></button>
        <div class="mobile-menu-panel">
          <div class="mobile-menu-head"><div class="mobile-menu-heading"><span>YOUR NEXT STEP</span><strong>Explore Idilewa</strong></div><button class="icon-button mobile-menu-close" type="button" data-action="toggle-menu" aria-label="Close navigation">${icon('close', 20)}</button></div>
          <div class="mobile-menu-list">${menu}${routeLink('contact', `${icon('send', 19)}<span>Contact</span>${icon('arrow', 16)}`, 'mobile-menu-link')}${routeLink('privacy', `${icon('lock', 19)}<span>Privacy</span>${icon('arrow', 16)}`, 'mobile-menu-link')}</div>
          <div class="mobile-menu-bottom">${currentUser
            ? `${routeLink('profile', `${icon('user', 15)} Open your profile ${icon('arrow', 14)}`, 'button button-primary')}<button class="button button-outline" type="button" data-action="account-sign-out">Sign out</button>`
            : `${routeLink('login', 'Log in', 'button button-outline', 'data-mode="signin"')}${routeLink('login', 'Get started', 'button button-primary', 'data-mode="signup"')}`}</div>
        </div>
      </div>`;
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) document.body.append(mobileMenu);
  }

  function renderMobileNav(page) {
    const currentUser = getCurrentUser();
    const familyDashboard = currentUser?.role === 'parent' && page === 'parent-dashboard';
    const mobileNav = document.getElementById('mobile-nav');
    mobileNav.className = 'mobile-nav mobile-bottom-navigation';
    mobileNav.setAttribute('aria-label', 'Primary navigation');
    if (page === 'index' || page === 'voice_lessons' || page.startsWith('voice-')) {
      mobileNav.replaceChildren();
      mobileNav.hidden = true;
      document.body.classList.remove('has-mobile-bottom-navigation');
      return;
    }
    if (page === 'login' || page === 'ai-conversation' ||
      page.startsWith('tutor') || page === 'families' ||
      (page.startsWith('parent') && !familyDashboard) || (currentUser?.role === 'parent' && !familyDashboard) || currentUser?.role === 'educator') {
      mobileNav.replaceChildren();
      mobileNav.hidden = true;
      document.body.classList.remove('has-mobile-bottom-navigation');
      return;
    }
    mobileNav.hidden = false;
    document.body.classList.add('has-mobile-bottom-navigation');
    const items = [
      { route: 'index', label: 'Home', ico: 'home' },
      { route: 'voice_lessons', label: 'Voice', ico: 'mic' },
      { route: 'profile', label: 'Profile', ico: 'user' }
    ];
    mobileNav.innerHTML = items.map((item) => {
      const active = item.route === 'index'
        ? page === 'index' || familyDashboard
        : item.route === 'voice_lessons'
          ? page === 'voice_lessons' || page.startsWith('voice-')
          : page === item.route;
      return `<a href="#/${item.route}" data-route="${item.route}" class="mobile-tab mobile-navigation-item ${active ? 'active' : ''}"${active ? ' aria-current="page"' : ''}>${icon(item.ico, 20)}<span>${item.label}</span></a>`;
    }).join('');
  }

  function renderFooter(page) {
    if (page === 'index' || page === 'voice_lessons' || page.startsWith('voice-')) {
      return `<footer class="academy-footer"><div class="academy-footer-inner"><span>Ìdíléwa · Learn. Speak. Connect.</span><nav aria-label="Footer navigation">${routeLink('index', 'Home')}${routeLink('voice_lessons', 'Voice Lessons')}${routeLink('privacy', 'Privacy')}</nav></div></footer>`;
    }
    return `<footer class="site-footer">
      <div class="container footer-main">
        <section class="footer-contact">
          <span class="footer-kicker">Contact us</span>
          <h2>Let’s learn together.</h2>
          <p>Questions about language, culture or learning? We’d love to hear from you.</p>
          ${routeLink('contact', `Talk with our team ${icon('arrow', 15)}`, 'button button-primary footer-contact-button')}
          <div class="footer-email">
            <span class="footer-kicker">Or email us at</span>
            <a href="mailto:idilewa2026@gmail.com?subject=Idilewa%20support">idilewa2026@gmail.com</a>
          </div>
        </section>
        <nav class="footer-directory" aria-label="Footer navigation">
          <section class="footer-links"><h2>Quick links</h2>${routeLink('index', 'Home')}${routeLink('languages', 'Languages')}${routeLink('voice_lessons', 'Voice lessons')}${routeLink('oral', 'Oral traditions')}</section>
          <section class="footer-links"><h2>Information</h2>${routeLink('about', 'About Idilewa')}${routeLink('families', 'Parent portal')}${routeLink('privacy', 'Privacy policy')}</section>
        </nav>
      </div>
      <div class="footer-bottom"><div class="container footer-bottom-inner">
        <p>© Idilewa · Language · Culture · Future</p>
        ${routeLink('contact', 'Contact Idilewa', 'footer-bottom-link')}
      </div></div>
    </footer>`;
  }

  function pill(text, tone = 'soft') { return `<span class="pill pill-${tone}">${text}</span>`; }

  function renderHomeBenefits() {
    const benefits = [
      ['book', 'Language foundations', 'Begin with clear sound, vocabulary and guided learning paths.'],
      ['sparkles', 'Made for discovery', 'Short activities help learners build confidence at their own pace.'],
      ['layers', 'Culture in context', 'Stories and language learning stay connected to community.'],
      ['volume', 'Listen and speak', 'Hear phrases, practice pronunciation and explore tonal patterns.'],
      ['message', 'Practice conversations', 'Rehearse everyday dialogue with a patient partner that speaks and listens.']
    ];
    return `<section class="home-benefits-section home-ribbon-section" aria-labelledby="home-benefits-title"><div class="container"><div class="home-section-heading"><span class="section-kicker">A learning space for every kind of curious</span><h2 id="home-benefits-title">Why Idilewa?</h2><p>Language, culture and technology belong in the same learning journey.</p></div><div class="home-benefits-grid">${benefits.map(([glyph,title,copy]) => `<article class="home-benefit"><span class="home-benefit-icon">${icon(glyph, 24)}</span><h3>${title}</h3><p>${copy}</p></article>`).join('')}</div></div></section>`;
  }

  function renderHomeAppPreview() {
    const previews = [
      { title: 'Hear a greeting', label: 'Yorùbá · Language', copy: 'Start with a phrase, then listen for the tones that shape its meaning.', image: 'page-languages-1.jpg', route: 'languages', action: 'Explore languages' },
      { title: 'Practice a sound', label: 'Voice Lessons', copy: 'Build confidence with vowels, consonants and guided speaking practice.', image: 'listening-reader.jpg', route: 'voice_lessons', action: 'Start a lesson' }
    ];
    const phonePreviews = [
      { type: 'language', glyph: 'Ẹ', label: 'YORÙBÁ · FIRST WORDS', title: 'Ẹ káàárọ̀', copy: 'Good morning', action: 'Listen', text: 'Ẹ káàárọ̀' },
      { type: 'voice', glyph: 'Ohùn', label: 'VOICE LESSONS', title: 'Sound foundations', copy: 'Practice vowels, consonants and tones.', action: 'Practice', text: '' }
    ];
    const renderPhoneSlide = (item, index, duplicate = false) => `<article class="android-preview-slide ${duplicate ? 'is-clone' : ''}" ${duplicate ? 'aria-hidden="true"' : ''}><div class="android-slide-visual android-slide-${item.type}"><span>${item.glyph}</span><small>0${index + 1}</small></div><small class="android-slide-label">${item.label}</small><strong>${item.title}</strong><span class="android-slide-copy">${item.copy}</span>${item.text ? `<button type="button" aria-label="Play ${item.title}" ${duplicate ? 'tabindex="-1"' : ''} data-action="play-audio" data-text="${esc(item.text)}">${icon('play', 12)} ${item.action}</button>` : `<span class="android-slide-action">${item.action} ${icon('arrow', 12)}</span>`}</article>`;
    const renderPreviewCard = (item, index, duplicate = false) => `<article class="home-app-slide" ${duplicate ? 'aria-hidden="true"' : ''}><img src="./assets/${item.image}" alt="${duplicate ? '' : esc(item.title + ' preview')}" loading="lazy" /><div class="home-app-slide-copy"><span>${item.label}</span><h4>${item.title}</h4><p>${item.copy}</p>${routeLink(item.route, `${item.action} ${icon('arrow', 14)}`, 'text-link', duplicate ? 'tabindex="-1"' : '')}</div><span class="home-app-slide-number">0${index + 1}</span></article>`;
    return `<section class="home-app-section home-ribbon-section" aria-labelledby="home-app-title"><div class="container home-app-layout">
      <div class="home-app-device-column"><div class="home-app-heading"><span class="section-kicker">A little Idilewa in your pocket</span><h2 id="home-app-title">Learning that moves with you.</h2><p>Explore languages and creative practice from one welcoming home.</p></div>
        <div class="android-device" aria-label="Android phone preview of the Idilewa learning app"><div class="android-device-side"></div><div class="android-device-screen"><div class="android-status"><span>9:41</span><span>● ● ▰</span></div><div class="android-appbar">${brandLogo()}<span>${icon('user', 15)}</span></div><div class="android-welcome"><small>Ẹ káàárọ̀, learner</small><strong>What would you like to explore?</strong></div><div class="android-preview-viewport" id="android-preview-viewport" aria-label="Automatically swiping Idilewa learning previews"><div class="android-preview-track">${phonePreviews.map((item, index) => renderPhoneSlide(item, index)).join('')}${renderPhoneSlide(phonePreviews[0], 0, true)}</div></div><div class="android-bottom-nav"><span>${icon('home', 14)}Home</span><span>${icon('book', 14)}Learn</span><span>${icon('user', 14)}Profile</span></div></div></div>
      </div>
      <div class="home-app-swipe-area"><div class="home-app-swipe-heading"><div><span class="section-kicker">Look around</span><h3>One space. Many ways to grow.</h3></div></div>
        <div class="home-app-swipe-track" id="home-app-swipe-track" tabindex="0" aria-label="Automatically scrolling Idilewa learning previews">${previews.map((item, index) => renderPreviewCard(item, index)).join('')}${previews.map((item, index) => renderPreviewCard(item, index, true)).join('')}</div><div class="home-app-swipe-hint">Swipe or scroll to explore <span aria-hidden="true">→</span></div>
      </div>
    </div></section><section class="home-principles-strip" aria-label="Idilewa learning principles"><div class="container"><span>${icon('globe', 17)} African languages</span><span>${icon('people', 17)} Family learning</span><span>${icon('leaf', 17)} Culture with context</span><span>${icon('message', 17)} Conversation practice</span></div></section>`;
  }

  function renderAcademyLanguageChoices(className = '') {
    const supportedLanguages = LANGUAGES.filter((language) => ['yoruba', 'igbo', 'hausa', 'swahili'].includes(language.id));
    return `<div class="academy-language-grid ${className}" aria-label="Choose a language">${supportedLanguages.map((language) => `<button type="button" class="academy-language-card" data-route="voice-grade" data-lang="${language.id}" aria-label="Choose ${esc(language.name)}"><span class="academy-language-symbol" aria-hidden="true">${esc(language.glyph)}</span><strong>${esc(language.name)}</strong><small>${esc(language.region)}</small></button>`).join('')}</div>`;
  }

  function renderHome() {
    const experiences = [
      { title: 'Voice Lessons', description: 'Listen & Speak', image: landingFeatureVoiceUrl, alt: 'Learners exploring voice lessons', route: 'voice_lessons', tone: 'voice' },
      { title: 'Code', description: 'Build & Run', image: landingFeatureCodeUrl, alt: 'A young learner exploring code', href: './code-studio.html', tone: 'code' },
      { title: 'AI Conversation', description: 'Chat & Practise', image: landingFeatureAiUrl, alt: 'Learners practising a conversation', route: 'ai-conversation', tone: 'ai' },
      { title: 'Heritage Stories', description: 'Stories & Culture', image: landingFeatureHeritageUrl, alt: 'A family sharing a heritage story', route: 'oral', tone: 'heritage' }
    ];
    const experienceCards = experiences.map((item) => {
      const contents = `<img src="${item.image}" alt="${esc(item.alt)}" loading="lazy" /><span class="academy-home-feature-copy"><strong>${esc(item.title)}</strong><small>${esc(item.description)}</small></span><span class="academy-home-feature-arrow" aria-hidden="true">${icon('arrow', 17)}</span>`;
      return item.route
        ? routeLink(item.route, contents, `academy-home-feature academy-home-feature-${item.tone}`, `aria-label="${esc(`Open ${item.title}`)}"`)
        : `<a class="academy-home-feature academy-home-feature-${item.tone}" href="${item.href}" aria-label="${esc(`Open ${item.title}`)}">${contents}</a>`;
    }).join('');
    return `<div class="academy-reference-page academy-home-page">
      <section class="academy-hero" aria-labelledby="academy-home-title">
        <div class="academy-hero-copy">
          <h1 id="academy-home-title">Our Language.<br /><span>Our Future.</span></h1>
          <p>Learn. Speak. Connect.</p>
          <div class="academy-home-actions">
            ${routeLink('voice_lessons', `Start Learning ${icon('arrow', 17)}`, 'button button-primary academy-start-button')}
            <a class="academy-code-button" href="./code-studio.html">${icon('code', 17)} Code</a>
          </div>
        </div>
        <div class="academy-hero-art">
          <img src="${landingHomeHeroUrl}" alt="Illustrated African children exploring language learning with a phone" width="1446" height="463" fetchpriority="high" />
          <p class="academy-art-caption">Discover <strong>African languages</strong> together</p>
        </div>
      </section>
      <section class="academy-home-languages" aria-labelledby="academy-home-languages-title">
        <h2 id="academy-home-languages-title">Choose your language</h2>
        ${renderAcademyLanguageChoices()}
      </section>
      <nav class="academy-home-feature-grid" aria-label="Explore Idilewa learning experiences">${experienceCards}</nav>
    </div>`;
  }

  function renderFullHome() {
    const featureCards = [
      { title: 'Voice Lessons', desc: 'Start with Yorùbá sounds, then practice pitch and pronunciation across African languages.', icon: 'mic', route: 'voice_lessons', tone: 'mint', tag: 'Interactive Audio Lessons', image: 'listening-reader.jpg' },
      { title: 'Read & listen', desc: 'Hear words, voices and ideas.', icon: 'headphones', route: 'voices', tone: 'mint', tag: 'Audio & text', image: 'listening-reader.jpg' },
      { title: 'Connect with Students', desc: 'A respectful space for educators to meet learners.', icon: 'people', route: 'connect_students', tone: 'peach', tag: 'For educators', image: 'african-kids-friends.jpg' },
      { title: 'Connect with Teachers', desc: 'Browse educator profiles, learning hours and experience.', icon: 'school', route: 'connect_teachers', tone: 'lilac', tag: 'For learners', image: 'yoruba-educator-man.jpg' }
    ];
    const books = [
      { title: 'A Morning Greeting', label: 'Yorùbá · Beginner', bg: 'cover-green', shape: 'È', route: 'course' },
      { title: 'Wisdom We Carry', label: 'Culture · Short read', bg: 'cover-pink', shape: '“', route: 'oral' }
    ];
    return `
      <section class="hero-section home-ribbon-section">
        <div class="container hero-grid">
          <div class="hero-copy">
            <div class="eyebrow"><span class="eyebrow-dot"></span>African roots <span class="eyebrow-separator">·</span> brighter futures</div>
            <h1>Preserving African Culture.<br /><span>Promoting Technology.</span></h1>
            <p class="hero-mantra">Learn. Speak. Code. Create. Belong.</p>
            <p class="hero-lede">A joyful place to learn a language, hear the stories behind it and imagine what you can create next.</p>
            <div class="hero-actions">
              ${routeLink('voice_lessons', `${icon('layers', 16)} Explore voice lessons`, 'button button-accent')}
              ${routeLink('about', `${icon('play', 15)} Our story`, 'button button-outline')}
            </div>
            <div class="hero-social-proof"><div class="mini-avatars"><span>A</span><span>Ẹ</span><span>Ụ</span><span>✳</span></div><span>For curious learners, families<br class="desktop-only" /> and the next generation</span></div>
          </div>
          <div class="hero-visual home-hero-art">
            <img src="./assets/idilewa-family-view.png" alt="Idilewa Living Family View showing a family learning together" />
            <section class="home-voice-promo" aria-labelledby="home-voice-promo-title">
              <div class="home-voice-promo-copy">
                <span class="home-voice-promo-kicker">${icon('headphones', 14)} Voice lessons · sound &amp; tonal practice</span>
                <h2 id="home-voice-promo-title">Speak African languages with <em>native tonal fluency.</em></h2>
                <p>Our interactive Voice Lessons help you listen and practise speaking across Yorùbá, Igbo, Hausa, Kiswahili, isiZulu and Twi.</p>
                <div class="home-voice-promo-highlights">
                  <span><span>${icon('volume', 14)}</span><strong>Guided Audio Lessons</strong><small>Practice at your own pace</small></span>
                  <span><span>${icon('music', 14)}</span><strong>Dó-Re-Mí Melodies</strong><small>Interactive pitch keys</small></span>
                  <span><span>${icon('mic', 14)}</span><strong>Live Mic Practice</strong><small>Record and transcribe</small></span>
                </div>
                <div class="home-voice-promo-actions">
                  ${routeLink('voice_lessons', `Explore Voice Lessons ${icon('arrow', 15)}`, 'button home-voice-promo-button')}
                  ${routeLink('voices', 'Explore Voice Library', 'button home-voice-promo-secondary')}
                </div>
              </div>
              <div class="home-voice-demo" aria-label="Try the Yorùbá tone soundboard">
                <span class="home-voice-demo-label"><i></i> Live interactive audio studio</span>
                <div class="home-voice-demo-phrase">
                  <small>YORÙBÁ TONES</small>
                  <button type="button" lang="yo" data-action="speak-voice-lesson" data-phrase="Ẹ káàárọ̀">Ẹ káàárọ̀</button>
                  <div class="home-voice-tone-keys">
                    <button type="button" data-action="trainer-play-syllable" data-freq="261.63" data-tone="do" data-syllable="kú">kú (Mí)</button>
                    <button type="button" data-action="trainer-play-syllable" data-freq="293.66" data-tone="re" data-syllable="àár">àár (Ré)</button>
                    <button type="button" data-action="trainer-play-syllable" data-freq="329.63" data-tone="mi" data-syllable="ọ̀">ọ̀ (Dó)</button>
                  </div>
                </div>
                <div class="home-voice-demo-score"><strong>Listen &amp; practise</strong><span>Native audio · guided lessons</span></div>
              </div>
            </section>
          </div>
        </div>
        <div class="container hero-language-row"><span class="tiny-label">Four languages. One welcoming home.</span><div class="hero-lang-pills">${LANGUAGES.map((l) => `<span>${l.name}</span>`).join('')}</div>${routeLink('languages', 'See all languages ' + icon('arrow', 14), 'text-link')}</div>
      </section>

      ${renderHomeAppPreview()}

      <!-- 5 Pathways Learning Cards (Five Pillars of Idilewa) -->
      <section class="container section visual-journey-3d-section home-ribbon-section" id="visual-journey">
        <div class="section-heading text-center">
          <div>
            <span class="section-kicker">Scroll-Driven Learning Journey · Living Knowledge</span>
            <h2>Five Pathways to Keep Language &amp; Culture Close</h2>
            <p>From your first spoken greeting to authentic tone melody, living proverbs, oral stories, and K–8 computational thinking.</p>
          </div>
        </div>
        <div class="visual-journey-timeline">
          <!-- Pillar 1: Language Discovery -->
          <div class="journey-card-3d tone-mint">
            <div class="journey-card-header">
              <div class="journey-3d-step-badge">Pillar 01 · Èdè</div>
              <span class="journey-3d-glyph">È</span>
            </div>
            <div class="journey-3d-content">
              <h3>Language &amp; Everyday Speech</h3>
              <p>Step-by-step foundation in Yorùbá, Igbo, Hausa, or Swahili with greetings, vocabulary, and guided levels.</p>
              <ul class="journey-highlights" aria-label="Key features">
                <li><span>✓</span> 4 African Languages with Native Audio</li>
                <li><span>✓</span> Daily Vocabulary &amp; Conversational Phrases</li>
                <li><span>✓</span> Beginner, Intermediate &amp; Fluent Tracks</li>
              </ul>
            </div>
            <div class="journey-card-action">
              ${routeLink('languages', `Choose a Language ${icon('arrow', 15)}`, 'button button-primary')}
            </div>
          </div>

          <!-- Pillar 2: Voice & Tone Studio -->
          <div class="journey-card-3d tone-yellow">
            <div class="journey-card-header">
              <div class="journey-3d-step-badge">Pillar 02 · Ohùn</div>
              <span class="journey-3d-glyph">♫</span>
            </div>
            <div class="journey-3d-content">
              <h3>Voice &amp; Tonal Melody</h3>
              <p>Hear and practice Dó-Re-Mí tones with our interactive syllable pitch soundboard and guided audio lessons.</p>
              <ul class="journey-highlights" aria-label="Key features">
                <li><span>✓</span> Real-Time Pitch Detection &amp; Scoring</li>
                <li><span>✓</span> High, Mid &amp; Low Tone Marks</li>
                <li><span>✓</span> Guided Audio Lessons Across African Languages</li>
              </ul>
            </div>
            <div class="journey-card-action">
              ${routeLink('voice_lessons', `${icon('mic', 15)} Open Voice Studio ${icon('arrow', 15)}`, 'button button-accent')}
            </div>
          </div>

          <!-- Pillar 3: Oral Culture & Proverbs -->
          <div class="journey-card-3d tone-peach">
            <div class="journey-card-header">
              <div class="journey-3d-step-badge">Pillar 03 · Òwe &amp; Oríkì</div>
              <span class="journey-3d-glyph">“</span>
            </div>
            <div class="journey-3d-content">
              <h3>Oral Traditions &amp; Context</h3>
              <p>Praise poetry, ancestral proverbs, and guided reflections honoring community permission and attribution.</p>
              <ul class="journey-highlights" aria-label="Key features">
                <li><span>✓</span> 100+ Curated African Proverbs (Òwe)</li>
                <li><span>✓</span> Ancestral Lineage &amp; Family Poetry (Oríkì)</li>
                <li><span>✓</span> Cultural Context &amp; Reflection Prompts</li>
              </ul>
            </div>
            <div class="journey-card-action">
              ${routeLink('oral', `Explore Traditions ${icon('arrow', 15)}`, 'button button-primary')}
            </div>
          </div>

        </div>
      </section>

      <section class="container section section-start home-ribbon-section">
        <div class="section-heading"><div><span class="section-kicker">A world of ways to learn</span><h2>Learn a little. Carry a lot.</h2><p>Choose a path that feels like you. There is always room to explore.</p></div></div>
        <div class="feature-grid">${featureCards.map((card) => `<a class="feature-card tone-${card.tone}" href="#/${card.route}" data-route="${card.route}"><span class="feature-card-portrait"><img src="./assets/${card.image}" alt="${card.imageAlt ? esc(card.imageAlt) : ''}" ${card.imageAlt ? '' : 'aria-hidden="true"'} loading="lazy" /></span><div class="feature-card-top"><span class="feature-icon">${icon(card.icon, 23)}</span><span class="feature-tag">${card.tag}</span></div><h3>${card.title}</h3><p>${card.desc}</p><span class="card-arrow">${icon('arrow', 17)}</span></a>`).join('')}</div>
      </section>

      <section class="journey-section home-ribbon-section">
        <div class="container journey-inner">
          <div class="journey-intro"><span class="section-kicker">A clear path, at your pace</span><h2>Four small steps.<br /><span>One big connection.</span></h2><p>Every learning path makes the next step easy to see—without rushing the joy out of discovery.</p>${routeLink('course', `See how learning works ${icon('arrow', 16)}`, 'text-link')}</div>
          <div class="journey-steps">
            ${[
              ['01', 'Choose a language', 'Start with the words you love.', 'globe', 'languages'],
              ['02', 'Find your level', 'Begin where you feel ready.', 'compass', 'course'],
              ['03', 'Explore a module', 'Move through connected ideas.', 'layers', 'course'],
              ['04', 'Try a lesson', 'Listen, practice and celebrate.', 'check', 'lesson']
            ].map(([num, title, desc, ico, route]) => `<a href="#/${route}" data-route="${route}" class="journey-step"><span class="journey-number">${num}</span><span class="journey-icon">${icon(ico, 20)}</span><strong>${title}</strong><small>${desc}</small><span class="journey-link">${icon('arrow', 15)}</span></a>`).join('')}
          </div>\n    </section>

      <section class="container section language-section home-ribbon-section">
        <div class="section-heading"><div><span class="section-kicker">Start with a language</span><h2>Which one feels like home?</h2><p>Four learning paths are ready to explore, with more voices on the way.</p></div>${routeLink('languages', 'All languages ' + icon('arrow', 15), 'text-link')}</div>
        <div class="language-grid home-language-grid">${LANGUAGES.map((l) => `<button type="button" class="language-card lang-${l.tint}" data-action="${state.available[l.id] ? 'select-language' : 'notify-language'}" data-lang="${l.id}"><span class="language-glyph">${l.glyph}</span><span class="language-info"><strong>${l.name}</strong><small>${l.region}</small></span><span class="language-go">${icon('arrow', 16)}</span></button>`).join('')}</div>
        <div class="coming-soon-line"><span class="coming-soon-dot"></span>Coming soon: ${SOON_LANGUAGES.map((l) => l.name).join(' · ')} ${routeLink('languages', 'Get curious ' + icon('arrow', 13), 'text-link text-link-small')}</div>
      </section>

      <section class="container section home-trainer-feature-section home-ribbon-section">
        <div class="home-trainer-card">
          <div class="home-trainer-copy">
            <div class="home-trainer-badge">
              <span class="badge-dot"></span>
              <span>VOICE LESSONS · SOUND &amp; TONAL PRACTICE</span>
            </div>
            <h2>Speak African Languages with <span class="highlight-green">Native Tonal Fluency</span></h2>
            <p>Our interactive voice studio listens to your voice in real time, analyzes pitch accuracy, and gives instant feedback across Yorùbá, Igbo, Hausa, Swahili, isiZulu, and Twi.</p>
            <div class="home-trainer-highlights">
              <div class="trainer-highlight-item">
                <span class="highlight-icon">${icon('volume', 18)}</span>
                <div>
                  <strong>Guided Audio Lessons</strong>
                  <small>Practice at your own pace</small>
                </div>
              </div>
              <div class="trainer-highlight-item">
                <span class="highlight-icon">${icon('music', 18)}</span>
                <div>
                  <strong>Dó-Re-Mí Melodies</strong>
                  <small>Interactive pitch keys</small>
                </div>
              </div>
              <div class="trainer-highlight-item">
                <span class="highlight-icon">${icon('mic', 18)}</span>
                <div>
                  <strong>Live Mic Speech Scoring</strong>
                  <small>Pitch accuracy & stars</small>
                </div>
              </div>
            </div>
            <div class="home-trainer-actions">
              ${routeLink('voice_lessons', `Explore Voice Lessons ${icon('arrow', 17)}`, 'button button-primary')}
              ${routeLink('voices', `Explore Voice Library`, 'button button-outline')}
            </div>
          </div>
          <div class="home-trainer-visual">
            <div class="trainer-visual-card">
              <div class="visual-card-head">
                <span class="pulse-recording-dot"></span>
                <span>Live Interactive Audio Studio</span>
              </div>
              <div class="visual-card-phrase">
                <span class="phrase-tag">Yorùbá Tones</span>
                <h3>Ẹ kú àárọ̀ o</h3>
                <div class="visual-tones-demo">
                  <span class="v-tone tone-hi">kú (Mí)</span>
                  <span class="v-tone tone-mid">àár (Re)</span>
                  <span class="v-tone tone-lo">o (Dó)</span>
                </div>
              </div>
              <div class="visual-card-score">
                <div class="score-pill">
                  <strong>96%</strong>
                  <small>Native Pitch Match</small>
                </div>
                <div class="score-stars">★★★ Fluency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="container section explore-section home-ribbon-section">
        <div class="section-heading"><div><span class="section-kicker">Picked for curious minds</span><h2>Explore books & little discoveries</h2><p>Read, listen and find a new doorway into language and culture.</p></div></div>
        <div class="book-grid">${books.map((book, i) => `<a href="#/${book.route}" data-route="${book.route}" class="book-card"><div class="book-cover ${book.bg}"><span class="book-cover-mark">${book.shape}</span><span class="book-sun"></span><span class="book-hill book-hill-one"></span><span class="book-hill book-hill-two"></span><span class="book-cover-index">0${i + 1}</span></div><strong>${book.title}</strong><small>${book.label}</small></a>`).join('')}</div>
      </section>

      <section class="container section audience-section home-ribbon-section">
        <div class="section-heading"><div><span class="section-kicker">One home, many journeys</span><h2>Made for the way you learn.</h2><p>Welcoming for young learners, with families and communities learning together.</p></div></div>
        <div class="audience-grid">
          <a class="audience-card audience-kids" href="#/kids" data-route="kids"><span class="audience-icon">${icon('sparkles', 21)}</span><span class="audience-kicker">For young learners</span><strong>Curiosity comes first.</strong><small>Playful lessons, stories and gentle challenges.</small>${icon('arrow', 16)}</a>
          <a class="audience-card audience-school" href="#/families" data-route="families"><span class="audience-icon">${icon('people', 21)}</span><span class="audience-kicker">For families</span><strong>Learn together at home.</strong><small>Share language, stories and progress.</small>${icon('arrow', 16)}</a>
        </div>
      </section>

      <section class="container home-cta-section home-ribbon-section"><div class="home-cta"><div><span class="section-kicker">Your next word is waiting</span><h2>Let’s keep the good things growing.</h2><p>Choose a language and take your first small step today.</p></div>${routeLink('languages', `Find your language ${icon('arrow', 17)}`, 'button button-white')}</div></section>`;
  }

  function renderPhoneFirstHome() {
    const languages = [
      { id: 'yoruba', name: 'Yorùbá', image: 'child-language-yoruba.jpg', alt: 'Yorùbá child wearing blue traditional clothing and a headwrap' },
      { id: 'igbo', name: 'Igbo', image: 'child-language-igbo.jpg', alt: 'Igbo child wearing patterned traditional clothing and a red cap' },
      { id: 'hausa', name: 'Hausa', image: 'child-language-hausa.jpg', alt: 'Hausa child wearing an embroidered outfit and patterned cap' },
      { id: 'swahili', name: 'Kiswahili', image: 'child-language-swahili.jpg', alt: 'Child wearing a yellow patterned headscarf and traditional clothing' }
    ];
    const pathways = [
      { icon: 'book', title: 'Learn', copy: 'African languages', route: 'voice-language' },
      { icon: 'volume', title: 'Listen', copy: 'Stories & audiobooks', route: 'voices' },
      { icon: 'people', title: 'Join', copy: 'A global community', route: 'connect_students' }
    ];
    return `<div class="landing-home">
      <section class="landing-hero" aria-label="Welcome to Idilewa">
        <div class="container landing-hero-grid">
          <div class="landing-hero-device" aria-hidden="true">
            <div class="landing-phone">
              <div class="landing-phone-notch"></div>
              <div class="landing-phone-screen">
                <div class="landing-phone-status"><span>9:41</span><span>● ▰</span></div>
                <div class="landing-phone-brand">
                  ${brandLogo('Idilewa · Language · Culture · Future')}
                  <span class="landing-phone-tools">${icon('search', 15)}${icon('user', 15)}</span>
                </div>
                <div class="landing-phone-welcome">
                  <small>A LITTLE LEARNING EVERY DAY</small>
                  <strong>Hello, Aya!</strong>
                  <span>Stories, culture and joyful challenges, all in one place.</span>
                </div>
                <div class="landing-phone-search">${icon('search', 14)}<span>Search stories, topics or children</span></div>
                <div class="landing-phone-story">
                  <img src="/assets/story-grandmother.jpg" alt="" />
                  <span class="landing-phone-popular">POPULAR TODAY</span>
                  <strong>A steady pace can carry you further.</strong>
                  <span class="landing-phone-read">Read the story ${icon('arrow', 12)}</span>
                </div>
                <div class="landing-phone-section-heading"><span><strong>EXPLORE</strong><small>Choose your journey</small></span><strong>Your profile ${icon('arrow', 11)}</strong></div>
                <div class="landing-phone-tiles">
                  <div><img src="/assets/child-language-yoruba.jpg" alt="" /><strong>Values<br />&amp; Habits</strong><small>Timeless lessons for everyday life.</small></div>
                  <div><img src="/assets/home-family-learning.jpg" alt="" /><strong>Our<br />Identity</strong><small>Explore who we are and where we come from.</small></div>
                  <div><img src="/assets/african-kids-friends.jpg" alt="" /><strong>Think<br />&amp; Grow</strong><small>Solve problems. Make better choices.</small></div>
                </div>
                <div class="landing-phone-nav"><span>${icon('home', 13)}Home</span><span>${icon('book', 13)}Stories</span><span>${icon('globe', 13)}Culture</span><span>${icon('sparkles', 13)}Riddles</span><span>${icon('user', 13)}Profile</span></div>
              </div>
            </div>
          </div>
          <div class="landing-hero-copy">
            <span class="landing-eyebrow">IDILEWA <i>•</i> LEARN, EXPLORE, GROW</span>
            <h1>Carry a story.<br />Discover a tradition.<br /><span>Share what you<br />learn.</span></h1>
            <p>Choose a path and move between folktales, culture and playful challenges wherever you are.</p>
            <div class="landing-hero-actions">
              ${routeLink('languages', `Explore Idilewa ${icon('arrow', 16)}`, 'button button-primary')}
              ${routeLink('oral', `Discover culture ${icon('arrow', 16)}`, 'button button-outline')}
            </div>
          </div>
        </div>
      </section>

      <section class="container landing-pathways" aria-label="Explore Idilewa">
        ${pathways.map((item) => `<a class="landing-pathway" href="#/${item.route}" data-route="${item.route}"><span>${icon(item.icon, 23)}</span><strong>${item.title}</strong><small>${item.copy}</small></a>`).join('')}
      </section>

      <div class="container landing-content-grid">
        <main class="landing-main-column">
          <section class="landing-languages" aria-labelledby="landing-languages-title">
            <div class="landing-section-heading"><div><span class="section-kicker">Our languages</span><h2 id="landing-languages-title">Start with your language</h2><p>Choose a language to begin your learning journey.</p></div>${routeLink('languages', `View all ${icon('arrow', 14)}`, 'text-link')}</div>
            <div class="landing-language-grid">
              ${languages.map((language) => `<a class="landing-language-card" href="#/voice-grade?lang=${language.id}" data-route="voice-grade" data-lang="${language.id}" aria-label="Choose a grade for ${language.name}"><img src="/assets/${language.image}" alt="${language.alt}" loading="lazy" /><span class="landing-language-name">${language.name}</span><span class="landing-language-action">Learn · Speak · Explore ${icon('arrow', 13)}</span></a>`).join('')}
            </div>
          </section>

          <section class="landing-voice-card" aria-labelledby="landing-voice-title">
            <div class="landing-voice-icon">${icon('mic', 24)}</div>
            <div><span class="section-kicker">Listen · practise · grow</span><h2 id="landing-voice-title">Your voice belongs here.</h2><p>Build pronunciation confidence with lessons for every grade, from first sounds to fluent expression.</p></div>
            ${routeLink('voice_lessons', `Start Voice Lessons ${icon('arrow', 15)}`, 'button button-primary')}
          </section>

          <section class="landing-story-card">
            <img src="/assets/story-grandmother.jpg" alt="A grandmother sharing cultural knowledge with children" loading="lazy" />
            <div><span class="section-kicker">Culture that carries us</span><h2>Learn from the voices around you.</h2><p>Explore sayings and traditions passed from one generation to the next.</p>${routeLink('oral', `Explore oral traditions ${icon('arrow', 14)}`, 'text-link')}</div>
          </section>
        </main>

        <aside class="landing-side-column">
          <section class="landing-side-card landing-why-card">
            <span class="section-kicker">Rooted in community</span><h2>Why choose Idilewa?</h2>
            <div class="landing-why-grid">
              <div><span>${icon('leaf', 19)}</span><strong>Authentic</strong><small>Culture with context</small></div>
              <div><span>${icon('people', 19)}</span><strong>For all ages</strong><small>Learn together</small></div>
              <div><span>${icon('sparkles', 19)}</span><strong>Interactive</strong><small>Practice by doing</small></div>
              <div><span>${icon('globe', 19)}</span><strong>Global</strong><small>Community connected</small></div>
            </div>
          </section>
          <section class="landing-community-card">
            <span class="section-kicker">From our heritage to new opportunities</span><h2>Keep your language close.</h2><p>Discover the words, stories and skills that connect us.</p>${routeLink('languages', `Explore Idilewa ${icon('arrow', 14)}`, 'button button-white')}
          </section>
          <section class="landing-side-card landing-how-card">
            <span class="section-kicker">A simple path</span><h2>How it works</h2>
            <ol><li><span>1</span><div><strong>Choose a language</strong><small>Start with a language you love.</small></div></li><li><span>2</span><div><strong>Pick your grade</strong><small>Find a level made for you.</small></div></li><li><span>3</span><div><strong>Learn and practise</strong><small>Listen, speak and celebrate.</small></div></li></ol>
          </section>
          <section class="landing-future-card"><span>${icon('people', 22)}</span><div><strong>Be part of a brighter future.</strong><p>Grow with a community learning and sharing across generations.</p>${routeLink('connect_students', `Join Idilewa ${icon('arrow', 13)}`, 'text-link')}</div></section>
        </aside>
      </div>
    </div>`;
  }

  function renderLanguageCard(l) {
    const available = !!state.available[l.id];
    return `<article class="language-choice lang-${l.tint} ${available ? '' : 'is-coming'}"><div class="language-choice-top"><span class="language-glyph">${l.glyph}</span>${available ? pill(l.upcoming ? 'Enabled · content pending' : 'Available', 'green') : pill('Coming soon', 'warm')}</div><h3>${l.name}</h3><p class="native-name">${l.native}</p><p class="language-region">${l.region}</p><div class="language-choice-meta"><span>${icon('layers', 15)} ${available ? (l.upcoming ? 'Learning materials in preparation' : l.lessons) : 'A new path is taking shape'}</span><span>${icon('volume', 15)} Listen & speak</span></div><button class="button ${available ? 'button-primary' : 'button-soft'} language-start" data-action="${available ? 'select-language' : 'notify-language'}" data-lang="${l.id}">${available ? (l.upcoming ? 'View language preview' : 'Explore this language') : (state.interested.includes(l.id) ? 'Interest saved' : 'Keep me curious')} ${icon('arrow', 15)}</button></article>`;
  }

  function renderLanguages() {
    const allLanguages = [...LANGUAGES, ...SOON_LANGUAGES.map((l) => ({ ...l, native: l.name, tint: 'peach', greeting: '', translation: '', lessons: 'Learning materials in preparation', upcoming: true }))];
    const availableLanguages = allLanguages.filter((l) => state.available[l.id]);
    const plannedLanguages = allLanguages.filter((l) => !state.available[l.id]);
    const soon = plannedLanguages.map((l) => `<button type="button" class="soon-language" data-action="notify-language" data-lang="${l.id}"><span class="soon-glyph">${l.glyph}</span><span class="soon-copy"><strong>${l.name}</strong><small>${l.region}</small></span><span class="soon-badge">${state.interested.includes(l.id) ? 'Saved' : 'Coming soon'}</span></button>`).join('');
    return `<div class="container route-page language-page">
      <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><span>Learn</span><span>/</span><strong>Languages</strong></div>
      <section class="language-page-hero"><div class="language-page-copy"><span class="section-kicker">The first step is yours</span><h1>Find a language<br /><em>that feels like home.</em></h1><p>Choose an available language path. Each is built to grow with you—from a first greeting to stories, culture and more.</p><div class="language-page-badges"><span>${icon('shield', 16)} Designed to grow</span><span>${icon('volume', 16)} Listen as you learn</span></div></div><div class="language-page-art"><img src="./assets/yoruba-kids-culture.jpg" alt="Children in beautiful Yorùbá attire reading together" /><div class="art-note">Words connect us <span>✦</span></div>
      </div>
      <section class="language-alphabet-section scroll-3d-reveal" style="margin: 28px 0; background: var(--cream); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px;">
        <div class="section-heading" style="margin-bottom: 16px;">
          <div>
            <span class="section-kicker">Interactive Yoruba Soundboard</span>
            <h2>Fáwẹ́lì (Vowels), Kọ́nsónáǹtì &amp; Àmì Ohùn (Tonal Accents)</h2>
            <p>Click any vowel or tone to hear its pronunciation and pitch frequency.</p>
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
          ${[
            { char: 'A', tone: 'Re (Mid)', word: 'Agbàdo (Corn)', freq: 293 },
            { char: 'E', tone: 'Re (Mid)', word: 'Epo (Oil)', freq: 293 },
            { char: 'Ẹ', tone: 'Re (Mid)', word: 'Ẹja (Fish)', freq: 293 },
            { char: 'I', tone: 'Re (Mid)', word: 'Irin (Metal)', freq: 293 },
            { char: 'O', tone: 'Re (Mid)', word: 'Omi (Water)', freq: 293 },
            { char: 'Ọ', tone: 'Re (Mid)', word: 'Ọ̀bẹ (Knife)', freq: 293 },
            { char: 'U', tone: 'Re (Mid)', word: 'Úra (Grace)', freq: 293 }
          ].map((v) => `
            <button type="button" class="button button-small button-outline" data-action="trainer-play-syllable" data-freq="${v.freq}" data-tone="re" title="${v.word}" style="display: flex; gap: 6px; align-items: center;">
              <strong>${v.char}</strong> <small style="color: var(--muted);">${v.word}</small>
            </button>
          `).join('')}
        </div>
        <div style="display: flex; gap: 12px; font-size: 13px; color: var(--ink-soft); flex-wrap: wrap;">
          <span><strong>Òkè (High / Mí):</strong> 370Hz ↗</span>
          <span><strong>Àárín (Mid / Re):</strong> 294Hz →</span>
          <span><strong>Ìsàlẹ̀ (Low / Dò):</strong> 220Hz ↘</span>
        </div>
      </section>\n    </section>
      <section class="trainer-callout-banner">
        <div class="callout-icon">${icon('mic', 24)}</div>
        <div class="callout-content">
          <span class="callout-kicker">NEW INTERACTIVE VOICE STUDIO</span>
          <h3>Practice Real-Time Tonal Pronunciation & Pitch Melody</h3>
          <p>Practice across African languages. Get instant speech analysis and fluency score feedback.</p>
        </div>
        ${routeLink('voice_lessons', `Open Voice Lessons ${icon('arrow', 15)}`, 'button button-primary')}
      </section>
      ${renderStepper(['Language', 'Level', 'Module', 'Lesson'], 0)}<div class="language-group-head"><div><span class="section-kicker">Available to explore</span><h2>Choose your first path</h2></div><span class="muted-count">${availableLanguages.length} learning paths</span></div>
      <div class="language-choice-grid">${availableLanguages.map(renderLanguageCard).join('')}</div>
      <section class="coming-soon-panel"><div class="coming-intro"><span class="coming-icon">${icon('sparkles', 21)}</span><div><span class="section-kicker">Growing with our communities</span><h2>More languages, more futures.</h2><p>These paths are being prepared with care. Choose one to save your interest on this device.</p></div></div><div class="soon-list">${soon}</div></section>
      <section class="language-note"><div class="note-icon">${icon('globe', 20)}</div><p><strong>Built to welcome more.</strong> Idilewa’s language architecture is designed so new language paths can be added without rebuilding the experience.</p>${routeLink('about', 'Why Idilewa ' + icon('arrow', 14), 'text-link')}</section>
    </div>`;
  }

  function describeJourneyLayer(step, index) {
    const label = String(step || '').toLowerCase();
    const rules = [
      [/guardian|parent|consent|permission|sign/, 'Review the family permission and safety detail before a child proceeds.'],
      [/verify|validat|consent code|access code/, 'Check that the approved code matches this exact next step.'],
      [/tutor|teacher|connect|assignment/, 'Review the people, learning focus and safe connection details.'],
      [/proverb|meaning|translation/, 'Read the original words, then notice the meaning and context.'],
      [/story|read|genre|piece/, 'Explore the story or tradition and notice the people and ideas it carries.'],
      [/listen|hear|voice|speak|pronunciation/, 'Listen closely, notice the sound and try the phrase at your own pace.'],
      [/reflect|remember|action|share with care/, 'Think about what you learned and choose a respectful next step.'],
      [/level|pace/, 'Choose a level that fits what you know and how you want to grow.'],
      [/module|theme/, 'Follow a small group of connected ideas before moving on.'],
      [/lesson|practice|try|play|challenge|skill/, 'Try the activity, notice what happens and make one small improvement.'],
      [/code|path|create|build|remix/, 'Use a guided example to make, change or test a small idea.'],
      [/plan|price|family|school/, 'Compare the options and check what fits your learning needs.'],
      [/progress|celebrate|grow|belong/, 'Notice your progress and decide what you would like to explore next.'],
      [/context|source|attribution|credit/, 'Learn where the information comes from and how to share it with care.'],
      [/review|check|assess|quiz/, 'Check your understanding and use feedback to guide the next step.'],
      [/choose|start|begin|discover|explore|request/, 'Start with the page’s purpose, then choose a path that feels right.']
    ];
    const match = rules.find(([pattern]) => pattern.test(label));
    if (match) return match[1];
    return [
      'Start with the page’s purpose and what you hope to learn.',
      'Notice the key idea, language or context in the example.',
      'Try a short activity and adjust as you learn.',
      'Check your understanding, reflect or continue to the next page.'
    ][Math.min(index, 3)];
  }

  function renderStepper(steps, active = 0) {
    return `<ol class="learning-stepper" aria-label="Journey progress guide" data-step-count="${steps.length}">${steps.map((step, i) => `<li class="${i < active ? 'is-done' : ''} ${i === active ? 'is-active' : ''}" ${i === active ? 'aria-current="step"' : ''}><span class="step-count">${i < active ? icon('check', 13) : `0${i + 1}`}</span><span class="step-content"><span class="step-name">${esc(step)}</span><small class="step-description">${esc(describeJourneyLayer(step, i))}</small></span></li>`).join('')}</ol>`;
  }

  function buildCourseLevel(id, label, description, color, ico, moduleDefs) {
    let lessonNumber = 0;
    const modules = moduleDefs.map(([moduleId, title, desc, moduleIcon, tint, definitions]) => ({
      id: moduleId, title, desc, icon: moduleIcon, tint,
      lessons: definitions.map(([lessonTitle, focus, task]) => {
        lessonNumber += 1;
        return { id: `${id}-${String(lessonNumber).padStart(2, '0')}`, number: lessonNumber, title: lessonTitle, focus, task, moduleId };
      })
    }));
    return { id, label, description, color, icon: ico, modules, lessonCount: lessonNumber };
  }

  const COURSE_CATALOG = {
    beginner: buildCourseLevel('beginner', 'Beginner', 'Build confidence with useful words, friendly greetings and short phrases.', 'mint', 'leaf', [
      ['greetings', 'Greetings & introductions', 'Start a conversation with a warm greeting and a simple introduction.', 'smile', 'mint', [
        ['Hello & goodbye', 'Recognize familiar ways to greet someone and say goodbye.', 'Practise a greeting and a goodbye aloud, then write when you might use each.'],
        ['Share your name', 'Introduce yourself in a short, friendly sentence.', 'Write a two-line introduction for a new language partner.'],
        ['Ask someone’s name', 'Ask for a name and respond with your own.', 'Write a polite question and a short answer using your own name only if you wish.'],
        ['Morning, afternoon & evening', 'Notice how greetings can change with the time of day.', 'Choose a time of day and plan a greeting that fits it.'],
        ['Polite words & respectful greetings', 'Use courteous words and notice respectful forms of address.', 'Think of a person you greet respectfully; write one phrase you could practise with a teacher.']
      ]],
      ['people', 'Family & community', 'Talk about the people and relationships that matter to you.', 'people', 'peach', [
        ['Words for family', 'Explore familiar words for family and close relationships.', 'Draw or imagine a small family tree and label a few relationships in your learning language.'],
        ['Describe someone close', 'Use simple words to describe a person’s qualities.', 'Choose a kind quality and write a short description of a fictional person.'],
        ['Introduce someone you care about', 'Share a simple introduction for a family or community member.', 'Plan two sentences to introduce a person, without adding private details.'],
        ['Ask about people', 'Ask and answer a simple question about someone’s family or friends.', 'Write one question and one answer about a fictional family.'],
        ['Respectful ways to speak', 'Notice how relationship and context can shape the way we speak.', 'Think of two situations where you might use a different greeting or tone.']
      ]],
      ['everyday', 'Everyday words', 'Build a practical word set for things you see and do each day.', 'compass', 'blue', [
        ['Count from one to five', 'Practise hearing and using five everyday numbers.', 'Count five objects near you; check the words with a trusted speaker.'],
        ['Colours around you', 'Notice and name colours in your surroundings.', 'Pick three colours you can see and practise naming them.'],
        ['Food & drink', 'Learn how to talk about familiar food and drinks.', 'Make a short list of foods you enjoy; ask a fluent speaker to help with the words.'],
        ['Everyday objects', 'Identify useful objects at home or in a classroom.', 'Choose three objects and practise saying or writing their names.'],
        ['Places you visit', 'Recognize words for common places in your community.', 'Name two places you visit and one reason you go there.']
      ]],
      ['listen-build', 'Listen, speak & build', 'Turn single words into short questions, phrases and stories.', 'headphones', 'yellow', [
        ['Listen for familiar sounds', 'Listen closely and notice a sound you recognize.', 'Listen to a phrase from your course or voice library and note one sound you hear.'],
        ['Repeat a short phrase', 'Practise a short phrase slowly, then at a comfortable pace.', 'Choose a short phrase and repeat it three times; focus on clarity, not speed.'],
        ['Build a three-word phrase', 'Connect a few words to express one simple idea.', 'Plan a three-word phrase about a place, object or activity; check it with a teacher.'],
        ['Ask a simple question', 'Use a short question to learn one new thing.', 'Write a friendly question you could ask a classmate or family member.'],
        ['Tell a tiny story', 'Put a few ideas in order to tell a very short story.', 'Write three simple steps: who, what happened, and what happened next.']
      ]]
    ]),
    intermediate: buildCourseLevel('intermediate', 'Intermediate', 'Connect ideas, follow longer exchanges and describe everyday experiences.', 'blue', 'sparkles', [
      ['conversation', 'Connected conversations', 'Keep a conversation moving with follow-up questions and connected phrases.', 'people', 'blue', [
        ['Build a longer introduction', 'Add helpful details to an introduction without losing a natural tone.', 'Prepare a four-sentence introduction about a fictional learner or a safe topic.'],
        ['Ask follow-up questions', 'Use a follow-up question to show interest and learn more.', 'Write two follow-up questions that could fit after a friendly introduction.'],
        ['Show interest in a reply', 'Respond to another speaker and invite them to continue.', 'Draft a short reply that acknowledges an idea and asks one related question.'],
        ['Describe likes & preferences', 'Share a preference and add a simple reason.', 'Write what a fictional person prefers and why they might prefer it.'],
        ['Hold a four-turn conversation', 'Take turns asking, answering and responding in a short exchange.', 'Outline four turns for a conversation about a hobby or favourite activity.']
      ]],
      ['time-plans', 'Time, events & plans', 'Talk about routines, recent events and plans in a clear sequence.', 'clock', 'mint', [
        ['Describe a daily routine', 'Sequence familiar actions with clear time words.', 'Describe a fictional morning routine in three ordered steps.'],
        ['Talk about yesterday', 'Describe a completed event and place it in time.', 'Write three sentences about a made-up day in the past; check tense with a teacher.'],
        ['Make a plan for tomorrow', 'Share a simple plan and ask someone about theirs.', 'Write one plan for tomorrow and one question you could ask a partner.'],
        ['Connect events with because & then', 'Show how one event relates to another.', 'Join two ideas using a connector such as “because” or “then”; confirm the local forms.'],
        ['Compare two routines', 'Explain one similarity and one difference between routines.', 'Compare two fictional morning routines using a simple sentence frame.']
      ]],
      ['problem-solving', 'Everyday problem-solving', 'Use language to find your way, ask for help and solve small problems.', 'compass', 'peach', [
        ['Ask for and give directions', 'Use landmarks and simple steps to explain a route.', 'Describe a route between two familiar places without sharing your home address.'],
        ['Shop for market items', 'Ask about an item, quantity or price politely.', 'Role-play a short market exchange using imaginary items and amounts.'],
        ['Order a meal politely', 'Choose a meal and make a courteous request.', 'Write a short restaurant role-play with a request and a thank-you.'],
        ['Explain a small problem', 'Describe what happened and what help would be useful.', 'Invent a classroom problem and write a clear two-sentence explanation.'],
        ['Offer helpful advice', 'Suggest a next step while staying kind and respectful.', 'Write two gentle suggestions for a fictional learner facing a small challenge.']
      ]],
      ['stories-opinions', 'Stories, meaning & opinions', 'Retell, interpret and discuss ideas with more confidence.', 'book', 'yellow', [
        ['Retell a short story', 'Share the main events of a story in your own words.', 'Retell a familiar story in three steps and credit the person who shared it.'],
        ['Share an opinion & a reason', 'State a view and support it with a clear reason.', 'Choose a low-stakes topic and write an opinion plus one reason.'],
        ['Explore a proverb in context', 'Notice how a proverb’s meaning depends on speaker and situation.', 'Choose a proverb you know; write one question to ask a fluent speaker about its context.'],
        ['Compare two experiences', 'Describe what is similar and different between two events.', 'Compare two fictional experiences using one similarity and one difference.'],
        ['Summarize a conversation', 'Identify a speaker’s main idea and restate it fairly.', 'Listen to a short conversation and write its main idea without adding assumptions.']
      ]]
    ]),
    advanced: buildCourseLevel('advanced', 'Advanced', 'Use nuance, context and confident expression across longer conversations.', 'peach', 'compass', [
      ['nuance-register', 'Nuance & register', 'Choose language carefully for audience, relationship and setting.', 'compass', 'peach', [
        ['Choose an appropriate register', 'Adapt wording and tone to a formal or informal situation.', 'Compare two audiences for the same message and note what should change.'],
        ['Disagree with care', 'Express a different view while keeping the exchange respectful.', 'Draft a disagreement that acknowledges the other person’s point before adding yours.'],
        ['Clarify & paraphrase', 'Check understanding and restate an idea accurately.', 'Write a clarifying question and a neutral paraphrase of a short idea.'],
        ['Use idioms with context', 'Explore an idiom while checking when it is appropriate to use.', 'Ask a fluent speaker about an idiom’s context, tone and any situations to avoid.'],
        ['Notice indirect meaning', 'Listen for implication, humour or understatement without assuming.', 'Describe two possible meanings of a sentence and what context could clarify it.']
      ]],
      ['oral-heritage', 'Story, poetry & oral traditions', 'Approach stories, praise poetry and proverbs with context and care.', 'quote', 'mint', [
        ['Shape a longer narrative', 'Organize a story with a beginning, turning point and ending.', 'Outline a short original story; do not present it as a community folktale.'],
        ['Describe a setting vividly', 'Use precise language to help a listener imagine a place.', 'Describe an imagined setting with details about sound, color and movement.'],
        ['Interpret a proverb carefully', 'Consider possible meanings while respecting local interpretations.', 'Write one possible reading of a proverb and two questions for a knowledge keeper.'],
        ['Listen to Oríkì with context', 'Notice rhythm, repetition and speaker relationship in praise poetry.', 'Listen to an approved example and note one sound pattern and one context question.'],
        ['Interview a storyteller respectfully', 'Ask open questions and follow the speaker’s sharing boundaries.', 'Draft three consent-aware questions and a polite way to ask what should remain private.']
      ]],
      ['public-expression', 'Real-world expression', 'Present ideas, facilitate discussion and explain complex topics.', 'people', 'blue', [
        ['Present an idea with support', 'State a proposal and organize reasons that support it.', 'Prepare a short presentation outline with one claim and two supporting points.'],
        ['Negotiate options respectfully', 'Explore different choices and work toward a shared next step.', 'Write two possible compromises for a fictional group decision.'],
        ['Explain a cultural practice with attribution', 'Share context while naming whose knowledge you are drawing on.', 'Plan an explanation that identifies its source and avoids speaking for everyone.'],
        ['Summarize complex information', 'Select key points without changing their meaning.', 'Summarize a short article or talk in three accurate points.'],
        ['Facilitate a group discussion', 'Invite contributions, balance turns and summarize areas of agreement.', 'Draft an opening question and a closing summary for a small-group discussion.']
      ]],
      ['independent-creation', 'Independent expression & creation', 'Use language creatively and reflect on your progress as an independent learner.', 'sparkles', 'yellow', [
        ['Write a short dialogue', 'Create a natural exchange with distinct speakers and a clear purpose.', 'Write a six-line dialogue and mark where tone or relationship affects word choice.'],
        ['Prepare a short talk', 'Plan and deliver a concise talk with a clear opening and ending.', 'Create a one-minute talk outline and rehearse it at a comfortable pace.'],
        ['Translate for tone', 'Compare possible translations and preserve intent, not just individual words.', 'Translate a short greeting or message, then ask a fluent speaker to review its tone.'],
        ['Guide a conversation', 'Help a partner continue a conversation with thoughtful prompts.', 'Prepare three open-ended questions and one respectful way to close the exchange.'],
        ['Create a bilingual story', 'Combine language and creativity while crediting community knowledge.', 'Plan a short original bilingual story and identify any words needing teacher review.']
      ]]
    ])
  };

  function normalizeCourseLevel(level) {
    if (level === 'growing') return 'intermediate';
    if (level === 'fluent') return 'advanced';
    return ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner';
  }

  function lessonsInLevel(level) {
    const track = COURSE_CATALOG[normalizeCourseLevel(level)];
    return track.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title, moduleId: module.id })));
  }

  function completedLessonCount(languageId, level) {
    return lessonsInLevel(level).filter((lesson) => state.completed.includes(`${languageId}-${lesson.id}`)).length;
  }

  function renderCourse(params = {}) {
    const lang = getLanguage(params.lang || state.currentLang);
    const level = params.level ? normalizeCourseLevel(params.level) : '';
    if (lang.upcoming || !state.available[lang.id]) {
      return `<div class="container route-page course-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('languages', 'Learn')}<span>/</span><strong>${lang.name}</strong></div><section class="course-pending-panel"><span class="pending-language-glyph">${lang.glyph}</span><span class="section-kicker">A new path is taking shape</span><h1>${lang.name} is on its way.</h1><p>Reviewed lessons and audio are not available in this demo yet. We’ll keep this space ready rather than show incomplete learning content.</p>${renderStepper(['Language', 'Level', 'Module', 'Lesson'], 0)}<div class="pending-panel-actions">${routeLink('languages', 'Choose another language ' + icon('arrow', 14), 'button button-primary')}${routeLink('consent', 'Review the family consent process', 'text-link')}</div></section></div>`;
    }
    const tracks = Object.values(COURSE_CATALOG);
    const selectedTrack = level ? COURSE_CATALOG[level] : null;
    const currentDone = level ? completedLessonCount(lang.id, level) : 0;
    const breadcrumbs = `<div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('languages', 'Learn')}<span>/</span><strong>${lang.name} learning path</strong></div>`;
    const header = `<section class="course-top"><div><span class="section-kicker">Your learning path · ${lang.name}</span><h1>${lang.name}, <em>one good step at a time.</em></h1><p>Choose Beginner, Intermediate or Advanced. Each level contains 20 lessons across four modules.</p></div><div class="course-language-chip"><span class="language-glyph lang-${lang.tint}">${lang.glyph}</span><div><small>Learning language</small><strong>${lang.name}</strong><button data-route="languages">Change language</button></div>\n    </section>`;
    if (!level) {
      return `<div class="container route-page course-page">${breadcrumbs}${header}${renderStepper(['Language', 'Level', 'Module', 'Lesson'], 1)}<section class="course-level-section"><div class="section-heading"><div><span class="section-kicker">Step 2 · choose a level</span><h2>Where would you like to begin?</h2><p>Each course level has 20 lessons, with five lessons in each of four modules.</p></div></div><div class="level-grid">${tracks.map((track, i) => { const done = completedLessonCount(lang.id, track.id); return `<button class="level-card level-${track.color}" type="button" data-action="choose-level" data-level="${track.id}" data-lang="${lang.id}"><span class="level-number">0${i + 1}</span><span class="level-icon">${icon(track.icon, 23)}</span><strong>${track.label}</strong><small>${track.description}</small><span class="level-meta">${icon('book', 14)} ${track.lessonCount} lessons · 4 modules</span><span class="level-completion">${done} of ${track.lessonCount} complete</span><span class="level-arrow">${icon('arrow', 17)}</span></button>`; }).join('')}</div><div class="course-footnote">${icon('shield', 16)} Your progress is saved on this device. You can change levels at any time.</div></section></div>`;
    }
    const modules = selectedTrack.modules.map((module, moduleIndex) => {
      const moduleDone = module.lessons.filter((lesson) => state.completed.includes(`${lang.id}-${lesson.id}`)).length;
      const rows = module.lessons.map((lesson) => {
        const complete = state.completed.includes(`${lang.id}-${lesson.id}`);
        const saved = !!state.lessonResponses[`${lang.id}-${lesson.id}`];
        const status = complete ? 'Complete' : saved ? 'Practice saved' : 'Not started';
        return `<a class="course-lesson-row ${complete ? 'is-complete' : ''}" href="#/lesson?lang=${lang.id}&amp;level=${level}&amp;module=${module.id}&amp;lesson=${lesson.id}" data-route="lesson" data-lang="${lang.id}" data-level="${level}" data-module="${module.id}" data-lesson="${lesson.id}"><span class="course-lesson-number">${String(lesson.number).padStart(2, '0')}</span><span class="course-lesson-copy"><strong>${lesson.title}</strong><small>${lesson.focus}</small></span><span class="course-lesson-status">${complete ? icon('check', 14) : icon('arrow', 14)} ${status}</span></a>`;
      }).join('');
      return `<details class="course-module-list" ${moduleIndex === 0 ? 'open' : ''}><summary class="course-module-summary tone-${module.tint}"><span class="course-module-icon">${icon(module.icon, 21)}</span><span class="course-module-count">Module 0${moduleIndex + 1} · ${module.lessons.length} lessons</span><strong>${module.title}</strong><small>${module.desc}</small><span class="course-module-progress">${moduleDone}/${module.lessons.length} complete</span></summary><div class="course-lesson-list">${rows}</div></details>`;
    }).join('');
    return `<div class="container route-page course-page">${breadcrumbs}${header}${renderStepper(['Language', 'Level', 'Module', 'Lesson'], 2)}<section class="course-module-section"><div class="module-section-top"><div><span class="section-kicker">Step 3 · ${selectedTrack.label} · ${currentDone} of 20 complete</span><h2>Choose a lesson to explore.</h2><p>Open a module to see its five lessons. You can practise and save progress lesson by lesson.</p></div><label class="level-select-wrap" for="levelSelect"><span>Level</span><select id="levelSelect" data-action="level-select">${tracks.map((track) => `<option value="${track.id}" ${track.id === level ? 'selected' : ''}>${track.label}</option>`).join('')}</select></label></div><div class="course-module-list-grid">${modules}</div><div class="course-footnote">${icon('shield', 16)} Lesson outlines are starter activities; confirm language examples with a fluent educator.</div><button class="text-link back-link" type="button" data-action="back-to-levels" data-lang="${lang.id}">${icon('arrowUp', 14)} Choose a different level</button></section></div>`;
  }

  function renderLesson(params = {}) {
    const lang = getLanguage(params.lang || state.currentLang);
    if (lang.upcoming || !state.available[lang.id]) return `<div class="container route-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('languages', 'Learn')}<span>/</span><strong>${lang.name}</strong></div><section class="course-pending-panel"><span class="section-kicker">Language content is being prepared</span><h1>We’ll meet you here soon.</h1><p>Reviewed lesson text and pronunciation are not available for this language yet. Please choose an available path for the interactive lesson preview.</p>${routeLink('languages', 'Choose an available language ' + icon('arrow', 14), 'button button-primary')}</section></div>`;
    const level = normalizeCourseLevel(params.level || state.level || 'beginner');
    const track = COURSE_CATALOG[level];
    const allLessons = lessonsInLevel(level);
    let lesson = allLessons.find((item) => item.id === params.lesson);
    if (!lesson && params.module) lesson = allLessons.find((item) => item.moduleId === params.module);
    if (!lesson) lesson = allLessons[0];
    const lessonKey = `${lang.id}-${lesson.id}`;
    const response = state.lessonResponses[lessonKey] || '';
    const complete = state.completed.includes(lessonKey);
    const position = allLessons.findIndex((item) => item.id === lesson.id);
    const module = track.modules.find((item) => item.id === lesson.moduleId);
    const lessonLink = (item, label, cls) => `<a class="${cls}" href="#/lesson?lang=${lang.id}&amp;level=${level}&amp;module=${item.moduleId}&amp;lesson=${item.id}" data-route="lesson" data-lang="${lang.id}" data-level="${level}" data-module="${item.moduleId}" data-lesson="${item.id}">${label}</a>`;
    const backLink = routeLink('course', 'Back to 20 lessons', 'text-link', `data-lang="${lang.id}" data-level="${level}"`);
    const previous = position > 0 ? lessonLink(allLessons[position - 1], `${icon('arrowUp', 14)} Previous lesson`, 'text-link') : backLink;
    const next = position < allLessons.length - 1 ? lessonLink(allLessons[position + 1], `Next lesson ${icon('arrow', 14)}`, 'button button-outline') : backLink;
    return `<div class="container route-page lesson-page redesigned-lesson-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('languages', 'Learn')}<span>/</span>${routeLink('course', lang.name, '', `data-lang="${lang.id}"`)}<span>/</span>${routeLink('course', track.label, '', `data-lang="${lang.id}" data-level="${level}"`)}<span>/</span><strong>Lesson ${String(lesson.number).padStart(2, '0')}</strong></div>
      <div class="lesson-shell"><div class="lesson-main">${renderStepper(['Language', 'Level', 'Module', 'Lesson'], 3)}<div class="lesson-module-line"><span class="lesson-module-tag">${track.label} · Lesson ${String(lesson.number).padStart(2, '0')} of 20</span><span class="lesson-time">${icon('book', 14)} ${module.title}</span></div><h1>${lesson.title}</h1><p class="lesson-intro">${lesson.focus}</p>
        <section class="lesson-focus-card"><span class="section-kicker">Today’s learning focus</span><p>${lesson.task}</p></section>
        <form class="lesson-response-form" data-form="lesson-response" data-key="${lessonKey}"><label for="lessonResponse">Try it · write, plan or reflect</label><textarea id="lessonResponse" name="response" rows="4" maxlength="600" placeholder="Write a few words about what you practised…" required>${esc(response)}</textarea><small>Keep your practice general. Do not include full names, contact details or other private information.</small><button class="button button-primary" type="submit">Save practice on this device ${icon('arrow', 14)}</button></form>
        <div class="lesson-footer-actions"><button class="button button-soft" data-action="complete-lesson" data-key="${lessonKey}" data-lang="${lang.id}" data-level="${level}" ${!response ? 'disabled' : ''}>${complete ? 'Lesson complete' : 'Mark lesson complete'} ${icon('check', 15)}</button></div><div class="lesson-privacy-note">${icon('lock', 15)} Your written practice stays in this browser preview.</div>
      </div><aside class="lesson-aside"><div class="lesson-aside-card"><span class="section-kicker">Your progress</span><strong>${track.label} · ${position + 1} of ${track.lessonCount}</strong><p>${completedLessonCount(lang.id, level)} of 20 lessons complete in ${lang.name}. Save a practice response, then mark this lesson complete.</p><div class="mini-progress"><span style="width:${Math.round(completedLessonCount(lang.id, level) / track.lessonCount * 100)}%"></span></div><small>${complete ? 'This lesson is complete' : response ? 'Practice saved on this device' : 'A good start is a start'}</small></div><div class="aside-tip">${icon('heart', 18)}<p>Go at your own pace. A small, thoughtful practice is progress.</p></div></aside></div><div class="lesson-bottom-nav">${previous}${next}</div></div>`;
  }

  const CODE_PATHS = [
    ['html','HTML','Web · front end','markup'], ['css','CSS','Web · front end','style'],
    ['javascript','JavaScript','Web · front end','javascript'], ['typescript','TypeScript','Web · front end','typescript'],
    ['react','React','Web · front end','jsx'], ['angular','Angular','Web · front end','angular'],
    ['vue','Vue','Web · front end','javascript'], ['svelte','Svelte','Web · front end','javascript'],
    ['nextjs','Next.js','Web · front end','jsx'], ['nodejs','Node.js','Web · front end','javascript'],
    ['express','Express.js','Web · front end','javascript'], ['react-native','React Native','Web · front end','jsx'],
    ['tailwind','Tailwind CSS','Web · front end','tailwind'], ['webassembly','WebAssembly','Web · front end','wasm'],
    ['python','Python','Python · data','python'], ['django','Django','Python · data','python'],
    ['flask','Flask','Python · data','python'], ['fastapi','FastAPI','Python · data','python'],
    ['jupyter','Jupyter notebooks','Python · data','python'], ['numpy','NumPy','Python · data','python'],
    ['pandas','Pandas','Python · data','python'], ['r','R','Python · data','r'],
    ['julia','Julia','Python · data','julia'], ['matlab','MATLAB','Python · data','matlab'],
    ['java','Java','Mobile · apps','java'], ['kotlin','Kotlin','Mobile · apps','kotlin'],
    ['swift','Swift','Mobile · apps','swift'], ['objective-c','Objective-C','Mobile · apps','objectivec'],
    ['dart','Dart','Mobile · apps','dart'], ['flutter','Flutter','Mobile · apps','dart'],
    ['c','C','Systems · foundations','c'], ['cpp','C++','Systems · foundations','cpp'],
    ['csharp','C#','Systems · foundations','csharp'], ['dotnet','.NET','Systems · foundations','csharp'],
    ['go','Go','Systems · foundations','go'], ['rust','Rust','Systems · foundations','rust'],
    ['assembly','Assembly','Systems · foundations','assembly'], ['arduino','Arduino (C++)','Systems · foundations','arduino'],
    ['micropython','MicroPython','Systems · foundations','python'], ['php','PHP','Backend · databases','php'],
    ['laravel','Laravel','Backend · databases','php'], ['ruby','Ruby','Backend · databases','ruby'],
    ['rails','Ruby on Rails','Backend · databases','ruby'], ['scala','Scala','Backend · databases','scala'],
    ['sql','SQL','Backend · databases','sql'], ['postgresql','PostgreSQL','Backend · databases','sql'],
    ['mysql','MySQL','Backend · databases','sql'], ['sqlite','SQLite','Backend · databases','sql'],
    ['graphql','GraphQL','Backend · databases','graphql'], ['rest','REST APIs','Backend · databases','rest'],
    ['json','JSON','Backend · databases','json'], ['yaml','YAML','Backend · databases','yaml'],
    ['bash','Bash','DevOps · tools','bash'], ['powershell','PowerShell','DevOps · tools','powershell'],
    ['git','Git','DevOps · tools','git'], ['docker','Docker','DevOps · tools','docker'],
    ['kubernetes','Kubernetes','DevOps · tools','kubernetes'], ['terraform','Terraform','DevOps · tools','terraform'],
    ['ansible','Ansible','DevOps · tools','ansible'], ['nginx','Nginx configuration','DevOps · tools','nginx'],
    ['linux-cli','Linux command line','DevOps · tools','bash'], ['solidity','Solidity','DevOps · tools','solidity'],
    ['scratch','Scratch','Creative · games','blocks'], ['blockly','Blockly','Creative · games','blocks'],
    ['lua','Lua','Creative · games','lua'], ['luau','Luau for Roblox','Creative · games','lua'],
    ['processing','Processing','Creative · games','processing'], ['unreal-blueprints','Unreal Blueprints','Creative · games','blocks'],
    ['haskell','Haskell','Creative · games','haskell'], ['elixir','Elixir','Creative · games','elixir'],
    ['erlang','Erlang','Creative · games','erlang'], ['perl','Perl','Creative · games','perl'],
    ['ocaml','OCaml','Creative · games','ocaml'], ['fsharp','F#','Creative · games','fsharp'],
    ['crystal','Crystal','Creative · games','ruby'], ['fortran','Fortran','Creative · games','fortran'],
    ['cobol','COBOL','Creative · games','cobol'], ['clojure','Clojure','Creative · games','clojure'],
    ['groovy','Groovy','Systems · foundations','groovy'], ['visualbasic','Visual Basic .NET','Systems · foundations','visualbasic'],
    ['pascal','Pascal','Systems · foundations','pascal'], ['ada','Ada','Systems · foundations','ada'],
    ['prolog','Prolog','Creative · games','prolog'], ['lisp','Common Lisp','Creative · games','clojure'],
    ['scheme','Scheme','Creative · games','scheme'], ['racket','Racket','Creative · games','scheme'],
    ['forth','Forth','Systems · foundations','forth'], ['nim','Nim','Systems · foundations','nim'],
    ['zig','Zig','Systems · foundations','zig'], ['dlang','D','Systems · foundations','dlang'],
    ['vlang','V','Systems · foundations','vlang'], ['elm','Elm','Web · front end','elm'],
    ['purescript','PureScript','Web · front end','purescript'], ['reasonml','ReasonML','Web · front end','reasonml'],
    ['smalltalk','Smalltalk','Creative · games','smalltalk'], ['gdscript','GDScript','Creative · games','gdscript'],
    ['plsql','PL/SQL','Backend · databases','sql'], ['tsql','T-SQL','Backend · databases','sql'],
    ['vba','VBA','Automation · tools','vba'], ['tcl','Tcl','Automation · tools','tcl'],
    ['awk','AWK','Automation · tools','awk'], ['zsh','Zsh','Automation · tools','bash'],
    ['move','Move','Blockchain · systems','move']
  ].map(([id, name, category, syntax]) => ({ id, name, category, syntax }));
  const CODE_LANGUAGE_IDS = new Set([
    'html','css','javascript','typescript','python','r','julia','matlab','java','kotlin','swift','objective-c','dart',
    'c','cpp','csharp','go','rust','assembly','arduino','micropython','php','ruby','scala','sql','bash','powershell',
    'solidity','scratch','blockly','lua','luau','processing','haskell','elixir','erlang','perl','ocaml','fsharp','crystal',
    'fortran','cobol','clojure','groovy','visualbasic','pascal','ada','prolog','lisp','scheme','forth','nim','zig',
    'dlang','vlang','elm','purescript','reasonml','smalltalk','gdscript','plsql','tsql','vba','tcl','awk','zsh','move','webassembly'
  ]);

  const CODE_COPY = {
    yoruba: { label: 'Yorùbá', greeting: 'Ẹ káàárọ̀', code: 'Kóòdù jẹ́ ìtọ́ni tí a fi ń sọ fún kọ̀ǹpútà ohun tó yẹ kó ṣe.', success: 'O ṣe é! Ìgbésẹ̀ rẹ ṣiṣẹ́.', retry: 'Gbìyànjú lẹ́ẹ̀kan sí i.', sequence: 'Ìtòlẹ́sẹẹsẹ̀ àwọn ìgbésẹ̀', variable: 'Ààyè ìpamọ́ iye', questPrompt: 'Darí rọ́bọ́ọ̀tì sí ìràwọ̀. Fi àwọn ìgbésẹ̀ kóòdù kun, kí o sì mú wọn ṣiṣẹ́.', directions: ['Gòkè', 'Ọ̀tún', 'Sísàlẹ̀', 'Òsì'], questRun: 'Ṣiṣe àwọn ìgbésẹ̀', questClear: 'Pa àwọn ìgbésẹ̀ rẹ́', questLeaf: 'Àwọn ewé dí ọ̀nà. Yí ipa náà padà.', questEdge: 'Rọ́bọ́ọ̀tì dé etí pẹpẹ̀. Gbìyànjú ìtọ́sọ́nà mìíràn.', questNotYet: 'Kò tíì dé ìràwọ̀. Ṣàtúnṣe àwọn ìgbésẹ̀ rẹ, kí o sì tún gbìyànjú.', questAddFirst: 'Fi àwọn ìgbésẹ̀ díẹ̀ kun kí o tó ṣiṣẹ́ wọn.', questHint: 'Bẹ̀rẹ̀ nípa gígun sókè láti igun òsì ìsàlẹ̀. Lẹ́yìn náà, yí àwọn ewé ká sí ìràwọ̀ tó wà ní òkè ọ̀tún.' },
    igbo: { label: 'Igbo', greeting: 'Ndewo', code: 'Koodu bụ ntụziaka anyị na-enye kọmputa.', success: 'I mere ya! Nzọụkwụ gị gara nke ọma.', retry: 'Gbalịa ọzọ.', sequence: 'Usoro nke nzọụkwụ', variable: 'Ebe nchekwa uru', questPrompt: 'Duruo rọbọt ahụ gaa n’akara kpakpando. Tinye usoro iwu ma mee ka ha rụọ ọrụ.', directions: ['Elu', 'Aka nri', 'Ala', 'Aka ekpe'], questRun: 'Mee ka usoro ahụ rụọ ọrụ', questClear: 'Hichapụ usoro iwu', questLeaf: 'Akwụkwọ osisi gbochiri ụzọ. Gbanwee usoro ahụ.', questEdge: 'Robot ahụ ruru nsọtụ bọọdụ. Gbanwee ntụziaka.', questNotYet: 'Ọ rutebeghị na kpakpando. Gbanwee usoro ahụ, nwalee ọzọ.', questAddFirst: 'Tinye iwu ole na ole tupu ịmee ka ha rụọ ọrụ.', questHint: 'Malite site n’ịga elu site n’akụkụ aka ekpe dị ala. Wee gaa gburugburu akwụkwọ osisi ruo na kpakpando dị n’elu aka nri.' },
    hausa: { label: 'Hausa', greeting: 'Sannu', code: 'Lambar kwamfuta jerin umarnin da ake bai wa kwamfuta.', success: 'Ka yi nasara! Matakinka ya yi aiki.', retry: 'Ka sake gwadawa.', sequence: 'Jerin matakai', variable: 'Wurin ajiyar ƙima', questPrompt: 'Ka jagoranci mutum-mutumin zuwa tauraro. Ƙara umarni, sannan ka kunna su.', directions: ['Sama', 'Dama', 'Ƙasa', 'Hagu'], questRun: 'Gudanar da matakan', questClear: 'Share matakan', questLeaf: 'Ganyen daji ya toshe hanya. Canza jerin matakan.', questEdge: 'Mutum-mutumin ya kai ƙarshen allo. Canza hanya.', questNotYet: 'Har yanzu bai kai tauraro ba. Gyara matakan, sannan ka sake gwadawa.', questAddFirst: 'Ƙara wasu umarni kaɗan kafin ka kunna su.', questHint: 'Fara da matsawa sama daga ƙasan hagu. Sannan ka bi ta kusa da ciyayi zuwa tauraron da ke sama a dama.' },
    swahili: { label: 'Kiswahili', greeting: 'Habari', code: 'Msimbo ni maelekezo tunayoyapa kompyuta.', success: 'Umefanikiwa! Hatua yako imefanya kazi.', retry: 'Jaribu tena.', sequence: 'Mfuatano wa hatua', variable: 'Mahali pa kuhifadhi thamani', questPrompt: 'Elekeza roboti ifike kwenye nyota. Ongeza hatua za msimbo, kisha ziendeshe.', directions: ['Juu', 'Kulia', 'Chini', 'Kushoto'], questRun: 'Endesha hatua hizi', questClear: 'Futa hatua', questLeaf: 'Kichaka kimezuia njia. Badilisha mfuatano.', questEdge: 'Roboti imefika ukingoni mwa ubao. Badilisha mwelekeo.', questNotYet: 'Bado haijafika kwenye nyota. Rekebisha hatua zako, kisha ujaribu tena.', questAddFirst: 'Ongeza hatua chache kwanza, kisha uziendeshe.', questHint: 'Anza kwa kwenda juu kutoka kona ya chini kushoto. Kisha zunguka vichaka kuelekea nyota iliyo juu kulia.' }
  };
  const CODE_LEVELS = [
    { id: 'beginner', label: 'Beginner', badge: 'Sprout', note: 'Meet the idea and make one small change.', icon: 'leaf' },
    { id: 'intermediate', label: 'Intermediate', badge: 'Explorer', note: 'Connect ideas and solve a little puzzle.', icon: 'compass' },
    { id: 'advanced', label: 'Advanced', badge: 'Builder', note: 'Stretch the example and make it your own.', icon: 'layers' }
  ];
  const CODE_MISSIONS = [
    { id: 'hello', title: 'Say a friendly hello', skill: 'First output', icon: 'smile' },
    { id: 'sequence', title: 'Put the steps in order', skill: 'Sequences', icon: 'layers' },
    { id: 'variable', title: 'Save a word for later', skill: 'Values & variables', icon: 'bookmark' },
    { id: 'mini-build', title: 'Make a tiny creation', skill: 'Creative challenge', icon: 'sparkles' }
  ];
  const CODE_ADVENTURES = [
    { tech: 'scratch', title: 'Make a character dance', text: 'Snap colourful instruction blocks together and bring a story to life.', label: 'Blocks · ages 6+', icon: 'sparkles', tone: 'sun' },
    { tech: 'html', title: 'Build a little webpage', text: 'Give your favourite idea a heading, a message and a place on the web.', label: 'Web · ages 8+', icon: 'globe', tone: 'sky' },
    { tech: 'python', title: 'Tell a tiny Python story', text: 'Teach a character to speak, count and follow a clever path.', label: 'Python · ages 9+', icon: 'book', tone: 'peach' },
    { tech: 'javascript', title: 'Make a click-and-play game', text: 'Add simple rules that make a game respond when someone plays.', label: 'Games · ages 9+', icon: 'play', tone: 'lilac' },
    { tech: 'css', title: 'Design a digital badge', text: 'Choose colours, spacing and style to make your creation shine.', label: 'Design · ages 8+', icon: 'star', tone: 'mint' },
    { tech: 'arduino', title: 'Imagine a helpful robot', text: 'Explore the instructions behind lights, sensors and friendly machines.', label: 'Robotics · ages 10+', icon: 'compass', tone: 'blue' }
  ];
  const CODE_GARDEN_DIRECTIONS = {
    up: { dx: 0, dy: -1, glyph: '↑', labelIndex: 0 },
    right: { dx: 1, dy: 0, glyph: '→', labelIndex: 1 },
    down: { dx: 0, dy: 1, glyph: '↓', labelIndex: 2 },
    left: { dx: -1, dy: 0, glyph: '←', labelIndex: 3 }
  };
  const CODE_GARDEN_OBSTACLES = new Set(['1,3', '3,2', '3,1']);
  const CODE_GARDEN_TARGET = '4,0';
  const CODE_TOKENS = {
    markup: '<h1', style: 'color:', javascript: 'console.log(', typescript: ': string', jsx: 'return <h1', angular: '{{',
    python: 'print(', r: 'print(', julia: 'println(', matlab: 'disp(', java: 'System.out.println', kotlin: 'println(',
    swift: 'print(', objectivec: 'NSLog', dart: 'print(', c: 'printf(', cpp: 'cout', csharp: 'Console.', go: 'fmt.Println',
    rust: 'println!', assembly: 'section', arduino: 'Serial.println', php: 'echo ', ruby: 'puts ', scala: 'println(',
    sql: 'SELECT', graphql: 'query', rest: 'GET ', json: '"message"', yaml: 'message:', bash: 'echo ', powershell: 'Write-Output',
    git: 'git status', docker: 'FROM', kubernetes: 'kind:', terraform: 'output ', ansible: 'tasks:', nginx: 'server {',
    solidity: 'contract ', blocks: 'say ', lua: 'print(', processing: 'void setup', wasm: 'module', haskell: 'putStrLn',
    elixir: 'IO.puts', erlang: 'io:format', perl: 'print ', ocaml: 'print_endline', fsharp: 'printfn', fortran: 'PRINT *,',
    cobol: 'DISPLAY ', clojure: 'println(', groovy: 'println ', visualbasic: 'Console.WriteLine', tailwind: 'text-green-',
    pascal: 'writeln(', ada: 'Put_Line', prolog: 'write(', lisp: '(format t', scheme: '(display', forth: '."',
    nim: 'echo ', zig: 'std.debug.print', dlang: 'writeln(', vlang: 'println(', elm: 'text "', purescript: 'log "',
    reasonml: 'print_endline', smalltalk: 'Transcript show:', gdscript: 'print(', vba: 'Debug.Print',
    tcl: 'puts ', awk: 'print ', move: 'module '
  };
  function sampleCodeFor(tech, greeting) {
    const g = greeting.replaceAll('"', '\\"');
    switch (tech.syntax) {
      case 'markup': return `<h1 class="greeting">${g}</h1>`;
      case 'style': return `.greeting {\n  color: #15764a;\n  padding: 1rem;\n}`;
      case 'tailwind': return `<p class="text-green-700 p-4">${g}</p>`;
      case 'javascript': return `const greeting = "${g}";\nconsole.log(greeting);`;
      case 'typescript': return `const greeting: string = "${g}";\nconsole.log(greeting);`;
      case 'jsx': return `function Greeting() {\n  return <h1>${g}</h1>;\n}`;
      case 'angular': return `// greeting.component.html\n<h1>{{ greeting }}</h1>`;
      case 'python': return `greeting = "${g}"\nprint(greeting)`;
      case 'r': return `greeting <- "${g}"\nprint(greeting)`;
      case 'julia': return `greeting = "${g}"\nprintln(greeting)`;
      case 'matlab': return `greeting = "${g}";\ndisp(greeting)`;
      case 'java': return `class Greeting {\n  public static void main(String[] args) {\n    System.out.println("${g}");\n  }\n}`;
      case 'kotlin': return `fun main() {\n  println("${g}")\n}`;
      case 'swift': return `let greeting = "${g}"\nprint(greeting)`;
      case 'objectivec': return `NSString *greeting = @"${g}";\nNSLog(@"%@", greeting);`;
      case 'dart': return `void main() {\n  print("${g}");\n}`;
      case 'c': return `#include <stdio.h>\nint main(void) {\n  printf("${g}\\n");\n  return 0;\n}`;
      case 'cpp': return `#include <iostream>\nint main() {\n  std::cout << "${g}";\n}`;
      case 'csharp': return `Console.WriteLine("${g}");`;
      case 'go': return `package main\nimport "fmt"\nfunc main() { fmt.Println("${g}") }`;
      case 'rust': return `fn main() {\n  println!("${g}");\n}`;
      case 'assembly': return `section .data\n  greeting db "${g}", 0`;
      case 'php': return `<?php\necho "${g}";\n?>`;
      case 'ruby': return `greeting = "${g}"\nputs greeting`;
      case 'scala': return `object Greeting {\n  def main(args: Array[String]): Unit = println("${g}")\n}`;
      case 'sql': return `SELECT '${g}' AS message;`;
      case 'graphql': return `query Greeting {\n  greeting(message: "${g}")\n}`;
      case 'rest': return `GET /greeting?message=${encodeURIComponent(g)}`;
      case 'json': return `{\n  "message": "${g}",\n  "repeat": 1\n}`;
      case 'yaml': return `message: "${g}"\nrepeat: 1`;
      case 'bash': return `message="${g}"\necho "$message"`;
      case 'powershell': return `$message = "${g}"\nWrite-Output $message`;
      case 'git': return `git status\ngit add greeting.txt\ngit commit -m "Add greeting"`;
      case 'docker': return `FROM alpine:3.20\nCMD ["sh", "-c", "echo '${g}'"]`;
      case 'kubernetes': return `apiVersion: v1\nkind: Pod\nmetadata:\n  name: greeting\nspec: {}`;
      case 'terraform': return `output "greeting" {\n  value = "${g}"\n}`;
      case 'ansible': return `- name: Show a greeting\n  ansible.builtin.debug:\n    msg: "${g}"`;
      case 'nginx': return `server {\n  listen 8080;\n  location / { return 200 "${g}"; }\n}`;
      case 'solidity': return `contract Greeting {\n  function message() public pure returns (string memory) {\n    return "${g}";\n  }\n}`;
      case 'blocks': return `when green flag clicked\nsay "${g}" for 2 seconds\nrepeat 2 times\n  move 10 steps`;
      case 'lua': return `local greeting = "${g}"\nprint(greeting)`;
      case 'processing': return `void setup() {\n  println("${g}");\n}`;
      case 'wasm': return `(module\n  ;; A tiny ${tech.name} learning path\n  (func (export "start")))`;
      case 'arduino': return `void setup() {\n  Serial.begin(9600);\n  Serial.println("${g}");\n}`;
      case 'haskell': return `main = putStrLn "${g}"`;
      case 'elixir': return `IO.puts("${g}")`;
      case 'erlang': return `main() -> io:format("${g}~n").`;
      case 'perl': return `my $greeting = "${g}";\nprint "$greeting\\n";`;
      case 'ocaml': return `let () = print_endline "${g}";;`;
      case 'fsharp': return `printfn "${g}"`;
      case 'fortran': return `PROGRAM GREETING\n  PRINT *, "${g}"\nEND PROGRAM GREETING`;
      case 'cobol': return `DISPLAY "${g}"`;
      case 'clojure': return `(println "${g}")`;
      case 'groovy': return `def greeting = "${g}"\nprintln greeting`;
      case 'visualbasic': return `Module Greeting\n  Sub Main()\n    Console.WriteLine("${g}")\n  End Sub\nEnd Module`;
      case 'pascal': return `program Greeting;\nbegin\n  writeln('${g}');\nend.`;
      case 'ada': return `with Ada.Text_IO; use Ada.Text_IO;\nprocedure Greeting is\nbegin\n  Put_Line("${g}");\nend Greeting;`;
      case 'prolog': return `greeting :- write('${g}'), nl.`;
      case 'lisp': return `(format t "${g}~%")`;
      case 'scheme': return `(display "${g}")\n(newline)`;
      case 'forth': return `: greeting ." ${g}" ;\ngreeting`;
      case 'nim': return `let greeting = "${g}"\necho greeting`;
      case 'zig': return `const std = @import("std");\npub fn main() void {\n  std.debug.print("${g}\\n", .{});\n}`;
      case 'dlang': return `import std.stdio;\nvoid main() { writeln("${g}"); }`;
      case 'vlang': return `fn main() {\n  println('${g}')\n}`;
      case 'elm': return `import Html exposing (text)\nmain = text "${g}"`;
      case 'purescript': return `module Main where\nimport Effect.Console (log)\nmain = log "${g}"`;
      case 'reasonml': return `let () = print_endline("${g}");`;
      case 'smalltalk': return `Transcript show: '${g}'; cr.`;
      case 'gdscript': return `extends Node\nfunc _ready():\n    print("${g}")`;
      case 'vba': return `Sub SayHello()\n  Debug.Print "${g}"\nEnd Sub`;
      case 'tcl': return `set greeting "${g}"\nputs $greeting`;
      case 'awk': return `BEGIN { print "${g}" }`;
      case 'move': return `module 0x1::greeting {\n  public fun message(): vector<u8> { b"${g}" }\n}`;
      default: return `// ${tech.name}\nconsole.log("${g}");`;
    }
  }

  async function toggleVoiceDictation(button) {
    const status = document.getElementById('voice-transcription-status');
    const language = document.getElementById('voice-translation-source-language')?.value || 'en';
    if (voiceDictationRecorder?.state === 'recording') {
      voiceDictationRecorder.stop();
      button.disabled = true;
      button.textContent = 'Transcribing…';
      if (status) status.textContent = 'Sending your recording to Idilewa for transcription…';
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      if (status) status.textContent = 'Audio recording is not supported in this browser.';
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      if (status) status.textContent = error instanceof Error
        ? `Microphone access failed: ${error.message}`
        : 'Microphone access failed.';
      return;
    }

    const chunks = [];
    let recorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      if (status) status.textContent = error instanceof Error
        ? `Audio recording could not start: ${error.message}`
        : 'Audio recording could not start.';
      return;
    }
    voiceDictationRecorder = recorder;
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    recorder.addEventListener('stop', async () => {
      stream.getTracks().forEach((track) => track.stop());
      voiceDictationRecorder = null;
      const recording = new Blob(chunks, {
        type: chunks[0]?.type || recorder.mimeType || 'audio/webm',
      });
      if (!recording.size) {
        if (status) status.textContent = 'No audio was recorded. Try again or type your phrase.';
        if (button.isConnected) {
          button.disabled = false;
          button.innerHTML = icon('mic', 18);
        }
        return;
      }
      try {
        const result = await transcribeWithPlotweaver(recording, language);
        const input = document.getElementById('voice-translation-input');
        if (input) {
          input.value = result.text.slice(0, input.maxLength > 0 ? input.maxLength : 1_000);
          const count = document.getElementById('voice-translation-character-count');
          if (count) count.textContent = String(input.value.length);
        }
        const output = document.getElementById('voice-translation-result');
        if (output) {
          output.textContent = '';
          delete output.dataset.translation;
          delete output.dataset.source;
        }
        if (status) status.textContent = `Transcribed as ${result.language || language}. Select Translate to continue.`;
      } catch (error) {
        if (status) status.textContent = error instanceof Error
          ? error.message
          : 'The recording could not be transcribed.';
      } finally {
        if (button.isConnected) {
          button.disabled = false;
          button.innerHTML = icon('mic', 18);
        }
      }
    }, { once: true });
    try {
      recorder.start();
    } catch (error) {
      voiceDictationRecorder = null;
      stream.getTracks().forEach((track) => track.stop());
      if (status) status.textContent = error instanceof Error
        ? `Audio recording could not start: ${error.message}`
        : 'Audio recording could not start.';
      return;
    }
    button.innerHTML = 'Stop dictation';
    if (status) status.textContent = `Recording in ${language}. Select Stop dictation when finished.`;
  }

  const IDE_RUNNER_LANGUAGES = [
    'python', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php', 'kotlin',
    'swift', 'typescript', 'r', 'lua', 'perl', 'haskell', 'scala', 'bash', 'pascal',
    'fortran', 'cobol', 'dart', 'elixir', 'erlang', 'clojure', 'fsharp', 'prolog',
    'ada', 'objective-c', 'sql'
  ];
  const IDE_LANGUAGE_EXTENSIONS = {
    yoruba: 'yoruba', igbo: 'igbo', hausa: 'hausa', swahili: 'swahili',
    javascript: 'js', typescript: 'ts', cpp: 'cpp', csharp: 'cs',
    'objective-c': 'm', python: 'py', java: 'java', c: 'c', go: 'go',
    rust: 'rs', ruby: 'rb', php: 'php', kotlin: 'kt', swift: 'swift',
    r: 'r', lua: 'lua', perl: 'pl', haskell: 'hs', scala: 'scala',
    bash: 'sh', pascal: 'pas', fortran: 'f90', cobol: 'cbl', dart: 'dart',
    elixir: 'ex', erlang: 'erl', clojure: 'clj', fsharp: 'fs',
    prolog: 'pl', ada: 'adb', sql: 'sql', html: 'html', css: 'css'
  };
  const IDE_LOCAL_LANGUAGES = [
    { id: 'yoruba', name: 'Yorùbá' },
    { id: 'igbo', name: 'Igbo' },
    { id: 'hausa', name: 'Hausa' },
    { id: 'swahili', name: 'Kiswahili' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'javascript', name: 'JavaScript' }
  ];
  const IDE_REMOTE_LANGUAGE_OPTIONS = IDE_RUNNER_LANGUAGES
    .map((id) => ({ id, name: CODE_PATHS.find((language) => language.id === id)?.name || id }));

  function getIdePresets(languageId) {
    if (IDE_PRESETS[languageId]) return IDE_PRESETS[languageId];
    const language = CODE_PATHS.find((item) => item.id === languageId);
    if (!language) return IDE_PRESETS.yoruba;
    const extension = IDE_LANGUAGE_EXTENSIONS[languageId] || 'txt';
    const code = languageId === 'html'
      ? '<!doctype html>\n<h1>Hello from Idilewa!</h1>\n<p>Edit this page and run it to see your changes.</p>'
      : languageId === 'css'
        ? 'body {\n  font-family: system-ui, sans-serif;\n  color: #15764a;\n}\n\nh1 {\n  letter-spacing: 0.02em;\n}'
        : sampleCodeFor(language, 'Hello from Idilewa!');
    return [{
      id: `hello_world_${languageId}`,
      title: 'Hello world',
      filename: `main.${extension}`,
      code,
      explainer: ['Edit the starter program, then choose Run to see its output.']
    }];
  }

  function initializeIdeRuntimes() {
    const selector = document.getElementById('ide-language-select');
    const status = document.getElementById('ide-language-status');
    if (!selector || selector.dataset.runtimeLookupStarted) return;
    selector.dataset.runtimeLookupStarted = 'true';

    fetch('/api/code/languages', { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || 'The private runner is not configured on this host.');
        if (!Array.isArray(result?.languages)) {
          throw new Error('Compiler-language discovery is unavailable on this host. Deploy with Vercel to enable the private compiler.');
        }
        return result.languages;
      })
      .then((languages) => {
        const available = new Set(languages.map((language) => language.id));
        selector.querySelectorAll('option[data-runner-language]').forEach((option) => {
          option.disabled = !available.has(option.value);
        });
        if (status) {
          status.textContent = `${available.size} private language runtime${available.size === 1 ? '' : 's'} available.`;
        }
      })
      .catch((error) => {
        selector.querySelectorAll('option[data-runner-language]').forEach((option) => {
          option.disabled = true;
        });
        if (status) {
          status.textContent = `${error.message} Browser languages and African-language lessons remain available.`;
        }
      });
  }

  const codeTextFor = (languageId) => CODE_COPY[languageId] || CODE_COPY.yoruba;

  const IDE_PRESETS = {
    yoruba: [
      {
        id: 'hello_world',
        title: '☀️ Kí Ilé Ayé (Hello World)',
        filename: 'kí_ilé_ayé.yoruba',
        code: '# Kí Ilé Ayé ní Èdè Yorùbá\njẹ́ orúkọ = "Ọmọ Yorùbá"\ntẹ_jade("Ẹ n lẹ́ o, " + orúkọ + "! Ẹ káàbọ̀ sí Idíléwà.")\ntẹ_jade("A n kọ́ koodu ní èdè abínibí wa lónìí! ✨")',
        explainer: [
          '<b>jẹ́ orúkọ = "Ọmọ Yorùbá"</b>: Ṣẹ̀dá apo ifipamọ (variable) ti a pe ni "orúkọ".',
          '<b>tẹ_jade(...)</b>: Fi ọ̀rọ̀ ikini ati orúkọ han lori iboju / terminal.'
        ]
      },
      {
        id: 'multiplication',
        title: '🔢 Àtẹ Ìṣirò (Multiplication Table)',
        filename: 'ate_isiro.yoruba',
        code: '# Àtẹ Ìṣirò Kẹta (Multiplication Table 3)\njẹ́ nọmba = 3\ntẹ_jade("Àtẹ Ìṣirò Fún Nọmba " + nọmba + ":")\n\nfún i = 1 dé 5 {\n    jẹ́ àbájáde = nọmba * i\n    tẹ_jade(nọmba + " x " + i + " = " + àbájáde)\n}',
        explainer: [
          '<b>jẹ́ nọmba = 3</b>: Nọmba tí a fẹ́ ṣe àtẹ ìṣirò fún.',
          '<b>fún i = 1 dé 5 { ... }</b>: Tún ìṣirò ṣe láti 1 dé 5 léraléra (for loop).',
          '<b>jẹ́ àbájáde = nọmba * i</b>: Ṣe ìṣirò ìsọdipúpọ̀.'
        ]
      },
      {
        id: 'decision_tree',
        title: '👑 Èrò Ọmọlúwàbí (Character & Moral Logic)',
        filename: 'iwa_omoluwabi.yoruba',
        code: '# Èrò Ọmọlúwàbí (Decision Tree Logic)\njẹ́ iwa_rere = òótọ́\njẹ́ akitiyan = 85\n\nbí iwa_rere == òótọ́ {\n    tẹ_jade("Ọmọlúwàbí gidi ni ọ́! Ìwà rere lẹṣọ́ ènìyàn.")\n    bí akitiyan >= 80 {\n        tẹ_jade("Àkíyèsí: Ọpọlọ pípé ati akitiyan gíga! (+25 XP) 🌟")\n    }\n} kò_bá_jẹ́ {\n    tẹ_jade("Ẹ jẹ́ ká fi ìwà rere ṣètò gbogbo ìgbésẹ̀ wa.")\n}',
        explainer: [
          '<b>bí iwa_rere == òótọ́ { ... }</b>: Ṣàyẹ̀wò bóyá ipò jẹ́ òtítọ́ (if conditional).',
          '<b>kò_bá_jẹ́ { ... }</b>: Tí kò bá rí bẹ́ẹ̀ (else).'
        ]
      },
      {
        id: 'shapes_star',
        title: '🎨 Àwòrán Ìràwọ̀ & Adire (Canvas Graphics)',
        filename: 'aworan_irawo.yoruba',
        code: '# Fa Ìràwọ̀ ati Onígun Adire lori Canvas\nbẹ̀rẹ̀_àwòrán()\nyi_awo("ofeefe")\nfa_irawo(180, 120, 5, 50, 22)\n\nyi_awo("alawọ-ewe")\nkọ_ọ̀rọ̀("Ìràwọ̀ Idíléwà STEM 🚀", 80, 240)',
        explainer: [
          '<b>bẹ̀rẹ̀_àwòrán()</b>: Nu ìbòjú kí o bẹ̀rẹ̀ àwòrán tuntun.',
          '<b>yi_awo("ofeefe")</b>: Yí àwọ̀ pen sí ofeefe (yellow/gold).',
          '<b>fa_irawo(...)</b>: Fa ìràwọ̀ tí ó lẹ́wà pẹ̀lú igun 5 lórí canvas.'
        ]
      },
      {
        id: 'age_calc',
        title: '🧮 Ìṣirò Ọjọ́-Orí (Age & Grade Calculator)',
        filename: 'isiro_ojo_ori.yoruba',
        code: '# Ìṣirò Ọjọ́-orí ati Ipò Ẹkọ STEM\njẹ́ ọdún_ìbí = 2016\njẹ́ ọdún_yìí = 2026\njẹ́ ọjọ́_orí = ọdún_yìí - ọdún_ìbí\n\ntẹ_jade("Ọjọ́-orí rẹ jẹ́ ọdún: " + ọjọ́_orí)\nbí ọjọ́_orí >= 10 {\n    tẹ_jade("Ipò: Upper Elementary / Middle School African Innovator! 🚀")\n} kò_bá_jẹ́ {\n    tẹ_jade("Ipò: Lower Elementary STEM Seedling! 🌱")\n}',
        explainer: [
          '<b>jẹ́ ọjọ́_orí = ọdún_yìí - ọdún_ìbí</b>: Ṣe ìṣirò ìyàtọ̀ láàárín ọdún méjì.',
          '<b>bí ... kò_bá_jẹ́</b>: Pín ọmọ sí ìpele ẹ̀kọ́ tí ó tọ́.'
        ]
      }
    ],
    igbo: [
      {
        id: 'hello_world_igbo',
        title: '🌟 Ekele Ụwa (Hello World)',
        filename: 'ekele_uwa.igbo',
        code: '# Koodu n\'Asụsụ Igbo\nka aha = "Nwa Amamihe"\ndee("Ndị banyere m, nnoo " + aha + "!")\ndee("Anyị na-amụ kọmputa n\'asụsụ Igbo lónìí! ✨")',
        explainer: [
          '<b>ka aha = "..."</b>: Mepụta aha nchekwa (variable).',
          '<b>dee(...)</b>: Dee ma gosipụta ozi na kọmputa.'
        ]
      },
      {
        id: 'multiplication_igbo',
        title: '🔢 Tebụl Mụbaa (Multiplication 1-5)',
        filename: 'tebul_mubaa.igbo',
        code: '# Tebụl Mụbaa n\'Asụsụ Igbo\nka onuogugu = 4\ndee("Tebụl Mụbaa maka " + onuogugu + ":")\n\nmaka i = 1 ruo 5 {\n    ka azịza = onuogugu * i\n    dee(onuogugu + " x " + i + " = " + azịza)\n}',
        explainer: [
          '<b>ka onuogugu = 4</b>: Nọmba a ga-eji mụbaa.',
          '<b>maka i = 1 ruo 5</b>: Mee ya ugboro ise (loop).'
        ]
      },
      {
        id: 'decision_tree_igbo',
        title: '💡 Amamihe na Eziokwu (Wisdom & Logic)',
        filename: 'eziokwu.igbo',
        code: '# Ihe Nzuzo na Amamihe\nka eziokwu_di = eziokwu\nka akara = 90\n\nọ bụrụ na eziokwu_di == eziokwu {\n    dee("Eziokwu na-eweta nkwanye ùgwù!")\n    ọ bụrụ na akara >= 80 {\n        dee("Ihe Nrite: Akara kachasị elu! (+25 XP) 🌟")\n    }\n} ọzọ {\n    dee("Kwuo eziokwu n\'oge niile.")\n}',
        explainer: [
          '<b>ọ bụrụ na ... ọzọ</b>: Nhọrọ dabere na ọnọdụ (conditional logic).'
        ]
      }
    ],
    hausa: [
      {
        id: 'hello_world_hausa',
        title: '🌟 Barka da Duniya (Hello World)',
        filename: 'barka_duniya.hausa',
        code: '# Rubuta Koodu a Harshen Hausa\nsanya suna = "Yaron Fasaha"\nbuga("Sannu da zuwa, " + suna + "!")\nbuga("Muna koyon ilimin kimiya da koodu a harshen Hausa! ✨")',
        explainer: [
          '<b>sanya suna = "..."</b>: Ƙirƙiri sabon ma\'aji (variable).',
          '<b>buga(...)</b>: Buga saƙo a allon kwamfuta.'
        ]
      },
      {
        id: 'multiplication_hausa',
        title: '🔢 Teburin Lissafi (Multiplication Table)',
        filename: 'lissafi.hausa',
        code: '# Teburin Lissafi a Harshen Hausa\nsanya lamba = 5\nbuga("Teburin Lissafi Na " + lamba + ":")\n\ndon i = 1 zuwa 5 {\n    sanya sakamako = lamba * i\n    buga(lamba + " x " + i + " = " + sakamako)\n}',
        explainer: [
          '<b>don i = 1 zuwa 5</b>: Maimaita lissafi sau 5.'
        ]
      },
      {
        id: 'decision_tree_hausa',
        title: '💡 Hankali da Gaskiya (Wisdom & Decision)',
        filename: 'gaskiya.hausa',
        code: '# Hukunci a Harshen Hausa\nsanya mai_gaskiya = gaskiya\nsanya maki = 88\n\nidan mai_gaskiya == gaskiya {\n    buga("Gaskiya dokin karfe ce!")\n    idan maki >= 80 {\n        buga("Lambar Yabo: Kokari mai kyau! (+25 XP) 🌟")\n    }\n} in ba haka ba {\n    buga("Ka rike gaskiya a kowane lokaci.")\n}',
        explainer: [
          '<b>idan ... in ba haka ba</b>: Bincika sharadi (if/else).'
        ]
      }
    ],
    swahili: [
      {
        id: 'hello_world_swahili',
        title: '🌟 Hujambo Ulimwengu (Hello World)',
        filename: 'hujambo.swahili',
        code: '# Msimbo kwa Kiswahili\nweka jina = "Mwanafunzi Hodari"\nandika("Hujambo, " + jina + "! Karibu Idilewa.")\nandika("Tunajifunza kuandika kodi kwa lugha yetu ya asili! ✨")',
        explainer: [
          '<b>weka jina = "..."</b>: Tenga nafasi ya kumbukumbu (variable).',
          '<b>andika(...)</b>: Andika ujumbe kwenye kiolesura cha kodi.'
        ]
      },
      {
        id: 'multiplication_swahili',
        title: '🔢 Jedwali la Kuzidisha (Multiplication Table)',
        filename: 'kuzidisha.swahili',
        code: '# Jedwali la Kuzidisha kwa Kiswahili\nweka nambari = 6\nandika("Jedwali la Nambari " + nambari + ":")\n\nkwa i = 1 hadi 5 {\n    weka jibu = nambari * i\n    andika(nambari + " x " + i + " = " + jibu)\n}',
        explainer: [
          '<b>kwa i = 1 hadi 5</b>: Kurudia hesabu (loop).'
        ]
      },
      {
        id: 'decision_tree_swahili',
        title: '💡 Hekima na Uamuzi (Wisdom & Logic)',
        filename: 'hekima.swahili',
        code: '# Maamuzi kwa Kiswahili\nweka uaminifu = kweli\nweka alama = 85\n\nkama uaminifu == kweli {\n    andika("Uaminifu ni msingi thabiti wa maisha!")\n    kama alama >= 80 {\n        andika("Hongera: Matokeo bora ya STEM! (+25 XP) 🌟")\n    }\n} vinginevyo {\n    andika("Zingatia uaminifu na bidii.")\n}',
        explainer: [
          '<b>kama ... vinginevyo</b>: Masharti ya uamuzi (if/else).'
        ]
      }
    ],
    python: [
      {
        id: 'bilingual_python',
        title: '🐍 Python Bilingual Studio',
        filename: 'african_steam.py',
        code: '# Bilingual African STEM Python\nstudent = "Young African Innovator"\nlanguages = ["Yorùbá", "Igbo", "Hausa", "Swahili"]\n\nprint(f"E ku aaro / Nnoo / Sannu / Hujambo {student}!")\nfor lang in languages:\n    print(f"✓ Empowering kids to code in {lang} 🌍")',
        explainer: [
          '<b>for lang in languages:</b>: Loop through each indigenous African language.',
          '<b>print(...)</b>: Output formatted strings to terminal.'
        ]
      },
      {
        id: 'math_python',
        title: '🔢 African STEM Math Calculator',
        filename: 'calculator.py',
        code: '# African STEM Math Calculator\nnum1 = 12\nnum2 = 8\ntotal = num1 + num2\nproduct = num1 * num2\n\nprint("STEM Innovation Hub Calculations:")\nprint(f"Sum of {num1} + {num2} = {total}")\nprint(f"Product of {num1} x {num2} = {product}")\nif total >= 20:\n    print("✓ Threshold reached: Super Junior Engineer! 🚀")',
        explainer: [
          '<b>total = num1 + num2</b>: Mathematical arithmetic.',
          '<b>if total >= 20:</b>: Conditional evaluation.'
        ]
      },
      {
        id: 'loop_python',
        title: '🚀 Rocket Countdown & STEM Greetings',
        filename: 'countdown.py',
        code: '# African Satellite STEM Launch\nhub = "Idilewa African Space & STEM Lab"\nprint(f"Initiating launch sequence from {hub}...")\n\nfor count in [5, 4, 3, 2, 1]:\n    print(f"T-minus {count} seconds...")\n\nprint("🚀 Blast off! Empowering Africa\'s next tech innovators!")',
        explainer: [
          '<b>for count in [5, 4, 3, 2, 1]:</b>: Countdown sequence loop.',
          '<b>print(...)</b>: Terminal output.'
        ]
      }
    ]
  };

  // Robust Native African Code & Python Interpreter for Kids
  async function runIdeInterpreter(code, lang, canvasEl) {
    const logs = [];
    const startTime = performance.now();
    let hasCanvasDraw = false;

    let ctx = null;
    if (canvasEl && canvasEl.getContext) {
      ctx = canvasEl.getContext('2d');
    }

    try {
      if (lang === 'yoruba') {
        let js = code;
        js = js.replace(/#.*$/gm, (m) => '// ' + m.slice(1));
        const strings = [];
        js = js.replace(/(["'])(?:\\.|(?!\1)[^\r\n\\\'])*\1/g, (match) => {
          strings.push(match);
          return '___STR_' + (strings.length - 1) + '___';
        });

        const ID_PAT = '[a-zA-Z0-9_$À-ž\\u1E00-\\u1EFF\\u0300-\\u036F]+';

        js = js.replace(/(^|[\s;({])(tẹ_jade|te_jade|kọ|ko|print|console\.log)\s*\(/g, '$1__print(');
        js = new RegExp('(^|[\\s;({])(jẹ́|je|jẹ)\\s+(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $3 =');
        js = new RegExp('(^|[\\n;])\\s*(?!let\\b|const\\b|var\\b|if\\b|for\\b|while\\b|function\\b|return\\b)(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $2 =');
        js = js.replace(/(^|[\s;({])(bí_kò_bá_jẹ́|bi_ko_ba_je)\s*/g, '$1else if ');
        js = js.replace(/(^|[\s;({])(kò_bá_jẹ́|ko_ba_je)\s*/g, '$1else ');
        js = js.replace(/(^|[\s;({])(bí|bi)\s+/g, '$1if (');
        js = js.replace(/if\s*\(([^\{]+)\{/g, (match, cond) => {
          let clean = cond.trim();
          if (!clean.endsWith(')')) clean += ')';
          return 'if (' + clean + ' {';
        });
        js = new RegExp('(^|[\\s;({])(fún|fun)\\s+(' + ID_PAT + ')\\s*=\\s*([0-9]+)\\s*(dé|de)\\s*([0-9]+)\\s*\\{', 'g')[Symbol.replace](js, '$1for (let $3 = $4; $3 <= $6; $3++) {');
        js = js.replace(/(^|[\s;({])(níwọ̀n_ìgbà|niwon_igba)\s+([^\{]+)\{/g, (m, p, kw, cond) => p + 'while (' + cond.trim() + ') {');
        js = new RegExp('(^|[\\s;({])(iṣẹ́|ise)\\s+(' + ID_PAT + ')\\s*\\(', 'g')[Symbol.replace](js, '$1function $3(');
        js = js.replace(/(^|[\s;({])(padà|pada)\s+/g, '$1return ');

        js = js.replace(/(^|[\s;({])(òótọ́|ooto)([\s;)\]},]|$)/g, '$1true$3');
        js = js.replace(/(^|[\s;({])(irọ́|iro)([\s;)\]},]|$)/g, '$1false$3');
        js = js.replace(/(^|[\s;({])(òfo|ofo)([\s;)\]},]|$)/g, '$1null$3');

        // Canvas Turtle helpers
        js = js.replace(/(^|[\s;({])(bẹ̀rẹ̀_àwòrán|bere_aworan)\s*\(/g, '$1__initCanvas(');
        js = js.replace(/(^|[\s;({])(yi_awo)\s*\(/g, '$1__setColor(');
        js = js.replace(/(^|[\s;({])(fa_irawo)\s*\(/g, '$1__drawStar(');
        js = js.replace(/(^|[\s;({])(kọ_ọ̀rọ̀|ko_oro)\s*\(/g, '$1__drawText(');

        js = js.replace(/___STR_(\d+)___/g, (match, idx) => strings[Number(idx)]);

        const printBuffer = [];
        const customPrint = (...args) => printBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));

        const customInitCanvas = () => {
          hasCanvasDraw = true;
          if (ctx && canvasEl) {
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            ctx.fillStyle = '#07130b';
            ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
            ctx.strokeStyle = '#22c55e';
            ctx.fillStyle = '#22c55e';
            ctx.lineWidth = 3;
          }
        };

        const customSetColor = (color) => {
          hasCanvasDraw = true;
          if (!ctx) return;
          const colorMap = {
            pupa: '#ef4444', red: '#ef4444',
            alawọ_ewe: '#22c55e', 'alawọ-ewe': '#22c55e', green: '#22c55e',
            bulu: '#38bdf8', blue: '#38bdf8',
            ofeefe: '#facc15', yellow: '#facc15',
            osan: '#fb923c', orange: '#fb923c',
            funfun: '#ffffff', white: '#ffffff'
          };
          const hex = colorMap[String(color || '').toLowerCase()] || color;
          ctx.strokeStyle = hex;
          ctx.fillStyle = hex;
        };

        const customDrawStar = (cx, cy, spikes = 5, outerRadius = 40, innerRadius = 18) => {
          hasCanvasDraw = true;
          if (!ctx) return;
          let rot = (Math.PI / 2) * 3;
          let x = cx;
          let y = cy;
          const step = Math.PI / spikes;
          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        };

        const customDrawText = (text, x = 20, y = 30) => {
          hasCanvasDraw = true;
          if (!ctx) return;
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(text, x, y);
        };

        const result = await executeTransformedIdeCode(document.getElementById('ide-preview-frame'), js);
        logs.push(...(result.logs || []));
        hasCanvasDraw = Boolean(result.canvasDrawn);
        if (result.error) logs.push('❌ ' + result.error);

      } else if (lang === 'igbo') {
        let js = code;
        js = js.replace(/#.*$/gm, (m) => '// ' + m.slice(1));
        const strings = [];
        js = js.replace(/(["'])(?:\\.|(?!\1)[^\r\n\\\'])*\1/g, (m) => { strings.push(m); return '___STR_' + (strings.length - 1) + '___'; });
        const ID_PAT = '[a-zA-Z0-9_$À-ž\\u1E00-\\u1EFF\\u0300-\\u036F]+';

        js = js.replace(/(^|[\s;({])(dee|kwaa|print|console\.log)\s*\(/g, '$1__print(');
        js = new RegExp('(^|[\\s;({])ka\\s+(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $2 =');
        js = new RegExp('(^|[\\n;])\\s*(?!let\\b|const\\b|var\\b|if\\b|for\\b|while\\b|function\\b|return\\b)(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $2 =');
        js = js.replace(/(^|[\s;({])(ọ bụrụ na|oburu na)\s+/g, '$1if (');
        js = js.replace(/if\s*\(([^\{]+)\{/g, (match, cond) => {
          let clean = cond.trim();
          if (!clean.endsWith(')')) clean += ')';
          return 'if (' + clean + ' {';
        });
        js = js.replace(/(^|[\s;({])(ọzọ|ozo)\s*\{/g, '$1else {');
        js = new RegExp('(^|[\\s;({])maka\\s+(' + ID_PAT + ')\\s*=\\s*([0-9]+)\\s*(ruo|de)\\s*([0-9]+)\\s*\\{', 'g')[Symbol.replace](js, '$1for (let $2 = $3; $2 <= $5; $2++) {');
        js = js.replace(/(^|[\s;({])eziokwu([\s;)\]},]|$)/g, '$1true$2');
        js = js.replace(/(^|[\s;({])(ụgha|ugha)([\s;)\]},]|$)/g, '$1false$2');
        js = js.replace(/___STR_(\d+)___/g, (m, idx) => strings[Number(idx)]);

        const printBuffer = [];
        const customPrint = (...args) => printBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        const result = await executeTransformedIdeCode(document.getElementById('ide-preview-frame'), js);
        logs.push(...(result.logs || []));
        hasCanvasDraw = Boolean(result.canvasDrawn);
        if (result.error) logs.push('❌ ' + result.error);

      } else if (lang === 'hausa') {
        let js = code;
        js = js.replace(/#.*$/gm, (m) => '// ' + m.slice(1));
        const strings = [];
        js = js.replace(/(["'])(?:\\.|(?!\1)[^\r\n\\\'])*\1/g, (m) => { strings.push(m); return '___STR_' + (strings.length - 1) + '___'; });
        const ID_PAT = '[a-zA-Z0-9_$À-ž\\u1E00-\\u1EFF\\u0300-\\u036F]+';

        js = js.replace(/(^|[\s;({])(buga|rubuta|print|console\.log)\s*\(/g, '$1__print(');
        js = new RegExp('(^|[\\s;({])sanya\\s+(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $2 =');
        js = new RegExp('(^|[\\n;])\\s*(?!let\\b|const\\b|var\\b|if\\b|for\\b|while\\b|function\\b|return\\b)(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $2 =');
        js = js.replace(/(^|[\s;({])idan\s+/g, '$1if (');
        js = js.replace(/if\s*\(([^\{]+)\{/g, (match, cond) => {
          let clean = cond.trim();
          if (!clean.endsWith(')')) clean += ')';
          return 'if (' + clean + ' {';
        });
        js = js.replace(/(^|[\s;({])(in ba haka ba)\s*\{/g, '$1else {');
        js = new RegExp('(^|[\\s;({])don\\s+(' + ID_PAT + ')\\s*=\\s*([0-9]+)\\s*(zuwa)\\s*([0-9]+)\\s*\\{', 'g')[Symbol.replace](js, '$1for (let $2 = $3; $2 <= $5; $2++) {');
        js = js.replace(/(^|[\s;({])gaskiya([\s;)\]},]|$)/g, '$1true$2');
        js = js.replace(/(^|[\s;({])karya([\s;)\]},]|$)/g, '$1false$2');
        js = js.replace(/___STR_(\d+)___/g, (m, idx) => strings[Number(idx)]);

        const printBuffer = [];
        const customPrint = (...args) => printBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        const result = await executeTransformedIdeCode(document.getElementById('ide-preview-frame'), js);
        logs.push(...(result.logs || []));
        hasCanvasDraw = Boolean(result.canvasDrawn);
        if (result.error) logs.push('❌ ' + result.error);

      } else if (lang === 'swahili') {
        let js = code;
        js = js.replace(/#.*$/gm, (m) => '// ' + m.slice(1));
        const strings = [];
        js = js.replace(/(["'])(?:\\.|(?!\1)[^\r\n\\\'])*\1/g, (m) => { strings.push(m); return '___STR_' + (strings.length - 1) + '___'; });
        const ID_PAT = '[a-zA-Z0-9_$À-ž\\u1E00-\\u1EFF\\u0300-\\u036F]+';

        js = js.replace(/(^|[\s;({])(andika|chapisha|print|console\.log)\s*\(/g, '$1__print(');
        js = new RegExp('(^|[\\s;({])weka\\s+(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $2 =');
        js = new RegExp('(^|[\\n;])\\s*(?!let\\b|const\\b|var\\b|if\\b|for\\b|while\\b|function\\b|return\\b)(' + ID_PAT + ')\\s*=', 'g')[Symbol.replace](js, '$1let $2 =');
        js = js.replace(/(^|[\s;({])kama\s+/g, '$1if (');
        js = js.replace(/if\s*\(([^\{]+)\{/g, (match, cond) => {
          let clean = cond.trim();
          if (!clean.endsWith(')')) clean += ')';
          return 'if (' + clean + ' {';
        });
        js = js.replace(/(^|[\s;({])vinginevyo\s*\{/g, '$1else {');
        js = new RegExp('(^|[\\s;({])kwa\\s+(' + ID_PAT + ')\\s*=\\s*([0-9]+)\\s*(hadi)\\s*([0-9]+)\\s*\\{', 'g')[Symbol.replace](js, '$1for (let $2 = $3; $2 <= $5; $2++) {');
        js = js.replace(/(^|[\s;({])kweli([\s;)\]},]|$)/g, '$1true$2');
        js = js.replace(/(^|[\s;({])si kweli([\s;)\]},]|$)/g, '$1false$2');
        js = js.replace(/___STR_(\d+)___/g, (m, idx) => strings[Number(idx)]);

        const printBuffer = [];
        const customPrint = (...args) => printBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        const result = await executeTransformedIdeCode(document.getElementById('ide-preview-frame'), js);
        logs.push(...(result.logs || []));
        hasCanvasDraw = Boolean(result.canvasDrawn);
        if (result.error) logs.push('❌ ' + result.error);

      } else {
        // Python / JS Engine for Kids
        let js = code;
        js = js.replace(/f(["'])((?:(?!\1)[^\\]|\\.)*)\1/g, (match, quote, str) => {
          const interpolated = str.replace(/\{([^{}]+)\}/g, '${$1}');
          return '`' + interpolated.replace(/`/g, '\\`') + '`';
        });
        js = js.replace(/#.*$/gm, (m) => '// ' + m.slice(1));

        const lines = js.split('\n');
        const transformedLines = [
          'function range(start, stop, step) {',
          '  if (stop === undefined) { stop = start; start = 0; }',
          '  step = step || 1;',
          '  const res = [];',
          '  if (step > 0) { for (let i = start; i < stop; i += step) res.push(i); }',
          '  else { for (let i = start; i > stop; i += step) res.push(i); }',
          '  return res;',
          '}'
        ];

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          line = line.replace(/(^|[\s;])print\s*\(/g, '$1__print(');
          line = line.replace(/(^|[\s;])console\.log\s*\(/g, '$1__print(');

          // Support Python def function
          const defMatch = line.match(/^(\s*)def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\):(\s*)$/);
          if (defMatch) {
            const indent = defMatch[1];
            const fnName = defMatch[2];
            const params = defMatch[3];
            line = indent + 'function ' + fnName + '(' + params + ') {';
            let j = i + 1;
            const bodyIndentLen = indent.length + 2;
            while (j < lines.length && (lines[j].trim() === '' || lines[j].search(/\S/) >= bodyIndentLen)) {
              j++;
            }
            lines.splice(j, 0, indent + '}');
          }

          // Support Python for in
          const forMatch = line.match(/^(\s*)for\s+([a-zA-Z_]\w*)\s+in\s+([^:]+):(\s*)$/);
          if (forMatch) {
            const indent = forMatch[1];
            const varName = forMatch[2];
            const iterable = forMatch[3].trim();
            line = indent + 'for (let ' + varName + ' of ' + iterable + ') {';
            let j = i + 1;
            const bodyIndentLen = indent.length + 2;
            while (j < lines.length && (lines[j].trim() === '' || lines[j].search(/\S/) >= bodyIndentLen)) {
              j++;
            }
            lines.splice(j, 0, indent + '}');
          }

          // Support Python if / elif / else
          const elifMatch = line.match(/^(\s*)elif\s+([^:]+):(\s*)$/);
          if (elifMatch) {
            const indent = elifMatch[1];
            const cond = elifMatch[2].trim();
            line = indent + '} else if (' + cond + ') {';
          } else {
            const ifMatch = line.match(/^(\s*)if\s+([^:]+):(\s*)$/);
            if (ifMatch) {
              const indent = ifMatch[1];
              const cond = ifMatch[2].trim();
              line = indent + 'if (' + cond + ') {';
              let j = i + 1;
              const bodyIndentLen = indent.length + 2;
              while (j < lines.length && (lines[j].trim() === '' || lines[j].search(/\S/) >= bodyIndentLen)) {
                j++;
              }
              lines.splice(j, 0, indent + '}');
            }
            const elseMatch = line.match(/^(\s*)else:(\s*)$/);
            if (elseMatch) {
              const indent = elseMatch[1];
              line = indent + '} else {';
            }
          }

          const assignMatch = line.match(/^(\s*)([a-zA-Z_]\w*)\s*=\s*(.+)$/);
          if (assignMatch && !assignMatch[1].includes('let') && !assignMatch[1].includes('const')) {
            line = assignMatch[1] + 'let ' + assignMatch[2] + ' = ' + assignMatch[3];
          }

          transformedLines.push(line);
        }
        js = transformedLines.join('\n');

        const printBuffer = [];
        const customPrint = (...args) => printBuffer.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        const result = await executeTransformedIdeCode(document.getElementById('ide-preview-frame'), js);
        logs.push(...(result.logs || []));
        hasCanvasDraw = Boolean(result.canvasDrawn);
        if (result.error) logs.push('❌ ' + result.error);
      }
    } catch (err) {
      logs.push('❌ Aṣiṣe Koodu (Syntax Error): ' + err.message);
    }

    const duration = (performance.now() - startTime).toFixed(2);
    const hasError = logs.some(l => l.startsWith('❌'));
    let formattedOutput = '';
    if (hasError) {
      formattedOutput = '> [Idilewa Engine v2.4 Online - ' + lang.toUpperCase() + ']\n' +
        logs.map(l => l.startsWith('❌') ? l : '> ' + l).join('\n') +
        '\n✗ Àkíyèsí: Atunṣe nilo (Check code syntax to earn Maker XP)';
    } else if (logs.length > 0) {
      formattedOutput = '> [Idilewa Engine v2.4 Online]\n' +
        logs.map(l => '> ' + l).join('\n') +
        '\n✓ Àṣeyọrí: Execution completed in ' + duration + 'ms (+10 Maker XP)';
    } else if (hasCanvasDraw) {
      formattedOutput = '> [Idilewa Engine v2.4 Online]\n> [Canvas Graphic Rendered]\n✓ Àṣeyọrí: Execution completed in ' + duration + 'ms (+10 Maker XP)';
    } else {
      formattedOutput = '> [Idilewa Engine v2.4 Online]\n> ✓ Koodu ti ṣiṣẹ́ laisi aṣiṣe (Executed successfully).\n✓ Àṣeyọrí: Execution completed in ' + duration + 'ms (+10 Maker XP)';
    }

    return {
      output: formattedOutput,
      logs: logs.join('\n'),
      duration,
      hasCanvasDraw,
      hasError
    };
  }

  function getPreviewPolicy() {
    return '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; img-src data: blob:; connect-src \'none\'; form-action \'none\'; object-src \'none\'; base-uri \'none\'; worker-src \'none\'">';
  }

  function createPreviewDocument(language, code) {
    const policy = getPreviewPolicy();
    if (language === 'html') {
      return `<!doctype html>${policy}${code}`;
    }
    if (language === 'css') {
      return `<!doctype html><html><head>${policy}<style>
        body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
        ${code}
      </style></head><body><main><h1>CSS preview</h1><p>Your styles are applied to this sample page.</p><button>Try a button</button></main></body></html>`;
    }

    const bootstrap = `<script>
      const send = (data) => parent.postMessage({ type: 'idilewa-ide-result', ...data }, '*');
      window.__ideCanvasDrawn = false;
      const stringify = (value) => {
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value); } catch { return String(value); }
      };
      addEventListener('message', (event) => {
        if (event.source !== parent || event.data?.type !== 'idilewa-ide-run') return;
        const logs = [];
        const log = (...values) => logs.push(values.map(stringify).join(' '));
        console.log = log;
        console.info = log;
        console.warn = (...values) => logs.push('Warning: ' + values.map(stringify).join(' '));
        console.error = (...values) => logs.push('Error: ' + values.map(stringify).join(' '));
        let error = '';
        try { (0, eval)(event.data.code); } catch (caught) { error = String(caught?.message || caught); }
        send({ logs, error, canvasDrawn: Boolean(window.__ideCanvasDrawn), done: true });
      });
    </script>`;
    return `<!doctype html><html><head>${policy}${bootstrap}<style>
      body { margin: 0; padding: 16px; color: #18231d; font: 14px system-ui, sans-serif; }
      #ide-output-canvas { display: none; width: 100%; max-width: 400px; background: #07130b; }
    </style></head><body><p>Run code to see its output.</p><canvas id="ide-output-canvas" width="400" height="260"></canvas></body></html>`;
  }

  function runJavaScriptInPreview(frame, code) {
    return new Promise((resolve, reject) => {
      const handleMessage = (event) => {
        if (event.source !== frame.contentWindow || event.data?.type !== 'idilewa-ide-result') return;
        window.removeEventListener('message', handleMessage);
        window.clearTimeout(timeout);
        resolve(event.data);
      };
      const timeout = window.setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        frame.srcdoc = `<!doctype html><html><head>${getPreviewPolicy()}</head><body><p>Execution stopped after 5 seconds.</p></body></html>`;
        reject(new Error('JavaScript execution timed out after 5 seconds.'));
      }, 5_000);
      window.addEventListener('message', handleMessage);
      frame.onload = () => frame.contentWindow?.postMessage({ type: 'idilewa-ide-run', code }, '*');
      frame.srcdoc = createPreviewDocument('javascript', code);
    });
  }

  async function executeTransformedIdeCode(frame, code) {
    const helpers = `
      const __print = (...values) => console.log(...values);
      const __initCanvas = () => {
        const canvas = document.getElementById('ide-output-canvas');
        const ctx = canvas.getContext('2d');
        canvas.style.display = 'block';
        canvas.hidden = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#07130b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 3;
        window.__ideCanvasDrawn = true;
      };
      const __setColor = (color) => {
        const canvas = document.getElementById('ide-output-canvas');
        const ctx = canvas.getContext('2d');
        canvas.style.display = 'block';
        const colors = {
          pupa: '#ef4444', red: '#ef4444', alawọ_ewe: '#22c55e',
          'alawọ-ewe': '#22c55e', green: '#22c55e', bulu: '#38bdf8',
          blue: '#38bdf8', ofeefe: '#facc15', yellow: '#facc15',
          osan: '#fb923c', orange: '#fb923c', funfun: '#ffffff', white: '#ffffff'
        };
        ctx.strokeStyle = colors[String(color || '').toLowerCase()] || color;
        ctx.fillStyle = ctx.strokeStyle;
        window.__ideCanvasDrawn = true;
      };
      const __drawStar = (cx, cy, spikes = 5, outerRadius = 40, innerRadius = 18) => {
        const canvas = document.getElementById('ide-output-canvas');
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        let rotation = Math.PI / 2 * 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          ctx.lineTo(cx + Math.cos(rotation) * outerRadius, cy + Math.sin(rotation) * outerRadius);
          rotation += Math.PI / spikes;
          ctx.lineTo(cx + Math.cos(rotation) * innerRadius, cy + Math.sin(rotation) * innerRadius);
          rotation += Math.PI / spikes;
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        window.__ideCanvasDrawn = true;
      };
      const __drawText = (text, x = 20, y = 30) => {
        const canvas = document.getElementById('ide-output-canvas');
        canvas.style.display = 'block';
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(text, x, y);
        window.__ideCanvasDrawn = true;
      };
    `;
    return runJavaScriptInPreview(frame, `${helpers}\n${code}`);
  }

  function showIdeOutput(tab, output) {
    state.coding.ideTab = tab;
    state.coding.ideOutput = output;
    const terminalView = document.getElementById('ide-terminal-view');
    const canvasView = document.getElementById('ide-canvas-view');
    const previewView = document.getElementById('ide-preview-view');
    const terminalTab = document.querySelector('[data-action="ide-switch-tab"][data-tab="terminal"]');
    const canvasTab = document.querySelector('[data-action="ide-switch-tab"][data-tab="canvas"]');
    const previewTab = document.querySelector('[data-action="ide-switch-tab"][data-tab="preview"]');
    terminalView?.classList.toggle('hide', tab !== 'terminal');
    canvasView?.classList.toggle('hide', tab !== 'canvas');
    previewView?.classList.toggle('hide', tab !== 'preview');
    terminalTab?.classList.toggle('active', tab === 'terminal');
    canvasTab?.classList.toggle('active', tab === 'canvas');
    previewTab?.classList.toggle('active', tab === 'preview');
    const terminal = document.getElementById('ide-terminal-logs');
    if (terminal) terminal.textContent = output;
    const translated = document.getElementById('ide-output-translation');
    if (translated) translated.textContent = '';
  }
  function renderVoiceCloneTools() {
    return `<section id="voice-clone-tools" class="voice-translation-panel" aria-labelledby="voice-tools-title">
      <div><span class="section-kicker">Idilewa Voice Lessons</span><h2 id="voice-tools-title">Choose a voice or create one with permission</h2><p>Generated lesson speech uses the selected voice when Idilewa supports it for your chosen language.</p></div>
      <label class="voice-translation-input-label" for="plotweaver-voice-select">Speech voice</label>
      <select id="plotweaver-voice-select" aria-describedby="plotweaver-voice-status"><option value="">Loading Idilewa voices…</option></select>
      <small id="plotweaver-voice-status" aria-live="polite">Loading built-in voices and clones saved on this device…</small>
      <form class="voice-clone-form" data-form="plotweaver-voice-clone">
        <strong>Create a voice clone</strong>
        <label for="plotweaver-clone-name">Voice name</label>
        <input id="plotweaver-clone-name" name="name" maxlength="80" required />
        <label for="plotweaver-clone-language">Language spoken in recording</label>
        <select id="plotweaver-clone-language" name="language" required><option value="yo">Yorùbá</option><option value="ig">Igbo</option><option value="ha">Hausa</option></select>
        <label for="plotweaver-clone-file">Clean 4–8 second sample (maximum 4 MB)</label>
        <input id="plotweaver-clone-file" name="file" type="file" accept=".wav,.mp3,.flac,.ogg,.m4a,audio/wav,audio/mpeg,audio/flac,audio/ogg,audio/mp4" required />
        <label for="plotweaver-clone-transcript">Exact transcript (required for most non-Nigerian languages)</label>
        <textarea id="plotweaver-clone-transcript" name="reference_text" rows="2" maxlength="500"></textarea>
        <label class="voice-clone-consent"><input name="consent" type="checkbox" value="yes" required /><span>I own this recording or have the speaker’s informed permission to create and use a voice clone.</span></label>
        <small>Voice cloning sends the recording to Idilewa’s external voice service and may incur usage charges. Do not upload a child’s or another person’s voice without their guardian’s/speaker’s explicit permission.</small>
        <small data-clone-language-status aria-live="polite"></small>
        <button class="button button-outline" type="submit">Create voice clone</button>
      </form>
    </section>`;
  }

  function initializePlotweaverVoiceTools() {
    const selector = document.getElementById('plotweaver-voice-select');
    const status = document.getElementById('plotweaver-voice-status');
    const languageSelector = document.getElementById('plotweaver-clone-language');
    if (selector && !selector.dataset.voiceLookupStarted) {
      selector.dataset.voiceLookupStarted = 'true';
      getPlotweaverVoices({ type: 'builtin' }).then((builtInVoices) => {
        const voices = [...builtInVoices, ...state.trainer.clonedVoices];
        const options = [new Option('Use Idilewa’s recommended voice', '')];
        for (const voice of voices) {
          options.push(new Option(
            `${voice.name}${voice.type === 'cloned' ? ' · cloned' : ''}`,
            voice.voice_id,
          ));
        }
        selector.replaceChildren(...options);
        selector.value = voices.some((voice) => voice.voice_id === state.trainer.voiceId)
          ? state.trainer.voiceId
          : '';
        if (status) {
          status.textContent = voices.length
            ? 'Built-in voices and clones saved on this device are ready.'
            : 'No built-in voices are currently available for this API key.';
        }
      }).catch((error) => {
        selector.replaceChildren(new Option('Recommended voice unavailable', ''));
        if (status) status.textContent = error instanceof Error ? error.message : 'Idilewa voices could not be loaded.';
      });
    }
    const speechLanguageSelector = document.getElementById('plotweaver-speech-language');
    if (speechLanguageSelector && !speechLanguageSelector.dataset.languageLookupStarted) {
      speechLanguageSelector.dataset.languageLookupStarted = 'true';
      getPlotweaverLanguages('tts').then((languages) => {
        const previousLanguage = speechLanguageSelector.value;
        speechLanguageSelector.replaceChildren(...languages.map(({ code, name }) => new Option(name, code)));
        speechLanguageSelector.value = languages.some(({ code }) => code === previousLanguage)
          ? previousLanguage
          : languages.some(({ code }) => code === 'yo') ? 'yo' : languages[0]?.code || '';
      }).catch((error) => {
        const speechStatus = document.getElementById('plotweaver-speech-status');
        if (speechStatus) speechStatus.textContent = error instanceof Error ? error.message : 'Idilewa speech languages could not be loaded.';
      });
    }
    if (languageSelector && !languageSelector.dataset.languageLookupStarted) {
      languageSelector.dataset.languageLookupStarted = 'true';
      getPlotweaverLanguages('tts_clone').then((languages) => {
        const previousLanguage = languageSelector.value;
        languageSelector.replaceChildren(...languages.map(({ code, name }) => new Option(name, code)));
        languageSelector.value = languages.some(({ code }) => code === previousLanguage)
          ? previousLanguage
          : languages.some(({ code }) => code === 'yo') ? 'yo' : languages[0]?.code || '';
      }).catch((error) => {
        const form = languageSelector.closest('form');
        const message = form?.querySelector('[data-clone-language-status]');
        if (message) message.textContent = error.message;
      });
    }
  }

  function initializeTranslationLanguages(selectorId, statusId = '') {
    const selector = document.getElementById(selectorId);
    const status = statusId ? document.getElementById(statusId) : null;
    if (!selector || selector.dataset.languageLookupStarted) return;
    selector.dataset.languageLookupStarted = 'true';

    getPlotweaverLanguages('translation')
      .then((languages) => {
        const previousLanguage = selector.value;
        selector.replaceChildren(...languages.map(({ code, name }) => new Option(name, code)));
        selector.value = languages.some(({ code }) => code === previousLanguage)
          ? previousLanguage
          : languages.some(({ code }) => code === 'yo') ? 'yo' : languages[0]?.code || '';
        if (status) status.textContent = 'Idilewa translation is ready. Exact phrasebook matches are used first.';
        if (selectorId === 'voice-translation-language') {
          document.querySelectorAll('[data-action="choose-translation-language"]').forEach((button) => {
            button.disabled = !languages.some(({ code }) => code === button.dataset.language);
          });
        }
      })
      .catch((error) => {
        if (status) {
          status.textContent = `${error.message} Curated phrasebook entries remain available.`;
        }
      });
  }

  async function translateWithProvider(text, target, sourceLanguage = 'en') {
    const result = await translateWithPlotweaver({
      text,
      sourceLanguage,
      targetLanguage: target,
    });
    return {
      ...result,
      translated: result.translated_text,
      machineTranslated: true,
      provider: 'Idilewa',
    };
  }

  async function translateVoiceText() {
    const source = document.getElementById('voice-translation-input')?.value || '';
    const target = document.getElementById('voice-translation-language')?.value || 'yo';
    const sourceLanguage = document.getElementById('voice-translation-source-language')?.value || 'en';
    const output = document.getElementById('voice-translation-result');
    const transliteration = document.getElementById('voice-translation-transliteration');
    const providerStatus = document.getElementById('voice-translation-provider-status');
    const button = document.querySelector('[data-action="translate-voice-text"]');
    if (!output) return;
    if (!source.trim()) {
      output.textContent = 'Add a phrase before translating.';
      return;
    }

    button && (button.disabled = true);
    output.textContent = 'Translating…';
    if (transliteration) transliteration.textContent = '';
    delete output.dataset.translation;
    try {
      const phrasebookResult = translateText(source, target);
      const result = phrasebookResult.exact && sourceLanguage === 'en'
        ? { ...phrasebookResult, machineTranslated: false }
        : await translateWithProvider(source, target, sourceLanguage);
      output.textContent = result.translated;
      output.dataset.translation = result.translated;
      output.dataset.language = target;
      output.dataset.source = source.trim();
      const translationTitle = document.getElementById('translation-result-title');
      if (translationTitle) translationTitle.textContent = `${translationLanguageName(target)} Translation`;
      document.querySelectorAll('[data-action="choose-translation-language"]').forEach((languageButton) => {
        languageButton.setAttribute('aria-pressed', String(languageButton.dataset.language === target));
      });
      if (transliteration && result.transliteration) {
        transliteration.textContent = `Plain-letter spelling: ${result.transliteration}`;
      }
      if (providerStatus) {
        providerStatus.textContent = result.machineTranslated
          ? 'Machine translation by Idilewa. No plain-letter transliteration is provided for machine results.'
          : 'Curated phrasebook translation.';
      }
    } catch (error) {
      output.textContent = error instanceof Error ? error.message : 'The phrase could not be translated.';
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
  }

  async function translateIdeOutput() {
    const source = document.getElementById('ide-terminal-logs')?.textContent || '';
    const target = document.getElementById('ide-output-language')?.value || 'yo';
    const output = document.getElementById('ide-output-translation');
    if (!output) return;
    if (!source.trim()) {
      output.textContent = 'Add console output before translating.';
      return;
    }
    output.textContent = 'Translating…';
    delete output.dataset.translation;
    try {
      const phrasebookResult = translateText(source, target);
      const result = phrasebookResult.exact
        ? phrasebookResult
        : await translateWithProvider(source, target);
      output.textContent = result.translated;
      output.dataset.translation = result.translated;
      output.dataset.language = target;
    } catch (error) {
      output.textContent = error instanceof Error ? error.message : 'The text could not be translated.';
    }
  }

  async function runRemoteIdeCode(code, language) {
    const button = document.querySelector('[data-action="ide-run-code"]');
    const terminal = document.getElementById('ide-terminal-logs');
    const status = document.querySelector('.status-indicator');
    if (button) button.disabled = true;
    if (status) status.textContent = '● Private runner working';
    showIdeOutput('terminal', '> Sending code to the private compiler…');

    try {
      const response = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ language, code }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'The private compiler is not available on this host.');
      }

      const output = [
        `> ${language.toUpperCase()} · ${result.status}`,
        result.stdout,
        result.stderr,
      ].filter(Boolean).join('\n') || '> Program completed without output.';
      showIdeOutput('terminal', output);
      state.coding.ideRuntime = result.time || '—';
      if (result.accepted) state.coding.ideXp = (state.coding.ideXp || 0) + 10;
      const runtime = document.getElementById('ide-status-runtime');
      const xp = document.getElementById('ide-status-xp');
      if (runtime) runtime.textContent = `Execution Time: ${state.coding.ideRuntime}`;
      if (xp) xp.textContent = `+${state.coding.ideXp || 0} Maker XP`;
      if (status) status.textContent = result.accepted ? '● Execution complete' : '● Execution finished with errors';
      saveState();
      showToast(result.accepted ? 'Program ran successfully.' : `Program finished: ${result.status}.`, result.accepted ? 'success' : 'error');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The private compiler could not run this code.';
      showIdeOutput('terminal', `> Runner error\n${message}`);
      if (status) status.textContent = '● Runner unavailable';
      showToast(message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function runBrowserIdeCode(code, language) {
    const frame = document.getElementById('ide-preview-frame');
    const button = document.querySelector('[data-action="ide-run-code"]');
    const status = document.querySelector('.status-indicator');
    if (!frame) {
      showToast('The preview area is unavailable. Reload the Code page and try again.', 'error');
      return;
    }
    if (button) button.disabled = true;
    if (status) status.textContent = '● Running in isolated preview';
    try {
      let output = '> Preview updated. Your code is running in an isolated browser frame.';
      if (language === 'javascript') {
        const result = await runJavaScriptInPreview(frame, code);
        output = result.error
          ? `> JavaScript error\n${result.error}${result.logs?.length ? `\n${result.logs.join('\n')}` : ''}`
          : result.logs?.length
            ? result.logs.join('\n')
            : '> JavaScript ran successfully with no console output.';
        if (!result.error) state.coding.ideXp = (state.coding.ideXp || 0) + 10;
      } else {
        frame.srcdoc = createPreviewDocument(language, code);
        state.coding.ideXp = (state.coding.ideXp || 0) + 10;
      }

      state.coding.ideRuntime = 'browser';
      showIdeOutput(language === 'javascript' ? 'terminal' : 'preview', output);
      const runtime = document.getElementById('ide-status-runtime');
      const xp = document.getElementById('ide-status-xp');
      if (runtime) runtime.textContent = 'Execution Time: browser';
      if (xp) xp.textContent = `+${state.coding.ideXp || 0} Maker XP`;
      if (status) status.textContent = output.startsWith('> JavaScript error') ? '● Execution error' : '● Preview ready';
      saveState();
      showToast(output.startsWith('> JavaScript error') ? 'JavaScript returned an error.' : 'Code ran in the isolated preview.', output.startsWith('> JavaScript error') ? 'error' : 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The preview could not run this code.';
      showIdeOutput('terminal', `> Preview error\n${message}`);
      if (status) status.textContent = '● Execution error';
      showToast(message, 'error');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function inspectIdeCode(code, language) {
    const stack = [];
    const issues = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    let quote = '';
    let line = 1;
    let comment = false;
    for (let index = 0; index < code.length; index += 1) {
      const character = code[index];
      if (character === '\n') { line += 1; comment = false; continue; }
      if (comment) continue;
      if (quote) {
        if (character === '\\') { index += 1; continue; }
        if (character === quote) quote = '';
        continue;
      }
      if ((character === '#' && language !== 'javascript') || (character === '/' && code[index + 1] === '/' && language === 'javascript')) {
        comment = true;
        if (character === '/') index += 1;
        continue;
      }
      if (character === '"' || character === "'" || (character === '`' && language === 'javascript')) {
        quote = character;
        continue;
      }
      if ('([{'.includes(character)) stack.push({ character, line });
      else if (pairs[character]) {
        const opening = stack.pop();
        if (!opening || opening.character !== pairs[character]) {
          issues.push(`Unexpected “${character}” on line ${line}.`);
          return { issues, fixedCode: null };
        }
      }
    }

    let fixedCode = code;
    if (quote) {
      issues.push(`The ${quote} string opened near the end of the file is not closed.`);
      fixedCode += quote;
    }
    if (stack.length) {
      const closers = stack.reverse().map(({ character }) => ({ '(': ')', '[': ']', '{': '}' }[character])).join('');
      issues.push(`Missing closing ${closers.split('').join(' ')}.`);
      fixedCode = `${fixedCode}${fixedCode.endsWith('\n') || !fixedCode ? '' : '\n'}${closers}`;
    }

    if (!issues.length && language === 'javascript') {
      try { new Function(code); } catch (error) { issues.push(`JavaScript syntax: ${error.message}`); }
    } else if (!issues.length && language === 'yoruba') {
      try { new Function(transpileYorubaToJS(code)); } catch (error) { issues.push(`Yorùbá code syntax: ${error.message}`); }
    }
    return { issues, fixedCode: fixedCode !== code ? fixedCode : null };
  }

  function addIdeAssistantMessage(role, text) {
    state.coding.ideAssistantMessages = [...(state.coding.ideAssistantMessages || []), { role, text }].slice(-12);
    saveState();
    render();
  }

  function analyzeIdeAssistantCode(request = '') {
    const code = document.getElementById('ide-code-input')?.value ?? state.coding.ideCode ?? '';
    const language = state.coding.ideLang || 'yoruba';
    const analysis = inspectIdeCode(code, language);
    const prompt = request.trim();
    if (prompt) state.coding.ideAssistantMessages.push({ role: 'user', text: prompt });
    const response = analysis.issues.length
      ? `I checked the current ${language} file. ${analysis.issues.join(' ')}${analysis.fixedCode ? ' I can safely add the missing closing characters.' : ' I cannot safely rewrite this error automatically; review the line and run the code to get a runtime message.'}`
      : `I checked the current ${language} file and found no unclosed strings or bracket pairs. ${prompt ? `For “${prompt}”,` : ''} run the code to check runtime behavior; this local assistant does not send code to a hosted AI service.`;
    state.coding.ideAssistantMessages.push({ role: 'assistant', text: response });
    state.coding.ideAssistantMessages = state.coding.ideAssistantMessages.slice(-12);
    saveState();
    render();
  }

  function applyIdeAssistantFix() {
    const code = document.getElementById('ide-code-input')?.value ?? state.coding.ideCode ?? '';
    const analysis = inspectIdeCode(code, state.coding.ideLang || 'yoruba');
    if (!analysis.fixedCode) {
      const text = analysis.issues.length
        ? `No safe automatic fix is available. ${analysis.issues.join(' ')}`
        : 'No safe syntax fix is needed. Run the code to check its behavior.';
      addIdeAssistantMessage('assistant', text);
      return;
    }
    state.coding.ideCode = analysis.fixedCode;
    state.coding.ideAssistantMessages = [...(state.coding.ideAssistantMessages || []), { role: 'assistant', text: `Applied a safe syntax fix: ${analysis.issues.join(' ')}` }].slice(-12);
    saveState();
    render();
  }

  // ==========================================
  // RENDER: CODE IN YOUR LANGUAGE (IDE STANDALONE)
  // ==========================================
  function renderVoiceTranslationTool({ showDictation = true, lesson = null, language = 'yoruba' } = {}) {
    const selectedTranslation = [...state.savedTranslations, ...state.translationLessons]
      .find((item) => item.id === state.activeTranslationId);
    const languageCodes = { yoruba: 'yo', igbo: 'ig', hausa: 'ha', swahili: 'sw' };
    const sourceText = lesson
      ? lesson.translation || ''
      : selectedTranslation?.source || 'Good morning, how are you?';
    const targetLanguage = lesson ? languageCodes[language] || 'yo' : selectedTranslation?.targetLanguage || 'yo';
    const targetName = translationLanguageName(targetLanguage);
    const translatedText = lesson ? '' : selectedTranslation?.translated || 'Ẹ káàárọ̀, báwo ni?';
    return `<div class="translation-studio">
      <div class="translation-studio-compose">
        <section class="translation-compose-panel" aria-labelledby="translation-write-title">
          <h2 id="translation-write-title"><span>1</span> Write or paste your text</h2>
          <label class="sr-only" for="voice-translation-source-language">Source language</label>
          <select id="voice-translation-source-language" class="translation-language-select"><option value="en">English</option></select>
          <label class="sr-only" for="voice-translation-input">Text to translate</label>
          <textarea id="voice-translation-input" rows="3" maxlength="500" placeholder="Write or paste your text here…">${esc(sourceText)}</textarea>
          <div class="translation-input-footer"><small><span id="voice-translation-character-count">${sourceText.length}</span>/500</small><button type="button" class="translation-clear-button" data-action="clear-voice-translation">Clear</button><button type="button" class="translation-mic-button" aria-label="Record and practice" data-action="start-voice-transcription">${icon('mic', 18)}</button></div>
          ${showDictation ? '<small id="voice-transcription-status" class="translation-inline-status" aria-live="polite">Microphone access is requested only when you start recording.</small>' : ''}
        </section>
        <span class="translation-swap" aria-hidden="true">${icon('refresh', 18)}</span>
        <section class="translation-target-panel" aria-labelledby="translation-target-title">
          <h2 id="translation-target-title"><span>2</span> Choose translation language</h2>
          <div class="translation-language-options" role="group" aria-label="Translation language">
            <button type="button" data-action="choose-translation-language" data-language="yo" aria-pressed="${targetLanguage === 'yo'}">Yorùbá</button>
            <button type="button" data-action="choose-translation-language" data-language="ig" aria-pressed="${targetLanguage === 'ig'}">Igbo</button>
            <button type="button" data-action="choose-translation-language" data-language="ha" aria-pressed="${targetLanguage === 'ha'}">Hausa</button>
            <button type="button" data-action="choose-translation-language" data-language="sw" aria-pressed="${targetLanguage === 'sw'}">Swahili</button>
          </div>
          <label class="sr-only" for="voice-translation-language">Translation language</label>
          <select id="voice-translation-language" class="sr-only" aria-label="Translation language"><option value="yo">Yorùbá</option><option value="ig">Igbo</option><option value="ha">Hausa</option><option value="sw">Swahili</option></select>
          <button class="translation-submit-button" type="button" data-action="translate-voice-text">${icon('globe', 16)} Translate</button>
        </section>
      </div>
      <section class="translation-result-panel" aria-labelledby="translation-result-title">
        <div class="translation-result-heading"><h2 id="translation-result-title">${esc(targetName)} Translation</h2><button type="button" data-action="copy-voice-translation" aria-label="Copy translation">${icon('copy', 17)}</button></div>
        <p id="voice-translation-result" class="translation-result-text" data-translation="${esc(translatedText)}" data-language="${esc(targetLanguage)}" data-source="${esc(sourceText)}" aria-live="polite">${esc(translatedText)}</p>
        <div class="translation-playback-controls">
          <button class="translation-listen-button" type="button" data-action="speak-voice-translation">${icon('play', 15)} Listen</button>
          <button type="button" data-action="pause-voice-translation">${icon('pause', 14)} Pause</button>
          <button type="button" data-action="replay-voice-translation">${icon('refresh', 14)} Replay</button>
          <button type="button" data-action="translation-speech-speed" data-speed="0.75">${icon('volume', 14)} Slow (0.75x)</button>
          <label class="translation-speed-select">${icon('volume', 15)}<select aria-label="Speech speed"><option value="1">1.0x</option><option value="0.75">0.75x</option></select></label>
        </div>
        <small id="voice-translation-transliteration" class="translation-inline-status" aria-live="polite"></small>
        <small id="voice-translation-provider-status" class="translation-inline-status" aria-live="polite">Loading supported languages…</small>
      </section>
      <header class="translation-studio-hero">
        <div class="translation-studio-hero-copy">
          <span class="translation-studio-mark">${icon('volume', 19)}</span>
          <div><h1>AI Translate &amp; Listen Studio</h1><p>Type, translate, record and build your vocabulary in Yorùbá, Igbo, Hausa and more.</p></div>
        </div>
        <img src="./assets/code-kids.jpg" alt="Two children learning together on a laptop" />
      </header>
    </div>`;
  }

  function translationLanguageName(code) {
    return ({ en: 'English', yo: 'Yorùbá', ig: 'Igbo', ha: 'Hausa', sw: 'Swahili' })[code] || 'Yorùbá';
  }

  function voiceLessonDisplayTitle(lesson, fallback) {
    const title = lesson?.title || lesson?.phrase || fallback;
    return String(title || fallback).replace(/^lesson\s+\d+(?:\s+of\s+\d+)?\s*(?::|[-–—]\s*)?/i, '').trim() || fallback;
  }

  function renderVoiceFeatureLessonNavigation(page, language, lessonIndex, lessons) {
    if (!lessons.length) return '';
    const previousIndex = (lessonIndex - 1 + lessons.length) % lessons.length;
    const nextIndex = (lessonIndex + 1) % lessons.length;
    const route = (index) => `#/${page}?lang=${encodeURIComponent(language)}&lesson=${index + 1}`;
    return `<nav class="voice-feature-lesson-navigation" aria-label="Lesson navigation">
      <a class="button button-outline" href="${route(previousIndex)}">${icon('arrow', 15, 'voice-arrow-back')} Previous lesson</a>
      <a class="button button-primary" href="${route(nextIndex)}">Next lesson ${icon('arrow', 15)}</a>
    </nav>`;
  }

  function renderVoicePracticeLessonNavigation(language, level, gradePath, lessons, activeLesson) {
    const currentIndex = lessons.findIndex((lesson) => lesson.id === activeLesson.id);
    const previousLesson = lessons[(currentIndex - 1 + lessons.length) % lessons.length];
    const nextLesson = lessons[(currentIndex + 1) % lessons.length];
    const lessonRoute = (lesson) => {
      const params = new URLSearchParams({ lang: language, level, lesson: String(lesson.id) });
      if (gradePath) params.set('grade', gradePath.id);
      return `#/voice-practice?${params}`;
    };
    const routeAttributes = (lesson) => `data-route="voice-practice" data-lang="${language}" data-level="${level}" data-lesson="${lesson.id}"${gradePath ? ` data-grade="${gradePath.id}"` : ''}`;
    const previous = `<a class="button button-outline" href="${lessonRoute(previousLesson)}" ${routeAttributes(previousLesson)}>${icon('arrow', 15, 'voice-arrow-back')} Previous</a>`;
    const next = `<a class="button button-primary" href="${lessonRoute(nextLesson)}" ${routeAttributes(nextLesson)}>Next ${icon('arrow', 15)}</a>`;
    const audioParams = new URLSearchParams({ lang: language, level });
    if (gradePath) audioParams.set('grade', gradePath.id);
    return `<nav class="voice-practice-lesson-navigation" aria-label="Lesson navigation">
      <a class="button button-outline" href="#/voice-audio?${audioParams}" data-route="voice-audio" data-lang="${language}" data-level="${level}"${gradePath ? ` data-grade="${gradePath.id}"` : ''}>${icon('arrow', 15, 'voice-arrow-back')} All lessons</a>
      ${previous}
      ${next}
    </nav>`;
  }

  function renderVoiceFeaturePage(page, params = {}) {
    const languageNames = {
      yoruba: 'Yorùbá', igbo: 'Igbo', hausa: 'Hausa', swahili: 'Kiswahili'
    };
    const languages = Object.entries(languageNames);
    const selectedLanguage = languageNames[params.lang]
      ? params.lang
      : languageNames[state.trainer.lang] ? state.trainer.lang : 'yoruba';
    const gradePath = getVoiceGradePath(params.grade);
    const langName = languageNames[selectedLanguage];
    const langData = TRAINER_CURRICULUM[selectedLanguage] || TRAINER_CURRICULUM.yoruba;
    const lessonLevel = ['beginner', 'intermediate', 'advanced'].includes(params.level)
      ? params.level
      : gradePath?.level || state.trainer.level || 'beginner';
    const lessons = langData[lessonLevel] || langData.beginner;
    const gradeLessons = gradePath && gradePath.level === lessonLevel
      ? getVoiceGradeLessonSlice(gradePath.id, lessons)
      : lessons;
    const practiceLessons = gradePath && gradePath.level === lessonLevel ? gradeLessons : lessons;
    const featureLessonPages = ['voice-text-to-speech', 'voice-speech-to-text', 'voice-translation', 'voice-cloning'];
    const featureLessons = featureLessonPages.includes(page)
      ? Object.values(langData).flat()
      : [];
    const requestedFeatureLesson = Number.parseInt(params.lesson || '1', 10);
    const requestedFeatureLessonIndex = Number.isInteger(requestedFeatureLesson) ? requestedFeatureLesson - 1 : 0;
    const featureLessonIndex = featureLessons.length
      ? ((requestedFeatureLessonIndex % featureLessons.length) + featureLessons.length) % featureLessons.length
      : 0;
    const featureLesson = featureLessons[featureLessonIndex] || null;
    const selectedLessonId = Number(params.lesson) || state.trainer.activeLessonId || lessons[0]?.id || 1;
    const activeLesson = practiceLessons.find((lesson) => lesson.id === selectedLessonId) || practiceLessons[0];
    const hasEnglishTranslation = Boolean(activeLesson?.translation);
    const titles = {
      'voice-language': ['Choose your language', 'Choose a language to personalize your listening and speaking practice.', 'Language'],
      'voice-grade': ['Choose your age group', `Select the learning path that fits you for ${langName} lessons.`, 'Age-adaptive paths'],
      'voice-audio': ['Explore audio lessons', `Choose a ${langName} lesson and practise at your own pace.`, 'Audio lessons'],
      'voice-practice': [voiceLessonDisplayTitle(activeLesson, 'Speaking practice'), `Listen, practise the phrase and record your voice in ${langName}.`, 'Practice'],
      'voice-text-to-speech': ['Text to Speech', 'Write a phrase and hear it spoken in your chosen language.', 'Speak'],
      'voice-cloning': ['Voice Cloning', 'Create a voice only when you own the recording or have the speaker’s informed permission.', 'Create'],
      'voice-speech-to-text': ['Speech to Text', 'Record a phrase and turn your speech into text.', 'Transcribe'],
      'voice-translation': ['Translation', 'Translate a phrase between supported languages, then listen to the result.', 'Translate'],
    };
    const [defaultTitle, defaultDescription, kicker] = titles[page] || titles['voice-language'];
    const title = page === 'voice-audio' && gradePath
      ? `${gradePath.name} · ${langName}`
      : defaultTitle;
    const description = page === 'voice-audio' && gradePath
      ? `${gradePath.ages}: ${gradePath.focus} ${gradePath.challenge}`
      : defaultDescription;
    let content = '';

    if (page === 'voice-language') {
      content = `<div class="voice-feature-choice-grid">${languages.map(([id, name]) => `<button type="button" class="voice-feature-choice" data-route="voice-grade" data-lang="${id}" data-level="${lessonLevel}"><span>${icon('globe', 20)}</span><strong>${name}</strong></button>`).join('')}</div>`;
    } else if (page === 'voice-grade') {
      content = `<p class="voice-feature-current">Learning language: <strong>${langName}</strong>. Choose the age group that fits; each path opens its own lessons and learning goals.</p><div class="voice-feature-choice-grid voice-grade-choice-grid">${VOICE_GRADE_PATHS.map((grade) => `<button type="button" class="voice-feature-choice" data-route="voice-audio" data-grade="${grade.id}" data-lang="${selectedLanguage}" data-level="${grade.level}"><span>${icon('layers', 20)}</span><strong>${grade.name}</strong><small>${grade.ages} · ${grade.level} pathway</small><small>${grade.focus}</small></button>`).join('')}</div>`;
    } else if (page === 'voice-audio') {
      const languageFilter = `<label>Language<select data-action="voice-feature-language">${languages.map(([id, name]) => `<option value="${id}" ${selectedLanguage === id ? 'selected' : ''}>${name}</option>`).join('')}</select></label>`;
      const gradeContext = gradePath
        ? `<div class="voice-grade-path-summary"><div><span class="section-kicker">${gradePath.name} · ${gradePath.ages}</span><p>${gradePath.focus}</p><strong>Challenge: ${gradePath.challenge}</strong></div>${routeLink('voice-grade', 'Choose another grade', 'button button-outline', `data-lang="${selectedLanguage}"`)}</div>`
        : '';
      const levelFilter = gradePath ? '' : `<label>Level<select data-action="voice-feature-level">${['beginner', 'intermediate', 'advanced'].map((level) => `<option value="${level}" ${lessonLevel === level ? 'selected' : ''}>${level.charAt(0).toUpperCase() + level.slice(1)}</option>`).join('')}</select></label>`;
      content = `${gradeContext}<div class="voice-feature-filters">${languageFilter}${levelFilter}</div>
        <div class="voice-audio-lesson-grid">${gradeLessons.map((lesson) => `<article class="voice-audio-lesson-card"><span class="section-kicker">${gradePath ? `${esc(gradePath.name)} · ` : ''}${esc(lesson.category || 'Speaking practice')}</span><h2>${esc(voiceLessonDisplayTitle(lesson, 'Speaking practice'))}</h2>${lesson.translation ? `<p>${esc(lesson.translation)}</p>` : ''}<button type="button" class="button button-primary" data-route="voice-practice" data-lang="${selectedLanguage}" data-level="${lessonLevel}" data-grade="${gradePath?.id || ''}" data-lesson="${lesson.id}">${icon('play', 14)} Start practice</button></article>`).join('')}</div>`;
    } else if (page === 'voice-practice' && activeLesson) {
      const isRecording = Boolean(state.trainer.isRecording);
      const transcription = voiceTranscriptionResult?.lessonId === activeLesson.id ? voiceTranscriptionResult.text : '';
      const phraseMeaning = hasEnglishTranslation
        ? `<p class="voice-practice-translation"><span>English translation</span>${esc(activeLesson.translation)}</p>`
        : `<p>${esc(activeLesson.phonetic || '')}</p>`;
      content = `${renderVoicePracticeLessonNavigation(selectedLanguage, lessonLevel, gradePath, practiceLessons, activeLesson)}<article class="voice-practice-card"><div class="voice-practice-meta"><span class="section-kicker">${gradePath ? `${gradePath.name} · ` : ''}${langName} · ${lessonLevel}</span><h2>${esc(activeLesson.phrase)}</h2>${phraseMeaning}</div><div class="voice-practice-syllables">${(activeLesson.syllables || []).map((syllable) => `<button type="button" class="syllable-sound-pill tone-${esc(syllable.tone)}" data-action="trainer-play-syllable" data-freq="${syllable.freq}" data-tone="${esc(syllable.tone)}" data-syllable="${esc(syllable.text)}">${esc(syllable.text)} · ${esc(syllable.pitch)}</button>`).join('')}</div><div class="voice-practice-actions"><button type="button" class="button button-outline" data-action="trainer-play-native" data-lesson-id="${activeLesson.id}">${icon('volume', 15)} Listen</button>${isRecording ? `<button type="button" class="button button-primary" data-action="trainer-stop-record" data-lesson-id="${activeLesson.id}">Stop recording</button>` : `<button type="button" class="button button-primary" data-action="trainer-start-record" data-lesson-id="${activeLesson.id}">${icon('mic', 15)} Record yourself</button>`}</div><canvas id="waveformCanvas" class="voice-practice-waveform" width="640" height="90" aria-label="Recording waveform"></canvas><p class="voice-transcription-status" aria-live="polite">${isRecording ? 'Recording… speak clearly, then stop.' : transcription ? `Your transcription: ${esc(transcription)}` : 'Your recording is sent to Idilewa for transcription. It is not saved as a voice score.'}</p></article>${renderVoicePracticeLessonNavigation(selectedLanguage, lessonLevel, gradePath, practiceLessons, activeLesson)}`;
    } else if (page === 'voice-text-to-speech') {
      const languageCodes = { yoruba: 'yo', igbo: 'ig', hausa: 'ha', swahili: 'sw' };
      content = `<div class="voice-feature-lesson-prompt"><h2>${esc(voiceLessonDisplayTitle(featureLesson, 'Speak and listen'))}</h2>${featureLesson?.translation ? `<p>${esc(featureLesson.translation)}</p>` : ''}<small>Listen to the phrase, repeat it aloud, and notice its rhythm. You can also enter any phrase below.</small></div><div class="voice-feature-tool"><label class="curriculum-tool-label" for="plotweaver-speech-text">Your phrase</label><textarea id="plotweaver-speech-text" rows="4" maxlength="1000" placeholder="Type a phrase to hear…">${esc(featureLesson?.phrase || '')}</textarea><label class="curriculum-tool-label" for="plotweaver-speech-language">Speech language</label><select id="plotweaver-speech-language"><option value="${languageCodes[selectedLanguage] || 'yo'}">${esc(langName)}</option></select><button class="button button-primary" type="button" data-action="plotweaver-speak-text">${icon('volume', 15)} Listen</button><small id="plotweaver-speech-status" class="curriculum-tool-status" aria-live="polite">Use the tool whenever you like. Audio is generated on request and is not saved.</small></div>`;
    } else if (page === 'voice-cloning') {
      const languageCodes = { yoruba: 'yo', igbo: 'ig', hausa: 'ha', swahili: 'sw' };
      content = `<div class="voice-feature-lesson-prompt"><h2>${esc(voiceLessonDisplayTitle(featureLesson, 'Practice with a voice'))}</h2><p>Choose an Idilewa voice or a clone you are permitted to use, then listen and repeat.</p><strong lang="${languageCodes[selectedLanguage] || 'yo'}">${esc(featureLesson?.phrase || '')}</strong>${featureLesson?.translation ? `<small>${esc(featureLesson.translation)}</small>` : ''}</div><div class="voice-feature-tool"><label class="curriculum-tool-label" for="plotweaver-speech-text">Practice phrase</label><textarea id="plotweaver-speech-text" rows="3" maxlength="1000">${esc(featureLesson?.phrase || '')}</textarea><label class="curriculum-tool-label" for="plotweaver-speech-language">Speech language</label><select id="plotweaver-speech-language"><option value="${languageCodes[selectedLanguage] || 'yo'}">${esc(langName)}</option></select><button class="button button-primary" type="button" data-action="plotweaver-speak-text">${icon('volume', 15)} Listen with selected voice</button><small id="plotweaver-speech-status" class="curriculum-tool-status" aria-live="polite">Use the tool whenever you like. Audio is generated on request and is not saved.</small></div>${renderVoiceCloneTools()}`;
    } else if (page === 'voice-speech-to-text') {
      const languageCodes = { yoruba: 'yo', igbo: 'ig', hausa: 'ha', swahili: 'sw' };
      content = `<div class="voice-feature-lesson-prompt"><h2>${esc(voiceLessonDisplayTitle(featureLesson, 'Speak and transcribe'))}</h2><p>Say any phrase clearly, then compare your transcription with the sample.</p><strong lang="${selectedLanguage === 'yoruba' ? 'yo' : selectedLanguage === 'igbo' ? 'ig' : selectedLanguage === 'hausa' ? 'ha' : 'sw'}">${esc(featureLesson?.phrase || '')}</strong>${featureLesson?.translation ? `<small>${esc(featureLesson.translation)}</small>` : ''}</div><div class="voice-feature-tool"><label class="curriculum-tool-label" for="voice-translation-input">Your recording transcription</label><textarea id="voice-translation-input" rows="5" maxlength="1000" placeholder="Your recognized words will appear here"></textarea><label class="curriculum-tool-label" for="voice-translation-source-language">Spoken language</label><select id="voice-translation-source-language"><option value="${languageCodes[selectedLanguage] || 'yo'}">${esc(langName)}</option></select><button class="button button-primary" type="button" data-action="start-voice-transcription">${icon('mic', 15)} Start recording</button><small id="voice-transcription-status" class="curriculum-tool-status" aria-live="polite">Microphone permission is requested only when you begin recording.</small></div>`;
    } else if (page === 'voice-translation') {
      const languageCodes = { yoruba: 'yo', igbo: 'ig', hausa: 'ha', swahili: 'sw' };
      content = `<div class="voice-feature-lesson-prompt"><h2>${esc(voiceLessonDisplayTitle(featureLesson, 'Translate a phrase'))}</h2><p>Explore this phrase, or enter any English phrase below to translate it.</p><strong lang="${languageCodes[selectedLanguage] || 'yo'}">${esc(featureLesson?.phrase || '')}</strong></div>${renderVoiceTranslationTool({ language: selectedLanguage })}`;
    }

    const lessonNavigation = featureLessonPages.includes(page)
      ? renderVoiceFeatureLessonNavigation(page, selectedLanguage, featureLessonIndex, featureLessons)
      : '';
    const pageClass = page === 'voice-translation' ? 'voice-feature-page translation-page' : 'voice-feature-page';
    return `<div class="container route-page ${pageClass}"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('voice_lessons', 'Voice Lessons')}<span>/</span><strong>${esc(title)}</strong></div><section class="voice-feature-header"><div><span class="section-kicker">${esc(kicker)} · Voice Lessons</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${routeLink('voice_lessons', `${icon('arrow', 14, 'voice-arrow-back')} All Voice Lessons`, 'button button-outline')}</section><section class="voice-feature-content">${lessonNavigation}${content}</section></div>`;
  }

  function renderVoiceLessonsHome() {
    return `<div class="academy-reference-page academy-voice-home">${renderVoiceLessonsDashboard()}</div>`;
  }

  function renderVoiceLessonsDashboard() {
    const completedCount = Object.keys(state.trainer.completed || {}).length;
    const tools = [
      { route: 'voice-translation', title: 'Translate & Listen', description: 'Translate a phrase and hear the result.', icon: 'translate' },
      { route: 'voice-text-to-speech', title: 'Text to Speech', description: 'Hear text in a supported language.', icon: 'volume' },
      { route: 'voice-speech-to-text', title: 'Speech to Text', description: 'Record a phrase and review its transcript.', icon: 'mic' },
      { route: 'voice-cloning', title: 'Voice Cloning', description: 'Create a voice only with informed permission.', icon: 'people' }
    ];
    const savedTranslations = state.translationLessons.length
      ? `<section class="academy-saved-translations" aria-labelledby="academy-saved-translations-title"><h2 id="academy-saved-translations-title">Saved translations</h2><div>${state.translationLessons.map((item) => `<article><div><strong>${esc(item.translated)}</strong><small>${esc(item.source)} · ${esc(item.languageName)}</small></div><button type="button" data-action="open-saved-translation" data-id="${esc(item.id)}">Practice</button></article>`).join('')}</div></section>`
      : '';
    return `<section class="academy-pathway-page" aria-labelledby="academy-pathway-title">
      <div class="academy-pathway-hero">
        <div><h1 id="academy-pathway-title">Language Academy</h1><p>Choose your language, proficiency and age group.</p><a class="button button-primary academy-pathway-start" href="#voice-language-choices">Start Learning ${icon('arrow', 15)}</a></div>
        <img src="${landingJourneyLearnersUrl}" alt="Two smiling young African learners" width="556" height="349" fetchpriority="high" />
      </div>
      <section class="academy-pathway-section" id="voice-language-choices" aria-labelledby="academy-pathway-languages-title">
        <h2 id="academy-pathway-languages-title">Choose your language</h2>
        <p>Start with the language you want to hear and speak.</p>
        ${renderAcademyLanguageChoices()}
      </section>
      <section class="academy-progress-summary" aria-label="Voice lesson progress">
        <div><strong>My progress</strong><span>${completedCount} ${completedCount === 1 ? 'lesson' : 'lessons'} completed</span><small>Saved on this device</small></div>
        ${routeLink('voice-progress', `View progress ${icon('arrow', 15)}`, 'text-link')}
      </section>
      <section class="academy-tools-section" aria-labelledby="academy-tools-title">
        <h2 id="academy-tools-title">Speak, listen &amp; translate</h2>
        <nav class="academy-tools-grid" aria-label="Voice and translation tools">${tools.map((tool) => routeLink(tool.route, `<span class="academy-tool-icon">${icon(tool.icon, 21)}</span><span><strong>${tool.title}</strong><small>${tool.description}</small></span>${icon('arrow', 15)}`, 'academy-tool-card')).join('')}</nav>
      </section>
      ${savedTranslations}
    </section>`;
  }

  function renderVoiceProgress() {
    const completedCount = Object.keys(state.trainer.completed || {}).length;
    return `<div class="academy-reference-page academy-progress-page"><section class="academy-progress-content" aria-labelledby="academy-progress-title">
      <h1 id="academy-progress-title">My progress</h1>
      <p>${completedCount === 0
        ? 'Your completed Voice Lessons will appear here as you learn.'
        : `You have completed ${completedCount} ${completedCount === 1 ? 'lesson' : 'lessons'}. Keep going at your own pace.`}</p>
      <p class="academy-progress-note">Progress is saved on this device.</p>
      <div class="academy-progress-actions">${routeLink('voice-language', 'Choose a lesson ' + icon('arrow', 15), 'button button-primary')}${routeLink('voice_lessons', 'Back to Language Academy', 'button button-outline')}</div>
    </section></div>`;
  }

  function renderOral() {
    const genres = [
      { title: 'Voice Lessons', titleSub: 'Sounds, speech & tone', copy: 'Foundational pronunciation and interactive audio lessons across African languages.', icon: 'mic', route: 'voice_lessons', tone: 'yellow' },
      { title: 'Oríkì', titleSub: 'Praise poetry', copy: 'Explore poetic praise, identity and remembrance through context and community voices.', icon: 'quote', route: 'oriki', tone: 'peach' },
      { title: 'Òwe', titleSub: 'Proverbs', copy: 'Notice how compact sayings can hold wit, wisdom and ways of seeing the world.', icon: 'sparkles', route: 'owe', tone: 'mint' },
      { title: 'Story & song', titleSub: 'Oral genres', copy: 'Find out how stories, songs and spoken forms carry memory across generations.', icon: 'music', route: 'oral_genre', tone: 'blue' }
    ];
    return `<div class="container route-page oral-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Read & listen</strong></div><section class="oral-hero"><div class="oral-hero-copy"><span class="section-kicker">Voices, memory & meaning</span><h1>Some knowledge is<br /><em>spoken into the room.</em></h1><p>Listen to the forms that carry language through family and community—from praise poetry to proverbs, speech pitch and story.</p><div class="hero-actions">${routeLink('voice_lessons', `${icon('mic', 16)} Voice Lessons`, 'button button-primary')}${routeLink('voices', `Hear the voice library ${icon('arrow', 15)}`, 'button button-outline')}${aiHelperButton('oral')}</div></div><div class="oral-hero-image"><img src="./assets/story-grandmother.jpg" alt="A grandmother sharing an oral story with children" /><span class="oral-image-note">Listen first. Learn the context.</span></div></section>${renderStepper(['Tradition', 'Genre', 'Piece', 'Reflection'], 0)}<section class="section oral-genres"><div class="section-heading"><div><span class="section-kicker">Choose a doorway</span><h2>Explore oral traditions.</h2><p>Each form has its own voice, purpose and place in community.</p></div></div><div class="oral-genre-grid">${genres.map((g) => `<a class="oral-genre-card tone-${g.tone}" href="#/${g.route}" data-route="${g.route}"><span class="oral-genre-icon">${icon(g.icon, 23)}</span><span class="oral-genre-sub">${g.titleSub}</span><h3>${g.title}</h3><p>${g.copy}</p><span class="oral-genre-arrow">Explore ${icon('arrow', 15)}</span></a>`).join('')}</div></section><section class="oral-quote-band"><span>${icon('quote', 25)}</span><div><strong>Stories are not just content.</strong><p>They are relationships—between speaker, listener, place and memory.</p></div>${routeLink('keepers', 'Meet the keepers ' + icon('arrow', 14), 'text-link')}</section></div>`;
  }

  function renderOralGenre() {
    const cards = [
      { route: 'voice_lessons', title: 'Voice Lessons', subtitle: 'Live pitch & tone engine', icon: 'mic', tone: 'yellow', text: 'Interactive tone soundboards and voice recording across African languages.' },
      { route: 'oriki', title: 'Oríkì', subtitle: 'Praise poetry & identity', icon: 'quote', tone: 'peach', text: 'Learn what praise poetry can express and how to listen for context.' },
      { route: 'owe', title: 'Òwe', subtitle: 'Proverbs & reflection', icon: 'sparkles', tone: 'mint', text: 'Explore short sayings and the ideas people carry through them.' },
      { route: 'voices', title: 'Spoken word', subtitle: 'Voices & pronunciation', icon: 'headphones', tone: 'lilac', text: 'Hear words spoken and build confidence through listening.' }
    ];
    return `<div class="container route-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('oral', 'Read & listen')}<span>/</span><strong>Genres</strong></div><section class="collection-hero simple-collection-hero"><span class="section-kicker">Oral forms · a guided introduction</span><h1>Many ways to tell<br /><em>what matters.</em></h1><p>Oral traditions are varied and living. Explore a form, listen for its context and follow the voice that leads you in.</p>${renderStepper(['Tradition', 'Genre', 'Example', 'Reflect'], 1)}</section><div class="section-heading collection-heading"><div><span class="section-kicker">Choose a genre</span><h2>Where would you like to begin?</h2></div>${aiHelperButton('oral')}</div><div class="oral-genre-grid">${cards.map((c) => `<a href="#/${c.route}" data-route="${c.route}" class="oral-genre-card tone-${c.tone}"><span class="oral-genre-icon">${icon(c.icon, 23)}</span><span class="oral-genre-sub">${c.subtitle}</span><h3>${c.title}</h3><p>${c.text}</p><span class="oral-genre-arrow">Explore ${icon('arrow', 15)}</span></a>`).join('')}</div><div class="content-note">${icon('shield', 17)} These introductions are a starting point. Community context, consent and attribution should guide how oral knowledge is shared.</div></div>`;
  }

  function renderOriki() {
    return `<div class="container route-page culture-detail-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('oral', 'Read & listen')}<span>/</span>${routeLink('oral_genre', 'Oral genres')}<span>/</span><strong>Oríkì</strong></div><section class="culture-detail-hero"><div><span class="section-kicker">Yorùbá oral tradition · guided introduction</span><h1>Oríkì:<br /><em>praise that remembers.</em></h1><p>Oríkì is often described as praise poetry, but each piece carries the voice, knowledge and context of the people who share it.</p><div class="hero-actions"><button class="button button-primary" data-action="play-audio" data-text="Oriki is a living form of praise and remembrance.">${icon('volume', 17)} Hear a short introduction</button>${aiHelperButton('oriki')}</div></div><div class="culture-detail-art"><img src="./assets/yoruba-educator-woman.jpg" alt="Yorùbá woman educator wearing richly woven aso-oke attire" /><div class="culture-art-caption">Hear the voice.<br />Ask about the meaning.</div>\n    </section>${renderStepper(['Tradition', 'Genre', 'Piece', 'Reflection'], 2)}<div class="detail-content-grid"><article class="detail-reading"><span class="section-kicker">A way to listen</span><h2>Notice more than the words.</h2><p>Listen for rhythm, repetition and the relationship between the speaker and the person being addressed. A phrase may carry family history, place, humour or a quality someone is known for.</p><p>There is no single version that speaks for everyone. Meaning changes with voice and context, so learn from the people who know the story behind the words.</p><div class="detail-prompt"><strong>Try this reflection</strong><p>What do you notice about the speaker’s tone? What would you want to ask before repeating the words?</p></div><div class="detail-actions">${routeLink('voices', 'Explore voices ' + icon('arrow', 14), 'text-link')}${routeLink('keepers', 'Learn from keepers ' + icon('arrow', 14), 'text-link')}</div></article><aside class="detail-side-card"><span class="side-card-icon">${icon('heart', 21)}</span><span class="section-kicker">Learn with care</span><h3>Context makes listening more meaningful.</h3><p>Ask who is sharing, what the words mean to them and whether the story is theirs to pass on.</p>${aiHelperButton('oriki')}${routeLink('oral_genre', 'More oral forms ' + icon('arrow', 14), 'text-link')}</aside></div></div>`;
  }

  function aiHelperButton(topic = 'general') {
    return `<button type="button" class="ai-helper-button" data-action="open-ai-helper" data-topic="${esc(topic)}">${icon('sparkles', 16)} <span>AI learning helper</span><small>preview</small></button>`;
  }

  function aiPromptSuggestions(topic) {
    const suggestions = {
      owe: ['What can patience look like in action?', 'How does Dami show patience?'],
      oriki: ['What should I listen for in Oríkì?', 'Why does context matter?'],
      story: ['What did Dami do while she waited?', 'What feeling might Dami have?'],
      oral: ['How can I learn oral traditions respectfully?', 'What questions can I ask a speaker?']
    };
    return suggestions[topic] || ['Help me think of a question to ask my teacher.', 'What is one small thing I can practice today?'];
  }

  function aiReply(topic) {
    const replies = {
      owe: 'A reflection prompt: patience can include caring action while you wait. Dami kept tending the seed. What small, helpful thing could you keep doing? Proverb wording and meaning can vary, so ask a fluent Yorùbá speaker about local nuance.',
      oriki: 'Listen for rhythm, repetition and who is being addressed. Oríkì is living oral knowledge; ask a knowledgeable speaker about the meaning and whether a specific piece is appropriate to repeat.',
      story: 'Dami showed patience by watering the seed and caring for the garden while she waited. What might you feel if you were Dami, and what would you do next?',
      oral: 'Start by listening. Ask who is sharing, what the words mean in that setting, and whether the knowledge is theirs to pass on. Give community context and consent more weight than a quick summary.',
      general: 'Try breaking your question into one small idea. You could write down what you noticed, then ask a teacher, caregiver or language keeper to help you explore it.'
    };
    return replies[topic] || replies.general;
  }

  function answerAiPrompt(topic) {
    const answer = document.getElementById('aiAnswer');
    if (!answer) return;
    answer.innerHTML = `<span class="section-kicker">A lesson prompt · offline preview</span><p>${esc(aiReply(topic))}</p>`;
  }

  function openAiHelper(topic = 'general') {
    const root = document.getElementById('modal-root');
    const suggestions = aiPromptSuggestions(topic);
    const title = topic === 'oriki' ? 'Think alongside Oríkì.' : topic === 'owe' ? 'Think alongside this Owe.' : topic === 'story' ? 'Think alongside the story.' : 'A gentle learning prompt.';
    root.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal-card ai-helper-modal" role="dialog" aria-modal="true" aria-labelledby="aiHelperTitle"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close helper">${icon('close', 19)}</button><div class="modal-icon">${icon('sparkles', 22)}</div><span class="section-kicker">AI learning helper · local preview</span><h2 id="aiHelperTitle">${title}</h2><p class="ai-helper-disclaimer">This prototype has no AI service connected. It offers fixed, offline reflection prompts only; it does not send or save your question. Please do not type names or personal details.</p><div class="ai-suggestions">${suggestions.map((prompt) => `<button type="button" class="ai-suggestion" data-action="ai-suggestion" data-topic="${esc(topic)}" data-prompt="${esc(prompt)}">${esc(prompt)} ${icon('arrow', 14)}</button>`).join('')}</div><form class="ai-helper-form" data-form="ai-helper" data-topic="${esc(topic)}"><label for="aiHelperQuestion">What would you like to think about?</label><textarea id="aiHelperQuestion" name="question" rows="2" maxlength="240" placeholder="Keep your question general…" required></textarea><button type="submit" class="button button-primary">Show a reflection prompt ${icon('arrow', 14)}</button></form><div class="ai-helper-answer" id="aiAnswer" aria-live="polite"><span class="section-kicker">A safe place to start</span><p>Choose a suggested question to see an offline learning prompt.</p></div></section></div>`;
    document.getElementById('aiHelperQuestion')?.focus();
  }

  function renderOwe() {
    const meaningDone = state.quizResults['owe-meaning:comprehension'] === 'correct';
    const storyDone = state.quizResults['owe-story:comprehension'] === 'correct';
    const activeStep = storyDone ? 3 : meaningDone ? 2 : 1;
    const saved = state.savedProverbs.map((item) => `<article class="proverb-card saved-proverb"><span class="proverb-label">Shared on this device</span><blockquote>${esc(item.text)}</blockquote><p>${esc(item.meaning)}</p><small>${esc(item.language)}${item.context ? ` · ${esc(item.context)}` : ''}</small></article>`).join('');
    return `<div class="container route-page owe-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('oral', 'Read & listen')}<span>/</span>${routeLink('oral_genre', 'Oral genres')}<span>/</span><strong>Òwe · Proverbs</strong></div>
      <section class="owe-hero"><div class="owe-hero-copy"><span class="section-kicker">Òwe · Yorùbá proverbs</span><h1>A few words.<br /><em>A world to think about.</em></h1><p>Follow one proverb from its words, to a translation and meaning, into a story and your own reflection. Meaning and use can change with context, speaker and community.</p><div class="hero-actions">${routeLink('owe_detail', `Begin the Owe lesson ${icon('arrow', 15)}`, 'button button-primary')}${aiHelperButton('owe')}</div>${routeLink('owe_add', `Share a proverb ${icon('plus', 15)}`, 'text-link owe-share-link')}</div>
        <div class="owe-feature-photo"><img src="./assets/yoruba-educator-woman.jpg" alt="Yorùbá woman educator in richly woven aso-oke attire" /><div class="owe-feature-shade"></div><div class="owe-feature-content"><span class="section-kicker">A guided proverb · step one</span><blockquote>Sùúrù ni baba ìwà.</blockquote><p>A common classroom rendering: “Patience is the father of good character.”</p><span class="owe-feature-credit">Translations vary; learn with a fluent speaker.</span></div>\n    </section>
      ${renderStepper(['Proverb', 'Translation & meaning', 'Moral story', 'Reflect'], activeStep)}
      <section class="proverb-sequence"><div class="section-heading"><div><span class="section-kicker">A four-part learning journey</span><h2>Read, understand, imagine, reflect.</h2><p>Each step builds on the words without claiming one translation speaks for everyone.</p></div></div><div class="proverb-learning-row">
        ${routeLink('owe_detail', `<span class="sequence-number">02</span><span class="feature-icon tone-mint">${icon('book', 20)}</span><h3>Translation & meaning</h3><p>Read the proverb, meet one translation and unpack the idea.</p><span class="sequence-link">Read this section ${icon('arrow', 14)}</span>`, 'sequence-card sequence-card-active')}
        ${routeLink('owe_story', `<span class="sequence-number">03</span><span class="feature-icon tone-blue">${icon(meaningDone ? 'quote' : 'lock', 20)}</span><h3>A story with a lesson</h3><p>See how patience can look in a child’s everyday choices.</p><span class="sequence-link">${meaningDone ? 'Read the story' : 'Finish meaning first'} ${icon('arrow', 14)}</span>`, `sequence-card ${meaningDone ? '' : 'is-locked'}`)}
        ${routeLink('owe_reflection', `<span class="sequence-number">04</span><span class="feature-icon tone-peach">${icon(storyDone ? 'heart' : 'lock', 20)}</span><h3>Feel, think & act</h3><p>Choose a feeling and write one thought or action of your own.</p><span class="sequence-link">${storyDone ? 'Reflect' : meaningDone ? 'Finish the story first' : 'Start with the meaning'} ${icon('arrow', 14)}</span>`, `sequence-card ${storyDone ? '' : 'is-locked'}`)}
      </div></section>
      ${renderOweDetail()}
      ${renderOweStory()}
      ${renderOweReflection()}
      ${saved ? `<section class="saved-proverbs"><div class="section-heading"><div><span class="section-kicker">Your contribution</span><h2>Saved in this demo</h2></div></div><div class="proverb-grid">${saved}</div></section>` : ''}
      <div class="proverb-bottom-note">${icon('shield', 16)} Proverb translations can vary. A community voice can add the nuance a dictionary cannot.</div></div>`;
  }

  function renderOweDetail() {
    const result = state.quizResults['owe-meaning:comprehension'] || '';
    return `<section class="owe-unified-section" id="owe-meaning"><div class="owe-section-heading"><span class="section-kicker">Step 2 · Translation & meaning</span><h2>Words can hold <em>a whole way of seeing.</em></h2><p>Read one common rendering, then consider how a proverb’s meaning can shift with context.</p></div>
      <section class="owe-lesson-layout"><article class="owe-lesson-main"><div class="owe-verse-panel"><span class="proverb-label">Yorùbá proverb · Òwe</span><blockquote lang="yo">Sùúrù ni baba ìwà.</blockquote><button class="listen-inline" data-action="play-audio" data-text="Sùúrù ni baba ìwà.">${icon('play', 14)} Hear the words <span>Listen</span></button></div>
        <div class="owe-translation-card"><span class="section-kicker">Translation · one common rendering</span><h2>“Patience is the father of good character.”</h2><p>Some speakers render the final word simply as “character.” This short classroom translation is a starting point, not the only possible interpretation.</p></div>
        <div class="owe-meaning-card"><span class="section-kicker">Meaning · in everyday language</span><h2>Good character grows over time.</h2><p>Patience does not have to mean doing nothing. It can mean caring for something steadily, making thoughtful choices and giving growth the time it needs.</p><div class="detail-prompt"><strong>Pause and wonder</strong><p>When have you had to wait for something? What helpful thing could you do while you wait?</p></div></div>
        <section class="owe-story-quiz owe-meaning-check"><span class="section-kicker">Check the meaning</span><h2>What does patience mean in this example?</h2><div class="story-answer-list">${[['Keep caring while you wait.', true], ['Do nothing and stop trying.', false], ['Give up as soon as it feels slow.', false]].map(([label, correct], i) => `<button class="story-answer ${result === 'correct' && correct ? 'answer-correct' : ''}" data-action="owe-meaning-answer" data-key="comprehension" data-correct="${correct}" ${result === 'correct' ? 'disabled' : ''}><span>${String.fromCharCode(65 + i)}</span>${label}${result === 'correct' && correct ? icon('check', 17) : icon('arrow', 15)}</button>`).join('')}</div>${result === 'retry' ? `<div class="answer-feedback feedback-retry">Think about the care that continues while someone waits.</div>` : ''}${result === 'correct' ? `<div class="answer-feedback feedback-correct">Exactly—patience can include thoughtful action while you wait.</div>` : ''}</section>
        <div class="owe-lesson-actions">${result === 'correct' ? routeLink('owe_story', `Continue to the moral story ${icon('arrow', 15)}`, 'button button-primary') : '<button class="button button-primary" disabled>Answer the meaning check to continue</button>'}</div></article>
        <aside class="owe-ai-aside"><div class="detail-side-card"><span class="side-card-icon">${icon('sparkles', 21)}</span><span class="section-kicker">A small learning prompt</span><h3>What does patience look like in action?</h3><p>Think of something you can keep caring for, even when the result takes time.</p>${aiHelperButton('owe')}</div><div class="content-note">${icon('info', 16)} Yorùbá proverb wording and interpretation can vary by speaker and context.</div></aside></section></section>`;
  }

  function renderOweSequenceLayers(activeStep) {
    const stages = [
      { title: 'The original proverb', text: 'Read the Yorùbá words and notice their sound. Keep the original beside the translation rather than treating them as interchangeable.', action: 'Start with the words' },
      { title: 'Translation & meaning', text: 'Compare one common rendering, consider how context can change nuance, then answer a short meaning check.', action: 'Understand the idea' },
      { title: 'A moral story + quiz', text: 'Meet Dami and the okra seed in a new classroom story, then check what she chose to do while she waited.', action: 'Look for the lesson' },
      { title: 'Child reflection & action', text: 'Name a feeling, share a thought and choose one kind or helpful action to try. There is no single right answer.', action: 'Reflect and act' }
    ];
    return `<section class="owe-layer-roadmap" aria-labelledby="owe-layer-roadmap-title" data-sequence-step-count="4"><div class="owe-layer-roadmap-heading"><span class="section-kicker">Four-part Owe lesson sequence · follow in order</span><h2 id="owe-layer-roadmap-title">From proverb to a thoughtful next step.</h2><p>Each layer prepares the next. The child’s reflection stays last, after the meaning and story checks.</p></div><div class="owe-layer-roadmap-grid">${stages.map((stage, index) => `<article class="owe-layer-card ${index < activeStep ? 'is-complete' : index === activeStep ? 'is-current' : 'is-locked'}" ${index === activeStep ? 'aria-current="step"' : ''}><span class="owe-layer-number">0${index + 1}</span><div><small>Stage 0${index + 1} · ${index < activeStep ? 'Complete' : index === activeStep ? 'Next' : 'After this'}</small><h3>${stage.title}</h3><p>${stage.text}</p><strong>${stage.action}</strong></div></article>`).join('')}</div></section>`;
  }

  function renderOweStory() {
    const meaningDone = state.quizResults['owe-meaning:comprehension'] === 'correct';
    const result = state.quizResults['owe-story:comprehension'] || '';
    if (!meaningDone) return `<section class="owe-unified-section owe-story-page" id="owe-story"><section class="owe-sequence-gate"><span class="section-kicker">Step 3 · Moral story · locked</span><h2>Understand the proverb<br /><em>before the story.</em></h2><p>Read the translation and meaning, then answer one quick question. The moral story unlocks after that step.</p>${routeLink('owe_detail', `Return to translation & meaning ${icon('arrow', 15)}`, 'button button-primary')}${aiHelperButton('owe')}</section></section>`;
    return `<section class="owe-unified-section owe-story-page" id="owe-story"><div class="owe-section-heading"><span class="section-kicker">Step 3 · Moral story</span><h2>A story about patience, care and growth.</h2><p>Continue after completing the meaning check.</p></div>
      <section class="owe-story-layout"><div class="owe-story-image"><img src="./assets/yoruba-kids-culture.jpg" alt="Children in traditional Yorùbá attire reading together" /><span class="image-caption">A story made for this learning activity.</span></div><article class="owe-story-reading"><span class="section-kicker">Step 3 · An original learning story · 3 min</span><h2>Dami and the<br /><em>okra seed.</em></h2><p class="story-subhead">A new classroom story about patience, care and letting things grow.</p><div class="story-credit-note">${icon('info', 16)} This story was written for the Idilewa lesson. It is not presented as a traditional folktale.</div>
        <div class="story-text"><p>At the start of the rainy season, Dami planted an okra seed beside her grandmother’s garden. Each day, she watered it and checked the soft earth.</p><p>On the second day, nothing had changed. Dami wondered if the seed had forgotten her. Her grandmother smiled and reminded her that caring for something includes giving it time.</p><p>Dami kept watering the seed and clearing away little weeds. Later, a green shoot appeared. She felt proud: patience had not meant sitting still. It meant caring steadily while something grew.</p></div>
        <section class="owe-story-quiz"><span class="section-kicker">Check what you noticed</span><h2>What did Dami do while she waited?</h2><div class="story-answer-list">${[['She kept caring for the seed.', true], ['She stopped visiting the garden.', false], ['She dug up the seed each morning.', false]].map(([label, correct], i) => `<button class="story-answer ${result === 'correct' && correct ? 'answer-correct' : ''}" data-action="owe-story-answer" data-key="comprehension" data-correct="${correct}" ${result === 'correct' ? 'disabled' : ''}><span>${String.fromCharCode(65 + i)}</span>${label}${result === 'correct' && correct ? icon('check', 17) : icon('arrow', 15)}</button>`).join('')}</div>${result === 'retry' ? `<div class="answer-feedback feedback-retry">Try again: what was Dami doing in the garden each day?</div>` : ''}${result === 'correct' ? `<div class="answer-feedback feedback-correct">Exactly—she kept caring for the seed as she waited.</div>` : ''}</section>
        <div class="owe-lesson-actions">${routeLink('owe_detail', 'Review the meaning', 'text-link')}${result === 'correct' ? routeLink('owe_reflection', `Continue to your reflection ${icon('arrow', 15)}`, 'button button-primary') : '<button class="button button-primary" disabled>Answer the story question to continue</button>'}</div>
      </article></section><div class="owe-story-ai">${aiHelperButton('story')}<span>Use it as a prompt, then talk the story through with a trusted adult.</span></div></section>`;
  }

  function renderOweReflection() {
    const meaningDone = state.quizResults['owe-meaning:comprehension'] === 'correct';
    const storyDone = state.quizResults['owe-story:comprehension'] === 'correct';
    if (!storyDone) {
      const nextRoute = meaningDone ? 'owe_story' : 'owe_detail';
      const nextLabel = meaningDone ? 'Finish the moral story' : 'Start with translation & meaning';
      return `<section class="owe-unified-section owe-reflection-page" id="owe-reflection"><section class="owe-sequence-gate"><span class="section-kicker">Step 4 · Reflection · locked</span><h2>Your turn is next.</h2><p>Complete the proverb meaning and answer the story question first. Then this space will invite the child to name a feeling, share a thought and choose a small action.</p>${routeLink(nextRoute, `${nextLabel} ${icon('arrow', 15)}`, 'button button-primary')}${aiHelperButton('owe')}</section></section>`;
    }
    const feelings = ['Curious', 'Calm', 'Impatient', 'Proud', 'Unsure'];
    const latest = state.reflections[0];
    return `<section class="owe-unified-section owe-reflection-page" id="owe-reflection"><div class="owe-section-heading"><span class="section-kicker">Step 4 · Reflection</span><h2>Make the lesson your own.</h2><p>The final step is personal. There is no single right answer.</p></div>
      <section class="reflection-layout"><article class="reflection-main"><h2>What do you<br /><em>feel and think?</em></h2><p class="reflection-intro">There is no single right answer. You can name a feeling, share an idea or think of one small action you could try when something takes time.</p>
        <fieldset class="feeling-fieldset"><legend>How might you feel when you have to wait?</legend><div class="feeling-picker">${feelings.map((feeling) => `<button type="button" class="feeling-chip ${state.reflectionFeeling === feeling ? 'is-selected' : ''}" data-action="select-feeling" data-feeling="${feeling}" aria-pressed="${state.reflectionFeeling === feeling}">${feeling}</button>`).join('')}</div></fieldset>
        <form class="reflection-form" data-form="owe-reflection"><label for="oweThought">What do you think? What could you do with patience?</label><textarea id="oweThought" name="thought" rows="5" maxlength="600" placeholder="You could write a sentence, a plan or a question…" required></textarea><small>Keep it general—please do not write a full name, address or other private details.</small><button class="button button-primary" type="submit">Save my reflection on this device ${icon('arrow', 15)}</button></form>
        ${latest ? `<div class="reflection-saved"><span class="section-kicker">Saved locally on this browser</span><strong>${esc(latest.feeling || 'A thought')} · ${new Date(latest.createdAt).toLocaleDateString()}</strong><p>${esc(latest.thought)}</p><small>This is visible to people who use this device. Nothing is sent to a server.</small></div>` : ''}
      </article><aside class="reflection-aside"><div class="detail-side-card"><span class="side-card-icon">${icon('heart', 21)}</span><span class="section-kicker">A gentle reminder</span><h3>Waiting can still include action.</h3><p>Dami cared for her seed. What is one kind or helpful thing you might do while you wait?</p>${aiHelperButton('owe')}</div><img class="reflection-kids-photo" src="./assets/yoruba-kids-culture.jpg" alt="Friends learning together in traditional Yorùbá clothing" /></aside></section>
      <div class="owe-lesson-actions reflection-back-actions">${routeLink('owe_story', 'Back to the story', 'text-link')}</div></section>`;
  }

  function renderOweAdd() {
    return `<div class="container route-page form-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('oral', 'Read & listen')}<span>/</span>${routeLink('owe', 'Proverbs')}<span>/</span><strong>Share a proverb</strong></div><section class="form-intro"><span class="section-kicker">A contribution, held with care</span><h1>Share a proverb<br /><em>you know and love.</em></h1><p>Add it to this local demo to see how a community contribution might feel. Nothing is sent or published.</p></section>${renderStepper(['Choose words', 'Add meaning', 'Add context', 'Share with care'], 3)}<div class="contribution-layout"><form class="contribution-form" data-form="proverb"><label for="proverbLang">Language <select id="proverbLang" name="language" required><option value="Yorùbá">Yorùbá</option><option value="Igbo">Igbo</option><option value="Hausa">Hausa</option><option value="Swahili">Swahili</option></select></label><label for="proverbText">Proverb in its original language <textarea id="proverbText" name="text" rows="3" maxlength="240" placeholder="Type the words as you know them…" required></textarea><small>Keep tonal marks and diacritics where you can.</small></label><label for="proverbMeaning">Meaning or translation <textarea id="proverbMeaning" name="meaning" rows="3" maxlength="320" placeholder="What does it mean to you?" required></textarea></label><label for="proverbContext">Context or attribution <input id="proverbContext" name="context" maxlength="120" placeholder="Who shared it, or where did you hear it?" /></label><label class="consent-check"><input type="checkbox" name="consent" required /><span>I have permission to share this contribution, and understand it remains on this device in this prototype.</span></label><button class="button button-primary" type="submit">Save to this demo ${icon('arrow', 16)}</button></form><aside class="contribution-aside"><span class="side-card-icon">${icon('heart', 21)}</span><h2>Knowledge travels with care.</h2><p>Before sharing an oral tradition, check who owns the story, what should stay private and how the source wants to be credited.</p><div class="contribution-aside-note">${icon('lock', 16)} This prototype does not upload or publish your words.</div></aside></div></div>`;
  }

  function renderVoices() {
    const voices = [
      { lang: 'yoruba', speaker: 'Everyday greeting', phrase: 'Ẹ káàárọ̀', translation: 'Good morning', tint: 'mint' },
      { lang: 'igbo', speaker: 'Friendly greeting', phrase: 'Ndewo', translation: 'Hello', tint: 'peach' },
      { lang: 'hausa', speaker: 'Friendly greeting', phrase: 'Sannu', translation: 'Hello', tint: 'blue' },
      { lang: 'swahili', speaker: 'Everyday greeting', phrase: 'Habari', translation: 'How are you?', tint: 'lilac' }
    ];
    return `<div class="container route-page voices-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('oral', 'Read & listen')}<span>/</span><strong>Voice library</strong></div><section class="voices-hero"><div><span class="section-kicker">Listen close · speak with confidence</span><h1>Every word has<br /><em>a voice of its own.</em></h1><p>Listen to short sample phrases, notice the rhythm and practice at your own pace.</p><div class="hero-actions">${routeLink('voice_lessons', `Voice Lessons ${icon('arrow', 15)}`, 'button button-primary')}</div></div><div class="voice-orbit"><span class="orbit-core">${icon('volume', 30)}</span><span class="orbit-word orbit-one">Ẹ káàárọ̀</span><span class="orbit-word orbit-two">Ndewo</span><span class="orbit-word orbit-three">Sannu</span><span class="orbit-word orbit-four">Habari</span></div></section>${renderStepper(['Choose a language', 'Hear a phrase', 'Practice', 'Remember'], 1)}<section class="voice-list-section"><div class="section-heading"><div><span class="section-kicker">Try a greeting</span><h2>Choose a phrase and listen.</h2><p>Speech is generated by Idilewa in the language shown for each sample.</p></div><span class="demo-badge">Idilewa voices</span></div><div class="voice-list">${voices.map((v) => { const l = getLanguage(v.lang); const langCode = { yoruba: 'yo', igbo: 'ig', hausa: 'ha', swahili: 'sw' }[v.lang] || 'en'; return `<article class="voice-row"><span class="voice-language-mark lang-${v.tint}">${l.glyph}</span><div class="voice-row-copy"><span class="voice-row-lang">${l.name} · ${v.speaker}</span><strong>${v.phrase}</strong><small>${v.translation}</small></div><div class="voice-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><button class="voice-play" data-action="play-audio" data-text="${esc(v.phrase)}" data-language="${langCode}" aria-label="Play ${esc(v.phrase)}">${icon('play', 16)}</button></article>`; }).join('')}</div><div class="voice-access-note">${icon('shield', 16)} Machine-generated pronunciation can vary. Fluent-speaker review is recommended for learning materials.</div></section></div>`;
  }

  function renderGeneric(key) {
    const meta = PAGE_META[key];
    if (!meta) return renderHome();
    const imageSrc = meta.image === 'story' ? './assets/story-grandmother.jpg' : meta.image === 'code' ? './assets/code-kids.jpg' : meta.image === 'kids' ? './assets/yoruba-kids-culture.jpg' : meta.image === 'hero' ? './assets/hero-reader.jpg' : '';
    const cards = meta.cards.map((card) => `<a class="editorial-card tone-${card.tone || 'mint'}" href="#/${card.route}" data-route="${card.route}"><span class="editorial-card-icon">${icon(card.icon, 20)}</span><span class="editorial-card-overline">Explore</span><h3>${card.title}</h3><p>${card.text}</p><span class="editorial-card-go">Learn more ${icon('arrow', 14)}</span></a>`).join('');
    const interestForm = meta.form ? `<form class="interest-form" data-form="interest"><label for="interestEmail">${meta.form === 'school' ? 'Get school updates' : 'Ask about guided learning'}</label><div><input id="interestEmail" name="email" type="email" placeholder="Your email address" required /><button type="submit">${icon('send', 16)} <span>Send interest</span></button></div><small>Prototype only—your details are not sent.</small></form>` : '';
    return `<div class="container route-page editorial-page page-${key}">
      <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>${meta.eyebrow}</strong></div>
      <section class="editorial-hero"><div class="editorial-copy"><span class="section-kicker">${meta.eyebrow}</span><h1>${meta.title}</h1><p>${meta.desc}</p><div class="editorial-actions">${routeLink(meta.ctaRoute, `${meta.cta} ${icon('arrow', 15)}`, 'button button-primary')}${key !== 'about' ? routeLink('about', 'About Idilewa', 'text-link') : ''}</div><div class="editorial-proof">${icon('shield', 16)} Warm, accessible and built to grow with learners.</div></div><div class="editorial-visual ${meta.image ? 'has-photo' : ''}">${imageSrc ? `<img src="${imageSrc}" alt="${meta.imageAlt}" />` : `<div class="editorial-illustration tone-mint">${icon(meta.icon || 'sparkles', 50)}<span class="editorial-spark">✦</span><span class="editorial-orbit">${meta.eyebrow}</span></div>`}<div class="visual-note">${icon(meta.icon || 'sparkles', 16)} <span>Rooted in language<br />open to the future</span></div>\n    </section>
      <div class="editorial-body"><div class="editorial-main"><section class="editorial-cards-section"><div class="section-heading"><div><span class="section-kicker">A thoughtful way to begin</span><h2>Explore what matters to you.</h2><p>Choose a next step or follow your curiosity.</p></div></div><div class="editorial-card-grid">${cards}</div></section>${interestForm}<section class="editorial-footer-note"><span>${icon('heart', 18)}</span><p>Idilewa is designed to be welcoming for children and useful for adults—with privacy, consent and cultural context in mind.</p></section></div><aside class="editorial-aside"><div class="aside-path-card"><span class="section-kicker">A clear journey</span><h3>See your next step.</h3>${renderStepper(meta.flow || ['Discover', 'Choose', 'Practice', 'Grow'], meta.active || 0)}<p>Each path keeps the next layer easy to find.</p>${routeLink('index', 'Back to Home ' + icon('arrow', 14), 'text-link')}</div><div class="aside-quote-card"><span>${icon(meta.icon || 'leaf', 19)}</span><p>“Language is a bridge between who we are and what we can imagine.”</p><small>Idilewa learning principle</small></div></aside></div>
    </div>`;
  }

  function renderPricing() {
    return `<div class="container route-page pricing-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Plans</strong></div><section class="pricing-hero page-depth-reveal"><span class="section-kicker">Free to start · no checkout</span><h1>More language.<br /><em>More belonging.</em></h1><p>All current learning plans are free. No payment details are collected and no subscription is started.</p><div class="pricing-free-note">${icon('check', 16)} Family: $0 USD/month <span aria-hidden="true">·</span> School: $0 USD/month</div></section>${renderStepper(['Explore plans', 'Choose learning paths', 'Review as a family', 'Begin together'], 0)}<div class="pricing-grid"><article class="pricing-card"><span class="pricing-label">Begin here</span><h2>Explorer</h2><p>For learners ready to try a first path.</p><div class="pricing-cost"><strong>Free</strong><small>to get started</small></div><ul><li>${icon('check', 15)} Explore available languages</li><li>${icon('check', 15)} Try sample lessons & stories</li><li>${icon('check', 15)} Follow a personal learning path</li></ul>${routeLink('languages', 'Start exploring ' + icon('arrow', 15), 'button button-outline')}</article><article class="pricing-card pricing-featured"><span class="popular-pill">Made for together</span><span class="pricing-label">For home</span><h2>Family</h2><p>Free access to the current language, culture and story learning previews.</p><div class="pricing-cost"><strong>$0</strong><small>USD · per month</small></div><ul><li>${icon('check', 15)} Explore available family learning paths</li><li>${icon('check', 15)} Try sample stories and activities</li><li>${icon('check', 15)} Keep progress in this browser preview</li></ul>${routeLink('login', `Create a free account ${icon('arrow', 15)}`, 'button button-primary', 'data-mode="signup"')}</article><article class="pricing-card"><span class="pricing-label">For educators</span><h2>School</h2><p>Free preview of classroom learning paths; no school service or student roster is active.</p><div class="pricing-cost"><strong>$0</strong><small>USD · per month</small></div><ul><li>${icon('check', 15)} Explore sample language modules</li><li>${icon('check', 15)} Preview culture and coding activities</li><li>${icon('lock', 15)} Student connections are not available</li></ul>${routeLink('curriculum', 'Explore curriculum ' + icon('arrow', 15), 'button button-outline')}</article></div><p class="pricing-footnote">Current plan prices are $0. No Paystack checkout is started for free plans. ${routeLink('payment', 'View payment information ' + icon('arrow', 14), 'text-link')}. If prices change, confirm the new amount and billing terms before enabling payments.</p></div>`;
  }

  const MENTOR_PREVIEWS = [
    { id: 'folake', name: 'Dr. Folake Adeyemi', initials: 'FA', detail: 'Ph.D. African Linguistics & Computational Dialectology', price: 7500, rating: '4.98', count: '142', expertise: 'Yorùbá phonetics · Heritage', next: 'Today, 10:00 AM', photo: 'yoruba-educator-woman.jpg' },
    { id: 'chidiebere', name: 'Chidiebere Okafor', initials: 'CO', detail: 'Igbo Language Immersion & Cultural Stories', price: 6800, rating: '4.95', count: '86', expertise: 'Proverbs & STEM', next: 'Today, 4:00 PM' },
    { id: 'amina', name: 'Amina Bello', initials: 'AB', detail: 'Hausa Conversation & Young Makers', price: 6500, rating: '4.92', count: '74', expertise: 'Robotics & Code', next: 'Tomorrow, 11:30 AM' },
    { id: 'tunde', name: 'Tunde Bakare', initials: 'TB', detail: 'Talking Drum & Yorùbá Tone Coach', price: 8000, rating: '5.0', count: '59', expertise: 'Acoustics & Tone', next: 'Saturday, 1:00 PM' },
  ];
  let selectedMentorBooking = { mentorId: 'folake', day: 'Today', time: 'Morning 10:00 AM' };
  function renderMentors() {
    const featured = MENTOR_PREVIEWS[0];
    const selected = MENTOR_PREVIEWS.find((mentor) => mentor.id === selectedMentorBooking.mentorId) || featured;
    const days = ['Today', 'Tomorrow', 'Saturday'];
    const times = ['Morning 10:00 AM', 'Afternoon 2:30 PM'];
    const dayChoices = days.map((day) => `<button type="button" class="mentor-slot-choice ${selectedMentorBooking.day === day ? 'is-selected' : ''}" data-action="mentor-select-slot" data-day="${day}" aria-pressed="${selectedMentorBooking.day === day}">${day}</button>`).join('');
    const timeChoices = times.map((time) => `<button type="button" class="mentor-time-choice ${selectedMentorBooking.time === time ? 'is-selected' : ''}" data-action="mentor-select-slot" data-time="${time}" aria-pressed="${selectedMentorBooking.time === time}">${icon(time.startsWith('Morning') ? 'sun' : 'clock', 14)} ${time}</button>`).join('');
    const previewCards = MENTOR_PREVIEWS.slice(1).map((mentor) => `<article class="mentor-list-card">
      <div class="mentor-list-avatar" aria-hidden="true">${mentor.initials}</div>
      <div class="mentor-list-copy"><strong>${mentor.name}</strong><span>${mentor.detail}</span><small>${mentor.next}</small></div>
      <div class="mentor-list-meta"><strong>${icon('star', 13)} ${mentor.rating}</strong><span>₦${mentor.price.toLocaleString('en-NG')} / hr</span><em>${mentor.expertise}</em><button type="button" class="mentor-select-button" data-action="mentor-select-preview" data-mentor="${mentor.id}">Select slot</button></div>
    </article>`).join('');
    return `<div class="container route-page mentors-page">
      <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Mentors</strong></div>
      <header class="mentor-page-heading"><div><span class="section-kicker">Heritage scholars · Language & culture mentors</span><h1>Learn with people who carry the story.</h1><p>Explore language, culture and storytelling with educators whose experience connects generations.</p></div><span class="mentor-preview-badge">${icon('info', 14)} Mentor directory preview</span></header>
      <article class="mentor-feature-card">
        <div class="mentor-feature-photo"><img src="${imageUrl(featured.photo)}" alt="Mentor profile preview for ${featured.name}" loading="lazy" /><span>${icon('sparkles', 14)} Profile preview</span></div>
        <div class="mentor-feature-content"><div class="mentor-feature-badges"><span>${icon('shield', 13)} Family-first learning</span><span>${icon('star', 13)} ${featured.rating} <small>(${featured.count})</small></span></div>
          <div class="mentor-feature-title"><div><h2>${featured.name}</h2><p>${featured.detail}</p></div><strong>₦${featured.price.toLocaleString('en-NG')}<small> / hr</small></strong></div>
          <section class="mentor-availability" aria-label="Choose a mentor session time"><div class="mentor-availability-heading"><strong>${icon('calendar', 15)} Available slots</strong><span>West Africa Time (WAT)</span></div><div class="mentor-day-options">${dayChoices}</div><div class="mentor-time-options">${timeChoices}<button type="button" class="mentor-time-choice mentor-night-choice" data-action="mentor-select-slot" data-time="Evening 7:00 PM" aria-pressed="${selectedMentorBooking.time === 'Evening 7:00 PM'}">${icon('moon', 14)} Evening 7:00 PM</button></div></section>
          <button type="button" class="mentor-book-button" data-action="mentor-book" data-mentor="${featured.id}">${icon('lock', 16)} Review session via KoraPay <span>₦${featured.price.toLocaleString('en-NG')}</span></button>
          <p class="mentor-checkout-note">Preview only. No session is reserved and no payment is taken until secure booking is enabled.</p>
        </div>
      </article>
      <section class="mentor-safeguarding" aria-label="Ancestral Safeguard Protocol"><span class="mentor-safety-icon">${icon('shield', 21)}</span><div><h2>Ancestral Safeguard Protocol</h2><p>Family-first learning sanctuary</p></div><ul><li>${icon('check', 14)} Parent-approved connections</li><li>${icon('lock', 14)} Private learning sessions</li><li>${icon('shield', 14)} Child safety comes first</li></ul></section>
      <section class="mentor-list-section"><div class="mentor-list-heading"><div><span class="section-kicker">Explore the community</span><h2>Language & culture mentors</h2></div><span>${MENTOR_PREVIEWS.length} profile previews</span></div><div class="mentor-list">${previewCards}</div></section>
    </div>`;
  }

  let profilePhoto = (() => {
    try { return localStorage.getItem('idilewa-profile-photo') || ''; } catch (_) { return ''; }
  })();

  async function saveProfilePhoto(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Choose a JPG, PNG or WebP image.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('That image is larger than 8 MB. Choose a smaller file.', 'error');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('The selected image could not be read.'));
        image.src = objectUrl;
      });
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image processing is unavailable in this browser.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
      localStorage.setItem('idilewa-profile-photo', dataUrl);
      profilePhoto = dataUrl;
      render();
      showToast('Profile photo saved on this device.');
    } catch (error) {
      showToast(`Could not save that photo: ${error.message || 'browser storage is unavailable'}`, 'error');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function renderLegacyProfile() {
    const completedCount = state.completed.length;
    const percent = Math.min(100, Math.round((completedCount / 8) * 100));
    const lang = getLanguage(state.currentLang);
    const journeyStep = completedCount >= 8 ? 3 : state.streak >= 3 ? 2 : completedCount ? 1 : 0;
    return `<div class="container route-page profile-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>My progress</strong></div>${renderStepper(['Choose a path', 'Practice a lesson', 'Build a streak', 'Celebrate progress'], journeyStep)}<section class="profile-welcome page-depth-reveal"><div class="profile-photo-wrap"><div class="profile-avatar">${profilePhoto ? `<img src="${esc(profilePhoto)}" alt="Your profile photo" />` : icon('user', 27)}</div><label class="profile-photo-button" for="profile-photo-input">${icon('edit', 15)} Choose photo</label><input id="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" /></div><div><span class="section-kicker">Your learning space · demo</span><h1>A good day to keep going.</h1><p>Your progress is saved in this browser for this prototype.</p><small class="profile-photo-note">Profile photos are resized and stored only in this browser on this device.</small></div><button class="button button-outline" data-route="login">${icon('user', 16)} Account settings</button></section><div class="profile-overview-grid"><article class="progress-main-card"><div class="progress-main-head"><div><span class="section-kicker">Current path</span><h2>${lang.name} · ${state.level.charAt(0).toUpperCase() + state.level.slice(1)}</h2><p>Keep building confidence, one small lesson at a time.</p></div><span class="progress-medallion">${icon('leaf', 23)}</span></div><div class="large-progress"><div><span style="width:${percent}%"></span></div><strong>${percent}%</strong></div><div class="progress-foot"><span>${completedCount} lessons completed</span>${routeLink('course', 'Continue learning ' + icon('arrow', 14), 'text-link')}</div></article><div class="stat-card stat-streak"><span>${icon('sparkles', 20)}</span><small>Learning streak</small><strong>${state.streak} <em>days</em></strong><p>Showing up is a win.</p></div><div class="stat-card stat-points"><span>${icon('star', 20)}</span><small>Practice points</small><strong>${state.points}</strong><p>Earned by trying new things.</p></div></div><div class="profile-lower-grid"><section class="profile-card"><div class="section-heading compact-heading"><div><span class="section-kicker">Your recent steps</span><h2>Learning timeline</h2></div>${routeLink('course', 'View path ' + icon('arrow', 14), 'text-link')}</div><div class="timeline-row"><span class="timeline-check">${icon('check', 15)}</span><div><strong>Start with a greeting</strong><small>${lang.name} · First lesson</small></div><span class="timeline-status">${state.completed.includes(`${lang.id}-greetings-intro`) ? 'Complete' : 'Ready'}</span></div><div class="timeline-row timeline-next"><span class="timeline-num">02</span><div><strong>People close to us</strong><small>Next module · Words for family</small></div><button class="text-link" data-action="open-module" data-module="family" data-lang="${lang.id}" data-level="${state.level}">Open ${icon('arrow', 14)}</button></div><div class="timeline-row timeline-next"><span class="timeline-num">03</span><div><strong>Culture & memory</strong><small>Explore oral traditions and listen for new words</small></div>${routeLink('oral', 'Explore oral traditions ' + icon('arrow', 14), 'text-link')}</div></section><aside class="profile-badges"><span class="section-kicker">Small things worth celebrating</span><h2>Your first badges</h2><div class="badge-list"><div class="badge-item"><span class="badge-icon badge-green">${icon('leaf', 18)}</span><div><strong>First steps</strong><small>Opened your learning path</small></div></div><div class="badge-item"><span class="badge-icon badge-yellow">${icon('volume', 18)}</span><div><strong>Good listener</strong><small>Practiced a spoken phrase</small></div></div><div class="badge-item badge-locked"><span class="badge-icon">${icon('trophy', 18)}</span><div><strong>Culture keeper</strong><small>Explore oral traditions</small></div></div></div></aside></div><div class="profile-privacy-note">${icon('lock', 16)} This demo keeps progress on this device. Production accounts require secure authentication and privacy review.</div></div>`;
  }

  const PROFILE_DETAILS_KEY = 'idilewa-profile-details';

  function getProfileDetails() {
    const user = getCurrentUser() || {};
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(PROFILE_DETAILS_KEY) || '{}'); } catch (_) {}
    return {
      name: saved.name || user.name || '',
      email: user.email || '',
      bio: saved.bio || user.bio || '',
      goal: saved.goal || user.learning_goal || '',
      language: saved.language || user.learning_language || state.currentLang || 'yoruba',
      level: saved.level || user.learning_level || state.level || 'beginner',
      interests: Array.isArray(saved.interests) ? saved.interests : Array.isArray(user.interests) ? user.interests : []
    };
  }

  function renderProfileEditor() {
    const user = getCurrentUser();
    const profile = getProfileDetails();
    const interests = [
      ['speaking', 'Speaking & listening'], ['stories', 'Stories & culture'],
      ['conversation', 'Everyday conversations'], ['family', 'Learning with family']
    ];
    return `<section class="profile-editor" aria-labelledby="profile-editor-title">
      <div class="profile-editor-heading"><span class="section-kicker">Your account · your learning path</span><h2 id="profile-editor-title">Complete your profile</h2><p>Tell us how you want to learn. You can update these details any time.</p></div>
      <form data-form="profile-settings" class="profile-editor-form">
        <fieldset class="profile-layer"><legend><span>01</span> About you</legend><div class="profile-field-grid"><label>Display name<input name="name" autocomplete="name" maxlength="60" required value="${esc(profile.name)}" placeholder="What should we call you?" /></label><label>Email<input value="${esc(profile.email)}" readonly placeholder="Sign in to connect your account" /></label></div></fieldset>
        <fieldset class="profile-layer"><legend><span>02</span> Your story</legend><label>Short bio<textarea name="bio" rows="3" maxlength="500" placeholder="Share a little about yourself and what you enjoy learning.">${esc(profile.bio)}</textarea></label><label>Learning goal<textarea name="goal" rows="2" maxlength="240" placeholder="What would you like to be able to do?">${esc(profile.goal)}</textarea></label></fieldset>
        <fieldset class="profile-layer"><legend><span>03</span> Learning preferences</legend><div class="profile-field-grid"><label>Primary language<select name="language">${LANGUAGES.map((language) => `<option value="${language.id}" ${profile.language === language.id ? 'selected' : ''}>${language.name}</option>`).join('')}</select></label><label>Experience level<select name="level">${[['beginner','Beginning'],['intermediate','Growing'],['advanced','Confident']].map(([value,label]) => `<option value="${value}" ${profile.level === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><div class="profile-interest-list"><span>I'm interested in</span>${interests.map(([value,label]) => `<label><input type="checkbox" name="interests" value="${value}" ${profile.interests.includes(value) ? 'checked' : ''} />${label}</label>`).join('')}</div></fieldset>
        <fieldset class="profile-layer"><legend><span>04</span> Account & privacy</legend><p>${user ? `Signed in as ${esc(user.email || '')}. Your profile details are saved to your Idilewa account.` : 'You are browsing as a guest. Save these details on this device, or sign in to connect them to an account.'}</p><div class="profile-account-actions">${user ? '<button type="button" class="button button-outline" data-action="profile-sign-out">Sign out</button>' : `${routeLink('login', 'Sign in', 'button button-outline', 'data-mode="signin"')}${routeLink('login', 'Create account', 'button button-primary', 'data-mode="signup"')}`}</div></fieldset>
        <div class="profile-editor-submit"><small>Profile photo is managed above and stays on this device.</small><button type="submit" class="button button-primary">Save profile ${icon('check', 15)}</button></div>
      </form>
    </section>`;
  }

  function renderProfile() {
    const profile = getProfileDetails();
    const name = profile.name.trim() || 'Learner';
    const initial = name.charAt(0).toUpperCase();
    const language = getLanguage(profile.language);
    const completedCount = state.completed.length;
    const progress = Math.min(100, Math.round((completedCount / 8) * 100));
    const latestReflection = state.reflections[0];
    const reflectionText = latestReflection?.thought ? `${esc(latestReflection.thought.slice(0, 72))}${latestReflection.thought.length > 72 ? '…' : ''}` : 'Your reflections will appear here after you save one.';
    return `<div class="container route-page profile-page profile-dashboard">
      <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>My profile</strong></div>
      <section class="profile-cover" aria-label="Your Idilewa learning space">
        <img src="./assets/page-profile-1.jpg" alt="" />
        <div class="profile-cover-overlay"></div>
        <div class="profile-cover-copy"><span class="section-kicker">My Idilewa</span><p>A place to learn, grow and celebrate every step.</p></div>
      </section>
      <div class="profile-dashboard-grid">
        <aside class="profile-identity-card">
          <div class="profile-photo-wrap">
            <div class="profile-avatar">${profilePhoto ? `<img src="${esc(profilePhoto)}" alt="${esc(name)}'s profile photo" />` : `<span aria-hidden="true">${esc(initial)}</span>`}</div>
            <label class="profile-photo-button" for="profile-photo-input">${icon('edit', 14)} Change photo</label>
            <input id="profile-photo-input" type="file" accept="image/jpeg,image/png,image/webp" />
          </div>
          <span class="profile-identity-label">Learner profile</span>
          <h1>${esc(name)}</h1>
          <p class="profile-identity-email">${profile.email ? esc(profile.email) : 'Learning as a guest'}</p>
          <div class="profile-identity-tags"><span>${esc(language.name)}</span><span>${esc(profile.level.charAt(0).toUpperCase() + profile.level.slice(1))}</span></div>
          <p class="profile-identity-goal">${profile.goal ? esc(profile.goal) : 'Your learning goals and interests belong here.'}</p>
          <div class="profile-identity-actions">
            ${getCurrentUser() ? '<button class="button button-outline" data-action="profile-sign-out">Sign out</button>' : routeLink('login', 'Sign in to sync', 'button button-primary', 'data-mode="signin"')}
          </div>
          <small class="profile-photo-note">Your photo stays on this device.</small>
        </aside>
        <main class="profile-dashboard-main">
          <header class="profile-dashboard-heading"><div><span class="section-kicker">Your learning space</span><h2>Welcome back, ${esc(name)}.</h2><p>Keep your language journey moving, one small step at a time.</p></div><span class="profile-member-mark">${icon('sparkles', 19)} Idilewa learner</span></header>
          <section class="profile-stat-grid" aria-label="Learning statistics">
            <article class="profile-stat-card"><span class="profile-stat-icon">${icon('book', 18)}</span><div><small>Lessons completed</small><strong>${completedCount}</strong></div><span class="profile-stat-foot">${progress}% of your starter path</span></article>
            <article class="profile-stat-card"><span class="profile-stat-icon profile-stat-streak">${icon('sparkles', 18)}</span><div><small>Learning streak</small><strong>${state.streak} <em>days</em></strong></div><span class="profile-stat-foot">Every day is a fresh start</span></article>
            <article class="profile-stat-card"><span class="profile-stat-icon profile-stat-points">${icon('star', 18)}</span><div><small>Practice points</small><strong>${state.points}</strong></div><span class="profile-stat-foot">Earned as you explore</span></article>
          </section>
          <section class="profile-progress-panel" aria-labelledby="profile-progress-title">
            <div class="profile-panel-heading"><div><span class="section-kicker">Your current path</span><h3 id="profile-progress-title">${esc(language.name)} · ${esc(profile.level.charAt(0).toUpperCase() + profile.level.slice(1))}</h3><p>Build confidence with a little practice at a time.</p></div><span class="profile-progress-icon">${icon('leaf', 21)}</span></div>
            <div class="profile-progress-track" role="progressbar" aria-label="Starter path progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div>
            <div class="profile-progress-footer"><span>${completedCount} of 8 starter lessons completed</span>${routeLink('course', `Continue learning ${icon('arrow', 14)}`, 'text-link')}</div>
          </section>
          <div class="profile-content-grid">
            <section class="profile-activity-card">
              <div class="profile-panel-heading"><div><span class="section-kicker">Keep your rhythm</span><h3>Recent activity</h3></div>${routeLink('course', 'View learning path', 'text-link')}</div>
              <div class="profile-activity-row"><span class="profile-activity-icon">${icon(completedCount ? 'check' : 'book', 16)}</span><div><strong>${completedCount ? 'Language practice completed' : 'Your first lesson is ready'}</strong><small>${esc(language.name)} · ${completedCount ? `${completedCount} lesson${completedCount === 1 ? '' : 's'} completed` : 'Start with a greeting'}</small></div>${completedCount ? '<span class="profile-activity-status">Done</span>' : routeLink('course', 'Start', 'text-link')}</div>
              <div class="profile-activity-row"><span class="profile-activity-icon profile-activity-culture">${icon('book', 16)}</span><div><strong>Your personal reflection</strong><small>${reflectionText}</small></div>${latestReflection ? '<span class="profile-activity-status">Saved here</span>' : routeLink('owe', 'Explore Òwe', 'text-link')}</div>
              <div class="profile-activity-row"><span class="profile-activity-icon profile-activity-listen">${icon('volume', 16)}</span><div><strong>Listen and speak</strong><small>Practice sounds in a guided voice lesson</small></div>${routeLink('voice_lessons', 'Explore', 'text-link')}</div>
            </section>
            <aside class="profile-highlights-card"><span class="section-kicker">Small steps matter</span><h3>Your learning highlights</h3><div class="profile-highlight-row"><span class="profile-highlight-icon">${icon('leaf', 17)}</span><div><strong>First steps</strong><small>${completedCount ? 'You have started your learning path' : 'Ready when you are'}</small></div></div><div class="profile-highlight-row"><span class="profile-highlight-icon profile-highlight-gold">${icon('heart', 17)}</span><div><strong>Learning with care</strong><small>Language and culture grow together</small></div></div><div class="profile-highlight-note">${icon('lock', 14)} Your progress is stored on this device.</div></aside>
          </div>
          <details class="profile-edit-disclosure"><summary>${icon('edit', 16)} Edit profile and learning preferences</summary>${renderProfileEditor()}</details>
        </main>
      </div>
      <p class="profile-privacy-note">${icon('lock', 15)} Photos and guest profile details stay in this browser. Sign in to connect your learning preferences to your account.</p>
    </div>`;
  }

  function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
  }

  const TUTOR_PORTAL_LINKS = [
    { route: 'tutor-dashboard', label: 'Dashboard', icon: 'home' },
    { route: 'tutor-find-child', label: 'Find a Child', icon: 'search' },
    { route: 'tutor-students', label: 'My Students', icon: 'people' },
    { route: 'tutor-messages', label: 'Messages', icon: 'send' },
    { route: 'tutor-profile', label: 'My Profile', icon: 'user' },
    { route: 'tutor-settings', label: 'Settings', icon: 'lock' }
  ];
  const TUTOR_ACTIVE_LINK = {
    'tutor-dashboard': 'tutor-dashboard',
    'tutor-find-child': 'tutor-find-child',
    'tutor-consent': 'tutor-find-child',
    'tutor-students': 'tutor-students',
    'tutor-lesson': 'tutor-students',
    'tutor-messages': 'tutor-messages',
    'tutor-profile': 'tutor-profile',
    'tutor-availability': 'tutor-profile',
    'tutor-settings': 'tutor-settings'
  };
  const TUTOR_AVAILABILITY_KEY = 'idilewa-tutor-availability';
  const TUTOR_PREFERENCES_KEY = 'idilewa-tutor-preferences';
  let tutorDashboardData = null;
  let tutorDashboardLoadSequence = 0;
  let tutorDashboardDataPage = '';
  let tutorDashboardLoadPending = false;

  function isTutorAccount() {
    return getCurrentUser()?.role === 'educator';
  }

  function renderTutorBrand() {
    return `<a class="tutor-brand" href="#/tutor" data-route="tutor" aria-label="Idilewa tutor portal home">${brandLogo('Idilewa · Language · Culture · Future')}</a>`;
  }

  function renderTutorHomeLink() {
    return '<a class="tutor-home-link" href="/" aria-label="Go to Idilewa home">Home</a>';
  }

  function renderTutorLanding() {
    return `<div class="tutor-public-page">
      <header class="tutor-public-header">${renderTutorBrand()}<nav aria-label="Tutor portal navigation">${renderTutorHomeLink()}<a href="#/tutor-login" data-route="tutor-login">Sign in</a><a class="tutor-button tutor-button-primary tutor-button-small" href="#/tutor-signup" data-route="tutor-signup">Create tutor account</a></nav></header>
      <main class="tutor-public-main">
        <section class="tutor-public-hero"><div class="tutor-public-copy"><span class="tutor-eyebrow"><i></i> For language educators</span><h1>Make a difference.<br />Teach the world.</h1><p>Connect with children from around the world, help them learn new languages, and be part of their global journey.</p><div class="tutor-public-actions"><a class="tutor-button tutor-button-primary" href="#/tutor-signup" data-route="tutor-signup">Create Tutor Account ${icon('arrow', 15)}</a><a class="tutor-button tutor-button-outline" href="#/tutor-login" data-route="tutor-login">Sign in</a></div><div class="tutor-public-values"><span>${icon('check', 15)} Trusted connections</span><span>${icon('shield', 15)} Safe & secure</span><span>${icon('people', 15)} Global impact</span></div></div><div class="tutor-public-art"><img src="/assets/yoruba-educator-woman.jpg" alt="Language tutor preparing a lesson at her laptop" /><span class="tutor-art-message">Teach<br />Inspire<br />Empower</span></div></section>
        <section class="tutor-public-steps" aria-label="How the tutor portal works"><article><span>01</span><strong>Create your account</strong><p>Use your one-time educator invitation to sign up securely.</p></article><article><span>02</span><strong>Connect with care</strong><p>Families approve each learner connection before any details are shared.</p></article><article><span>03</span><strong>Help learners grow</strong><p>See approved learning progress and prepare thoughtful lessons.</p></article></section>
        <p class="tutor-public-note">${icon('lock', 14)} Learner information is only available after a parent or guardian approves your specific connection request.</p>
      </main>
      <footer class="tutor-public-footer">${renderTutorBrand()}<a href="#/privacy" data-route="privacy">Privacy</a></footer>
    </div>`;
  }

  function renderTutorAuth(signup) {
    const title = signup ? 'Create Tutor Account' : 'Welcome Back, Tutor';
    const image = signup ? 'yoruba-educator-man.jpg' : 'yoruba-educator-woman.jpg';
    const action = signup ? 'tutor-signup' : 'tutor-login';
    return `<div class="tutor-auth-page ${signup ? 'tutor-auth-signup-page' : ''}">
      <header class="tutor-auth-header">${renderTutorBrand()}<nav class="tutor-auth-nav" aria-label="Tutor account navigation">${renderTutorHomeLink()}<a href="#/tutor" data-route="tutor">Back to tutor portal</a></nav></header>
      <main class="tutor-auth-layout">${signup ? `<aside class="tutor-signup-intro"><span class="tutor-eyebrow"><i></i> ÌDÍLÉWA LIVE TUTORSHIP</span><h2>A brighter way to teach together.</h2><p>Share your knowledge, connect with learners and help African languages and culture thrive.</p><ul><li>${icon('play', 17)} Live lessons with learners and families</li><li>${icon('book', 17)} Languages, culture and core subjects</li><li>${icon('chart', 17)} Lesson progress in your tutor dashboard</li></ul><p class="tutor-signup-note">${icon('shield', 15)} A one-time educator invitation is required. Learner information stays protected until a guardian approves a connection.</p></aside>` : ''}<section class="tutor-auth-card"><div class="tutor-auth-mobile-brand">${renderTutorBrand()}</div><span class="tutor-eyebrow">IDILEWA · EDUCATOR PORTAL</span><h1>${title}</h1><p>${signup ? 'Create your secure tutor account. No payment details are needed to join.' : 'Log in to continue your teaching journey.'}</p>
        <form class="tutor-auth-form" data-form="${action}" novalidate>
          ${signup ? `<div class="tutor-signup-progress" aria-label="Account setup steps"><span class="is-current"><b>1</b> Account</span><i></i><span><b>2</b> Email check</span><i></i><span><b>3</b> Dashboard</span></div><div class="tutor-signup-fields">
            <label>First name<input name="firstName" autocomplete="given-name" maxlength="40" placeholder="First name" required /></label>
            <label>Last name<input name="lastName" autocomplete="family-name" maxlength="40" placeholder="Last name" required /></label>
            <label class="tutor-signup-span">Email address<input name="email" type="email" autocomplete="email" maxlength="180" placeholder="you@example.com" required /></label>
            <label>Country<select name="country" required><option value="">Choose country</option><option>United Kingdom</option><option>Nigeria</option><option>Ghana</option><option>United States</option><option>Canada</option><option>Other</option></select></label>
            <label>Time zone<select name="timeZone" required><option value="">Choose time zone</option><option value="Europe/London">UK / London</option><option value="Africa/Lagos">Nigeria / Lagos</option><option value="Africa/Accra">Ghana / Accra</option><option value="America/New_York">US / Eastern</option><option value="America/Los_Angeles">US / Pacific</option><option value="other">Other</option></select></label>
            <label class="tutor-signup-span">Educator invitation code<input name="inviteCode" autocomplete="one-time-code" maxlength="64" placeholder="Enter your one-time code" required /><small>Invitations are one-time use and expire for your security.</small></label>
            <label>Main teaching subject<select name="teachingSubject" required><option value="">Choose a subject</option><option>Yorùbá</option><option>Igbo</option><option>Hausa</option><option>Arabic</option><option>Kiswahili</option><option>Mathematics</option><option>English</option><option>Science</option><option>Coding</option><option>Other</option></select></label>
            <label>Teaching experience<select name="teachingExperience" required><option value="">Choose experience</option><option>Less than 1 year</option><option>1–3 years</option><option>4–7 years</option><option>8+ years</option></select></label>
            <label class="tutor-signup-span">Qualifications and experience<textarea name="qualifications" maxlength="600" rows="3" placeholder="Share relevant teaching experience or qualifications (optional)"></textarea></label>
            <label class="tutor-signup-span">Password<span class="tutor-password-field"><input id="tutor-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" placeholder="Create a password" required /><button type="button" class="tutor-password-toggle" data-action="tutor-toggle-password" data-target="tutor-password" aria-label="Show password">${icon('eye', 15)}</button></span></label>
            <label class="tutor-signup-span">Confirm password<span class="tutor-password-field"><input id="tutor-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" placeholder="Confirm your password" required /><button type="button" class="tutor-password-toggle" data-action="tutor-toggle-password" data-target="tutor-confirm-password" aria-label="Show password">${icon('eye', 15)}</button></span></label>
          </div><small class="tutor-password-guidance">Use 12–128 characters, including uppercase and lowercase letters, a number, and a symbol.</small><label class="tutor-check-label tutor-signup-terms"><input type="checkbox" name="agreement" required /> I agree to follow Idilewa’s child-safeguarding and privacy requirements.</label>` : `<label>Email Address<input name="email" type="email" autocomplete="email" placeholder="Enter your email" required /></label><label>Password<span class="tutor-password-field"><input id="tutor-password" name="password" type="password" autocomplete="current-password" minlength="12" maxlength="128" placeholder="Enter your password" required /><button type="button" class="tutor-password-toggle" data-action="tutor-toggle-password" data-target="tutor-password" aria-label="Show password">${icon('eye', 15)}</button></span></label><div class="tutor-auth-options"><label class="tutor-check-label"><input type="checkbox" name="remember" /> Remember me</label><a href="#/login?mode=signin" data-route="login" data-mode="signin">Forgot password?</a></div>`}
          <p class="tutor-auth-error" role="alert" aria-live="polite" hidden></p>
          <button type="submit" class="tutor-button tutor-button-primary tutor-auth-submit">${signup ? 'Create Account' : 'Login'} ${icon('arrow', 15)}</button>
        </form>
        <p class="tutor-auth-switch">${signup ? 'Already have an account?' : 'Don’t have an account?'} <a href="#/${signup ? 'tutor-login' : 'tutor-signup'}" data-route="${signup ? 'tutor-login' : 'tutor-signup'}">${signup ? 'Sign in' : 'Sign up'}</a></p>
        <small class="tutor-auth-security">${icon('lock', 13)} Secure educator access · family consent is always required</small>
      </section>${signup ? '' : `<aside class="tutor-auth-art"><img src="/assets/${image}" alt="Idilewa language tutor working at a laptop" /><div class="tutor-auth-art-caption">Better Language Skills<br /><strong>Brighter Futures</strong></div></aside>`}</main>
    </div>`;
  }

  function renderTutorWorkspace(page, title, content) {
    if (!isTutorAccount()) {
      return `<div class="tutor-access-page"><section class="tutor-access-card"><span class="tutor-access-icon">${icon('lock', 22)}</span><span class="tutor-eyebrow">Educator access</span><h1>Sign in to your tutor portal.</h1><p>Only verified educator accounts can view their dashboard and parent-approved student connections.</p><a class="tutor-button tutor-button-primary" href="#/tutor-login?next=${page}" data-route="tutor-login">Tutor sign in ${icon('arrow', 15)}</a></section></div>`;
    }
    const user = getCurrentUser();
    const name = user.name || 'Tutor';
    const initial = name.trim().charAt(0).toUpperCase() || 'T';
    const active = TUTOR_ACTIVE_LINK[page] || 'tutor-dashboard';
    const links = TUTOR_PORTAL_LINKS.map((item) => `<a href="#/${item.route}" data-route="${item.route}" class="tutor-sidebar-link ${item.route === active ? 'is-active' : ''}" ${item.route === active ? 'aria-current="page"' : ''}>${icon(item.icon, 17)}<span>${item.label}</span></a>`).join('');
    return `<div class="tutor-workspace"><aside class="tutor-sidebar"><a class="tutor-sidebar-brand" href="#/tutor-dashboard" data-route="tutor-dashboard" aria-label="Idilewa · Language · Culture · Future">${brandLogo('Idilewa · Language · Culture · Future')}</a><nav class="tutor-sidebar-nav" aria-label="Tutor workspace">${links}<a href="#/tutor-availability" data-route="tutor-availability" class="tutor-sidebar-link ${page === 'tutor-availability' ? 'is-active' : ''}">${icon('calendar', 17)}<span>Availability</span></a></nav><a href="#/tutor-profile" data-route="tutor-profile" class="tutor-sidebar-user"><span class="tutor-avatar">${esc(initial)}</span><span><strong>${esc(name)}</strong><small>Educator</small></span></a></aside><main class="tutor-workspace-main"><header class="tutor-topbar"><div><a href="#/tutor-dashboard" data-route="tutor-dashboard">Tutor Portal</a><span>/</span><strong>${esc(title)}</strong></div><div><a class="tutor-topbar-home" href="/" aria-label="Go to Idilewa home">Home</a><span class="tutor-secure-status"><i></i> Secure workspace</span><a class="tutor-topbar-avatar" href="#/tutor-profile" data-route="tutor-profile" aria-label="Open tutor profile">${esc(initial)}</a></div></header><div class="tutor-workspace-content">${content}</div></main></div>`;
  }

  function renderTutorHeading(eyebrow, title, description, actions = '') {
    return `<header class="tutor-page-heading"><div><span class="tutor-eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${actions ? `<div class="tutor-heading-actions">${actions}</div>` : ''}</header>`;
  }

  function renderTutorDashboard() {
    const data = tutorDashboardData || {};
    const educator = data.educator || {};
    const firstName = (getCurrentUser()?.name || educator.name || 'Tutor').trim().split(/\s+/)[0];
    const requests = Array.isArray(data.requests) ? data.requests : [];
    const learners = Array.isArray(data.learners) ? data.learners : [];
    const approvedCount = learners.length;
    const lessons = learners.reduce((sum, learner) => sum + (Number(learner.completedLessons) || 0), 0);
    const pending = requests.filter((request) => request.status === 'pending').length;
    const recent = requests.slice(0, 4);
    return renderTutorWorkspace('tutor-dashboard', 'Dashboard', `${renderTutorHeading('Your teaching space', `Good Morning, ${firstName}!`, 'Here’s what’s happening with your learners today.', `<a class="tutor-button tutor-button-primary" href="#/tutor-find-child" data-route="tutor-find-child">${icon('plus', 15)} Find a Child</a>`)}
      <section class="tutor-stat-grid" aria-label="Teaching overview"><article><span>${icon('people', 17)} Approved Students</span><strong>${approvedCount}</strong><small>Parent-approved connections</small></article><article><span>${icon('book', 17)} Lessons Completed</span><strong>${lessons}</strong><small>Across approved learners</small></article><article><span>${icon('calendar', 17)} Pending Consent</span><strong>${pending}</strong><small>Awaiting family approval</small></article><article><span>${icon('sparkles', 17)} Learners Practising</span><strong>${learners.filter((learner) => learner.streak > 0).length}</strong><small>Recent learning activity</small></article></section>
      <section class="tutor-dashboard-lower"><div class="tutor-panel tutor-recent-panel"><div class="tutor-section-heading"><div><span class="tutor-eyebrow">Your learners</span><h2>Recent connections</h2></div><a class="tutor-text-link" href="#/tutor-students" data-route="tutor-students">View all ${icon('arrow', 14)}</a></div><div id="tutor-recent-connections">${recent.length ? recent.map((request) => `<article class="tutor-recent-row"><span class="tutor-student-avatar">${icon(request.status === 'approved' ? 'user' : 'lock', 16)}</span><div><strong>${esc(request.learner)}</strong><small>${request.status === 'approved' ? `${Number(request.completedLessons) || 0} lessons completed` : 'No learner information is shared before consent'}</small></div><span class="tutor-status tutor-status-${esc(request.status)}">${esc(consentStatusLabel(request.status))}</span></article>`).join('') : '<p class="tutor-empty-inline">Your approved connections and consent requests will appear here.</p>'}</div></div>
      <aside class="tutor-panel tutor-today-panel"><span class="tutor-today-icon">${icon('book', 20)}</span><span class="tutor-eyebrow">Teaching resource</span><h2>Today’s Lesson</h2><p>Explore a short Yorùbá greeting lesson and prepare a welcoming first activity.</p><div class="tutor-lesson-progress"><span>Language practice</span><strong>Beginner</strong></div><a class="tutor-button tutor-button-primary" href="#/tutor-lesson" data-route="tutor-lesson">Read Lesson ${icon('arrow', 14)}</a></aside></section>
      <p class="tutor-privacy-note">${icon('shield', 14)} Student names and progress appear only after a parent or guardian approves your request.</p>`);
  }

  function renderTutorFindChild() {
    return renderTutorWorkspace('tutor-find-child', 'Find a Child', `${renderTutorHeading('Build a safe connection', 'Find a Child', 'Request a connection using the email address on a learner’s Idilewa account. A parent or guardian must approve before any learner details are shared.')}
      <div class="tutor-two-column"><section class="tutor-panel tutor-search-panel"><div class="tutor-panel-icon">${icon('search', 20)}</div><span class="tutor-eyebrow">Request a connection</span><h2>Search by learner email</h2><p>For privacy, Idilewa does not reveal whether an email belongs to a learner. If an eligible learner is found, the family will be invited to decide.</p><form data-form="tutor-find-child" class="tutor-find-form"><label for="tutor-child-email">Learner email address<input id="tutor-child-email" type="email" name="childEmail" autocomplete="off" maxlength="254" placeholder="Enter the email used for Idilewa" required /></label><p class="tutor-form-feedback" data-tutor-connection-feedback role="status" aria-live="polite"></p><button class="tutor-button tutor-button-primary" type="submit">${icon('send', 15)} Send parent consent request</button></form></section><aside class="tutor-panel tutor-safeguarding-panel"><span class="tutor-eyebrow">Family-first safeguarding</span><h2>Consent comes first.</h2><ul><li>${icon('check', 15)} Families receive the request directly.</li><li>${icon('lock', 15)} No student details are exposed before approval.</li><li>${icon('check', 15)} Each tutor connection needs separate approval.</li><li>${icon('clock', 15)} Requests expire automatically if unanswered.</li></ul><a href="#/tutor-consent" data-route="tutor-consent" class="tutor-text-link">Review the consent process ${icon('arrow', 14)}</a></aside></div>`);
  }

  function renderTutorStudents() {
    const data = tutorDashboardData || {};
    const learners = Array.isArray(data.learners) ? data.learners : [];
    const requests = Array.isArray(data.requests) ? data.requests : [];
    const cards = learners.map((learner) => `<article class="tutor-student-card"><div class="tutor-student-card-head"><span class="tutor-student-avatar">${esc((learner.name || 'L').trim().charAt(0).toUpperCase())}</span><div><span class="tutor-eyebrow">Parent-approved learner</span><h2>${esc(learner.name || 'Learner')}</h2></div><span class="tutor-status tutor-status-approved">Approved</span></div><div class="tutor-student-metrics"><span><strong>${Number(learner.completedLessons) || 0}</strong><small>Lessons</small></span><span><strong>${Number(learner.codingSessions) || 0}</strong><small>Coding</small></span><span><strong>${Number(learner.voicePractices) || 0}</strong><small>Voice practice</small></span></div><p>${Number(learner.streak) > 0 ? `${Number(learner.streak)}-day learning streak` : 'Learning at their own pace'}</p><a class="tutor-text-link" href="#/tutor-lesson" data-route="tutor-lesson">Prepare a lesson ${icon('arrow', 14)}</a></article>`).join('');
    const pending = requests.filter((request) => request.status !== 'approved').map((request) => `<article class="tutor-request-row"><span class="tutor-student-avatar">${icon('lock', 16)}</span><div><strong>${esc(request.learner || 'Learner')}</strong><small>Requested ${formatDashboardDate(request.requestedAt)} · learner details are not available</small></div><span class="tutor-status tutor-status-${esc(request.status)}">${esc(consentStatusLabel(request.status))}</span></article>`).join('');
    return renderTutorWorkspace('tutor-students', 'My Students', `${renderTutorHeading('Manage your connections', 'My Students', 'See learning progress only for children whose families approved your connection.', `<a class="tutor-button tutor-button-primary" href="#/tutor-find-child" data-route="tutor-find-child">${icon('plus', 15)} Find a Child</a>`)}
      <section class="tutor-student-toolbar"><span>${learners.length} approved ${learners.length === 1 ? 'student' : 'students'}</span><a href="#/tutor-availability" data-route="tutor-availability" class="tutor-text-link">${icon('calendar', 14)} Manage availability</a></section>
      <div class="tutor-student-grid">${cards || '<section class="tutor-empty-state"><span class="tutor-empty-icon">' + icon('people', 23) + '</span><h2>No approved students yet</h2><p>When a family approves a connection request, that learner will appear here.</p><a class="tutor-button tutor-button-primary" href="#/tutor-find-child" data-route="tutor-find-child">Find a Child</a></section>'}</div>
      ${pending ? `<section class="tutor-panel tutor-pending-panel"><div class="tutor-section-heading"><div><span class="tutor-eyebrow">Waiting on family approval</span><h2>Consent requests</h2></div><a href="#/tutor-consent" data-route="tutor-consent" class="tutor-text-link">Consent details ${icon('arrow', 14)}</a></div>${pending}</section>` : ''}`);
  }

  function renderTutorConsent() {
    const requests = Array.isArray(tutorDashboardData?.requests) ? tutorDashboardData.requests : [];
    return renderTutorWorkspace('tutor-consent', 'Consent Form', `${renderTutorHeading('Family approval', 'Consent Form', 'A child’s parent or guardian reviews and approves each tutor connection directly by email. Tutors cannot sign consent on a family’s behalf.')}
      <section class="tutor-consent-layout"><article class="tutor-panel tutor-consent-card"><span class="tutor-consent-mark">${icon('shield', 22)}</span><span class="tutor-eyebrow">How approval works</span><h2>Every connection is specific.</h2><p>When you request a connection, Idilewa emails the learner’s guardian. Nothing is shared until the guardian approves that educator request. The approval is limited to that tutor and learner and can be withdrawn by the family.</p><div class="tutor-consent-steps"><div><span>1</span><p><strong>You request</strong><small>Submit the learner’s account email.</small></p></div><div><span>2</span><p><strong>Guardian reviews</strong><small>The family receives a private approval link.</small></p></div><div><span>3</span><p><strong>Approved learning</strong><small>Only then can the approved learner’s progress appear.</small></p></div></div><a class="tutor-button tutor-button-primary" href="#/tutor-find-child" data-route="tutor-find-child">Request family consent ${icon('arrow', 14)}</a></article><aside class="tutor-panel tutor-consent-aside"><span class="tutor-eyebrow">Your consent requests</span><h2>Connection status</h2>${requests.length ? requests.map((request) => `<article class="tutor-request-row"><span class="tutor-student-avatar">${icon(request.status === 'approved' ? 'check' : 'lock', 15)}</span><div><strong>${esc(request.learner || 'Learner')}</strong><small>${formatDashboardDate(request.requestedAt)}</small></div><span class="tutor-status tutor-status-${esc(request.status)}">${esc(consentStatusLabel(request.status))}</span></article>`).join('') : '<p class="tutor-empty-inline">You have no connection requests yet.</p>'}</aside></section>
      <p class="tutor-privacy-note">${icon('lock', 14)} Consent is recorded and enforced by Idilewa’s secure family approval service, not by this page.</p>`);
  }

  function renderTutorLesson() {
    return renderTutorWorkspace('tutor-lesson', 'Today’s Lesson', `${renderTutorHeading('Prepare a learning activity', 'Today’s Lesson', 'A short, beginner-friendly Yorùbá greeting lesson you can use to plan a supportive session.')}
      <div class="tutor-lesson-layout"><article class="tutor-panel tutor-lesson-card"><div class="tutor-lesson-banner"><img src="/assets/yoruba-educator-woman.jpg" alt="Language educator preparing a learning activity" /><span class="tutor-lesson-label">${icon('book', 14)} BEGINNER · YORÙBÁ</span></div><span class="tutor-eyebrow">Everyday Life · Greetings</span><h2>Start with a warm greeting.</h2><p>Help learners listen to a phrase, notice its meaning and practise it at a pace that feels comfortable.</p><div class="tutor-phrase-card"><small>Phrase to practise</small><strong lang="yo">Ẹ káàárọ̀</strong><span>Good morning</span></div><ol class="tutor-lesson-steps"><li><span>1</span><div><strong>Listen together</strong><p>Say the greeting clearly and invite the learner to listen first.</p></div></li><li><span>2</span><div><strong>Practise gently</strong><p>Give the learner time to repeat or ask a question without pressure.</p></div></li><li><span>3</span><div><strong>Connect the meaning</strong><p>Talk about when this greeting might be used in everyday life.</p></div></li></ol><div class="tutor-lesson-actions"><a class="tutor-button tutor-button-primary" href="#/course?lang=yoruba" data-route="course" data-lang="yoruba">Open Yorùbá course ${icon('arrow', 14)}</a><a class="tutor-button tutor-button-outline" href="#/voice_lessons" data-route="voice_lessons">Explore voice lessons</a></div><p class="tutor-lesson-note">${icon('info', 14)} This is a sample preparation resource, not a scheduled live lesson or a message to a child.</p></article><aside class="tutor-panel tutor-lesson-aside"><span class="tutor-eyebrow">Lesson outline</span><h2>Today’s flow</h2><div class="tutor-outline-item is-complete"><span>${icon('check', 14)}</span><div><strong>Warm welcome</strong><small>Begin with a friendly hello</small></div></div><div class="tutor-outline-item"><span>2</span><div><strong>Learn the phrase</strong><small>Listen, repeat and explore meaning</small></div></div><div class="tutor-outline-item"><span>3</span><div><strong>Reflect together</strong><small>Connect words to daily life</small></div></div><a href="#/tutor-students" data-route="tutor-students" class="tutor-text-link">Back to my students ${icon('arrow', 14)}</a></aside></div>`);
  }

  function renderTutorMessages() {
    return renderTutorWorkspace('tutor-messages', 'Messages', `${renderTutorHeading('Stay connected', 'Messages', 'Family and learner privacy is protected throughout every Idilewa interaction.')}
      <section class="tutor-empty-state tutor-messages-empty"><span class="tutor-empty-icon">${icon('send', 23)}</span><span class="tutor-eyebrow">No messages</span><h2>Messages aren’t enabled in this portal yet.</h2><p>There is no tutor-to-child messaging service here. Connection requests go through the parent or guardian, who can review each request privately.</p><a class="tutor-button tutor-button-outline" href="#/tutor-consent" data-route="tutor-consent">Review family consent ${icon('arrow', 14)}</a></section>`);
  }

  function renderTutorProfile() {
    const user = getCurrentUser() || {};
    const details = getProfileDetails();
    const name = details.name || user.name || '';
    const initial = name.trim().charAt(0).toUpperCase() || 'T';
    return renderTutorWorkspace('tutor-profile', 'My Profile', `${renderTutorHeading('Your educator profile', 'My Profile', 'Manage your name and teaching details. Your sign-in email is managed by your Idilewa account.')}
      <section class="tutor-profile-layout"><aside class="tutor-panel tutor-profile-summary"><span class="tutor-profile-avatar">${esc(initial)}</span><span class="tutor-eyebrow">Verified educator account</span><h2>${esc(name || 'Tutor')}</h2><p>${esc(user.email || '')}</p><span class="tutor-profile-tag">${icon('check', 13)} Educator</span><a class="tutor-button tutor-button-outline" href="#/tutor-availability" data-route="tutor-availability">Manage availability</a></aside><form class="tutor-panel tutor-profile-form" data-form="profile-settings"><span class="tutor-eyebrow">Profile information</span><h2>About you</h2><label>Full Name<input name="name" maxlength="60" required value="${esc(details.name || user.name || '')}" placeholder="Enter your name" /></label><label>Email Address<input type="email" value="${esc(user.email || '')}" readonly /></label><label>Teaching introduction<textarea name="bio" rows="4" maxlength="500" placeholder="Share your teaching approach">${esc(details.bio || '')}</textarea></label><label>Teaching focus<textarea name="goal" rows="3" maxlength="240" placeholder="Languages or skills you teach">${esc(details.goal || '')}</textarea></label><div class="tutor-profile-language"><label>Primary language<select name="language">${LANGUAGES.map((language) => `<option value="${language.id}" ${details.language === language.id ? 'selected' : ''}>${esc(language.name)}</option>`).join('')}</select></label></div><button type="submit" class="tutor-button tutor-button-primary">${icon('check', 14)} Save Profile</button><small>Your profile details are saved to your Idilewa account when signed in.</small></form></section>`);
  }

  function getTutorAvailability() {
    try {
      const saved = JSON.parse(localStorage.getItem(TUTOR_AVAILABILITY_KEY) || '{}');
      return {
        days: Array.isArray(saved.days) ? saved.days.filter((day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(day)) : [],
        start: typeof saved.start === 'string' ? saved.start : '16:00',
        end: typeof saved.end === 'string' ? saved.end : '18:00',
        timezone: typeof saved.timezone === 'string' ? saved.timezone.slice(0, 60) : 'Africa/Lagos'
      };
    } catch (error) {
      console.error('Could not read saved tutor availability.', error);
      return { days: [], start: '16:00', end: '18:00', timezone: 'Africa/Lagos' };
    }
  }

  function renderTutorAvailability() {
    const saved = getTutorAvailability();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return renderTutorWorkspace('tutor-availability', 'Availability', `${renderTutorHeading('Plan your teaching time', 'Availability', 'Set the days and hours you are available. These preferences stay in this browser in this version.')}
      <form class="tutor-panel tutor-availability-form" data-form="tutor-availability"><div class="tutor-section-heading"><div><span class="tutor-eyebrow">Weekly schedule</span><h2>Choose your available days</h2></div></div><div class="tutor-day-grid">${days.map((day) => `<label class="tutor-day-option"><input type="checkbox" name="days" value="${day}" ${saved.days.includes(day) ? 'checked' : ''} /><span>${day}</span></label>`).join('')}</div><div class="tutor-availability-fields"><label>Available from<input type="time" name="start" value="${esc(saved.start)}" required /></label><label>Available until<input type="time" name="end" value="${esc(saved.end)}" required /></label><label>Time zone<select name="timezone">${[['Africa/Lagos','WAT · Lagos'],['Africa/Accra','GMT · Accra'],['Africa/Nairobi','EAT · Nairobi'],['Europe/London','UK time · London'],['America/New_York','Eastern · New York']].map(([value,label]) => `<option value="${value}" ${saved.timezone === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><p class="tutor-form-feedback" data-tutor-availability-feedback role="status"></p><button type="submit" class="tutor-button tutor-button-primary">${icon('check', 14)} Save Changes</button><p class="tutor-lesson-note">${icon('info', 14)} Availability is only a local preference; it does not create appointments or share time slots with families.</p></form>`);
  }

  function getTutorPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(TUTOR_PREFERENCES_KEY) || '{}');
      return { emailUpdates: saved.emailUpdates !== false, lessonReminders: saved.lessonReminders !== false };
    } catch (error) {
      console.error('Could not read saved tutor preferences.', error);
      return { emailUpdates: true, lessonReminders: true };
    }
  }

  function renderTutorSettings() {
    const preferences = getTutorPreferences();
    return renderTutorWorkspace('tutor-settings', 'Settings', `${renderTutorHeading('Account preferences', 'Settings', 'Manage your tutor portal preferences and account security.')}
      <section class="tutor-panel tutor-settings-card"><div class="tutor-section-heading"><div><span class="tutor-eyebrow">Personal preferences</span><h2>Notifications</h2></div></div><div class="tutor-setting-row"><div><strong>Email updates</strong><p>Receive account and connection-request updates through your Idilewa account.</p></div><button type="button" class="tutor-toggle ${preferences.emailUpdates ? 'is-on' : ''}" role="switch" aria-checked="${preferences.emailUpdates}" aria-label="Email updates" data-action="tutor-toggle-preference" data-setting="emailUpdates"><span></span></button></div><div class="tutor-setting-row"><div><strong>Lesson reminders</strong><p>Keep a local preference for reminders about your teaching preparation.</p></div><button type="button" class="tutor-toggle ${preferences.lessonReminders ? 'is-on' : ''}" role="switch" aria-checked="${preferences.lessonReminders}" aria-label="Lesson reminders" data-action="tutor-toggle-preference" data-setting="lessonReminders"><span></span></button></div><div class="tutor-setting-row"><div><strong>Weekly availability</strong><p>Update your teaching availability saved on this browser.</p></div><a class="tutor-button tutor-button-outline tutor-button-small" href="#/tutor-availability" data-route="tutor-availability">Manage</a></div><div class="tutor-setting-row"><div><strong>Account security</strong><p>Sign out of your educator account on this device.</p></div><button type="button" class="tutor-button tutor-button-outline tutor-button-small" data-action="profile-sign-out">Sign out</button></div><p class="tutor-lesson-note">${icon('lock', 14)} Notification switches are saved in this browser; they do not subscribe you to emails or create reminder messages.</p></section>`);
  }

  async function loadTutorPortalData() {
    const page = parseLocation().page;
    if (!['tutor-dashboard', 'tutor-students', 'tutor-find-child', 'tutor-consent'].includes(page) || !isTutorAccount()) return;
    if (tutorDashboardDataPage === page || tutorDashboardLoadPending) return;
    const sequence = ++tutorDashboardLoadSequence;
    tutorDashboardLoadPending = true;
    try {
      const data = await getRoleDashboard('/api/dashboard/educator');
      if (sequence !== tutorDashboardLoadSequence) return;
      tutorDashboardData = data;
      const currentPage = parseLocation().page;
      tutorDashboardDataPage = currentPage;
      if (['tutor-dashboard', 'tutor-students', 'tutor-consent'].includes(currentPage)) render();
    } catch (error) {
      if (sequence !== tutorDashboardLoadSequence) return;
      const currentPage = parseLocation().page;
      tutorDashboardDataPage = currentPage;
      const feedback = currentPage === 'tutor-find-child' ? document.querySelector('[data-tutor-connection-feedback]') : null;
      const message = error instanceof Error ? error.message : 'Your educator data could not be loaded.';
      if (feedback) feedback.textContent = message;
      else showToast(message, 'error');
    } finally {
      if (sequence === tutorDashboardLoadSequence) {
        tutorDashboardLoadPending = false;
        const currentPage = parseLocation().page;
        if (isTutorAccount()
          && ['tutor-dashboard', 'tutor-students', 'tutor-find-child', 'tutor-consent'].includes(currentPage)
          && tutorDashboardDataPage !== currentPage) {
          void loadTutorPortalData();
        }
      }
    }
  }

  function renderTutorPortal(page) {
    if (page === 'tutor') return renderTutorLanding();
    if (page === 'tutor-login') return renderTutorAuth(false);
    if (page === 'tutor-signup') return renderTutorAuth(true);
    if (page === 'tutor-dashboard') return renderTutorDashboard();
    if (page === 'tutor-find-child') return renderTutorFindChild();
    if (page === 'tutor-students') return renderTutorStudents();
    if (page === 'tutor-consent') return renderTutorConsent();
    if (page === 'tutor-lesson') return renderTutorLesson();
    if (page === 'tutor-messages') return renderTutorMessages();
    if (page === 'tutor-profile') return renderTutorProfile();
    if (page === 'tutor-availability') return renderTutorAvailability();
    return renderTutorSettings();
  }

  /* ==========================================================================
     AI Conversation · Speak · Learn · Translate · Practise
     Phrase translation with Plotweaver voice tools.
     ========================================================================== */
  const AICHAT_TABS = [
    { label: 'Home', ico: 'home', route: 'index' },
    { label: 'Learn', ico: 'book', route: 'voice_lessons' },
    { label: 'Practice', ico: 'message', active: true },
    { label: 'Library', ico: 'library', route: 'oral' },
  ];

  const aiConversation = {
    languageId: AI_CONVERSATION_LANGUAGES[0].id,
    showTranslation: true,
    autoSpeak: false,
    rate: 1,
    returnRoute: 'index',
    sequence: 0,
    conversationId: '',
    failedMessage: '',
    messages: [],
  };
  let aiChatListening = false;
  let aiChatStream = null;
  let aiChatRecorder = null;
  let aiChatRecordingChunks = [];
  let aiChatRecordingTimer = null;
  let aiChatRequestController = null;
  let aiChatSpeechController = null;
  let aiChatAudio = null;
  let aiChatAudioUrl = null;
  let aiChatPageActive = false;
  let aiChatLanguageRevision = 0;
  let aiChatRestorePending = false;

  const aiChatLanguage = () => getAiConversationLanguage(aiConversation.languageId);
  const aiChatGuide = () => aiChatLanguage().teacher;

  const aiChatWave = `<svg class="aichat-wave" viewBox="0 0 26 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 9v2M6 5.5v5M10 2.5v11M14 5v6M18 3.5v9M22 7v2"/></svg>`;

  function changeAiChatLanguage(languageId) {
    const nextLanguage = AI_CONVERSATION_LANGUAGES.find((language) => language.id === languageId);
    if (!nextLanguage || nextLanguage.id === aiConversation.languageId) {
      closeAiChatPopovers();
      return;
    }

    aiChatLanguageRevision += 1;
    aiChatRequestController?.abort();
    aiChatRequestController = null;
    aiChatSpeechController?.abort();
    aiChatSpeechController = null;
    releaseAiChatAudio();
    if (aiChatRecordingTimer) window.clearTimeout(aiChatRecordingTimer);
    aiChatRecordingTimer = null;
    if (aiChatRecorder?.state === 'recording') aiChatRecorder.stop();
    aiChatStream?.getTracks().forEach((track) => track.stop());
    aiChatStream = null;
    aiChatRecorder = null;
    aiChatListening = false;
    aiChatRecordingChunks = [];

    aiConversation.languageId = nextLanguage.id;
    aiConversation.conversationId = '';
    aiConversation.failedMessage = '';
    aiConversation.messages = [];
    closeAiChatPopovers();
    render();
    showToast(`AI Conversation is now set to ${nextLanguage.name}.`, 'success');
  }

  function aiChatTimeStamp(value = Date.now()) {
    try {
      return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (error) {
      return '10:25';
    }
  }

  function renderAiChatGuideOptions() {
    return AI_CONVERSATION_LANGUAGES.map((language) => `<button type="button" class="aichat-guide-option" data-action="aichat-select-guide" data-language="${language.id}"${language.id === aiConversation.languageId ? ' aria-current="true"' : ''}>
      ${language.teacher.image ? `<img class="aichat-guide-photo" src="${imageUrl(language.teacher.image)}" alt="" width="30" height="30" loading="lazy" decoding="async" /><span class="aichat-guide-photo-fallback" hidden aria-hidden="true">${esc(language.teacher.name.slice(0, 1))}</span>` : `<span class="aichat-guide-photo-fallback" aria-hidden="true">${esc(language.teacher.name.slice(0, 1))}</span>`}
      <span>${esc(language.teacher.name)}</span>
      ${language.id === aiConversation.languageId ? icon('check', 15) : ''}
    </button>`).join('');
  }

  function renderAiChatGuideCard() {
    const guide = aiChatGuide();
    const language = aiChatLanguage();
    return `<section class="aichat-guide" aria-label="${esc(language.name)} language guide">
      <div class="aichat-guide-media">
        ${guide.image ? `<img class="aichat-guide-photo" src="${imageUrl(guide.image)}" alt="${esc(guide.imageAlt)}" width="480" height="640" loading="eager" decoding="async" /><div class="aichat-guide-photo-fallback" hidden role="img" aria-label="Teacher portrait not yet available">${icon('people', 36)}<span>${esc(guide.name)}</span></div>` : `<div class="aichat-guide-photo-fallback" role="img" aria-label="${esc(guide.name)}">${icon('people', 36)}<span>${esc(guide.name)}</span></div>`}
      </div>
      <div class="aichat-guide-copy">
        <div class="aichat-guide-name">
          <h2>${esc(guide.name)}</h2>
          <span class="aichat-verified" role="img" aria-label="Verified guide">${icon('check', 13)}</span>
        </div>
        <p class="aichat-guide-role"><em>${esc(guide.title)}</em>${aiChatWave}</p>
        <p class="aichat-guide-tagline" lang="${esc(language.speechRecognitionLocale)}">${esc(guide.description)}</p>
        <div class="aichat-guide-change-wrap">
          <button type="button" class="aichat-change-guide" data-action="aichat-change-guide" aria-expanded="false" aria-controls="aichat-guide-menu">${icon('refresh', 15)}<span>Change guide</span>${icon('chevronDown', 15)}</button>
          <div class="aichat-popover aichat-guide-menu" id="aichat-guide-menu" hidden>${renderAiChatGuideOptions()}</div>
        </div>
      </div>
    </section>`;
  }

  function renderAiChatControls() {
    const slowActive = aiConversation.rate === 0.75;
    return `<div class="aichat-controls" role="group" aria-label="Practice this reply">
      <button type="button" class="aichat-chip" data-action="aichat-listen">${icon('volume', 17)}<span>Listen</span></button>
      <button type="button" class="aichat-chip" data-action="aichat-pause">${icon('pause', 17)}<span>Pause</span></button>
      <button type="button" class="aichat-chip" data-action="aichat-translate" aria-pressed="${aiConversation.showTranslation}">${icon('translate', 17)}<span>Translate</span></button>
      <button type="button" class="aichat-chip" data-action="aichat-replay">${icon('refresh', 17)}<span>Replay</span></button>
      <button type="button" class="aichat-chip" data-action="aichat-slow" aria-pressed="${slowActive}">${icon('speed', 17)}<span data-aichat-slow-label>${slowActive ? 'Normal (1x)' : 'Slow (0.75x)'}</span></button>
    </div>`;
  }

  function renderAiChatGuideMessage(message) {
    const sources = Array.isArray(message.sources) && message.sources.length
      ? `<div class="aichat-sources"><strong>Related learning notes</strong><ul>${message.sources.map((source) => {
        let safeUrl = '';
        try {
          const parsed = new URL(source.url);
          if (parsed.protocol === 'https:') safeUrl = parsed.href;
        } catch { /* Invalid source links are shown as plain text. */ }
        return `<li>${safeUrl ? `<a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">${esc(source.title || source.name || 'Language note')}</a>` : `<span>${esc(source.title || source.name || 'Language note')}</span>`}${source.name && source.name !== source.title ? ` <small>${esc(source.name)}</small>` : ''}</li>`;
      }).join('')}</ul></div>`
      : '';
    return `<div class="aichat-row aichat-row-guide" data-message="${esc(message.id)}">
      <span class="aichat-avatar aichat-avatar-bot" aria-hidden="true">${icon('bot', 22)}</span>
      <div class="aichat-bubble aichat-bubble-guide">
        <p class="aichat-translation" lang="${esc(message.textToSpeechLocale || aiChatLanguage().textToSpeechLocale)}">${esc(message.translatedText)}</p>
        ${message.english ? `<p class="aichat-english"><span class="aichat-english-icon" aria-hidden="true">${icon('globe', 16)}</span><span>${esc(message.english)}</span></p>` : ''}
        ${sources}
        <span class="aichat-time">${esc(message.time)}</span>
      </div>
    </div>${message.controls ? renderAiChatControls() : ''}`;
  }

  function renderAiChatUserMessage(message) {
    return `<div class="aichat-row aichat-row-user" data-message="${esc(message.id)}">
      <span class="aichat-time">${esc(message.time)}</span>
      <p class="aichat-bubble aichat-bubble-user">${esc(message.text)}</p>
      <span class="aichat-avatar aichat-avatar-user" aria-hidden="true">${icon('user', 20)}</span>
    </div>`;
  }

  function renderAiConversation() {
    const guide = aiChatGuide();
    const language = aiChatLanguage();
    const focusOptions = AI_CONVERSATION_LANGUAGES.map((option) => `<option value="${esc(option.id)}"${option.id === aiConversation.languageId ? ' selected' : ''}>${esc(option.label)}</option>`).join('');
    const tabs = AICHAT_TABS.map((tab) => {
      const inner = `${icon(tab.ico, 22)}<span>${tab.label}</span>`;
      return tab.route
        ? `<a class="aichat-tab" href="#/${tab.route}" data-route="${tab.route}">${inner}</a>`
        : `<button type="button" class="aichat-tab active" data-action="aichat-focus-input" aria-current="page">${inner}</button>`;
    }).join('');
    const messages = aiConversation.messages
      .map((message) => (message.role === 'guide' ? renderAiChatGuideMessage(message) : renderAiChatUserMessage(message)))
      .join('') || `<p class="aichat-empty-state" lang="${esc(language.speechRecognitionLocale)}">${esc(language.conversationInstructions)}</p>`;
    return `<div class="aichat-page" lang="${esc(language.speechRecognitionLocale)}" data-language-id="${esc(language.id)}" data-translation-target="${esc(language.translationTarget)}" data-speech-recognition-locale="${esc(language.speechRecognitionLocale)}" data-text-to-speech-locale="${esc(language.textToSpeechLocale)}">
      <div class="aichat-canvas" aria-hidden="true"></div>
      <header class="aichat-header">
        <button type="button" class="aichat-iconbtn" data-action="aichat-back" aria-label="Go back">${icon('arrowLeft', 23)}</button>
        <h1 class="aichat-title" lang="${esc(language.speechRecognitionLocale)}">${esc(language.title)}</h1>
        <nav class="aichat-tabs aichat-tabs-desktop" aria-label="Idilewa desktop navigation">${tabs}</nav>
        <div class="aichat-settings-wrap">
          <button type="button" class="aichat-iconbtn aichat-iconbtn-mint" data-action="aichat-settings" aria-expanded="false" aria-controls="aichat-settings" aria-label="Conversation settings">${icon('settings', 21)}</button>
          <div class="aichat-popover aichat-settings-panel" id="aichat-settings" hidden>
            <p class="aichat-popover-title">Conversation settings</p>
            <div class="aichat-switch-row"><span>Show translation</span><button type="button" class="aichat-switch" role="switch" aria-checked="${aiConversation.showTranslation}" aria-label="Show translation" data-action="aichat-toggle-translation"></button></div>
            <div class="aichat-switch-row"><span>Auto-play replies</span><button type="button" class="aichat-switch" role="switch" aria-checked="${aiConversation.autoSpeak}" aria-label="Auto-play replies" data-action="aichat-toggle-autospeak"></button></div>
          </div>
        </div>
      </header>
      <div class="aichat-scroll" id="aichat-scroll">
        <div class="aichat-rail">
          <div class="aichat-focus">
            ${icon('people', 20)}
            <select class="aichat-focus-select" aria-label="${esc(language.name)} language selector">${focusOptions}</select>
            <span class="aichat-focus-chevron" aria-hidden="true">${icon('chevronDown', 18)}</span>
          </div>
          ${renderAiChatGuideCard()}
        </div>
        <div class="aichat-thread${aiConversation.showTranslation ? '' : ' aichat-thread-hide-translation'}" id="aichat-thread" role="log" aria-live="polite" aria-label="Conversation with ${esc(guide.name)}">${messages}</div>
      </div>
      <form class="aichat-composer" data-form="aichat-composer">
        <button type="button" class="aichat-mic" data-action="aichat-mic" aria-label="${language.speechRecognitionSupported ? 'Speak your message' : `Voice input unavailable for ${esc(language.name)}`}"${language.speechRecognitionSupported ? '' : ` title="Voice input for ${esc(language.name)} is not currently available"`}>${icon('mic', 22)}</button>
        <input class="aichat-input" type="text" name="message" lang="${esc(language.speechRecognitionLocale)}" placeholder="${esc(language.inputPlaceholder)}" autocomplete="off" maxlength="1000" aria-label="${esc(language.inputPlaceholder)}" />
        <button type="submit" class="aichat-send" aria-label="Send message">${icon('send', 21)}</button>
        <span class="aichat-status-sr-only" id="aichat-audio-status" role="status" aria-live="polite" aria-atomic="true"></span>
      </form>
      <nav class="aichat-tabs aichat-tabs-mobile" aria-label="Idilewa quick navigation">${tabs}</nav>
    </div>`;
  }

  function aiChatScrollContainers() {
    return ['aichat-thread', 'aichat-scroll']
      .map((id) => document.getElementById(id))
      .filter((el) => {
        if (!el) return false;
        const overflowY = window.getComputedStyle(el).overflowY;
        return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 2;
      });
  }

  function aiChatScrollToLatest(behavior = 'smooth', options = {}) {
    const includePage = options.includePage !== false;
    aiChatScrollContainers().forEach((el) => {
      if (!includePage && el.id === 'aichat-scroll') return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    });
    syncAiChatScrollEdges();
  }

  let aiChatEdgeSyncBound = false;

  function syncAiChatScrollEdges() {
    const thread = document.getElementById('aichat-thread');
    if (thread) thread.classList.toggle('is-scrolled', thread.scrollTop > 4);
    const page = document.getElementById('aichat-scroll');
    if (!page) return;
    const scrollable = page.scrollHeight > page.clientHeight + 2;
    page.classList.toggle('has-more-above', scrollable && page.scrollTop > 4);
    page.classList.toggle(
      'has-more-below',
      scrollable && page.scrollTop + page.clientHeight < page.scrollHeight - 6,
    );
  }

  function initializeAiConversation() {
    aiChatPageActive = true;
    document.querySelectorAll('.aichat-guide-photo').forEach((image) => {
      image.addEventListener('error', () => {
        image.hidden = true;
        if (image.nextElementSibling) image.nextElementSibling.hidden = false;
      }, { once: true });
    });
    aiChatScrollContainers().forEach((el) => {
      el.addEventListener('scroll', syncAiChatScrollEdges, { passive: true });
    });
    if (!aiChatEdgeSyncBound) {
      aiChatEdgeSyncBound = true;
      window.addEventListener('resize', syncAiChatScrollEdges, { passive: true });
    }
    aiChatScrollToLatest('auto', { includePage: window.innerWidth < 620 });
    if (!aiConversation.messages.length && !aiConversation.conversationId && !aiChatRestorePending) {
      void restoreAiChatConversation();
    }
  }

  function aiChatSessionKey(languageId = aiConversation.languageId) {
    return `idilewa-ai-conversation:${languageId}`;
  }

  async function restoreAiChatConversation() {
    let conversationId;
    let accessToken;
    try {
      conversationId = sessionStorage.getItem(aiChatSessionKey());
      if (!conversationId) return;
      aiChatRestorePending = true;
      accessToken = await getOptionalSessionAccessToken();
    } catch (error) {
      aiChatRestorePending = false;
      showToast(error instanceof Error ? error.message : 'Saved conversation storage is unavailable in this browser session.', 'error');
      return;
    }
    if (!accessToken) {
      aiChatRestorePending = false;
      return;
    }

    const languageRevision = aiChatLanguageRevision;
    try {
      const saved = await loadAiChatConversation({ conversationId });
      if (!aiChatPageActive || languageRevision !== aiChatLanguageRevision
        || saved.conversation.language_code !== aiConversation.languageId) return;
      aiConversation.conversationId = saved.conversation.id;
      aiConversation.messages = saved.messages.map((message, index) => ({
        id: `saved-${index}`,
        role: message.role === 'assistant' ? 'guide' : 'user',
        ...(message.role === 'assistant'
          ? { translatedText: message.content, textToSpeechLocale: aiChatLanguage().textToSpeechLocale, controls: index === saved.messages.length - 1 }
          : { text: message.content }),
        time: aiChatTimeStamp(message.created_at),
      }));
      aiConversation.sequence = aiConversation.messages.length;
      render();
      aiChatScrollToLatest('auto');
    } catch (error) {
      if (error?.status === 404) {
        try {
          sessionStorage.removeItem(aiChatSessionKey());
        } catch (storageError) {
          showToast('A saved conversation could not be removed from this browser session.', 'error');
        }
      }
      showToast(error instanceof Error ? error.message : 'Saved conversation could not be restored.', 'error');
    } finally {
      aiChatRestorePending = false;
      if (aiChatPageActive && !aiConversation.messages.length
        && !aiConversation.conversationId && languageRevision !== aiChatLanguageRevision) {
        void restoreAiChatConversation();
      }
    }
  }

  function closeAiChatPopovers() {
    document.querySelectorAll('.aichat-popover').forEach((panel) => { panel.hidden = true; });
    document.querySelectorAll('[data-action="aichat-settings"], [data-action="aichat-change-guide"]').forEach((trigger) => {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function applyAiChatTranslationVisibility() {
    const thread = document.getElementById('aichat-thread');
    if (thread) thread.classList.toggle('aichat-thread-hide-translation', !aiConversation.showTranslation);
    document.querySelectorAll('[data-action="aichat-translate"]').forEach((button) => {
      button.setAttribute('aria-pressed', String(aiConversation.showTranslation));
    });
    document.querySelectorAll('[data-action="aichat-toggle-translation"]').forEach((button) => {
      button.setAttribute('aria-checked', String(aiConversation.showTranslation));
    });
  }

  function aiChatLatestPhrase() {
    const guideMessages = aiConversation.messages.filter((message) => message.role === 'guide');
    return guideMessages[guideMessages.length - 1]?.translatedText || '';
  }

  function releaseAiChatAudio() {
    if (aiChatAudio) {
      aiChatAudio.pause();
      aiChatAudio.removeAttribute('src');
      aiChatAudio.load();
      aiChatAudio = null;
    }
    if (aiChatAudioUrl) {
      URL.revokeObjectURL(aiChatAudioUrl);
      aiChatAudioUrl = null;
    }
  }

  async function aiChatSpeak(text) {
    if (!text.trim()) {
      showToast('Translate a phrase before playing audio.', 'error');
      return false;
    }
    aiChatSpeechController?.abort();
    releaseAiChatAudio();
    const controller = new AbortController();
    aiChatSpeechController = controller;
    try {
      const audioBlob = await synthesizePlotweaverSpeech({
        text,
        language: aiChatLanguage().textToSpeechLanguage,
        signal: controller.signal,
      });
      if (controller.signal.aborted || !aiChatPageActive) return false;
      aiChatAudioUrl = URL.createObjectURL(audioBlob);
      aiChatAudio = new Audio(aiChatAudioUrl);
      aiChatAudio.playbackRate = aiConversation.rate;
      aiChatAudio.addEventListener('ended', releaseAiChatAudio, { once: true });
      await aiChatAudio.play();
      return true;
    } catch (error) {
      if (controller.signal.aborted) return false;
      showToast(error instanceof Error ? error.message : 'Plotweaver could not play this reply.', 'error');
      releaseAiChatAudio();
      return false;
    }
  }

  function appendAiChatMessage(message) {
    const thread = document.getElementById('aichat-thread');
    if (!thread) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = message.role === 'guide' ? renderAiChatGuideMessage(message) : renderAiChatUserMessage(message);
    while (wrapper.firstElementChild) thread.appendChild(wrapper.firstElementChild);
    aiChatScrollToLatest('smooth');
  }

  function showAiChatReplyPending() {
    const thread = document.getElementById('aichat-thread');
    if (!thread) return null;
    thread.querySelector('.aichat-empty-state')?.remove();
    const status = document.createElement('p');
    status.className = 'aichat-pending';
    status.setAttribute('role', 'status');
    status.textContent = 'Thinking of a helpful reply…';
    thread.append(status);
    aiChatScrollToLatest('smooth');
    return status;
  }

  async function submitAiConversationMessage(form) {
    const input = form.querySelector('.aichat-input');
    const text = (input?.value || '').replace(/\s+/g, ' ').trim();
    if (!text) {
      showToast('Type or speak a message before sending.', 'error');
      input?.focus();
      return;
    }
    aiConversation.failedMessage = '';
    document.getElementById('aichat-error')?.remove();
    const submitButton = form.querySelector('button[type="submit"]');
    const pendingMessageId = `pending-${Date.now()}-${aiConversation.sequence + 1}`;
    const pendingMessage = {
      id: pendingMessageId,
      role: 'user',
      text,
      time: aiChatTimeStamp(),
    };
    appendAiChatMessage(pendingMessage);
    const pending = showAiChatReplyPending();
    const controller = new AbortController();
    aiChatRequestController?.abort();
    aiChatRequestController = controller;
    input.disabled = true;
    if (submitButton) submitButton.disabled = true;
    form.setAttribute('aria-busy', 'true');

    const history = aiConversation.messages
      .slice(-10)
      .map((message) => ({
        role: message.role === 'guide' ? 'assistant' : 'user',
        text: message.role === 'guide' ? message.translatedText : message.text,
      }));
    try {
      const result = await sendAiChatMessage({
        language: aiChatLanguage().id,
        message: text,
        conversationId: aiConversation.conversationId,
        messages: history,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      input.value = '';
      pendingMessage.id = `aichat-${aiConversation.sequence + 1}`;
      document.querySelector(`[data-message="${pendingMessageId}"]`)?.setAttribute('data-message', pendingMessage.id);
      aiConversation.sequence += 1;
      aiConversation.messages.push(pendingMessage);
      const guideMessage = {
        id: `aichat-${aiConversation.sequence}`,
        role: 'guide',
        translatedText: result.reply,
        textToSpeechLocale: aiChatLanguage().textToSpeechLocale,
        time: aiChatTimeStamp(),
        controls: true,
        sources: result.sources,
      };
      aiConversation.messages.push(guideMessage);
      appendAiChatMessage(guideMessage);
      if (result.persisted && result.conversationId) {
        aiConversation.conversationId = result.conversationId;
        try {
          sessionStorage.setItem(aiChatSessionKey(), result.conversationId);
        } catch (error) {
          showToast('This conversation is saved to your account but will not reopen automatically in this browser.', 'error');
        }
      }
      if (aiConversation.autoSpeak) void aiChatSpeak(guideMessage.translatedText);
    } catch (error) {
      if (!controller.signal.aborted) {
        document.querySelector(`[data-message="${pendingMessageId}"]`)?.remove();
        aiConversation.failedMessage = text;
        const alert = document.createElement('div');
        alert.className = 'aichat-error';
        alert.id = 'aichat-error';
        alert.setAttribute('role', 'alert');
        const errorMessage = error instanceof Error ? error.message : 'AI Conversation could not complete this message.';
        const copy = document.createElement('p');
        copy.textContent = errorMessage;
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.dataset.action = 'aichat-retry';
        retry.textContent = 'Retry';
        alert.append(copy, retry);
        document.getElementById('aichat-thread')?.append(alert);
        aiChatScrollToLatest('smooth');
      }
    } finally {
      pending?.remove();
      if (aiChatRequestController === controller) aiChatRequestController = null;
      if (input.isConnected) input.disabled = false;
      if (submitButton?.isConnected) submitButton.disabled = false;
      form.removeAttribute('aria-busy');
      if (input.isConnected) input.focus();
    }
  }

  async function startAiChatListening(trigger) {
    const input = document.querySelector('.aichat-input');
    const status = document.getElementById('aichat-audio-status');
    const language = aiChatLanguage();
    const languageRevision = aiChatLanguageRevision;
    if (!language.speechRecognitionSupported) {
      showToast(`Voice input for ${language.name} is not currently available. Type your phrase instead.`, 'error');
      input?.focus();
      return;
    }
    if (aiChatListening && aiChatRecorder?.state === 'recording') {
      aiChatRecorder.stop();
      if (status) status.textContent = 'Transcribing your recording with Plotweaver…';
      trigger?.setAttribute('aria-label', 'Transcribing voice message');
      trigger.disabled = true;
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('Voice recording is not available in this browser. You can type your message instead.', 'error');
      input?.focus();
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!aiChatPageActive || languageRevision !== aiChatLanguageRevision) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const preferredType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      aiChatStream = stream;
      aiChatRecorder = recorder;
      aiChatRecordingChunks = [];
      aiChatListening = true;
      trigger?.classList.add('is-listening');
      trigger?.setAttribute('aria-pressed', 'true');
      trigger?.setAttribute('aria-label', 'Stop recording');
      if (status) status.textContent = 'Listening. Tap the microphone again to finish; audio is transcribed by Plotweaver.';
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size) aiChatRecordingChunks.push(event.data);
      });
      recorder.addEventListener('stop', async () => {
        aiChatStream?.getTracks().forEach((track) => track.stop());
        aiChatStream = null;
        aiChatRecorder = null;
        aiChatListening = false;
        if (aiChatRecordingTimer) window.clearTimeout(aiChatRecordingTimer);
        aiChatRecordingTimer = null;
        trigger?.classList.remove('is-listening');
        trigger?.setAttribute('aria-pressed', 'false');
        trigger?.setAttribute('aria-label', 'Speak your message');
        if (trigger?.isConnected) trigger.disabled = false;
        if (!aiChatPageActive || languageRevision !== aiChatLanguageRevision) return;
        const recording = new Blob(aiChatRecordingChunks, {
          type: aiChatRecordingChunks[0]?.type || recorder.mimeType || 'audio/webm',
        });
        aiChatRecordingChunks = [];
        if (!recording.size) {
          showToast('No audio was recorded. Try again or type your message.', 'error');
          return;
        }
        if (recording.size > 4 * 1024 * 1024) {
          showToast('That recording is larger than 4 MB. Try a shorter voice message.', 'error');
          return;
        }
        try {
          if (status) status.textContent = 'Transcribing your recording with Plotweaver…';
          const result = await transcribeWithPlotweaver(recording, language.speechRecognitionLanguage);
          if (!aiChatPageActive || !input?.isConnected) return;
          input.value = result.text.slice(0, input.maxLength);
          input.focus();
          if (status) status.textContent = 'Transcript ready. Review it, then tap Send.';
          showToast('Voice captured. Review your transcript before sending.', 'success');
        } catch (error) {
          if (status) status.textContent = error instanceof Error ? error.message : 'Plotweaver could not transcribe this recording.';
          showToast(error instanceof Error ? error.message : 'Plotweaver could not transcribe this recording.', 'error');
        }
      });
      recorder.start();
      aiChatRecordingTimer = window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          if (status) status.textContent = 'Recording reached 15 seconds and is being transcribed.';
        }
      }, 15_000);
    } catch (error) {
      aiChatListening = false;
      aiChatRecorder = null;
      aiChatStream = null;
      stream?.getTracks().forEach((track) => track.stop());
      trigger?.classList.remove('is-listening');
      trigger?.setAttribute('aria-pressed', 'false');
      trigger?.setAttribute('aria-label', 'Speak your message');
      showToast(error?.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow access or type your message instead.'
        : 'Voice recording could not start. Check your microphone and try again.', 'error');
      input?.focus();
    }
  }

  async function translateLatestAiChatReply() {
    const message = [...aiConversation.messages].reverse().find((item) => item.role === 'guide');
    if (!message) {
      showToast('There is no guide reply to translate yet.', 'error');
      return;
    }
    if (message.plotweaverTranslated) {
      aiConversation.showTranslation = !aiConversation.showTranslation;
      applyAiChatTranslationVisibility();
      return;
    }

    const button = document.querySelector('[data-action="aichat-translate"]');
    const thread = document.getElementById('aichat-thread');
    if (button) button.disabled = true;
    if (thread) thread.setAttribute('aria-busy', 'true');
    try {
      const translated = aiChatLanguage().translationProvider === 'google'
        ? await translateWithGoogle({
          text: message.translatedText,
          targetLanguage: 'en',
        })
        : await translateWithPlotweaver({
          text: message.translatedText,
          sourceLanguage: aiChatLanguage().translationTarget,
          targetLanguage: 'en',
        });
      const translatedText = translated.translated_text || translated.translated;
      message.english = translatedText;
      message.plotweaverTranslated = true;
      aiConversation.showTranslation = true;
      const row = [...document.querySelectorAll('.aichat-row-guide')]
        .find((element) => element.dataset.message === message.id);
      const translationText = row?.querySelector('.aichat-english span:last-child');
      if (translationText) translationText.textContent = translatedText;
      applyAiChatTranslationVisibility();
      showToast(`Reply translated with ${aiChatLanguage().translationProvider === 'google' ? 'Google Cloud Translation' : 'Plotweaver'}.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Plotweaver could not translate this reply.', 'error');
    } finally {
      if (button?.isConnected) button.disabled = false;
      if (thread?.isConnected) thread.removeAttribute('aria-busy');
    }
  }

  function cleanupAiConversation() {
    aiChatPageActive = false;
    aiChatRequestController?.abort();
    aiChatRequestController = null;
    aiChatSpeechController?.abort();
    aiChatSpeechController = null;
    releaseAiChatAudio();
    if (aiChatRecordingTimer) window.clearTimeout(aiChatRecordingTimer);
    aiChatRecordingTimer = null;
    if (aiChatRecorder?.state === 'recording') aiChatRecorder.stop();
    aiChatStream?.getTracks().forEach((track) => track.stop());
    aiChatStream = null;
    aiChatRecorder = null;
    aiChatListening = false;
    aiChatRecordingChunks = [];
  }

  function handleAiConversationAction(action, el) {
    switch (action) {
      case 'aichat-back':
        navigate(ROUTES.includes(aiConversation.returnRoute) ? aiConversation.returnRoute : 'index');
        break;
      case 'aichat-settings': {
        const panel = document.getElementById('aichat-settings');
        if (!panel) break;
        const willOpen = panel.hidden;
        closeAiChatPopovers();
        panel.hidden = !willOpen;
        el.setAttribute('aria-expanded', String(willOpen));
        break;
      }
      case 'aichat-change-guide': {
        const menu = document.getElementById('aichat-guide-menu');
        if (!menu) break;
        const willOpen = menu.hidden;
        closeAiChatPopovers();
        menu.hidden = !willOpen;
        el.setAttribute('aria-expanded', String(willOpen));
        break;
      }
      case 'aichat-select-guide': {
        changeAiChatLanguage(el.dataset.language);
        break;
      }
      case 'aichat-translate':
        void translateLatestAiChatReply();
        break;
      case 'aichat-toggle-translation':
        aiConversation.showTranslation = !aiConversation.showTranslation;
        applyAiChatTranslationVisibility();
        break;
      case 'aichat-toggle-autospeak':
        aiConversation.autoSpeak = !aiConversation.autoSpeak;
        el.setAttribute('aria-checked', String(aiConversation.autoSpeak));
        showToast(aiConversation.autoSpeak ? 'Replies will play automatically.' : 'Automatic reply playback is off.', 'success');
        break;
      case 'aichat-listen':
      case 'aichat-replay':
        void aiChatSpeak(aiChatLatestPhrase());
        break;
      case 'aichat-pause':
        if (aiChatAudio?.paused) aiChatAudio.play().catch(() => {
          showToast('Plotweaver audio could not resume. Tap Listen to try again.', 'error');
        });
        else if (aiChatAudio) aiChatAudio.pause();
        else showToast('Tap Listen to hear the guide first.', 'error');
        break;
      case 'aichat-slow': {
        aiConversation.rate = aiConversation.rate === 0.75 ? 1 : 0.75;
        const slowed = aiConversation.rate === 0.75;
        document.querySelectorAll('[data-action="aichat-slow"]').forEach((button) => {
          button.setAttribute('aria-pressed', String(slowed));
          const label = button.querySelector('[data-aichat-slow-label]');
          if (label) label.textContent = slowed ? 'Normal (1x)' : 'Slow (0.75x)';
        });
        if (aiChatAudio) aiChatAudio.playbackRate = aiConversation.rate;
        showToast(slowed ? 'Guide playback slowed to 0.75x.' : 'Guide playback back to normal speed.', 'success');
        break;
      }
      case 'aichat-mic':
        startAiChatListening(el);
        break;
      case 'aichat-focus-input':
        document.querySelector('.aichat-input')?.focus();
        break;
      case 'aichat-retry': {
        const input = document.querySelector('.aichat-input');
        const form = input?.closest('form');
        if (input && form && aiConversation.failedMessage) {
          input.value = aiConversation.failedMessage;
          document.getElementById('aichat-error')?.remove();
          form.requestSubmit();
        }
        break;
      }
      default: break;
    }
  }

  function renderParentBrand(className = '') {
    return `<a class="family-brand ${className}" href="#/families" data-route="families" aria-label="Idilewa · Language · Culture · Future">${brandLogo('Idilewa · Language · Culture · Future')}</a>`;
  }

  function renderFamiliesLanding() {
    return `<div class="family-public-page">
      <header class="family-public-header">${renderParentBrand()}<nav aria-label="Family portal navigation">
        <a href="#/index" data-route="index">Home</a><a href="#/families" data-route="families" aria-current="page">For Parents</a><a href="#/tutor" data-route="tutor">For Teachers</a><a href="#/about" data-route="about">About</a>
        <a class="family-login-link" href="#/parent-login" data-route="parent-login">Log in</a><a class="family-button family-button-primary family-button-small" href="#/parent-signup" data-route="parent-signup">Get Started</a>
      </nav></header>
      <main class="family-public-main">
        <section class="family-hero">
          <div class="family-hero-copy"><span class="family-eyebrow"><i></i> Language · Culture · Future</span><h1>Every child deserves a <em>global voice.</em></h1>
            <p>Idilewa helps children learn languages, explore cultures, and build confidence for a brighter future.</p>
            <div class="family-hero-actions"><a class="family-button family-button-primary" href="#/parent-signup" data-route="parent-signup">Get Started ${icon('arrow', 15)}</a><a class="family-button family-button-light" href="#/about" data-route="about">Learn More</a></div>
            <div class="family-hero-points"><span>${icon('book', 15)} Language learning</span><span>${icon('globe', 15)} Cultural exploration</span><span>${icon('sparkles', 15)} Confidence building</span></div>
          </div>
          <div class="family-hero-image"><img src="./assets/home-family-learning.jpg" alt="A parent and children learning together at home" /><span class="family-image-note">Small steps. Big dreams. <span aria-hidden="true">♡</span></span></div>
        </section>
        <section class="family-public-benefits" id="family-how-it-works" aria-label="Family learning benefits">
          <article><span>${icon('book', 17)}</span><div><strong>Language learning</strong><small>Learn words, sounds and everyday phrases.</small></div></article>
          <article><span>${icon('globe', 17)}</span><div><strong>Cultural exploration</strong><small>Discover stories and living traditions.</small></div></article>
          <article><span>${icon('heart', 17)}</span><div><strong>Confidence building</strong><small>Grow with a safe, family-first learning space.</small></div></article>
        </section>
      </main>
      <footer class="family-public-footer">${renderParentBrand()}<a href="#/privacy" data-route="privacy">Privacy</a></footer>
    </div>`;
  }

  function renderParentAuth(signup) {
    const imageAlt = signup
      ? 'A family sharing a language-learning activity'
      : 'A parent and children learning together';
    return `<div class="family-auth-page">
      <header class="family-auth-header">${renderParentBrand()}<a href="#/families" data-route="families">Back to For Parents</a></header>
      <main class="family-auth-layout">
        <section class="family-auth-card"><div class="family-auth-mobile-brand">${renderParentBrand()}</div>
          <span class="family-eyebrow">${signup ? 'Join the Idilewa family' : 'Welcome back'}</span>
          <h1>${signup ? 'Create Parent Account' : 'Parent Login'}</h1>
          <p>${signup ? 'Create your account and give your child the gift of a global voice.' : 'Welcome back. Please log in to your account to continue.'}</p>
          <form class="family-auth-form" data-form="parent-auth" data-mode="${signup ? 'signup' : 'login'}">
            ${signup ? `<label>Full Name<input name="name" autocomplete="name" maxlength="60" placeholder="Enter your full name" required /></label>` : ''}
            <label>Email Address<input id="authEmail" name="email" type="email" autocomplete="email" maxlength="254" placeholder="Enter your email" required /></label>
            ${signup ? `<label>Phone Number<input name="phone" type="tel" autocomplete="tel" maxlength="24" placeholder="Enter your phone number" required /></label>` : ''}
            <label>Password<input id="authPassword" name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" minlength="${signup ? '12' : '1'}" maxlength="128" placeholder="${signup ? 'Create a password' : 'Enter your password'}" required /></label>
            ${signup
              ? '<small class="family-password-note">Use 12 or more characters, including uppercase and lowercase letters, a number and a symbol.</small>'
              : `<div class="family-auth-options"><label class="family-remember"><input type="checkbox" name="remember" /> Remember me</label><a href="#/login?mode=signin" data-route="login" data-mode="signin">Forgot password?</a></div>`}
            <p class="family-auth-error" role="alert" hidden></p>
            <button type="submit" class="family-button family-button-primary family-auth-submit">${signup ? 'Create Account' : 'Login'} ${icon('arrow', 15)}</button>
          </form>
          <p class="family-auth-switch">${signup ? 'Already have an account?' : 'Don’t have an account?'} <a href="#/parent-${signup ? 'login' : 'signup'}" data-route="parent-${signup ? 'login' : 'signup'}">${signup ? 'Log in' : 'Sign up'}</a></p>
          <small class="family-auth-safe-note">${icon('lock', 13)} Your account is protected by Idilewa sign-in.</small>
        </section>
        <aside class="family-auth-art"><img src="./assets/home-family-learning.jpg" alt="${imageAlt}" /><div class="family-auth-art-caption"><span>${signup ? 'Their future' : 'Learn. Grow.'}</span><strong>${signup ? 'matters.' : 'Achieve.'}</strong><i aria-hidden="true">♡</i></div></aside>
      </main>
    </div>`;
  }

  function renderParentWelcome() {
    const signedIn = getCurrentUser()?.role === 'parent';
    return `<div class="family-welcome-page"><main class="family-welcome-card">
      ${renderParentBrand()}<span class="family-welcome-check">${icon('check', 30)}</span>
      <h1>You’re all set!</h1>
      <p>${signedIn
        ? 'Your account is ready. You can now explore your family learning dashboard.'
        : 'Your account has been created. Check your email and confirm your address before logging in.'}</p>
      <a class="family-button family-button-primary" href="#/${signedIn ? 'parent-dashboard' : 'parent-login'}" data-route="${signedIn ? 'parent-dashboard' : 'parent-login'}">${signedIn ? 'Go to Dashboard' : 'Go to Login'} ${icon('arrow', 15)}</a>
      <a class="family-welcome-home" href="#/families" data-route="families">Back to Home</a>
    </main></div>`;
  }

  function renderParentAccess() {
    return `<div class="family-access-page"><section class="family-access-card"><span class="family-access-icon">${icon('lock', 22)}</span><span class="family-eyebrow">Family portal</span><h1>Sign in to continue</h1><p>Your child’s learning information is only available to their verified parent or guardian.</p><div><a class="family-button family-button-primary" href="#/parent-login" data-route="parent-login">Parent Login</a><a class="family-access-link" href="#/parent-signup" data-route="parent-signup">Create a parent account</a></div></section></div>`;
  }

  function renderParentWorkspace(page, content) {
    const user = getCurrentUser();
    const name = user?.name || 'Parent';
    const initial = name.trim().charAt(0).toUpperCase() || 'P';
    const active = page === 'parent-progress' ? 'parent-progress' : page;
    const links = PARENT_PORTAL_LINKS.map((item) => `<a href="#/${item.route}" data-route="${item.route}" class="family-sidebar-link ${item.route === active ? 'is-active' : ''}" ${item.route === active ? 'aria-current="page"' : ''}>${icon(item.icon, 17)}<span>${item.label}</span></a>`).join('');
    return `<div class="family-workspace">
      <aside class="family-sidebar"><a class="family-sidebar-brand" href="#/parent-dashboard" data-route="parent-dashboard" aria-label="Idilewa · Language · Culture · Future">${brandLogo('Idilewa · Language · Culture · Future')}</a>
        <nav class="family-sidebar-nav" aria-label="Family portal">${links}</nav>
        <button type="button" class="family-sidebar-user" data-action="profile-sign-out"><span class="family-avatar">${esc(initial)}</span><span><strong>${esc(name)}</strong><small>Parent</small></span>${icon('arrow', 14)}</button>
      </aside>
      <main class="family-workspace-main"><header class="family-topbar"><div><a href="#/parent-dashboard" data-route="parent-dashboard">Family Portal</a><span>/</span><strong>${esc(LABELS[page] || 'Dashboard')}</strong></div><div class="family-topbar-actions"><span class="family-secure-status"><i></i> Family space</span><a href="#/parent-settings" data-route="parent-settings" class="family-topbar-avatar" aria-label="Open settings">${esc(initial)}</a></div></header>
        <div class="family-workspace-content">${content}</div>
      </main>
    </div>`;
  }

  function renderParentHeading(kicker, title, description, actions = '') {
    return `<header class="family-page-heading"><div><span class="family-eyebrow">${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${actions ? `<div class="family-heading-actions">${actions}</div>` : ''}</header>`;
  }

  function familyChildren() {
    return Array.isArray(parentDashboardData?.children) ? parentDashboardData.children : [];
  }

  function renderParentChildCard(child) {
    const name = typeof child.name === 'string' && child.name.trim() ? child.name.trim() : 'Learner';
    const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
    const childId = encodeURIComponent(String(child.id || ''));
    return `<article class="family-child-card"><div class="family-child-card-head"><span class="family-child-avatar">${esc(initials || 'L')}</span><div><span class="family-child-label">Approved learner</span><h3>${esc(name)}</h3><small>${Number(child.streak) || 0} day learning streak</small></div></div>
      <div class="family-child-stats"><span><strong>${Number(child.completedLessons) || 0}</strong><small>Lessons</small></span><span><strong>${Number(child.codingSessions) || 0}</strong><small>Code sessions</small></span><span><strong>${Number(child.voicePractices) || 0}</strong><small>Voice practices</small></span></div>
      <div class="family-child-card-footer"><span>${Number(child.points) || 0} learning points</span><a class="family-text-link" href="#/parent-progress?child=${childId}" data-route="parent-progress" data-child="${childId}">View Analytics ${icon('arrow', 13)}</a></div></article>`;
  }

  function renderParentDashboard() {
    const children = familyChildren();
    const totalLessons = children.reduce((sum, child) => sum + (Number(child.completedLessons) || 0), 0);
    const totalCoding = children.reduce((sum, child) => sum + (Number(child.codingSessions) || 0), 0);
    const voiceScores = children.map((child) => child.averageVoiceScore).filter(Number.isFinite);
    const averageVoice = voiceScores.length
      ? `${Math.round(voiceScores.reduce((sum, score) => sum + score, 0) / voiceScores.length)}%`
      : '—';
    const name = getCurrentUser()?.name?.trim().split(/\s+/)[0] || 'Parent';
    const stat = (label, value, note, tone = '') => `<article class="family-stat-card ${tone}"><span>${icon('sparkles', 16)} ${label}</span><strong>${value}</strong><small>${note}</small></article>`;
    const childSection = children.length
      ? `<div class="family-child-grid">${children.slice(0, 4).map(renderParentChildCard).join('')}</div>`
      : parentDashboardLoading || parentDashboardError
        ? ''
        : `<div class="family-empty-card"><span>${icon('heart', 23)}</span><h3>Your family space is ready</h3><p>When a child finishes guardian-approved sign-up, their learning progress will appear here.</p><a class="family-button family-button-outline" href="#/consent" data-route="consent">Learn about family approval ${icon('arrow', 14)}</a></div>`;
    const loading = parentDashboardLoading
      ? '<div class="family-data-state" role="status">Loading your family dashboard…</div>'
      : parentDashboardError
        ? `<div class="family-data-state is-error" role="alert">${esc(parentDashboardError)} <button type="button" data-action="parent-refresh">Try again</button></div>`
        : '';
    return renderParentWorkspace('parent-dashboard', `${renderParentHeading('Your family learning space', `Welcome back, ${name}.`, 'Here’s how your children are growing with Idilewa.', `<a class="family-button family-button-outline" href="#/parent-progress" data-route="parent-progress">View Analytics ${icon('arrow', 14)}</a>`)}
      <section class="family-stat-grid" aria-label="Family learning overview">${stat('My Children', children.length, 'Guardian-approved learners')}${stat('Lessons Completed', totalLessons, 'Across your family', 'is-mint')}${stat('Coding Sessions', totalCoding, 'Saved practice attempts', 'is-blue')}${stat('Average Voice Score', averageVoice, 'When available', 'is-peach')}</section>
      <section class="family-dashboard-section"><div class="family-section-heading"><div><span class="family-eyebrow">Your learners</span><h2>My Children</h2></div><a class="family-text-link" href="#/parent-children" data-route="parent-children">View all ${icon('arrow', 13)}</a></div>${loading}${childSection}</section>
      <section class="family-dashboard-lower"><article class="family-insight-card"><span class="family-insight-icon">${icon('globe', 20)}</span><div><span class="family-eyebrow">A little every day</span><h2>Building a global voice, one child at a time.</h2><p>Celebrate each lesson, story and new word along the way.</p></div><a href="#/parent-progress" data-route="parent-progress" aria-label="Open learning analytics">${icon('arrow', 15)}</a></article><aside class="family-activity-panel"><div class="family-section-heading"><div><span class="family-eyebrow">Family updates</span><h2>Connection requests</h2></div><a class="family-text-link" href="#/parent-messages" data-route="parent-messages">View all ${icon('arrow', 13)}</a></div>${renderParentRequestSummary()}</aside></section>`);
  }

  function renderParentRequestSummary() {
    const requests = Array.isArray(parentDashboardData?.connectionRequests) ? parentDashboardData.connectionRequests : [];
    if (parentDashboardLoading && !parentDashboardData) return '<p class="family-empty-inline">Loading your family updates…</p>';
    if (!requests.length) return '<p class="family-empty-inline">No educator connection requests yet.</p>';
    return `<div class="family-request-list">${requests.slice(0, 3).map((request) => `<article><span class="family-request-icon">${icon('school', 15)}</span><div><strong>${esc(request.educator || 'Educator')}</strong><small>${esc(request.learner || 'Learner')} · ${formatDashboardDate(request.requestedAt)}</small></div><span class="family-status">${esc(consentStatusLabel(request.status))}</span></article>`).join('')}</div>`;
  }

  function renderParentChildren() {
    const children = familyChildren();
    const loading = parentDashboardLoading
      ? '<div class="family-data-state" role="status">Loading your approved learners…</div>'
      : parentDashboardError
        ? `<div class="family-data-state is-error" role="alert">${esc(parentDashboardError)} <button type="button" data-action="parent-refresh">Try again</button></div>`
        : '';
    return renderParentWorkspace('parent-children', `${renderParentHeading('Family learning', 'My Children', 'See the learning activity shared with you by your guardian-approved learners.', `<a class="family-button family-button-outline" href="#/consent" data-route="consent">Family approval ${icon('arrow', 14)}</a>`)}
      ${loading}${children.length ? `<div class="family-child-grid family-child-grid-full">${children.map(renderParentChildCard).join('')}</div>` : parentDashboardLoading || parentDashboardError ? '' : `<div class="family-empty-card"><span>${icon('people', 23)}</span><h2>No approved learner accounts yet</h2><p>Child profiles and learning activity are shown only after a guardian-approved account is connected.</p><a class="family-button family-button-primary" href="#/consent" data-route="consent">Explore family approval ${icon('arrow', 14)}</a></div>`}`);
  }

  function renderParentProgress(params = {}) {
    const children = familyChildren();
    const selected = children.find((child) => String(child.id) === String(params.child || ''));
    const loading = parentDashboardLoading
      ? '<div class="family-data-state" role="status">Loading learning progress…</div>'
      : parentDashboardError
        ? `<div class="family-data-state is-error" role="alert">${esc(parentDashboardError)} <button type="button" data-action="parent-refresh">Try again</button></div>`
        : '';
    if (!selected) {
      return renderParentWorkspace('parent-progress', `${renderParentHeading('Celebrate every step', 'Learning Progress', 'Review the learning activity shared by your approved learners.', `<button type="button" class="family-button family-button-outline" data-action="parent-export-report">${icon('download', 14)} Print Report</button>`)}
        ${loading}${children.length ? `<div class="family-progress-list">${children.map((child) => `<a class="family-progress-card" href="#/parent-progress?child=${encodeURIComponent(String(child.id || ''))}" data-route="parent-progress" data-child="${encodeURIComponent(String(child.id || ''))}"><span class="family-child-avatar">${esc((child.name || 'L').trim().charAt(0).toUpperCase())}</span><span><strong>${esc(child.name || 'Learner')}</strong><small>${Number(child.completedLessons) || 0} lessons · ${Number(child.codingSessions) || 0} coding sessions · ${Number(child.voicePractices) || 0} voice practices</small></span>${icon('arrow', 15)}</a>`).join('')}</div>` : parentDashboardLoading || parentDashboardError ? '' : '<div class="family-empty-card"><span>' + icon('layers', 23) + '</span><h2>Progress appears here as children learn</h2><p>Learning activity is only shared after a parent or guardian approves a child account.</p><a class="family-button family-button-outline" href="#/consent" data-route="consent">How family approval works</a></div>'}`);
    }
    const metrics = [
      ['Lessons completed', Number(selected.completedLessons) || 0],
      ['Coding sessions', Number(selected.codingSessions) || 0],
      ['Voice practices', Number(selected.voicePractices) || 0],
    ];
    const maxMetric = Math.max(1, ...metrics.map(([, value]) => value));
    const activity = Array.isArray(selected.recentActivity) ? selected.recentActivity : [];
    return renderParentWorkspace('parent-progress', `${renderParentHeading('Learner overview', `${selected.name || 'Learner'}’s Progress`, 'A closer look at the learning activity saved to this family account.', `<button type="button" class="family-button family-button-outline" data-action="parent-export-report">${icon('download', 14)} Print Report</button>`)}
      ${loading}<div class="family-progress-detail"><section class="family-panel"><div class="family-section-heading"><div><span class="family-eyebrow">Learning activity</span><h2>Practice at a glance</h2></div><a class="family-text-link" href="#/parent-children" data-route="parent-children">All children ${icon('arrow', 13)}</a></div>${metrics.map(([label, value]) => `<div class="family-progress-meter"><div><span>${label}</span><strong>${value}</strong></div><span class="family-progress-track"><i style="width:${Math.round(value / maxMetric * 100)}%"></i></span></div>`).join('')}</section>
      <section class="family-panel"><div class="family-section-heading"><div><span class="family-eyebrow">Latest updates</span><h2>Recent activity</h2></div></div>${activity.length ? `<ol class="family-activity-list">${activity.map((item) => `<li><span class="family-activity-dot">${icon('check', 12)}</span><div><strong>${esc(item.lessonType || 'Learning activity')}</strong><small>${esc(item.lessonId || 'Practice')} · ${formatDashboardDate(item.completedAt)}</small></div></li>`).join('')}</ol>` : '<p class="family-empty-inline">No saved lesson activity yet.</p>'}</section></div>
      <p class="family-privacy-note">${icon('lock', 14)} Progress is shared only after family approval. Report data reflects activity currently saved to this account.</p>`);
  }

  function renderParentMessages() {
    const requests = Array.isArray(parentDashboardData?.connectionRequests) ? parentDashboardData.connectionRequests : [];
    const requestList = parentDashboardLoading && !parentDashboardData
      ? '<p class="family-empty-inline">Loading your family updates…</p>'
      : requests.length
      ? `<div class="family-message-requests">${requests.map((request) => `<article><span class="family-message-icon">${icon('school', 17)}</span><div><strong>${esc(request.educator || 'Educator')} · ${esc(request.learner || 'Learner')}</strong><small>Requested ${formatDashboardDate(request.requestedAt)}</small></div><span class="family-status">${esc(consentStatusLabel(request.status))}</span>${request.status === 'approved' ? `<button type="button" class="family-text-link" data-action="parent-withdraw-consent" data-id="${esc(request.id)}">Withdraw consent</button>` : ''}</article>`).join('')}</div>`
      : '<p class="family-empty-inline">No teacher connection requests yet. You’ll see requests here if a tutor asks to connect with an approved learner.</p>';
    const loading = parentDashboardLoading
      ? '<div class="family-data-state" role="status">Loading your messages…</div>'
      : parentDashboardError
        ? `<div class="family-data-state is-error" role="alert">${esc(parentDashboardError)} <button type="button" data-action="parent-refresh">Try again</button></div>`
        : '';
    return renderParentWorkspace('parent-messages', `${renderParentHeading('Stay connected', 'Messages', 'Review family connection updates and reach the Idilewa team.', `<a class="family-button family-button-primary" href="mailto:idilewa2026@gmail.com?subject=Idilewa%20family%20support">${icon('send', 14)} Contact Idilewa</a>`)}
      ${loading}<section class="family-message-layout"><div class="family-panel"><div class="family-section-heading"><div><span class="family-eyebrow">Family inbox</span><h2>Teacher connection requests</h2></div></div>${requestList}</div>
      <aside class="family-message-note"><span class="family-insight-icon">${icon('lock', 19)}</span><span class="family-eyebrow">Your family’s privacy</span><h2>Direct messages aren’t enabled yet.</h2><p>Teacher requests are managed here. Contact Idilewa if you need help with your family account.</p><a class="family-text-link" href="mailto:idilewa2026@gmail.com?subject=Idilewa%20family%20support">Email our team ${icon('arrow', 13)}</a></aside></section>`);
  }

  function renderParentSettings() {
    const user = getCurrentUser() || {};
    const preferences = getParentPreferences();
    const requests = Array.isArray(parentDashboardData?.connectionRequests) ? parentDashboardData.connectionRequests : [];
    const toggler = (key, title, description) => `<div class="family-setting-row"><div><strong>${title}</strong><p>${description}</p></div><button type="button" class="family-toggle ${preferences[key] ? 'is-on' : ''}" role="switch" aria-checked="${preferences[key]}" aria-label="${title}" data-action="parent-toggle-preference" data-setting="${key}"><span></span></button></div>`;
    const connectionRows = parentDashboardLoading && !parentDashboardData
      ? '<p class="family-empty-inline">Loading your connections…</p>'
      : requests.length
      ? requests.map((request) => `<article class="family-consent-row"><span class="family-request-icon">${icon('school', 15)}</span><div><strong>${esc(request.educator || 'Educator')}</strong><small>${esc(request.learner || 'Learner')} · ${esc(consentStatusLabel(request.status))}</small></div>${request.status === 'approved' ? `<button type="button" class="family-text-link" data-action="parent-withdraw-consent" data-id="${esc(request.id)}">Withdraw consent</button>` : ''}</article>`).join('')
      : '<p class="family-empty-inline">No active educator connections.</p>';
    return renderParentWorkspace('parent-settings', `${renderParentHeading('Manage your account and preferences', 'Settings', 'Keep your family account details up to date.')}
      <div class="family-settings-layout"><section class="family-panel"><div class="family-section-heading"><div><span class="family-eyebrow">Profile information</span><h2>Account details</h2></div></div>
        <form class="family-profile-form" data-form="parent-profile"><label>Full Name<input name="name" value="${esc(user.name || '')}" maxlength="60" autocomplete="name" required /></label><label>Email Address<input type="email" value="${esc(user.email || '')}" readonly /></label><label>Phone Number<input name="phone" type="tel" value="${esc(user.phone || '')}" maxlength="24" autocomplete="tel" /></label><p class="family-auth-error" role="alert" hidden></p><button type="submit" class="family-button family-button-primary">${icon('check', 14)} Save Changes</button></form>
      </section><section class="family-panel family-settings-card"><div class="family-section-heading"><div><span class="family-eyebrow">Personal preferences</span><h2>Notifications</h2></div></div>
        ${toggler('emailUpdates', 'Email updates', 'Receive important account and family connection updates.')}${toggler('learningReminders', 'Learning reminders', 'Keep a local preference for family learning reminders.')}${toggler('weeklySummary', 'Weekly summary', 'Choose whether you would like a weekly learning summary.')}
        <div class="family-settings-subsection"><span class="family-eyebrow">Consent and privacy</span>${connectionRows}<a class="family-text-link" href="#/consent" data-route="consent">Review family approval ${icon('arrow', 13)}</a></div>
        <div class="family-settings-subsection family-account-security"><div><strong>Account security</strong><p>Sign out of your family account on this device.</p></div><button type="button" class="family-button family-button-outline family-button-small" data-action="profile-sign-out">Sign out</button></div>
        <p class="family-privacy-note">${icon('lock', 14)} Preferences are saved in this browser. Notification switches do not subscribe you to emails.</p>
      </section></div>`);
  }

  function renderParentPortal(page, params = {}) {
    if (page === 'families') return renderFamiliesLanding();
    if (page === 'parent-login') return renderParentAuth(false);
    if (page === 'parent-signup') return renderParentAuth(true);
    if (page === 'parent-welcome') return renderParentWelcome();
    if (getCurrentUser()?.role !== 'parent') return renderParentAccess();
    if (page === 'parent-dashboard') return renderParentDashboard();
    if (page === 'parent-children') return renderParentChildren();
    if (page === 'parent-progress') return renderParentProgress(params);
    if (page === 'parent-messages') return renderParentMessages();
    return renderParentSettings();
  }

  async function loadParentPortalData() {
    if (parentDashboardLoading || parentDashboardData || getCurrentUser()?.role !== 'parent') return;
    parentDashboardLoading = true;
    parentDashboardError = '';
    const sequence = ++parentDashboardRequest;
    render();
    try {
      parentDashboardData = await getRoleDashboard('/api/dashboard/parent');
    } catch (error) {
      parentDashboardError = error instanceof Error ? error.message : 'Your family dashboard could not be loaded.';
    } finally {
      if (sequence !== parentDashboardRequest) return;
      parentDashboardLoading = false;
      const page = parseLocation().page;
      if (page.startsWith('parent-') && page !== 'parent-login' && page !== 'parent-signup' && page !== 'parent-welcome') render();
    }
  }

  function renderContact() {
    const supportEmail = 'idilewa2026@gmail.com';
    return `<div class="container route-page information-page">
      <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Contact</strong></div>
      <figure class="contact-team-image"><img src="${imageUrl('contact-idilewa-team.png')}" alt="Contact the Idilewa team. We’re here to listen, help and support your learning journey." /></figure>
      <section class="page-intro-card">
        <span class="section-kicker">Talk with the Idilewa team</span>
        <h1>We’d love to <em>hear from you.</em></h1>
        <p>Questions about language learning, schools, accessibility or the platform are welcome.</p>
        <div class="contact-email-card">
          <div><span class="section-kicker">Email Idilewa</span><a href="mailto:${supportEmail}?subject=Idilewa%20support">${supportEmail}</a></div>
          <a class="button button-primary" href="mailto:${supportEmail}?subject=Idilewa%20support">${icon('send', 16)} Write to us</a>
        </div>
        <p class="contact-privacy-note">${icon('lock', 15)} This opens your email app. Do not include a child’s full name, password, address or other sensitive information.</p>
      </section>
      <section class="information-card-grid" aria-label="Contact topics">
        <article class="profile-card"><span class="section-kicker">Families & learners</span><h2>Learning support</h2><p>Email us about platform access, learning paths or accessibility. For account safety, never send passwords or one-time codes.</p></article>
        <article class="profile-card"><span class="section-kicker">Schools & educators</span><h2>School partnerships</h2><p>School and tutor listings on this site are previews, not confirmed service providers or live bookings.</p></article>
        <article class="profile-card"><span class="section-kicker">Safety & privacy</span><h2>Report a concern</h2><p>Contact us about a platform concern without including sensitive child information. This inbox is not an emergency response service; teacher connections remain disabled until safeguarding is verified.</p></article>
      </section>
    </div>`;
  }

  function renderPrivacy() {
    return `<div class="container route-page information-page">
      <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Privacy policy</strong></div>
      <section class="page-intro-card">
        <span class="section-kicker">Privacy & family safety · draft notice</span>
        <h1>Learning should feel <em>safe.</em></h1>
        <p>This prototype uses browser storage for some learning progress and preferences. This draft is not a substitute for a reviewed privacy policy or a notice approved for children and families.</p>
      </section>
      <section class="information-card-grid privacy-policy-grid">
        <article class="profile-card"><h2>Information in this prototype</h2><p>Some activities store progress, drafts or preferences in this browser. Anyone with access to the same device or browser profile may be able to see that local data.</p></article>
        <article class="profile-card"><h2>Accounts & approval</h2><p>Account services require correctly configured Supabase Auth. Parent approval requires a working server-backed email flow and database migration; until verified, do not use this site to authorize a child account or teacher connection.</p></article>
        <article class="profile-card"><h2>Children’s information</h2><p>Do not enter a child’s full legal name, school, home address, phone number, password reused elsewhere, or other sensitive information into a prototype.</p></article>
        <article class="profile-card"><h2>Third-party services</h2><p>Production integrations may process information through Supabase, Vercel and an email provider. Their final use, retention periods and safeguards must be documented before launch.</p></article>
        <article class="profile-card"><h2>Your choices</h2><p>You can clear this prototype’s browser data through the browser’s site-data settings. That does not delete data held by any separately configured production service.</p></article>
        <article class="profile-card"><h2>Policy status</h2><p>This notice is a transparent development draft, not legal advice. A qualified privacy professional must review it for the countries and age groups the service will support.</p></article>
      </section>
    </div>`;
  }

  function renderLogin() {
    const signUp = state.loginMode === 'signup';
    const passwordResetReady = Boolean(pendingSignin?.purpose === 'password-reset' && passwordResetVerified);
    const pendingOtpEmail = passwordResetReady ? '' : pendingSignin?.email || '';
    const pendingOtpRole = pendingSignin?.role || state.authRole;
    const authStepPending = Boolean(pendingOtpEmail || passwordResetReady);
    const activeGrant = consentCodeIsActive();
    const role = state.authRole === 'adult' ? 'adult' : 'child';
    const isChild = role === 'child';
    const authConfigured = isSupabaseConfigured && Boolean(supabase);

    const loginJourneyStep = activeGrant ? (signUp ? 2 : 1) : 0;
    const authLayers = [
      { title: 'Choose your learning path', text: 'Adults sign in with email and password. Child sign-in passcodes go to the approved parent or guardian.', action: '<button class="auth-layer-action" type="button" data-action="login-mode" data-mode="signup">Create an account</button>' },
      { title: 'Keep child accounts protected', text: 'A parent or guardian approves a child account and receives the child’s one-time sign-in passcodes.', action: routeLink('consent', 'Visit the family consent center') },
      { title: 'Recover your password', text: 'Email verification codes are only used when an adult requests password recovery or a parent receives a child sign-in passcode.', action: '<button class="auth-layer-action" type="button" data-action="request-password-reset">Recover your password</button>' },
      { title: 'Explore before creating an account', text: 'You can browse language lessons and learning activities without signing in. Account features require a configured sign-in service.', action: routeLink('languages', 'Browse learning languages') }
    ];

    const introSplash = authIntroPending ? `<div class="auth-intro-screen">${brandLogo('Idilewa · Language · Culture · Future')}</div>` : '';
    authIntroPending = false;
    return `${introSplash}<div class="container route-page auth-page modern-auth-page">
      <!-- Right-side learning artwork -->
      <aside class="auth-art modern-auth-art" aria-label="Children exploring languages, stories and technology">
        <div class="auth-scene-shell">
          <img class="auth-scene-photo" src="./assets/auth-learning-reference.png" alt="" />
          <div class="auth-globe-orbit" aria-hidden="true">
            <svg class="auth-globe-spin" viewBox="0 0 240 160" role="presentation">
              <defs>
                <radialGradient id="auth-globe-fill" cx="38%" cy="32%" r="70%">
                  <stop offset="0%" stop-color="#c8ffe2" stop-opacity=".38" />
                  <stop offset="100%" stop-color="#138d69" stop-opacity=".16" />
                </radialGradient>
                <clipPath id="auth-globe-clip"><ellipse cx="120" cy="80" rx="110" ry="68" /></clipPath>
              </defs>
              <ellipse cx="120" cy="80" rx="110" ry="68" fill="url(#auth-globe-fill)" stroke="#e1fff0" stroke-opacity=".78" stroke-width="2" />
              <g class="auth-globe-longitudes" clip-path="url(#auth-globe-clip)" fill="none" stroke="#dcfff0" stroke-opacity=".62">
                <ellipse cx="120" cy="80" rx="78" ry="67" stroke-width="1.4" />
                <ellipse cx="120" cy="80" rx="38" ry="67" stroke-width="1.4" />
                <path d="M10 80h220M19 54h202M19 106h202" stroke-width="1.2" />
                <path d="M16 67h208M16 93h208" stroke-opacity=".38" />
              </g>
              <g class="auth-globe-land" clip-path="url(#auth-globe-clip)" fill="#71dda7" fill-opacity=".2">
                <path d="M45 47l12-13 19 2 7 10 15 4 2 11-12 6-5 15-10 7-4 19-10 7-9-13 2-17-8-11 5-12-7-7zM111 38l12-8 17 5 3 10 17 5-3 10-12 5-2 13-11 7-4 16-10 9-8-13 4-15-7-12 5-11-8-8zM160 92l13-5 13 7 9 16-7 11-13-2-7-12-10-4z" />
              </g>
            </svg>
          </div>
          <span class="auth-artifact auth-artifact-book" aria-hidden="true"><span class="auth-artifact-glyph">📖</span></span>
          <span class="auth-artifact auth-artifact-headset" aria-hidden="true"><span class="auth-artifact-glyph">🎧</span></span>
          <span class="auth-artifact auth-artifact-gamepad" aria-hidden="true"><span class="auth-artifact-glyph">🎮</span></span>
          <span class="auth-artifact auth-artifact-mask" aria-hidden="true"><span class="auth-artifact-glyph"><svg viewBox="0 0 32 36" role="presentation"><path d="M5 4 16 1l11 3v14c0 8-5 13-11 17C10 31 5 26 5 18z" fill="#c66d3d" stroke="#77402d" stroke-width="1.5"/><path d="M9 14c2-3 5-3 7 0-2 2-5 3-7 0Zm8 0c2-3 5-3 7 0-2 2-5 3-7 0Z" fill="#f6dfb5"/><circle cx="13" cy="14" r="1.2" fill="#332b24"/><circle cx="20" cy="14" r="1.2" fill="#332b24"/><path d="M12 22c2 2 6 2 8 0" fill="none" stroke="#472b24" stroke-linecap="round" stroke-width="2"/></svg></span></span>
          <span class="auth-artifact auth-artifact-code" aria-hidden="true"><span class="auth-artifact-glyph">&lt;/&gt;</span></span>
          <span class="auth-laptop-screen-glow" aria-hidden="true"></span>
          <span class="auth-laptop-pointer" aria-hidden="true"></span>
        </div>
      </aside>

      <!-- Left-side sign-in and account creation form -->
      <main class="auth-panel modern-auth-panel">
        <div class="auth-brand" aria-label="Idilewa">
          ${brandLogo('Idilewa · Language · Culture · Future')}
        </div>

        <div class="auth-header-block">
          <span class="section-kicker">${signUp ? 'A learning space for you' : 'Good to see you again'}</span>
          <h1 class="auth-title">${passwordResetReady ? 'Choose a new password' : pendingOtpEmail ? 'Check your email' : signUp ? 'Create your account' : 'Welcome back'}</h1>
          <p class="auth-subtitle">${passwordResetReady ? 'Your email is verified. Set a new password to finish recovering your account.' : pendingOtpEmail ? `Enter the verification code sent to ${esc(pendingOtpEmail)}.` : signUp ? 'Save your learning journey and pick up where you left off.' : 'Sign in to continue your language and coding practice.'}</p>
        </div>

        <!-- Mode Selector Switcher Tabs -->
        <div class="auth-toggle modern-auth-tabs" role="tablist" ${authStepPending ? 'hidden' : ''}>
          <button type="button" class="auth-tab-btn ${!signUp ? 'active' : ''}" data-action="login-mode" data-mode="signin" role="tab" aria-selected="${!signUp}">
            ${icon('user', 15)} Sign In
          </button>
          <button type="button" class="auth-tab-btn ${signUp ? 'active' : ''}" data-action="login-mode" data-mode="signup" role="tab" aria-selected="${signUp}">
            ${icon('plus', 15)} Create Account
          </button>
        </div>

        <!-- Persona Role Selector Cards -->
        <!-- Modern Auth Form -->
        ${pendingOtpEmail ? `
        <form class="auth-form modern-auth-form" data-form="signin-otp" data-otp-role="${esc(pendingOtpRole)}">
          <div class="form-group">
            <label for="signupOtp" class="form-label">${pendingSignin?.purpose === 'child-signin' ? 'Parent-issued child sign-in passcode' : 'Password recovery code'}</label>
            <div class="input-with-icon">
              <input id="signupOtp" type="text" name="token" class="form-input" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" minlength="6" maxlength="8" placeholder="6–8 digit code" required />
            </div>
            <p class="form-helper-text">${pendingSignin?.purpose === 'child-signin' ? 'Ask your parent or guardian for the one-time passcode sent to their approved email address.' : 'This code verifies access to your account. You can choose a new password after confirming it.'}</p>
          </div>
          <button class="button button-primary modern-auth-submit" type="submit">
            <span>${pendingSignin?.purpose === 'child-signin' ? 'Sign in as child' : 'Verify code and continue'}</span>${icon('arrow', 16)}
          </button>
          <button class="button button-outline" type="button" data-action="resend-signin-otp">${pendingSignin?.purpose === 'child-signin' ? 'Send another passcode to my parent' : 'Send a new recovery code'}</button>
          <button class="text-link" type="button" data-action="cancel-auth-otp">Back to sign in</button>
        </form>
        ` : passwordResetReady ? `
        <form class="auth-form modern-auth-form" data-form="password-reset">
          <div class="form-group">
            <label for="newAuthPassword" class="form-label">New password</label>
            <input id="newAuthPassword" type="password" name="password" class="form-input" autocomplete="new-password" minlength="12" maxlength="128" placeholder="At least 12 characters" required />
          </div>
          <div class="form-group">
            <label for="confirmAuthPassword" class="form-label">Confirm new password</label>
            <input id="confirmAuthPassword" type="password" name="confirmPassword" class="form-input" autocomplete="new-password" minlength="12" maxlength="128" placeholder="Enter the new password again" required />
            <p class="form-helper-text password-guidance">Use at least 12 characters with uppercase and lowercase letters, a number and a symbol. Example: <span>River!Drum7Leaf</span>. Do not reuse this sample.</p>
          </div>
          <button class="button button-primary modern-auth-submit" type="submit">
            <span>Update password and sign in</span>${icon('arrow', 16)}
          </button>
          <button class="text-link" type="button" data-action="cancel-auth-otp">Cancel recovery</button>
        </form>
        ` : `
        <form class="auth-form modern-auth-form" data-form="login">
          <input type="hidden" name="accountType" id="authAccountType" value="${role}" />

          ${!signUp ? `
          <div class="auth-role-selector">
            <span class="auth-role-label" id="auth-role-label">Choose your account type</span>
            <div class="auth-role-grid" role="radiogroup" aria-labelledby="auth-role-label">
              <button type="button" class="auth-role-card ${isChild ? 'is-selected' : ''}" data-action="auth-role-select" data-role="child" role="radio" aria-checked="${isChild}">
                <span class="role-icon tone-green">${icon('smile', 16)}</span>
                <span class="role-title">Child Learner</span>
                <span class="role-tag">Parent passcode</span>
              </button>
              <button type="button" class="auth-role-card ${!isChild ? 'is-selected' : ''}" data-action="auth-role-select" data-role="adult" role="radio" aria-checked="${!isChild}">
                <span class="role-icon tone-blue">${icon('book', 16)}</span>
                <span class="role-title">Adult / Family</span>
                <span class="role-tag">Email + password</span>
              </button>
            </div>
          </div>
          ` : ''}

          ${signUp ? `
          <div class="auth-role-selector">
            <span class="auth-role-label" id="auth-role-label">Choose an account type</span>
            <div class="auth-role-grid" role="radiogroup" aria-labelledby="auth-role-label">
              <button type="button" class="auth-role-card ${isChild ? 'is-selected' : ''}" data-action="auth-role-select" data-role="child" role="radio" aria-checked="${isChild}">
                <span class="role-icon tone-green">${icon('smile', 16)}</span>
                <span class="role-title">Child Learner</span>
                <span class="role-tag">Guardian approval</span>
              </button>
              <button type="button" class="auth-role-card ${!isChild ? 'is-selected' : ''}" data-action="auth-role-select" data-role="adult" role="radio" aria-checked="${!isChild}">
                <span class="role-icon tone-blue">${icon('book', 16)}</span>
                <span class="role-title">Adult Learner</span>
                <span class="role-tag">No parent consent</span>
              </button>
            </div>
            <p class="form-helper-text">${isChild ? 'Child accounts need a parent or guardian to approve sign-up, then must confirm their email before signing in.' : 'Adult accounts do not need parent or guardian approval, but must confirm their email before signing in.'}</p>
          </div>
          ` : ''}

          ${signUp ? `
          <div class="form-group">
            <label for="authName" class="form-label">Name or Learner Alias</label>
            <div class="input-with-icon">
              <input id="authName" type="text" name="name" class="form-input" autocomplete="name" placeholder="${isChild ? 'e.g. Ayo B. (Use nickname for safety)' : 'e.g. Samuel Owoyemi'}" required />
            </div>
          </div>
          ` : ''}

          <div class="form-group">
            <label for="authEmail" class="form-label">Email address</label>
            <div class="input-with-icon">
              <input id="authEmail" type="email" name="email" class="form-input" autocomplete="email" placeholder="learner@example.com" value="${signUp && verifiedGuardianSignup ? esc(verifiedGuardianSignup.email) : !signUp && signupEmailForSignin ? esc(signupEmailForSignin) : ''}" ${signUp && verifiedGuardianSignup ? 'readonly' : ''} required />
            </div>
            ${!signUp && !isChild ? '<button class="forgot-link" type="button" data-action="resend-signup-confirmation">Resend confirmation email</button>' : ''}
          </div>

          ${signUp || !isChild ? `<div class="form-group">
            <div class="form-label-row">
              <label for="authPassword" class="form-label">Password</label>
              ${!signUp && !isChild ? `<button class="forgot-link" type="button" data-action="request-password-reset">Forgot password?</button>` : ''}
            </div>
            <div class="input-with-icon">
              <input id="authPassword" type="password" name="password" class="form-input" autocomplete="${signUp ? 'new-password' : 'current-password'}" ${signUp ? 'minlength="12" maxlength="128"' : ''} placeholder="${signUp ? 'At least 12 characters' : 'Enter your password'}" required />
              <button type="button" class="password-toggle-btn" data-action="toggle-password-visibility" aria-label="Toggle password visibility">
                ${icon('eye', 16)}
              </button>
            </div>
            ${signUp ? '<p class="form-helper-text password-guidance">Use at least 12 characters, including uppercase and lowercase letters, a number and a symbol. Example: <span>River!Drum7Leaf</span>. Do not reuse this sample.</p>' : ''}
          </div>` : ''}

          ${!signUp && isChild ? '<p class="form-helper-text child-signin-guidance">Your parent or guardian will receive your one-time sign-in passcode at their approved email address.</p>' : ''}

          ${isChild && signUp ? verifiedGuardianSignup ? `
          <div class="form-group consent-form-group guardian-approved-state">
            <p class="form-helper-text">${icon('check', 14)} Parent approval verified for ${esc(verifiedGuardianSignup.email)}. Finish creating the child account before the approval expires.</p>
            <button class="text-link" type="button" data-action="guardian-use-another-email">Use a different learner email</button>
          </div>
          ` : `
          <div class="form-group consent-form-group">
            <label for="guardianEmail" class="form-label">Parent or guardian email</label>
            <div class="input-with-icon">
              <input id="guardianEmail" type="email" name="guardianEmail" class="form-input" autocomplete="email" placeholder="parent@example.com" required />
            </div>
            <p class="form-helper-text">We’ll email your parent or guardian a private approval link. After approval, confirm your email using the link sent to the address above.</p>
            <button class="button button-outline" type="button" data-action="request-guardian-approval">Email my parent for approval</button>
          </div>
          <div class="form-group consent-form-group">
            <label for="guardianAccessCode" class="form-label">Parent-approved one-time passcode</label>
            <div class="input-with-icon">
              <input id="guardianAccessCode" type="text" inputmode="numeric" pattern="[0-9]{6}" name="guardianAccessCode" class="form-input" maxlength="6" autocomplete="one-time-code" placeholder="Enter 6-digit passcode" />
            </div>
            <button class="button button-outline" type="button" data-action="verify-guardian-code">Verify parent-approved code</button>
            <p class="form-helper-text">The code is single-use and expires after 15 minutes. Never share it with anyone.</p>
          </div>
          ` : ''}

          ${signUp ? `
          <label class="consent-check modern-consent-check">
            <input type="checkbox" name="demoOnly" value="yes" required checked />
            <span>I agree to the <a href="#/privacy" data-route="privacy">privacy notice</a> and understand learning progress may be stored in this browser. ${isChild ? 'For a child account, parent approval is required before creation.' : 'Adult accounts do not require parent or guardian approval.'}</span>
          </label>
          ` : `
          <div class="form-options-row">
            <label class="consent-check modern-consent-check">
              <input type="checkbox" name="rememberMe" value="yes" checked />
              <span>Remember this device</span>
            </label>
            <span class="auth-security-badge">${icon('shield', 12)} ${authConfigured ? 'Account protected' : 'Demo preview'}</span>
          </div>
          `}

          <p id="authInlineError" class="auth-inline-error" role="alert" aria-live="polite" hidden></p>
          ${!signUp && isChild ? `
          <button class="button button-primary modern-auth-submit" type="button" data-action="request-child-signin-code" ${authConfigured ? '' : 'disabled'}>
            <span>Send a passcode to my parent</span>${icon('arrow', 16)}
          </button>
          ` : `<button class="button button-primary modern-auth-submit" type="submit" ${authConfigured && (!signUp || !isChild || verifiedGuardianSignup) ? '' : 'disabled'}>
            <span>${signUp ? isChild ? 'Create Child Learning Space' : 'Create Adult Learning Space' : 'Sign In to Learning Space'}</span>
            ${icon('arrow', 16)}
          </button>`}
        </form>
        `}

        <!-- Trust & Privacy Sandbox Note -->
        <div class="auth-safe-note modern-auth-safe-note">
          <span class="safe-note-icon">${icon('lock', 16)}</span>
          <div>
            <strong>${authConfigured ? 'Your account is protected by Supabase Auth' : 'Account service is not configured'}</strong>
            <span>${authConfigured ? pendingOtpEmail ? pendingSignin?.purpose === 'child-signin' ? 'Your parent or guardian receives a one-time passcode for child sign-in.' : 'Password recovery codes are one-time and expire shortly.' : isChild && !signUp ? 'Child sign-in uses a one-time passcode delivered to the approved parent or guardian.' : 'Adults use their email and password. Sign-in does not require an email confirmation code.' : 'Add the Supabase URL and public anon key to the deployment environment to enable sign up and sign in. You can still explore as a guest.'}</span>
          </div>
        </div>

        <div class="auth-separator"><span>or explore freely</span></div>

        <div class="auth-alt-links">
          ${routeLink('languages', 'Continue as Guest without signing in ' + icon('arrow', 14), 'button button-soft auth-guest-btn')}
          <div class="auth-sub-links">
            ${routeLink('consent', `${icon('heart', 13)} Parent & Guardian Consent Center`, 'text-link')}
            ${routeLink('voice_lessons', `${icon('mic', 13)} Voice Lessons`, 'text-link')}
          </div>
        </div>

      </main>
      <section class="auth-layer-guide" aria-labelledby="auth-layer-title" data-access-check-count="${authLayers.length}">
        <div class="auth-layer-guide-heading">
          <span class="section-kicker">Your ${authLayers.length}-step learning journey</span>
          <h2 id="auth-layer-title">A safer, clearer way to get started.</h2>
          <p>Know what to expect from account verification to continuing as a guest.</p>
        </div>
        <div class="auth-layer-guide-grid">
          ${authLayers.map((layer, index) => `
            <article class="auth-layer-card">
              <span>0${index + 1}</span>
              <div>
                <h3>${layer.title}</h3>
                <p>${layer.text}</p>
                ${layer.action}
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    </div>`;
  }

  const TEACHER_PROFILES = [
    {
      id: 'tola-demo', name: 'Tola A.', image: 'yoruba-educator-woman.jpg', language: 'Yorùbá',
      focus: 'Everyday conversation & family phrases', tags: ['speaking'],
      hours: 'Monday & Wednesday · 4:00–7:00 pm WAT', hoursSummary: '6 hours each week', learners: 36,
      bio: 'A sample educator profile focused on warm, practical language practice for beginners. Profile details and numbers are illustrative placeholders for this prototype.'
    },
    {
      id: 'kunle-demo', name: 'Kunle O.', image: 'yoruba-educator-man.jpg', language: 'Yorùbá',
      focus: 'Stories, pronunciation & beginner coding', tags: ['story', 'coding'],
      hours: 'Tuesday & Thursday · 5:00–7:00 pm WAT', hoursSummary: '4 hours each week', learners: 24,
      bio: 'A sample educator profile combining story-led language learning with first steps in coding. Profile details and numbers are illustrative placeholders for this prototype.'
    }
  ];

  const LEARNER_REQUESTS = [
    { id: 'learner-a', label: 'Learner A.', language: 'Yorùbá', level: 'New learner', goal: 'Practice greetings and everyday family phrases.', preferred: 'Weekdays after school · 4:00–5:00 pm WAT', interest: 'Speaking with confidence' },
    { id: 'learner-b', label: 'Learner B.', language: 'Yorùbá', level: 'Growing learner', goal: 'Listen to a short story and learn new words from it.', preferred: 'Saturday morning · 10:00–11:00 am WAT', interest: 'Stories & listening' },
    { id: 'learner-c', label: 'Learner C.', language: 'Yorùbá', level: 'New learner', goal: 'Try a small coding activity with familiar language words.', preferred: 'Tuesday · 5:00–6:00 pm WAT', interest: 'Language + coding' }
  ];

  function makeConsentCode(prefix) {
    let value = 0;
    try {
      const sample = new Uint32Array(1);
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') window.crypto.getRandomValues(sample);
      else sample[0] = Math.floor(Math.random() * 0xffffffff);
      value = sample[0] % 900000 + 100000;
    } catch (_) { value = Math.floor(Math.random() * 900000) + 100000; }
    return `${prefix}-${String(value).padStart(6, '0')}`;
  }
  function consentCodeIsActive() {
    return false;
  }
  function tutorGrantIsActive(tutorId) {
    return false;
  }
  function tutorSessionIsValid() {
    return false;
  }
  function renderConnectTeachers() {
    const visible = TEACHER_PROFILES.filter((teacher) => state.teacherFilter === 'all' || teacher.tags.includes(state.teacherFilter));
    const childVerified = false;
    const banner = `<div class="consent-gate-card is-pending">${icon('shield', 20)}<div><strong>Teacher connections are not enabled.</strong><p>These profiles are illustrative only. Real educator accounts, a secure pairing service and server-side guardian authorization are not configured.</p></div>${routeLink('consent', 'Review family safeguards ' + icon('arrow', 14), 'button button-primary')}</div>`;
    return `<div class="container route-page connection-page connect-teachers-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Connect with Teachers</strong></div>
      <section class="connection-hero"><div class="connection-hero-copy"><span class="section-kicker">For learners & families</span><h1>Find a teacher<br /><em>who helps you grow.</em></h1><p>Explore educator profiles, teaching times and learning experience. A guardian-approved code must match the specific tutor before an introduction can be requested.</p><div class="connection-hero-points"><span>${icon('shield', 16)} Parent-approved introductions</span><span>${icon('clock', 16)} Times shown in WAT</span></div></div><div class="connection-hero-image"><img src="./assets/yoruba-educator-man.jpg" alt="Illustrative Yorùbá educator in traditional agbada holding a language book" /><span>Educator portraits and schedules are illustrative demo content.</span></div></section>
      ${renderStepper(['Choose a tutor', 'Parent signs consent', 'Child verifies code', 'Connect safely'], 0)}
      ${banner}
      <div class="connection-notice">${icon('info', 17)} <div><strong>Sample directory · not real registered teachers.</strong><span>Profiles, schedules and learner counts are placeholders. No one receives a message or booking from this demo. In a real service, permission must be checked on a secure server.</span></div></div>
      <section class="teacher-directory-section"><div class="section-heading"><div><span class="section-kicker">Educator profiles</span><h2>Meet a language guide.</h2><p>Compare teaching focus, weekly availability and sample experience.</p></div><label class="teacher-filter-label" for="teacherFilter">Filter by focus<select id="teacherFilter" data-action="filter-teachers"><option value="all" ${state.teacherFilter === 'all' ? 'selected' : ''}>All teaching styles</option><option value="speaking" ${state.teacherFilter === 'speaking' ? 'selected' : ''}>Conversation</option><option value="story" ${state.teacherFilter === 'story' ? 'selected' : ''}>Stories</option><option value="coding" ${state.teacherFilter === 'coding' ? 'selected' : ''}>Coding + language</option></select></label></div>
        <div class="teacher-profile-grid">${visible.length ? visible.map((teacher) => { const allowed = childVerified && tutorGrantIsActive(teacher.id); const requested = state.teacherRequests.includes(teacher.id); return `<article class="teacher-profile-card"><div class="teacher-profile-photo teacher-profile-initials-photo" role="img" aria-label="Sample educator profile for ${esc(teacher.name)}"><span class="teacher-profile-monogram" aria-hidden="true">${esc(teacher.name.split(' ').map((part) => part[0]).join('').replace(/[^a-z0-9]/gi, ''))}</span><span class="demo-profile-badge">Sample profile</span></div><div class="teacher-profile-body"><div class="teacher-name-row"><div><span class="teacher-language-tag">${esc(teacher.language)} · ${teacher.focus.includes('coding') ? 'Language + code' : 'Language learning'}</span><h3>${esc(teacher.name)}</h3></div><span class="teacher-registered-mark">${icon('check', 13)} Preview</span></div><p class="teacher-focus">${esc(teacher.focus)}</p><div class="teacher-metrics"><div><span>${icon('clock', 15)} Teaching hours</span><strong>${esc(teacher.hoursSummary)}</strong></div><div><span>${icon('people', 15)} Learners supported</span><strong>${teacher.learners} <small>sample</small></strong></div></div><div class="teacher-card-hours"><span>${icon('calendar', 15)} Weekly availability</span><strong>${esc(teacher.hours)}</strong></div><button class="button button-soft teacher-profile-button" type="button" disabled>Unavailable · sample educator</button><button class="text-link teacher-details-link" type="button" data-action="teacher-profile" data-id="${teacher.id}">View sample profile</button></div></article>`; }).join('') : '<div class="teacher-empty">No sample profiles match that focus yet. Try another filter.</div>'}</div>
      </section>      <div class="connection-child-note">${icon('heart', 17)} No teacher connection or request can be made from this preview.</div></div>`;
  }

  function renderConnectStudents() {
    const verified = false;
    const samplePreview = `<details class="locked-sample-preview"><summary>Preview fictional learner cards (read-only)</summary><div class="learner-request-grid">${LEARNER_REQUESTS.map((learner) => `<article class="learner-request-card sample-locked"><div class="learner-card-head"><span class="learner-avatar">${icon('user', 21)}</span><span class="guardian-managed-tag">${icon('lock', 13)} Fictional sample</span></div><span class="teacher-language-tag">${esc(learner.language)} · ${esc(learner.level)}</span><h3>${esc(learner.label)}</h3><div class="learner-goal"><small>Example learning goal</small><p>${esc(learner.goal)}</p></div><div class="learner-request-meta"><span>${icon('sparkles', 14)} ${esc(learner.interest)}</span><span>${icon('calendar', 14)} Sample schedule</span></div><button class="button button-soft" type="button" disabled>Parent code required before assignment</button></article>`).join('')}</div></details>`;
    const assignment = `<article class="tutor-consent-verify-card"><span class="section-kicker">Connections unavailable</span><h2>No learner assignments are shared here.</h2><p>The directory and learner cards are fictional. Real educator identity checks, a server-side pairing service and tutor-scoped guardian approval must be deployed before any code can authorize a connection.</p></article>`;
    return `<div class="container route-page connection-page connect-students-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Connect with Students</strong></div>
      <section class="connection-teacher-hero"><div><span class="section-kicker">For educators · safeguarding first</span><h1>Teach only after<br /><em>guardian approval.</em></h1><p>Every child–tutor pairing needs a signed parent consent form and a code that matches the assigned tutor before a learner can be accepted.</p><div class="hero-actions">${routeLink('connect_teachers', `Open family tutor directory ${icon('arrow', 15)}`, 'button button-outline')}${routeLink('consent', 'How consent works', 'text-link')}</div></div><div class="connection-kids-image"><img src="./assets/yoruba-kids-culture.jpg" alt="Children in traditional Yorùbá attire sharing a language book" /><span>Safety and family permission come first.</span></div></section>
      ${renderStepper(['Review request', 'Parent signs form', 'Validate tutor code', 'Accept assignment'], verified ? 3 : 0)}
      <div class="connection-notice">${icon('shield', 17)} <div><strong>Teacher connections are disabled.</strong><span>No parent code is accepted here and no learner data, message, booking or lesson is exposed.</span></div></div>
      <section class="tutor-approval-workspace">${assignment}</section>
      ${!verified ? samplePreview : ''}
      <div class="connection-child-note">${icon('lock', 17)} Sample learner cards are fictional and read-only.</div></div>`;
  }

  function renderLegacyConsent() {
    const grant = state.consent;
    const active = consentCodeIsActive();
    const pending = !!grant.requestCode && !grant.approved;
    const mode = active ? 'approved' : pending ? 'pending' : 'start';
    const activeStep = mode === 'start' ? 0 : mode === 'pending' ? 1 : (grant.childVerified || grant.tutorValidatedFor ? 3 : 2);
    const assignedTutor = TEACHER_PROFILES.find((item) => item.id === grant.tutorId);
    const tutorOptions = `<option value="">No tutor approved yet</option>${TEACHER_PROFILES.map((teacher) => `<option value="${teacher.id}" ${grant.tutorId === teacher.id ? 'selected' : ''}>${esc(teacher.name)} · ${esc(teacher.language)} · ${esc(teacher.focus)}</option>`).join('')}`;
    let body = '';
    if (mode === 'start') {
      body = `<section class="consent-step-card"><span class="section-kicker">Step 1 · request parent approval</span><h2>Start with a grown-up.</h2><p>Generate a short request reference, then invite a parent or guardian to complete and sign the consent form. The child does not receive an access code until after approval.</p><div class="consent-action-row"><button class="button button-primary" data-action="start-consent-request">Generate parent request code ${icon('arrow', 15)}</button>${routeLink('connect_teachers', 'Choose a tutor first ' + icon('arrow', 14), 'text-link')}</div><div class="consent-safety-callout">${icon('shield', 16)} Use a nickname only. Do not enter a child's full name, date of birth, address, phone number or school.</div></section>`;
    } else if (mode === 'pending') {
      body = `<section class="consent-step-card consent-request-card"><span class="section-kicker">Step 1 · share this request with a parent</span><h2>Parent request is ready.</h2><p>Give this reference to your parent or guardian. They must match it on the form below, read the permissions and add their typed signature before a learner code is issued.</p><div class="request-code-display"><small>Request reference · not an access code</small><strong>${esc(grant.requestCode)}</strong></div><form class="guardian-consent-form" data-form="guardian-consent"><span class="section-kicker">Step 2 · parent or guardian completes and signs</span><label for="guardianRequestCode">Request reference<input id="guardianRequestCode" name="requestCode" type="text" maxlength="12" placeholder="Enter the request reference above" required /></label><label for="learnerAlias">Child's nickname for this demo<input id="learnerAlias" name="learnerAlias" maxlength="28" value="${esc(grant.learnerAlias || 'Young learner')}" required /><small>Please use an alias, not the child's legal name.</small></label><label for="guardianRelationship">I am the child's<select id="guardianRelationship" name="relationship" required><option value="">Choose relationship</option><option>Parent</option><option>Legal guardian</option><option>Other caregiver with authority</option></select></label><label for="guardianSignature">Parent / guardian typed signature<input id="guardianSignature" name="signature" maxlength="80" autocomplete="off" placeholder="Type your name to sign" required /><small>The typed signature is checked in this demo but is not saved.</small></label><div class="guardian-consent-checks"><label class="consent-check"><input type="checkbox" name="accountConsent" value="yes" required /><span>I am authorised to act for this child and approve creation of a supervised learning account.</span></label><label class="consent-check"><input type="checkbox" name="tutorConsent" value="yes" /><span>I approve the child connecting with the specific tutor selected below. I understand other tutors need separate approval.</span></label></div><label for="consentTutor">Tutor approved for this child (optional) <select id="consentTutor" name="tutorId">${tutorOptions}</select></label><p class="consent-form-summary">If you select a tutor, you must also tick the tutor-approval box. If no tutor is assigned, the code can authorize account creation only.</p><label class="consent-check final-consent-check"><input type="checkbox" name="consentRead" value="yes" required /><span>I have read the short consent statement. I understand I can withdraw permission; this offline preview does not create an account, send messages or arrange lessons.</span></label><button class="button button-primary" type="submit">Sign approval & issue child code ${icon('check', 15)}</button></form></section>`;
    } else {
      const expired = !active;
      body = expired
        ? `<section class="consent-step-card"><span class="section-kicker">Approval expired</span><h2>Generate a fresh parent request.</h2><p>This demo code has expired or is no longer active. A guardian must complete a fresh form before a child account or tutor pairing can proceed.</p><button class="button button-primary" data-action="start-consent-request">Create a new request ${icon('arrow', 15)}</button></section>`
        : `<section class="consent-approved-card"><div class="consent-approved-icon">${icon('check', 25)}</div><span class="section-kicker">Step 3 · parent approved</span><h2>Guardian approval is ready.</h2><p>The parent-signed form has approved a supervised account${grant.tutorApproved ? ` and one named tutor: <strong>${esc(assignedTutor?.name || 'Approved tutor')}</strong>` : ' only; tutor access is not approved yet'}.</p><div class="approved-code-display"><small>Child consent code · share only with the learner and approved tutor</small><strong>${esc(grant.approvedCode)}</strong><span>Expires in 7 days · local demo only</span></div><div class="consent-scope-list"><span>${icon('check', 15)} Child account approval: active</span><span>${grant.tutorApproved ? icon('check', 15) : icon('lock', 15)} Tutor approval: ${grant.tutorApproved ? esc(assignedTutor?.name || 'one assigned tutor') : 'not included'}</span></div><div class="consent-action-row"><button class="button button-primary" data-action="consent-signup">Continue to child sign-up ${icon('arrow', 14)}</button>${routeLink('connect_students', 'Tutor code validation ' + icon('arrow', 14), 'button button-outline')}</div><p class="consent-demo-warning">This is an offline prototype: its local code cannot prove who signed or securely notify another device. Do not use it to authorise a real child account or lesson.</p></section>`;
    }
    return `<div class="container route-page consent-page"><div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Parent & guardian consent</strong></div><section class="consent-hero"><div><span class="section-kicker">A clear, family-first safeguard</span><h1>Permission before<br /><em>connection.</em></h1><p>A short guardian-signed form comes first. Only then can the child receive a code—and a tutor must validate that same code before a learner assignment opens.</p><div class="consent-hero-tags"><span>${icon('lock', 15)} No child contact details</span><span>${icon('shield', 15)} Tutor-specific approval</span></div></div><div class="consent-hero-image"><img src="./assets/hero-reader.jpg" alt="A parent and child reviewing a learning activity together" /><span>Illustrative family learning scene.</span></div></section>${renderStepper(['Request code', 'Guardian form', 'Approved code', 'Use & validate'], activeStep)}${body}<div class="consent-four-rules"><article><strong>1. Request</strong><span>A reference is created for the parent to review.</span></article><article><strong>2. Sign</strong><span>Guardian role, permissions and typed signature are required.</span></article><article><strong>3. Issue</strong><span>A child code appears only after the form passes its checks.</span></article><article><strong>4. Validate</strong><span>Signup and a named tutor must validate the approved code.</span></article></div><div class="consent-security-note">${icon('info', 16)} Browser storage is not secure verification. A production service needs a protected backend, guardian identity/authority checks, expiring one-time tokens, audit records, secure account controls and a reviewed child-safeguarding/legal process.</div></div>`;
  }

  function renderConsent() {
    return `<div class="container route-page consent-page">
      <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span><strong>Parent & guardian consent</strong></div>
      <section class="consent-hero">
        <div><span class="section-kicker">A clear, family-first safeguard</span><h1>Permission before<br /><em>connection.</em></h1>
          <p>For child account creation, a parent or guardian receives an email link and must approve before a short-lived code is sent to the learner’s email.</p>
          <div class="consent-hero-tags"><span>${icon('lock', 15)} Approval is server-verified</span><span>${icon('shield', 15)} One-time sign-up code</span></div>
          <button class="button button-primary" data-action="consent-signup">Start child sign-up ${icon('arrow', 15)}</button>
        </div>
        <div class="consent-hero-image"><img src="./assets/hero-reader.jpg" alt="A parent and child reviewing a learning activity together" /><span>Illustrative family learning scene.</span></div>
      </section>
      ${renderStepper(['Learner request', 'Guardian email', 'One-time code', 'Create account'], 0)}
      <section class="consent-step-card">
        <h2>What happens</h2>
        <ol><li>The learner enters their email and a parent or guardian’s email.</li><li>The parent receives a private approval link and makes a separate tutor-consent choice if one is requested.</li><li>After approval, a six-digit code is sent to the learner and expires after 15 minutes.</li><li>The code is checked by the server and the approved account must be created promptly.</li></ol>
        <div class="consent-security-note">${icon('info', 16)} Email approval confirms control of an inbox and the guardian’s declaration; it does not independently prove legal identity or authority. The workflow remains unavailable until Supabase migration and private Vercel provider settings are configured.</div>
      </section>
      <section class="consent-step-card">
        <h2>Teacher connections</h2>
        <p>The displayed teacher directory is sample content. It does not represent verified educators, and no real learner-to-teacher connection, message, booking or lesson should be initiated from this preview. Production matching must use authenticated educator accounts and a separate, server-verified parent approval for the named educator.</p>
        ${routeLink('connect_teachers', 'View sample teacher directory ' + icon('arrow', 14), 'button button-outline')}
      </section>
    </div>`;
  }

  function openTeacherProfile(id) {
    const teacher = TEACHER_PROFILES.find((item) => item.id === id);
    if (!teacher) return;
    const requested = state.teacherRequests.includes(teacher.id);
    document.getElementById('modal-root').innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal-card teacher-modal" role="dialog" aria-modal="true" aria-labelledby="teacherModalTitle"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close profile">${icon('close', 19)}</button><div class="teacher-modal-top"><span class="teacher-modal-avatar" aria-hidden="true">${esc(teacher.name.split(' ').map((part) => part[0]).join(''))}</span><div><span class="section-kicker">Sample educator profile</span><h2 id="teacherModalTitle">${esc(teacher.name)}</h2><p>${esc(teacher.language)} · ${esc(teacher.focus)}</p></div></div><div class="teacher-modal-stats"><div><span>Teaching hours</span><strong>${esc(teacher.hours)}</strong></div><div><span>Learners supported</span><strong>${teacher.learners} <small>sample learners</small></strong></div></div><p class="teacher-modal-bio">${esc(teacher.bio)}</p><div class="teacher-modal-safeguard">${icon('shield', 16)} This preview does not contact this educator. A parent or guardian should review and arrange any real session.</div><button class="button ${requested ? 'button-soft' : 'button-primary'} teacher-request-button" data-action="request-teacher-intro" data-id="${teacher.id}" ${requested ? 'aria-pressed="true"' : ''}>${requested ? 'Request saved in this demo' : 'Request a learning introduction'} ${icon(requested ? 'check' : 'arrow', 15)}</button></section></div>`;
    document.querySelector('.teacher-request-button')?.focus();
  }

  function openLearnerProfile(id) {
    const learner = LEARNER_REQUESTS.find((item) => item.id === id);
    if (!learner) return;
    const replied = state.teacherReplies.includes(learner.id);
    document.getElementById('modal-root').innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal-card learner-modal" role="dialog" aria-modal="true" aria-labelledby="learnerModalTitle"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close profile">${icon('close', 19)}</button><span class="side-card-icon">${icon('people', 21)}</span><span class="section-kicker">Anonymous, family-managed learner preview</span><h2 id="learnerModalTitle">${esc(learner.label)}</h2><div class="learner-modal-facts"><p><strong>Language & level</strong><span>${esc(learner.language)} · ${esc(learner.level)}</span></p><p><strong>Learning goal</strong><span>${esc(learner.goal)}</span></p><p><strong>Preferred time</strong><span>${esc(learner.preferred)}</span></p></div><div class="teacher-modal-safeguard">${icon('shield', 16)} In a real service, a parent or guardian must approve any introduction. Contact details are intentionally not shown.</div><button class="button ${replied ? 'button-soft' : 'button-primary'}" data-action="respond-learner" data-id="${learner.id}">${replied ? 'Interest saved in this demo' : 'Express interest (demo)'} ${icon(replied ? 'check' : 'arrow', 15)}</button></section></div>`;
  }


  
    /* ==========================================================================
       VOICE AFRICAN LANGUAGE TRAINER MODEL DATA & ENGINE (60 LESSONS / 3 TIERS)
       ========================================================================== */
    const TRAINER_CURRICULUM = {"yoruba":{"beginner":[{"id":1,"title":"Lesson 1: Ẹ kú àárọ̀ o, ẹ ṣeé púpọ...","category":"Greetings & Tones","phrase":"Ẹ kú àárọ̀ o, ẹ ṣeé púpọ̀","phonetic":"[ẹ kú àárọ̀ o, ẹ ṣeé púpọ̀]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"kú","tone":"high","pitch":"Mí","freq":330},{"text":"àár","tone":"mid","pitch":"Re","freq":293},{"text":"o","tone":"low","pitch":"Dó","freq":261},{"text":"eé","tone":"high","pitch":"Mí","freq":330},{"text":"púp","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":2,"title":"Lesson 2: Ẹ kú ìrọ̀lẹ́ o, àlàáfíà ...","category":"Greetings & Tones","phrase":"Ẹ kú ìrọ̀lẹ́ o, àlàáfíà ni?","phonetic":"[ẹ kú ìrọ̀lẹ́ o, àlàáfíà ni?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"kú","tone":"high","pitch":"Mí","freq":330},{"text":"ìrl","tone":"mid","pitch":"Re","freq":293},{"text":"o","tone":"low","pitch":"Dó","freq":261},{"text":"àlàáfíà","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":3,"title":"Lesson 3: Orúkọ mi ni Tèmítọ́pẹ́, ...","category":"Greetings & Tones","phrase":"Orúkọ mi ni Tèmítọ́pẹ́, inú mi dùn","phonetic":"[orúkọ mi ni tèmítọ́pẹ́, inú mi dùn]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Orúk","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293},{"text":"ni","tone":"low","pitch":"Dó","freq":261},{"text":"Tèmítp","tone":"high","pitch":"Mí","freq":330},{"text":"inú","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":4,"title":"Lesson 4: Oókan, Èjì, Ẹ́ta, Ẹ́rin,...","category":"Greetings & Tones","phrase":"Oókan, Èjì, Ẹ́ta, Ẹ́rin, Àrún","phonetic":"[oókan, èjì, ẹ́ta, ẹ́rin, àrún]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Oókan","tone":"high","pitch":"Mí","freq":330},{"text":"Èjì","tone":"mid","pitch":"Re","freq":293},{"text":"ta","tone":"low","pitch":"Dó","freq":261},{"text":"rin","tone":"high","pitch":"Mí","freq":330},{"text":"Àrún","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":5,"title":"Lesson 5: Ẹ̀fà, Èje, Ẹ́jọ, Ẹ́sàn, ...","category":"Greetings & Tones","phrase":"Ẹ̀fà, Èje, Ẹ́jọ, Ẹ́sàn, Mẹ́wàá","phonetic":"[ẹ̀fà, èje, ẹ́jọ, ẹ́sàn, mẹ́wàá]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"fà","tone":"high","pitch":"Mí","freq":330},{"text":"Èje","tone":"mid","pitch":"Re","freq":293},{"text":"j","tone":"low","pitch":"Dó","freq":261},{"text":"sàn","tone":"high","pitch":"Mí","freq":330},{"text":"Mwàá","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":6,"title":"Lesson 6: Bàbá mi, Ìyá mi, àti Àbú...","category":"Numbers & Kinship","phrase":"Bàbá mi, Ìyá mi, àti Àbúrò mi","phonetic":"[bàbá mi, ìyá mi, àti àbúrò mi]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Bàbá","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293},{"text":"Ìyá","tone":"low","pitch":"Dó","freq":261},{"text":"mi","tone":"high","pitch":"Mí","freq":330},{"text":"àti","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":7,"title":"Lesson 7: Ẹ jọ̀ọ́, ẹ fún mi ní omi...","category":"Numbers & Kinship","phrase":"Ẹ jọ̀ọ́, ẹ fún mi ní omi tútù","phonetic":"[ẹ jọ̀ọ́, ẹ fún mi ní omi tútù]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"j","tone":"high","pitch":"Mí","freq":330},{"text":"fún","tone":"mid","pitch":"Re","freq":293},{"text":"mi","tone":"low","pitch":"Dó","freq":261},{"text":"ní","tone":"high","pitch":"Mí","freq":330},{"text":"omi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":8,"title":"Lesson 8: Pupa bí iná, Dúdú bí èéd...","category":"Numbers & Kinship","phrase":"Pupa bí iná, Dúdú bí èédú, Funfun","phonetic":"[pupa bí iná, dúdú bí èédú, funfun]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Pupa","tone":"high","pitch":"Mí","freq":330},{"text":"bí","tone":"mid","pitch":"Re","freq":293},{"text":"iná","tone":"low","pitch":"Dó","freq":261},{"text":"Dúdú","tone":"high","pitch":"Mí","freq":330},{"text":"bí","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":9,"title":"Lesson 9: Ilé wa lẹ́wà, ìwé kíkà d...","category":"Numbers & Kinship","phrase":"Ilé wa lẹ́wà, ìwé kíkà dùn mọ́ mi","phonetic":"[ilé wa lẹ́wà, ìwé kíkà dùn mọ́ mi]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ilé","tone":"high","pitch":"Mí","freq":330},{"text":"wa","tone":"mid","pitch":"Re","freq":293},{"text":"lwà","tone":"low","pitch":"Dó","freq":261},{"text":"ìwé","tone":"high","pitch":"Mí","freq":330},{"text":"kíkà","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":10,"title":"Lesson 10: Inú mi dùn púpọ̀ lónìí...","category":"Numbers & Kinship","phrase":"Inú mi dùn púpọ̀ lónìí","phonetic":"[inú mi dùn púpọ̀ lónìí]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Inú","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293},{"text":"dùn","tone":"low","pitch":"Dó","freq":261},{"text":"púp","tone":"high","pitch":"Mí","freq":330},{"text":"lónìí","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":11,"title":"Lesson 11: Bẹ́ẹ̀ni mà, Rárá sir, ẹ ...","category":"Daily Life & Nature","phrase":"Bẹ́ẹ̀ni mà, Rárá sir, ẹ ṣeé púpọ̀","phonetic":"[bẹ́ẹ̀ni mà, rárá sir, ẹ ṣeé púpọ̀]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Bni","tone":"high","pitch":"Mí","freq":330},{"text":"mà","tone":"mid","pitch":"Re","freq":293},{"text":"Rárá","tone":"low","pitch":"Dó","freq":261},{"text":"sir","tone":"high","pitch":"Mí","freq":330},{"text":"eé","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":12,"title":"Lesson 12: Èló ni ẹja tútù yìí, ẹ̀g...","category":"Daily Life & Nature","phrase":"Èló ni ẹja tútù yìí, ẹ̀gbọ́n mi?","phonetic":"[èló ni ẹja tútù yìí, ẹ̀gbọ́n mi?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Èló","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"ja","tone":"low","pitch":"Dó","freq":261},{"text":"tútù","tone":"high","pitch":"Mí","freq":330},{"text":"yìí","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":13,"title":"Lesson 13: Ajá ń gbó, adìyẹ ń kọ, e...","category":"Daily Life & Nature","phrase":"Ajá ń gbó, adìyẹ ń kọ, ewúrẹ́ ń jẹkoríko","phonetic":"[ajá ń gbó, adìyẹ ń kọ, ewúrẹ́ ń jẹkoríko]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ajá","tone":"high","pitch":"Mí","freq":330},{"text":"ń","tone":"mid","pitch":"Re","freq":293},{"text":"gbó","tone":"low","pitch":"Dó","freq":261},{"text":"adìy","tone":"high","pitch":"Mí","freq":330},{"text":"ń","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":14,"title":"Lesson 14: Ọjọ́ Ajé, Ọjọ́ Ìṣẹ́gun, ...","category":"Daily Life & Nature","phrase":"Ọjọ́ Ajé, Ọjọ́ Ìṣẹ́gun, Ọjọ́ Ọ̀sẹ̀","phonetic":"[ọjọ́ ajé, ọjọ́ ìṣẹ́gun, ọjọ́ ọ̀sẹ̀]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"j","tone":"high","pitch":"Mí","freq":330},{"text":"Ajé","tone":"mid","pitch":"Re","freq":293},{"text":"j","tone":"low","pitch":"Dó","freq":261},{"text":"Ìgun","tone":"high","pitch":"Mí","freq":330},{"text":"j","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":15,"title":"Lesson 15: Orí, Ojú, Imú, Ẹnu, Ọwọ́...","category":"Daily Life & Nature","phrase":"Orí, Ojú, Imú, Ẹnu, Ọwọ́ àti Ẹsẹ̀","phonetic":"[orí, ojú, imú, ẹnu, ọwọ́ àti ẹsẹ̀]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Orí","tone":"high","pitch":"Mí","freq":330},{"text":"Ojú","tone":"mid","pitch":"Re","freq":293},{"text":"Imú","tone":"low","pitch":"Dó","freq":261},{"text":"nu","tone":"high","pitch":"Mí","freq":330},{"text":"w","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":16,"title":"Lesson 16: Níbo ni ilé-ìwé wa wà?...","category":"Daily Life & Nature","phrase":"Níbo ni ilé-ìwé wa wà?","phonetic":"[níbo ni ilé-ìwé wa wà?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Níbo","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"iléìwé","tone":"low","pitch":"Dó","freq":261},{"text":"wa","tone":"high","pitch":"Mí","freq":330},{"text":"wà","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":17,"title":"Lesson 17: Ẹ wá jẹun pẹ̀lú wa, oúnj...","category":"Daily Life & Nature","phrase":"Ẹ wá jẹun pẹ̀lú wa, oúnjẹ ti dé","phonetic":"[ẹ wá jẹun pẹ̀lú wa, oúnjẹ ti dé]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"wá","tone":"high","pitch":"Mí","freq":330},{"text":"jun","tone":"mid","pitch":"Re","freq":293},{"text":"plú","tone":"low","pitch":"Dó","freq":261},{"text":"wa","tone":"high","pitch":"Mí","freq":330},{"text":"oúnj","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":18,"title":"Lesson 18: Oòrùn ń ran lọ́wọ́, òjò ...","category":"Daily Life & Nature","phrase":"Oòrùn ń ran lọ́wọ́, òjò ń rọ̀ sorí ilẹ̀","phonetic":"[oòrùn ń ran lọ́wọ́, òjò ń rọ̀ sorí ilẹ̀]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Oòrùn","tone":"high","pitch":"Mí","freq":330},{"text":"ń","tone":"mid","pitch":"Re","freq":293},{"text":"ran","tone":"low","pitch":"Dó","freq":261},{"text":"lw","tone":"high","pitch":"Mí","freq":330},{"text":"òjò","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":19,"title":"Lesson 19: Ó dàárọ̀ o, kí Ọlọ́run ṣ...","category":"Daily Life & Nature","phrase":"Ó dàárọ̀ o, kí Ọlọ́run ṣọ́ wa","phonetic":"[ó dàárọ̀ o, kí ọlọ́run ṣọ́ wa]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ó","tone":"high","pitch":"Mí","freq":330},{"text":"dàár","tone":"mid","pitch":"Re","freq":293},{"text":"o","tone":"low","pitch":"Dó","freq":261},{"text":"kí","tone":"high","pitch":"Mí","freq":330},{"text":"lrun","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":20,"title":"Lesson 20: Ọmọlúwàbí ni mí, èdè mi ...","category":"Daily Life & Nature","phrase":"Ọmọlúwàbí ni mí, èdè mi lọlá mi!","phonetic":"[ọmọlúwàbí ni mí, èdè mi lọlá mi!]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"mlúwàbí","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"mí","tone":"low","pitch":"Dó","freq":261},{"text":"èdè","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1}],"intermediate":[{"id":21,"title":"Lesson 21: Àlọ́ o! Àlọ̀! Àlọ́ mi dá...","category":"Conversations & Culture","phrase":"Àlọ́ o! Àlọ̀! Àlọ́ mi dá fìrìgbàgbò...","phonetic":"[àlọ́ o! àlọ̀! àlọ́ mi dá fìrìgbàgbò...]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Àl","tone":"high","pitch":"Mí","freq":330},{"text":"o","tone":"mid","pitch":"Re","freq":293},{"text":"Àl","tone":"low","pitch":"Dó","freq":261},{"text":"Àl","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":22,"title":"Lesson 22: Bá mi lọ, ba lórí igi, b...","category":"Conversations & Culture","phrase":"Bá mi lọ, ba lórí igi, bà sorí ilẹ̀","phonetic":"[bá mi lọ, ba lórí igi, bà sorí ilẹ̀]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Bá","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293},{"text":"l","tone":"low","pitch":"Dó","freq":261},{"text":"ba","tone":"high","pitch":"Mí","freq":330},{"text":"lórí","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":23,"title":"Lesson 23: Aṣọ-òkè lẹ́wà, agbádá bà...","category":"Conversations & Culture","phrase":"Aṣọ-òkè lẹ́wà, agbádá bàbá gùn dáadáa","phonetic":"[aṣọ-òkè lẹ́wà, agbádá bàbá gùn dáadáa]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Aòkè","tone":"high","pitch":"Mí","freq":330},{"text":"lwà","tone":"mid","pitch":"Re","freq":293},{"text":"agbádá","tone":"low","pitch":"Dó","freq":261},{"text":"bàbá","tone":"high","pitch":"Mí","freq":330},{"text":"gùn","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":24,"title":"Lesson 24: Mo fẹ́ràn eré ayò àti or...","category":"Conversations & Culture","phrase":"Mo fẹ́ràn eré ayò àti orin kíkọ","phonetic":"[mo fẹ́ràn eré ayò àti orin kíkọ]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Mo","tone":"high","pitch":"Mí","freq":330},{"text":"fràn","tone":"mid","pitch":"Re","freq":293},{"text":"eré","tone":"low","pitch":"Dó","freq":261},{"text":"ayò","tone":"high","pitch":"Mí","freq":330},{"text":"àti","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":25,"title":"Lesson 25: Ká-biyè-ésí o, Ká-biyè-é...","category":"Conversations & Culture","phrase":"Ká-biyè-ésí o, Ká-biyè-ésí o!","phonetic":"[ká-biyè-ésí o, ká-biyè-ésí o!]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kábiyèésí","tone":"high","pitch":"Mí","freq":330},{"text":"o","tone":"mid","pitch":"Re","freq":293},{"text":"Kábiyèésí","tone":"low","pitch":"Dó","freq":261},{"text":"o","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":26,"title":"Lesson 26: Ẹ fún mi ní amàlà, gbẹ̀g...","category":"Conversations & Culture","phrase":"Ẹ fún mi ní amàlà, gbẹ̀gìrì àti ewédú","phonetic":"[ẹ fún mi ní amàlà, gbẹ̀gìrì àti ewédú]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"fún","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293},{"text":"ní","tone":"low","pitch":"Dó","freq":261},{"text":"amàlà","tone":"high","pitch":"Mí","freq":330},{"text":"gbgìrì","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":27,"title":"Lesson 27: Aago mélòó ló lù lọ́wọ́ ...","category":"Conversations & Culture","phrase":"Aago mélòó ló lù lọ́wọ́ yìí?","phonetic":"[aago mélòó ló lù lọ́wọ́ yìí?]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Aago","tone":"high","pitch":"Mí","freq":330},{"text":"mélòó","tone":"mid","pitch":"Re","freq":293},{"text":"ló","tone":"low","pitch":"Dó","freq":261},{"text":"lù","tone":"high","pitch":"Mí","freq":330},{"text":"lw","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":28,"title":"Lesson 28: Màmá Àgbà ń kọ́ mi ní or...","category":"Conversations & Culture","phrase":"Màmá Àgbà ń kọ́ mi ní orin ìbílẹ̀","phonetic":"[màmá àgbà ń kọ́ mi ní orin ìbílẹ̀]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Màmá","tone":"high","pitch":"Mí","freq":330},{"text":"Àgbà","tone":"mid","pitch":"Re","freq":293},{"text":"ń","tone":"low","pitch":"Dó","freq":261},{"text":"k","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":29,"title":"Lesson 29: Èkó gbajúmọ̀, Ìbàdàn ní ...","category":"Conversations & Culture","phrase":"Èkó gbajúmọ̀, Ìbàdàn ní orí-òkè méje","phonetic":"[èkó gbajúmọ̀, ìbàdàn ní orí-òkè méje]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Èkó","tone":"high","pitch":"Mí","freq":330},{"text":"gbajúm","tone":"mid","pitch":"Re","freq":293},{"text":"Ìbàdàn","tone":"low","pitch":"Dó","freq":261},{"text":"ní","tone":"high","pitch":"Mí","freq":330},{"text":"oríòkè","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":30,"title":"Lesson 30: Èdè Yorùbá àti ìmọ̀-ẹ̀rọ...","category":"Conversations & Culture","phrase":"Èdè Yorùbá àti ìmọ̀-ẹ̀rọ kọ̀mpútà papọ̀","phonetic":"[èdè yorùbá àti ìmọ̀-ẹ̀rọ kọ̀mpútà papọ̀]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Èdè","tone":"high","pitch":"Mí","freq":330},{"text":"Yorùbá","tone":"mid","pitch":"Re","freq":293},{"text":"àti","tone":"low","pitch":"Dó","freq":261},{"text":"ìmr","tone":"high","pitch":"Mí","freq":330},{"text":"kmpútà","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":31,"title":"Lesson 31: Ayẹyẹ Ọdún Iṣu Tuntun ti...","category":"Rhythm & Community","phrase":"Ayẹyẹ Ọdún Iṣu Tuntun ti dé pẹ̀lú ayọ̀","phonetic":"[ayẹyẹ ọdún iṣu tuntun ti dé pẹ̀lú ayọ̀]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ayy","tone":"high","pitch":"Mí","freq":330},{"text":"dún","tone":"mid","pitch":"Re","freq":293},{"text":"Iu","tone":"low","pitch":"Dó","freq":261},{"text":"Tuntun","tone":"high","pitch":"Mí","freq":330},{"text":"ti","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":32,"title":"Lesson 32: Ẹ jọ̀ọ́, ẹ dín owó rẹ̀ k...","category":"Rhythm & Community","phrase":"Ẹ jọ̀ọ́, ẹ dín owó rẹ̀ kù fún mi díẹ̀","phonetic":"[ẹ jọ̀ọ́, ẹ dín owó rẹ̀ kù fún mi díẹ̀]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"j","tone":"high","pitch":"Mí","freq":330},{"text":"dín","tone":"mid","pitch":"Re","freq":293},{"text":"owó","tone":"low","pitch":"Dó","freq":261},{"text":"r","tone":"high","pitch":"Mí","freq":330},{"text":"kù","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":33,"title":"Lesson 33: Lojú tèmi, èdè wa ni orí...","category":"Rhythm & Community","phrase":"Lojú tèmi, èdè wa ni orísun ọgbọ́n wa","phonetic":"[lojú tèmi, èdè wa ni orísun ọgbọ́n wa]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Lojú","tone":"high","pitch":"Mí","freq":330},{"text":"tèmi","tone":"mid","pitch":"Re","freq":293},{"text":"èdè","tone":"low","pitch":"Dó","freq":261},{"text":"wa","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":34,"title":"Lesson 34: Oyin dùn, ata ta, ewúrẹ́...","category":"Rhythm & Community","phrase":"Oyin dùn, ata ta, ewúrẹ́ dùn mọ́ ẹnu","phonetic":"[oyin dùn, ata ta, ewúrẹ́ dùn mọ́ ẹnu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Oyin","tone":"high","pitch":"Mí","freq":330},{"text":"dùn","tone":"mid","pitch":"Re","freq":293},{"text":"ata","tone":"low","pitch":"Dó","freq":261},{"text":"ta","tone":"high","pitch":"Mí","freq":330},{"text":"ewúr","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":35,"title":"Lesson 35: Ẹ má bìnú o, àlàáfíà ni ...","category":"Rhythm & Community","phrase":"Ẹ má bìnú o, àlàáfíà ni a ó máa rí","phonetic":"[ẹ má bìnú o, àlàáfíà ni a ó máa rí]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"má","tone":"high","pitch":"Mí","freq":330},{"text":"bìnú","tone":"mid","pitch":"Re","freq":293},{"text":"o","tone":"low","pitch":"Dó","freq":261},{"text":"àlàáfíà","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":36,"title":"Lesson 36: Gba ọwọ́ ọ̀tún, yà sí ọw...","category":"Rhythm & Community","phrase":"Gba ọwọ́ ọ̀tún, yà sí ọwọ́ òsì lẹ́bàá ọjà","phonetic":"[gba ọwọ́ ọ̀tún, yà sí ọwọ́ òsì lẹ́bàá ọjà]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Gba","tone":"high","pitch":"Mí","freq":330},{"text":"w","tone":"mid","pitch":"Re","freq":293},{"text":"tún","tone":"low","pitch":"Dó","freq":261},{"text":"yà","tone":"high","pitch":"Mí","freq":330},{"text":"sí","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":37,"title":"Lesson 37: Kìnnìún ní ọba ẹranko, e...","category":"Rhythm & Community","phrase":"Kìnnìún ní ọba ẹranko, erin ní baba igbó","phonetic":"[kìnnìún ní ọba ẹranko, erin ní baba igbó]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kìnnìún","tone":"high","pitch":"Mí","freq":330},{"text":"ní","tone":"mid","pitch":"Re","freq":293},{"text":"ba","tone":"low","pitch":"Dó","freq":261},{"text":"ranko","tone":"high","pitch":"Mí","freq":330},{"text":"erin","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":38,"title":"Lesson 38: Ẹ dárí jì mí, mi ò ní ṣe...","category":"Rhythm & Community","phrase":"Ẹ dárí jì mí, mi ò ní ṣe bẹ́ẹ̀ mọ́","phonetic":"[ẹ dárí jì mí, mi ò ní ṣe bẹ́ẹ̀ mọ́]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"dárí","tone":"high","pitch":"Mí","freq":330},{"text":"jì","tone":"mid","pitch":"Re","freq":293},{"text":"mí","tone":"low","pitch":"Dó","freq":261},{"text":"mi","tone":"high","pitch":"Mí","freq":330},{"text":"ò","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":39,"title":"Lesson 39: Bùsọ́kùn ọmọ mi, orun re...","category":"Rhythm & Community","phrase":"Bùsọ́kùn ọmọ mi, orun rere lo máa sùn","phonetic":"[bùsọ́kùn ọmọ mi, orun rere lo máa sùn]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Bùskùn","tone":"high","pitch":"Mí","freq":330},{"text":"m","tone":"mid","pitch":"Re","freq":293},{"text":"mi","tone":"low","pitch":"Dó","freq":261},{"text":"orun","tone":"high","pitch":"Mí","freq":330},{"text":"rere","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":40,"title":"Lesson 40: Èdè mi kò ní parun lẹ́nu...","category":"Rhythm & Community","phrase":"Èdè mi kò ní parun lẹ́nu mi láé!","phonetic":"[èdè mi kò ní parun lẹ́nu mi láé!]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Èdè","tone":"high","pitch":"Mí","freq":330},{"text":"mi","tone":"mid","pitch":"Re","freq":293},{"text":"kò","tone":"low","pitch":"Dó","freq":261},{"text":"ní","tone":"high","pitch":"Mí","freq":330},{"text":"parun","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2}],"advanced":[{"id":41,"title":"Lesson 41: Sùúrù lérè, àgbà tó ní s...","category":"Classical Proverbs","phrase":"Sùúrù lérè, àgbà tó ní sùúrù ohun gbogbo ló ní","phonetic":"[sùúrù lérè, àgbà tó ní sùúrù ohun gbogbo ló ní]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Sùúrù","tone":"high","pitch":"Mí","freq":330},{"text":"lérè","tone":"mid","pitch":"Re","freq":293},{"text":"àgbà","tone":"low","pitch":"Dó","freq":261},{"text":"tó","tone":"high","pitch":"Mí","freq":330},{"text":"ní","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":42,"title":"Lesson 42: Àgbájọ ọwọ́ la fi ń sọ̀y...","category":"Classical Proverbs","phrase":"Àgbájọ ọwọ́ la fi ń sọ̀yà, ọwọ́ kan kò lè gbé ẹrù","phonetic":"[àgbájọ ọwọ́ la fi ń sọ̀yà, ọwọ́ kan kò lè gbé ẹrù]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Àgbáj","tone":"high","pitch":"Mí","freq":330},{"text":"w","tone":"mid","pitch":"Re","freq":293},{"text":"la","tone":"low","pitch":"Dó","freq":261},{"text":"fi","tone":"high","pitch":"Mí","freq":330},{"text":"ń","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":43,"title":"Lesson 43: Ọ̀pọ̀lọ́pọ̀ ọ̀pọ̀lọ́ ló ...","category":"Classical Proverbs","phrase":"Ọ̀pọ̀lọ́pọ̀ ọ̀pọ̀lọ́ ló ń fò nínú pọ̀lọ́pọ̀lọ̀ lẹ́bàá odò","phonetic":"[ọ̀pọ̀lọ́pọ̀ ọ̀pọ̀lọ́ ló ń fò nínú pọ̀lọ́pọ̀lọ̀ lẹ́bàá odò]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"plp","tone":"high","pitch":"Mí","freq":330},{"text":"pl","tone":"mid","pitch":"Re","freq":293},{"text":"ló","tone":"low","pitch":"Dó","freq":261},{"text":"ń","tone":"high","pitch":"Mí","freq":330},{"text":"fò","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":44,"title":"Lesson 44: Kànnàkánnà kàn lórí igi ...","category":"Classical Proverbs","phrase":"Kànnàkánnà kàn lórí igi kànnàkánnà tó ga fíofío","phonetic":"[kànnàkánnà kàn lórí igi kànnàkánnà tó ga fíofío]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kànnàkánnà","tone":"high","pitch":"Mí","freq":330},{"text":"kàn","tone":"mid","pitch":"Re","freq":293},{"text":"lórí","tone":"low","pitch":"Dó","freq":261},{"text":"igi","tone":"high","pitch":"Mí","freq":330},{"text":"kànnàkánnà","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":45,"title":"Lesson 45: Ìbàdàn kò nílé tútù, gbo...","category":"Classical Proverbs","phrase":"Ìbàdàn kò nílé tútù, gbogbo ilé ní ń kọ́ ọ̀sẹ̀ àti ayọ̀","phonetic":"[ìbàdàn kò nílé tútù, gbogbo ilé ní ń kọ́ ọ̀sẹ̀ àti ayọ̀]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ìbàdàn","tone":"high","pitch":"Mí","freq":330},{"text":"kò","tone":"mid","pitch":"Re","freq":293},{"text":"nílé","tone":"low","pitch":"Dó","freq":261},{"text":"tútù","tone":"high","pitch":"Mí","freq":330},{"text":"gbogbo","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":46,"title":"Lesson 46: Kábiyeèsí Aláàfin! Kádé ...","category":"Classical Proverbs","phrase":"Kábiyeèsí Aláàfin! Kádé pẹ́ lórí, kí bàtà pẹ́ lẹ́sẹ̀!","phonetic":"[kábiyeèsí aláàfin! kádé pẹ́ lórí, kí bàtà pẹ́ lẹ́sẹ̀!]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kábiyeèsí","tone":"high","pitch":"Mí","freq":330},{"text":"Aláàfin","tone":"mid","pitch":"Re","freq":293},{"text":"Kádé","tone":"low","pitch":"Dó","freq":261},{"text":"p","tone":"high","pitch":"Mí","freq":330},{"text":"lórí","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":47,"title":"Lesson 47: Ìwà rere lẹ̀ṣọ́ ènìyàn, ...","category":"Classical Proverbs","phrase":"Ìwà rere lẹ̀ṣọ́ ènìyàn, owó kò lè ra orúkọ rere","phonetic":"[ìwà rere lẹ̀ṣọ́ ènìyàn, owó kò lè ra orúkọ rere]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ìwà","tone":"high","pitch":"Mí","freq":330},{"text":"rere","tone":"mid","pitch":"Re","freq":293},{"text":"l","tone":"low","pitch":"Dó","freq":261},{"text":"ènìyàn","tone":"high","pitch":"Mí","freq":330},{"text":"owó","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":48,"title":"Lesson 48: Àlọ́ lórí Ìjàpá àti Ẹlẹ́...","category":"Classical Proverbs","phrase":"Àlọ́ lórí Ìjàpá àti Ẹlẹ́dẹ̀ nínú igbó àìmọ̀","phonetic":"[àlọ́ lórí ìjàpá àti ẹlẹ́dẹ̀ nínú igbó àìmọ̀]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Àl","tone":"high","pitch":"Mí","freq":330},{"text":"lórí","tone":"mid","pitch":"Re","freq":293},{"text":"Ìjàpá","tone":"low","pitch":"Dó","freq":261},{"text":"àti","tone":"high","pitch":"Mí","freq":330},{"text":"ld","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":49,"title":"Lesson 49: Odò tí ó bá gbàgbé orísu...","category":"Classical Proverbs","phrase":"Odò tí ó bá gbàgbé orísun rẹ̀, gbígbẹ ni yóò gbẹ","phonetic":"[odò tí ó bá gbàgbé orísun rẹ̀, gbígbẹ ni yóò gbẹ]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Odò","tone":"high","pitch":"Mí","freq":330},{"text":"tí","tone":"mid","pitch":"Re","freq":293},{"text":"ó","tone":"low","pitch":"Dó","freq":261},{"text":"bá","tone":"high","pitch":"Mí","freq":330},{"text":"gbàgbé","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":50,"title":"Lesson 50: Ẹbí wa wá láti ìrandíran...","category":"Classical Proverbs","phrase":"Ẹbí wa wá láti ìrandíran akọni àti ọ̀mọ̀wé","phonetic":"[ẹbí wa wá láti ìrandíran akọni àti ọ̀mọ̀wé]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"bí","tone":"high","pitch":"Mí","freq":330},{"text":"wa","tone":"mid","pitch":"Re","freq":293},{"text":"wá","tone":"low","pitch":"Dó","freq":261},{"text":"láti","tone":"high","pitch":"Mí","freq":330},{"text":"ìrandíran","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":51,"title":"Lesson 51: Ewé àti gbòǹgbò orílẹ̀ w...","category":"Philosophy & Blessings","phrase":"Ewé àti gbòǹgbò orílẹ̀ wa ní agbára ìwòsàn","phonetic":"[ewé àti gbòǹgbò orílẹ̀ wa ní agbára ìwòsàn]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ewé","tone":"high","pitch":"Mí","freq":330},{"text":"àti","tone":"mid","pitch":"Re","freq":293},{"text":"gbòǹgbò","tone":"low","pitch":"Dó","freq":261},{"text":"oríl","tone":"high","pitch":"Mí","freq":330},{"text":"wa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":52,"title":"Lesson 52: Àgbà tí kò bínú lọmọ rẹ̀...","category":"Philosophy & Blessings","phrase":"Àgbà tí kò bínú lọmọ rẹ̀ ń pọ̀ lórí ilẹ̀","phonetic":"[àgbà tí kò bínú lọmọ rẹ̀ ń pọ̀ lórí ilẹ̀]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Àgbà","tone":"high","pitch":"Mí","freq":330},{"text":"tí","tone":"mid","pitch":"Re","freq":293},{"text":"kò","tone":"low","pitch":"Dó","freq":261},{"text":"bínú","tone":"high","pitch":"Mí","freq":330},{"text":"lm","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":53,"title":"Lesson 53: Gbọ́ ohùn àwọn baba ńlá ...","category":"Philosophy & Blessings","phrase":"Gbọ́ ohùn àwọn baba ńlá wa nínú afẹ́fẹ́ àbáláyé","phonetic":"[gbọ́ ohùn àwọn baba ńlá wa nínú afẹ́fẹ́ àbáláyé]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Gb","tone":"high","pitch":"Mí","freq":330},{"text":"ohùn","tone":"mid","pitch":"Re","freq":293},{"text":"àwn","tone":"low","pitch":"Dó","freq":261},{"text":"baba","tone":"high","pitch":"Mí","freq":330},{"text":"ńlá","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":54,"title":"Lesson 54: Kí ló ń rìn nínú igbó tí...","category":"Philosophy & Blessings","phrase":"Kí ló ń rìn nínú igbó tí kò fẹsẹ̀ tẹ koríko?","phonetic":"[kí ló ń rìn nínú igbó tí kò fẹsẹ̀ tẹ koríko?]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kí","tone":"high","pitch":"Mí","freq":330},{"text":"ló","tone":"mid","pitch":"Re","freq":293},{"text":"ń","tone":"low","pitch":"Dó","freq":261},{"text":"rìn","tone":"high","pitch":"Mí","freq":330},{"text":"nínú","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":55,"title":"Lesson 55: Ìmọ̀ ẹ̀rọ ayélujára àti ...","category":"Philosophy & Blessings","phrase":"Ìmọ̀ ẹ̀rọ ayélujára àti ọgbọ́n orí ẹ̀rọ","phonetic":"[ìmọ̀ ẹ̀rọ ayélujára àti ọgbọ́n orí ẹ̀rọ]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ìm","tone":"high","pitch":"Mí","freq":330},{"text":"r","tone":"mid","pitch":"Re","freq":293},{"text":"ayélujára","tone":"low","pitch":"Dó","freq":261},{"text":"àti","tone":"high","pitch":"Mí","freq":330},{"text":"gbn","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":56,"title":"Lesson 56: Ẹ jẹ́ kí á fi ọ̀rọ̀ dídù...","category":"Philosophy & Blessings","phrase":"Ẹ jẹ́ kí á fi ọ̀rọ̀ dídùn wó odi àìgbọ́ra-ẹni-yé","phonetic":"[ẹ jẹ́ kí á fi ọ̀rọ̀ dídùn wó odi àìgbọ́ra-ẹni-yé]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"j","tone":"high","pitch":"Mí","freq":330},{"text":"kí","tone":"mid","pitch":"Re","freq":293},{"text":"á","tone":"low","pitch":"Dó","freq":261},{"text":"fi","tone":"high","pitch":"Mí","freq":330},{"text":"r","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":57,"title":"Lesson 57: Àkókò kò dúró de ẹnìkan,...","category":"Philosophy & Blessings","phrase":"Àkókò kò dúró de ẹnìkan, ẹ jẹ́ kí á mú ẹ̀kọ́ lókùnkúndùn","phonetic":"[àkókò kò dúró de ẹnìkan, ẹ jẹ́ kí á mú ẹ̀kọ́ lókùnkúndùn]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Àkókò","tone":"high","pitch":"Mí","freq":330},{"text":"kò","tone":"mid","pitch":"Re","freq":293},{"text":"dúró","tone":"low","pitch":"Dó","freq":261},{"text":"de","tone":"high","pitch":"Mí","freq":330},{"text":"nìkan","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":58,"title":"Lesson 58: Ọ̀dọ́ lọ̀la orílẹ̀-èdè w...","category":"Philosophy & Blessings","phrase":"Ọ̀dọ́ lọ̀la orílẹ̀-èdè wa, àwa la ó gbé àsìá ga","phonetic":"[ọ̀dọ́ lọ̀la orílẹ̀-èdè wa, àwa la ó gbé àsìá ga]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"d","tone":"high","pitch":"Mí","freq":330},{"text":"lla","tone":"mid","pitch":"Re","freq":293},{"text":"orílèdè","tone":"low","pitch":"Dó","freq":261},{"text":"wa","tone":"high","pitch":"Mí","freq":330},{"text":"àwa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":59,"title":"Lesson 59: Dó Re Mí Dó Mí Re Dó - O...","category":"Philosophy & Blessings","phrase":"Dó Re Mí Dó Mí Re Dó - Ohùn Yorùbá dára púpọ̀","phonetic":"[dó re mí dó mí re dó - ohùn yorùbá dára púpọ̀]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Dó","tone":"high","pitch":"Mí","freq":330},{"text":"Re","tone":"mid","pitch":"Re","freq":293},{"text":"Mí","tone":"low","pitch":"Dó","freq":261},{"text":"Dó","tone":"high","pitch":"Mí","freq":330},{"text":"Mí","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":60,"title":"Lesson 60: Àṣẹ! Kí gbogbo yín ṣe re...","category":"Philosophy & Blessings","phrase":"Àṣẹ! Kí gbogbo yín ṣe rere, kí ìmọ́lẹ̀ ẹ̀kọ́ yín tàn káàkiri ayé!","phonetic":"[àṣẹ! kí gbogbo yín ṣe rere, kí ìmọ́lẹ̀ ẹ̀kọ́ yín tàn káàkiri ayé!]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"À","tone":"high","pitch":"Mí","freq":330},{"text":"Kí","tone":"mid","pitch":"Re","freq":293},{"text":"gbogbo","tone":"low","pitch":"Dó","freq":261},{"text":"yín","tone":"high","pitch":"Mí","freq":330},{"text":"e","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3}]},"igbo":{"beginner":[{"id":1,"title":"Lesson 1: Ndị kọrọ, daalu nke ukwu...","category":"Greetings & Tones","phrase":"Ndị kọrọ, daalu nke ukwu","phonetic":"[ndị kọrọ, daalu nke ukwu]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nd","tone":"high","pitch":"Mí","freq":330},{"text":"kr","tone":"mid","pitch":"Re","freq":293},{"text":"daalu","tone":"low","pitch":"Dó","freq":261},{"text":"nke","tone":"high","pitch":"Mí","freq":330},{"text":"ukwu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":2,"title":"Lesson 2: Kedu ka i mere taa?...","category":"Greetings & Tones","phrase":"Kedu ka i mere taa?","phonetic":"[kedu ka i mere taa?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Kedu","tone":"high","pitch":"Mí","freq":330},{"text":"ka","tone":"mid","pitch":"Re","freq":293},{"text":"i","tone":"low","pitch":"Dó","freq":261},{"text":"mere","tone":"high","pitch":"Mí","freq":330},{"text":"taa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":3,"title":"Lesson 3: Afam bu Chidiebere, obi ...","category":"Greetings & Tones","phrase":"Afam bu Chidiebere, obi na-atọ m ụtọ","phonetic":"[afam bu chidiebere, obi na-atọ m ụtọ]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Afam","tone":"high","pitch":"Mí","freq":330},{"text":"bu","tone":"mid","pitch":"Re","freq":293},{"text":"Chidiebere","tone":"low","pitch":"Dó","freq":261},{"text":"obi","tone":"high","pitch":"Mí","freq":330},{"text":"naat","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":4,"title":"Lesson 4: Otu, Abụọ, Atọ, Anọ, Ise...","category":"Greetings & Tones","phrase":"Otu, Abụọ, Atọ, Anọ, Ise","phonetic":"[otu, abụọ, atọ, anọ, ise]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Otu","tone":"high","pitch":"Mí","freq":330},{"text":"Ab","tone":"mid","pitch":"Re","freq":293},{"text":"At","tone":"low","pitch":"Dó","freq":261},{"text":"An","tone":"high","pitch":"Mí","freq":330},{"text":"Ise","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":5,"title":"Lesson 5: Isii, Asaa, Asatọ, Itool...","category":"Greetings & Tones","phrase":"Isii, Asaa, Asatọ, Itoolu, Iri","phonetic":"[isii, asaa, asatọ, itoolu, iri]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Isii","tone":"high","pitch":"Mí","freq":330},{"text":"Asaa","tone":"mid","pitch":"Re","freq":293},{"text":"Asat","tone":"low","pitch":"Dó","freq":261},{"text":"Itoolu","tone":"high","pitch":"Mí","freq":330},{"text":"Iri","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":6,"title":"Lesson 6: Nna m, Nne m, na Nwanne ...","category":"Numbers & Kinship","phrase":"Nna m, Nne m, na Nwanne m","phonetic":"[nna m, nne m, na nwanne m]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nna","tone":"high","pitch":"Mí","freq":330},{"text":"m","tone":"mid","pitch":"Re","freq":293},{"text":"Nne","tone":"low","pitch":"Dó","freq":261},{"text":"m","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":7,"title":"Lesson 7: Biko, nyem mmiri oyi...","category":"Numbers & Kinship","phrase":"Biko, nyem mmiri oyi","phonetic":"[biko, nyem mmiri oyi]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Biko","tone":"high","pitch":"Mí","freq":330},{"text":"nyem","tone":"mid","pitch":"Re","freq":293},{"text":"mmiri","tone":"low","pitch":"Dó","freq":261},{"text":"oyi","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":8,"title":"Lesson 8: Uhie ka ọkụ, Ojii, Ọcha...","category":"Numbers & Kinship","phrase":"Uhie ka ọkụ, Ojii, Ọcha","phonetic":"[uhie ka ọkụ, ojii, ọcha]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Uhie","tone":"high","pitch":"Mí","freq":330},{"text":"ka","tone":"mid","pitch":"Re","freq":293},{"text":"k","tone":"low","pitch":"Dó","freq":261},{"text":"Ojii","tone":"high","pitch":"Mí","freq":330},{"text":"cha","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":9,"title":"Lesson 9: Ụlọ anyị mara mma nke uk...","category":"Numbers & Kinship","phrase":"Ụlọ anyị mara mma nke ukwu","phonetic":"[ụlọ anyị mara mma nke ukwu]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"l","tone":"high","pitch":"Mí","freq":330},{"text":"any","tone":"mid","pitch":"Re","freq":293},{"text":"mara","tone":"low","pitch":"Dó","freq":261},{"text":"mma","tone":"high","pitch":"Mí","freq":330},{"text":"nke","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":10,"title":"Lesson 10: A nọ m na udo taa...","category":"Numbers & Kinship","phrase":"A nọ m na udo taa","phonetic":"[a nọ m na udo taa]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"A","tone":"high","pitch":"Mí","freq":330},{"text":"n","tone":"mid","pitch":"Re","freq":293},{"text":"m","tone":"low","pitch":"Dó","freq":261},{"text":"na","tone":"high","pitch":"Mí","freq":330},{"text":"udo","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":11,"title":"Lesson 11: Ee nne m, Mba nna m, daa...","category":"Daily Life & Nature","phrase":"Ee nne m, Mba nna m, daalu","phonetic":"[ee nne m, mba nna m, daalu]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ee","tone":"high","pitch":"Mí","freq":330},{"text":"nne","tone":"mid","pitch":"Re","freq":293},{"text":"m","tone":"low","pitch":"Dó","freq":261},{"text":"Mba","tone":"high","pitch":"Mí","freq":330},{"text":"nna","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":12,"title":"Lesson 12: Ego ole ka azụ a dị?...","category":"Daily Life & Nature","phrase":"Ego ole ka azụ a dị?","phonetic":"[ego ole ka azụ a dị?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ego","tone":"high","pitch":"Mí","freq":330},{"text":"ole","tone":"mid","pitch":"Re","freq":293},{"text":"ka","tone":"low","pitch":"Dó","freq":261},{"text":"az","tone":"high","pitch":"Mí","freq":330},{"text":"a","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":13,"title":"Lesson 13: Nkịta na-agbọ ụja, Ọkụkọ...","category":"Daily Life & Nature","phrase":"Nkịta na-agbọ ụja, Ọkụkọ na-akwa","phonetic":"[nkịta na-agbọ ụja, ọkụkọ na-akwa]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nkta","tone":"high","pitch":"Mí","freq":330},{"text":"naagb","tone":"mid","pitch":"Re","freq":293},{"text":"ja","tone":"low","pitch":"Dó","freq":261},{"text":"kk","tone":"high","pitch":"Mí","freq":330},{"text":"naakwa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":14,"title":"Lesson 14: Mọnde, Tuzdee, Sọnde...","category":"Daily Life & Nature","phrase":"Mọnde, Tuzdee, Sọnde","phonetic":"[mọnde, tuzdee, sọnde]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Mnde","tone":"high","pitch":"Mí","freq":330},{"text":"Tuzdee","tone":"mid","pitch":"Re","freq":293},{"text":"Snde","tone":"low","pitch":"Dó","freq":261}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":15,"title":"Lesson 15: Isi, Anya, Imi, Ọnụ, Aka...","category":"Daily Life & Nature","phrase":"Isi, Anya, Imi, Ọnụ, Aka na Ụkwụ","phonetic":"[isi, anya, imi, ọnụ, aka na ụkwụ]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Isi","tone":"high","pitch":"Mí","freq":330},{"text":"Anya","tone":"mid","pitch":"Re","freq":293},{"text":"Imi","tone":"low","pitch":"Dó","freq":261},{"text":"n","tone":"high","pitch":"Mí","freq":330},{"text":"Aka","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":16,"title":"Lesson 16: Ebee ka ụlọ akwụkwọ anyị...","category":"Daily Life & Nature","phrase":"Ebee ka ụlọ akwụkwọ anyị dị?","phonetic":"[ebee ka ụlọ akwụkwọ anyị dị?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ebee","tone":"high","pitch":"Mí","freq":330},{"text":"ka","tone":"mid","pitch":"Re","freq":293},{"text":"l","tone":"low","pitch":"Dó","freq":261},{"text":"akwkw","tone":"high","pitch":"Mí","freq":330},{"text":"any","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":17,"title":"Lesson 17: Bịa rie nri, nri adịla n...","category":"Daily Life & Nature","phrase":"Bịa rie nri, nri adịla njikere","phonetic":"[bịa rie nri, nri adịla njikere]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ba","tone":"high","pitch":"Mí","freq":330},{"text":"rie","tone":"mid","pitch":"Re","freq":293},{"text":"nri","tone":"low","pitch":"Dó","freq":261},{"text":"nri","tone":"high","pitch":"Mí","freq":330},{"text":"adla","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":18,"title":"Lesson 18: Anwụ na-acha, mmiri na-e...","category":"Daily Life & Nature","phrase":"Anwụ na-acha, mmiri na-ezo","phonetic":"[anwụ na-acha, mmiri na-ezo]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Anw","tone":"high","pitch":"Mí","freq":330},{"text":"naacha","tone":"mid","pitch":"Re","freq":293},{"text":"mmiri","tone":"low","pitch":"Dó","freq":261},{"text":"naezo","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":19,"title":"Lesson 19: Ka chi foo, Chukwu chekw...","category":"Daily Life & Nature","phrase":"Ka chi foo, Chukwu chekwaba anyị","phonetic":"[ka chi foo, chukwu chekwaba anyị]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ka","tone":"high","pitch":"Mí","freq":330},{"text":"chi","tone":"mid","pitch":"Re","freq":293},{"text":"foo","tone":"low","pitch":"Dó","freq":261},{"text":"Chukwu","tone":"high","pitch":"Mí","freq":330},{"text":"chekwaba","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":20,"title":"Lesson 20: Nwa amadi ka m bụ, asụsụ...","category":"Daily Life & Nature","phrase":"Nwa amadi ka m bụ, asụsụ m bụ ugwu m!","phonetic":"[nwa amadi ka m bụ, asụsụ m bụ ugwu m!]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nwa","tone":"high","pitch":"Mí","freq":330},{"text":"amadi","tone":"mid","pitch":"Re","freq":293},{"text":"ka","tone":"low","pitch":"Dó","freq":261},{"text":"m","tone":"high","pitch":"Mí","freq":330},{"text":"b","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1}],"intermediate":[{"id":21,"title":"Lesson 21: Akụkọ m ga-amalite ugbu ...","category":"Conversations & Culture","phrase":"Akụkọ m ga-amalite ugbu a...","phonetic":"[akụkọ m ga-amalite ugbu a...]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Akk","tone":"high","pitch":"Mí","freq":330},{"text":"m","tone":"mid","pitch":"Re","freq":293},{"text":"gaamalite","tone":"low","pitch":"Dó","freq":261},{"text":"ugbu","tone":"high","pitch":"Mí","freq":330},{"text":"a","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":22,"title":"Lesson 22: Ịgba egwu na ịgụ egwu na...","category":"Conversations & Culture","phrase":"Ịgba egwu na ịgụ egwu na-amasị m","phonetic":"[ịgba egwu na ịgụ egwu na-amasị m]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"gba","tone":"high","pitch":"Mí","freq":330},{"text":"egwu","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"g","tone":"high","pitch":"Mí","freq":330},{"text":"egwu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":23,"title":"Lesson 23: Ekike omenala Igbo mara ...","category":"Conversations & Culture","phrase":"Ekike omenala Igbo mara mma nke ukwu","phonetic":"[ekike omenala igbo mara mma nke ukwu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ekike","tone":"high","pitch":"Mí","freq":330},{"text":"omenala","tone":"mid","pitch":"Re","freq":293},{"text":"Igbo","tone":"low","pitch":"Dó","freq":261},{"text":"mara","tone":"high","pitch":"Mí","freq":330},{"text":"mma","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":24,"title":"Lesson 24: Ka anyị gbaa nchọkọta eg...","category":"Conversations & Culture","phrase":"Ka anyị gbaa nchọkọta egwuregwu","phonetic":"[ka anyị gbaa nchọkọta egwuregwu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ka","tone":"high","pitch":"Mí","freq":330},{"text":"any","tone":"mid","pitch":"Re","freq":293},{"text":"gbaa","tone":"low","pitch":"Dó","freq":261},{"text":"nchkta","tone":"high","pitch":"Mí","freq":330},{"text":"egwuregwu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":25,"title":"Lesson 25: Ikoro na Ekwe na-ada nụl...","category":"Conversations & Culture","phrase":"Ikoro na Ekwe na-ada nụlọ ezumezu","phonetic":"[ikoro na ekwe na-ada nụlọ ezumezu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ikoro","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"Ekwe","tone":"low","pitch":"Dó","freq":261},{"text":"naada","tone":"high","pitch":"Mí","freq":330},{"text":"nl","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":26,"title":"Lesson 26: Nye m ofe onugbu na akpụ...","category":"Conversations & Culture","phrase":"Nye m ofe onugbu na akpụ","phonetic":"[nye m ofe onugbu na akpụ]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Nye","tone":"high","pitch":"Mí","freq":330},{"text":"m","tone":"mid","pitch":"Re","freq":293},{"text":"ofe","tone":"low","pitch":"Dó","freq":261},{"text":"onugbu","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":27,"title":"Lesson 27: Kedu oge o ji ugbu a?...","category":"Conversations & Culture","phrase":"Kedu oge o ji ugbu a?","phonetic":"[kedu oge o ji ugbu a?]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kedu","tone":"high","pitch":"Mí","freq":330},{"text":"oge","tone":"mid","pitch":"Re","freq":293},{"text":"o","tone":"low","pitch":"Dó","freq":261},{"text":"ji","tone":"high","pitch":"Mí","freq":330},{"text":"ugbu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":28,"title":"Lesson 28: Nne ochie na-akụziri m a...","category":"Conversations & Culture","phrase":"Nne ochie na-akụziri m akụkọ mgbe ochie","phonetic":"[nne ochie na-akụziri m akụkọ mgbe ochie]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Nne","tone":"high","pitch":"Mí","freq":330},{"text":"ochie","tone":"mid","pitch":"Re","freq":293},{"text":"naakziri","tone":"low","pitch":"Dó","freq":261},{"text":"m","tone":"high","pitch":"Mí","freq":330},{"text":"akk","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":29,"title":"Lesson 29: Enugu na Owerri bu obodo...","category":"Conversations & Culture","phrase":"Enugu na Owerri bu obodo mara mma","phonetic":"[enugu na owerri bu obodo mara mma]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Enugu","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"Owerri","tone":"low","pitch":"Dó","freq":261},{"text":"bu","tone":"high","pitch":"Mí","freq":330},{"text":"obodo","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":30,"title":"Lesson 30: Asụsụ Igbo na sayensị kọ...","category":"Conversations & Culture","phrase":"Asụsụ Igbo na sayensị kọmputa","phonetic":"[asụsụ igbo na sayensị kọmputa]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ass","tone":"high","pitch":"Mí","freq":330},{"text":"Igbo","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"sayens","tone":"high","pitch":"Mí","freq":330},{"text":"kmputa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":31,"title":"Lesson 31: Emume Iri Ji Ọhụrụ abịal...","category":"Rhythm & Community","phrase":"Emume Iri Ji Ọhụrụ abịala","phonetic":"[emume iri ji ọhụrụ abịala]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Emume","tone":"high","pitch":"Mí","freq":330},{"text":"Iri","tone":"mid","pitch":"Re","freq":293},{"text":"Ji","tone":"low","pitch":"Dó","freq":261},{"text":"hr","tone":"high","pitch":"Mí","freq":330},{"text":"abala","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":32,"title":"Lesson 32: Biko belata ọnụ ahịa ya ...","category":"Rhythm & Community","phrase":"Biko belata ọnụ ahịa ya ntakịrị","phonetic":"[biko belata ọnụ ahịa ya ntakịrị]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Biko","tone":"high","pitch":"Mí","freq":330},{"text":"belata","tone":"mid","pitch":"Re","freq":293},{"text":"n","tone":"low","pitch":"Dó","freq":261},{"text":"aha","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":33,"title":"Lesson 33: Nechiche m, asụsụ anyị b...","category":"Rhythm & Community","phrase":"Nechiche m, asụsụ anyị bụ akụ anyị","phonetic":"[nechiche m, asụsụ anyị bụ akụ anyị]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Nechiche","tone":"high","pitch":"Mí","freq":330},{"text":"m","tone":"mid","pitch":"Re","freq":293},{"text":"ass","tone":"low","pitch":"Dó","freq":261},{"text":"any","tone":"high","pitch":"Mí","freq":330},{"text":"b","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":34,"title":"Lesson 34: Mmanụ aṅụ na-atọ ụtọ, os...","category":"Rhythm & Community","phrase":"Mmanụ aṅụ na-atọ ụtọ, ose na-ekpo ọkụ","phonetic":"[mmanụ aṅụ na-atọ ụtọ, ose na-ekpo ọkụ]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Mman","tone":"high","pitch":"Mí","freq":330},{"text":"a","tone":"mid","pitch":"Re","freq":293},{"text":"naat","tone":"low","pitch":"Dó","freq":261},{"text":"t","tone":"high","pitch":"Mí","freq":330},{"text":"ose","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":35,"title":"Lesson 35: Echegbula onwe gị, udo g...","category":"Rhythm & Community","phrase":"Echegbula onwe gị, udo ga-adị","phonetic":"[echegbula onwe gị, udo ga-adị]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Echegbula","tone":"high","pitch":"Mí","freq":330},{"text":"onwe","tone":"mid","pitch":"Re","freq":293},{"text":"g","tone":"low","pitch":"Dó","freq":261},{"text":"udo","tone":"high","pitch":"Mí","freq":330},{"text":"gaad","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":36,"title":"Lesson 36: Gbaa aka nri, gafere ahị...","category":"Rhythm & Community","phrase":"Gbaa aka nri, gafere ahịa","phonetic":"[gbaa aka nri, gafere ahịa]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Gbaa","tone":"high","pitch":"Mí","freq":330},{"text":"aka","tone":"mid","pitch":"Re","freq":293},{"text":"nri","tone":"low","pitch":"Dó","freq":261},{"text":"gafere","tone":"high","pitch":"Mí","freq":330},{"text":"aha","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":37,"title":"Lesson 37: Ọdụm bụ eze anụ ọhịa...","category":"Rhythm & Community","phrase":"Ọdụm bụ eze anụ ọhịa","phonetic":"[ọdụm bụ eze anụ ọhịa]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"dm","tone":"high","pitch":"Mí","freq":330},{"text":"b","tone":"mid","pitch":"Re","freq":293},{"text":"eze","tone":"low","pitch":"Dó","freq":261},{"text":"an","tone":"high","pitch":"Mí","freq":330},{"text":"ha","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":38,"title":"Lesson 38: Gbaghara m, agaghị m eme...","category":"Rhythm & Community","phrase":"Gbaghara m, agaghị m eme ya ọzọ","phonetic":"[gbaghara m, agaghị m eme ya ọzọ]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Gbaghara","tone":"high","pitch":"Mí","freq":330},{"text":"m","tone":"mid","pitch":"Re","freq":293},{"text":"agagh","tone":"low","pitch":"Dó","freq":261},{"text":"m","tone":"high","pitch":"Mí","freq":330},{"text":"eme","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":39,"title":"Lesson 39: Hie ụra nke ọma nwa m ma...","category":"Rhythm & Community","phrase":"Hie ụra nke ọma nwa m mara mma","phonetic":"[hie ụra nke ọma nwa m mara mma]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Hie","tone":"high","pitch":"Mí","freq":330},{"text":"ra","tone":"mid","pitch":"Re","freq":293},{"text":"nke","tone":"low","pitch":"Dó","freq":261},{"text":"ma","tone":"high","pitch":"Mí","freq":330},{"text":"nwa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":40,"title":"Lesson 40: Asụsụ Igbo agaghị anwụ n...","category":"Rhythm & Community","phrase":"Asụsụ Igbo agaghị anwụ nọnụ m!","phonetic":"[asụsụ igbo agaghị anwụ nọnụ m!]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ass","tone":"high","pitch":"Mí","freq":330},{"text":"Igbo","tone":"mid","pitch":"Re","freq":293},{"text":"agagh","tone":"low","pitch":"Dó","freq":261},{"text":"anw","tone":"high","pitch":"Mí","freq":330},{"text":"nn","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2}],"advanced":[{"id":41,"title":"Lesson 41: Onye nwere ndidi na-eri ...","category":"Classical Proverbs","phrase":"Onye nwere ndidi na-eri azụ kacha ibu","phonetic":"[onye nwere ndidi na-eri azụ kacha ibu]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Onye","tone":"high","pitch":"Mí","freq":330},{"text":"nwere","tone":"mid","pitch":"Re","freq":293},{"text":"ndidi","tone":"low","pitch":"Dó","freq":261},{"text":"naeri","tone":"high","pitch":"Mí","freq":330},{"text":"az","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":42,"title":"Lesson 42: Aka nri kwọọ aka ekpe, a...","category":"Classical Proverbs","phrase":"Aka nri kwọọ aka ekpe, aka ekpe akwọọ aka nri","phonetic":"[aka nri kwọọ aka ekpe, aka ekpe akwọọ aka nri]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Aka","tone":"high","pitch":"Mí","freq":330},{"text":"nri","tone":"mid","pitch":"Re","freq":293},{"text":"kw","tone":"low","pitch":"Dó","freq":261},{"text":"aka","tone":"high","pitch":"Mí","freq":330},{"text":"ekpe","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":43,"title":"Lesson 43: Ọkpọrọkpọ akpịrị na-agụ ...","category":"Classical Proverbs","phrase":"Ọkpọrọkpọ akpịrị na-agụ egwu nakụkụ mmiri","phonetic":"[ọkpọrọkpọ akpịrị na-agụ egwu nakụkụ mmiri]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"kprkp","tone":"high","pitch":"Mí","freq":330},{"text":"akpr","tone":"mid","pitch":"Re","freq":293},{"text":"naag","tone":"low","pitch":"Dó","freq":261},{"text":"egwu","tone":"high","pitch":"Mí","freq":330},{"text":"nakk","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":44,"title":"Lesson 44: Nnụnụ na-efe efe anaghị ...","category":"Classical Proverbs","phrase":"Nnụnụ na-efe efe anaghị echefu akwụ ya","phonetic":"[nnụnụ na-efe efe anaghị echefu akwụ ya]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Nnn","tone":"high","pitch":"Mí","freq":330},{"text":"naefe","tone":"mid","pitch":"Re","freq":293},{"text":"efe","tone":"low","pitch":"Dó","freq":261},{"text":"anagh","tone":"high","pitch":"Mí","freq":330},{"text":"echefu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":45,"title":"Lesson 45: Egwu Ogene na-akpali mmụ...","category":"Classical Proverbs","phrase":"Egwu Ogene na-akpali mmụọ dike","phonetic":"[egwu ogene na-akpali mmụọ dike]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Egwu","tone":"high","pitch":"Mí","freq":330},{"text":"Ogene","tone":"mid","pitch":"Re","freq":293},{"text":"naakpali","tone":"low","pitch":"Dó","freq":261},{"text":"mm","tone":"high","pitch":"Mí","freq":330},{"text":"dike","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":46,"title":"Lesson 46: Eze gbalaga! Ndụ gị ga-a...","category":"Classical Proverbs","phrase":"Eze gbalaga! Ndụ gị ga-adị ogologo!","phonetic":"[eze gbalaga! ndụ gị ga-adị ogologo!]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Eze","tone":"high","pitch":"Mí","freq":330},{"text":"gbalaga","tone":"mid","pitch":"Re","freq":293},{"text":"Nd","tone":"low","pitch":"Dó","freq":261},{"text":"g","tone":"high","pitch":"Mí","freq":330},{"text":"gaad","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":47,"title":"Lesson 47: Ezi agwa bụ ezi aha, ego...","category":"Classical Proverbs","phrase":"Ezi agwa bụ ezi aha, ego apụghị ịzụ ya","phonetic":"[ezi agwa bụ ezi aha, ego apụghị ịzụ ya]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ezi","tone":"high","pitch":"Mí","freq":330},{"text":"agwa","tone":"mid","pitch":"Re","freq":293},{"text":"b","tone":"low","pitch":"Dó","freq":261},{"text":"ezi","tone":"high","pitch":"Mí","freq":330},{"text":"aha","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":48,"title":"Lesson 48: Akụkọ banyere Mbe na Ezi...","category":"Classical Proverbs","phrase":"Akụkọ banyere Mbe na Ezi nọhịa","phonetic":"[akụkọ banyere mbe na ezi nọhịa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Akk","tone":"high","pitch":"Mí","freq":330},{"text":"banyere","tone":"mid","pitch":"Re","freq":293},{"text":"Mbe","tone":"low","pitch":"Dó","freq":261},{"text":"na","tone":"high","pitch":"Mí","freq":330},{"text":"Ezi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":49,"title":"Lesson 49: Mmiri mara onye bu ụzọ m...","category":"Classical Proverbs","phrase":"Mmiri mara onye bu ụzọ mara onye na-eso ya","phonetic":"[mmiri mara onye bu ụzọ mara onye na-eso ya]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Mmiri","tone":"high","pitch":"Mí","freq":330},{"text":"mara","tone":"mid","pitch":"Re","freq":293},{"text":"onye","tone":"low","pitch":"Dó","freq":261},{"text":"bu","tone":"high","pitch":"Mí","freq":330},{"text":"z","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":50,"title":"Lesson 50: Anyị si nagbụrụ ndị dike...","category":"Classical Proverbs","phrase":"Anyị si nagbụrụ ndị dike na ndị amamihe","phonetic":"[anyị si nagbụrụ ndị dike na ndị amamihe]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Any","tone":"high","pitch":"Mí","freq":330},{"text":"si","tone":"mid","pitch":"Re","freq":293},{"text":"nagbr","tone":"low","pitch":"Dó","freq":261},{"text":"nd","tone":"high","pitch":"Mí","freq":330},{"text":"dike","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":51,"title":"Lesson 51: Akwụkwọ nri na mkpọrọgwụ...","category":"Philosophy & Blessings","phrase":"Akwụkwọ nri na mkpọrọgwụ nwere ike ọgwụgwọ","phonetic":"[akwụkwọ nri na mkpọrọgwụ nwere ike ọgwụgwọ]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Akwkw","tone":"high","pitch":"Mí","freq":330},{"text":"nri","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"mkprgw","tone":"high","pitch":"Mí","freq":330},{"text":"nwere","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":52,"title":"Lesson 52: Onye ndú na-ege ntị na-a...","category":"Philosophy & Blessings","phrase":"Onye ndú na-ege ntị na-achị nudo","phonetic":"[onye ndú na-ege ntị na-achị nudo]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Onye","tone":"high","pitch":"Mí","freq":330},{"text":"ndú","tone":"mid","pitch":"Re","freq":293},{"text":"naege","tone":"low","pitch":"Dó","freq":261},{"text":"nt","tone":"high","pitch":"Mí","freq":330},{"text":"naach","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":53,"title":"Lesson 53: Nụrụ olu ndị nna ochie n...","category":"Philosophy & Blessings","phrase":"Nụrụ olu ndị nna ochie nikuku","phonetic":"[nụrụ olu ndị nna ochie nikuku]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Nr","tone":"high","pitch":"Mí","freq":330},{"text":"olu","tone":"mid","pitch":"Re","freq":293},{"text":"nd","tone":"low","pitch":"Dó","freq":261},{"text":"nna","tone":"high","pitch":"Mí","freq":330},{"text":"ochie","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":54,"title":"Lesson 54: Gịnị na-aga ije na-enweg...","category":"Philosophy & Blessings","phrase":"Gịnị na-aga ije na-enweghị ụkwụ? (Ikuku)","phonetic":"[gịnị na-aga ije na-enweghị ụkwụ? (ikuku)]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Gn","tone":"high","pitch":"Mí","freq":330},{"text":"naaga","tone":"mid","pitch":"Re","freq":293},{"text":"ije","tone":"low","pitch":"Dó","freq":261},{"text":"naenwegh","tone":"high","pitch":"Mí","freq":330},{"text":"kw","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":55,"title":"Lesson 55: Nkà na ụzụ na amamihe ọh...","category":"Philosophy & Blessings","phrase":"Nkà na ụzụ na amamihe ọhụrụ","phonetic":"[nkà na ụzụ na amamihe ọhụrụ]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Nkà","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"z","tone":"low","pitch":"Dó","freq":261},{"text":"na","tone":"high","pitch":"Mí","freq":330},{"text":"amamihe","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":56,"title":"Lesson 56: Ka anyị jiri okwu ọma wu...","category":"Philosophy & Blessings","phrase":"Ka anyị jiri okwu ọma wulite udo","phonetic":"[ka anyị jiri okwu ọma wulite udo]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ka","tone":"high","pitch":"Mí","freq":330},{"text":"any","tone":"mid","pitch":"Re","freq":293},{"text":"jiri","tone":"low","pitch":"Dó","freq":261},{"text":"okwu","tone":"high","pitch":"Mí","freq":330},{"text":"ma","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":57,"title":"Lesson 57: Oge anaghị eche onye ọ b...","category":"Philosophy & Blessings","phrase":"Oge anaghị eche onye ọ bụla","phonetic":"[oge anaghị eche onye ọ bụla]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Oge","tone":"high","pitch":"Mí","freq":330},{"text":"anagh","tone":"mid","pitch":"Re","freq":293},{"text":"eche","tone":"low","pitch":"Dó","freq":261},{"text":"onye","tone":"high","pitch":"Mí","freq":330},{"text":"bla","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":58,"title":"Lesson 58: Ndị ntorobịa bụ olileany...","category":"Philosophy & Blessings","phrase":"Ndị ntorobịa bụ olileanya anyị","phonetic":"[ndị ntorobịa bụ olileanya anyị]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Nd","tone":"high","pitch":"Mí","freq":330},{"text":"ntoroba","tone":"mid","pitch":"Re","freq":293},{"text":"b","tone":"low","pitch":"Dó","freq":261},{"text":"olileanya","tone":"high","pitch":"Mí","freq":330},{"text":"any","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":59,"title":"Lesson 59: Dó Re Mí - Uda olu Igbo ...","category":"Philosophy & Blessings","phrase":"Dó Re Mí - Uda olu Igbo mara mma","phonetic":"[dó re mí - uda olu igbo mara mma]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Dó","tone":"high","pitch":"Mí","freq":330},{"text":"Re","tone":"mid","pitch":"Re","freq":293},{"text":"Mí","tone":"low","pitch":"Dó","freq":261},{"text":"Uda","tone":"high","pitch":"Mí","freq":330},{"text":"olu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":60,"title":"Lesson 60: Ka ngozi na amamihe dịrị...","category":"Philosophy & Blessings","phrase":"Ka ngozi na amamihe dịrị unu niile!","phonetic":"[ka ngozi na amamihe dịrị unu niile!]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ka","tone":"high","pitch":"Mí","freq":330},{"text":"ngozi","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"amamihe","tone":"high","pitch":"Mí","freq":330},{"text":"dr","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3}]},"hausa":{"beginner":[{"id":1,"title":"Lesson 1: Ina kwana, na gode sosai...","category":"Greetings & Tones","phrase":"Ina kwana, na gode sosai","phonetic":"[ina kwana, na gode sosai]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ina","tone":"high","pitch":"Mí","freq":330},{"text":"kwana","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"gode","tone":"high","pitch":"Mí","freq":330},{"text":"sosai","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":2,"title":"Lesson 2: Yaya kake da iyalinka?...","category":"Greetings & Tones","phrase":"Yaya kake da iyalinka?","phonetic":"[yaya kake da iyalinka?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Yaya","tone":"high","pitch":"Mí","freq":330},{"text":"kake","tone":"mid","pitch":"Re","freq":293},{"text":"da","tone":"low","pitch":"Dó","freq":261},{"text":"iyalinka","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":3,"title":"Lesson 3: Sunana Amina, ina jin da...","category":"Greetings & Tones","phrase":"Sunana Amina, ina jin dadi","phonetic":"[sunana amina, ina jin dadi]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Sunana","tone":"high","pitch":"Mí","freq":330},{"text":"Amina","tone":"mid","pitch":"Re","freq":293},{"text":"ina","tone":"low","pitch":"Dó","freq":261},{"text":"jin","tone":"high","pitch":"Mí","freq":330},{"text":"dadi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":4,"title":"Lesson 4: Daya, Biyu, Uku, Hudu, B...","category":"Greetings & Tones","phrase":"Daya, Biyu, Uku, Hudu, Biyar","phonetic":"[daya, biyu, uku, hudu, biyar]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Daya","tone":"high","pitch":"Mí","freq":330},{"text":"Biyu","tone":"mid","pitch":"Re","freq":293},{"text":"Uku","tone":"low","pitch":"Dó","freq":261},{"text":"Hudu","tone":"high","pitch":"Mí","freq":330},{"text":"Biyar","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":5,"title":"Lesson 5: Shida, Bakwai, Takwas, T...","category":"Greetings & Tones","phrase":"Shida, Bakwai, Takwas, Tara, Goma","phonetic":"[shida, bakwai, takwas, tara, goma]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Shida","tone":"high","pitch":"Mí","freq":330},{"text":"Bakwai","tone":"mid","pitch":"Re","freq":293},{"text":"Takwas","tone":"low","pitch":"Dó","freq":261},{"text":"Tara","tone":"high","pitch":"Mí","freq":330},{"text":"Goma","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":6,"title":"Lesson 6: Babana, Mamana, da Kanen...","category":"Numbers & Kinship","phrase":"Babana, Mamana, da Kanena","phonetic":"[babana, mamana, da kanena]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Babana","tone":"high","pitch":"Mí","freq":330},{"text":"Mamana","tone":"mid","pitch":"Re","freq":293},{"text":"da","tone":"low","pitch":"Dó","freq":261},{"text":"Kanena","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":7,"title":"Lesson 7: Don Allah, ba ni ruwan s...","category":"Numbers & Kinship","phrase":"Don Allah, ba ni ruwan sha","phonetic":"[don allah, ba ni ruwan sha]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Don","tone":"high","pitch":"Mí","freq":330},{"text":"Allah","tone":"mid","pitch":"Re","freq":293},{"text":"ba","tone":"low","pitch":"Dó","freq":261},{"text":"ni","tone":"high","pitch":"Mí","freq":330},{"text":"ruwan","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":8,"title":"Lesson 8: Ja kamar wuta, Baki, Far...","category":"Numbers & Kinship","phrase":"Ja kamar wuta, Baki, Fari","phonetic":"[ja kamar wuta, baki, fari]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ja","tone":"high","pitch":"Mí","freq":330},{"text":"kamar","tone":"mid","pitch":"Re","freq":293},{"text":"wuta","tone":"low","pitch":"Dó","freq":261},{"text":"Baki","tone":"high","pitch":"Mí","freq":330},{"text":"Fari","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":9,"title":"Lesson 9: Gidanmu yana da kyau sos...","category":"Numbers & Kinship","phrase":"Gidanmu yana da kyau sosai","phonetic":"[gidanmu yana da kyau sosai]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Gidanmu","tone":"high","pitch":"Mí","freq":330},{"text":"yana","tone":"mid","pitch":"Re","freq":293},{"text":"da","tone":"low","pitch":"Dó","freq":261},{"text":"kyau","tone":"high","pitch":"Mí","freq":330},{"text":"sosai","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":10,"title":"Lesson 10: Ina cikin farin ciki yau...","category":"Numbers & Kinship","phrase":"Ina cikin farin ciki yau","phonetic":"[ina cikin farin ciki yau]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ina","tone":"high","pitch":"Mí","freq":330},{"text":"cikin","tone":"mid","pitch":"Re","freq":293},{"text":"farin","tone":"low","pitch":"Dó","freq":261},{"text":"ciki","tone":"high","pitch":"Mí","freq":330},{"text":"yau","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":11,"title":"Lesson 11: I mana, Aa, na gode...","category":"Daily Life & Nature","phrase":"I mana, Aa, na gode","phonetic":"[i mana, aa, na gode]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"I","tone":"high","pitch":"Mí","freq":330},{"text":"mana","tone":"mid","pitch":"Re","freq":293},{"text":"Aa","tone":"low","pitch":"Dó","freq":261},{"text":"na","tone":"high","pitch":"Mí","freq":330},{"text":"gode","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":12,"title":"Lesson 12: Nawa ne wannan kifin?...","category":"Daily Life & Nature","phrase":"Nawa ne wannan kifin?","phonetic":"[nawa ne wannan kifin?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nawa","tone":"high","pitch":"Mí","freq":330},{"text":"ne","tone":"mid","pitch":"Re","freq":293},{"text":"wannan","tone":"low","pitch":"Dó","freq":261},{"text":"kifin","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":13,"title":"Lesson 13: Kare yana haushi, Kaza t...","category":"Daily Life & Nature","phrase":"Kare yana haushi, Kaza tana kuka","phonetic":"[kare yana haushi, kaza tana kuka]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Kare","tone":"high","pitch":"Mí","freq":330},{"text":"yana","tone":"mid","pitch":"Re","freq":293},{"text":"haushi","tone":"low","pitch":"Dó","freq":261},{"text":"Kaza","tone":"high","pitch":"Mí","freq":330},{"text":"tana","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":14,"title":"Lesson 14: Litinin, Talata, Lahadi...","category":"Daily Life & Nature","phrase":"Litinin, Talata, Lahadi","phonetic":"[litinin, talata, lahadi]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Litinin","tone":"high","pitch":"Mí","freq":330},{"text":"Talata","tone":"mid","pitch":"Re","freq":293},{"text":"Lahadi","tone":"low","pitch":"Dó","freq":261}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":15,"title":"Lesson 15: Kai, Ido, Hanci, Baki, H...","category":"Daily Life & Nature","phrase":"Kai, Ido, Hanci, Baki, Hannu da Kafa","phonetic":"[kai, ido, hanci, baki, hannu da kafa]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Kai","tone":"high","pitch":"Mí","freq":330},{"text":"Ido","tone":"mid","pitch":"Re","freq":293},{"text":"Hanci","tone":"low","pitch":"Dó","freq":261},{"text":"Baki","tone":"high","pitch":"Mí","freq":330},{"text":"Hannu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":16,"title":"Lesson 16: Ina makarantarmu take?...","category":"Daily Life & Nature","phrase":"Ina makarantarmu take?","phonetic":"[ina makarantarmu take?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ina","tone":"high","pitch":"Mí","freq":330},{"text":"makarantarmu","tone":"mid","pitch":"Re","freq":293},{"text":"take","tone":"low","pitch":"Dó","freq":261}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":17,"title":"Lesson 17: Zo mu ci abinci tare...","category":"Daily Life & Nature","phrase":"Zo mu ci abinci tare","phonetic":"[zo mu ci abinci tare]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Zo","tone":"high","pitch":"Mí","freq":330},{"text":"mu","tone":"mid","pitch":"Re","freq":293},{"text":"ci","tone":"low","pitch":"Dó","freq":261},{"text":"abinci","tone":"high","pitch":"Mí","freq":330},{"text":"tare","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":18,"title":"Lesson 18: Rana tana haske, ruwa ya...","category":"Daily Life & Nature","phrase":"Rana tana haske, ruwa yana sauka","phonetic":"[rana tana haske, ruwa yana sauka]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Rana","tone":"high","pitch":"Mí","freq":330},{"text":"tana","tone":"mid","pitch":"Re","freq":293},{"text":"haske","tone":"low","pitch":"Dó","freq":261},{"text":"ruwa","tone":"high","pitch":"Mí","freq":330},{"text":"yana","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":19,"title":"Lesson 19: Sai da safe, Allah Ya ka...","category":"Daily Life & Nature","phrase":"Sai da safe, Allah Ya kare mu","phonetic":"[sai da safe, allah ya kare mu]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Sai","tone":"high","pitch":"Mí","freq":330},{"text":"da","tone":"mid","pitch":"Re","freq":293},{"text":"safe","tone":"low","pitch":"Dó","freq":261},{"text":"Allah","tone":"high","pitch":"Mí","freq":330},{"text":"Ya","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":20,"title":"Lesson 20: Ni dan asali ne, yarena ...","category":"Daily Life & Nature","phrase":"Ni dan asali ne, yarena abin alfaharina ne!","phonetic":"[ni dan asali ne, yarena abin alfaharina ne!]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ni","tone":"high","pitch":"Mí","freq":330},{"text":"dan","tone":"mid","pitch":"Re","freq":293},{"text":"asali","tone":"low","pitch":"Dó","freq":261},{"text":"ne","tone":"high","pitch":"Mí","freq":330},{"text":"yarena","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1}],"intermediate":[{"id":21,"title":"Lesson 21: Ga wani labari mai dadi....","category":"Conversations & Culture","phrase":"Ga wani labari mai dadi...","phonetic":"[ga wani labari mai dadi...]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ga","tone":"high","pitch":"Mí","freq":330},{"text":"wani","tone":"mid","pitch":"Re","freq":293},{"text":"labari","tone":"low","pitch":"Dó","freq":261},{"text":"mai","tone":"high","pitch":"Mí","freq":330},{"text":"dadi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":22,"title":"Lesson 22: Ina son wasan gargajiya ...","category":"Conversations & Culture","phrase":"Ina son wasan gargajiya da waka","phonetic":"[ina son wasan gargajiya da waka]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ina","tone":"high","pitch":"Mí","freq":330},{"text":"son","tone":"mid","pitch":"Re","freq":293},{"text":"wasan","tone":"low","pitch":"Dó","freq":261},{"text":"gargajiya","tone":"high","pitch":"Mí","freq":330},{"text":"da","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":23,"title":"Lesson 23: Kayan alada na Hausa sun...","category":"Conversations & Culture","phrase":"Kayan alada na Hausa suna da kyau","phonetic":"[kayan alada na hausa suna da kyau]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kayan","tone":"high","pitch":"Mí","freq":330},{"text":"alada","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"Hausa","tone":"high","pitch":"Mí","freq":330},{"text":"suna","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":24,"title":"Lesson 24: Mu yi wasan dara tare...","category":"Conversations & Culture","phrase":"Mu yi wasan dara tare","phonetic":"[mu yi wasan dara tare]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Mu","tone":"high","pitch":"Mí","freq":330},{"text":"yi","tone":"mid","pitch":"Re","freq":293},{"text":"wasan","tone":"low","pitch":"Dó","freq":261},{"text":"dara","tone":"high","pitch":"Mí","freq":330},{"text":"tare","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":25,"title":"Lesson 25: Gangar gargajiya tana bu...","category":"Conversations & Culture","phrase":"Gangar gargajiya tana bugawa a fada","phonetic":"[gangar gargajiya tana bugawa a fada]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Gangar","tone":"high","pitch":"Mí","freq":330},{"text":"gargajiya","tone":"mid","pitch":"Re","freq":293},{"text":"tana","tone":"low","pitch":"Dó","freq":261},{"text":"bugawa","tone":"high","pitch":"Mí","freq":330},{"text":"a","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":26,"title":"Lesson 26: Ba ni tuwon shinkafa da ...","category":"Conversations & Culture","phrase":"Ba ni tuwon shinkafa da miyar kuka","phonetic":"[ba ni tuwon shinkafa da miyar kuka]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ba","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"tuwon","tone":"low","pitch":"Dó","freq":261},{"text":"shinkafa","tone":"high","pitch":"Mí","freq":330},{"text":"da","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":27,"title":"Lesson 27: Karfe nawa ne yanzu?...","category":"Conversations & Culture","phrase":"Karfe nawa ne yanzu?","phonetic":"[karfe nawa ne yanzu?]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Karfe","tone":"high","pitch":"Mí","freq":330},{"text":"nawa","tone":"mid","pitch":"Re","freq":293},{"text":"ne","tone":"low","pitch":"Dó","freq":261},{"text":"yanzu","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":28,"title":"Lesson 28: Kakar tana koya mini tar...","category":"Conversations & Culture","phrase":"Kakar tana koya mini tarihin da","phonetic":"[kakar tana koya mini tarihin da]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kakar","tone":"high","pitch":"Mí","freq":330},{"text":"tana","tone":"mid","pitch":"Re","freq":293},{"text":"koya","tone":"low","pitch":"Dó","freq":261},{"text":"mini","tone":"high","pitch":"Mí","freq":330},{"text":"tarihin","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":29,"title":"Lesson 29: Kano da Zariya birane ne...","category":"Conversations & Culture","phrase":"Kano da Zariya birane ne masu tarihi","phonetic":"[kano da zariya birane ne masu tarihi]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kano","tone":"high","pitch":"Mí","freq":330},{"text":"da","tone":"mid","pitch":"Re","freq":293},{"text":"Zariya","tone":"low","pitch":"Dó","freq":261},{"text":"birane","tone":"high","pitch":"Mí","freq":330},{"text":"ne","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":30,"title":"Lesson 30: Yaren Hausa da ilimin kw...","category":"Conversations & Culture","phrase":"Yaren Hausa da ilimin kwamfuta","phonetic":"[yaren hausa da ilimin kwamfuta]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Yaren","tone":"high","pitch":"Mí","freq":330},{"text":"Hausa","tone":"mid","pitch":"Re","freq":293},{"text":"da","tone":"low","pitch":"Dó","freq":261},{"text":"ilimin","tone":"high","pitch":"Mí","freq":330},{"text":"kwamfuta","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":31,"title":"Lesson 31: Bikin Sabon Hatsi ya zo ...","category":"Rhythm & Community","phrase":"Bikin Sabon Hatsi ya zo da farin ciki","phonetic":"[bikin sabon hatsi ya zo da farin ciki]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Bikin","tone":"high","pitch":"Mí","freq":330},{"text":"Sabon","tone":"mid","pitch":"Re","freq":293},{"text":"Hatsi","tone":"low","pitch":"Dó","freq":261},{"text":"ya","tone":"high","pitch":"Mí","freq":330},{"text":"zo","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":32,"title":"Lesson 32: Don Allah a rage min kud...","category":"Rhythm & Community","phrase":"Don Allah a rage min kudi kadan","phonetic":"[don allah a rage min kudi kadan]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Don","tone":"high","pitch":"Mí","freq":330},{"text":"Allah","tone":"mid","pitch":"Re","freq":293},{"text":"a","tone":"low","pitch":"Dó","freq":261},{"text":"rage","tone":"high","pitch":"Mí","freq":330},{"text":"min","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":33,"title":"Lesson 33: A ganina, yarenmu shi ne...","category":"Rhythm & Community","phrase":"A ganina, yarenmu shi ne asalin hikimarmu","phonetic":"[a ganina, yarenmu shi ne asalin hikimarmu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"A","tone":"high","pitch":"Mí","freq":330},{"text":"ganina","tone":"mid","pitch":"Re","freq":293},{"text":"yarenmu","tone":"low","pitch":"Dó","freq":261},{"text":"shi","tone":"high","pitch":"Mí","freq":330},{"text":"ne","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":34,"title":"Lesson 34: Zuma tana da dadi, barko...","category":"Rhythm & Community","phrase":"Zuma tana da dadi, barkono yana da yaji","phonetic":"[zuma tana da dadi, barkono yana da yaji]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Zuma","tone":"high","pitch":"Mí","freq":330},{"text":"tana","tone":"mid","pitch":"Re","freq":293},{"text":"da","tone":"low","pitch":"Dó","freq":261},{"text":"dadi","tone":"high","pitch":"Mí","freq":330},{"text":"barkono","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":35,"title":"Lesson 35: Kada ka damu, lafiya za ...","category":"Rhythm & Community","phrase":"Kada ka damu, lafiya za a samu","phonetic":"[kada ka damu, lafiya za a samu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kada","tone":"high","pitch":"Mí","freq":330},{"text":"ka","tone":"mid","pitch":"Re","freq":293},{"text":"damu","tone":"low","pitch":"Dó","freq":261},{"text":"lafiya","tone":"high","pitch":"Mí","freq":330},{"text":"za","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":36,"title":"Lesson 36: Bi hannun dama, wuce kas...","category":"Rhythm & Community","phrase":"Bi hannun dama, wuce kasuwa","phonetic":"[bi hannun dama, wuce kasuwa]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Bi","tone":"high","pitch":"Mí","freq":330},{"text":"hannun","tone":"mid","pitch":"Re","freq":293},{"text":"dama","tone":"low","pitch":"Dó","freq":261},{"text":"wuce","tone":"high","pitch":"Mí","freq":330},{"text":"kasuwa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":37,"title":"Lesson 37: Zaki shi ne sarkin daji...","category":"Rhythm & Community","phrase":"Zaki shi ne sarkin daji","phonetic":"[zaki shi ne sarkin daji]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Zaki","tone":"high","pitch":"Mí","freq":330},{"text":"shi","tone":"mid","pitch":"Re","freq":293},{"text":"ne","tone":"low","pitch":"Dó","freq":261},{"text":"sarkin","tone":"high","pitch":"Mí","freq":330},{"text":"daji","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":38,"title":"Lesson 38: Ka yi hakuri, ba zan sak...","category":"Rhythm & Community","phrase":"Ka yi hakuri, ba zan sake ba","phonetic":"[ka yi hakuri, ba zan sake ba]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ka","tone":"high","pitch":"Mí","freq":330},{"text":"yi","tone":"mid","pitch":"Re","freq":293},{"text":"hakuri","tone":"low","pitch":"Dó","freq":261},{"text":"ba","tone":"high","pitch":"Mí","freq":330},{"text":"zan","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":39,"title":"Lesson 39: Yi barci mai dadi ya dan...","category":"Rhythm & Community","phrase":"Yi barci mai dadi ya dana","phonetic":"[yi barci mai dadi ya dana]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Yi","tone":"high","pitch":"Mí","freq":330},{"text":"barci","tone":"mid","pitch":"Re","freq":293},{"text":"mai","tone":"low","pitch":"Dó","freq":261},{"text":"dadi","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":40,"title":"Lesson 40: Yaren Hausa zai dore har...","category":"Rhythm & Community","phrase":"Yaren Hausa zai dore har abada!","phonetic":"[yaren hausa zai dore har abada!]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Yaren","tone":"high","pitch":"Mí","freq":330},{"text":"Hausa","tone":"mid","pitch":"Re","freq":293},{"text":"zai","tone":"low","pitch":"Dó","freq":261},{"text":"dore","tone":"high","pitch":"Mí","freq":330},{"text":"har","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2}],"advanced":[{"id":41,"title":"Lesson 41: Mai hakuri yana dafa dut...","category":"Classical Proverbs","phrase":"Mai hakuri yana dafa dutse har ya sha romonsa","phonetic":"[mai hakuri yana dafa dutse har ya sha romonsa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Mai","tone":"high","pitch":"Mí","freq":330},{"text":"hakuri","tone":"mid","pitch":"Re","freq":293},{"text":"yana","tone":"low","pitch":"Dó","freq":261},{"text":"dafa","tone":"high","pitch":"Mí","freq":330},{"text":"dutse","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":42,"title":"Lesson 42: Hannu daya ba ya daukar ...","category":"Classical Proverbs","phrase":"Hannu daya ba ya daukar jinka","phonetic":"[hannu daya ba ya daukar jinka]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Hannu","tone":"high","pitch":"Mí","freq":330},{"text":"daya","tone":"mid","pitch":"Re","freq":293},{"text":"ba","tone":"low","pitch":"Dó","freq":261},{"text":"ya","tone":"high","pitch":"Mí","freq":330},{"text":"daukar","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":43,"title":"Lesson 43: Kada a manta da asalin g...","category":"Classical Proverbs","phrase":"Kada a manta da asalin gida","phonetic":"[kada a manta da asalin gida]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kada","tone":"high","pitch":"Mí","freq":330},{"text":"a","tone":"mid","pitch":"Re","freq":293},{"text":"manta","tone":"low","pitch":"Dó","freq":261},{"text":"da","tone":"high","pitch":"Mí","freq":330},{"text":"asalin","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":44,"title":"Lesson 44: Gaisuwar ban girma ga Sa...","category":"Classical Proverbs","phrase":"Gaisuwar ban girma ga Sarki mai adalci","phonetic":"[gaisuwar ban girma ga sarki mai adalci]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Gaisuwar","tone":"high","pitch":"Mí","freq":330},{"text":"ban","tone":"mid","pitch":"Re","freq":293},{"text":"girma","tone":"low","pitch":"Dó","freq":261},{"text":"ga","tone":"high","pitch":"Mí","freq":330},{"text":"Sarki","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":45,"title":"Lesson 45: Kyakkyawan hali shi ne a...","category":"Classical Proverbs","phrase":"Kyakkyawan hali shi ne ado na gari","phonetic":"[kyakkyawan hali shi ne ado na gari]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kyakkyawan","tone":"high","pitch":"Mí","freq":330},{"text":"hali","tone":"mid","pitch":"Re","freq":293},{"text":"shi","tone":"low","pitch":"Dó","freq":261},{"text":"ne","tone":"high","pitch":"Mí","freq":330},{"text":"ado","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":46,"title":"Lesson 46: Labarin Gizo da Koki a d...","category":"Classical Proverbs","phrase":"Labarin Gizo da Koki a daji","phonetic":"[labarin gizo da koki a daji]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Labarin","tone":"high","pitch":"Mí","freq":330},{"text":"Gizo","tone":"mid","pitch":"Re","freq":293},{"text":"da","tone":"low","pitch":"Dó","freq":261},{"text":"Koki","tone":"high","pitch":"Mí","freq":330},{"text":"a","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":47,"title":"Lesson 47: Kogin da ya manta tushen...","category":"Classical Proverbs","phrase":"Kogin da ya manta tushensa zai bushe","phonetic":"[kogin da ya manta tushensa zai bushe]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kogin","tone":"high","pitch":"Mí","freq":330},{"text":"da","tone":"mid","pitch":"Re","freq":293},{"text":"ya","tone":"low","pitch":"Dó","freq":261},{"text":"manta","tone":"high","pitch":"Mí","freq":330},{"text":"tushensa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":48,"title":"Lesson 48: Muna daga zuriar mutanen...","category":"Classical Proverbs","phrase":"Muna daga zuriar mutanen kwarai","phonetic":"[muna daga zuriar mutanen kwarai]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Muna","tone":"high","pitch":"Mí","freq":330},{"text":"daga","tone":"mid","pitch":"Re","freq":293},{"text":"zuriar","tone":"low","pitch":"Dó","freq":261},{"text":"mutanen","tone":"high","pitch":"Mí","freq":330},{"text":"kwarai","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":49,"title":"Lesson 49: Magungunan gargajiya na ...","category":"Classical Proverbs","phrase":"Magungunan gargajiya na ganyaye","phonetic":"[magungunan gargajiya na ganyaye]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Magungunan","tone":"high","pitch":"Mí","freq":330},{"text":"gargajiya","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"ganyaye","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":50,"title":"Lesson 50: Shugaba mai hakuri shi k...","category":"Classical Proverbs","phrase":"Shugaba mai hakuri shi ke tara jamaa","phonetic":"[shugaba mai hakuri shi ke tara jamaa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Shugaba","tone":"high","pitch":"Mí","freq":330},{"text":"mai","tone":"mid","pitch":"Re","freq":293},{"text":"hakuri","tone":"low","pitch":"Dó","freq":261},{"text":"shi","tone":"high","pitch":"Mí","freq":330},{"text":"ke","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":51,"title":"Lesson 51: Saurari muryar kakanni a...","category":"Philosophy & Blessings","phrase":"Saurari muryar kakanni a cikin iska","phonetic":"[saurari muryar kakanni a cikin iska]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Saurari","tone":"high","pitch":"Mí","freq":330},{"text":"muryar","tone":"mid","pitch":"Re","freq":293},{"text":"kakanni","tone":"low","pitch":"Dó","freq":261},{"text":"a","tone":"high","pitch":"Mí","freq":330},{"text":"cikin","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":52,"title":"Lesson 52: Wane abu ne yake tafiya ...","category":"Philosophy & Blessings","phrase":"Wane abu ne yake tafiya ba kafa? (Iska)","phonetic":"[wane abu ne yake tafiya ba kafa? (iska)]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Wane","tone":"high","pitch":"Mí","freq":330},{"text":"abu","tone":"mid","pitch":"Re","freq":293},{"text":"ne","tone":"low","pitch":"Dó","freq":261},{"text":"yake","tone":"high","pitch":"Mí","freq":330},{"text":"tafiya","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":53,"title":"Lesson 53: Fasahar zamani a harshen...","category":"Philosophy & Blessings","phrase":"Fasahar zamani a harshen Hausa","phonetic":"[fasahar zamani a harshen hausa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Fasahar","tone":"high","pitch":"Mí","freq":330},{"text":"zamani","tone":"mid","pitch":"Re","freq":293},{"text":"a","tone":"low","pitch":"Dó","freq":261},{"text":"harshen","tone":"high","pitch":"Mí","freq":330},{"text":"Hausa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":54,"title":"Lesson 54: Bari mu sasanta da kalam...","category":"Philosophy & Blessings","phrase":"Bari mu sasanta da kalaman alheri","phonetic":"[bari mu sasanta da kalaman alheri]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Bari","tone":"high","pitch":"Mí","freq":330},{"text":"mu","tone":"mid","pitch":"Re","freq":293},{"text":"sasanta","tone":"low","pitch":"Dó","freq":261},{"text":"da","tone":"high","pitch":"Mí","freq":330},{"text":"kalaman","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":55,"title":"Lesson 55: Lokaci ba ya jiran kowa...","category":"Philosophy & Blessings","phrase":"Lokaci ba ya jiran kowa","phonetic":"[lokaci ba ya jiran kowa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Lokaci","tone":"high","pitch":"Mí","freq":330},{"text":"ba","tone":"mid","pitch":"Re","freq":293},{"text":"ya","tone":"low","pitch":"Dó","freq":261},{"text":"jiran","tone":"high","pitch":"Mí","freq":330},{"text":"kowa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":56,"title":"Lesson 56: Matasa ne ginshikin gobe...","category":"Philosophy & Blessings","phrase":"Matasa ne ginshikin gobenmu","phonetic":"[matasa ne ginshikin gobenmu]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Matasa","tone":"high","pitch":"Mí","freq":330},{"text":"ne","tone":"mid","pitch":"Re","freq":293},{"text":"ginshikin","tone":"low","pitch":"Dó","freq":261},{"text":"gobenmu","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":57,"title":"Lesson 57: Uda da sauti na musamman...","category":"Philosophy & Blessings","phrase":"Uda da sauti na musamman a Hausa","phonetic":"[uda da sauti na musamman a hausa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Uda","tone":"high","pitch":"Mí","freq":330},{"text":"da","tone":"mid","pitch":"Re","freq":293},{"text":"sauti","tone":"low","pitch":"Dó","freq":261},{"text":"na","tone":"high","pitch":"Mí","freq":330},{"text":"musamman","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":58,"title":"Lesson 58: Addua da albarka ga duk ...","category":"Philosophy & Blessings","phrase":"Addua da albarka ga duk mai neman sani","phonetic":"[addua da albarka ga duk mai neman sani]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Addua","tone":"high","pitch":"Mí","freq":330},{"text":"da","tone":"mid","pitch":"Re","freq":293},{"text":"albarka","tone":"low","pitch":"Dó","freq":261},{"text":"ga","tone":"high","pitch":"Mí","freq":330},{"text":"duk","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":59,"title":"Lesson 59: Ilmi garkuwar rayuwa ce...","category":"Philosophy & Blessings","phrase":"Ilmi garkuwar rayuwa ce","phonetic":"[ilmi garkuwar rayuwa ce]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ilmi","tone":"high","pitch":"Mí","freq":330},{"text":"garkuwar","tone":"mid","pitch":"Re","freq":293},{"text":"rayuwa","tone":"low","pitch":"Dó","freq":261},{"text":"ce","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":60,"title":"Lesson 60: Amin! Allah Ya kara mana...","category":"Philosophy & Blessings","phrase":"Amin! Allah Ya kara mana basira da daukaka!","phonetic":"[amin! allah ya kara mana basira da daukaka!]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Amin","tone":"high","pitch":"Mí","freq":330},{"text":"Allah","tone":"mid","pitch":"Re","freq":293},{"text":"Ya","tone":"low","pitch":"Dó","freq":261},{"text":"kara","tone":"high","pitch":"Mí","freq":330},{"text":"mana","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3}]},"swahili":{"beginner":[{"id":1,"title":"Lesson 1: Habari za asubuhi, asant...","category":"Greetings & Tones","phrase":"Habari za asubuhi, asante sana","phonetic":"[habari za asubuhi, asante sana]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Habari","tone":"high","pitch":"Mí","freq":330},{"text":"za","tone":"mid","pitch":"Re","freq":293},{"text":"asubuhi","tone":"low","pitch":"Dó","freq":261},{"text":"asante","tone":"high","pitch":"Mí","freq":330},{"text":"sana","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":2,"title":"Lesson 2: Hujambo rafiki yangu mpe...","category":"Greetings & Tones","phrase":"Hujambo rafiki yangu mpendwa?","phonetic":"[hujambo rafiki yangu mpendwa?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Hujambo","tone":"high","pitch":"Mí","freq":330},{"text":"rafiki","tone":"mid","pitch":"Re","freq":293},{"text":"yangu","tone":"low","pitch":"Dó","freq":261},{"text":"mpendwa","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":3,"title":"Lesson 3: Jina langu ni Baraka, ni...","category":"Greetings & Tones","phrase":"Jina langu ni Baraka, nina furaha tele","phonetic":"[jina langu ni baraka, nina furaha tele]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Jina","tone":"high","pitch":"Mí","freq":330},{"text":"langu","tone":"mid","pitch":"Re","freq":293},{"text":"ni","tone":"low","pitch":"Dó","freq":261},{"text":"Baraka","tone":"high","pitch":"Mí","freq":330},{"text":"nina","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":4,"title":"Lesson 4: Moja, Mbili, Tatu, Nne, ...","category":"Greetings & Tones","phrase":"Moja, Mbili, Tatu, Nne, Tano","phonetic":"[moja, mbili, tatu, nne, tano]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Moja","tone":"high","pitch":"Mí","freq":330},{"text":"Mbili","tone":"mid","pitch":"Re","freq":293},{"text":"Tatu","tone":"low","pitch":"Dó","freq":261},{"text":"Nne","tone":"high","pitch":"Mí","freq":330},{"text":"Tano","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":5,"title":"Lesson 5: Sita, Saba, Nane, Tisa, ...","category":"Greetings & Tones","phrase":"Sita, Saba, Nane, Tisa, Kumi","phonetic":"[sita, saba, nane, tisa, kumi]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Sita","tone":"high","pitch":"Mí","freq":330},{"text":"Saba","tone":"mid","pitch":"Re","freq":293},{"text":"Nane","tone":"low","pitch":"Dó","freq":261},{"text":"Tisa","tone":"high","pitch":"Mí","freq":330},{"text":"Kumi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":6,"title":"Lesson 6: Baba yangu, Mama yangu, ...","category":"Numbers & Kinship","phrase":"Baba yangu, Mama yangu, na Ndugu yangu","phonetic":"[baba yangu, mama yangu, na ndugu yangu]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Baba","tone":"high","pitch":"Mí","freq":330},{"text":"yangu","tone":"mid","pitch":"Re","freq":293},{"text":"Mama","tone":"low","pitch":"Dó","freq":261},{"text":"yangu","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":7,"title":"Lesson 7: Tafadhali, nipe maji bar...","category":"Numbers & Kinship","phrase":"Tafadhali, nipe maji baridi ya kunywa","phonetic":"[tafadhali, nipe maji baridi ya kunywa]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Tafadhali","tone":"high","pitch":"Mí","freq":330},{"text":"nipe","tone":"mid","pitch":"Re","freq":293},{"text":"maji","tone":"low","pitch":"Dó","freq":261},{"text":"baridi","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":8,"title":"Lesson 8: Nyekundu kama moto, Nyeu...","category":"Numbers & Kinship","phrase":"Nyekundu kama moto, Nyeusi, Nyeupe","phonetic":"[nyekundu kama moto, nyeusi, nyeupe]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nyekundu","tone":"high","pitch":"Mí","freq":330},{"text":"kama","tone":"mid","pitch":"Re","freq":293},{"text":"moto","tone":"low","pitch":"Dó","freq":261},{"text":"Nyeusi","tone":"high","pitch":"Mí","freq":330},{"text":"Nyeupe","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":9,"title":"Lesson 9: Nyumba yetu ni nzuri na ...","category":"Numbers & Kinship","phrase":"Nyumba yetu ni nzuri na safi sana","phonetic":"[nyumba yetu ni nzuri na safi sana]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nyumba","tone":"high","pitch":"Mí","freq":330},{"text":"yetu","tone":"mid","pitch":"Re","freq":293},{"text":"ni","tone":"low","pitch":"Dó","freq":261},{"text":"nzuri","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":10,"title":"Lesson 10: Nina amani moyoni mwangu...","category":"Numbers & Kinship","phrase":"Nina amani moyoni mwangu leo","phonetic":"[nina amani moyoni mwangu leo]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Nina","tone":"high","pitch":"Mí","freq":330},{"text":"amani","tone":"mid","pitch":"Re","freq":293},{"text":"moyoni","tone":"low","pitch":"Dó","freq":261},{"text":"mwangu","tone":"high","pitch":"Mí","freq":330},{"text":"leo","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":11,"title":"Lesson 11: Ndiyo bibi, Hapana bwana...","category":"Daily Life & Nature","phrase":"Ndiyo bibi, Hapana bwana, asante","phonetic":"[ndiyo bibi, hapana bwana, asante]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Ndiyo","tone":"high","pitch":"Mí","freq":330},{"text":"bibi","tone":"mid","pitch":"Re","freq":293},{"text":"Hapana","tone":"low","pitch":"Dó","freq":261},{"text":"bwana","tone":"high","pitch":"Mí","freq":330},{"text":"asante","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":12,"title":"Lesson 12: Hii samaki safi ni bei g...","category":"Daily Life & Nature","phrase":"Hii samaki safi ni bei gani?","phonetic":"[hii samaki safi ni bei gani?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Hii","tone":"high","pitch":"Mí","freq":330},{"text":"samaki","tone":"mid","pitch":"Re","freq":293},{"text":"safi","tone":"low","pitch":"Dó","freq":261},{"text":"ni","tone":"high","pitch":"Mí","freq":330},{"text":"bei","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":13,"title":"Lesson 13: Mbwa anabweka, Kuku anaw...","category":"Daily Life & Nature","phrase":"Mbwa anabweka, Kuku anawika asubuhi","phonetic":"[mbwa anabweka, kuku anawika asubuhi]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Mbwa","tone":"high","pitch":"Mí","freq":330},{"text":"anabweka","tone":"mid","pitch":"Re","freq":293},{"text":"Kuku","tone":"low","pitch":"Dó","freq":261},{"text":"anawika","tone":"high","pitch":"Mí","freq":330},{"text":"asubuhi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":14,"title":"Lesson 14: Jumatatu, Jumanne, Jumap...","category":"Daily Life & Nature","phrase":"Jumatatu, Jumanne, Jumapili","phonetic":"[jumatatu, jumanne, jumapili]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Jumatatu","tone":"high","pitch":"Mí","freq":330},{"text":"Jumanne","tone":"mid","pitch":"Re","freq":293},{"text":"Jumapili","tone":"low","pitch":"Dó","freq":261}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":15,"title":"Lesson 15: Kichwa, Macho, Pua, Mdom...","category":"Daily Life & Nature","phrase":"Kichwa, Macho, Pua, Mdomo, Mikono na Miguu","phonetic":"[kichwa, macho, pua, mdomo, mikono na miguu]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Kichwa","tone":"high","pitch":"Mí","freq":330},{"text":"Macho","tone":"mid","pitch":"Re","freq":293},{"text":"Pua","tone":"low","pitch":"Dó","freq":261},{"text":"Mdomo","tone":"high","pitch":"Mí","freq":330},{"text":"Mikono","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":16,"title":"Lesson 16: Shule yetu nzuri iko wap...","category":"Daily Life & Nature","phrase":"Shule yetu nzuri iko wapi?","phonetic":"[shule yetu nzuri iko wapi?]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Shule","tone":"high","pitch":"Mí","freq":330},{"text":"yetu","tone":"mid","pitch":"Re","freq":293},{"text":"nzuri","tone":"low","pitch":"Dó","freq":261},{"text":"iko","tone":"high","pitch":"Mí","freq":330},{"text":"wapi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":17,"title":"Lesson 17: Karibu tule chakula kita...","category":"Daily Life & Nature","phrase":"Karibu tule chakula kitamu pamoja","phonetic":"[karibu tule chakula kitamu pamoja]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Karibu","tone":"high","pitch":"Mí","freq":330},{"text":"tule","tone":"mid","pitch":"Re","freq":293},{"text":"chakula","tone":"low","pitch":"Dó","freq":261},{"text":"kitamu","tone":"high","pitch":"Mí","freq":330},{"text":"pamoja","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":18,"title":"Lesson 18: Jua linangaa, mvua inany...","category":"Daily Life & Nature","phrase":"Jua linangaa, mvua inanyesha ardhini","phonetic":"[jua linangaa, mvua inanyesha ardhini]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Jua","tone":"high","pitch":"Mí","freq":330},{"text":"linangaa","tone":"mid","pitch":"Re","freq":293},{"text":"mvua","tone":"low","pitch":"Dó","freq":261},{"text":"inanyesha","tone":"high","pitch":"Mí","freq":330},{"text":"ardhini","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":19,"title":"Lesson 19: Lala salama, Mungu atuli...","category":"Daily Life & Nature","phrase":"Lala salama, Mungu atulinde sote","phonetic":"[lala salama, mungu atulinde sote]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Lala","tone":"high","pitch":"Mí","freq":330},{"text":"salama","tone":"mid","pitch":"Re","freq":293},{"text":"Mungu","tone":"low","pitch":"Dó","freq":261},{"text":"atulinde","tone":"high","pitch":"Mí","freq":330},{"text":"sote","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1},{"id":20,"title":"Lesson 20: Mimi ni mtoto shujaa, lu...","category":"Daily Life & Nature","phrase":"Mimi ni mtoto shujaa, lugha yangu ni fahari yangu!","phonetic":"[mimi ni mtoto shujaa, lugha yangu ni fahari yangu!]","tonePattern":"Dó-Re-Mí Fundamental Tone Progression","syllables":[{"text":"Mimi","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"mtoto","tone":"low","pitch":"Dó","freq":261},{"text":"shujaa","tone":"high","pitch":"Mí","freq":330},{"text":"lugha","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":1}],"intermediate":[{"id":21,"title":"Lesson 21: Paukwa! Pakawa! Hadithi ...","category":"Conversations & Culture","phrase":"Paukwa! Pakawa! Hadithi njoo...","phonetic":"[paukwa! pakawa! hadithi njoo...]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Paukwa","tone":"high","pitch":"Mí","freq":330},{"text":"Pakawa","tone":"mid","pitch":"Re","freq":293},{"text":"Hadithi","tone":"low","pitch":"Dó","freq":261},{"text":"njoo","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":22,"title":"Lesson 22: Ninapenda michezo ya kit...","category":"Conversations & Culture","phrase":"Ninapenda michezo ya kitamaduni na nyimbo","phonetic":"[ninapenda michezo ya kitamaduni na nyimbo]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ninapenda","tone":"high","pitch":"Mí","freq":330},{"text":"michezo","tone":"mid","pitch":"Re","freq":293},{"text":"ya","tone":"low","pitch":"Dó","freq":261},{"text":"kitamaduni","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":23,"title":"Lesson 23: Mavazi ya asili ya Kiafr...","category":"Conversations & Culture","phrase":"Mavazi ya asili ya Kiafrika yanapendeza","phonetic":"[mavazi ya asili ya kiafrika yanapendeza]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Mavazi","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293},{"text":"asili","tone":"low","pitch":"Dó","freq":261},{"text":"ya","tone":"high","pitch":"Mí","freq":330},{"text":"Kiafrika","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":24,"title":"Lesson 24: Tushiriki mchezo wa bao...","category":"Conversations & Culture","phrase":"Tushiriki mchezo wa bao","phonetic":"[tushiriki mchezo wa bao]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Tushiriki","tone":"high","pitch":"Mí","freq":330},{"text":"mchezo","tone":"mid","pitch":"Re","freq":293},{"text":"wa","tone":"low","pitch":"Dó","freq":261},{"text":"bao","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":25,"title":"Lesson 25: Ngoma za kitamaduni zina...","category":"Conversations & Culture","phrase":"Ngoma za kitamaduni zinasikika kijijini","phonetic":"[ngoma za kitamaduni zinasikika kijijini]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ngoma","tone":"high","pitch":"Mí","freq":330},{"text":"za","tone":"mid","pitch":"Re","freq":293},{"text":"kitamaduni","tone":"low","pitch":"Dó","freq":261},{"text":"zinasikika","tone":"high","pitch":"Mí","freq":330},{"text":"kijijini","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":26,"title":"Lesson 26: Nipe ugali na sukuma wik...","category":"Conversations & Culture","phrase":"Nipe ugali na sukuma wiki na samaki","phonetic":"[nipe ugali na sukuma wiki na samaki]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Nipe","tone":"high","pitch":"Mí","freq":330},{"text":"ugali","tone":"mid","pitch":"Re","freq":293},{"text":"na","tone":"low","pitch":"Dó","freq":261},{"text":"sukuma","tone":"high","pitch":"Mí","freq":330},{"text":"wiki","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":27,"title":"Lesson 27: Ni saa ngapi sasa hivi?...","category":"Conversations & Culture","phrase":"Ni saa ngapi sasa hivi?","phonetic":"[ni saa ngapi sasa hivi?]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Ni","tone":"high","pitch":"Mí","freq":330},{"text":"saa","tone":"mid","pitch":"Re","freq":293},{"text":"ngapi","tone":"low","pitch":"Dó","freq":261},{"text":"sasa","tone":"high","pitch":"Mí","freq":330},{"text":"hivi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":28,"title":"Lesson 28: Nyanya ananifundisha mas...","category":"Conversations & Culture","phrase":"Nyanya ananifundisha mashairi ya kale","phonetic":"[nyanya ananifundisha mashairi ya kale]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Nyanya","tone":"high","pitch":"Mí","freq":330},{"text":"ananifundisha","tone":"mid","pitch":"Re","freq":293},{"text":"mashairi","tone":"low","pitch":"Dó","freq":261},{"text":"ya","tone":"high","pitch":"Mí","freq":330},{"text":"kale","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":29,"title":"Lesson 29: Nairobi na Mombasa ni mi...","category":"Conversations & Culture","phrase":"Nairobi na Mombasa ni miji mizuri","phonetic":"[nairobi na mombasa ni miji mizuri]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Nairobi","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"Mombasa","tone":"low","pitch":"Dó","freq":261},{"text":"ni","tone":"high","pitch":"Mí","freq":330},{"text":"miji","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":30,"title":"Lesson 30: Kiswahili na teknolojia ...","category":"Conversations & Culture","phrase":"Kiswahili na teknolojia ya kompyuta","phonetic":"[kiswahili na teknolojia ya kompyuta]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kiswahili","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"teknolojia","tone":"low","pitch":"Dó","freq":261},{"text":"ya","tone":"high","pitch":"Mí","freq":330},{"text":"kompyuta","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":31,"title":"Lesson 31: Sikukuu ya mavuno imewas...","category":"Rhythm & Community","phrase":"Sikukuu ya mavuno imewasili kwa furaha","phonetic":"[sikukuu ya mavuno imewasili kwa furaha]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Sikukuu","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293},{"text":"mavuno","tone":"low","pitch":"Dó","freq":261},{"text":"imewasili","tone":"high","pitch":"Mí","freq":330},{"text":"kwa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":32,"title":"Lesson 32: Tafadhali nipunguzie bei...","category":"Rhythm & Community","phrase":"Tafadhali nipunguzie bei kidogo","phonetic":"[tafadhali nipunguzie bei kidogo]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Tafadhali","tone":"high","pitch":"Mí","freq":330},{"text":"nipunguzie","tone":"mid","pitch":"Re","freq":293},{"text":"bei","tone":"low","pitch":"Dó","freq":261},{"text":"kidogo","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":33,"title":"Lesson 33: Kwa maoni yangu, lugha y...","category":"Rhythm & Community","phrase":"Kwa maoni yangu, lugha yetu ni utajiri wetu","phonetic":"[kwa maoni yangu, lugha yetu ni utajiri wetu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kwa","tone":"high","pitch":"Mí","freq":330},{"text":"maoni","tone":"mid","pitch":"Re","freq":293},{"text":"yangu","tone":"low","pitch":"Dó","freq":261},{"text":"lugha","tone":"high","pitch":"Mí","freq":330},{"text":"yetu","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":34,"title":"Lesson 34: Asali ni tamu, pilipili ...","category":"Rhythm & Community","phrase":"Asali ni tamu, pilipili inawasha","phonetic":"[asali ni tamu, pilipili inawasha]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Asali","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"tamu","tone":"low","pitch":"Dó","freq":261},{"text":"pilipili","tone":"high","pitch":"Mí","freq":330},{"text":"inawasha","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":35,"title":"Lesson 35: Usijali, amani itatawala...","category":"Rhythm & Community","phrase":"Usijali, amani itatawala","phonetic":"[usijali, amani itatawala]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Usijali","tone":"high","pitch":"Mí","freq":330},{"text":"amani","tone":"mid","pitch":"Re","freq":293},{"text":"itatawala","tone":"low","pitch":"Dó","freq":261}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":36,"title":"Lesson 36: Shika mkono wa kulia, pi...","category":"Rhythm & Community","phrase":"Shika mkono wa kulia, pita sokoni","phonetic":"[shika mkono wa kulia, pita sokoni]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Shika","tone":"high","pitch":"Mí","freq":330},{"text":"mkono","tone":"mid","pitch":"Re","freq":293},{"text":"wa","tone":"low","pitch":"Dó","freq":261},{"text":"kulia","tone":"high","pitch":"Mí","freq":330},{"text":"pita","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":37,"title":"Lesson 37: Simba ndiye mfalme wa wa...","category":"Rhythm & Community","phrase":"Simba ndiye mfalme wa wanyama wote","phonetic":"[simba ndiye mfalme wa wanyama wote]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Simba","tone":"high","pitch":"Mí","freq":330},{"text":"ndiye","tone":"mid","pitch":"Re","freq":293},{"text":"mfalme","tone":"low","pitch":"Dó","freq":261},{"text":"wa","tone":"high","pitch":"Mí","freq":330},{"text":"wanyama","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":38,"title":"Lesson 38: Nisamehe, sitafanya tena...","category":"Rhythm & Community","phrase":"Nisamehe, sitafanya tena","phonetic":"[nisamehe, sitafanya tena]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Nisamehe","tone":"high","pitch":"Mí","freq":330},{"text":"sitafanya","tone":"mid","pitch":"Re","freq":293},{"text":"tena","tone":"low","pitch":"Dó","freq":261}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":39,"title":"Lesson 39: Lala usingizi mnono mwan...","category":"Rhythm & Community","phrase":"Lala usingizi mnono mwanangu","phonetic":"[lala usingizi mnono mwanangu]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Lala","tone":"high","pitch":"Mí","freq":330},{"text":"usingizi","tone":"mid","pitch":"Re","freq":293},{"text":"mnono","tone":"low","pitch":"Dó","freq":261},{"text":"mwanangu","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2},{"id":40,"title":"Lesson 40: Kiswahili kitadumu midom...","category":"Rhythm & Community","phrase":"Kiswahili kitadumu midomoni mwetu daima!","phonetic":"[kiswahili kitadumu midomoni mwetu daima!]","tonePattern":"Intermediate Dynamic Pitch Harmony","syllables":[{"text":"Kiswahili","tone":"high","pitch":"Mí","freq":330},{"text":"kitadumu","tone":"mid","pitch":"Re","freq":293},{"text":"midomoni","tone":"low","pitch":"Dó","freq":261},{"text":"mwetu","tone":"high","pitch":"Mí","freq":330},{"text":"daima","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":2}],"advanced":[{"id":41,"title":"Lesson 41: Mvumilivu hula mbivu sik...","category":"Classical Proverbs","phrase":"Mvumilivu hula mbivu siku zote","phonetic":"[mvumilivu hula mbivu siku zote]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Mvumilivu","tone":"high","pitch":"Mí","freq":330},{"text":"hula","tone":"mid","pitch":"Re","freq":293},{"text":"mbivu","tone":"low","pitch":"Dó","freq":261},{"text":"siku","tone":"high","pitch":"Mí","freq":330},{"text":"zote","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":42,"title":"Lesson 42: Umoja ni nguvu, utengano...","category":"Classical Proverbs","phrase":"Umoja ni nguvu, utengano ni udhaifu","phonetic":"[umoja ni nguvu, utengano ni udhaifu]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Umoja","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"nguvu","tone":"low","pitch":"Dó","freq":261},{"text":"utengano","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":43,"title":"Lesson 43: Chururu si ndo ndo ndo...","category":"Classical Proverbs","phrase":"Chururu si ndo ndo ndo","phonetic":"[chururu si ndo ndo ndo]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Chururu","tone":"high","pitch":"Mí","freq":330},{"text":"si","tone":"mid","pitch":"Re","freq":293},{"text":"ndo","tone":"low","pitch":"Dó","freq":261},{"text":"ndo","tone":"high","pitch":"Mí","freq":330},{"text":"ndo","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":44,"title":"Lesson 44: Heshima kuu kwa kiongozi...","category":"Classical Proverbs","phrase":"Heshima kuu kwa kiongozi mwenye hekima","phonetic":"[heshima kuu kwa kiongozi mwenye hekima]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Heshima","tone":"high","pitch":"Mí","freq":330},{"text":"kuu","tone":"mid","pitch":"Re","freq":293},{"text":"kwa","tone":"low","pitch":"Dó","freq":261},{"text":"kiongozi","tone":"high","pitch":"Mí","freq":330},{"text":"mwenye","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":45,"title":"Lesson 45: Utu na ukarimu ndio uzur...","category":"Classical Proverbs","phrase":"Utu na ukarimu ndio uzuri wa mwanadamu","phonetic":"[utu na ukarimu ndio uzuri wa mwanadamu]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Utu","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"ukarimu","tone":"low","pitch":"Dó","freq":261},{"text":"ndio","tone":"high","pitch":"Mí","freq":330},{"text":"uzuri","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":46,"title":"Lesson 46: Hadithi ya Sungura mjanj...","category":"Classical Proverbs","phrase":"Hadithi ya Sungura mjanja msituni","phonetic":"[hadithi ya sungura mjanja msituni]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Hadithi","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293},{"text":"Sungura","tone":"low","pitch":"Dó","freq":261},{"text":"mjanja","tone":"high","pitch":"Mí","freq":330},{"text":"msituni","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":47,"title":"Lesson 47: Mto unaosahau chanzo cha...","category":"Classical Proverbs","phrase":"Mto unaosahau chanzo chake hukauka kabisa","phonetic":"[mto unaosahau chanzo chake hukauka kabisa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Mto","tone":"high","pitch":"Mí","freq":330},{"text":"unaosahau","tone":"mid","pitch":"Re","freq":293},{"text":"chanzo","tone":"low","pitch":"Dó","freq":261},{"text":"chake","tone":"high","pitch":"Mí","freq":330},{"text":"hukauka","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":48,"title":"Lesson 48: Tunatokana na kizazi cha...","category":"Classical Proverbs","phrase":"Tunatokana na kizazi cha mashujaa","phonetic":"[tunatokana na kizazi cha mashujaa]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Tunatokana","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"kizazi","tone":"low","pitch":"Dó","freq":261},{"text":"cha","tone":"high","pitch":"Mí","freq":330},{"text":"mashujaa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":49,"title":"Lesson 49: Dawa asilia za mimea na ...","category":"Classical Proverbs","phrase":"Dawa asilia za mimea na mizizi","phonetic":"[dawa asilia za mimea na mizizi]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Dawa","tone":"high","pitch":"Mí","freq":330},{"text":"asilia","tone":"mid","pitch":"Re","freq":293},{"text":"za","tone":"low","pitch":"Dó","freq":261},{"text":"mimea","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":50,"title":"Lesson 50: Kiongozi mtulivu hukusan...","category":"Classical Proverbs","phrase":"Kiongozi mtulivu hukusanya jamii","phonetic":"[kiongozi mtulivu hukusanya jamii]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kiongozi","tone":"high","pitch":"Mí","freq":330},{"text":"mtulivu","tone":"mid","pitch":"Re","freq":293},{"text":"hukusanya","tone":"low","pitch":"Dó","freq":261},{"text":"jamii","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":51,"title":"Lesson 51: Sikiliza sauti ya wazee ...","category":"Philosophy & Blessings","phrase":"Sikiliza sauti ya wazee kwenye upepo","phonetic":"[sikiliza sauti ya wazee kwenye upepo]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Sikiliza","tone":"high","pitch":"Mí","freq":330},{"text":"sauti","tone":"mid","pitch":"Re","freq":293},{"text":"ya","tone":"low","pitch":"Dó","freq":261},{"text":"wazee","tone":"high","pitch":"Mí","freq":330},{"text":"kwenye","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":52,"title":"Lesson 52: Kitendawili: Huenda bila...","category":"Philosophy & Blessings","phrase":"Kitendawili: Huenda bila miguu? (Upepo)","phonetic":"[kitendawili: huenda bila miguu? (upepo)]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Kitendawili","tone":"high","pitch":"Mí","freq":330},{"text":"Huenda","tone":"mid","pitch":"Re","freq":293},{"text":"bila","tone":"low","pitch":"Dó","freq":261},{"text":"miguu","tone":"high","pitch":"Mí","freq":330},{"text":"Upepo","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":53,"title":"Lesson 53: Sayansi na teknolojia ya...","category":"Philosophy & Blessings","phrase":"Sayansi na teknolojia ya kisasa katika Kiswahili","phonetic":"[sayansi na teknolojia ya kisasa katika kiswahili]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Sayansi","tone":"high","pitch":"Mí","freq":330},{"text":"na","tone":"mid","pitch":"Re","freq":293},{"text":"teknolojia","tone":"low","pitch":"Dó","freq":261},{"text":"ya","tone":"high","pitch":"Mí","freq":330},{"text":"kisasa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":54,"title":"Lesson 54: Tujenge amani kwa mazung...","category":"Philosophy & Blessings","phrase":"Tujenge amani kwa mazungumzo ya busara","phonetic":"[tujenge amani kwa mazungumzo ya busara]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Tujenge","tone":"high","pitch":"Mí","freq":330},{"text":"amani","tone":"mid","pitch":"Re","freq":293},{"text":"kwa","tone":"low","pitch":"Dó","freq":261},{"text":"mazungumzo","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":55,"title":"Lesson 55: Wakati hausubiri mtu yey...","category":"Philosophy & Blessings","phrase":"Wakati hausubiri mtu yeyote","phonetic":"[wakati hausubiri mtu yeyote]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Wakati","tone":"high","pitch":"Mí","freq":330},{"text":"hausubiri","tone":"mid","pitch":"Re","freq":293},{"text":"mtu","tone":"low","pitch":"Dó","freq":261},{"text":"yeyote","tone":"high","pitch":"Mí","freq":330}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":56,"title":"Lesson 56: Vijana ndio nguzo ya kes...","category":"Philosophy & Blessings","phrase":"Vijana ndio nguzo ya kesho yetu","phonetic":"[vijana ndio nguzo ya kesho yetu]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Vijana","tone":"high","pitch":"Mí","freq":330},{"text":"ndio","tone":"mid","pitch":"Re","freq":293},{"text":"nguzo","tone":"low","pitch":"Dó","freq":261},{"text":"ya","tone":"high","pitch":"Mí","freq":330},{"text":"kesho","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":57,"title":"Lesson 57: Lugha ya Kiswahili ina m...","category":"Philosophy & Blessings","phrase":"Lugha ya Kiswahili ina mahadhi matamu","phonetic":"[lugha ya kiswahili ina mahadhi matamu]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Lugha","tone":"high","pitch":"Mí","freq":330},{"text":"ya","tone":"mid","pitch":"Re","freq":293},{"text":"Kiswahili","tone":"low","pitch":"Dó","freq":261},{"text":"ina","tone":"high","pitch":"Mí","freq":330},{"text":"mahadhi","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":58,"title":"Lesson 58: Ushairi wa kale wa mashu...","category":"Philosophy & Blessings","phrase":"Ushairi wa kale wa mashujaa wa pwani","phonetic":"[ushairi wa kale wa mashujaa wa pwani]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Ushairi","tone":"high","pitch":"Mí","freq":330},{"text":"wa","tone":"mid","pitch":"Re","freq":293},{"text":"kale","tone":"low","pitch":"Dó","freq":261},{"text":"wa","tone":"high","pitch":"Mí","freq":330},{"text":"mashujaa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":59,"title":"Lesson 59: Elimu ni mwanga wa maish...","category":"Philosophy & Blessings","phrase":"Elimu ni mwanga wa maisha yetu","phonetic":"[elimu ni mwanga wa maisha yetu]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Elimu","tone":"high","pitch":"Mí","freq":330},{"text":"ni","tone":"mid","pitch":"Re","freq":293},{"text":"mwanga","tone":"low","pitch":"Dó","freq":261},{"text":"wa","tone":"high","pitch":"Mí","freq":330},{"text":"maisha","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3},{"id":60,"title":"Lesson 60: Amina! Mungu atubariki s...","category":"Philosophy & Blessings","phrase":"Amina! Mungu atubariki sote kwa hekima na upendo!","phonetic":"[amina! mungu atubariki sote kwa hekima na upendo!]","tonePattern":"Advanced Classical African Polyphony","syllables":[{"text":"Amina","tone":"high","pitch":"Mí","freq":330},{"text":"Mungu","tone":"mid","pitch":"Re","freq":293},{"text":"atubariki","tone":"low","pitch":"Dó","freq":261},{"text":"sote","tone":"high","pitch":"Mí","freq":330},{"text":"kwa","tone":"mid","pitch":"Re","freq":293}],"translation":"","culturalTip":"Pronouncing this phrase with correct native pitch inflection connects kids directly with living African cultural heritage.","difficulty":3}]}};

    TRAINER_CURRICULUM.yoruba.beginner.find((lesson) => lesson.id === 3).translation =
      'My name is Temitope, and I am happy.';

    // Add zulu and twi aliases
    TRAINER_CURRICULUM.zulu = TRAINER_CURRICULUM.swahili;
    TRAINER_CURRICULUM.twi = TRAINER_CURRICULUM.yoruba;

    if (!state.trainer) {
      state.trainer = { ...defaults.trainer };
    }

    let audioCtx = null;
    let micStream = null;
    let animFrameId = null;
    let voicePracticeRecorder = null;
    let voicePracticeChunks = [];
    let voiceDictationRecorder = null;
    let voiceTranscriptionResult = null;
    let activePlotweaverAudio = null;
    let activePlotweaverObjectUrl = '';
    let recommendedYorubaVoicePromise = null;
    let translationSpeechSpeed = 1;

    function getAudioContext() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playToneSound(freq, duration = 0.3, type = "triangle") {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        console.warn("Audio synth fallback", e);
      }
    }

    function playLessonTonalSequence(syllables, speed = 1.0) {
      if (!Array.isArray(syllables) || !syllables.length) return;
      const stepDuration = 0.35 / speed;
      syllables.forEach((s, idx) => {
        window.setTimeout(() => {
          playToneSound(s.freq || 293, stepDuration * 0.9, "triangle");
          const pills = document.querySelectorAll(".syllable-sound-pill");
          if (pills[idx]) {
            pills[idx].classList.add("is-active-pitch");
            window.setTimeout(() => pills[idx].classList.remove("is-active-pitch"), 350);
          }
        }, idx * stepDuration * 1000);
      });
    }

    function trainerLanguageCode(lang = state.trainer.lang) {
      return { yoruba: 'yo', igbo: 'ig', hausa: 'ha', swahili: 'sw', zulu: 'zu', twi: 'ak' }[lang] || 'yo';
    }

    async function playPlotweaverSpeech(text, language, { voiceId: requestedVoiceId, allowDeviceFallback = true } = {}) {
      if (typeof text !== 'string' || !text.trim() || text.length > 1_000) {
        throw new Error('Speech text must contain 1–1,000 characters.');
      }
      if (activePlotweaverAudio) {
        activePlotweaverAudio.pause();
        activePlotweaverAudio = null;
      }
      if (activePlotweaverObjectUrl) URL.revokeObjectURL(activePlotweaverObjectUrl);
      activePlotweaverObjectUrl = '';
      const voiceId = requestedVoiceId
        || document.getElementById('plotweaver-voice-select')?.value
        || state.trainer.voiceId
        || undefined;
      try {
        const blob = await synthesizePlotweaverSpeech({ text, language, voiceId });
        const objectUrl = URL.createObjectURL(blob);
        activePlotweaverObjectUrl = objectUrl;
        activePlotweaverAudio = new Audio(objectUrl);
        activePlotweaverAudio.addEventListener('ended', () => {
          if (activePlotweaverObjectUrl === objectUrl) {
            activePlotweaverAudio = null;
            URL.revokeObjectURL(objectUrl);
            activePlotweaverObjectUrl = '';
          }
        }, { once: true });
        await activePlotweaverAudio.play();
        return 'plotweaver';
      } catch (serviceError) {
        activePlotweaverAudio?.pause();
        activePlotweaverAudio = null;
        if (activePlotweaverObjectUrl) URL.revokeObjectURL(activePlotweaverObjectUrl);
        activePlotweaverObjectUrl = '';
        if (voiceId || !allowDeviceFallback) throw serviceError;
        try {
          await speakWithDeviceVoice(text, language);
          return 'device';
        } catch (deviceError) {
          const serviceMessage = serviceError instanceof Error ? serviceError.message : 'Idilewa voice audio is unavailable.';
          const deviceMessage = deviceError instanceof Error ? deviceError.message : 'Device speech is unavailable.';
          throw new Error(`${serviceMessage} ${deviceMessage}`);
        }
      }
    }

    async function playYorubaVowelSequence(text) {
      if (!recommendedYorubaVoicePromise) {
        recommendedYorubaVoicePromise = getRecommendedPlotweaverVoice('yo')
          .catch((error) => {
            recommendedYorubaVoicePromise = null;
            throw error;
          });
      }
      const voice = await recommendedYorubaVoicePromise;
      return playPlotweaverSpeech(text, 'yo', {
        voiceId: voice.voice_id,
        allowDeviceFallback: false,
      });
    }

    async function playVoiceTranslation({ replay = false } = {}) {
      const output = document.getElementById('voice-translation-result');
      const status = document.getElementById('voice-translation-provider-status');
      if (!output?.dataset.translation) throw new Error('Translate a phrase before listening.');
      if (replay && activePlotweaverAudio) {
        activePlotweaverAudio.currentTime = 0;
        activePlotweaverAudio.playbackRate = translationSpeechSpeed;
        await activePlotweaverAudio.play();
      } else {
        await playPlotweaverSpeech(output.dataset.translation, output.dataset.language || 'yo');
        if (activePlotweaverAudio) activePlotweaverAudio.playbackRate = translationSpeechSpeed;
      }
      if (status) status.textContent = 'Playing your translation.';
    }

    async function playNativeTrainerVoice(phrase, lang = "yoruba", speed = 1.0, syllables = []) {
      if (syllables?.length) playLessonTonalSequence(syllables, speed);
      return playPlotweaverSpeech(phrase, trainerLanguageCode(lang));
    }

    async function startTrainerRecording(lessonId) {
      if (voicePracticeRecorder?.state === 'recording') return;
      const language = trainerLanguageCode();
      if (!['yo', 'ha', 'ig', 'pcm', 'en'].includes(language)) {
        showToast('Idilewa speech recognition currently supports Yorùbá, Igbo, Hausa, Nigerian Pidgin, and English. Choose one of those languages to record.', 'error');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        showToast('Audio recording is not supported in this browser. Try a modern browser or supported device.', 'error');
        return;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        showToast(error instanceof Error ? `Microphone access failed: ${error.message}` : 'Microphone access failed.', 'error');
        return;
      }
      micStream = stream;
      voicePracticeChunks = [];
      try {
        voicePracticeRecorder = new MediaRecorder(stream);
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        micStream = null;
        showToast(error instanceof Error ? `Audio recording could not start: ${error.message}` : 'Audio recording could not start.', 'error');
        return;
      }
      voicePracticeRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size) voicePracticeChunks.push(event.data);
      });
      voicePracticeRecorder.addEventListener('stop', async () => {
        const recording = new Blob(voicePracticeChunks, {
          type: voicePracticeChunks[0]?.type || voicePracticeRecorder?.mimeType || 'audio/webm',
        });
        voicePracticeRecorder = null;
        voicePracticeChunks = [];
        if (micStream) micStream.getTracks().forEach((track) => track.stop());
        micStream = null;
        state.trainer.isRecording = false;
        voiceTranscriptionResult = null;
        render();
        if (!recording.size) {
          showToast('No audio was recorded. Please try again.', 'error');
          return;
        }
        showToast('Sending your recording to Idilewa for transcription.');
        try {
          const result = await transcribeWithPlotweaver(recording, language);
          voiceTranscriptionResult = { lessonId, language, text: result.text };
          render();
          showToast('Transcription ready. It is a text match, not a tone or pronunciation score.', 'success');
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Your recording could not be transcribed.', 'error');
        }
      }, { once: true });
      state.trainer.isRecording = true;
      voiceTranscriptionResult = null;
      render();
      const canvas = document.getElementById("waveformCanvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        let t = 0;
        function drawWave() {
          if (!state.trainer.isRecording) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#15803d";
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 4) {
            const y = canvas.height / 2 + Math.sin((x + t) * 0.08) * Math.cos((x - t) * 0.04) * (canvas.height * 0.38);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          t += 4;
          animFrameId = requestAnimationFrame(drawWave);
        }
        drawWave();
      }
      try {
        voicePracticeRecorder.start();
      } catch (error) {
        voicePracticeRecorder = null;
        voicePracticeChunks = [];
        stream.getTracks().forEach((track) => track.stop());
        micStream = null;
        state.trainer.isRecording = false;
        render();
        showToast(error instanceof Error ? `Audio recording could not start: ${error.message}` : 'Audio recording could not start.', 'error');
        return;
      }
      showToast(`Recording lesson ${lessonId}. Speak clearly, then stop to transcribe.`);
    }

    function stopTrainerRecordingAndAnalyze(lessonId) {
      if (!voicePracticeRecorder || voicePracticeRecorder.state !== 'recording') {
        showToast('There is no active recording to stop.', 'error');
        return;
      }
      state.trainer.isRecording = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      voicePracticeRecorder.stop();
      showToast(`Recording for lesson ${lessonId} stopped.`);
    }

    function renderTrainer(params) {
      const activeLang = state.trainer.lang || "yoruba";
      const activeLevel = state.trainer.level || "beginner";
      const activeLessonId = state.trainer.activeLessonId || 1;
      const speed = state.trainer.speed || 1.0;

      const langData = TRAINER_CURRICULUM[activeLang] || TRAINER_CURRICULUM.yoruba;
      const currentTierLessons = langData[activeLevel] || langData.beginner;
      const activeLesson = currentTierLessons.find(l => l.id === activeLessonId) || currentTierLessons[0] || langData.beginner[0];

      const completedCount = Object.keys(state.trainer.completed || {}).length;
      const avgScore = completedCount > 0 
        ? Math.round(Object.values(state.trainer.completed).reduce((acc, v) => acc + (v.score || 90), 0) / completedCount) 
        : 96;

      const oralVowelSequences = ORAL_VOWEL_TONES.map((tone) => {
        const speechText = getOralVowelSequenceSpeechText(tone.id);
        return `<button type="button" lang="yo" data-action="speak-yoruba-vowel-sequence" data-phrase="${esc(speechText)}" aria-label="Listen to all seven oral vowels in ${esc(tone.label.toLowerCase())}"><strong>${esc(tone.label)}</strong><span>${esc(speechText.replaceAll('. ', ' · '))}</span></button>`;
      }).join('');

      return `<div class="container route-page trainer-page">
                <div class="voice-trainer-toolbar">
                  <div class="breadcrumbs">${routeLink('index', 'Home')}<span>/</span>${routeLink('voice_lessons', 'Voice Lessons')}<span>/</span><strong>Sound foundations &amp; practice</strong></div>
                  ${routeLink('voice_lessons', `${icon('arrow', 14, 'voice-arrow-back')} Back to Voice Lessons`, 'button button-outline')}
                </div>
                  <section class="tonal-contrast-lab" aria-labelledby="tonal-contrast-title">
                    <header class="tonal-lab-intro"><span class="tonal-lab-kicker">${icon('headphones', 15)} Acoustic tonal studio</span><span class="tonal-lab-level">LAB 04 · PHONETICS</span><h1 id="tonal-contrast-title">Tonal Contrast Lab: Three Yorùbá Pitch Registers (Dò, Re, Mí)</h1><p>Pitch contour can distinguish meaning in Yorùbá. Listen to the three register references, then practice them in your selected lesson.</p></header>
                    <div class="tonal-pair-heading"><strong>${icon('people', 15)} Choose a pitch reference</strong><small>Tap a register to listen</small></div>
                    <div class="tonal-pair-list">
                      <button class="tonal-pair-card" type="button" data-action="trainer-play-syllable" data-freq="220" data-tone="low" data-syllable="Dò, low register"><span class="tonal-pair-glyph tone-low">\\<br />\\</span><span><strong>Dò <small>Low register</small></strong><em>Listen to the lower pitch reference.</em></span><span class="tonal-pair-play">${icon('volume', 17)}</span></button>
                      <button class="tonal-pair-card is-focused" type="button" data-action="trainer-play-syllable" data-freq="294" data-tone="mid" data-syllable="Re, middle register"><span class="tonal-pair-glyph tone-mid">——<br />——</span><span><strong>Re <small>Middle register</small></strong><em>Listen to a steady middle pitch.</em></span><span class="tonal-pair-play">${icon('play', 16)}</span></button>
                      <button class="tonal-pair-card" type="button" data-action="trainer-play-syllable" data-freq="370" data-tone="high" data-syllable="Mí, high register"><span class="tonal-pair-glyph tone-high">//<br />//</span><span><strong>Mí <small>High register</small></strong><em>Listen to the higher pitch reference.</em></span><span class="tonal-pair-play">${icon('volume', 17)}</span></button>
                    </div>
                    <figure class="tonal-spectrogram">
                      <figcaption><span><i></i> Pitch trajectory spectrogram</span><strong>${completedCount ? `${avgScore}% match` : 'Practice to build your match'}</strong></figcaption>
                      <svg viewBox="0 0 640 230" role="img" aria-label="Illustrative pitch trajectory rising from low Dò through mid Re to high Mí; not a recording">
                        <g class="tonal-chart-grid"><path d="M56 34H620M56 108H620M56 182H620M56 34V194M220 34V194M390 34V194M560 34V194" /></g>
                        <g class="tonal-chart-labels"><text x="8" y="46">Mí</text><text x="8" y="61">(High)</text><text x="8" y="116">Re</text><text x="8" y="131">(Mid)</text><text x="8" y="188">Dò</text><text x="8" y="204">(Low)</text></g>
                        <path class="tonal-chart-ideal" d="M62 181 C160 180 250 177 326 151 S477 80 592 51" />
                        <path class="tonal-chart-user" d="M62 187 C165 185 260 175 334 148 S482 86 592 56" />
                        <circle cx="62" cy="181" r="7" /><circle cx="334" cy="148" r="7" /><circle cx="592" cy="51" r="7" />
                        <text x="70" y="220">Dò [Dò]</text><text x="520" y="220">wó [Mí]</text>
                      </svg>
                      <div class="tonal-chart-legend"><span><i></i> Pitch reference</span><span><i></i> Illustrative glide · not recorded</span><span>${icon('activity', 13)} Personal analysis is not available</span></div>
                    </figure>
                    <section class="tonal-record-panel" aria-label="Record a phrase from your selected lesson"><div class="tonal-record-options"><span>${icon('mic', 14)} Listen, then repeat</span><button type="button" data-action="trainer-play-native" data-lesson-id="${activeLesson.id}">${icon('volume', 15)} Hear lesson phrase</button></div><div class="tonal-record-wrap"><button type="button" class="tonal-record-button ${state.trainer.isRecording ? 'is-recording' : ''}" data-action="${state.trainer.isRecording ? 'trainer-stop-record' : 'trainer-start-record'}" data-lesson-id="${activeLesson.id}" aria-pressed="${Boolean(state.trainer.isRecording)}">${icon(state.trainer.isRecording ? 'square' : 'mic', 24)}<strong>${state.trainer.isRecording ? 'STOP' : 'RECORD'}</strong></button></div><strong>Practice: ${esc(activeLesson.phrase)}</strong><p>Listen to your selected lesson phrase, then repeat it while noticing the pitch changes.</p><span class="tonal-record-status" aria-live="polite">${state.trainer.isRecording ? 'Recording… speak clearly, then stop.' : 'Recording is sent for transcription only; no voice score is produced.'}</span></section>
                    <section class="tonal-mechanics"><span class="tonal-mechanics-icon">${icon('lightbulb', 18)}</span><div><span class="section-kicker">Linguistic rule</span><h2>Tonogenesis &amp; glide mechanics</h2><p>Open vowel sound “O” and a natural shift in pitch can distinguish meaning. Listen closely, then repeat at a comfortable pace.</p><ul><li>${icon('check', 14)} Keep vowels open and clear; avoid adding English stress.</li><li>${icon('check', 14)} Allow the pitch to glide while keeping the breath steady.</li></ul></div></section>
                  </section>
                  <section class="voice-foundations" aria-labelledby="voice-foundations-title">
                  <div class="section-heading">
                    <div><span class="section-kicker">Start here · Yorùbá sound foundations</span><h1 id="voice-foundations-title">Vowels, consonants &amp; tone</h1><p>Learn the mouth sounds before moving into words and conversation. Listen to the vowel sequences or choose a consonant to hear Idilewa pronounce it.</p></div>
                  </div>
                  <div class="voice-foundation-grid">
                    <article class="voice-foundation-block"><h3>Oral vowels</h3><p>Listen to all seven Yorùbá vowels in each tone.</p><div class="voice-vowel-sequences"><strong>Listen for all seven vowel sounds in each tone</strong>${oralVowelSequences}<small>Listen for one clear vowel at a time; the marks guide the Yorùbá pitch.</small></div></article>
                    <article class="voice-foundation-block"><h3>Consonants</h3><p>Notice sounds such as Yorùbá <strong>gb</strong> and <strong>ṣ</strong>, which differ from English.</p><div class="voice-sound-list">${CONSONANTS.map((item) => `<button type="button" data-action="speak-voice-lesson" data-phrase="${esc(item.char)}. ${esc(item.example)}" title="${esc(item.desc)}">${esc(item.char)} <small>${esc(item.sound)}</small></button>`).join('')}</div></article>
                    <article class="voice-foundation-block"><h3>Nasal vowels</h3><p>Let nasal vowels resonate gently and notice their distinct sounds.</p><div class="voice-sound-list">${NASAL_VOWELS.map((item) => `<button type="button" data-action="speak-voice-lesson" data-phrase="${esc(item.char)}. ${esc(item.example)}" title="${esc(item.sound)}">${esc(item.char)} <small>${esc(item.sound)}</small></button>`).join('')}</div></article>
                  </div>
                </section>
                <section class="voice-foundations-next" aria-labelledby="voice-foundations-next-title">
                  <div><span class="section-kicker">Ready for the next step?</span><h2 id="voice-foundations-next-title">Choose what to try next</h2></div>
                  <nav aria-label="Next voice lesson activities">
                    ${routeLink('voice-language', `${icon('book', 16)} Start a guided lesson`, 'button button-primary')}
                    ${routeLink('voice-practice', `${icon('mic', 16)} Practice a phrase`, 'button button-outline')}
                    ${routeLink('voice_lessons', `${icon('arrow', 15)} More voice activities`, 'button button-outline')}
                  </nav>
                </section>
                <details class="voice-trainer-expanded">
                  <summary><span>More practice options</span><small>Choose a language, explore all lessons, and track your progress</small></summary>
                  <div class="voice-trainer-expanded-content">
        <section class="trainer-hero">
          <div class="trainer-hero-copy">
            <div class="trainer-hero-badge">
              <span>${icon("headphones", 16)}</span>
              <strong>VOICE LESSONS · PRONUNCIATION STUDIO</strong>
            </div>
            <h1>Practice African Languages<br /><em>with language-aware voice audio.</em></h1>
            <p>Practice pitch patterns and pronunciation through 60 structured lessons. Idilewa supplies speech in the selected language; transcription supports Yorùbá, Igbo, Hausa, Nigerian Pidgin, and English.</p>
            
            <div class="trainer-stats-strip">
              <div class="trainer-stat-pill">
                <span class="stat-icon">⭐</span>
                <div>
                  <strong>${state.trainer.xp || 220} XP</strong>
                  <small>Total Knowledge Points</small>
                </div>
              </div>
              <div class="trainer-stat-pill">
                <span class="stat-icon">🔥</span>
                <div>
                  <strong>${state.trainer.streak || 5} Days</strong>
                  <small>Practice Streak</small>
                </div>
              </div>
              <div class="trainer-stat-pill">
                <span class="stat-icon">🎓</span>
                <div>
                  <strong>${completedCount} / 60</strong>
                  <small>Lessons Completed</small>
                </div>
              </div>
              <div class="trainer-stat-pill">
                <span class="stat-icon">🎯</span>
                <div>
                  <strong>${avgScore}%</strong>
                  <small>Average Pronunciation</small>
                </div>
              </div>
            </div>
          </div>

          <div class="trainer-hero-visual">
            <div class="trainer-interactive-disc">
                <img src="./assets/listening-reader.jpg" alt="Child practicing African-language voice lessons" class="trainer-hero-img" />
              <div class="trainer-orbit-ring" aria-hidden="true">
                <span class="orbit-tone tone-high">High (Mí) ↗</span>
                <span class="orbit-tone tone-mid">Mid (Re) →</span>
                <span class="orbit-tone tone-low">Low (Dó) ↘</span>
              </div>
            </div>\n    </section>

        <section class="trainer-language-selector-section">
          <div class="section-heading">
            <div>
              <span class="section-kicker">Step 1: Choose Your Language</span>
              <h2>Select an African Language to Train</h2>
            </div>
            <span class="demo-badge">6 Living Languages Ready</span>
          </div>
          <div class="trainer-lang-pills">
            ${[
              { id: "yoruba", name: "Yorùbá", flag: "🇳🇬 🇧🇯", glyph: "Ẹ", desc: "Tonal: Dó-Re-Mí" },
              { id: "igbo", name: "Igbo", flag: "🇳🇬", glyph: "Ị", desc: "Tonal & Downstep" },
              { id: "hausa", name: "Hausa", flag: "🇳🇬 🇳🇪", glyph: "H", desc: "Tonal & Vowel Cadence" },
              { id: "swahili", name: "Kiswahili", flag: "🇰🇪 🇹🇿", glyph: "S", desc: "Bantu Melodic Stress" },
              { id: "zulu", name: "isiZulu", flag: "🇿🇦", glyph: "Z", desc: "Clicks & Harmony" },
              { id: "twi", name: "Twi / Akan", flag: "🇬🇭", glyph: "T", desc: "High & Low Tones" }
            ].map(l => `
              <button type="button" class="trainer-lang-btn ${activeLang === l.id ? "is-active" : ""}" data-action="trainer-set-lang" data-lang="${l.id}">
                <span class="lang-flag">${l.flag}</span>
                <span class="lang-info">
                  <strong>${l.name}</strong>
                  <small>${l.desc}</small>
                </span>
                <span class="lang-glyph">${l.glyph}</span>
              </button>
            `).join("")}
          </div>
        </section>

        <section class="trainer-level-tabs-section">
          <div class="trainer-tabs-wrap">
            <button type="button" class="trainer-level-tab tab-beginner ${activeLevel === "beginner" ? "is-active" : ""}" data-action="trainer-set-level" data-level="beginner">
              <span class="level-indicator dot-green"></span>
              <span class="level-label">
                <strong>Beginner Tier</strong>
                <small>Lessons 01 – 20 • Foundations & Daily Phrases</small>
              </span>
              <span class="level-badge">20 Lessons</span>
            </button>

            <button type="button" class="trainer-level-tab tab-intermediate ${activeLevel === "intermediate" ? "is-active" : ""}" data-action="trainer-set-level" data-level="intermediate">
              <span class="level-indicator dot-yellow"></span>
              <span class="level-label">
                <strong>Intermediate Tier</strong>
                <small>Lessons 21 – 40 • Talking Drum & Conversations</small>
              </span>
              <span class="level-badge">20 Lessons</span>
            </button>

            <button type="button" class="trainer-level-tab tab-advanced ${activeLevel === "advanced" ? "is-active" : ""}" data-action="trainer-set-level" data-level="advanced">
              <span class="level-indicator dot-red"></span>
              <span class="level-label">
                <strong>Advanced Tier</strong>
                <small>Lessons 41 – 60 • Classical Proverbs & Oríkì</small>
              </span>
              <span class="level-badge">20 Lessons</span>
            </button>
          </div>
        </section>

        <section class="trainer-studio-section" id="trainerStudio">
          <div class="studio-card">
            <div class="studio-top">
              <div class="studio-meta">
                <span class="lesson-num-badge">LESSON ${String(activeLesson.id).padStart(2, "0")}</span>
                <span class="lesson-cat-badge">${activeLesson.category}</span>
                <span class="difficulty-stars">
                  ${"★".repeat(activeLesson.difficulty || 1)}${"☆".repeat(3 - (activeLesson.difficulty || 1))}
                </span>
              </div>
              <div class="studio-speed-control">
              <span class="speed-label">Tone exercise speed:</span>
                <div class="speed-buttons">
                  <button type="button" class="speed-btn ${speed === 0.75 ? "is-active" : ""}" data-action="trainer-set-speed" data-speed="0.75">0.75x Slow</button>
                  <button type="button" class="speed-btn ${speed === 1.0 ? "is-active" : ""}" data-action="trainer-set-speed" data-speed="1.0">1.0x Normal</button>
                  <button type="button" class="speed-btn ${speed === 1.25 ? "is-active" : ""}" data-action="trainer-set-speed" data-speed="1.25">1.25x Fast</button>
                </div>
              </div>
            </div>

            <div class="studio-phrase-area">
              <h2 class="studio-phrase-native">${activeLesson.phrase}</h2>
              <div class="studio-phonetic">${activeLesson.phonetic}</div>
              ${activeLesson.translation ? `<div class="studio-translation">
                <span>Meaning:</span> <strong>${activeLesson.translation}</strong>
              </div>` : ''}
            </div>

            <div class="studio-syllable-soundboard">
              <div class="soundboard-header">
                <span>${icon("sparkles", 15)} Interactive Syllable Pitch Soundboard (Click to hear exact tone frequencies):</span>
              </div>
              <div class="syllables-list">
                ${(activeLesson.syllables || []).map((s, idx) => `
                  <button type="button" class="syllable-sound-pill tone-${s.tone}" data-action="trainer-play-syllable" data-freq="${s.freq}" data-syllable="${s.text}" title="Tone: ${s.pitch} (${s.tone}) - Click to play">
                    <span class="syllable-text">${s.text}</span>
                    <span class="syllable-pitch">${s.pitch}</span>
                    <span class="syllable-tone-tag">${s.tone}</span>
                  </button>
                `).join("")}
              </div>
              <div class="tone-pattern-guide">
                <strong>Tone Pitch Melody:</strong> <code>${activeLesson.tonePattern}</code>
              </div>
            </div>

            <div class="studio-cultural-tip">
              <div class="tip-icon">${icon("leaf", 18)}</div>
              <div class="tip-text">
                <strong>Cultural Heritage Context:</strong>
                <p>${activeLesson.culturalTip}</p>
              </div>
            </div>

            <div class="studio-controls-panel">
              <div class="studio-buttons-row">
                <button type="button" class="btn-studio btn-play-native" data-action="trainer-play-native" data-lesson-id="${activeLesson.id}">
                  ${icon("volume", 20)}
                  <span>Listen to Idilewa voice</span>
                </button>

                ${!state.trainer.isRecording ? `
                  <button type="button" class="btn-studio btn-record-voice" data-action="trainer-start-record" data-lesson-id="${activeLesson.id}">
                    ${icon("mic", 20)}
                    <span>Record & Transcribe</span>
                  </button>
                ` : `
                  <button type="button" class="btn-studio btn-stop-recording" data-action="trainer-stop-record" data-lesson-id="${activeLesson.id}">
                    <span class="recording-pulsar" aria-hidden="true"></span>
                    <span>Stop & Get Transcript</span>
                  </button>
                `}
              </div>

              <div class="studio-visualizer-box">
                <canvas id="waveformCanvas" width="560" height="70"></canvas>
                <div class="visualizer-hint">
                  ${state.trainer.isRecording ? "🔴 Recording your practice… Speak clearly, then stop to request a transcript." : "▶️ Listen to Idilewa audio or record your voice for speech-to-text feedback."}
                </div>
              </div>
            </div>

            ${voiceTranscriptionResult?.lessonId === activeLesson.id && voiceTranscriptionResult.language === trainerLanguageCode() ? `<div class="studio-analysis-result"><h3>Idilewa transcription</h3><p lang="${trainerLanguageCode()}">${esc(voiceTranscriptionResult.text)}</p><small>This is speech-to-text feedback, not a verified pronunciation, pitch, or fluency score. Transcripts stay on this page only.</small></div>` : ""}

            <div class="studio-nav-footer">
              <button type="button" class="btn-nav-lesson" data-action="trainer-prev-lesson" ${activeLesson.id <= (activeLevel === "beginner" ? 1 : activeLevel === "intermediate" ? 21 : 41) ? "disabled" : ""}>
                ${icon("arrow", 14)} Previous Lesson
              </button>

              <span class="lesson-counter-tag">Lesson ${activeLesson.id} of 60</span>

              <button type="button" class="btn-nav-lesson" data-action="trainer-next-lesson" ${activeLesson.id >= (activeLevel === "beginner" ? 20 : activeLevel === "intermediate" ? 40 : 60) ? "disabled" : ""}>
                Next Lesson ${icon("arrow", 14)}
              </button>
            </div>\n    </section>

        <section class="trainer-curriculum-section">
          <div class="section-heading">
            <div>
              <span class="section-kicker">${activeLevel.toUpperCase()} CURRICULUM</span>
              <h2>All 20 Lessons in ${activeLevel.charAt(0).toUpperCase() + activeLevel.slice(1)} Tier</h2>
              <p>Choose a lesson to load it into the Voice Lessons practice studio.</p>
            </div>
            <span class="demo-badge">${currentTierLessons.length} Audio Lessons</span>
          </div>

          <div class="trainer-lessons-grid">
            ${currentTierLessons.map(lesson => {
              const record = state.trainer.completed[lesson.id];
              const isSelected = lesson.id === activeLesson.id;
              return `
                <article class="trainer-lesson-card ${isSelected ? "is-selected" : ""} ${record ? "is-completed" : ""}" data-action="trainer-select-lesson" data-id="${lesson.id}">
                  <div class="lesson-card-top">
                    <span class="lesson-card-num">#${String(lesson.id).padStart(2, "0")}</span>
                    <span class="lesson-card-cat">${lesson.category}</span>
                    ${record ? `
                      <span class="lesson-card-status status-done">
                        ${"★".repeat(record.stars)} ${record.score}%
                      </span>
                    ` : `
                      <span class="lesson-card-status status-ready">Ready</span>
                    `}
                  </div>

                  <h3 class="lesson-card-title">${lesson.title}</h3>
                  <div class="lesson-card-phrase">${lesson.phrase}</div>
                  ${lesson.translation ? `<p class="lesson-card-translation">${lesson.translation}</p>` : ''}

                  <div class="lesson-card-footer">
                    <span class="lesson-card-action">
                      ${isSelected ? "Currently Practicing •" : "Practice Voice →"}
                    </span>
                    <span class="lesson-card-diff">${"★".repeat(lesson.difficulty || 1)}</span>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </section>

        <section class="trainer-certificate-banner">
          <div class="cert-icon-wrap">🎓</div>
          <div class="cert-copy">
            <h3>Earn Your African Voice Master Certificate</h3>
            <p>Complete all 20 lessons in this tier with at least 85% accuracy to unlock your verified Idilewa Fluency Certificate for children.</p>
          </div>
          <button type="button" class="button button-primary" data-action="trainer-view-cert">
            View Certificate Progress ${icon("arrow", 15)}
          </button>
        </section>
                  </div>
                </details>
              </div>`;
    }


  function formatDashboardDate(value) {
    const date = new Date(value || '');
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString();
  }

  function renderMetricCard(label, value, description, tone = '') {
    return `<article class="dashboard-metric-card ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(description)}</small></article>`;
  }

  function consentStatusLabel(status) {
    if (status === 'pending') return 'Awaiting your decision by email';
    if (status === 'approved') return 'Approved';
    if (status === 'declined') return 'Declined';
    if (status === 'withdrawn') return 'Consent withdrawn';
    if (status === 'expired') return 'Request expired';
    return 'Status unavailable';
  }

  function renderPage(page, params) {
    switch (page) {
      case 'tutor':
      case 'tutor-login':
      case 'tutor-signup':
      case 'tutor-dashboard':
      case 'tutor-find-child':
      case 'tutor-students':
      case 'tutor-consent':
      case 'tutor-lesson':
      case 'tutor-messages':
      case 'tutor-profile':
      case 'tutor-availability':
      case 'tutor-settings': return renderTutorPortal(page);
      case 'mentors': return renderMentors();
      case 'voice_lessons': return renderVoiceLessonsHome();
      case 'voice-progress': return renderVoiceProgress();
      case 'ai-conversation': return renderAiConversation();
      case 'voice-language':
      case 'voice-grade':
      case 'voice-audio':
      case 'voice-practice':
      case 'voice-text-to-speech':
      case 'voice-cloning':
      case 'voice-speech-to-text':
      case 'voice-translation': return renderVoiceFeaturePage(page, params);
      case 'index': return renderHome();
      case 'families':
      case 'parent-login':
      case 'parent-signup':
      case 'parent-dashboard':
      case 'parent-children':
      case 'parent-progress':
      case 'parent-messages':
      case 'parent-settings':
      case 'parent-welcome': return renderParentPortal(page, params);
      case 'learn':
      case 'curriculum': return renderLanguages();
      case 'languages': return renderLanguages();
      case 'course': return renderCourse(params);
      case 'lesson': return renderLesson(params);
      case 'oral': return renderOral();
      case 'oral_genre': return renderOralGenre();
      case 'oriki': return renderOriki();
      case 'owe': return renderOwe();
      case 'owe_add': return renderOweAdd();
      case 'owe_detail': return renderOweDetail();
      case 'owe_story': return renderOweStory();
      case 'owe_reflection': return renderOweReflection();
      case 'payment': return renderPricing();
      case 'connect_teachers': return renderConnectTeachers();
      case 'connect_students': return renderConnectStudents();
      case 'voices': return renderVoices();
      case 'pricing': return renderPricing();
      case 'profile': return renderProfile();
      case 'contact': return renderContact();
      case 'privacy': return renderPrivacy();
      case 'login': return renderLogin();
      case 'consent': return renderConsent();
      default: return renderGeneric(page);
    }
  }

  const IMAGE_READY = new Set([
    'c4k-kindergarten.jpg',
    'c4k-grade-1.jpg',
    'c4k-grade-2.jpg',
    'c4k-grade-3.jpg',
    'c4k-grade-4.jpg',
    'c4k-grade-5.jpg',
    'c4k-grade-6.jpg',
    'c4k-grade-7.jpg',
    'c4k-grade-8.jpg',
    'journey-step-6.png',
    'journey-step-5.png',
    'journey-step-4.png',
    'journey-step-3.png',
    'journey-step-2.png',
    'journey-step-1.png',
    'how-it-works-journey.png',
    'how-it-works-journey.jpg',
    'stories-culture.jpg',
    'page-index-1.jpg', 'page-index-2.jpg', 'page-index-3.jpg', 'page-index-4.jpg',
    'page-index-5.jpg', 'page-index-6.jpg', 'page-index-7.jpg',
    'page-about-1.jpg', 'page-coding-1.jpg',
    'page-languages-1.jpg', 'page-course-1.jpg', 'page-lesson-1.jpg', 'page-kids-1.jpg',
    'page-schools-1.jpg', 'page-connect_teachers-1.jpg',
    'page-connect_students-1.jpg', 'page-consent-1.jpg', 'page-oral-1.jpg',
    'page-owe-1.jpg', 'page-owe_detail-1.jpg', 'page-owe_story-1.jpg',
    'page-owe_reflection-1.jpg', 'page-owe_add-1.jpg', 'page-oral_genre-1.jpg',
    'page-oriki-1.jpg', 'page-profile-1.jpg',
    'page-pricing-1.jpg',
    'african-kids-friends.jpg', 'code-kids.jpg', 'hero-reader.jpg', 'listening-reader.jpg',
    'story-grandmother.jpg', 'yoruba-educator-man.jpg', 'yoruba-educator-woman.jpg', 'yoruba-kids-culture.jpg'
  ]);
  const ROUTE_IMAGE_ALTS = {
    index: 'Children in beautiful Yorùbá attire learning together at home',
    coding: 'Children in traditional African attire building a small robot at a bilingual coding club',
    course: 'A young learner exploring a language course at a sunlit desk',
    lesson: 'A child practicing a language lesson with a notebook and a caring adult nearby',
    oral_genre: 'A community storyteller sharing a spoken-word tradition with attentive listeners',
    oriki: 'A Yorùbá praise poet sharing a performance in a community courtyard',
    owe_detail: 'A language educator explaining a proverb with a handwritten card',
    owe_add: 'Hands carefully writing a community proverb into a notebook',
    profile: 'A learner celebrating a small learning milestone at home',
    pricing: 'A family planning a shared language-learning routine around a tablet',
    voices: 'A language speaker recording a short phrase in a quiet studio',
    languages: 'Nigerian siblings practicing greetings with their language teacher in a library',
    course: 'A young learner following an illustrated language course with a tutor',
    lesson: 'A grandmother gently guiding a child through a language lesson in a notebook',
    kids: 'Children in beautiful traditional attire sharing a picture book outdoors',
    connect_teachers: 'A Nigerian woman language educator holding a picture book in a community classroom',
    connect_students: 'African children in varied traditional attire warmly connecting around a picture book',
    oral: 'An elder storyteller sharing an oral tradition with children in a courtyard',
    consent: 'A Nigerian parent and child reviewing a permission form together',
    owe: 'A Nigerian language educator introducing a Yorùbá proverb in a refined home library',
    owe_story: 'A Nigerian child and grandmother tending a seedling in a landscaped garden',
    owe_reflection: 'A Nigerian child writing a thoughtful reflection in a bright, elegant home study',
    ere: 'A Nigerian parent and children sharing a storybook in an elegant family home',
    tutor: 'A Nigerian language tutor in traditional agbada in a refined library',
    keepers: 'A Nigerian elder sharing knowledge with children in a beautiful courtyard',
    login: 'A child reading in a calm, sunlit family home',
    voices: 'A child listening to a language recording in a comfortable reading nook'
  };
  const ROUTE_IMAGE_SLOT_ALTS = {
    'index-1': 'Two Nigerian children in Yorùbá attire learning from a picture book with their mother',
    'index-2': 'A learner arranging colorful language picture cards and a notebook',
    'index-3': 'A young Nigerian woman listening to a language recording while following a book',
    'index-4': 'Two children in traditional attire building a small learning robot',
    'index-5': 'African children in varied traditional outfits connecting warmly around a book',
    'index-6': 'A welcoming Nigerian language tutor in a sunlit community classroom',
    'index-7': 'A grandmother in elegant aso-oke sharing a picture book with children in a refined Lagos home',
    'about-1': 'A Nigerian grandfather and teenage granddaughter sharing an illustrated language book',
    'coding-1': 'Nigerian children in traditional attire solving a coding puzzle beside a small robot',
    'languages-1': 'Nigerian siblings in traditional clothing practicing language greetings with a teacher in a sunlit library',
    'course-1': 'A child and grandmother following an illustrated language course together at home',
    'lesson-1': 'A grandmother helping a child write a language exercise in a notebook',
    'kids-1': 'Three children in colorful traditional clothing sharing a picture book in a leafy courtyard',
    'connect_teachers-1': 'A Nigerian woman language educator in indigo aso-oke holding an open picture book',
    'connect_students-1': 'Children in Yoruba, Igbo, Hausa and East African attire warmly sharing a storybook',
    'consent-1': 'A Nigerian mother and child calmly reviewing a permission form on a tablet',
    'oral-1': 'An elderly Yoruba storyteller sharing a story with attentive children in a courtyard',
    'owe-1': 'A Yorùbá educator in a refined home library introducing a proverb',
    'owe_detail-1': 'A child and language teacher thoughtfully discussing a proverb card',
    'owe_story-1': 'A girl patiently watering an okra seedling with her grandmother',
    'owe_reflection-1': 'A child writing a personal reflection in a bright home study',
    'owe_add-1': 'A woman in burgundy aso-oke writing a proverb in a fine journal',
    'oral_genre-1': 'A Yoruba elder sharing a spoken story with children in a cultural salon',
    'oriki-1': 'A Yoruba praise poet performing for young listeners in an arts hall',
    'profile-1': 'A Nigerian girl celebrating a learning milestone in her home study'
  };
  const ROUTE_IMAGE_OVERRIDES = {
    'keepers-1': 'story-grandmother.jpg',
    'login-1': 'hero-reader.jpg',
    'tutor-1': 'yoruba-educator-man.jpg',
    'voices-1': 'listening-reader.jpg'
  };
  function routeImageAlt(page, slot, tag = '') {
    const original = (tag.match(/\balt=("|')([^"']*)(?:\1)/i) || [,'',''])[2];
    return ROUTE_IMAGE_SLOT_ALTS[`${page}-${slot}`] || ROUTE_IMAGE_ALTS[page] || original || `${LABELS[page] || 'Idilewa'} learning scene`;
  }
  function imagePendingMarkup(alt, className = '') {
    return `<span class="unique-image-pending ${className}" role="img" aria-label="${esc(alt)}"><span aria-hidden="true">Photographic artwork in progress</span></span>`;
  }
  function assignUniqueRouteImages(page, markup) {
    let slot = 0;
    const source = String(markup || '');
    let output = source.replace(/<img\b[^>]*>/gi, (tag) => {
      const sourceMatch = tag.match(/\bsrc=("|')([^"']*)(?:\1)/i);
      const currentSrc = sourceMatch ? sourceMatch[2] : '';
      
      // Preserve any deliberate, authentic image source from cards, sections, flowcharts, or local assets
      if (currentSrc && (
        currentSrc.includes('c4k-') ||
        currentSrc.includes('assets/') ||
        currentSrc.startsWith('http') ||
        currentSrc.startsWith('data:') ||
        IMAGE_READY.has(currentSrc.replace(/^.*[\\\/]/, ''))
      )) {
        slot += 1;
        return tag;
      }

      slot += 1;
      const filename = ROUTE_IMAGE_OVERRIDES[`${page}-${slot}`] || `page-${page}-${slot}.jpg`;
      const alt = routeImageAlt(page, slot, tag);
      if (!IMAGE_READY.has(filename)) return page !== 'index' && slot > 1 ? '' : imagePendingMarkup(alt);
      let rewritten = tag.replace(/\bsrc=("|')[^"']*(?:\1)/i, `src="${imageUrl(filename)}"`);
      if (/\balt=("|')[^"']*(?:\1)/i.test(rewritten)) rewritten = rewritten.replace(/\balt=("|')[^"']*(?:\1)/i, `alt="${esc(alt)}"`);
      else rewritten = rewritten.replace('<img', `<img alt="${esc(alt)}"`);
      return rewritten;
    });
    if (slot === 0 && !['coding', 'trainer', 'course', 'lesson'].includes(page) && !page.startsWith('voice-')) {
      const filename = ROUTE_IMAGE_OVERRIDES[`${page}-1`] || `page-${page}-1.jpg`;
      const alt = routeImageAlt(page, 1);
      const visual = IMAGE_READY.has(filename)
        ? `<img src="${imageUrl(filename)}" alt="${esc(alt)}" loading="lazy" />`
        : imagePendingMarkup(alt);
      const banner = `<figure class="route-art-banner">${visual}<figcaption>${esc(LABELS[page] || 'Idilewa')} · a learning moment</figcaption></figure>`;
      const breadcrumb = output.match(/<div class="breadcrumbs">[\s\S]*?<\/div>/);
      if (breadcrumb) output = output.replace(breadcrumb[0], `${breadcrumb[0]}${banner}`);
      else output = output.replace(/(<div class="container route-page[^"]*">)/, `$1${banner}`);
    }
    return output.replace(/(\bsrc=["'])\.\/assets\//gi, '$1/assets/');
  }

  const PAGE_LAYER_CATEGORIES = ['Orient', 'Understand', 'Information object', 'Context / example', 'Practice / decision', 'Reflect / continue'];
  const ROUTE_PAGE_LAYER_COPY = {
    index: [
      ['Learning purpose', 'Idilewa brings African languages, living culture and future-facing skills together in one welcoming home.', 'Platform promise · language + culture + technology'],
      ['Available language objects', 'Compare Yorùbá, Igbo, Hausa and Kiswahili, then choose a supported path that feels right.', 'Four language pathways'],
      ['Course structure', 'Each supported level contains 20 lessons across four modules, making the next learning step visible.', 'Level · module · lesson'],
      ['Culture in context', 'Explore oral stories, proverbs and heritage with attribution and community context—not as decoration.', 'Story · proverb · source'],
      ['Make with code', 'Try a playful mission or browse 50+ coding paths with multilingual hints, feedback and maker progression.', 'Code Garden · XP · streak'],
      ['Learn safely together', 'Directory previews are samples; child sign-up and tutor pairing require guardian approval and scoped checks.', 'Family consent · educator preview']
    ],
    coding: [
      ['Choose a guide language', 'Code itself stays in its programming language while explanations and hints can use a familiar African language.', 'Yorùbá · Igbo · Hausa · Kiswahili'],
      ['Browse real coding paths', 'Explore 50+ beginner-friendly paths across web, Python, games, data and other tools.', 'Path library · search · category'],
      ['Set a learning pace', 'Choose Beginner, Intermediate or Advanced, then open a small mission with one clear goal.', 'Level · skill · mission'],
      ['Work with examples', 'Read a starter, inspect the teaching marker and change one small part before running the friendly check.', 'Starter code · hint · example'],
      ['Notice progress', 'Success feedback, maker XP, streaks and visible level progress reward practice—not speed.', 'Feedback · XP · streak'],
      ['Understand the limits', 'The playground simulates a learning check; it does not run arbitrary code, upload work or call an AI service.', 'Offline preview · safety disclosure']
    ],
    connect_students: [
      ['Understand the educator workflow', 'This route is for a tutor reviewing an anonymous, parent-managed learner assignment.', 'Educator role · learner assignment'],
      ['Read fictional learner cards', 'Sample goals, language levels and schedules are fictional and read-only until required checks pass.', 'Anonymous sample profile'],
      ['Confirm guardian scope', 'A parent must approve the child account and the specific tutor separately before teaching can proceed.', 'Signed consent · named tutor'],
      ['Validate the matching code', 'The tutor selects their own profile and enters the current guardian-approved code for that exact pairing.', 'Tutor ID · expiring code'],
      ['Accept only an approved assignment', 'No learner assignment, response or lesson is open until code and tutor identity match.', 'Assignment gate · validation'],
      ['Keep the boundary visible', 'This local demo cannot verify a real guardian or create a real lesson; production requires secure server checks.', 'Safety rule · backend requirement']
    ],
    connect_teachers: [
      ['Find a suitable teacher', 'Learners and families can compare sample educator profiles by language focus and teaching style.', 'Educator directory · focus'],
      ['Compare useful details', 'Profile cards show sample experience, learner counts and weekly availability in West Africa Time.', 'Hours · sample experience · WAT'],
      ['Filter the learning focus', 'Use conversation, story or coding-plus-language filters to narrow the sample directory.', 'Teaching-style filter'],
      ['Get guardian approval first', 'A parent or guardian must sign and approve the exact tutor before a child requests an introduction.', 'Guardian consent · named tutor'],
      ['Verify before connection', 'The child validates the current code; the request stays unavailable for any unapproved tutor.', 'Child code · tutor scope'],
      ['Know what this preview does', 'Profiles are illustrative; no message, booking or real educator connection is sent from this prototype.', 'Sample data · privacy boundary']
    ],
    consent: [
      ['Start with a parent request', 'Create a request reference for a parent or guardian; it is not an access code.', 'Request reference'],
      ['Verify the guardian scope', 'The adult selects their relationship, uses a learner alias and reviews what permission covers.', 'Guardian role · learner alias'],
      ['Sign and review consent', 'A typed signature and required consent checks precede any child code in this local demonstration.', 'Signed consent form'],
      ['Choose a tutor deliberately', 'Tutor approval is a separate optional choice and must name the exact educator.', 'Tutor-specific grant'],
      ['Issue and validate a code', 'The approved demo code expires; child and tutor flows must check its scope before continuing.', 'Expiring code · validation'],
      ['Plan production safeguards', 'Browser storage is not identity verification; a real service needs secure backend, audit, withdrawal and legal review.', 'Security controls · safeguarding']
    ],
    course: [
      ['Choose a learning language', 'The course follows the selected language path and keeps the language choice visible.', 'Language · region · greeting'],
      ['Compare three levels', 'Beginner, Intermediate and Advanced each contain 20 lessons, so learners can choose a comfortable pace.', 'Level · 20-lesson track'],
      ['Explore module objects', 'Four modules group related themes; each module contains five lesson outlines.', 'Four modules · five lessons each'],
      ['Open a lesson', 'Every lesson has a focus, a short task and an optional practice response.', 'Lesson focus · activity'],
      ['Save a small win', 'Practice and completion update local progress so the next step is easy to find.', 'Response · completion · progress'],
      ['Check language quality', 'Starter lesson outlines and glosses need fluent-speaker review before public teaching.', 'Educator review · content readiness']
    ],
    languages: [
      ['Compare available paths', 'Choose among Yorùbá, Igbo, Hausa and Kiswahili, with regional and native-name context.', 'Language · native name · region'],
      ['Choose a level', 'Each supported path offers Beginner, Intermediate and Advanced learning.', 'Three course levels'],
      ['See lesson structure', 'A level contains 20 lessons across four modules; the course route opens the detailed plan.', '20 lessons · four modules'],
      ['Meet useful phrases', 'Greeting examples connect written language with meaning and listening practice.', 'Greeting · translation · audio'],
      ['Check availability', 'The page distinguishes supported paths from languages that are still being prepared.', 'Available · coming soon'],
      ['Select a next step', 'Open a language course, then choose the level that fits; review cultural and pronunciation guidance.', 'Course route · fluent review']
    ],
    lesson: [
      ['Locate the lesson', 'Breadcrumbs and progress show the selected language, level, module and lesson number.', 'Course position · lesson ID'],
      ['Understand the focus', 'Read the lesson goal before starting so the activity has a clear purpose.', 'Focus · learning objective'],
      ['Notice the language object', 'A phrase, greeting or relationship word is presented in a practical learning context.', 'Target phrase · meaning'],
      ['Try a response', 'Write, plan or reflect briefly; the lesson accepts a short learner-generated practice response.', 'Practice field · activity'],
      ['Check and complete', 'Save practice before marking the lesson complete, then follow the suggested next lesson.', 'Completion check · next lesson'],
      ['Protect personal details', 'Keep responses general; this prototype saves them only in the local browser.', 'Privacy reminder · local storage']
    ],
    login: [
      ['Choose who is learning', 'Adult exploration and a child account follow different access paths.', 'Learner type · account mode'],
      ['Get signed family approval', 'A parent or guardian reviews the form before a child sign-up can continue.', 'Guardian signature · consent scope'],
      ['Separate tutor permission', 'Approval for a child account does not automatically authorize every tutor.', 'Named tutor grant'],
      ['Validate the approved code', 'The local code check demonstrates a gate; it is not secure authentication.', 'Consent code · demo only'],
      ['Choose the safer entry', 'Learners can explore language paths without creating an account in this prototype.', 'Guest route · languages'],
      ['Keep credentials private', 'Do not enter a real password or personal details; no sign-in service is connected.', 'Privacy warning · no backend']
    ],
    oral: [
      ['Understand oral knowledge', 'Spoken forms carry language through voice, relationship, place and memory.', 'Oral tradition · community'],
      ['Choose a genre', 'Explore Oríkì, Òwe, story and song as different forms with different purposes.', 'Genre · form'],
      ['Read a proverb', 'Òwe can use compact sayings to hold wit, values and ways of seeing.', 'Proverb · interpretation'],
      ['Listen to a voice', 'Use the voice library to notice rhythm, pronunciation and the shape of a greeting.', 'Phrase · speaker · audio'],
      ['Ask for context', 'Consider who is speaking, who is listening and what a form means in that setting.', 'Speaker · listener · setting'],
      ['Share respectfully', 'Credit knowledge holders and ask permission before repeating or publishing oral knowledge.', 'Consent · attribution']
    ],
    oral_genre: [
      ['See the range of forms', 'The collection introduces praise poetry, proverbs, folktales and spoken word.', 'Four genre cards'],
      ['Identify the information object', 'A genre label points to a form; it does not replace a specific community’s explanation.', 'Oríkì · Òwe · folktale · spoken word'],
      ['Compare purpose and voice', 'Notice how rhythm, praise, wisdom, narrative or pronunciation shape each experience.', 'Purpose · voice · structure'],
      ['Choose a sample path', 'Open a focused page for a proverb, a story, Oríkì or a spoken phrase.', 'Route link · learning object'],
      ['Practice listening', 'Pause for repeated sounds and context rather than rushing to a single translation.', 'Listening prompt'],
      ['Keep cultural boundaries', 'Introductions are starting points; community context, consent and attribution matter.', 'Source · permission · context']
    ],
    oriki: [
      ['Define Oríkì carefully', 'Oríkì is a living Yorùbá oral tradition often described as praise poetry and remembrance.', 'Tradition · Yorùbá'],
      ['Listen to performance', 'A short introduction invites learners to hear the form rather than treat it as text alone.', 'Voice · performance'],
      ['Notice sound objects', 'Attend to rhythm, repetition, tone and who is being addressed.', 'Rhythm · repetition · address'],
      ['Explore possible meanings', 'A phrase may hold family history, place, humour or qualities a person is known for.', 'Meaning · identity · memory'],
      ['Reflect before repeating', 'Ask what you notice and what you would want to learn from a knowledgeable speaker.', 'Learner reflection'],
      ['Practice respectful sharing', 'Versions and contexts differ; ask permission and credit the person or community who shared the piece.', 'Consent · attribution']
    ],
    owe: [
      ['Read the original proverb', 'Begin with “Sùúrù ni baba ìwà” and notice the original Yorùbá words.', 'Òwe · original wording'],
      ['Compare a translation', 'Meet one common classroom rendering without treating it as the only possible translation.', 'Translation · variation'],
      ['Understand the meaning', 'Connect patience with steady care, thoughtful choices and giving growth time.', 'Everyday meaning · example'],
      ['Explore the moral story', 'Follow Dami and the okra seed in an original classroom story, not a claimed folktale.', 'Dami · okra seed · story'],
      ['Check comprehension', 'Answer what Dami did while she waited; feedback keeps the sequence in order.', 'Story quiz · feedback'],
      ['Reflect and act', 'After the checks, the child names a feeling, shares a thought and chooses one small action.', 'Child reflection · action']
    ],
    owe_add: [
      ['Choose a language', 'Select the language for the contribution and preserve the original wording where possible.', 'Language selector'],
      ['Record original words', 'Enter the proverb as it was shared; keep tonal marks and diacritics where known.', 'Original proverb · writing'],
      ['Add a meaning', 'Write a translation or explain what the saying means to you.', 'Translation · personal meaning'],
      ['Provide context', 'Note who shared it or where it was heard without exposing private details.', 'Source · context'],
      ['Confirm permission', 'Only contribute material you have permission to share and credit knowledge holders appropriately.', 'Consent · attribution'],
      ['Understand local storage', 'Saving only demonstrates the interface; nothing is uploaded or published by this prototype.', 'Local demo · privacy']
    ],
    owe_detail: [
      ['Hear the original', 'Read and listen to “Sùúrù ni baba ìwà” in the original language.', 'Yorùbá proverb · audio'],
      ['Review one rendering', '“Patience is the father of good character” is one common classroom translation.', 'Translation · common rendering'],
      ['Notice variation', 'Some speakers may render the final word as “character”; meaning depends on voice and context.', 'Word choice · language variation'],
      ['Connect meaning to life', 'Patience can include steady care and thoughtful action while waiting.', 'Everyday example · reflection prompt'],
      ['Check understanding', 'Choose what patience means in this example and use the feedback to revise your idea.', 'Meaning quiz · feedback'],
      ['Unlock the next stage', 'The moral story opens after the meaning check, preserving the requested Owe sequence.', 'Sequence gate · moral story']
    ],
    owe_story: [
      ['Check the sequence gate', 'Direct entry keeps the story closed until the proverb meaning check is complete.', 'Meaning check · access gate'],
      ['Read the classroom story', 'Dami plants an okra seed and keeps caring for it while she waits.', 'Dami · seed · garden'],
      ['Distinguish story from tradition', 'This original lesson story is not presented as a traditional folktale.', 'Authorship · content note'],
      ['Notice patience in action', 'The story shows that waiting can include watering, weeding and steady attention.', 'Character choice · action'],
      ['Answer the story check', 'Identify what Dami does while waiting, then use feedback before continuing.', 'Comprehension quiz'],
      ['Prepare for reflection', 'A child reflection follows the story check and asks for a feeling, thought and small action.', 'Reflection gate · child action']
    ],
    owe_reflection: [
      ['Respect the required order', 'Reflection stays locked until the meaning and story checks are complete.', 'Sequence gate · two checks'],
      ['Name a feeling', 'Choose from gentle feeling words such as curious, calm, impatient, proud or unsure.', 'Feeling picker'],
      ['Share a thought', 'Write an idea, question or plan about patience without trying to guess a “right” answer.', 'Child response · open prompt'],
      ['Choose one action', 'Think of one kind or helpful thing to do while waiting for something to grow.', 'Action prompt · transfer'],
      ['Save with privacy in mind', 'The response stays in this browser preview and may be visible to people using the device.', 'Local reflection · privacy'],
      ['Continue with agency', 'The child can revisit the story or return to the proverb shelf; the reflection remains personal.', 'Return routes · learner choice']
    ],
    pricing: [
      ['Understand what plans cover', 'Compare proposed learning arrangements for independent learners, families and schools.', 'Plan options · Explorer / Family / School'],
      ['Explore individual use', 'The Explorer preview points to sample language paths and learning activities.', 'Explorer · sample benefits'],
      ['Explore family use', 'Family ideas focus on shared routines and stories across generations.', 'Family · shared learning'],
      ['Explore school use', 'School plans are presented as tailored rather than a final fixed package.', 'School · classroom needs'],
      ['Check price status', 'The interface is exploratory; final prices and subscription commitments are not confirmed.', 'Cost disclosure · no commitment'],
      ['Choose an appropriate next step', 'Follow a learning route or register interest without treating this prototype as a purchase flow.', 'Interest action · prototype']
    ],
    profile: [
      ['Review the current path', 'See the selected language and level at a glance.', 'Language · level'],
      ['Measure completed work', 'The progress bar summarizes lessons marked complete in this browser.', 'Completion count · progress'],
      ['Notice practice habits', 'Streak and points are encouragement signals, not a measure of a learner’s worth.', 'Streak · points'],
      ['Follow the timeline', 'Recent and suggested steps connect greetings, family words and stories.', 'Timeline · next lesson'],
      ['Celebrate milestones', 'Badges recognize trying, listening and completing a story activity.', 'Badge · learning milestone'],
      ['Understand data limits', 'Prototype progress remains on this device; production needs secure authentication and privacy review.', 'Local storage · production requirement']
    ],
    voices: [
      ['Choose a language object', 'The library offers short sample greetings in Yorùbá, Igbo, Hausa and Kiswahili.', 'Four phrase cards'],
      ['Read the phrase', 'Each entry pairs written words with a plain-language translation.', 'Phrase · translation'],
      ['Listen to the sound', 'Use the play control to hear a browser-based sample at a comfortable pace.', 'Audio control · sample speech'],
      ['Notice rhythm', 'Pay attention to tone, syllables and the speaker’s pacing rather than copying quickly.', 'Pronunciation · rhythm'],
      ['Practice deliberately', 'Repeat a greeting, then connect it with a time or situation where it might be used.', 'Listening · speaking practice'],
      ['Review recording quality', 'Public audio should be recorded or approved by fluent speakers before release.', 'Native-speaker review · readiness']
    ]
  };

  function getPageInformationLayers(page) {
    const customLayers = ROUTE_PAGE_LAYER_COPY[page];
    if (customLayers) return customLayers;
    const meta = PAGE_META[page];
    if (meta) {
      const cards = meta.cards || [];
      const flow = meta.flow || ['Discover', 'Choose', 'Practice', 'Grow'];
      const first = cards[0] || { title: 'Begin with the purpose', text: meta.desc };
      const second = cards[1] || { title: 'Explore the context', text: meta.desc };
      const third = cards[2] || { title: 'Choose a next step', text: meta.desc };
      return [
        ['Why this page matters', meta.desc, `Purpose · ${meta.eyebrow}`],
        [first.title, first.text, `Information object · ${first.title}`],
        [second.title, second.text, `Context object · ${second.title}`],
        [third.title, third.text, `Practice object · ${third.title}`],
        ['Follow the learning route', `Use this sequence as a guide: ${flow.join(' → ')}. Pause at each stage and choose a pace that suits the learner.`, `Route sequence · ${flow.join(' → ')}`],
        ['Choose a next step', `${meta.cta}. This prototype keeps the action local and makes no promise of an external account or service.`, `Continue · ${LABELS[meta.ctaRoute] || meta.ctaRoute}`]
      ];
    }
    const label = LABELS[page] || 'Idilewa';
    return [
      [`Explore ${label}`, `This page introduces the purpose and main choices in ${label.toLowerCase()}.`, `Page · ${label}`],
      ['Find the key idea', 'Read the page context before choosing a resource, activity or decision.', 'Core idea · page context'],
      ['Notice the information objects', 'Look for named people, words, learning materials, examples or safety rules relevant here.', 'Objects · people · language · resources'],
      ['Connect an example', 'Use the visible example or card to connect the idea with a practical situation.', 'Example · learning material'],
      ['Try a small action', 'Complete one available prompt, choice, practice task or respectful check.', 'Action · learner activity'],
      ['Reflect and continue', 'Review what changed in your understanding and follow the linked next step when ready.', 'Reflection · next route']
    ];
  }

  function renderPageInformationLayers(page) {
    if (page !== 'index') return '';
    return `<section class="container how-it-works-journey-section" aria-label="How it works: A simple journey to deeper understanding">
      <img class="how-it-works-journey-image" src="${imageUrl('how-it-works-journey-reference.jpg')}" alt="How it works: A simple journey to deeper understanding. Explore oral stories, learn new words, practice speaking, use real conversations, build confidence, and keep our culture alive." width="1080" height="720" loading="lazy" decoding="async" />
    </section>`;
  }

  function init3DScrollObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    const targetSelectors = [
      'section',
      'article',
      '.card',
      '.feature-card',
      '.lesson-card',
      '.coding-card',
      '.proverb-card',
      '.oral-card',
      '.stat-card',
      '.pricing-card',
      '.panel',
      '.flowchart-step',
      '.hero-quote',
      '.hero-stage',
      '.c4k-3d-hero-stage',
      '.c4k-ide-section',
      '.grid > div',
      '.flex-col > div',
      'form',
      '.split-view',
      '.cta-banner'
    ];

    const elements = document.querySelectorAll(targetSelectors.join(', '));
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach((el) => {
      if (el.closest('header') || el.closest('nav') || el.classList.contains('top-nav') || el.id === 'top') {
        return;
      }
      
      const rect = el.getBoundingClientRect();
      el.classList.add('scroll-3d-reveal');
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setTimeout(() => el.classList.add('is-visible'), 40);
      } else {
        observer.observe(el);
      }
    });

    // 3D Tilt for interactive cards
    document.querySelectorAll('.card, .feature-card, .proverb-card, .lesson-card, .c4k-3d-hub-card, .c4k-grade-card, .c4k-lesson-card').forEach((card) => {
      if (card.dataset.tiltAttached) return;
      card.dataset.tiltAttached = 'true';
      
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        card.style.transform = 'perspective(1000px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateY(-4px) translateZ(10px)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  let activeCodeRobotScene = null;
  let homePreviewTimers = [];

  function startHomePreviewMotion() {
    homePreviewTimers.forEach((timer) => window.clearInterval(timer));
    homePreviewTimers = [];
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const carousels = [
      { element: document.getElementById('android-preview-viewport'), count: 4, delay: 3600 },
      { element: document.getElementById('home-app-swipe-track'), count: 4, delay: 4400 }
    ];
    carousels.forEach(({ element, count, delay }) => {
      if (!element) return;
      const advance = () => {
        if (document.hidden || element.matches(':hover') || element.contains(document.activeElement)) return;
        const first = element.firstElementChild;
        if (!first) return;
        const styles = getComputedStyle(element);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;
        const step = first.getBoundingClientRect().width + gap;
        if (element.scrollLeft + step >= step * count - 2) element.scrollTo({ left: 0, behavior: 'auto' });
        else element.scrollBy({ left: step, behavior: 'smooth' });
      };
      homePreviewTimers.push(window.setInterval(advance, delay));
    });
  }

  function ensureSingleSharedFooter() {
    const main = document.getElementById('main');
    if (!main) return;
    const footers = main.querySelectorAll('footer.site-footer');
    for (let index = 0; index < footers.length - 1; index += 1) {
      footers[index].remove();
    }
  }

  function clearPendingAuthFlow() {
    pendingSignupEmail = '';
    pendingSignin = null;
    passwordResetVerified = false;
    let storageError = null;
    for (const key of [
      'idilewa-pending-signup-email',
      'idilewa-pending-signin-otp',
      'idilewa-password-reset-verified',
      'idilewa-guardian-signup',
    ]) {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        storageError ||= error;
      }
    }
    return storageError;
  }

  function render() {
    if (activeCodeRobotScene) {
      activeCodeRobotScene.destroy();
      activeCodeRobotScene = null;
    }
    const location = parseLocation();
    if (location.removedRoute) {
      navigate('index', {}, true);
      return;
    }
    const { page, params } = location;
    const outgoingPage = document.body.dataset.page || '';
    if (outgoingPage === 'ai-conversation' && page !== 'ai-conversation') cleanupAiConversation();
    if (outgoingPage && outgoingPage !== page && page === 'ai-conversation') {
      aiConversation.returnRoute = outgoingPage;
    }
    if (params.lang && LANGUAGES.some((l) => l.id === params.lang)) state.currentLang = params.lang;
    if (params.level && ['beginner', 'intermediate', 'advanced', 'growing', 'fluent'].includes(params.level)) state.level = normalizeCourseLevel(params.level);
    renderHeader(page);
    renderMobileNav(page);
    const gradeTitle = page === 'voice-audio' ? getVoiceGradePath(params.grade)?.name : '';
    const title = page === 'index'
      ? 'Our Language. Our Future.'
      : gradeTitle
        ? `${gradeTitle} voice lessons`
        : (PAGE_META[page]?.eyebrow || LABELS[page] || 'Explore Idilewa');
    document.title = `${title} · Idilewa`;
    const pageMarkup = assignUniqueRouteImages(page, renderPage(page, params))
      .replace(/(?:African )?Voice (?:African Language )?Trainer/gi, 'Voice Lessons')
      .replace(/Voice Studio/gi, 'Voice Lessons');
    if (page === 'ai-conversation' || page.startsWith('tutor') || page.startsWith('parent') || page === 'families') {
      document.body.dataset.page = page;
      document.getElementById('main').innerHTML = pageMarkup;
    } else if (page === 'index') {
      document.body.dataset.page = page;
      document.getElementById('main').innerHTML = `${pageMarkup}${renderFooter(page)}`;
    } else if (page === 'login') {
      document.body.dataset.page = page;
      document.getElementById('main').innerHTML = `${pageMarkup}${renderFooter(page)}`;
      const intro = document.querySelector('.auth-intro-screen');
      if (intro) window.setTimeout(() => intro.remove(), 1450);
    } else {
      document.body.dataset.page = page;
      document.getElementById('main').innerHTML = `${pageMarkup}${renderPageInformationLayers(page)}${renderFooter(page)}`;
    }
    const mainElement = document.getElementById('main');
    mainElement.classList.remove('route-enter');
    void mainElement.offsetWidth;
    mainElement.classList.add('route-enter');
    ensureSingleSharedFooter();
    if (page === 'ai-conversation') initializeAiConversation();
    if (page === 'owe' && ['meaning', 'story', 'reflection'].includes(params.section)) {
      window.requestAnimationFrame(() => {
        document.getElementById(`owe-${params.section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (page.startsWith('tutor')) loadTutorPortalData();
    if (page.startsWith('parent-') && !['parent-login', 'parent-signup', 'parent-welcome'].includes(page)
      && getCurrentUser()?.role === 'parent' && !parentDashboardData && !parentDashboardError) {
      void loadParentPortalData();
    }
    startHomePreviewMotion();
    if (page === 'voice_lessons') {
      const audioCanvas = document.getElementById('waveformCanvas');
      if (audioCanvas) init3DAudioVisualizer(audioCanvas);
      initializePlotweaverVoiceTools();
      initializeTranslationLanguages('voice-translation-source-language');
      initializeTranslationLanguages('voice-translation-language', 'voice-translation-provider-status');
    } else if (page.startsWith('voice-')) {
      if (page === 'voice-cloning' || page === 'voice-text-to-speech') initializePlotweaverVoiceTools();
      if (page === 'voice-speech-to-text' || page === 'voice-translation') {
        initializeTranslationLanguages('voice-translation-source-language');
      }
      if (page === 'voice-translation') {
        initializeTranslationLanguages('voice-translation-language', 'voice-translation-provider-status');
      }
      if (page === 'voice-practice') {
        const audioCanvas = document.getElementById('waveformCanvas');
        if (audioCanvas) init3DAudioVisualizer(audioCanvas);
      }
    } else if (page === 'oral') {
      const storyCanvas = document.getElementById('story3DCanvasWrap');
      if (storyCanvas) init3DStoryCanvas(storyCanvas);
    }
    autoMount3DElements();
    init3DTiltEngine();
    init3DScrollObserver();
  }

  function showToast(message, tone = 'success') {
    const root = document.getElementById('toast-root');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tone}`;
    toast.innerHTML = `${icon(tone === 'error' ? 'refresh' : 'check', 16)}<span>${esc(message)}</span>`;
    root.appendChild(toast);
    window.setTimeout(() => { toast.classList.add('toast-out'); window.setTimeout(() => toast.remove(), 240); }, 3200);
  }

  async function syncAccountLessonProgress() {
    const user = getCurrentUser();
    if (!user?.id) return;
    try {
      const records = await getUserProgress(user.id);
      const remoteLessons = records
        .filter((record) => record.lessonType === 'lesson')
        .map((record) => record.lessonId);
      state.completed = [...new Set([...state.completed, ...remoteLessons])];
      saveState();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Saved lesson progress could not be loaded.', 'error');
    }
  }

  async function persistCompletedLesson(lessonId) {
    const user = getCurrentUser();
    if (!user?.id) return;
    try {
      await saveProgress({
        userId: user.id,
        lessonType: 'lesson',
        lessonId,
        meta: { language: state.currentLang, level: state.level },
      });
      showToast('Lesson progress saved to your account.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Lesson progress could not be saved to your account.', 'error');
    }
  }

  async function submitGuardianRequest(button) {
    const childEmailInput = document.getElementById('authEmail');
    const parentEmailInput = document.getElementById('guardianEmail');
    const aliasInput = document.getElementById('authName');
    if (!childEmailInput?.reportValidity() || !parentEmailInput?.reportValidity() || !aliasInput?.reportValidity()) return;
    button.disabled = true;
    verifiedGuardianSignup = null;
    const previousText = button.textContent;
    button.textContent = 'Sending approval request…';
    try {
      const response = await fetch('/api/guardian/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          childEmail: childEmailInput.value.trim(),
          parentEmail: parentEmailInput.value.trim(),
          learnerAlias: aliasInput.value.trim()
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'The parent request could not be sent.');
      showToast(result.message || 'Request sent. Ask your parent to check their inbox.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The parent request could not be sent.', 'error');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = previousText;
      }
    }
  }

  async function verifyGuardianCode(button) {
    const emailInput = document.getElementById('authEmail');
    const codeInput = document.getElementById('guardianAccessCode');
    if (!emailInput?.reportValidity()) return;
    const email = emailInput.value.trim().toLowerCase();
    const code = codeInput?.value.trim() || '';
    if (!/^\d{6}$/.test(code)) {
      showToast('Enter the six-digit code sent to the learner email address.', 'error');
      codeInput?.focus();
      return;
    }
    button.disabled = true;
    const previousText = button.textContent;
    button.textContent = 'Checking code…';
    try {
      const response = await fetch('/api/guardian/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.approvalId) {
        throw new Error(result?.error || 'The parent-approved code could not be verified.');
      }
      verifiedGuardianSignup = { approvalId: result.approvalId, email };
      try {
        sessionStorage.setItem('idilewa-guardian-signup', JSON.stringify(verifiedGuardianSignup));
      } catch (storageError) {
        render();
        showToast('Parent approval is verified for this tab, but could not be saved. Finish child account creation before closing or refreshing this page.', 'error');
        return;
      }
      render();
      showToast('Parent approval verified. Finish creating the child account now.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The parent-approved code could not be verified.', 'error');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = previousText;
      }
    }
  }

  async function requestPasswordResetCode(button) {
    const emailInput = document.getElementById('authEmail');
    if (!emailInput?.reportValidity()) return;
    const email = emailInput.value.trim().toLowerCase();
    button.disabled = true;
    const previousText = button.textContent;
    button.textContent = 'Sending recovery code…';
    try {
      await requestSigninOtp(email, 'password-reset');
      pendingSignin = { email, purpose: 'password-reset' };
      passwordResetVerified = false;
      state.loginMode = 'signin';
      render();
      showToast('If the account can receive email codes, a verification code is on its way.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'A password recovery code could not be sent.', 'error');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = previousText;
      }
    }
  }

  async function requestChildSigninCode(button) {
    const emailInput = document.getElementById('authEmail');
    if (!emailInput?.reportValidity()) return;
    const email = emailInput.value.trim().toLowerCase();
    button.disabled = true;
    const previousText = button.textContent;
    button.textContent = 'Sending passcode…';
    try {
      await requestSigninOtp(email, 'child-signin');
      pendingSignin = { email, role: 'child', purpose: 'child-signin' };
      render();
      showToast('If this is an approved child account, a one-time passcode has been sent to the parent or guardian email.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The parent passcode could not be sent. Please try again.', 'error');
    } finally {
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = previousText;
      }
    }
  }

  function openModal(title, body) {
    document.getElementById('modal-root').innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 19)}</button><div class="modal-icon">${icon('sparkles', 22)}</div><h2 id="modalTitle">${esc(title)}</h2><p>${esc(body)}</p><button class="button button-primary modal-done" data-action="close-modal">Got it ${icon('check', 15)}</button></section></div>`;
    document.querySelector('.modal-done')?.focus();
  }

  function openProfileCompletionPrompt() {
    document.getElementById('modal-root').innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal-card profile-completion-modal" role="dialog" aria-modal="true" aria-labelledby="profileCompletionTitle"><button class="modal-close icon-button" data-action="close-modal" aria-label="Close">${icon('close', 19)}</button><div class="modal-icon">${icon('user', 22)}</div><h2 id="profileCompletionTitle">Complete your profile</h2><p>Add a short bio and learning goal so your Idilewa space reflects what you want to explore.</p><button class="button button-primary modal-done" data-action="complete-profile">Continue to profile ${icon('arrow', 15)}</button></section></div>`;
    document.querySelector('.modal-done')?.focus();
  }

  function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (menu) { menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); }
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (!menu) return;
    const opening = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', opening);
    menu.setAttribute('aria-hidden', String(!opening));
    if (toggle) toggle.setAttribute('aria-expanded', String(opening));
  }

  const searchable = ROUTES.map((route) => ({ route, title: LABELS[route], summary: PAGE_META[route]?.desc || `Explore ${LABELS[route].toLowerCase()} in the Idilewa learning space.` })).concat(LANGUAGES.map((l) => ({ route: 'languages', title: l.name, summary: `${l.region} · ${l.lessons}` })));

  function searchResults(query) {
    const q = query.trim().toLowerCase();
    const list = q ? searchable.filter((item) => `${item.title} ${item.summary}`.toLowerCase().includes(q)).slice(0, 7) : searchable.filter((item) => ['languages', 'course', 'coding', 'oral', 'about'].includes(item.route)).slice(0, 6);
    return list.length ? list.map((item) => `<button class="search-result" data-action="search-result" data-route="${item.route}"><span>${icon(item.route === 'coding' ? 'code' : item.route === 'languages' || item.route === 'course' ? 'globe' : 'book', 17)}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.summary)}</small></span>${icon('arrow', 15)}</button>`).join('') : `<div class="search-empty">No match just yet. Try “language”, “story” or “code”.</div>`;
  }

  function openSearch() {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="search-overlay" data-action="close-modal"><section class="search-dialog" role="dialog" aria-modal="true" aria-label="Search Idilewa"><div class="search-dialog-head"><span>${icon('search', 19)}</span><input id="siteSearch" type="search" placeholder="Search languages, stories, culture…" autocomplete="off" /><button class="icon-button" data-action="close-modal" aria-label="Close search">${icon('close', 18)}</button></div><div class="search-results" id="searchResults">${searchResults('')}</div><div class="search-hint">Use search to explore all the places in Idilewa.</div></section></div>`;
    const input = document.getElementById('siteSearch');
    input?.focus();
  }

  function quizAction(el, prefix, message) {
    const correct = el.dataset.correct === 'true';
    const key = `${prefix}:${el.dataset.key || 'default'}`;
    state.quizResults[key] = correct ? 'correct' : 'retry';
    if (correct && !state.rewarded[key]) { state.points += 10; state.rewarded[key] = true; }
    saveState();
    render();
    showToast(correct ? message : 'Try one more time—you are learning as you go.', correct ? 'success' : 'error');
  }

  function playSample(button) {
    const phrase = button.dataset.text || 'Hello';
    button.classList.add('is-playing');
    button.setAttribute('aria-pressed', 'true');
    void playPlotweaverSpeech(phrase, button.dataset.language || 'yo')
      .catch((error) => {
        showToast(error instanceof Error ? error.message : 'Idilewa could not generate this sample.', 'error');
      })
      .finally(() => {
        if (button.isConnected) {
          button.classList.remove('is-playing');
          button.setAttribute('aria-pressed', 'false');
        }
      });
  }

  function handleAction(action, el) {
    const lang = el.dataset.lang;
    if (action.startsWith('aichat-')) { handleAiConversationAction(action, el); return; }
    switch (action) {
      case 'mentor-select-slot':
        selectedMentorBooking = {
          ...selectedMentorBooking,
          ...(el.dataset.day ? { day: el.dataset.day } : {}),
          ...(el.dataset.time ? { time: el.dataset.time } : {}),
        };
        render();
        break;
      case 'mentor-select-preview':
        if (MENTOR_PREVIEWS.some((mentor) => mentor.id === el.dataset.mentor)) {
          selectedMentorBooking = { mentorId: el.dataset.mentor, day: 'Today', time: 'Afternoon 2:30 PM' };
          render();
          document.querySelector('.mentor-feature-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          showToast('Mentor selected. Review the preview slot before continuing.');
        }
        break;
      case 'mentor-book':
        if (el.dataset.mentor && MENTOR_PREVIEWS.some((mentor) => mentor.id === el.dataset.mentor)) {
          selectedMentorBooking = { ...selectedMentorBooking, mentorId: el.dataset.mentor };
          navigate('contact', { topic: 'mentor-booking', mentorId: el.dataset.mentor, day: selectedMentorBooking.day, time: selectedMentorBooking.time });
          showToast('Booking requests open once secure checkout is enabled. Tell us your preferred slot.');
        }
        break;
      case 'tutor-toggle-password': {
        const input = document.getElementById(el.dataset.target || '');
        if (!input) break;
        const reveal = input.type === 'password';
        input.type = reveal ? 'text' : 'password';
        el.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
        el.innerHTML = icon(reveal ? 'eyeOff' : 'eye', 15);
        break;
      }
      case 'tutor-toggle-preference': {
        const key = el.dataset.setting;
        if (!['emailUpdates', 'lessonReminders'].includes(key)) break;
        try {
          const preferences = getTutorPreferences();
          preferences[key] = !preferences[key];
          localStorage.setItem(TUTOR_PREFERENCES_KEY, JSON.stringify(preferences));
          render();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Your preference could not be saved.', 'error');
        }
        break;
      }
      case 'parent-refresh':
        parentDashboardData = null;
        parentDashboardError = '';
        parentDashboardLoading = false;
        parentDashboardRequest += 1;
        void loadParentPortalData();
        break;
      case 'parent-toggle-preference': {
        const key = el.dataset.setting;
        if (!['emailUpdates', 'learningReminders', 'weeklySummary'].includes(key)) break;
        const preferences = getParentPreferences();
        preferences[key] = !preferences[key];
        try {
          localStorage.setItem(PARENT_PREFERENCES_KEY, JSON.stringify(preferences));
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Your family preferences could not be saved.', 'error');
          break;
        }
        render();
        showToast('Your preferences were saved in this browser.');
        break;
      }
      case 'parent-export-report':
        window.print();
        break;
      case 'parent-withdraw-consent': {
        const requestId = el.dataset.id;
        if (!requestId || !window.confirm('Withdraw this educator’s access to the learner’s dashboard?')) break;
        el.disabled = true;
        void withdrawEducatorConnection(requestId).then((result) => {
          parentDashboardData = null;
          parentDashboardError = '';
          parentDashboardLoading = false;
          parentDashboardRequest += 1;
          showToast(result.message || 'Educator access was withdrawn.', 'success');
          void loadParentPortalData();
        }).catch((error) => {
          showToast(error instanceof Error ? error.message : 'Consent could not be withdrawn.', 'error');
          if (el.isConnected) el.disabled = false;
        });
        break;
      }
      case 'toggle-menu': toggleMobileMenu(); break;
      case 'open-search': openSearch(); break;
      case 'close-modal': closeModal(); break;
      case 'open-ai-helper': openAiHelper(el.dataset.topic || 'general'); break;
      case 'ai-suggestion': {
        const input = document.getElementById('aiHelperQuestion');
        if (input) input.value = el.dataset.prompt || '';
        answerAiPrompt(el.dataset.topic || 'general');
        break;
      }
      case 'start-consent-request':
        state.authRole = 'child'; state.loginMode = 'signup'; saveState(); navigate('login'); break;
      case 'consent-signup':
        state.authRole = 'child'; state.loginMode = 'signup'; saveState(); navigate('login'); break;
      
      case 'ide-set-lang': {
        const lang = el.dataset.lang || 'yoruba';
        state.coding.ideLang = lang;
        const presets = getIdePresets(lang);
        state.coding.idePresetId = presets[0].id;
        state.coding.ideCode = presets[0].code;
        state.coding.ideOutput = '> [Idilewa Engine v2.4 Online - ' + lang.toUpperCase() + ']\n> Loaded: ' + presets[0].title + '\n> Click "Ṣe Koodu (Run)" to execute.';
        state.coding.ideTab = 'terminal';
        saveState();
        render();
        showToast('Switched IDE to ' + lang.toUpperCase() + ' mode.');
        break;
      }
      case 'ide-sidebar-mode': {
        const mode = el.dataset.mode === 'extensions' ? 'extensions' : 'explorer';
        state.coding.ideSidebar = mode;
        saveState();
        render();
        break;
      }
      case 'ide-toggle-extension': {
        const extensionId = el.dataset.extensionId;
        if (!extensionId) break;
        const installed = state.coding.ideInstalledExtensions || [];
        state.coding.ideInstalledExtensions = installed.includes(extensionId)
          ? installed.filter((id) => id !== extensionId)
          : [...installed, extensionId];
        saveState();
        render();
        showToast(state.coding.ideInstalledExtensions.includes(extensionId) ? 'Idilewa extension enabled.' : 'Idilewa extension removed.');
        break;
      }
      case 'ide-assistant-analyze':
        analyzeIdeAssistantCode();
        break;
      case 'ide-assistant-fix':
        applyIdeAssistantFix();
        break;
      case 'ide-explain-code': {
        const explainer = document.getElementById('ide-explainer-box');
        explainer?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showToast('The lesson breakdown below the output explains this sample.');
        break;
      }
      case 'ide-next-challenge': {
        const selector = document.querySelector('[data-action="ide-select-preset"]');
        if (!selector || selector.options.length < 2) {
          showToast('There are no more challenges for this language yet.');
          break;
        }
        selector.selectedIndex = (selector.selectedIndex + 1) % selector.options.length;
        handleAction('ide-select-preset', selector);
        break;
      }
      case 'ide-save-code':
        state.coding.ideCode = document.getElementById('ide-code-input')?.value ?? state.coding.ideCode ?? '';
        saveState();
        showToast('Your code is saved on this device.', 'success');
        break;
      case 'ide-select-preset': {
        const presetId = el.value;
        state.coding.idePresetId = presetId;
        const lang = state.coding.ideLang || 'yoruba';
        const presets = getIdePresets(lang);
        const p = presets.find((item) => item.id === presetId) || presets[0];
        state.coding.ideCode = p.code;
        state.coding.ideOutput = '> [Idilewa Engine v2.4 Online - ' + lang.toUpperCase() + ']\n> Loaded: ' + p.title + '\n> Click "Ṣe Koodu (Run)" to execute.';

        const textarea = document.getElementById('ide-code-input');
        if (textarea) textarea.value = p.code;
        const fnEl = document.getElementById('ide-filename');
        if (fnEl) fnEl.textContent = p.filename;
        const lineGutter = document.getElementById('ide-line-numbers');
        if (lineGutter) {
          const count = p.code.split('\n').length;
          lineGutter.innerHTML = Array.from({ length: count }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
        }
        const termLogs = document.getElementById('ide-terminal-logs');
        if (termLogs) termLogs.textContent = state.coding.ideOutput;

        const explainerContent = document.getElementById('ide-explainer-content');
        if (explainerContent) {
          explainerContent.innerHTML = p.explainer
            ? p.explainer.map((step) => '<div class="explainer-step">' + step + '</div>').join('')
            : '<p>Execute code to view conceptual breakdown.</p>';
        }

        saveState();
        showToast('Loaded preset: ' + p.title);
        break;
      }
      case 'ide-insert-char': {
        const char = el.dataset.char || '';
        const textarea = document.getElementById('ide-code-input');
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          textarea.value = text.substring(0, start) + char + text.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + char.length;
          textarea.focus();
          state.coding.ideCode = textarea.value;
          const lineGutter = document.getElementById('ide-line-numbers');
          if (lineGutter) {
            const count = textarea.value.split('\n').length;
            lineGutter.innerHTML = Array.from({ length: count }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
          }
        }
        break;
      }
      case 'ide-insert-snippet': {
        const snippet = el.dataset.snippet || '';
        const textarea = document.getElementById('ide-code-input');
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const text = textarea.value;
          textarea.value = text.substring(0, start) + snippet + text.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
          textarea.focus();
          state.coding.ideCode = textarea.value;
          const lineGutter = document.getElementById('ide-line-numbers');
          if (lineGutter) {
            const count = textarea.value.split('\n').length;
            lineGutter.innerHTML = Array.from({ length: count }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
          }
        }
        break;
      }
      case 'ide-run-code': {
        const textarea = document.getElementById('ide-code-input');
        const code = textarea ? textarea.value : (state.coding.ideCode || '');
        state.coding.ideCode = code;
        const lang = state.coding.ideLang || 'yoruba';
        if (IDE_RUNNER_LANGUAGES.includes(lang)) {
          runRemoteIdeCode(code, lang);
          break;
        }
        if (['html', 'css', 'javascript'].includes(lang)) {
          runBrowserIdeCode(code, lang);
          break;
        }
        const canvas = document.getElementById('ide-graphic-canvas');
        const button = document.querySelector('[data-action="ide-run-code"]');
        const status = document.querySelector('.status-indicator');
        if (button) button.disabled = true;
        if (status) status.textContent = '● Running in isolated preview';
        runIdeInterpreter(code, lang, canvas).then((result) => {
          state.coding.ideOutput = result.output;
          state.coding.ideRuntime = result.duration + 'ms';
          if (!result.hasError) state.coding.ideXp = (state.coding.ideXp || 0) + 10;
          showIdeOutput(result.hasCanvasDraw ? 'preview' : 'terminal', result.output);
          const runtimeEl = document.getElementById('ide-status-runtime');
          if (runtimeEl) runtimeEl.textContent = 'Execution Time: ' + result.duration + 'ms';
          const xpEl = document.getElementById('ide-status-xp');
          if (xpEl) xpEl.textContent = '+' + (state.coding.ideXp || 0) + ' Maker XP';
          if (status) status.textContent = result.hasError ? '● Execution error' : '● Execution complete';
          saveState();
          showToast(result.hasError ? 'Review the error output and try again.' : 'Code executed successfully! +10 Maker XP', result.hasError ? 'error' : 'success');
        }).catch((error) => {
          const message = error instanceof Error ? error.message : 'The code could not be run.';
          showIdeOutput('terminal', `> Execution error\n${message}`);
          if (status) status.textContent = '● Execution error';
          showToast(message, 'error');
        }).finally(() => {
          if (button) button.disabled = false;
        });
        break;
      }
      case 'ide-reset-code':
      case 'ide-load-sample': {
        const lang = state.coding.ideLang || 'yoruba';
        const presets = getIdePresets(lang);
        const p = presets.find((item) => item.id === state.coding.idePresetId) || presets[0];
        state.coding.ideCode = p.code;
        state.coding.ideOutput = '> [Idilewa Engine v2.4 Online - ' + lang.toUpperCase() + ']\n> Code reset to default sample: ' + p.title;

        const textarea = document.getElementById('ide-code-input');
        if (textarea) textarea.value = p.code;
        const lineGutter = document.getElementById('ide-line-numbers');
        if (lineGutter) {
          const count = p.code.split('\n').length;
          lineGutter.innerHTML = Array.from({ length: count }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
        }
        const termLogs = document.getElementById('ide-terminal-logs');
        if (termLogs) termLogs.textContent = state.coding.ideOutput;

        saveState();
        showToast(action === 'ide-load-sample' ? 'Sample code loaded.' : 'Code reset to default.');
        break;
      }
      case 'ide-copy-code': {
        const textarea = document.getElementById('ide-code-input');
        const code = textarea ? textarea.value : (state.coding.ideCode || '');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            showToast('Code copied to clipboard!', 'success');
          }).catch(() => {
            showToast('Failed to copy code.', 'error');
          });
        } else {
          showToast('Code copied!', 'success');
        }
        break;
      }
      case 'ide-switch-tab': {
        const tab = el.dataset.tab || 'terminal';
        if (!['terminal', 'canvas', 'preview'].includes(tab)) break;
        showIdeOutput(tab, state.coding.ideOutput || '');
        saveState();
        break;
      }
      case 'ide-clear-output': {
        state.coding.ideOutput = '> [Idilewa Engine v2.4 Online]\n> Iboju ti mọ́ (Console cleared).';
        const termLogs = document.getElementById('ide-terminal-logs');
        if (termLogs) termLogs.textContent = state.coding.ideOutput;
        const canvas = document.getElementById('ide-graphic-canvas');
        if (canvas && canvas.getContext) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        saveState();
        showToast('Console output cleared.');
        break;
      }
      case 'ide-translate-to': {
        const language = document.getElementById('ide-output-language');
        if (!language || !['yo', 'ha', 'ig', 'sw', 'pcm'].includes(el.dataset.language || '')) break;
        language.value = el.dataset.language;
        handleAction('translate-ide-output', el);
        break;
      }
      case 'translate-ide-output': {
        void translateIdeOutput();
        break;
      }
      case 'speak-ide-output': {
        const output = document.getElementById('ide-output-translation');
        if (output?.dataset.translation) {
          void playPlotweaverSpeech(output.dataset.translation, output.dataset.language || 'yo')
            .catch((error) => showToast(error instanceof Error ? error.message : 'Idilewa could not generate this audio.', 'error'));
        }
        else showToast('Translate the console output first.', 'error');
        break;
      }
      case 'translate-voice-text': {
        void translateVoiceText();
        break;
      }
      case 'clear-voice-translation': {
        const input = document.getElementById('voice-translation-input');
        const output = document.getElementById('voice-translation-result');
        if (input) input.value = '';
        if (output) {
          output.textContent = '';
          delete output.dataset.translation;
          delete output.dataset.source;
        }
        const count = document.getElementById('voice-translation-character-count');
        if (count) count.textContent = '0';
        const transliteration = document.getElementById('voice-translation-transliteration');
        if (transliteration) transliteration.textContent = '';
        break;
      }
      case 'choose-translation-language': {
        const language = el.dataset.language || '';
        const selector = document.getElementById('voice-translation-language');
        if (!selector || !Array.from(selector.options).some((option) => option.value === language)) break;
        selector.value = language;
        document.querySelectorAll('[data-action="choose-translation-language"]').forEach((button) => {
          button.setAttribute('aria-pressed', String(button.dataset.language === language));
        });
        const title = document.getElementById('translation-result-title');
        if (title) title.textContent = `${translationLanguageName(language)} Translation`;
        const output = document.getElementById('voice-translation-result');
        if (output?.dataset.translation && output.dataset.language !== language) {
          output.textContent = '';
          delete output.dataset.translation;
          delete output.dataset.source;
        }
        const status = document.getElementById('voice-translation-provider-status');
        if (status) status.textContent = 'Choose Translate to create a new translation.';
        break;
      }
      case 'copy-voice-translation': {
        const text = document.getElementById('voice-translation-result')?.dataset.translation;
        if (!text) {
          showToast('Translate a phrase before copying it.', 'error');
          break;
        }
        if (!navigator.clipboard?.writeText) {
          showToast('Clipboard access is not available in this browser.', 'error');
          break;
        }
        void navigator.clipboard.writeText(text)
          .then(() => showToast('Translation copied.', 'success'))
          .catch((error) => showToast(error instanceof Error ? error.message : 'The translation could not be copied.', 'error'));
        break;
      }
      case 'speak-voice-translation': {
        void playVoiceTranslation().catch((error) => showToast(error instanceof Error ? error.message : 'Idilewa could not generate this audio.', 'error'));
        break;
      }
      case 'pause-voice-translation': {
        if (!activePlotweaverAudio) {
          showToast('Listen to a translation before pausing it.', 'error');
          break;
        }
        activePlotweaverAudio.pause();
        const status = document.getElementById('voice-translation-provider-status');
        if (status) status.textContent = 'Playback paused.';
        break;
      }
      case 'replay-voice-translation': {
        void playVoiceTranslation({ replay: true }).catch((error) => showToast(error instanceof Error ? error.message : 'The translation could not be replayed.', 'error'));
        break;
      }
      case 'translation-speech-speed': {
        const requestedSpeed = Number(el.dataset.speed || el.value);
        if (![0.75, 1].includes(requestedSpeed)) break;
        translationSpeechSpeed = requestedSpeed;
        if (activePlotweaverAudio) activePlotweaverAudio.playbackRate = requestedSpeed;
        const selector = document.querySelector('.translation-speed-select select');
        if (selector) selector.value = String(requestedSpeed);
        const status = document.getElementById('voice-translation-provider-status');
        if (status) status.textContent = `Speech speed set to ${requestedSpeed.toFixed(2)}x.`;
        break;
      }
      case 'open-saved-translation': {
        const id = el.dataset.id || '';
        const saved = [...state.savedTranslations, ...state.translationLessons].find((item) => item.id === id);
        if (!saved) {
          showToast('That saved translation could not be found.', 'error');
          break;
        }
        state.activeTranslationId = id;
        navigate('voice-translation');
        break;
      }
      case 'speak-voice-lesson': {
        void playPlotweaverSpeech(el.dataset.phrase || '', 'yo')
          .then((source) => {
            if (source === 'device') showToast('Using your device voice for this lesson.');
          })
          .catch((error) => showToast(error instanceof Error ? error.message : 'Idilewa could not generate this sound.', 'error'));
        break;
      }
      case 'speak-yoruba-vowel-sequence': {
        void playYorubaVowelSequence(el.dataset.phrase || '')
          .catch((error) => showToast(
            error instanceof Error ? error.message : 'Native Yorùbá vowel audio could not be generated.',
            'error',
          ));
        break;
      }
      case 'plotweaver-speak-text': {
        const text = document.getElementById('plotweaver-speech-text')?.value.trim() || '';
        const language = document.getElementById('plotweaver-speech-language')?.value || 'yo';
        const status = document.getElementById('plotweaver-speech-status');
        if (!text) {
          if (status) status.textContent = 'Enter text before generating audio.';
          break;
        }
        if (status) status.textContent = 'Generating audio with Idilewa…';
        void playPlotweaverSpeech(text, language).then((source) => {
          if (status) status.textContent = source === 'device'
            ? 'Playing with your device voice. This audio is not saved.'
            : 'Audio is playing. The generated audio is not saved.';
        }).catch((error) => {
          if (status) status.textContent = error instanceof Error ? error.message : 'Idilewa could not generate this audio.';
        });
        break;
      }
      case 'start-voice-transcription': {
        void toggleVoiceDictation(el);
        break;
      }

      case 'code-jump': {
        const targetId = ['coding-start', 'code-quest', 'code-adventures'].includes(el.dataset.target) ? el.dataset.target : 'coding-start';
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'code-set-language':
        if (CODE_COPY[lang]) state.coding.helperLanguage = lang;
        state.coding.stage = 1; state.coding.search = ''; state.coding.result = ''; state.coding.draft = '';
        saveState(); render(); document.getElementById('coding-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'code-quick-path':
        if (CODE_PATHS.some((item) => item.id === el.dataset.tech)) state.coding.techId = el.dataset.tech;
        state.coding.stage = 2; state.coding.level = 'beginner'; state.coding.missionId = 'hello';
        state.coding.result = ''; state.coding.draft = ''; saveState(); render();
        document.getElementById('coding-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'code-select-tech':
        if (CODE_PATHS.some((item) => item.id === el.dataset.tech)) state.coding.techId = el.dataset.tech;
        state.coding.stage = 2; state.coding.level = 'beginner'; state.coding.missionId = 'hello';
        state.coding.result = ''; state.coding.draft = ''; saveState(); render(); document.getElementById('coding-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'code-change-language':
        if (CODE_COPY[el.value]) state.coding.helperLanguage = el.value;
        saveState(); render(); break;
      case 'code-quest-add': {
        const direction = el.dataset.direction;
        if (!CODE_GARDEN_DIRECTIONS[direction] || state.coding.questCommands.length >= 12) break;
        state.coding.questCommands.push(direction); state.coding.questTrail = []; state.coding.questResult = '';
        saveState(); render(); break;
      }
      case 'code-quest-remove': {
        const index = Number(el.dataset.index);
        if (Number.isInteger(index) && index >= 0 && index < state.coding.questCommands.length) state.coding.questCommands.splice(index, 1);
        state.coding.questTrail = []; state.coding.questResult = ''; saveState(); render(); break;
      }
      case 'code-quest-clear':
        state.coding.questCommands = []; state.coding.questTrail = []; state.coding.questResult = '';
        saveState(); render(); break;
      case 'code-quest-run': {
        const copy = codeTextFor(state.coding.helperLanguage);
        const trail = ['0,3'];
        let x = 0; let y = 3; let problem = '';
        for (const direction of state.coding.questCommands) {
          const move = CODE_GARDEN_DIRECTIONS[direction];
          if (!move) { problem = 'unknown'; break; }
          const nextX = x + move.dx; const nextY = y + move.dy;
          if (nextX < 0 || nextX > 4 || nextY < 0 || nextY > 3) { problem = 'edge'; break; }
          if (CODE_GARDEN_OBSTACLES.has(`${nextX},${nextY}`)) { problem = 'leaf'; break; }
          x = nextX; y = nextY; trail.push(`${x},${y}`);
        }
        state.coding.questTrail = trail;
        if (state.coding.questCommands.length && !problem && `${x},${y}` === CODE_GARDEN_TARGET) {
          state.coding.questResult = `✓ ${copy.success} +10 maker XP`;
          if (!state.coding.completed.includes('garden-quest')) {
            state.coding.completed.push('garden-quest'); state.coding.points += 10;
            const today = new Date().toISOString().slice(0, 10);
            if (state.coding.lastPracticeDate !== today) {
              const previous = new Date(`${state.coding.lastPracticeDate || '1970-01-01'}T00:00:00Z`);
              const yesterday = new Date(`${today}T00:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
              state.coding.streak = previous.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10) ? state.coding.streak + 1 : 1;
              state.coding.lastPracticeDate = today;
            }
          }
          saveState(); render(); showToast('Garden quest complete! +10 maker XP.');
        } else {
          state.coding.questResult = problem === 'leaf'
            ? copy.questLeaf
            : problem === 'edge'
              ? copy.questEdge
              : state.coding.questCommands.length ? copy.questNotYet : copy.questAddFirst;
          saveState(); render();
        }
        break;
      }
      case 'code-set-level':
        if (CODE_LEVELS.some((item) => item.id === el.dataset.level)) state.coding.level = el.dataset.level;
        state.coding.result = ''; state.coding.draft = ''; saveState(); render(); document.getElementById('coding-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'code-select-mission':
        if (CODE_MISSIONS.some((item) => item.id === el.dataset.mission)) state.coding.missionId = el.dataset.mission;
        state.coding.stage = 3; state.coding.result = ''; state.coding.draft = ''; saveState(); render(); document.getElementById('coding-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'code-next-mission': {
        const currentMissionIdx = CODE_MISSIONS.findIndex((m) => m.id === state.coding.missionId);
        const currentLevelIdx = CODE_LEVELS.findIndex((l) => l.id === state.coding.level);
        if (currentMissionIdx !== -1 && currentMissionIdx < CODE_MISSIONS.length - 1) {
          state.coding.missionId = CODE_MISSIONS[currentMissionIdx + 1].id;
          state.coding.draft = '';
          state.coding.result = '';
          state.coding.stage = 3;
          showToast(`Opening next mission: ${CODE_MISSIONS[currentMissionIdx + 1].title}`);
        } else if (currentLevelIdx !== -1 && currentLevelIdx < CODE_LEVELS.length - 1) {
          state.coding.level = CODE_LEVELS[currentLevelIdx + 1].id;
          state.coding.missionId = CODE_MISSIONS[0].id;
          state.coding.draft = '';
          state.coding.result = '';
          state.coding.stage = 3;
          showToast(`Level up! Welcome to ${CODE_LEVELS[currentLevelIdx + 1].label}`);
        } else {
          state.coding.stage = 2;
          state.coding.draft = '';
          state.coding.result = '';
          showToast('All missions in this path complete! Choose your next adventure.');
        }
        saveState();
        render();
        const codeElem = document.getElementById('coding-start');
        if (codeElem) codeElem.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'code-back':
        state.coding.stage = Math.max(0, Math.min(3, Number(el.dataset.stage) || 0));
        state.coding.result = ''; state.coding.draft = ''; saveState(); render(); document.getElementById('coding-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'connect-tutor': {
        showToast('Teacher connections are unavailable until real educators and server-side guardian authorization are configured.', 'error');
        break;
      }
      case 'accept-assignment':
        if (!tutorSessionIsValid()) { showToast('A parent-approved tutor code must be validated first.', 'error'); break; }
        state.consent.assignmentAccepted = true; saveState(); render();
        showToast('Approved demo assignment noted. No lesson or message was created.'); break;
      case 'teacher-profile': openTeacherProfile(el.dataset.id); break;
      case 'request-teacher-intro': {
        document.getElementById('modal-root').innerHTML = '';
        showToast('Teacher connections are unavailable until real educators and server-side guardian authorization are configured.', 'error');
        break;
      }
      case 'learner-profile': openLearnerProfile(el.dataset.id); break;
      case 'respond-learner': {
        if (!tutorSessionIsValid()) { showToast('Only a guardian-approved, code-validated assignment can be accepted.', 'error'); break; }
        showToast('The sample learner cards are read-only; accept only the assigned learner displayed after code validation.', 'error'); break;
      }
      case 'select-feeling': state.reflectionFeeling = el.dataset.feeling || ''; saveState(); render(); break;
      case 'search-result': document.getElementById('modal-root').innerHTML = ''; navigate(el.dataset.route || 'index'); break;
      case 'select-language':
        if (state.available[lang]) { state.currentLang = lang; saveState(); navigate('course', { lang }); }
        break;
      case 'notify-language':
        if (!state.interested.includes(lang)) state.interested.push(lang);
        saveState(); render(); showToast(`${SOON_LANGUAGES.find((l) => l.id === lang)?.name || LANGUAGES.find((l) => l.id === lang)?.name || 'Language'} saved to your interest list on this device.`); break;
      case 'choose-level': state.level = normalizeCourseLevel(el.dataset.level || 'beginner'); state.currentLang = lang || state.currentLang; saveState(); navigate('course', { lang: state.currentLang, level: state.level }); break;
      case 'choose-module': navigate('lesson', { lang: lang || state.currentLang, level: el.dataset.level || state.level, module: el.dataset.module || 'greetings' }); break;
      case 'open-module': navigate('lesson', { lang: lang || state.currentLang, level: el.dataset.level || state.level, module: el.dataset.module || 'greetings' }); break;
      case 'back-to-levels': navigate('course', { lang: lang || state.currentLang }); break;
      case 'answer': quizAction(el, 'lesson', 'Correct. +10 practice points.'); break;
      case 'code-answer': quizAction(el, 'code', 'Exactly. +10 practice points.'); break;
      case 'owe-meaning-answer': quizAction(el, 'owe-meaning', 'You understood the proverb’s meaning. +10 practice points.'); break;
      case 'owe-story-answer': quizAction(el, 'owe-story', 'Exactly. You noticed Dami’s steady care. +10 practice points.'); break;
      case 'complete-lesson': {
        const key = el.dataset.key || `${state.currentLang}-greetings-intro`;
        if (!state.completed.includes(key)) { state.completed.push(key); state.points += 25; state.streak = Math.max(1, state.streak + 1); }
        void persistCompletedLesson(key);
        saveState(); showToast(getCurrentUser() ? 'Lesson complete. Syncing progress to your account.' : 'Lesson complete. Progress is saved on this device.'); navigate('course', { lang: lang || state.currentLang, level: el.dataset.level || state.level }); break;
      }
      case 'play-audio': playSample(el); break;
      case 'pair-language': break;
      case 'save-item': {
        const item = el.dataset.item;
        state.saved = state.saved.includes(item) ? state.saved.filter((x) => x !== item) : [...state.saved, item];
        saveState(); render(); showToast(state.saved.includes(item) ? 'Saved to your reading list.' : 'Removed from your reading list.'); break;
      }
      case 'billing-period': state.billing = el.dataset.period; saveState(); render(); break;
      case 'choose-plan': openModal(`${el.dataset.plan || 'Family'} updates`, 'Your interest has been noted in this browser preview. The Idilewa team will confirm final plans and pricing before launch.'); break;
      case 'login-mode': {
        const nextMode = el.dataset.mode === 'signup' ? 'signup' : 'signin';
        if (state.loginMode !== nextMode) state.authRole = 'adult';
        state.loginMode = nextMode;
        const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
        const params = new URLSearchParams(query);
        params.set('mode', state.loginMode);
        const nextHash = `#/${path || 'login'}?${params.toString()}`;
        if (window.location.hash === nextHash) render();
        else window.location.hash = nextHash;
        break;
      }
      case 'auth-role-select': {
        state.authRole = el.dataset.role === 'adult' ? 'adult' : 'child';
        if (state.authRole !== 'child') {
          verifiedGuardianSignup = null;
        }
        render();
        break;
      }
      case 'request-guardian-approval': void submitGuardianRequest(el); break;
      case 'verify-guardian-code': void verifyGuardianCode(el); break;
      case 'request-password-reset': void requestPasswordResetCode(el); break;
      case 'resend-signup-confirmation':
        {
        const emailInput = document.getElementById('authEmail');
        if (!emailInput?.reportValidity()) break;
        el.disabled = true;
        void resendSignupConfirmation(emailInput.value)
          .then(() => showToast('If this account still needs confirmation, a new link has been sent. Check your inbox and spam folder.', 'success'))
          .catch((error) => showToast(error instanceof Error ? error.message : 'A confirmation email could not be sent.', 'error'))
          .finally(() => { if (el.isConnected) el.disabled = false; });
        break;
        }
      case 'request-child-signin-code': void requestChildSigninCode(el); break;
      case 'resend-signin-otp':
        if (!pendingSignin?.email) break;
        el.disabled = true;
        void requestSigninOtp(pendingSignin.email, pendingSignin.purpose)
          .then(() => showToast(pendingSignin?.purpose === 'child-signin' ? 'A new passcode has been sent to your parent or guardian.' : 'A new recovery code has been sent.', 'success'))
          .catch((error) => showToast(error instanceof Error ? error.message : 'A new code could not be sent.', 'error'))
          .finally(() => { if (el.isConnected) el.disabled = false; });
        break;
      case 'cancel-auth-otp':
        state.loginMode = pendingSignin ? 'signin' : 'signup';
        pendingSignupEmail = '';
        pendingSignin = null;
        passwordResetVerified = false;
        render();
        break;
      case 'guardian-use-another-email':
        verifiedGuardianSignup = null;
        render();
        break;
      case 'toggle-password-visibility': {
        const passInput = document.getElementById('authPassword');
        if (passInput) {
          const isPassword = passInput.type === 'password';
          passInput.type = isPassword ? 'text' : 'password';
          el.innerHTML = icon(isPassword ? 'eyeOff' : 'eye', 16);
          el.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        }
        break;
      }
      case 'forgot-password': {
        const resetButton = document.querySelector('[data-action="request-password-reset"]');
        if (resetButton) void requestPasswordResetCode(resetButton);
        break;
      }
      case 'complete-profile':
        document.getElementById('modal-root').innerHTML = '';
        navigate('profile');
        break;
      case 'account-sign-out':
      case 'profile-sign-out':
        const authStorageError = clearPendingAuthFlow();
        void signOutAccount().then((result) => {
          state.loginMode = 'signin';
          state.authRole = 'adult';
          navigate(parseLocation().page.startsWith('tutor') ? 'tutor-login' : 'login', parseLocation().page.startsWith('tutor') ? {} : { mode: 'signin' }, true);
          if (returnToParentPortal) navigate('parent-login', {}, true);
          parentDashboardData = null;
          parentDashboardError = '';
          parentDashboardLoading = false;
          parentDashboardRequest += 1;
          const notice = result.activityEmailError
            ? `You have signed out. ${result.activityEmailError}`
            : authStorageError
              ? 'You signed out, but pending sign-in state could not be fully cleared. Close this tab and sign in again.'
              : 'You have signed out.';
          showToast(notice, authStorageError || result.activityEmailError ? 'error' : 'success');
        }).catch((error) => {
          state.loginMode = 'signin';
          state.authRole = 'adult';
          navigate(parseLocation().page.startsWith('tutor') ? 'tutor-login' : 'login', parseLocation().page.startsWith('tutor') ? {} : { mode: 'signin' }, true);
          if (returnToParentPortal) navigate('parent-login', {}, true);
          parentDashboardData = null;
          parentDashboardError = '';
          parentDashboardLoading = false;
          parentDashboardRequest += 1;
          const message = error instanceof Error ? error.message : 'Signed out on this device, but Supabase could not confirm the session revocation.';
          showToast(authStorageError ? `${message} Pending sign-in state could not be fully cleared.` : message, 'error');
        });
        const returnToParentPortal = parseLocation().page.startsWith('parent');
        break;
      case 'close-search': document.getElementById('modal-root').innerHTML = ''; break;
      case 'trainer-set-lang': {
        const selectedLang = el.dataset.lang || 'yoruba';
        state.trainer.lang = selectedLang;
        state.trainer.score = null;
        state.trainer.analysis = null;
        saveState();
        render();
        const langNames = { yoruba: 'Yorùbá', igbo: 'Igbo', hausa: 'Hausa', swahili: 'Kiswahili', zulu: 'isiZulu', twi: 'Twi' };
        showToast(`Selected ${langNames[selectedLang] || selectedLang} Voice Lessons`);
        break;
      }
      case 'trainer-set-level': {
        const lvl = el.dataset.level || 'beginner';
        state.trainer.level = lvl;
        state.trainer.activeLessonId = lvl === 'intermediate' ? 21 : lvl === 'advanced' ? 41 : 1;
        state.trainer.score = null;
        state.trainer.analysis = null;
        saveState();
        render();
        const studio = document.getElementById('trainerStudio');
        if (studio) studio.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'trainer-set-speed': {
        const speed = parseFloat(el.dataset.speed) || 1.0;
        state.trainer.speed = speed;
        saveState();
        render();
        showToast(`Voice speed set to ${speed}x`);
        break;
      }
      case 'trainer-play-syllable': {
        const freq = parseFloat(el.dataset.freq) || 293;
        const tone = el.dataset.tone || 're';
        try { playTonePitch(tone); } catch (_) {}
        playToneSound(freq, 0.35, 'triangle');
        el.classList.add('is-active-pitch');
        setTimeout(() => el.classList.remove('is-active-pitch'), 350);
        break;
      }
      case 'trainer-play-native': {
        const lessonId = parseInt(el.dataset.lessonId) || state.trainer.activeLessonId || 1;
        const langData = TRAINER_CURRICULUM[state.trainer.lang] || TRAINER_CURRICULUM.yoruba;
        const currentTierLessons = langData[state.trainer.level] || langData.beginner;
        const activeLesson = currentTierLessons.find((l) => l.id === lessonId) || currentTierLessons[0];
        if (activeLesson) {
          void playNativeTrainerVoice(activeLesson.phrase, state.trainer.lang, state.trainer.speed || 1.0, activeLesson.syllables)
            .then((source) => showToast(source === 'device' ? 'Using your device voice for this lesson.' : 'Playing Idilewa-generated audio.'))
            .catch((error) => showToast(error instanceof Error ? error.message : 'Idilewa could not generate lesson audio.', 'error'));
        }
        break;
      }
      case 'trainer-start-record': {
        const lessonId = parseInt(el.dataset.lessonId) || state.trainer.activeLessonId || 1;
        void startTrainerRecording(lessonId);
        break;
      }
      case 'trainer-stop-record': {
        const lessonId = parseInt(el.dataset.lessonId) || state.trainer.activeLessonId || 1;
        stopTrainerRecordingAndAnalyze(lessonId);
        break;
      }
      case 'trainer-prev-lesson': {
        const minId = state.trainer.level === 'beginner' ? 1 : state.trainer.level === 'intermediate' ? 21 : 41;
        if (state.trainer.activeLessonId > minId) {
          state.trainer.activeLessonId -= 1;
          state.trainer.score = null;
          state.trainer.analysis = null;
          saveState();
          render();
          const studio = document.getElementById('trainerStudio');
          if (studio) studio.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      }
      case 'trainer-next-lesson': {
        const maxId = state.trainer.level === 'beginner' ? 20 : state.trainer.level === 'intermediate' ? 40 : 60;
        if (state.trainer.activeLessonId < maxId) {
          state.trainer.activeLessonId += 1;
          state.trainer.score = null;
          state.trainer.analysis = null;
          saveState();
          render();
          const studio = document.getElementById('trainerStudio');
          if (studio) studio.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      }
      case 'trainer-select-lesson': {
        const id = parseInt(el.dataset.id) || 1;
        state.trainer.activeLessonId = id;
        state.trainer.score = null;
        state.trainer.analysis = null;
        saveState();
        render();
        const studio = document.getElementById('trainerStudio');
        if (studio) studio.scrollIntoView({ behavior: 'smooth' });
        break;
      }
      case 'trainer-view-cert': {
        const langData = TRAINER_CURRICULUM[state.trainer.lang] || TRAINER_CURRICULUM.yoruba;
        const currentTierLessons = langData[state.trainer.level] || langData.beginner;
        const completedInTier = currentTierLessons.filter((l) => state.trainer.completed && state.trainer.completed[l.id]);
        const count = completedInTier.length;
        const total = currentTierLessons.length;
        const isEligible = count >= total;
        const avg = count > 0 ? Math.round(completedInTier.reduce((acc, l) => acc + (state.trainer.completed[l.id]?.score || 0), 0) / count) : 0;
        const langNames = { yoruba: 'Yorùbá', igbo: 'Igbo', hausa: 'Hausa', swahili: 'Kiswahili', zulu: 'isiZulu', twi: 'Twi' };
        const langName = langNames[state.trainer.lang] || state.trainer.lang;
        const levelName = state.trainer.level.charAt(0).toUpperCase() + state.trainer.level.slice(1);
        openModal(
          `${langName} ${levelName} Tier Certificate`,
          isEligible
            ? `🎉 Congratulations! You have completed all ${total} lessons in the ${langName} ${levelName} tier with an average fluency score of ${avg}%! Your Idilewa African Voice Master badge has been certified.`
            : `Progress: ${count} of ${total} lessons completed in the ${langName} ${levelName} tier (${Math.round((count / total) * 100)}%). Complete all ${total} lessons with at least 85% accuracy to unlock your verified certificate!`
        );
        break;
      }
      case 'voice-select-language': {
        const language = el.dataset.language;
        if (!TRAINER_CURRICULUM[language]) break;
        state.trainer.lang = language;
        state.trainer.score = null;
        state.trainer.analysis = null;
        saveState();
        render();
        break;
      }
      case 'voice-lessons-jump': {
        const targetId = ['voice-clone-tools', 'trainerStudio'].includes(el.dataset.target) ? el.dataset.target : 'trainerStudio';
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'close-modal-and-jump': {
        const modalRoot = document.getElementById('modal-root');
        if (modalRoot) modalRoot.innerHTML = '';
        const targetId = el.dataset.target || el.dataset['target'];
        if (targetId) {
          setTimeout(() => {
            const target = document.getElementById(targetId);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
        break;
      }
      default: break;
    }
  }

  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && !event.target.closest('.aichat-popover, [data-action="aichat-settings"], [data-action="aichat-change-guide"]')) closeAiChatPopovers();
    const routeEl = event.target.closest('[data-route]');
    if (routeEl) {
      if (routeEl.tagName.toLowerCase() === 'a') event.preventDefault();
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot) modalRoot.innerHTML = '';
      const route = routeEl.dataset.route;
      const params = {};
      ['lang', 'level', 'module', 'lesson', 'grade', 'mode', 'section', 'story', 'screen', 'riddle', 'category', 'next', 'child'].forEach((key) => { if (routeEl.dataset[key]) params[key] = routeEl.dataset[key]; });
      if (route.startsWith('voice-')) {
        if (['yoruba', 'igbo', 'hausa', 'swahili', 'zulu', 'twi'].includes(params.lang)) state.trainer.lang = params.lang;
        if (['beginner', 'intermediate', 'advanced'].includes(params.level)) {
          state.trainer.level = params.level;
          state.trainer.activeLessonId = params.level === 'intermediate' ? 21 : params.level === 'advanced' ? 41 : 1;
        }
        if (params.lesson && /^\d+$/.test(params.lesson)) state.trainer.activeLessonId = Number(params.lesson);
        saveState();
      }
      navigate(route, params);
      return;
    }
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
      if (actionEl.dataset.action === 'close-modal') {
        if (event.target === actionEl || actionEl.tagName.toLowerCase() === 'button') handleAction('close-modal', actionEl);
        return;
      }
      handleAction(actionEl.dataset.action, actionEl);
    }
  });

  document.addEventListener('change', (event) => {
    const el = event.target;
    if (el.matches('.aichat-focus-select')) {
      changeAiChatLanguage(el.value);
      return;
    }
    if (el.matches('.translation-speed-select select')) {
      handleAction('translation-speech-speed', el);
      return;
    }
    if (el.matches('#voice-translation-language')) {
      document.querySelectorAll('[data-action="choose-translation-language"]').forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.language === el.value));
      });
      const title = document.getElementById('translation-result-title');
      if (title) title.textContent = `${translationLanguageName(el.value)} Translation`;
      const output = document.getElementById('voice-translation-result');
      if (output?.dataset.translation && output.dataset.language !== el.value) {
        output.textContent = '';
        delete output.dataset.translation;
        delete output.dataset.source;
      }
      return;
    }
    if (el.matches('#voice-translation-source-language')) {
      const output = document.getElementById('voice-translation-result');
      if (output?.dataset.translation) {
        output.textContent = '';
        delete output.dataset.translation;
        delete output.dataset.source;
      }
      return;
    }
    if (el.matches('#plotweaver-voice-select')) {
      state.trainer.voiceId = el.value || '';
      saveState();
      return;
    }
    if (el.matches('#profile-photo-input')) {
      const file = el.files?.[0];
      el.value = '';
      if (file) void saveProfilePhoto(file);
      return;
    }
    if (el.matches('[data-action="ide-select-preset"]')) { handleAction('ide-select-preset', el); return; }
    if (el.matches('#ide-language-select')) {
      handleAction('ide-set-lang', { dataset: { lang: el.value } });
      return;
    }
    if (el.matches('[data-action="level-select"]')) navigate('course', { lang: state.currentLang, level: el.value });
    if (el.matches('[data-action="pair-language"]')) { state.currentLang = el.value; saveState(); render(); }
    if (el.matches('#codeHelperLanguage')) { if (CODE_COPY[el.value]) state.coding.helperLanguage = el.value; saveState(); render(); }
    if (el.matches('[data-action="filter-teachers"]')) { state.teacherFilter = el.value; saveState(); render(); }
    if (el.matches('#signupType') || el.matches('#signinType')) {
      const signup = el.id === 'signupType';
      const block = document.getElementById(signup ? 'signupConsentFields' : 'signinConsentFields');
      const codeInput = document.getElementById(signup ? 'signupConsentCode' : 'signinConsentCode');
      const isChild = el.value === 'child';
      if (block) block.hidden = !isChild;
      if (codeInput) { codeInput.required = isChild; codeInput.disabled = !isChild; }
    }
    if (el.matches('#consentTutor')) {
      const tutorBox = document.querySelector('input[name="tutorConsent"]');
      if (tutorBox && !el.value) tutorBox.checked = false;
    }
    if (el.matches('[data-action="voice-feature-language"]')) {
      const { grade } = parseLocation().params;
      const gradePath = getVoiceGradePath(grade);
      navigate('voice-audio', {
        lang: el.value,
        level: gradePath?.level || state.trainer.level,
        ...(gradePath ? { grade: gradePath.id } : {})
      });
    }
    if (el.matches('[data-action="voice-feature-level"]')) {
      navigate('voice-audio', { lang: state.trainer.lang, level: el.value });
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.id === 'voice-translation-input') {
      const count = document.getElementById('voice-translation-character-count');
      if (count) count.textContent = String(target.value.length);
      const output = document.getElementById('voice-translation-result');
      if (output?.dataset.translation && output.dataset.source !== target.value.trim()) {
        output.textContent = '';
        delete output.dataset.translation;
        delete output.dataset.source;
        const transliteration = document.getElementById('voice-translation-transliteration');
        if (transliteration) transliteration.textContent = '';
      }
    }
    if (target.id === 'ide-code-input') {
      state.coding.ideCode = target.value;
      const lineGutter = document.getElementById('ide-line-numbers');
      if (lineGutter) {
        const count = target.value.split('\n').length;
        lineGutter.innerHTML = Array.from({ length: count }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
      }
    }
    if (target.id === 'ide-extension-search') {
      const query = target.value.trim().toLowerCase();
      document.querySelectorAll('.ide-extension-card').forEach((card) => {
        card.hidden = !card.dataset.extensionName.includes(query);
      });
    }

    if (event.target && event.target.id === 'siteSearch') {
      const results = document.getElementById('searchResults');
      if (results) results.innerHTML = searchResults(event.target.value);
    }
    if (event.target && event.target.id === 'codingSearch') {
      const value = event.target.value;
      const cursor = event.target.selectionStart ?? value.length;
      state.coding.search = value;
      saveState(); render();
      const next = document.getElementById('codingSearch');
      if (next) { next.focus(); try { next.setSelectionRange(cursor, cursor); } catch (_) { /* search inputs vary */ } }
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    const type = form.dataset.form;
    if (!type) return;
    event.preventDefault();
    if (type === 'aichat-composer') {
      submitAiConversationMessage(form);
      return;
    }
    const data = new FormData(form);
    if (type === 'parent-auth') {
      if (!form.reportValidity()) return;
      const errorElement = form.querySelector('.family-auth-error');
      const submitButton = form.querySelector('button[type="submit"]');
      const fail = (message) => {
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.hidden = false;
        } else showToast(message, 'error');
      };
      if (!isSupabaseConfigured || !supabase) {
        fail('Family accounts are not configured on this deployment. Please try again later.');
        return;
      }
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.hidden = true;
      }
      if (submitButton) submitButton.disabled = true;
      try {
        const mode = form.dataset.mode;
        const email = String(data.get('email') || '').trim();
        const password = String(data.get('password') || '');
        if (mode === 'signup') {
          const name = String(data.get('name') || '').trim();
          const phone = String(data.get('phone') || '').trim();
          if (!/^\+?[0-9\s()-]{7,24}$/.test(phone)) throw new Error('Enter a valid phone number.');
          if (!isSignupPasswordValid(password)) throw new Error('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.');
          const { session, welcomeEmailError } = await signUpAccount({
            email,
            password,
            name,
            phone,
            role: 'parent',
            redirectRoute: 'parent-dashboard'
          });
          parentDashboardData = null;
          parentDashboardError = '';
          parentDashboardLoading = false;
          parentDashboardRequest += 1;
          navigate('parent-welcome');
          if (!session) {
            showToast('Account created. Confirm your email to finish setting up your parent account.', 'success');
          } else if (welcomeEmailError) {
            showToast(`Your parent account is ready. ${welcomeEmailError}`, 'error');
          } else {
            showToast('Your parent account is ready.', 'success');
          }
          return;
        }
        await signInAccount({ email, password, expectedRole: 'parent' });
        parentDashboardData = null;
        parentDashboardError = '';
        parentDashboardLoading = false;
        parentDashboardRequest += 1;
        let activityEmailError = '';
        try {
          await sendAuthActivityEmail('sign-in');
        } catch (error) {
          activityEmailError = error instanceof Error ? error.message : 'The sign-in notification could not be sent.';
        }
        navigate('parent-dashboard');
        showToast(activityEmailError ? `Signed in successfully. ${activityEmailError}` : 'Welcome to your family portal.', activityEmailError ? 'error' : 'success');
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Your parent account could not be verified.');
      } finally {
        if (submitButton?.isConnected) submitButton.disabled = false;
      }
      return;
    }
    if (type === 'parent-profile') {
      if (!form.reportValidity()) return;
      const errorElement = form.querySelector('.family-auth-error');
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      try {
        const name = String(data.get('name') || '').trim();
        const phone = String(data.get('phone') || '').trim();
        if (!name) throw new Error('Enter your name before saving.');
        if (phone && !/^\+?[0-9\s()-]{7,24}$/.test(phone)) throw new Error('Enter a valid phone number.');
        await updateUserProfile({ name, phone });
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.hidden = true;
        }
        render();
        showToast('Your account details were saved.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Your account details could not be saved.';
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.hidden = false;
        } else showToast(message, 'error');
      } finally {
        if (submitButton?.isConnected) submitButton.disabled = false;
      }
      return;
    }
    if (type === 'tutor-login' || type === 'tutor-signup') {
      if (!form.reportValidity()) return;
      const errorElement = form.querySelector('.tutor-auth-error');
      const submitButton = form.querySelector('button[type="submit"]');
      const fail = (message) => {
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.hidden = false;
        } else showToast(message, 'error');
      };
      if (!isSupabaseConfigured || !supabase) {
        fail('Educator accounts are not configured on this deployment. Please try again later.');
        return;
      }
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.hidden = true;
      }
      if (submitButton) submitButton.disabled = true;
      try {
        const email = String(data.get('email') || '').trim();
        const password = String(data.get('password') || '');
        if (type === 'tutor-signup') {
          const firstName = String(data.get('firstName') || '').trim();
          const lastName = String(data.get('lastName') || '').trim();
          const name = `${firstName} ${lastName}`.trim();
          const inviteCode = String(data.get('inviteCode') || '').trim();
          if (!firstName || !lastName || name.length > 80) throw new Error('Enter a first and last name using no more than 80 characters.');
          if (!data.get('agreement')) throw new Error('Please agree to follow Idilewa’s safeguarding and privacy requirements.');
          if (password !== String(data.get('confirmPassword') || '')) throw new Error('The passwords do not match.');
          if (!isSignupPasswordValid(password)) throw new Error('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.');
          const educatorProfile = {
            country: String(data.get('country') || '').trim(),
            timeZone: String(data.get('timeZone') || '').trim(),
            teachingSubject: String(data.get('teachingSubject') || '').trim(),
            teachingExperience: String(data.get('teachingExperience') || '').trim(),
            qualifications: String(data.get('qualifications') || '').trim(),
          };
          const educatorInviteId = await verifyEducatorInvite(inviteCode);
          const { session, welcomeEmailError } = await signUpAccount({
            email,
            password,
            name,
            role: 'educator',
            educatorInviteId,
            educatorProfile,
            redirectRoute: 'tutor-login'
          });
          if (!session) {
            navigate('tutor-login');
            showToast('Account created. Confirm your email to finish setting up your tutor account.', 'success');
            return;
          }
          navigate('tutor-dashboard');
          showToast(welcomeEmailError ? `Your tutor account is ready. ${welcomeEmailError}` : 'Your tutor account is ready.', welcomeEmailError ? 'error' : 'success');
          return;
        }
        await signInAccount({ email, password, expectedRole: 'educator' });
        tutorDashboardData = null;
        tutorDashboardDataPage = '';
        let activityEmailError = '';
        try {
          await sendAuthActivityEmail('sign-in');
        } catch (error) {
          activityEmailError = error instanceof Error ? error.message : 'The sign-in notification could not be sent.';
        }
        navigate('tutor-dashboard');
        showToast(activityEmailError ? `Signed in successfully. ${activityEmailError}` : 'Welcome to your tutor portal.', activityEmailError ? 'error' : 'success');
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Your tutor account could not be verified.');
      } finally {
        if (submitButton?.isConnected) submitButton.disabled = false;
      }
    } else if (type === 'tutor-find-child') {
      const childEmail = String(data.get('childEmail') || '').trim();
      const submitButton = form.querySelector('button[type="submit"]');
      const feedback = form.querySelector('[data-tutor-connection-feedback]');
      if (!isTutorAccount()) {
        if (feedback) feedback.textContent = 'Sign in with a verified educator account to request a connection.';
        return;
      }
      if (!childEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(childEmail)) {
        if (feedback) feedback.textContent = 'Enter a valid learner account email address.';
        return;
      }
      if (submitButton) submitButton.disabled = true;
      if (feedback) feedback.textContent = 'Sending a private consent request to the family…';
      try {
        const result = await submitEducatorConnectionRequest(childEmail);
        tutorDashboardDataPage = '';
        await loadTutorPortalData();
        if (feedback) feedback.textContent = result.message;
        form.reset();
        showToast(result.message, 'success');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The family consent request could not be sent.';
        if (feedback) feedback.textContent = message;
        showToast(message, 'error');
      } finally {
        if (submitButton?.isConnected) submitButton.disabled = false;
      }
    } else if (type === 'tutor-availability') {
      const days = data.getAll('days').map(String).filter((day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(day));
      const start = String(data.get('start') || '');
      const end = String(data.get('end') || '');
      if (!days.length) {
        showToast('Choose at least one available day.', 'error');
        return;
      }
      if (!start || !end || start >= end) {
        showToast('Choose an end time later than your start time.', 'error');
        return;
      }
      try {
        localStorage.setItem(TUTOR_AVAILABILITY_KEY, JSON.stringify({
          days,
          start,
          end,
          timezone: String(data.get('timezone') || 'Africa/Lagos')
        }));
        showToast('Your availability was saved in this browser.');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Your availability could not be saved.', 'error');
      }
    } else if (type === 'plotweaver-voice-clone') {
      const submitButton = form.querySelector('button[type="submit"]');
      const file = data.get('file');
      if (!(file instanceof File) || !file.size || file.size > 4 * 1024 * 1024) {
        showToast('Choose a valid audio sample no larger than 4 MB.', 'error');
        return;
      }
      const cloneRequest = new FormData();
      for (const name of ['name', 'language', 'reference_text', 'description', 'file', 'consent']) {
        const value = data.get(name);
        if (value instanceof File || (typeof value === 'string' && value)) {
          cloneRequest.append(name, value);
        }
      }
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating voice…';
      }
      try {
        const created = await createPlotweaverVoice(cloneRequest);
        const voiceId = created.voice_id || created.id;
        if (typeof voiceId !== 'string' || !voiceId) {
          throw new Error('Idilewa created a voice but returned no voice ID.');
        }
        state.trainer.clonedVoices = [
          { voice_id: voiceId, name: String(data.get('name') || 'My cloned voice').slice(0, 80), type: 'cloned' },
          ...state.trainer.clonedVoices.filter((voice) => voice.voice_id !== voiceId),
        ].slice(0, 20);
        state.trainer.voiceId = voiceId;
        saveState();
        const selector = document.getElementById('plotweaver-voice-select');
        if (selector) delete selector.dataset.voiceLookupStarted;
        initializePlotweaverVoiceTools();
        showToast('Voice clone created. Select it for supported speech languages.', 'success');
        form.reset();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'The voice clone could not be created.', 'error');
      } finally {
        if (submitButton?.isConnected) {
          submitButton.disabled = false;
          submitButton.textContent = 'Create voice clone';
        }
      }
      return;
    } else if (type === 'guardian-consent' || type === 'child-consent-check' || type === 'tutor-consent-check') {
      showToast('Local consent codes are disabled. Use the verified parent-email approval flow for child accounts.', 'error');
      return;
    } else if (type === 'password-reset') {
      const password = String(data.get('password') || '');
      const confirmation = String(data.get('confirmPassword') || '');
      if (password !== confirmation) {
        showToast('The passwords do not match. Re-enter them and try again.', 'error');
        return;
      }
      if (!isSignupPasswordValid(password)) {
        showToast('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.', 'error');
        return;
      }
      try {
        await updateAccountPassword(password);
        pendingSignin = null;
        passwordResetVerified = false;
        await syncAccountLessonProgress();
        navigate(roleHomeRoute(getCurrentUser()?.role || state.authRole));
        try {
          await sendAuthActivityEmail('sign-in');
          showToast('Your password has been updated and you are signed in.', 'success');
        } catch (activityError) {
          showToast(`Your password was updated and you are signed in, but ${activityError instanceof Error ? activityError.message : 'the sign-in notification email could not be sent.'}`, 'error');
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Your password could not be updated. Please try again.', 'error');
      }
      return;
    } else if (type === 'signin-otp') {
      const token = String(data.get('token') || '').trim();
      try {
        const purpose = pendingSignin?.purpose || 'child-signin';
        await verifySigninOtp({
          email: pendingSignin?.email || '',
          token,
          expectedRole: purpose === 'child-signin' ? 'child' : pendingSignin?.role,
          purpose,
        });
        const signedInRole = getCurrentUser()?.role || 'child';
        state.authRole = signedInRole;
        if (signedInRole === 'child') {
          state.consent.childVerified = true;
          saveState();
        }
        if (purpose === 'password-reset') {
          passwordResetVerified = true;
          render();
          showToast('Email verified. Choose a new password to finish recovery.', 'success');
          return;
        }
        pendingSignin = null;
        await syncAccountLessonProgress();
        navigate(roleHomeRoute(signedInRole));
        let activityEmailError = '';
        try {
          await sendAuthActivityEmail('sign-in');
        } catch (activityError) {
          activityEmailError = activityError instanceof Error ? activityError.message : 'The sign-in notification email could not be sent.';
        }
        showToast(
          activityEmailError ? `You are signed in, but ${activityEmailError}` : 'Your parent-issued passcode was verified and you are signed in.',
          activityEmailError ? 'error' : 'success'
        );
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Email sign-in failed. Check the code and try again.', 'error');
      }
      return;
    } else if (type === 'coding-run') {
      const code = String(data.get('code') || '').slice(0, 1200);
      const tech = CODE_PATHS.find((item) => item.id === form.dataset.tech) || CODE_PATHS[0];
      const levelId = CODE_LEVELS.some((item) => item.id === form.dataset.level) ? form.dataset.level : 'beginner';
      const missionId = CODE_MISSIONS.some((item) => item.id === form.dataset.mission) ? form.dataset.mission : 'hello';
      const token = CODE_TOKENS[tech.syntax] || 'console.log';
      const copy = codeTextFor(state.coding.helperLanguage);
      const completionKey = `${tech.id}:${levelId}:${missionId}`;
      state.coding.draft = code;
      if (code.toLowerCase().includes(token.toLowerCase())) {
        state.coding.result = `✓ ${copy.success} +10 XP`;
        if (!state.coding.completed.includes(completionKey)) {
          state.coding.completed.push(completionKey); state.coding.points += 10;
          const today = new Date().toISOString().slice(0, 10);
          if (state.coding.lastPracticeDate !== today) {
            const previous = new Date(`${state.coding.lastPracticeDate || '1970-01-01'}T00:00:00Z`);
            const yesterday = new Date(`${today}T00:00:00Z`); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            state.coding.streak = previous.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10) ? state.coding.streak + 1 : 1;
            state.coding.lastPracticeDate = today;
          }
        }
        saveState(); render(); showToast('Challenge complete! +10 maker XP.');
      } else {
        state.coding.result = `↻ ${copy.retry} Hint: include “${token}” in your example.`;
        saveState(); render();
      }
      const account = getCurrentUser();
      if (account?.id) {
        try {
          await saveCodeSubmission({
            userId: account.id,
            title: `${tech.label || tech.name || tech.id} · ${missionId}`,
            code,
            output: state.coding.result,
            language: tech.id,
          });
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Your code attempt could not be saved to your account.', 'error');
        }
      }
    } else if (type === 'lesson-response') {
      const response = String(data.get('response') || '').trim();
      const key = form.dataset.key || '';
      if (!response || !key) { showToast('Add a short practice response before saving.', 'error'); return; }
      state.lessonResponses[key] = response;
      saveState(); render(); showToast('Practice saved on this device.');
    } else if (type === 'ai-helper') {
      const question = String(data.get('question') || '').trim();
      if (!question) { showToast('Add a short question to receive a reflection prompt.', 'error'); return; }
      answerAiPrompt(form.dataset.topic || 'general');
    } else if (type === 'owe-reflection') {
      const thought = String(data.get('thought') || '').trim();
      if (!state.reflectionFeeling) { showToast('Choose a feeling first, or ask a trusted adult to help you name one.', 'error'); return; }
      if (!thought) { showToast('Write one thought or action before saving.', 'error'); return; }
      state.reflections.unshift({ feeling: state.reflectionFeeling, thought, createdAt: Date.now() });
      state.reflectionFeeling = '';
      saveState(); render(); showToast('Your reflection is saved on this device only.');
    } else if (type === 'proverb') {
      const text = String(data.get('text') || '').trim();
      const meaning = String(data.get('meaning') || '').trim();
      if (!text || !meaning || !data.get('consent')) { showToast('Please complete the required fields and consent check.', 'error'); return; }
      state.savedProverbs.unshift({ text, meaning, language: String(data.get('language') || 'Yorùbá'), context: String(data.get('context') || '').trim() });
      saveState(); navigate('owe'); showToast('Your proverb is saved in this browser preview.');
    } else if (type === 'ide-assistant') {
      const prompt = String(data.get('question') || '').trim();
      if (!prompt) { showToast('Ask a question about the code first.', 'error'); return; }
      analyzeIdeAssistantCode(prompt);
    } else if (type === 'profile-settings') {
      const profile = {
        name: String(data.get('name') || '').trim(),
        bio: String(data.get('bio') || '').trim(),
        goal: String(data.get('goal') || '').trim(),
        language: String(data.get('language') || 'yoruba'),
        level: String(data.get('level') || 'beginner'),
        interests: data.getAll('interests').map(String)
      };
      const metadata = {
        name: profile.name,
        bio: profile.bio,
        learning_goal: profile.goal,
        learning_language: profile.language,
        learning_level: profile.level,
        interests: profile.interests
      };
      try {
        if (getCurrentUser()) await updateUserProfile(metadata);
        localStorage.setItem(PROFILE_DETAILS_KEY, JSON.stringify(profile));
        state.currentLang = LANGUAGES.some((item) => item.id === profile.language) ? profile.language : 'yoruba';
        state.level = ['beginner', 'intermediate', 'advanced'].includes(profile.level) ? profile.level : 'beginner';
        saveState();
        render();
        showToast(getCurrentUser() ? 'Your profile was saved to your account.' : 'Your profile was saved on this device. Sign in to sync it.', 'success');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Could not save your profile.', 'error');
      }
    } else if (type === 'educator-connection-request') {
      const childEmail = String(data.get('childEmail') || '').trim();
      const submitButton = form.querySelector('button[type="submit"]');
      const feedback = document.querySelector('[data-connection-feedback]');
      if (submitButton) submitButton.disabled = true;
      if (feedback) feedback.textContent = 'Sending the parent consent request…';
      try {
        const result = await submitEducatorConnectionRequest(childEmail);
        form.reset();
        if (feedback) feedback.textContent = result.message;
        showToast(result.message, 'success');
        tutorDashboardDataPage = '';
        await loadTutorPortalData();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The consent request could not be sent.';
        if (feedback) feedback.textContent = message;
        showToast(message, 'error');
      } finally {
        if (submitButton?.isConnected) submitButton.disabled = false;
      }
    } else if (type === 'login') {
      const accountType = data.get('accountType') === 'adult' ? 'adult' : 'child';
      state.authRole = accountType;
      const email = String(data.get('email') || '').trim();
      if (state.loginMode !== 'signup' && accountType === 'child') {
        showToast('Child sign-in uses a one-time passcode sent to the approved parent or guardian. Select “Send a passcode to my parent.”', 'error');
        return;
      }
      if (state.loginMode === 'signup' && accountType === 'child'
        && (!verifiedGuardianSignup || verifiedGuardianSignup.email !== email.trim().toLowerCase())) {
        showToast('A verified guardian email code for this exact learner email is required before child sign-up.', 'error');
        return;
      }
      if (!isSupabaseConfigured || !supabase) {
        showToast('Account authentication is not configured on this deployment. Continue as a guest.', 'error');
        return;
      }

      const password = String(data.get('password') || '');
      let welcomeEmailError = '';
      try {
        if (state.loginMode === 'signup') {
          if (!isSignupPasswordValid(password)) {
            showToast('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.', 'error');
            document.getElementById('authPassword')?.focus();
            return;
          }
          const name = String(data.get('name') || '').trim();
          const {
            session,
            welcomeEmailError: deliveryError,
          } = await signUpAccount({
            email,
            password,
            name,
            role: accountType,
            guardianAccessRequestId: accountType === 'child' ? verifiedGuardianSignup?.approvalId : undefined,
          });
          welcomeEmailError = deliveryError;
          if (!session) {
            verifiedGuardianSignup = null;
            try { sessionStorage.removeItem('idilewa-guardian-signup'); } catch (_) {}
            state.loginMode = 'signin';
            navigate('login', { mode: 'signin' }, true);
            showToast('Account created. Check your email to confirm it; the link will return you to Idilewa.', 'success');
            return;
          }
          signupEmailForSignin = email.toLowerCase();
          verifiedGuardianSignup = null;
          try { sessionStorage.removeItem('idilewa-guardian-signup'); } catch (_) {}
        } else {
          await signInAccount({ email, password, expectedRole: 'adult' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Account authentication failed. Try again.';
        const userMessage =
          state.loginMode !== 'signup' && /invalid login credentials|wrong password|incorrect password/i.test(message)
            ? 'We couldn’t sign you in with those details. Check that you selected Adult / Family and use Forgot password if needed. New here? Choose Create Account.'
            : message;
        const inlineError = document.getElementById('authInlineError');
        if (inlineError) {
          inlineError.textContent = userMessage;
          inlineError.hidden = false;
        } else {
          showToast(userMessage, 'error');
        }
        return;
      }

      const signedInRole = getCurrentUser()?.role || accountType;
      let activityEmailError = '';
      if (state.loginMode !== 'signup') {
        try {
          await sendAuthActivityEmail('sign-in');
        } catch (activityError) {
          activityEmailError = activityError instanceof Error ? activityError.message : 'The sign-in notification email could not be sent.';
        }
      }
      if (signedInRole === 'child') {
        state.consent.childVerified = true;
        saveState();
      }
      await syncAccountLessonProgress();
      showToast(
        activityEmailError
          ? `You are signed in, but ${activityEmailError}`
          : welcomeEmailError
          ? `Your Idilewa account is ready. ${welcomeEmailError}`
          : state.loginMode === 'signup' ? 'Your Idilewa account is ready.' : 'Signed in successfully.',
        activityEmailError || welcomeEmailError ? 'error' : 'success'
      );
      verifiedGuardianSignup = null;
      try { sessionStorage.removeItem('idilewa-guardian-signup'); } catch (_) {}
      navigate(roleHomeRoute(signedInRole));
      if (['adult', 'child'].includes(signedInRole)) {
        const profile = getProfileDetails();
        if (!profile.bio || !profile.goal) window.setTimeout(openProfileCompletionPrompt, 120);
      }
    } else if (type === 'interest') {
      showToast('Thanks for your interest. This prototype does not send or store contact details.');
      form.reset();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeMobileMenu();
      closeAiChatPopovers();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); openSearch();
    }
  });

  window.addEventListener('hashchange', render);
  if (isSupabaseConfigured) {
    try {
      await restoreAuthSession();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Your saved sign-in session could not be restored.', 'error');
    }
  }
  render();
})();

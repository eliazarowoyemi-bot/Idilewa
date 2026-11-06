/* Idilewa STEM Studio — single source of truth for learner state.
 * Everything persisted goes through the AES-GCM vault (see security.js). */

import { vault } from './security.js';

const STORAGE_KEY = 'idilewa.studio.state.v1';

export const ROLE_LABELS = {
  child: 'Young learner',
  adult: 'Adult learner',
  parent: 'Parent / Guardian',
  teacher: 'Teacher / Tutor',
};

export const LEVELS = [
  { name: 'Ìbẹ̀rẹ̀', sub: 'Beginner', at: 0 },
  { name: 'Orò’master I', sub: 'Explorer', at: 240 },
  { name: "Orò'master II", sub: 'Builder', at: 480 },
  { name: 'Orò’master III', sub: 'Mentor', at: 900 },
];

export function defaultState() {
  return {
    version: 1,
    user: {
      id: 'guest',
      name: 'Adéọlá',
      role: 'child',
      email: '',
      phone: '',
      avatar: '',
      familyName: 'Ilé Ọlá',
      signedIn: false,
      verified: false,
    },
    xp: 480,
    streak: 6,
    minutes: 92,
    lessonsDone: 7,
    voiceSessions: 12,
    badges: [
      { id: 'tone-hunter', emoji: '🎚️', name: 'Tone Hunter', sub: '10 tonal wins', earned: true },
      { id: 'storyteller', emoji: '📖', name: 'Storyteller', sub: '3 stories', earned: true },
      { id: 'code-cadet', emoji: '🤖', name: 'Code Cadet', sub: 'First loop', earned: true },
      { id: 'night-owl', emoji: '🌙', name: 'Night Owl', sub: 'Late practice', earned: false },
      { id: 'elder-ear', emoji: '👂', name: 'Elder Ear', sub: 'Perfect pitch', earned: false },
      { id: 'guardian', emoji: '🛡️', name: 'Family Keeper', sub: 'Consent signed', earned: true },
    ],
    settings: {
      haptics: true,
      soundEffects: true,
      reducedMotion: false,
      offlineVault: true,
      shareProgress: true,
      language: 'yoruba',
    },
    consent: {
      guardianName: 'Ìyá Bọ́lá',
      guardianEmail: 'guardian@idilewa.com',
      signed: true,
      signedAt: '2026-02-14',
      recordingAllowed: true,
      mentorAllowed: false,
    },
    children: [
      { id: 'c1', name: 'Adéọlá', initials: 'A', age: 9, grade: 'Grade 4', xp: 480, tone: 'mi' },
      { id: 'c2', name: 'Kẹ́mi', initials: 'K', age: 7, grade: 'Grade 2', xp: 210, tone: 'do' },
      { id: 'c3', name: 'Túndé', initials: 'T', age: 12, grade: 'Grade 7', xp: 640, tone: 're' },
    ],
    plan: {
      tier: 'family',
      price: 48000,
      period: 'per year',
      renews: '2026-09-01',
      channel: 'kora',
    },
    codeProjects: [
      { id: 'p1', title: 'Adire Car Race', blocks: 6, updated: 'Today' },
      { id: 'p2', title: 'Talking Drum Loop', blocks: 4, updated: 'Yesterday' },
    ],
    activity: [
      { id: 'a1', text: 'Nailed the high-tone drill in Tonal Lab', when: 'Today · 4:12 pm', xp: 40 },
      { id: 'a2', text: 'Built a 6-block race game in Code Studio', when: 'Yesterday', xp: 60 },
      { id: 'a3', text: 'Practised “Ẹ káàárọ̀” with the AI tutor', when: '2 days ago', xp: 25 },
    ],
    route: 'home',
  };
}

function merge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = merge(base[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

const subscribers = new Set();

export const store = {
  state: defaultState(),
  ready: false,

  async init() {
    const restored = await vault.read(STORAGE_KEY, null);
    if (restored && typeof restored === 'object') {
      this.state = merge(defaultState(), restored);
    }
    this.ready = true;
    this.notify();
    return this.state;
  },

  get() {
    return this.state;
  },

  user() {
    return this.state.user;
  },

  level() {
    const xp = this.state.xp;
    let current = LEVELS[0];
    for (const level of LEVELS) if (xp >= level.at) current = level;
    const next = LEVELS.find((level) => level.at > xp) || LEVELS[LEVELS.length - 1];
    const span = Math.max(1, next.at - current.at);
    const pct = next === current ? 100 : Math.round(((xp - current.at) / span) * 100);
    return { current, next, pct, xp };
  },

  async patch(partial, { silent = false } = {}) {
    this.state = merge(this.state, partial);
    await this.persist();
    if (!silent) this.notify();
    return this.state;
  },

  async addXp(amount, reason = '') {
    this.state = merge(this.state, {
      xp: this.state.xp + amount,
      activity: reason
        ? [{ id: `a${Date.now()}`, text: reason, when: 'Just now', xp: amount }, ...this.state.activity].slice(0, 8)
        : this.state.activity,
    });
    await this.persist();
    this.notify();
    return this.state.xp;
  },

  async persist() {
    await vault.write(STORAGE_KEY, this.state);
  },

  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },

  notify() {
    subscribers.forEach((fn) => {
      try { fn(this.state); } catch { /* subscriber error is non-fatal */ }
    });
  },

  async signOut() {
    this.state = merge(defaultState(), {
      user: { ...defaultState().user, signedIn: false, verified: false, name: 'Adéọlá' },
    });
    await this.patch(this.state);
  },

  async reset() {
    this.state = defaultState();
    await this.persist();
    this.notify();
  },
};

/* Idilewa STEM Studio — shared UI primitives (icons, shell chrome, toast, modal). */

import brandLogoUrl from '../../assets/idilewa-brand.png';
import listeningReader from '../../assets/listening-reader.jpg';
import educatorWoman from '../../assets/yoruba-educator-woman.jpg';
import educatorMan from '../../assets/yoruba-educator-man.jpg';
import kidsCulture from '../../assets/yoruba-kids-culture.jpg';
import storyGrandmother from '../../assets/story-grandmother.jpg';
import kidsFriends from '../../assets/african-kids-friends.jpg';
import codeKids from '../../assets/code-kids.jpg';
import pageKids from '../../assets/page-kids-1.jpg';

export const ASSETS = {
  brand: brandLogoUrl,
  reader: listeningReader,
  educatorWoman,
  educatorMan,
  kidsCulture,
  storyGrandmother,
  kidsFriends,
  codeKids,
  pageKids,
};

const PATHS = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
  waves: '<path d="M2 12h2m3 0h.01M9 7v10m4-14v18m4-13v8m3-4h2m3 0h.01"/>',
  sparkles: '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1-2.1-.9 2.1-.9z"/>',
  code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-11-4 14"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a5.6 5.6 0 0 0-1.2-3.5"/>',
  shield: '<path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  arrowLeft: '<path d="M19 12H5m6-7-7 7 7 7"/>',
  arrowRight: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  play: '<path d="M7 4.5 20 12 7 19.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="7" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none"/>',
  check: '<path d="m5 13 4.5 4.5L19 7"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16 9"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2.5"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13"/>',
  undo: '<path d="M4 10h9a5 5 0 0 1 0 10H8"/><path d="m8 6-4 4 4 4"/>',
  redo: '<path d="M20 10h-9a5 5 0 0 0 0 10h5"/><path d="m16 6 4 4-4 4"/>',
  download: '<path d="M12 4v10m-4-4 4 4 4-4M5 19h14"/>',
  brush: '<path d="M4 20s1-4 4-4 3-2 3-2l6-9 3 3-9 6s-2 0-2 3-5 3-5 3z"/>',
  eraser: '<path d="m6 17 8-8 5 5-6 6H8z"/><path d="M4 20h16"/>',
  square: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  circle: '<circle cx="12" cy="12" r="7.5"/>',
  line: '<path d="M5 19 19 5"/>',
  star: '<path d="m12 4 2.4 5 5.6.8-4 4 .9 5.6-4.9-2.7-4.9 2.7.9-5.6-4-4 5.6-.8z"/>',
  flame: '<path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.4-5C10 8.4 12 6.6 12 3z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3M12 13v4M9 21h6l-.6-3H9.6z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5V7m8-3.5V7M4 10.5h16"/>',
  video: '<rect x="3" y="6" width="12" height="12" rx="2.5"/><path d="m15 11 6-3v8l-6-3z"/>',
  phone: '<path d="M6 3h3l2 5-2.2 1.6a11 11 0 0 0 5.1 5.1L15.5 12l5 2v3a2.5 2.5 0 0 1-2.7 2.5C11.5 19 5 12.5 3.5 5.7A2.5 2.5 0 0 1 6 3z"/>',
  message: '<path d="M4 5.5h16v10H9l-5 4z"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/>',
  bank: '<path d="M3 10 12 4l9 6M6 10v8m4-8v8m4-8v8m4-8v8M3 21h18"/>',
  wallet: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M16 12h2.5"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  key: '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21m-3 0v3m-3-3v2.5"/>',
  eye: '<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="M4 4l16 16M9.6 6.4A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.7M6.4 8.2A17 17 0 0 0 2.5 12s3.5 6 9.5 6a9.6 9.6 0 0 0 3.3-.6"/>',
  logout: '<path d="M9 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H9M15 8l4 4-4 4M19 12H9"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.4-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.6 0z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17-2.5-2.6-2.5-14.4 0-17z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5z"/><path d="M8 7h8M8 11h7"/>',
  headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="13" width="4" height="7" rx="2"/><rect x="17" y="13" width="4" height="7" rx="2"/>',
  gamepad: '<rect x="2.5" y="7" width="19" height="10" rx="4"/><path d="M7 10.5v3M5.5 12h3M15.5 11h.01M18 13h.01"/>',
  layers: '<path d="m12 3 8 4.5-8 4.5L4 7.5z"/><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"/>',
  car: '<path d="M4 16h16M6 16v2.5M18 16v2.5M5 16l1.6-6A2 2 0 0 1 8.5 8.5h7a2 2 0 0 1 1.9 1.5L19 16"/><circle cx="7.5" cy="16" r="1.6"/><circle cx="16.5" cy="16" r="1.6"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/>',
  fingerprint: '<path d="M12 3a9 9 0 0 0-6.4 2.7M21 12a9 9 0 0 0-4-7.5M4 9a9 9 0 0 0 1 8.5M8.5 21a13 13 0 0 0 1.5-6.5A2 2 0 0 1 12 12a2 2 0 0 1 2 2.5M15.5 8A7 7 0 0 1 17 13c0 1.6-.3 3.2-.8 4.6M12 8a4 4 0 0 1 4 4c0 1.4-.2 2.8-.6 4"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z"/><path d="M10 18a2 2 0 0 0 4 0"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  wand: '<path d="m6 18 9-9M14 4l1 2.5 2.5 1L15 8.5 14 11l-1-2.5L10.5 7.5 13 6.5zM5 9l.7 1.8L7.5 11.5 5.7 12.2 5 14l-.7-1.8L2.5 11.5l1.8-.7z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  volume: '<path d="M4 10v4h3l4 3.5v-11L7 10z"/><path d="M15 9.5a3.5 3.5 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  pulse: '<path d="M3 12h3.5l2-5 3 11 2.5-6h7"/>',
};

export function icon(name, className = '') {
  const path = PATHS[name] || PATHS.sparkles;
  return `<svg${className ? ` class="${className}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

export function initials(name) {
  return String(name || 'Idilewa')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'voice', label: 'Voice', icon: 'mic' },
  { id: 'code', label: 'Code', icon: 'code' },
  { id: 'speak', label: 'AI Speak', icon: 'sparkles' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

export const RAIL_LINKS = [
  ...TABS,
  { id: 'lab', label: 'Tonal Lab', icon: 'waves' },
  { id: 'mentors', label: 'Mentors', icon: 'users' },
  { id: 'guardian', label: 'Guardian', icon: 'shield' },
  { id: 'checkout', label: 'Family Pass', icon: 'card' },
];

export function topbar({ route = 'home', kicker = '', title = '', back = false, dark = false, user = null, actions = '' }) {
  const brand = back
    ? `<button type="button" class="cs-iconbtn" data-nav="back" aria-label="Go back">${icon('arrowLeft')}</button>
       <div class="cs-brand"><div class="cs-brand__text"><strong>${esc(title || 'Idilewa')}</strong><span>${esc(kicker || 'STEM Studio')}</span></div></div>`
    : `<div class="cs-brand">
         <div class="cs-brand__mark"><img src="${ASSETS.brand}" alt="" /></div>
         <div class="cs-brand__text"><strong>Idilewa</strong><span>${esc(kicker || 'STEM Studio')}</span></div>
       </div>`;
  const avatar = user
    ? `<a class="cs-avatar cs-avatar--photo" href="#/profile" aria-label="Open profile"><img src="${user.avatar || ASSETS.kidsCulture}" alt="" /></a>`
    : `<a class="cs-avatar" href="#/auth" aria-label="Sign in">${icon('user')}</a>`;
  return `<header class="cs-topbar${dark ? ' cs-topbar--dark' : ''}" data-route="${route}">
    ${brand}
    ${actions}
    ${avatar}
  </header>`;
}

export function tabbar(route) {
  return `<nav class="cs-tabbar" aria-label="Studio navigation">
    ${TABS.map((tab) => `<a class="cs-tabbar__item${route === tab.id ? ' is-active' : ''}" href="#/${tab.id}" ${route === tab.id ? 'aria-current="page"' : ''}>
      ${icon(tab.icon)}<span>${tab.label}</span>
    </a>`).join('')}
  </nav>`;
}

export function rail(route, user) {
  return `<aside class="cs-rail" aria-label="Studio sections">
    <div class="cs-rail__brand">
      <div class="cs-brand__mark"><img src="${ASSETS.brand}" alt="" /></div>
      <div class="cs-brand__text"><strong>Idilewa</strong><span>STEM Studio</span></div>
    </div>
    <nav class="cs-rail__nav">
      ${RAIL_LINKS.map((link) => `<a class="cs-rail__link${route === link.id ? ' is-active' : ''}" href="#/${link.id}">${icon(link.icon)}<span>${link.label}</span></a>`).join('')}
    </nav>
    <div class="cs-rail__xp">
      <span class="cs-kicker" style="color:rgba(234,255,242,.7)">Learning streak</span>
      <strong style="font-size:15px">${user ? esc(user.streak || 0) : '0'} day streak</strong>
      <div class="cs-meter" style="background:rgba(255,255,255,.22)"><span class="cs-meter__fill" style="width:${Math.min(100, ((user?.xp || 0) % 600) / 6)}%"></span></div>
      <span style="font-size:11px;color:rgba(234,255,242,.75)">${user ? `${user.xp} XP earned` : 'Sign in to save progress'}</span>
    </div>
  </aside>`;
}

function toastStack() {
  let stack = document.querySelector('.cs-toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'cs-toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  return stack;
}

export function toast(message, { tone = 'default', duration = 2600 } = {}) {
  const stack = toastStack();
  const node = document.createElement('div');
  node.className = `cs-toast${tone === 'error' ? ' cs-toast--error' : ''}`;
  node.innerHTML = `${icon(tone === 'error' ? 'x' : 'checkCircle')}<span>${esc(message)}</span>`;
  stack.appendChild(node);
  window.setTimeout(() => {
    node.classList.add('is-out');
    window.setTimeout(() => node.remove(), 260);
  }, duration);
  return node;
}

export function modal({ title = '', body = '', actions = '', onMount } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'cs-modal';
  wrap.innerHTML = `<div class="cs-modal__sheet" role="dialog" aria-modal="true" aria-label="${esc(title || 'Dialog')}">
    <div class="cs-modal__grab"></div>
    ${title ? `<div class="cs-row cs-row--between"><h3 class="cs-h2">${esc(title)}</h3><button type="button" class="cs-iconbtn" data-close aria-label="Close">${icon('x')}</button></div>` : ''}
    <div class="cs-modal__body">${body}</div>
    ${actions ? `<div class="cs-col" style="gap:8px">${actions}</div>` : ''}
  </div>`;
  const close = () => {
    wrap.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (event) => { if (event.key === 'Escape') close(); };
  wrap.addEventListener('click', (event) => {
    if (event.target === wrap || event.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(wrap);
  onMount?.(wrap, close);
  return { element: wrap, close };
}



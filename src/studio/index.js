/* Idilewa STEM Studio — shell, router and bootstrap.
 *
 * The studio is a single-page app mounted into #studio-root. Every tab in
 * RAIL_LINKS maps to a page module exposing render(ctx) / mount(root, ctx). */

import './design.css';

import { store } from './store.js';
import { vault, guardContent } from './security.js';
import { topbar, tabbar, rail, toast, modal } from './ui.js';

import * as homePage from './pages/home.js';
import * as voicePage from './pages/voice.js';
import * as labPage from './pages/tonalLab.js';
import * as codePage from './pages/code.js';
import * as speakPage from './pages/aiSpeak.js';
import * as mentorsPage from './pages/mentors.js';
import * as guardianPage from './pages/guardian.js';
import * as checkoutPage from './pages/checkout.js';
import * as profilePage from './pages/profile.js';
import * as authPage from './pages/auth.js';

const ROUTES = {
  home: { page: homePage, kicker: 'STEM Studio' },
  voice: { page: voicePage, kicker: 'Lab 02 · Pronunciation' },
  lab: { page: labPage, kicker: 'Lab 03 · Tonal Lab' },
  code: { page: codePage, kicker: 'Lab 05 · Code Studio', dark: true },
  speak: { page: speakPage, kicker: 'Lab 06 · Conversation' },
  mentors: { page: mentorsPage, kicker: 'Mentor circle' },
  guardian: { page: guardianPage, kicker: 'Guardian console' },
  checkout: { page: checkoutPage, kicker: 'Family Pass' },
  profile: { page: profilePage, kicker: 'Your space' },
  auth: { page: authPage, kicker: 'Welcome back' },
};

const DEFAULT_ROUTE = 'home';
const TITLES = {
  home: 'Home', voice: 'Voice Lessons', lab: 'Tonal Lab', code: 'Code Studio',
  speak: 'AI Speak', mentors: 'Mentors', guardian: 'Guardian', checkout: 'Family Pass',
  profile: 'Profile', auth: 'Sign in',
};

let shellRoot = null;
let activeRoute = '';
let cleanupPage = null;
let subscribed = false;

function routeFromHash() {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].trim();
  return ROUTES[raw] ? raw : DEFAULT_ROUTE;
}

function railSummary() {
  const state = store.get();
  return { xp: state.xp, streak: state.streak };
}

function shellTop(name) {
  const entry = ROUTES[name];
  const state = store.get();
  return topbar({
    route: name,
    kicker: entry.kicker,
    title: TITLES[name],
    dark: Boolean(entry.dark),
    user: state.user.signedIn ? state.user : null,
    actions: `<div class="cs-topbar__actions">
      <span class="cs-pill cs-pill--mint cs-pill--sm">${state.xp} XP</span>
      <span class="cs-pill cs-pill--outline cs-pill--sm">🔥 ${state.streak}</span>
    </div>`,
  });
}

function paintChrome(name) {
  const app = shellRoot?.querySelector('.cs-app');
  if (!app) return;
  const railEl = app.querySelector('.cs-rail');
  const topEl = app.querySelector('.cs-topbar');
  const tabEl = app.querySelector('.cs-tabbar');
  if (railEl) railEl.outerHTML = rail(name, railSummary());
  if (topEl) topEl.outerHTML = shellTop(name);
  if (tabEl) tabEl.outerHTML = tabbar(name);
}

const ctx = {
  store,
  toast,
  modal,
  nav: (name) => navigate(name),
  rerender: () => paint(activeRoute, { animate: false }),
  get state() { return store.get(); },
  get level() { return store.level(); },
};

function paint(name, { animate = true } = {}) {
  const route = ROUTES[name] ? name : DEFAULT_ROUTE;
  const entry = ROUTES[route];
  if (typeof cleanupPage === 'function') {
    try { cleanupPage(); } catch { /* a page cleanup must never break routing */ }
  }
  cleanupPage = null;
  activeRoute = route;

  let app = shellRoot.querySelector('.cs-app');
  if (!app) {
    shellRoot.innerHTML = '<div class="cs-app"></div>';
    app = shellRoot.querySelector('.cs-app');
  }
  if (app.dataset.route !== route) {
    app.dataset.route = route;
    app.innerHTML = `${rail(route, railSummary())}
      ${shellTop(route)}
      <main class="cs-main" id="studio-main" tabindex="-1"></main>
      ${tabbar(route)}`;
  } else {
    paintChrome(route);
  }

  const main = app.querySelector('#studio-main');
  main.innerHTML = entry.page.render(ctx);
  if (animate) {
    main.classList.remove('cs-route-in');
    void main.offsetWidth;
    main.classList.add('cs-route-in');
  }
  const cleanup = entry.page.mount?.(main, ctx);
  cleanupPage = typeof cleanup === 'function' ? cleanup : null;

  document.title = `${TITLES[route]} · Idilewa STEM Studio`;
  document.body.dataset.page = `studio-${route}`;
  window.scrollTo({ top: 0, behavior: animate ? 'smooth' : 'auto' });
}

function navigate(name) {
  const route = ROUTES[name] ? name : DEFAULT_ROUTE;
  const hash = `#/${route}`;
  if (window.location.hash === hash) {
    paint(route, { animate: false });
    return;
  }
  window.location.hash = hash;
}

function onHashChange() {
  paint(routeFromHash());
}

function onRootClick(event) {
  const trigger = event.target.closest('[data-nav]');
  if (!trigger) return;
  const target = trigger.dataset.nav;
  if (!target) return;
  event.preventDefault();
  if (target === 'back') {
    if (window.history.length > 1) window.history.back();
    else navigate(DEFAULT_ROUTE);
    return;
  }
  navigate(target);
}


async function boot(root) {
  shellRoot = root;
  shellRoot.classList.add('cs-root');
  document.body.classList.add('studio-surface');

  try {
    await vault.unlock();
  } catch { /* the vault falls back to plain reads when WebCrypto is absent */ }
  await store.init();

  shellRoot.innerHTML = '<div class="cs-app"></div>';
  root.addEventListener('click', onRootClick);
  window.addEventListener('hashchange', onHashChange);

  if (!subscribed) {
    subscribed = true;
    store.subscribe(() => {
      if (!activeRoute) return;
      paintChrome(activeRoute);
    });
  }

  paint(routeFromHash(), { animate: false });
  guardContent(shellRoot);
  return ctx;
}

const mountNode = typeof document !== 'undefined' ? document.getElementById('studio-root') : null;

if (mountNode) {
  boot(mountNode).catch((error) => {
    mountNode.innerHTML = `<div class="cs-app"><main class="cs-main"><div class="cs-card cs-card--tight">
      <h1 class="cs-h2">The studio could not start</h1>
      <p class="cs-sub">${String(error?.message || error)}</p>
      <button class="cs-btn cs-btn--primary" type="button" data-reload>Reload</button>
    </div></main></div>`;
    mountNode.querySelector('[data-reload]')?.addEventListener('click', () => window.location.reload());
  });
} else if (typeof console !== 'undefined') {
  console.warn('Idilewa Studio: #studio-root was not found on this page.');
}

export { ctx, navigate, paint, boot };


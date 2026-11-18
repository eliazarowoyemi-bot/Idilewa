import landingHomeHeroUrl from '../assets/landing-home-hero.webp';
import landingFeatureVoiceUrl from '../assets/landing-feature-voice.webp';
import landingFeatureCodeUrl from '../assets/landing-feature-code.webp';
import landingFeatureAiUrl from '../assets/landing-feature-ai.webp';
import landingFeatureHeritageUrl from '../assets/landing-feature-heritage.webp';

/**
 * Ìdíléwa site chrome: navigation popovers, contextual "More" popover
 * and scroll reveal.
 *
 * Vanilla ES module - the app is plain HTML/CSS/JS (no React), so the motion
 * layer lives in CSS (see design-system.css) and this file keeps navigation
 * popover state and its non-Popover fallback in sync.
 */

const nav = document.querySelector('[data-id-nav]');

const NAVIGATION_DESTINATIONS = [
  ['Learn', [
    ['/', 'Home'],
    ['/?view=academy', 'Language Academy'],
    ['/?view=progress', 'My Progress'],
    ['/development-center.html', 'Development Center'],
    ['/kids.html', 'Kids Arcade'],
  ]],
  ['Explore', [
    ['/?view=heritageLab', 'Heritage Library'],
    ['/ai-conversation.html', 'AI Conversation'],
    ['/milestone-achievement.html', 'Milestone Achievement'],
    ['/creative-studio.html', 'Creative Studio'],
    ['/faq.html', 'FAQ'],
    ['/about.html', 'About Ìdíléwa'],
    ['/pricing.html', 'Pricing'],
  ]],
  ['Family', [
    ['/parents.html', 'For Families'],
    ['/family-tasks.html', 'Family Tasks'],
    ['/tutor.html', 'Tutorship'],
  ]],
];

const NAVIGATION_HREFS = {
  academy: '/?view=academy',
  studio: '/?view=studio',
  tutors: '/tutor.html',
  aiChat: '/ai-conversation.html',
  codeLab: '/development-center.html',
  heritageLab: '/?view=heritageLab',
};

const FEATURE_ARTWORK = {
  voice: landingFeatureVoiceUrl,
  code: landingFeatureCodeUrl,
  ai: landingFeatureAiUrl,
  heritage: landingFeatureHeritageUrl,
};

function normalizeSiteNavigation() {
  const links = document.querySelectorAll('.id-nav__links button[onclick], .id-nav__menu button[onclick], .id-popover button[onclick]');

  links.forEach((button) => {
    const route = button.getAttribute('onclick')?.match(/go\(['"]([^'"]+)['"]\)/)?.[1];
    const href = NAVIGATION_HREFS[route];
    if (!href) return;

    const link = document.createElement('a');
    link.className = button.className;
    link.href = href;
    link.dataset.idilewaRoute = route;
    link.innerHTML = button.innerHTML;
    button.replaceWith(link);
  });

  document.querySelectorAll('.id-nav__menu[role="menu"], .id-popover[role="menu"]').forEach((menu) => {
    menu.removeAttribute('role');
  });
  document.querySelectorAll('.id-nav__menu [role="menuitem"], .id-popover [role="menuitem"]').forEach((item) => {
    item.removeAttribute('role');
  });
}

function setupHomepageArtwork() {
  const heroIllustration = document.querySelector('.heroIllustration');
  if (heroIllustration) {
    heroIllustration.src = landingHomeHeroUrl;
    heroIllustration.width = 1446;
    heroIllustration.height = 463;
    heroIllustration.loading = 'eager';
    heroIllustration.decoding = 'async';
    heroIllustration.fetchPriority = 'high';
  }

  document.querySelectorAll('.featureTile').forEach((tile) => {
    const imagePath = FEATURE_ARTWORK[tile.classList.contains('voice')
      ? 'voice'
      : tile.classList.contains('code')
        ? 'code'
        : tile.classList.contains('ai')
          ? 'ai'
          : tile.classList.contains('heritage')
            ? 'heritage'
            : ''];
    const icon = tile.querySelector('.featureIcon');
    if (!imagePath || !icon || icon.querySelector('img')) return;

    const image = document.createElement('img');
    image.src = imagePath;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.setAttribute('aria-hidden', 'true');
    icon.replaceChildren(image);
    icon.setAttribute('aria-hidden', 'true');
  });
}

function updateCurrentNavigation() {
  const view = new URLSearchParams(window.location.search).get('view') || 'home';
  const activeSelector = view === 'academy' || view === 'studio'
    ? '[data-id-dropdown] .id-nav__trigger'
    : view === 'aiChat'
      ? '[data-idilewa-route="aiChat"]'
      : view === 'home'
        ? '.id-nav__links > a[href="/"]'
        : '.id-more__trigger';

  document.querySelectorAll('.id-nav__links .id-nav__link').forEach((link) => {
    if (link.matches(activeSelector)) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function renderNavigationLinks(drawer) {
  const region = drawer.querySelector('.id-drawer__links');
  if (!region) return;

  region.replaceChildren(...NAVIGATION_DESTINATIONS.map(([label, links]) => {
    const group = document.createElement('div');
    group.className = 'id-popover__group';

    const heading = document.createElement('p');
    heading.className = 'id-popover__label';
    heading.textContent = label;
    group.append(heading);

    links.forEach(([href, text]) => {
      const link = document.createElement('a');
      link.className = 'id-popover__item';
      link.href = href;
      link.textContent = text;
      group.append(link);
    });

    return group;
  }));
}

function setupDropdown() {
  const dropdown = document.querySelector('[data-id-dropdown]');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.id-nav__trigger');
  const menu = dropdown.querySelector('.id-nav__menu');
  if (!trigger || !menu) return;

  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.dataset.open = open ? 'true' : 'false';
  };

  setOpen(false);

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(trigger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (trigger.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    trigger.focus();
  });

  dropdown.addEventListener('focusout', (event) => {
    if (!dropdown.contains(event.relatedTarget)) setOpen(false);
  });
}

function setupNavigationPopover() {
  const drawer = document.getElementById('idDrawer');
  const openButton = document.querySelector('[data-id-menu-open]');
  if (!drawer || !openButton) return;

  renderNavigationLinks(drawer);
  const drawerHead = drawer.querySelector('.id-drawer__head');
  if (drawerHead && !drawer.querySelector('.id-drawer__close')) {
    const handle = document.createElement('div');
    handle.className = 'id-drawer__handle';
    handle.setAttribute('aria-hidden', 'true');
    drawer.prepend(handle);

    const closeButton = document.createElement('button');
    closeButton.className = 'id-drawer__close';
    closeButton.type = 'button';
    closeButton.dataset.idMenuClose = 'true';
    closeButton.setAttribute('aria-label', 'Close navigation menu');
    closeButton.textContent = '×';
    drawerHead.append(closeButton);

    let pointerStartY = null;
    let pointerId = null;
    handle.addEventListener('pointerdown', (event) => {
      pointerStartY = event.clientY;
      pointerId = event.pointerId;
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointerup', (event) => {
      if (pointerId === event.pointerId && pointerStartY !== null && event.clientY - pointerStartY > 56) {
        close({ restoreFocus: true });
      }
      pointerStartY = null;
      pointerId = null;
    });
    handle.addEventListener('pointercancel', () => {
      pointerStartY = null;
      pointerId = null;
    });
  }

  if (!openButton.querySelector('.id-menu-btn__label')) {
    const label = document.createElement('span');
    label.className = 'id-menu-btn__label';
    label.textContent = 'Menu';
    openButton.append(label);
  }

  const supportsPopover = typeof drawer.showPopover === 'function'
    && typeof drawer.hidePopover === 'function';
  const supportsAnchorPositioning = typeof CSS !== 'undefined'
    && CSS.supports?.('position-area: block-end');

  const isOpen = () => supportsPopover
    ? drawer.matches(':popover-open')
    : drawer.dataset.open === 'true';

  const syncState = (open) => {
    openButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    openButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    drawer.dataset.open = open ? 'true' : 'false';
  };

  const placeFallback = () => {
    if (supportsAnchorPositioning || !isOpen()) return;
    const triggerBox = openButton.getBoundingClientRect();
    const width = drawer.offsetWidth || Math.min(360, window.innerWidth - 24);
    const height = drawer.offsetHeight;
    const left = Math.max(12, Math.min(triggerBox.right - width, window.innerWidth - width - 12));
    const top = Math.max(12, Math.min(triggerBox.bottom + 8, window.innerHeight - height - 12));
    drawer.style.insetBlockStart = `${Math.round(top)}px`;
    drawer.style.insetInlineStart = `${Math.round(left)}px`;
    drawer.style.insetInlineEnd = 'auto';
  };

  const close = ({ restoreFocus = false } = {}) => {
    if (supportsPopover) {
      if (isOpen()) drawer.hidePopover();
      if (restoreFocus) openButton.focus();
      return;
    }
    drawer.hidden = true;
    syncState(false);
    if (restoreFocus) openButton.focus();
  };

  if (!supportsPopover) {
    drawer.hidden = true;
  }
  syncState(false);

  if (supportsPopover) {
    drawer.addEventListener('toggle', () => {
      const open = isOpen();
      syncState(open);
      if (open) placeFallback();
    });
  } else {
    openButton.addEventListener('click', () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      syncState(open);
      if (open) placeFallback();
    });

    document.addEventListener('click', (event) => {
      if (!isOpen() || drawer.contains(event.target) || openButton.contains(event.target)) return;
      close();
    });

  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    event.preventDefault();
    close({ restoreFocus: true });
  });

  drawer.addEventListener('click', (event) => {
    if (event.target.closest('[data-id-menu-close]')) {
      close({ restoreFocus: true });
      return;
    }
    if (event.target.closest('.id-drawer__links a, .id-drawer__foot a, .id-drawer__foot button')) {
      close();
    }
  });

  window.addEventListener('resize', placeFallback, { passive: true });
  window.addEventListener('scroll', placeFallback, { passive: true });
}

function setupActionPopover() {
  const trigger = document.querySelector('[data-id-more-trigger]');
  const menu = document.getElementById('idMoreMenu');
  if (!trigger || !menu) return;

  const supportsPopover = typeof menu.showPopover === 'function' && menu.hasAttribute('popover');

  // Browsers without CSS anchor positioning get a measured position instead.
  const place = () => {
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('anchor-name: --id-anchor')) return;
    const box = trigger.getBoundingClientRect();
    const width = menu.offsetWidth || 240;
    const left = Math.max(12, Math.min(box.left, window.innerWidth - width - 12));
    menu.style.insetBlockStart = `${Math.round(box.bottom + 10)}px`;
    menu.style.insetInlineStart = `${Math.round(left)}px`;
  };

  const syncExpanded = () => {
    const open = supportsPopover ? menu.matches(':popover-open') : menu.dataset.open === 'true';
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  if (supportsPopover) {
    menu.addEventListener('toggle', (event) => {
      if (event.newState === 'open') place();
      syncExpanded();
    });
  } else {
    menu.hidden = true;

    const setOpen = (open) => {
      menu.hidden = !open;
      menu.dataset.open = open ? 'true' : 'false';
      if (open) place();
      syncExpanded();
    };

    trigger.addEventListener('click', () => setOpen(menu.hidden));
    document.addEventListener('click', (event) => {
      if (menu.hidden) return;
      if (menu.contains(event.target) || trigger.contains(event.target)) return;
      setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || menu.hidden) return;
      setOpen(false);
      trigger.focus();
    });
  }

  menu.addEventListener('click', (event) => {
    if (!event.target.closest('.id-popover__item')) return;
    if (supportsPopover && menu.matches(':popover-open')) menu.hidePopover();
    else menu.dataset.open = 'false';
  });

  window.addEventListener('resize', () => {
    const open = supportsPopover ? menu.matches(':popover-open') : menu.dataset.open === 'true';
    if (open) place();
  }, { passive: true });

  syncExpanded();
}

function setupStickyHeader() {
  if (!nav) return;

  const sync = () => {
    nav.dataset.idScrolled = window.scrollY > 8 ? 'true' : 'false';
  };

  sync();
  window.addEventListener('scroll', sync, { passive: true });
}

function setupReveal() {
  const items = Array.from(document.querySelectorAll('.featureTile, .tutorCard, .id-card'));
  items.forEach((item, index) => {
    item.classList.add('id-reveal');
    if (!item.style.getPropertyValue('--id-delay')) {
      item.style.setProperty('--id-delay', String(index % 4));
    }
  });

  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || typeof IntersectionObserver !== 'function') {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  items.forEach((item) => observer.observe(item));
}

function setupSlideshowControl() {
  const control = document.getElementById('testPause');
  if (!control) return;

  const sync = () => {
    const label = control.textContent.trim().toLowerCase();
    control.dataset.state = label.startsWith('play') ? 'paused' : 'running';
  };

  sync();
  new MutationObserver(sync).observe(control, { childList: true, characterData: true, subtree: true });
}

function setupFooterFaq() {
  if (typeof window.openFooterInfo !== 'function') return;
  const openFooterInfo = window.openFooterInfo;
  window.openFooterInfo = (kind, ...args) => {
    if (kind === 'faq') {
      window.location.assign('/faq.html');
      return;
    }
    return openFooterInfo(kind, ...args);
  };
}

function init() {
  normalizeSiteNavigation();
  setupHomepageArtwork();
  updateCurrentNavigation();
  window.addEventListener('hashchange', updateCurrentNavigation);
  window.addEventListener('popstate', updateCurrentNavigation);
  if (nav) nav.dataset.idReady = 'true';
  setupDropdown();
  setupNavigationPopover();
  setupActionPopover();
  setupStickyHeader();
  setupReveal();
  setupSlideshowControl();
  setupFooterFaq();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
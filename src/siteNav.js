/**
 * Ìdíléwa site chrome: navigation dropdown, contextual "More" popover,
 * slide-over sheet and scroll reveal.
 *
 * Vanilla ES module - the app is plain HTML/CSS/JS (no React), so the motion
 * layer lives in CSS (see design-system.css) and this file only toggles state.
 * The sheet is a native <dialog> opened with showModal(), so the browser owns
 * the focus trap, Escape handling and the inert background; the script keeps
 * the aria state and body scroll lock in sync.
 */

const nav = document.querySelector('[data-id-nav]');

const SHEET_DESTINATIONS = [
  ['Learn', [
    ['/', 'Home'],
    ['/?view=academy', 'Language Academy'],
    ['/development-center.html', 'Development Center'],
    ['/kids.html', 'Kids Arcade'],
  ]],
  ['Explore', [
    ['/?view=heritageLab', 'Heritage Library'],
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

function renderSheetLinks(drawer) {
  const region = drawer.querySelector('.id-drawer__links');
  if (!region) return;

  region.replaceChildren(...SHEET_DESTINATIONS.map(([label, links]) => {
    const group = document.createElement('div');
    group.className = 'id-sheet__group';

    const heading = document.createElement('p');
    heading.className = 'id-sheet__label';
    heading.textContent = label;
    group.append(heading);

    links.forEach(([href, text]) => {
      const link = document.createElement('a');
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
    if (event.target.closest('button')) setOpen(false);
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

function setupSheet() {
  const drawer = document.getElementById('idDrawer');
  const openButton = document.querySelector('[data-id-menu-open]');
  if (!drawer || !openButton) return;

  renderSheetLinks(drawer);

  if (!openButton.querySelector('.id-menu-btn__label')) {
    const label = document.createElement('span');
    label.className = 'id-menu-btn__label';
    label.textContent = 'Menu';
    openButton.append(label);
  }

  const isDialog = drawer.tagName === 'DIALOG' && typeof drawer.showModal === 'function';
  const closeButton = drawer.querySelector('[data-id-menu-close]');
  const backdrop = document.querySelector('[data-id-backdrop]');

  const syncOpen = () => {
    openButton.setAttribute('aria-expanded', 'true');
    drawer.dataset.open = 'true';
    document.body.classList.add('id-drawer-open');
  };

  const syncClosed = () => {
    openButton.setAttribute('aria-expanded', 'false');
    drawer.dataset.open = 'false';
    document.body.classList.remove('id-drawer-open');
  };

  const open = () => {
    if (isDialog) {
      if (!drawer.open) drawer.showModal();
      syncOpen();
      return;
    }
    drawer.hidden = false;
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.dataset.open = 'true';
    }
    syncOpen();
  };

  const close = () => {
    if (isDialog) {
      if (drawer.open) drawer.close();
      syncClosed();
      return;
    }
    drawer.hidden = true;
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.dataset.open = 'false';
    }
    syncClosed();
  };

  if (!isDialog) {
    drawer.hidden = true;
    if (backdrop) backdrop.hidden = true;
  }
  syncClosed();

  openButton.addEventListener('click', open);
  if (closeButton) closeButton.addEventListener('click', close);

  if (isDialog) {
    // Escape and the close button both end in the native close event.
    drawer.addEventListener('close', syncClosed);

    // The backdrop is part of the dialog element, so compare against its box.
    drawer.addEventListener('click', (event) => {
      const box = drawer.getBoundingClientRect();
      const outside = event.clientX < box.left || event.clientX > box.right
        || event.clientY < box.top || event.clientY > box.bottom;
      if (outside) close();
    });
  } else {
    if (backdrop) backdrop.addEventListener('click', close);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && drawer.dataset.open === 'true') close();
    });
  }

  drawer.addEventListener('click', (event) => {
    if (event.target.closest('.id-drawer__links a, .id-drawer__foot a')) close();
  });
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
  if (nav) nav.dataset.idReady = 'true';
  setupDropdown();
  setupSheet();
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
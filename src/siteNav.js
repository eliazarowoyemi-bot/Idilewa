/**
 * Ìdíléwa site chrome: navigation dropdown, slide-over drawer and scroll reveal.
 * Vanilla ES module - the app is plain HTML/CSS/JS (no React), so the motion
 * layer lives in CSS (see design-system.css) and this file only toggles state.
 */

const nav = document.querySelector('[data-id-nav]');

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

function setupDrawer() {
  const drawer = document.getElementById('idDrawer');
  const backdrop = document.querySelector('[data-id-backdrop]');
  const openButton = document.querySelector('[data-id-menu-open]');
  const closeButton = drawer ? drawer.querySelector('[data-id-menu-close]') : null;
  if (!drawer || !backdrop || !openButton) return;

  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  const setOpen = (open) => {
    drawer.dataset.open = open ? 'true' : 'false';
    backdrop.dataset.open = open ? 'true' : 'false';
    backdrop.hidden = !open;
    openButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('id-drawer-open', open);

    if (open) {
      lastFocused = document.activeElement;
      drawer.hidden = false;
      window.requestAnimationFrame(() => {
        const first = drawer.querySelector(focusableSelector);
        if (first) first.focus();
      });
    } else {
      window.setTimeout(() => {
        if (drawer.dataset.open !== 'true') drawer.hidden = true;
      }, 520);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }
  };

  drawer.hidden = true;
  backdrop.hidden = true;
  setOpen(false);

  openButton.addEventListener('click', () => setOpen(true));
  if (closeButton) closeButton.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));

  drawer.addEventListener('click', (event) => {
    if (event.target.closest('.id-drawer__links button, .id-drawer__foot button, .id-drawer__foot a')) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (drawer.dataset.open !== 'true') return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key !== 'Tab') return;

    const items = Array.from(drawer.querySelectorAll(focusableSelector))
      .filter((element) => element.offsetParent !== null);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function setupReveal() {
  const items = Array.from(document.querySelectorAll('.featureTile, .tutorCard'));
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

function init() {
  if (nav) nav.dataset.idReady = 'true';
  setupDropdown();
  setupDrawer();
  setupReveal();
  setupSlideshowControl();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

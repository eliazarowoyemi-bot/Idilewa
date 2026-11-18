import '../styles/site-footer.css';
import {
  createSiteBottomNavigationMarkup,
  createSiteBrandMarkup,
  createSiteFooterMarkup,
} from './siteFooterMarkup.js';

const footerSelectors = [
  'footer.site-footer',
  '#about-footer',
  'footer.faq-footer',
  'footer.academy-footer',
  'footer.tutor-public-footer',
  'footer.family-public-footer',
  'body > footer',
  'footer:not([class])',
];

function replaceHeaderBranding() {
  const brands = document.querySelectorAll(
    'header .id-nav__brand, header .faq-brand, header .brand, header .logo',
  );

  brands.forEach((brand) => {
    const image = brand.querySelector('img');
    const isIdilewaBrand = /Ìdíléwa|Idilewa/i.test(brand.textContent)
      || /Ìdíléwa|Idilewa/i.test(brand.getAttribute('aria-label') || '')
      || /idilewa/i.test(image?.getAttribute('alt') || '')
      || /idilewa/i.test(image?.getAttribute('src') || '');
    if (!isIdilewaBrand || brand.querySelector('.idilewa-brand-lockup')) return;

    const template = document.createElement('template');
    template.innerHTML = createSiteBrandMarkup();
    brand.replaceChildren(template.content.cloneNode(true));
    brand.classList.add('idilewa-brand-lockup-host');
  });
}

function mountFooter() {
  const existingFooter = footerSelectors
    .map((selector) => document.querySelector(selector))
    .find(Boolean);
  const template = document.createElement('template');
  template.innerHTML = createSiteFooterMarkup();
  const footer = template.content.firstElementChild;

  if (!footer) throw new Error('The shared Ìdíléwa footer could not be created.');

  const previousYear = existingFooter?.querySelector('#year, #faqYear, #footerYear');
  const year = footer.querySelector('[data-footer-year]');
  if (previousYear && year) {
    previousYear.textContent = String(new Date().getFullYear());
    year.replaceWith(previousYear);
  } else if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const oldFooters = document.querySelectorAll(
    'footer.site-footer, #about-footer, footer.faq-footer, footer.academy-footer, footer.tutor-public-footer, footer.family-public-footer, body > footer, footer:not([class])',
  );
  oldFooters.forEach((oldFooter) => {
    if (oldFooter !== existingFooter) oldFooter.remove();
  });

  if (existingFooter) {
    existingFooter.replaceWith(footer);
  } else {
    const app = document.querySelector('#app');
    const main = document.querySelector('main');
    if (app) app.insertAdjacentElement('afterend', footer);
    else if (main) main.insertAdjacentElement('afterend', footer);
    else document.body.append(footer);
  }

  footer.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const infoLink = event.target.closest('a[data-footer-info]');
    if (infoLink && typeof window.openFooterInfo === 'function') {
      event.preventDefault();
      window.openFooterInfo(infoLink.dataset.footerInfo);
      return;
    }

    const viewLink = event.target.closest('a[data-footer-view]');
    if (viewLink && typeof window.go === 'function') {
      event.preventDefault();
      window.go(viewLink.dataset.footerView);
      return;
    }

    if (event.target.closest('button[data-footer-social]')) {
      window.alert('The official social profile link has not been configured yet.');
    }
  });
}

function currentBottomNavigationKey() {
  const { pathname, search, hash } = window.location;
  const view = new URLSearchParams(search).get('view');

  if (['parents.html', 'family-tasks.html', 'connect_students.html', 'connect_teachers.html', 'educator-portal.html'].includes(pathname.slice(1))
    || hash.startsWith('#/parent')) return 'family';
  if (['profile.html', 'milestone-achievement.html'].includes(pathname.slice(1)) || view === 'progress') return 'progress';
  if (['oral.html', 'oral_genre.html', 'oriki.html', 'owe.html', 'owe_add.html', 'owe_detail.html', 'owe_story.html', 'owe_reflection.html', 'keepers.html'].includes(pathname.slice(1))
    || view === 'heritageLab') return 'explore';
  if (['voice_lessons.html', 'voices.html', 'trainer.html', 'languages.html', 'course.html', 'lesson.html'].includes(pathname.slice(1))
    || view === 'academy' || view === 'learning' || (pathname === '/' && (!view || view === 'home'))) return 'learn';
  return 'explore';
}

function mountBottomNavigation() {
  if (document.querySelector('#mobile-nav, [data-idilewa-mobile-tabs]')) return;

  const template = document.createElement('template');
  template.innerHTML = createSiteBottomNavigationMarkup(currentBottomNavigationKey());
  const navigation = template.content.firstElementChild;
  if (!navigation) throw new Error('The Ìdíléwa mobile navigation could not be created.');

  document.body.append(navigation);
  document.body.classList.add('has-idilewa-mobile-tabs');
}

function init() {
  replaceHeaderBranding();
  mountFooter();
  mountBottomNavigation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

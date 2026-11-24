const footerLinks = [
  { key: 'home', label: 'Home', href: '/', route: 'index', view: 'home' },
  { key: 'about', label: 'About', href: '/about.html', route: 'about' },
  { key: 'faq', label: 'FAQ', href: '/faq.html', route: 'faq' },
  { key: 'pricing', label: 'Pricing', href: '/pricing.html', route: 'pricing', info: 'pricing' },
  { key: 'lessons', label: 'Lessons', href: '/?view=academy', route: 'voice_lessons', view: 'academy' },
  { key: 'code', label: 'Code', href: '/development-center.html' },
  { key: 'heritage', label: 'Heritage', href: '/heritage-library' },
  { key: 'privacy', label: 'Privacy', href: '/parents.html#/privacy', route: 'privacy' },
];

export function createSiteBrandMarkup() {
  return `<span class="idilewa-brand-lockup">
    <img src="/assets/idilewa-mark.png" alt="" width="34" height="34">
    <span class="idilewa-brand-copy"><strong>Ìdíléwa</strong><small>Our Language. Our Future.</small></span>
  </span>`;
}

const bottomNavigationItems = [
  {
    key: 'learn',
    label: 'Learn',
    href: '/voice_lessons.html',
    icon: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6"/>',
  },
  {
    key: 'explore',
    label: 'Explore',
    href: '/heritage-library',
    icon: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
  },
  {
    key: 'progress',
    label: 'Progress',
    href: '/profile.html',
    icon: '<path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/>',
  },
  {
    key: 'family',
    label: 'Family',
    href: '/parents.html#/parent-login',
    icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
];

export function createSiteBottomNavigationMarkup(activeKey = '') {
  const links = bottomNavigationItems.map(({ key, label, href, icon }) => {
    const active = key === activeKey;
    return `<a class="idilewa-mobile-tab${active ? ' is-active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
      <span>${label}</span>
    </a>`;
  }).join('');

  return `<nav aria-label="Primary navigation" class="idilewa-mobile-tabs" data-idilewa-mobile-tabs>${links}</nav>`;
}

const socialIcons = `
  <button aria-label="YouTube" class="idSocialIcon" data-footer-social type="button">
    <svg aria-hidden="true" viewBox="0 0 24 24"><rect fill="currentColor" height="14" rx="4" width="20" x="2" y="5"></rect><path d="M10 8.5v7l6-3.5z" fill="white"></path></svg>
  </button>
  <button aria-label="Facebook" class="idSocialIcon" data-footer-social type="button">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14.2 21v-8h2.7l.4-3.2h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3-.1-1.3-.2-2.5-.2-2.6 0-4.3 1.6-4.3 4.5v2.1H8V13h2.7v8z" fill="currentColor"></path></svg>
  </button>
  <button aria-label="TikTok" class="idSocialIcon" data-footer-social type="button">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 2h3c.2 2.3 1.4 3.8 4 4.2v3.2c-1.7 0-3.1-.5-4-1.4v6.5c0 4.4-2.8 7.3-6.8 7.3a6.7 6.7 0 0 1-6.7-6.7c0-3.8 3-6.8 6.8-6.8.5 0 1 .1 1.5.2v3.5a3.4 3.4 0 0 0-1.5-.4 3.4 3.4 0 1 0 3.7 3.4z" fill="currentColor"></path></svg>
  </button>
  <button aria-label="Twitter / X" class="idSocialIcon" data-footer-social type="button">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-5-7.6L5.3 22H2.1l7.3-8.5L1.7 2h6.5l4.5 7zM17.8 20h1.7L7.2 3.9H5.4z" fill="currentColor"></path></svg>
  </button>
  <button aria-label="Instagram" class="idSocialIcon" data-footer-social type="button">
    <svg aria-hidden="true" viewBox="0 0 24 24"><rect fill="none" height="18" rx="5" stroke="currentColor" stroke-width="2" width="18" x="3" y="3"></rect><circle cx="12" cy="12" fill="none" r="4" stroke="currentColor" stroke-width="2"></circle><circle cx="17.5" cy="6.5" fill="currentColor" r="1.2"></circle></svg>
  </button>
  <a aria-label="Email" class="idSocialIcon" href="mailto:info@idilewa.com" title="Email">
    <svg aria-hidden="true" viewBox="0 0 24 24"><rect fill="none" height="14" rx="2" stroke="currentColor" stroke-width="2" width="20" x="2" y="5"></rect><path d="m3 7 9 7 9-7" fill="none" stroke="currentColor" stroke-width="2"></path></svg>
  </a>`;

function defaultLink(item) {
  const attributes = [
    `href="${item.href}"`,
    `class="idFootLink"`,
    item.view ? `data-footer-view="${item.view}"` : '',
    item.info ? `data-footer-info="${item.info}"` : '',
  ].filter(Boolean).join(' ');
  return `<a ${attributes}>${item.label}</a>`;
}

export function createSiteFooterMarkup(renderLink = defaultLink) {
  return `<footer class="idFooter idilewa-site-footer" id="about-footer">
    <div class="idFooterInner">
      <section class="idFootAbout">
        <a class="idFootBrand" href="/" aria-label="Ìdíléwa home">
          ${createSiteBrandMarkup()}
        </a>
        <h2>About Us</h2>
        <p>Ìdíléwa is a tech-driven platform that adapts modern technology to language lessons.</p>
        <div class="idFootValues">
          <div><span class="valueIcon" aria-hidden="true">⌘</span><span>Tech-Driven<br>Learning</span></div>
          <div><span class="valueIcon" aria-hidden="true">♧</span><span>Accessible<br>for Everyone</span></div>
          <div><span class="valueIcon" aria-hidden="true">❀</span><span>Preserve<br>Our Heritage</span></div>
        </div>
      </section>
      <section class="idFootQuick">
        <h2>Quick Links</h2>
        <nav aria-label="Footer quick links">${footerLinks.map((item) => renderLink(item, defaultLink)).join('')}</nav>
      </section>
      <section class="idFootConnect">
        <h2>Get Connected</h2>
        <div aria-label="Social platforms" class="idSocialRow">${socialIcons}</div>
        <p class="socialNote">Social profile links will be added when verified.</p>
      </section>
    </div>
    <div class="idFootBottom">
      <span>© <span data-footer-year></span> Ìdíléwa · Èdè wa, àṣà wa, ìdílé wa.</span>
      <a class="idFootStart" href="/?view=academy" data-footer-view="academy">Start Learning Now <span aria-hidden="true">→</span></a>
    </div>
  </footer>`;
}

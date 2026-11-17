import { basename, resolve } from 'path';

const routeViews = {
  'ai-conversation': 'aiChat',
  course: 'learning',
  languages: 'academy',
  lesson: 'learning',
  oral: 'heritageLab',
  oral_genre: 'heritageLab',
  oriki: 'heritageLab',
  owe: 'heritageLab',
  owe_add: 'heritageLab',
  owe_detail: 'heritageLab',
  owe_story: 'heritageLab',
  owe_reflection: 'heritageLab',
  profile: 'progress',
  trainer: 'learning',
  voices: 'learning',
  voice_lessons: 'learning',
};

const validViews = new Set([
  'academy',
  'aiChat',
  'codeLab',
  'heritageLab',
  'home',
  'learning',
  'progress',
  'studio',
]);

const nativeAppPages = new Set([
  'ai-conversation',
  'auth-callback',
  'about',
  'consent',
  'creative-studio',
  'educator-portal',
  'faq',
  'family-tasks',
  'login',
  'parents',
  'kids',
  'tutor',
  'trainer',
  'voice_lessons',
  'voices',
]);

const footerYearAssignment = 'document.getElementById("footerYear").textContent=new Date().getFullYear();';
const siteFooterBootstrap = '<script type="module" src="/src/siteFooter.js"></script>';
const guardedBilingualRoot = "const root=document.querySelector('.bilingualGame'), sel=root.querySelector(";
const safeBilingualRoot = "const root=document.querySelector('.bilingualGame');if(!root)return;const sel=root.querySelector(";
const escapedBilingualRoot = 'const root=document.querySelector(&#x27;.bilingualGame&#x27;), sel=root.querySelector(';
const safeEscapedBilingualRoot = 'const root=document.querySelector(&#x27;.bilingualGame&#x27;);if(!root)return;const sel=root.querySelector(';
const bilingualRootGuards = [
  [guardedBilingualRoot, safeBilingualRoot],
  [escapedBilingualRoot, safeEscapedBilingualRoot],
];
const nativeAppNavigation = `<script>
(() => {
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[href="#/index"], a[href="#/voice_lessons"]');
    if (!link) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(link.getAttribute('href') === '#/index' ? '/' : '/voice_lessons.html');
  }, true);
})();
</script>`;
const accessibilityStyles = `<style id="idilewa-accessibility-overrides">
.primary,.premium-cta,.idFootBottom button{background:linear-gradient(115deg,#087a2f,#005b2b);color:#fff}
.heroCodeButton{background:linear-gradient(115deg,#006c43,#00583a);color:#fff}
.heroCodeButton:hover,.heroCodeButton:focus-visible{background:#00583a;color:#fff}
.featureTile{color:#334b39!important}
.featureTile .featureSub{color:#3f5145!important}
.artCaption strong,.academy-eyebrow,.academy-vocab small,.idFooter h2,.idFootQuick button:hover,.idFootQuick a:hover{color:#066a32}
.journeyHero .eyebrow{color:#1b6039}
.journeyTitle{background:linear-gradient(100deg,#075e2b,#064a26);color:#fff}
.journeyTitle span{color:#fff;font-size:12px}
.notice,.tutorNote,.tutorLang,.testIntro,.testRole,.testDisclosure{color:#526257}
.tutorChat,.tutorCompose button{background:#006f37;color:#fff}
#discoveryGames button.dgActive,#discoveryGames button.dgPrimary,.game-directory-card button,.fruit-game button.correct{background:#006f37;border-color:#006f37;color:#fff}
.step.active{background:#066f31;color:#fff}
#about-footer p,#about-footer small,#about-footer address,#about-footer .socialNote{color:#4f5f53}
#about-footer .idFootQuick a,#about-footer .idFootQuick button{color:#066a32}
.premium-menu button:hover{background:#e8f3ea;color:#17472a}
.premium-links button:hover,.premium-links button:focus-visible{color:#066a32}
.labBilingual{border-left-width:1px}
.eyebrow,.journeyTitle span,.testRole,.discoverWords small,.premium-brand-copy small,.id-bi-label,.compact-vocabulary .bilingualWords>*{font-size:12px!important}
#discoveryGames .dgPanel{padding:16px}
.premium-auth-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 9px;border:1px solid #d5e7d8;border-radius:999px;background:#fff;color:#0b4d2c;font:inherit;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;cursor:pointer}
.premium-auth-link:hover{background:#eff8f1;color:#075c2e}
.premium-auth-link:focus-visible{outline:3px solid #087a3e;outline-offset:3px}
.premium-menu a{display:block;padding:10px 12px;border-radius:9px;color:#23452e;font-weight:650;text-decoration:none}
.premium-menu a:hover,.premium-menu a:focus-visible{background:#e8f3ea;color:#17472a}
#progressStatus{min-height:1.5em;margin:10px 0;color:#425c49;font-size:14px}
@media(max-width:980px){.premium-mobile-menu nav .premium-auth-link{width:100%;margin-top:5px}}
@media(max-width:420px){.premium-brand-copy small{display:none}}
</style>`;
const codeLabNavigationStyles = `<style id="idilewa-code-lab-navigation">
#codeLab .labTop{flex-wrap:wrap}
#codeLab .labTop h1{flex:1 1 100%}
#codeLab .labTop a.secondary{text-decoration:none;display:inline-flex;align-items:center;min-height:44px}
</style>`;
const nativeRouteNavigationStyles = `<style id="idilewa-native-route-navigation">
.idilewa-route-nav{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;padding:12px 16px;background:#f4faf5;border-bottom:1px solid #dcebe0}
.idilewa-route-nav a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 12px;border:1px solid #d5e7d8;border-radius:999px;background:#fff;color:#0b4d2c;font-size:14px;font-weight:700;text-decoration:none}
.idilewa-route-nav a:hover{background:#eff8f1;color:#075c2e}
.idilewa-route-nav a:focus-visible{outline:3px solid #087a3e;outline-offset:3px}
@media(max-width:560px){.idilewa-route-nav a{flex:1 1 40%}}
</style>`;
const aboutHeaderNavigationStyles = `<style id="idilewa-about-header-navigation">
#nav{display:none!important}
#menu{display:inline-flex!important;align-items:center;justify-content:center;gap:8px;min-width:88px;min-height:44px}
#menu::before{content:"☰";font-size:18px;line-height:1}
</style>`;

function insertAfterClosingElement(html, tagName, content, message) {
  const closingTag = `</${tagName}>`;
  const index = html.toLowerCase().indexOf(closingTag);
  if (index === -1) throw new Error(message);
  const insertionPoint = index + closingTag.length;
  return html.slice(0, insertionPoint).concat(content, html.slice(insertionPoint));
}

function appendRouteNavigation(html, route) {
  const links = route === 'kids'
    ? [
      ['/', 'Academy'],
      ['/creative-studio.html', 'Creative Studio'],
      ['/about.html', 'About'],
      ['/tutor.html', 'Tutorship'],
      ['/parents.html#/parent-signup', 'Family account'],
    ]
    : route === 'tutor'
    ? [
      ['/', 'Academy'],
      ['/about.html', 'About'],
      ['/kids.html', 'Kids Arcade'],
      ['/parents.html#/parent-login', 'Parent sign in'],
      ['/parents.html#/parent-signup', 'Family account'],
    ]
    : null;
  if (!links) return html;
  const navigation = `<nav class="idilewa-route-nav" aria-label="More Ìdíléwa pages">${links
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .join('')}</nav>`;
  return insertAfterClosingElement(
    html,
    'header',
    navigation,
    `The ${route} page is missing its header.`,
  );
}

function transformKidsArcadeHtml(html) {
  const gamesStart = html.indexOf('const GAMES=');
  const frameStart = html.indexOf("const frame=document.getElementById('gameFrame')", gamesStart);
  const gamesEnd = html.lastIndexOf('};', frameStart);
  if (gamesStart === -1 || frameStart === -1 || gamesEnd < gamesStart) {
    throw new Error('Kids Arcade is missing its embedded game launcher.');
  }

  let transformed = html.slice(0, gamesStart)
    .concat(
      'const GAMES={racer:"/games/turbo-racers.html",ludo:"/games/balloon-ludo.html"};\n',
      html.slice(frameStart),
    );
  const legacyLauncher = /if\(which==='home'\)frame\.removeAttribute\('srcdoc'\);\s*else frame\.srcdoc=GAMES\[which\];/;
  if (!legacyLauncher.test(transformed)) {
    throw new Error('Kids Arcade is missing the expected game-selection behavior.');
  }
  transformed = transformed.replace(
    legacyLauncher,
    "if(which==='home'){frame.removeAttribute('src');frame.removeAttribute('srcdoc');}\n else frame.src=GAMES[which];",
  );

  if (!transformed.includes('id="progressStatus"')) {
    const message = /<div id="message">[\s\S]*?<\/div>/i;
    if (!message.test(transformed)) {
      throw new Error('Kids Arcade is missing its game status message.');
    }
    transformed = transformed.replace(
      message,
      '$&<p id="progressStatus" role="status" aria-live="polite"></p>',
    );
  }
  return transformed;
}

function transformAboutHtml(html) {
  const destinations = [
    ['https://idilewa.com/academy', '/?view=academy'],
    ['https://idilewa.com/code', '/?view=codeLab'],
    ['https://idilewa.com/heritage', '/?view=heritageLab'],
    ['https://idilewa.com/login', '/parents.html#/parent-login'],
    ['https://idilewa.com/signup', '/parents.html#/parent-signup'],
    ['https://idilewa.com', '/'],
  ];
  let transformed = html;
  for (const [source, destination] of destinations) {
    transformed = transformed.replaceAll(`href="${source}"`, `href="${destination}"`);
  }
  return transformed;
}

function guardBilingualGame(html) {
  for (const [unguarded, guarded] of bilingualRootGuards) {
    if (html.includes(guarded)) return html;
    if (html.includes(unguarded)) return html.replaceAll(unguarded, guarded);
  }
  throw new Error('Standalone app is missing the expected embedded bilingual-game script.');
}

function renderRouteRedirect(routeName) {
  const view = routeViews[routeName] ?? 'home';
  const target = `/?view=${encodeURIComponent(view)}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0;url=${target}">
    <title>Ìdíléwa Language Academy</title>
    <script>location.replace(${JSON.stringify(target)});</script>
  </head>
  <body><p><a href="${target}">Continue to Ìdíléwa Language Academy</a></p></body>
</html>`;
}

function transformNativeAppHtml(html, route) {
  const tutorAccessibilityStyles = route === 'tutor'
    ? `<style id="idilewa-tutor-accessibility-overrides">
.primary,#messageTutor,#nextStep,.top nav button.active{background:#006b39!important;color:#fff!important}
.eyebrow,h1 span{color:#006b39!important}
.muted{color:#526257!important}
</style>`
    : '';
  const tutorPortalNavigation = route === 'tutor'
    ? `<script>
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  if (!nav) throw new Error('Tutor page is missing its navigation container.');
  if (nav.querySelector('[data-idilewa-educator-portal]')) return;
  const link = document.createElement('a');
  link.href = '/educator-portal.html#/tutor-signup';
  link.className = 'ghost';
  link.dataset.idilewaEducatorPortal = 'true';
  link.textContent = 'Secure Tutor Sign-up';
  nav.append(link);
});
</script>`
    : '';
  const aboutNavigation = route === 'about'
    ? `<script>
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.drawer-nav');
  if (!nav) throw new Error('About page is missing its navigation drawer.');
  const links = [
    ['/kids.html', 'Kids Arcade'],
    ['/creative-studio.html', 'Creative Studio'],
    ['/tutor.html', 'Tutorship'],
  ];
  for (const [href, label] of links) {
    const key = href.slice(1).replaceAll('/', '-');
    if (nav.querySelector('[data-idilewa-route="' + key + '"]')) continue;
    const link = document.createElement('a');
    link.href = href;
    link.dataset.idilewaRoute = key;
    link.textContent = label;
    nav.append(link);
  }
});
</script>`
    : '';
  const routeNavigation = appendRouteNavigation(html, route);
  const closingHeadIndex = routeNavigation.toLowerCase().lastIndexOf('</head>');
  if (closingHeadIndex === -1) {
    throw new Error('Native app page is missing its closing head tag.');
  }
  const styles = ['kids', 'tutor'].includes(route)
    ? nativeRouteNavigationStyles
    : route === 'about'
      ? aboutHeaderNavigationStyles
      : '';
  const withHeadContent = routeNavigation.slice(0, closingHeadIndex)
    .concat(styles, tutorAccessibilityStyles, tutorPortalNavigation, aboutNavigation, nativeAppNavigation, routeNavigation.slice(closingHeadIndex));
  const closingBodyIndex = withHeadContent.toLowerCase().lastIndexOf('</body>');
  if (closingBodyIndex === -1) {
    throw new Error('Native app page is missing its closing body tag.');
  }
  return withHeadContent.slice(0, closingBodyIndex)
    .concat(siteFooterBootstrap, withHeadContent.slice(closingBodyIndex));
}

function transformCreativeStudioHtml(html) {
  const title = '<title>Creative Studio | Ìdíléwa</title>';
  const navigation = `<nav class="studio-site-nav" aria-label="Ìdíléwa navigation">
    <a href="/">Home</a>
    <a href="/?view=codeLab">Games &amp; Code Playground</a>
    <a href="/kids.html">Kids Arcade</a>
    <a href="/about.html">About</a>
    <a href="/tutor.html">Tutorship</a>
  </nav>`;
  const menu = `<button class="studio-menu-toggle" id="studioMenuToggle" type="button" aria-expanded="false" aria-controls="studioNavigationMenu">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path></svg>
    <span>Menu</span>
  </button>
  <div class="studio-menu-panel" id="studioNavigationMenu" role="region" aria-label="Creative Studio and site navigation" hidden>
    <section class="studio-menu-group" aria-labelledby="studioToolsLabel">
      <h2 id="studioToolsLabel">Creative Studio</h2>
      <nav class="tabs" id="tabs" aria-label="Creative Studio tools"></nav>
    </section>
    <section class="studio-menu-group" aria-labelledby="studioPagesLabel">
      <h2 id="studioPagesLabel">Ìdíléwa pages</h2>
      ${navigation}
    </section>
  </div>`;
  const navigationStyles = `<style id="idilewa-creative-studio-navigation">
.top{position:relative;z-index:20}
.studio-menu-toggle{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:44px;padding:9px 14px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--ink);font-weight:700}
.studio-menu-toggle:hover{border-color:var(--g)}
.studio-menu-toggle:focus-visible,.studio-menu-panel :focus-visible{outline:3px solid var(--g);outline-offset:3px}
.studio-menu-toggle svg{width:20px;height:20px;flex:none}
.studio-menu-panel{position:absolute;top:calc(100% + 6px);right:12px;z-index:60;width:min(520px,calc(100vw - 24px));max-height:min(76vh,640px);overflow:auto;padding:20px;border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:0 12px 30px #163a2830}
.studio-menu-panel[hidden]{display:none}
.studio-menu-group+.studio-menu-group{margin-top:20px;padding-top:18px;border-top:1px solid var(--line)}
.studio-menu-group h2{margin:0 0 10px;color:var(--ink);font-size:14px}
.studio-menu-panel .tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;width:100%;min-width:0;flex:none;order:0;overflow:visible;flex-wrap:wrap}
.studio-menu-panel .tabs button{width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--line);text-align:left;white-space:normal}
.studio-menu-panel .studio-site-nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.studio-menu-panel .studio-site-nav a{display:flex;min-height:44px;align-items:center;justify-content:flex-start;padding:8px 11px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--ink);font-weight:650;text-align:left;text-decoration:none}
.studio-menu-panel .studio-site-nav a:hover{border-color:var(--g);text-decoration:underline;text-underline-offset:3px}
.studio-menu-panel .studio-site-nav a:focus-visible{outline:3px solid var(--g);outline-offset:3px}
</style>`;
  const bridge = `<script>
window.idilewaCreativeStudioBridge = {
  importScene(state, importedCamera, importedDialogue) {
    sceneCheckpoint();
    sceneRestore(JSON.stringify(state));
    camera = importedCamera;
    dialogue = importedDialogue;
    sceneRefresh();
    draw3D();
    queueSceneAutosave();
  },
  setMotion(motion) {
    sceneMotion114 = motion.sceneMotion114;
    sceneSpeed114 = motion.sceneSpeed114;
    sceneAmount114 = motion.sceneAmount114;
    studioScenePlaybackControls114();
  }
};
</script>
<script type="module" src="/src/creativeStudioPage.js"></script>`;
  const actionsMarker = '<div class="actions">';
  const tabsMarker = '<nav class="tabs" id="tabs"></nav>';
  const titlePattern = /<title>[^<]*<\/title>/i;
  const bodyMarker = '</body>';

  if (!titlePattern.test(html) || !html.includes(actionsMarker) || !html.includes(tabsMarker) || !html.toLowerCase().includes(bodyMarker)) {
    throw new Error('Creative Studio is missing a required document landmark.');
  }

  const titled = html.replace(titlePattern, title);
  const withTabsRemoved = titled.replace(tabsMarker, '');
  const withNavigation = withTabsRemoved.replace(actionsMarker, `${menu}${actionsMarker}`);
  const closingHeadIndex = withNavigation.toLowerCase().lastIndexOf('</head>');
  const closingBodyIndex = withNavigation.toLowerCase().lastIndexOf(bodyMarker);
  if (closingHeadIndex === -1 || closingBodyIndex === -1) {
    throw new Error('Creative Studio is missing its document boundaries.');
  }

  const styled = withNavigation.slice(0, closingHeadIndex)
    .concat(navigationStyles, withNavigation.slice(closingHeadIndex));
  const adjustedBodyIndex = styled.toLowerCase().lastIndexOf(bodyMarker);
  return styled.slice(0, adjustedBodyIndex)
    .concat(bridge, styled.slice(adjustedBodyIndex));
}

function transformAppHtml(html) {
  if (!html.includes(footerYearAssignment)) {
    throw new Error('Standalone app is missing the expected optional footer-year script.');
  }
  if (!html.includes('<h3>Source</h3>')) {
    throw new Error('Standalone app is missing the expected translation source heading.');
  }
  const codeLabHeader = `<div class="labTop"><h1>💻 Code Playground</h1><button class="secondary" onclick="go('home')">← Home</button></div>`;
  const codeLabHeaderWithStudio = `<div class="labTop"><h1>💻 Code Playground</h1><a class="secondary" href="/creative-studio.html">🎨 Creative Studio</a><button class="secondary" onclick="go('home')">← Home</button></div>`;
  if (!html.includes(codeLabHeader)) {
    throw new Error('Standalone app is missing the expected Code Playground navigation.');
  }

  const viewBootstrap = `<script>
(() => {
    const search = new URLSearchParams(location.search);
    const view = search.get('view');
  const nativeGo = window.go;
  if (typeof nativeGo === 'function') {
    window.go = (id, ...args) => {
      if (id === 'aiChat') {
        location.assign('/ai-conversation.html');
        return;
      }
      return nativeGo(id, ...args);
    };
  }
  const voiceTile = document.querySelector('.featureTile.voice');
  if (voiceTile) voiceTile.onclick = () => location.assign('/voice_lessons.html');
  const addTutorPortalLink = (navigation) => {
    if (!navigation || navigation.querySelector('[data-idilewa-tutor-link]')) return;
    const link = document.createElement('a');
    link.href = '/tutor.html';
    link.className = 'premium-auth-link';
    link.dataset.idilewaTutorLink = 'true';
    link.textContent = 'Tutorship';
    navigation.append(link);
  };
  const addAccountLink = (navigation) => {
    if (!navigation || navigation.querySelector('[data-idilewa-account-link]')) return;
    const link = document.createElement('a');
    link.href = '/parents.html#/parent-login';
    link.className = 'premium-auth-link';
    link.dataset.idilewaAccountLink = 'true';
    link.textContent = 'Sign in';
    navigation.append(link);
  };
  const addCreateAccountLink = (navigation) => {
    if (!navigation || navigation.querySelector('[data-idilewa-create-account-link]')) return;
    const link = document.createElement('a');
    link.href = '/parents.html#/parent-signup';
    link.className = 'premium-auth-link';
    link.dataset.idilewaCreateAccountLink = 'true';
    link.textContent = 'Create account';
    navigation.append(link);
  };
  const addExploreMenu = (navigation) => {
    if (!navigation || navigation.querySelector('[data-idilewa-explore-menu]')) return;
    const menu = document.createElement('div');
    menu.className = 'premium-dropdown';
    menu.dataset.idilewaExploreMenu = 'true';
    menu.innerHTML = '<button type="button" aria-expanded="false">Explore</button><div class="premium-menu"><a href="/kids.html">Kids Arcade</a><a href="/creative-studio.html">Creative Studio</a><a href="/about.html">About</a></div>';
    const button = menu.querySelector('button');
    const panel = menu.querySelector('.premium-menu');
    button.addEventListener('click', () => {
      const isOpen = panel.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
    });
    navigation.append(menu);
  };
  addTutorPortalLink(document.querySelector('.premium-links'));
  addTutorPortalLink(document.querySelector('.premium-mobile-menu nav'));
  addExploreMenu(document.querySelector('.premium-links'));
  const mobileNavigation = document.querySelector('.premium-mobile-menu nav');
  for (const [key, href, label] of [
    ['kids', '/kids.html', 'Kids Arcade'],
    ['studio', '/creative-studio.html', 'Creative Studio'],
    ['about', '/about.html', 'About'],
  ]) {
    if (!mobileNavigation || mobileNavigation.querySelector('[data-idilewa-route-link="' + key + '"]')) continue;
    const link = document.createElement('a');
    link.href = href;
    link.className = 'premium-auth-link';
    link.dataset.idilewaRouteLink = key;
    link.textContent = label;
    mobileNavigation.append(link);
  }
  addAccountLink(document.querySelector('.premium-links'));
  addAccountLink(mobileNavigation);
  addCreateAccountLink(document.querySelector('.premium-links'));
  addCreateAccountLink(mobileNavigation);
  if (!view) return;
  if (!${JSON.stringify([...validViews])}.includes(view)) return;
  if (typeof window.go !== 'function') throw new Error('Standalone app view navigation is unavailable.');
  window.go(view);
  history.replaceState(null, '', location.pathname);
})();
</script>`;
  const transformed = html
    .replace(codeLabHeader, codeLabHeaderWithStudio)
    .replace(footerYearAssignment, '(()=>{const yearElement=document.getElementById("footerYear");if(yearElement)yearElement.textContent=new Date().getFullYear()})();')
    .replace('<h3>Source</h3>', '<h2>Source</h2>');
  const guarded = guardBilingualGame(transformed);
  const closingHeadIndex = guarded.toLowerCase().lastIndexOf('</head>');
  if (closingHeadIndex === -1) {
    throw new Error('Standalone app is missing its closing head tag.');
  }
  const styled = guarded.slice(0, closingHeadIndex)
    .concat(accessibilityStyles, codeLabNavigationStyles, guarded.slice(closingHeadIndex));
  const closingBodyIndex = styled.toLowerCase().lastIndexOf('</body>');
  if (closingBodyIndex === -1) {
    throw new Error('Standalone app is missing its closing body tag.');
  }

  return styled.slice(0, closingBodyIndex)
    .concat(viewBootstrap, siteFooterBootstrap, styled.slice(closingBodyIndex));
}

export function createStandaloneAppPlugin(rootDirectory) {
  const indexPath = resolve(rootDirectory, 'index.html');

  return {
    name: 'idilewa-standalone-app',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        if (!context?.filename) return html;
        if (resolve(context.filename) === indexPath) return transformAppHtml(html);
        const route = basename(context.filename).replace(/\.html$/i, '');
        if (!nativeAppPages.has(route)) return renderRouteRedirect(route);
        const routeHtml = route === 'kids'
          ? transformKidsArcadeHtml(html)
          : route === 'about'
          ? transformAboutHtml(html)
          : html;
        const nativeHtml = transformNativeAppHtml(routeHtml, route);
        if (route === 'kids') {
          const closingBodyIndex = nativeHtml.toLowerCase().lastIndexOf('</body>');
          if (closingBodyIndex === -1) throw new Error('Kids Arcade is missing its closing body tag.');
          return nativeHtml.slice(0, closingBodyIndex)
            .concat('<script type="module" src="/src/arcadeProgress.js"></script>', nativeHtml.slice(closingBodyIndex));
        }
        return route === 'creative-studio'
          ? transformCreativeStudioHtml(nativeHtml)
          : nativeHtml;
      },
    },
  };
}

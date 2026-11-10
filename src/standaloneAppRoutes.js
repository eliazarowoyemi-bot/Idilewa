import { basename, resolve } from 'path';

const routeViews = {
  'ai-conversation': 'aiChat',
  'code-studio': 'codeLab',
  course: 'learning',
  kids: 'learning',
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
  'consent',
  'educator-portal',
  'login',
  'parents',
  'tutor',
  'trainer',
  'voice_lessons',
  'voices',
]);

const footerYearAssignment = 'document.getElementById("footerYear").textContent=new Date().getFullYear();';
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
@media(max-width:980px){.premium-mobile-menu nav .premium-auth-link{width:100%;margin-top:5px}}
@media(max-width:420px){.premium-brand-copy small{display:none}}
</style>`;

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
  if (!nav) throw new Error('Tutor prototype is missing its navigation container.');
  if (nav.querySelector('[data-idilewa-educator-portal]')) return;
  const link = document.createElement('a');
  link.href = '/educator-portal.html';
  link.className = 'ghost';
  link.dataset.idilewaEducatorPortal = 'true';
  link.textContent = 'Educator Portal';
  nav.append(link);
});
</script>`
    : '';
  const closingHeadIndex = html.toLowerCase().lastIndexOf('</head>');
  if (closingHeadIndex === -1) {
    throw new Error('Native app page is missing its closing head tag.');
  }
  return html.slice(0, closingHeadIndex)
    .concat(tutorAccessibilityStyles, tutorPortalNavigation, nativeAppNavigation, html.slice(closingHeadIndex));
}

function transformAppHtml(html) {
  if (!html.includes(footerYearAssignment)) {
    throw new Error('Standalone app is missing the expected optional footer-year script.');
  }
  if (!html.includes('<h3>Source</h3>')) {
    throw new Error('Standalone app is missing the expected translation source heading.');
  }

  const viewBootstrap = `<script>
(() => {
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
  const addAccountLink = (navigation) => {
    if (!navigation || navigation.querySelector('[data-idilewa-account-link]')) return;
    const link = document.createElement('a');
    link.href = '/login.html';
    link.className = 'premium-auth-link';
    link.dataset.idilewaAccountLink = 'true';
    link.textContent = 'Sign in';
    navigation.append(link);
  };
  addAccountLink(document.querySelector('.premium-links'));
  addAccountLink(document.querySelector('.premium-mobile-menu nav'));
  const view = new URLSearchParams(location.search).get('view');
  if (!view) return;
  if (!${JSON.stringify([...validViews])}.includes(view)) return;
  if (typeof window.go !== 'function') throw new Error('Standalone app view navigation is unavailable.');
  window.go(view);
  history.replaceState(null, '', location.pathname);
})();
</script>`;
  const transformed = html
    .replace(footerYearAssignment, '(()=>{const yearElement=document.getElementById("footerYear");if(yearElement)yearElement.textContent=new Date().getFullYear()})();')
    .replace('<h3>Source</h3>', '<h2>Source</h2>');
  const guarded = guardBilingualGame(transformed);
  const closingHeadIndex = guarded.toLowerCase().lastIndexOf('</head>');
  if (closingHeadIndex === -1) {
    throw new Error('Standalone app is missing its closing head tag.');
  }
  const styled = guarded.slice(0, closingHeadIndex)
    .concat(accessibilityStyles, guarded.slice(closingHeadIndex));
  const closingBodyIndex = styled.toLowerCase().lastIndexOf('</body>');
  if (closingBodyIndex === -1) {
    throw new Error('Standalone app is missing its closing body tag.');
  }

  return styled.slice(0, closingBodyIndex)
    .concat(viewBootstrap, styled.slice(closingBodyIndex));
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
        return nativeAppPages.has(route) ? transformNativeAppHtml(html, route) : renderRouteRedirect(route);
      },
    },
  };
}

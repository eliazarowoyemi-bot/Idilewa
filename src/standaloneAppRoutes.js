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

const footerYearAssignment = 'document.getElementById("footerYear").textContent=new Date().getFullYear();';
const guardedBilingualRoot = "const root=document.querySelector('.bilingualGame'), sel=root.querySelector(";
const safeBilingualRoot = "const root=document.querySelector('.bilingualGame');if(!root)return;const sel=root.querySelector(";
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
@media(max-width:980px){.premium-mobile-menu{margin-right:0;transform:translateX(-6px)}}
</style>`;

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

function transformAppHtml(html) {
  if (!html.includes(footerYearAssignment)) {
    throw new Error('Standalone app is missing the expected optional footer-year script.');
  }
  if (!html.includes(guardedBilingualRoot)) {
    throw new Error('Standalone app is missing the expected embedded bilingual-game script.');
  }
  if (!html.includes('<h3>Source</h3>')) {
    throw new Error('Standalone app is missing the expected translation source heading.');
  }

  const viewBootstrap = `<script>
(() => {
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
    .replaceAll(guardedBilingualRoot, safeBilingualRoot)
    .replace('<h3>Source</h3>', '<h2>Source</h2>');
  const closingHeadIndex = transformed.toLowerCase().lastIndexOf('</head>');
  if (closingHeadIndex === -1) {
    throw new Error('Standalone app is missing its closing head tag.');
  }
  const styled = transformed.slice(0, closingHeadIndex)
    .concat(accessibilityStyles, transformed.slice(closingHeadIndex));
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
        return renderRouteRedirect(basename(context.filename).replace(/\.html$/i, ''));
      },
    },
  };
}

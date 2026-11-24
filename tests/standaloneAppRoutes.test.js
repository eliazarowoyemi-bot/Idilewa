import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createStandaloneAppPlugin } from '../src/standaloneAppRoutes.js';

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const plugin = createStandaloneAppPlugin(rootDirectory);
const appSource = await readFile(resolve(rootDirectory, 'index.html'), 'utf8');

function transformEntry(filename, html = '') {
  return plugin.transformIndexHtml.handler(html, { filename: resolve(rootDirectory, filename) });
}

function assertSupportAssistant(html) {
  const assistantScripts = html.match(
    /<script\b(?=[^>]*src="\/src\/supportAssistant\.js")[^>]*>/g,
  ) || [];

  assert.equal(assistantScripts.length, 1);
  assert.match(assistantScripts[0], /type="module"/);
  assert.doesNotMatch(html, /agentency\.com|data-widget-token/);
}

test('homepage serves the supplied academy app and guards its optional embedded controls', () => {
  const transformed = transformEntry('index.html', appSource);

  assert.match(transformed, /Our Language\./);
  assert.match(transformed, /function go\(id\)/);
  assert.match(transformed, /Fruit Maths/);
  assert.match(transformed, /Little Scientists/);
  assert.doesNotMatch(transformed, /document\.getElementById\("footerYear"\)\.textContent=/);
  assert.doesNotMatch(transformed, /const root=document\.querySelector\('\.bilingualGame'\), sel=root\.querySelector\(/);
  assert.doesNotMatch(transformed, /const root=document\.querySelector\(&#x27;\.bilingualGame&#x27;\), sel=root\.querySelector\(/);
  assert.match(transformed, /id="idilewa-accessibility-overrides"/);
  assert.match(transformed, /\.premium-auth-link/);
  assert.match(transformed, /<h2>Source<\/h2>/);
  assert.match(transformed, /urlSearchParams|URLSearchParams/);
  assert.match(transformed, /\/ai-conversation\.html/);
  assert.match(transformed, /href="\/creative-studio\.html">🎨 Creative Studio<\/a>/);
  assert.match(transformed, /Tutorship/);
  assert.match(transformed, /link\.href = '\/tutor\.html'/);
  assert.match(transformed, /Sign in/);
  assert.match(transformed, /src="\/src\/homepageArcadeIntegration\.js"/);
  assert.match(transformed, /\/about\.html/);
  assert.match(transformed, /link\.href = '\/parents\.html#\/parent-login'/);
  assert.match(transformed, /link\.href = '\/parents\.html#\/parent-signup'/);
  assert.match(transformed, /<sakuga-button type="button" class="sakuga-hero-primary" onclick="go\('academy'\)">/);
  assert.match(transformed, /<sakuga-button type="button" variant="secondary" class="sakuga-hero-secondary" onclick="go\('codeLab'\)">/);
  assert.match(transformed, /src="\/src\/siteFooter\.js"/);
  assert.match(appSource, /src="\.\/src\/languageLab\.js"/);
  assert.match(transformed, /if \(!window\.IdilewaLanguageLab\) initializeLegacyLearningExperience\(window\.IdilewaLegacyBindings\)/);
  assert.match(transformed, /src\/legacyLearningEngine\.js/);
  assertSupportAssistant(transformed);
});

test('homepage header keeps Home, Voice Lessons, and Code visible with grouped links', () => {
  const transformed = transformEntry('index.html', appSource);
  const header = transformed.match(/<header\b[\s\S]*?<\/header>/)?.[0] || '';

  assert.match(transformed, /<nav aria-label="Main navigation" class="id-nav__links">/);
  assert.match(transformed, /data-id-primary="home" href="\/">Home/);
  assert.match(transformed, /data-id-primary="voiceLessons" href="\/voice_lessons\.html">Voice Lessons/);
  assert.match(transformed, /data-id-primary="code" href="\/development-center\.html">Code/);
  assert.match(transformed, /<a class="id-btn id-btn--primary id-nav__cta" href="\/\?view=academy">/);
  assert.doesNotMatch(header, /<sakuga-button[^>]*class="sakuga-nav-cta"/);
  assert.match(transformed, /id="idHomeMenu"[\s\S]*?href="\/about\.html">About Ìdíléwa/);
  assert.match(transformed, /id="idHomeMenu"[\s\S]*?href="\/faq\.html">FAQ/);
  assert.match(transformed, /id="idHomeMenu"[\s\S]*?href="\/pricing\.html">Pricing/);
  assert.match(transformed, /id="idVoiceLessonsMenu"[\s\S]*?href="\/\?view=academy">Language Academy/);
  assert.match(transformed, /id="idVoiceLessonsMenu"[\s\S]*?href="\/tutor\.html">Live Tutors/);
  assert.match(transformed, /id="idCodeMenu"[\s\S]*?href="\/\?view=codeLab#all-coding-games">All games/);
  assert.match(transformed, /id="idCodeMenu"[\s\S]*?href="\/creative-studio\.html">Creative Studio/);
});

test('homepage drawer shows its menu label and all primary destinations', async () => {
  const navigationSource = await readFile(resolve(rootDirectory, 'src/siteNav.js'), 'utf8');

  assert.match(navigationSource, /label\.textContent = 'Menu'/);
  assert.match(appSource, /class="id-menu-btn"[^>]*popovertarget="idDrawer"/);
  assert.match(appSource, /<nav aria-labelledby="idDrawerTitle" class="id-drawer id-popover"[^>]*id="idDrawer" popover/);
  assert.doesNotMatch(appSource, /<dialog[^>]*id="idDrawer"/);
  assert.match(appSource, /class="id-drawer__foot"><a[^>]*>Sign in<\/a><sakuga-button[^>]*>Get Started<\/sakuga-button><\/div>/);
  for (const destination of [
    "['/', 'Home']",
    "['/?view=academy', 'Language Academy']",
    "['/?view=progress', 'My Progress']",
    "['/development-center.html', 'Development Center']",
    "['/ai-conversation.html', 'AI Conversation']",
    "['/milestone-achievement.html', 'Milestone Achievement']",
    "['/?view=heritageLab', 'Heritage Library']",
    "['/?view=codeLab#all-coding-games', 'All games']",
    "['/creative-studio.html', 'Creative Studio']",
    "['/tutor.html', 'Tutorship']",
    "['/parents.html', 'For Families']",
    "['/family-tasks.html', 'Family Tasks']",
    "['/faq.html', 'FAQ']",
    "['/about.html', 'About Ìdíléwa']",
    "['/pricing.html', 'Pricing']",
  ]) {
    assert.ok(navigationSource.includes(destination), `drawer should include ${destination}`);
  }
  assert.match(navigationSource, /window\.location\.assign\('\/faq\.html'\)/);
});

test('legacy learning and heritage URLs open their matching standalone views', async () => {
  const oral = transformEntry('oral.html', await readFile(resolve(rootDirectory, 'oral.html'), 'utf8'));
  const languages = transformEntry('languages.html');

  assert.match(oral, /data-default-route="oral"/);
  assert.match(oral, /src="\.\/app\.js"/);
  assert.doesNotMatch(oral, /location\.replace\(/);
  assert.ok(languages.includes('location.replace("/?view=academy")'));
  assert.ok(languages.includes('<a href="/?view=academy">'));
});

test('the legacy Kids Arcade route opens the shared Code Playground catalogue', async () => {
  const kids = await readFile(resolve(rootDirectory, 'kids.html'), 'utf8');
  const transformed = transformEntry('kids.html', kids);

  assert.match(transformed, /location\.replace\("\/\?view=codeLab#all-coding-games"\)/);
  assert.match(transformed, /href="\/\?view=codeLab#all-coding-games"/);
});

test('native entry pages retain their app and return home or voice links to canonical pages', async () => {
  for (const filename of [
    'ai-conversation.html',
    'auth-callback.html',
    'about.html',
    'consent.html',
    'educator-portal.html',
    'faq.html',
    'family-tasks.html',
    'heritage-library.html',
    'login.html',
    'parents.html',
    'oral_genre.html',
    'oriki.html',
    'owe.html',
    'owe_add.html',
    'owe_detail.html',
    'owe_story.html',
    'owe_reflection.html',
    'tutor.html',
    'trainer.html',
    'voice_lessons.html',
    'voices.html',
  ]) {
    const source = await readFile(resolve(rootDirectory, filename), 'utf8');
    const transformed = transformEntry(filename, source);
    const closingHead = source.toLowerCase().lastIndexOf('</head>');
    if (!['about.html', 'tutor.html'].includes(filename)) {
      assert.ok(transformed.startsWith(source.slice(0, closingHead)), filename);
      const closingBody = source.toLowerCase().lastIndexOf('</body>');
      assert.ok(transformed.includes(source.slice(closingHead, closingBody)), filename);
      assert.ok(transformed.endsWith(source.slice(closingBody)), filename);
    }
    assert.match(transformed, /event\.stopImmediatePropagation\(\)/, filename);
    assert.match(transformed, /src="\/src\/siteFooter\.js"/, filename);
    assertSupportAssistant(transformed);
    if (filename === 'ai-conversation.html') {
      assert.equal((transformed.match(/src="\/src\/siteFooter\.js"/g) || []).length, 1);
    }
    assert.match(transformed, /location\.assign\(link\.getAttribute\('href'\) === '#\/index' \? '\/' : '\/voice_lessons\.html'\)/, filename);
    if (filename === 'tutor.html') {
      assert.match(transformed, /href = '\/educator-portal\.html#\/tutor-signup'/);
      assert.match(transformed, /link\.textContent = 'Secure Tutor Sign-up'/);
      assert.match(transformed, /id="idilewa-tutor-accessibility-overrides"/);
      assert.match(transformed, /href="\/\?view=codeLab#all-coding-games">All games/);
    }
    if (filename === 'about.html') {
      assert.match(transformed, /href="\/\?view=academy"/);
      assert.match(transformed, /href="\/development-center\.html"/);
      assert.match(transformed, /href="\/\?view=heritageLab"/);
      assert.match(transformed, /<div class="hero-art"><img src="\/assets\/page-about-1\.jpg"/);
      assert.match(transformed, /fetchpriority="high"/);
      assert.match(transformed, /alt="A grandparent and child sharing an African language learning book"/);
      assert.doesNotMatch(transformed, /href="https:\/\/idilewa\.com/);
      assert.match(transformed, /idilewa-about-header-navigation/);
      assert.match(transformed, /<nav id="nav" class="desktop-nav" aria-label="Main navigation"><a href="\/">Home<\/a><a href="\/voice_lessons\.html">Voice Lessons<\/a><a href="\/development-center\.html">Code<\/a><\/nav>/);
      assert.match(transformed, /#nav\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
      assert.match(transformed, /#menu\{display:inline-flex!important/);
      assert.match(transformed, /document\.querySelector\('\.drawer-nav'\)/);
      assert.match(transformed, /data-idilewa-route/);
      assert.match(transformed, /id: 'about-nav-learn'/);
      assert.match(transformed, /id: 'about-nav-explore'/);
      assert.match(transformed, /id: 'about-nav-family'/);
      assert.match(transformed, /About page has a navigation link that is not assigned to a menu group/);
    }
  }
});

test('oral tradition routes open the app renderers instead of redirecting to the homepage preview', async () => {
  for (const route of ['oral', 'oral_genre', 'oriki', 'owe', 'owe_add', 'owe_detail', 'owe_story', 'owe_reflection']) {
    const source = await readFile(resolve(rootDirectory, `${route}.html`), 'utf8');
    const transformed = transformEntry(`${route}.html`, source);

    assert.match(transformed, /data-default-route=/, route);
    assert.match(transformed, /src="\.\/app\.js"/, route);
    assert.doesNotMatch(transformed, /location\.replace\(/, route);
  }
});

test('Creative Studio links back to Home and Code Playground and hardens local project imports', async () => {
  const source = await readFile(resolve(rootDirectory, 'creative-studio.html'), 'utf8');
  const transformed = transformEntry('creative-studio.html', source);

  assert.match(transformed, /<title>Creative Studio \| Ìdíléwa<\/title>/);
  assert.match(transformed, /href="\/">Home<\/a>/);
  assert.match(transformed, /href="\/development-center\.html">Development Center<\/a>/);
  assert.match(transformed, /id="studioMenuToggle" type="button" aria-expanded="false" aria-controls="studioNavigationMenu"/);
  assert.match(transformed, /id="studioNavigationMenu" role="region" aria-label="Creative Studio and site navigation" hidden/);
  assert.match(transformed, /<h2 id="studioToolsLabel">Creative Studio<\/h2>\s*<nav class="tabs" id="tabs" aria-label="Creative Studio tools"><\/nav>/);
  assert.match(transformed, /<h2 id="studioPagesLabel">Ìdíléwa pages<\/h2>[\s\S]*<nav class="studio-site-nav" aria-label="Ìdíléwa navigation">/);
  assert.match(transformed, /href="\/\?view=codeLab#all-coding-games">All games<\/a>/);
  assert.match(transformed, /href="\/about\.html">About<\/a>/);
  assert.match(transformed, /href="\/tutor\.html">Tutorship<\/a>/);
  assert.match(transformed, /src="\/src\/creativeStudioPage\.js"/);
  assert.match(transformed, /src="\/src\/siteFooter\.js"/);
  assert.match(transformed, /idilewaCreativeStudioBridge/);
  assertSupportAssistant(transformed);
});

test('pricing, payment, and child signup use their standalone page scripts', async () => {
  const source = await readFile(resolve(rootDirectory, 'pricing.html'), 'utf8');
  const transformed = transformEntry('pricing.html', source);

  assert.match(transformed, /src="\/src\/pricingPage\.js"/);
  assert.doesNotMatch(transformed, /src="\.\/app\.js"/);
  assertSupportAssistant(transformed);
  for (const [filename, script] of [['payment.html', '/src/paymentPage.js']]) {
    const page = await readFile(resolve(rootDirectory, filename), 'utf8');
    assert.equal(transformEntry(filename, page), page);
    assert.match(page, new RegExp(`src="${script.replaceAll('/', '\\/')}"`));
    assert.match(page, /class="art"/);
  }
  const childSignup = await readFile(resolve(rootDirectory, 'kids-signup.html'), 'utf8');
  assert.match(childSignup, /src="\/src\/authDialog\.js"/);
  assert.match(childSignup, /data-auth-role="child"/);
  assert.doesNotMatch(childSignup, /<form[^>]*action="\/api\/guardian\/children"/);
});

test('public FAQ and pricing pages keep the primary destinations and grouped site directory', async () => {
  const faq = await readFile(resolve(rootDirectory, 'faq.html'), 'utf8');
  const pricing = await readFile(resolve(rootDirectory, 'pricing.html'), 'utf8');

  for (const html of [faq, pricing]) {
    assert.match(html, /href="\/">Home<\/a>/);
    assert.match(html, /href="\/voice_lessons\.html">Voice Lessons<\/a>/);
    assert.match(html, /href="\/development-center\.html">Code<\/a>/);
  }
  assert.match(faq, /aria-label="All site pages"/);
  assert.match(faq, /aria-labelledby="faqLearnLinks"/);
  assert.match(faq, /aria-labelledby="faqCreateLinks"/);
  assert.match(faq, /aria-labelledby="faqFamilyLinks"/);
  assert.match(pricing, /id="pricingMenuToggle" type="button" aria-expanded="false" aria-controls="pricingMenu"/);
  assert.match(pricing, /id="pricingMenu" aria-label="All site pages" hidden/);
  assert.match(pricing, /aria-labelledby="pricingLearnLinks"/);
  assert.match(pricing, /aria-labelledby="pricingCreateLinks"/);
  assert.match(pricing, /aria-labelledby="pricingFamilyLinks"/);
  assert.match(pricing, /event\.key === 'Escape'/);
});

test('the supplied editor route stays intact and the milestone route receives account-sync hooks', async () => {
  const editor = await readFile(resolve(rootDirectory, 'development-center.html'), 'utf8');
  const milestone = await readFile(resolve(rootDirectory, 'milestone-achievement.html'), 'utf8');
  const transformedEditor = transformEntry('development-center.html', editor);
  const transformedMilestone = transformEntry('milestone-achievement.html', milestone);

  const withoutAssistant = transformedEditor.replace(
    /<script\s+type="module"\s+src="\/src\/supportAssistant\.js"><\/script>/,
    '',
  );
  assert.equal(withoutAssistant, editor);
  assert.match(transformedEditor, /src="\/src\/development-center\/main\.tsx"/);
  assertSupportAssistant(transformedEditor);
  assert.equal(transformEntry('development-center.html', transformedEditor), transformedEditor);
  assert.match(transformedMilestone, /idilewa-milestone-progress-bridge/);
  assert.match(transformedMilestone, /src="\/src\/milestoneAchievementProgress\.js"/);
  assertSupportAssistant(transformedMilestone);
});

test('every built HTML entry except the homepage points to the standalone app', async () => {
  const files = await readdir(rootDirectory);
  const pages = files.filter((file) => file.endsWith('.html') && file !== 'index.html');
  const nativePages = new Set([
    'ai-conversation.html',
    'auth-callback.html',
    'about.html',
    'development-center.html',
    'milestone-achievement.html',
    'consent.html',
    'creative-studio.html',
    'educator-portal.html',
    'faq.html',
    'family-tasks.html',
    'heritage-library.html',
    'login.html',
    'parents.html',
    'kids-signup.html',
    'payment.html',
    'pricing.html',
    'oral.html',
    'oral_genre.html',
    'oriki.html',
    'owe.html',
    'owe_add.html',
    'owe_detail.html',
    'owe_story.html',
    'owe_reflection.html',
    'tutor.html',
    'trainer.html',
    'voice_lessons.html',
    'voices.html',
  ]);

  assert.ok(pages.length > 0);
  for (const filename of pages) {
    if (nativePages.has(filename)) continue;
    const redirect = transformEntry(filename);
    assert.match(redirect, /Continue to Ìdíléwa Language Academy/, filename);
    assert.match(redirect, /location\.replace\(/, filename);
  }
});

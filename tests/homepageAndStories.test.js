import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('homepage follows the supplied language academy reference', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderFullHome()'));
  assert.match(indexSource, /<body data-default-route="index">/);
  assert.match(homeSource, /Our Language\.<br \/><span>Our Future\.<\/span>/);
  assert.match(homeSource, /landingHomeHeroUrl/);
  assert.match(appSource, /import landingHomeHeroUrl from '\.\/assets\/landing-home-hero\.webp'/);
  assert.match(homeSource, /Learn\. Speak\. Connect\./);
  assert.match(appSource, /data-route="voice-grade" data-lang="\$\{language\.id\}"/);
  assert.match(appSource, /routeLink\('voice_lessons', 'Start Learning', 'button button-primary header-cta'\)/);
  assert.match(homeSource, /Start Learning/);
  assert.match(homeSource, /AI Conversation/);
  assert.match(homeSource, /Heritage Stories/);
  assert.doesNotMatch(homeSource, /Code for Kids|renderHomeAppPreview|landing-pathways|home-trainer-feature-section/);
  assert.doesNotMatch(homeSource, /visual-journey-3d-section|home-voice-promo|home-trainer-feature-section|explore-section|story-feature|audience-section|home-cta-section/);
  assert.match(appSource, /case 'index': return renderHome\(\);/);
  assert.match(appSource, /else if \(page === 'index'\) \{\s*document\.body\.dataset\.page = page;\s*document\.getElementById\('main'\)\.innerHTML = `\$\{pageMarkup\}\$\{renderFooter\(page\)\}`;/);
  assert.doesNotMatch(appSource, /page === 'index' \? renderHomeBenefits\(\)/);
  assert.match(styleSource, /\.academy-hero \{/);
  assert.match(styleSource, /\.academy-language-grid \{/);
  assert.match(styleSource, /@media \(max-width: 760px\)[\s\S]*?\.academy-hero \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
});

test('main and expanded mobile navigation omit retired pages', () => {
  const navSource = appSource.match(/const NAV = \[([\s\S]*?)\n  \];/)?.[1];
  const mobileNavSource = appSource.slice(appSource.indexOf('function renderMobileNav('), appSource.indexOf('function renderFooter('));
  assert.ok(navSource, 'main navigation list should exist');
  const navLabels = [...navSource.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(navLabels, ['Home', 'Voice Lessons', 'AI Conversation', 'For Tutors']);
  assert.doesNotMatch(navSource, /Curriculum|STEM Studio|Payment/);
  const mobileItems = [...mobileNavSource.matchAll(/\{ route: '([^']+)', label: '([^']+)'/g)].map((match) => [match[1], match[2]]);
  assert.deepEqual(mobileItems, [['index', 'Home'], ['voice_lessons', 'Voice'], ['profile', 'Profile']]);
  assert.match(mobileNavSource, /page === 'voice_lessons' \|\| page\.startsWith\('voice-'\)/);
  assert.doesNotMatch(mobileNavSource, /aiWorkspace|ai-conversations/);
  assert.match(mobileNavSource, /class="mobile-tab mobile-navigation-item \$\{active \? 'active' : ''\}"/);
  assert.match(mobileNavSource, /mobileNav\.className = 'mobile-nav mobile-bottom-navigation'/);
  assert.match(mobileNavSource, /currentUser\?\.role === 'educator'/);
  assert.match(styleSource, /\.mobile-bottom-navigation \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*?align-items: center;/);
  assert.match(styleSource, /\.mobile-navigation-item \{[\s\S]*?align-items: center;[\s\S]*?text-align: center;/);
  assert.match(styleSource, /body\.has-mobile-bottom-navigation #main/);
  assert.match(appSource, /const REMOVED_ROUTES = new Set\(\[[\s\S]*?'world'[\s\S]*?'coding', 'coding-studio'/);
  assert.match(appSource, /const REMOVED_ROUTES = new Set\(\[[\s\S]*?'curriculum', 'learn', 'payment'/);
  assert.doesNotMatch(appSource, /route: 'world'|label: 'Explore'|function renderCulturalWorld|initCulturalWorld|cultural-zone|cultural-world-replacement/);
  assert.match(appSource, /const MENU_NAV = \[\.\.\.NAV,/);
});

test('removed page families are absent while the retained learning destinations remain', () => {
  const routes = appSource.match(/const ROUTES = \[([\s\S]*?)\n  \];/)?.[1];
  assert.ok(routes, 'application routes should exist');
  assert.match(routes, /'ai-conversation'/);
  assert.doesNotMatch(routes.replace(/'ai-conversation',?/g, ''), /ai-|['"]ere(?:_game)?['"]/);
  assert.doesNotMatch(appSource, /ai-conversations|AI Conversations|AI_CHAT_|aic-|STORY_READINGS|renderStoryGame/);
  assert.match(appSource, /route: 'oral'/);
  assert.match(appSource, /route: 'voice_lessons'/);
});

test('reference homepage and mobile navigation have responsive layouts', () => {
  assert.match(styleSource, /@media \(max-width: 760px\)[\s\S]*?\.academy-hero \{/);
  assert.match(styleSource, /\.academy-language-grid\s*\{/);
  assert.match(styleSource, /\.academy-tools-grid\s*\{/);
  assert.match(styleSource, /\.mobile-bottom-navigation \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(styleSource, /\.aic-|\.ai-auth-page|\.ai-workspace/);
});

test('homepage omits the extra promotional sections outside the supplied reference', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderFullHome()'));
  assert.doesNotMatch(homeSource, /visual-journey-3d-section|how-it-works-journey-section|home-trainer-feature-section|story-feature|audience-section|home-cta-section/);
});

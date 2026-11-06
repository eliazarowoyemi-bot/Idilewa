import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('homepage follows the Family Living View mobile reference', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderFullHome()'));
  assert.match(indexSource, /<body data-default-route="index">/);
  assert.match(homeSource, /src="\.\/assets\/idilewa-family-view\.png"/);
  assert.match(homeSource, /Idilewa Living Family View showing a family learning together/);
  assert.match(homeSource, /Learn African languages, hear our stories, build real skills and belong to a global community/);
  assert.match(homeSource, /Start Learning/);
  assert.match(homeSource, /Code for Kids/);
  assert.match(homeSource, /routeLink\('kids', `Code for Kids/);
  assert.match(homeSource, /AI Conversation/);
  assert.match(homeSource, /\$\{renderHomeAppPreview\(\)\}/);
  assert.match(homeSource, /class="container landing-pathways"/);
  for (const route of ['voice-translation', 'voice-text-to-speech', 'voice-speech-to-text', 'voice-cloning']) {
    assert.match(homeSource, new RegExp(`route: '${route}'`));
  }
  assert.doesNotMatch(homeSource, /route: 'heritage'/);
  assert.doesNotMatch(homeSource, /visual-journey-3d-section|home-voice-promo|home-trainer-feature-section|explore-section|story-feature|audience-section|home-cta-section/);
  assert.match(appSource, /case 'index': return renderHome\(\);/);
  assert.match(appSource, /else if \(page === 'index'\) \{\s*document\.body\.dataset\.page = page;\s*document\.getElementById\('main'\)\.innerHTML = `\$\{pageMarkup\}\$\{renderFooter\(page\)\}`;/);
  assert.doesNotMatch(appSource, /page === 'index' \? renderHomeBenefits\(\)/);
  assert.match(styleSource, /\.android-device \{[^}]*transform-style: preserve-3d; animation: android-device-orbit/);
  assert.match(styleSource, /\.android-device \{ width: min\(42vw, 220px\); height: auto; aspect-ratio: \.46;/);
  assert.match(styleSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.android-device \{ animation: none;/);
});

test('main and expanded mobile navigation omit retired pages', () => {
  const navSource = appSource.match(/const NAV = \[([\s\S]*?)\n  \];/)?.[1];
  const mobileNavSource = appSource.slice(appSource.indexOf('function renderMobileNav('), appSource.indexOf('function renderFooter('));
  assert.ok(navSource, 'main navigation list should exist');
  const navLabels = [...navSource.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(navLabels, ['Home', 'Voice Lessons', 'AI Conversations', 'For Tutors', 'Curriculum', 'STEM Studio']);
  assert.match(navSource, /\{ label: 'STEM Studio', href: '\/studio', group: 'studio' \}/);
  const mobileItems = [...mobileNavSource.matchAll(/\{ route: '([^']+)', label: '([^']+)'/g)].map((match) => [match[1], match[2]]);
  assert.deepEqual(mobileItems, [['index', 'Home'], ['voice_lessons', 'Voice'], ['ai-conversations', 'AI Chat'], ['curriculum', 'Code'], ['profile', 'Profile']]);
  assert.match(appSource, /const REMOVED_ROUTES = new Set\(\[[\s\S]*?'world'[\s\S]*?'coding', 'coding-studio'/);
  assert.doesNotMatch(appSource, /route: 'world'|label: 'Explore'|function renderCulturalWorld|initCulturalWorld|cultural-zone|cultural-world-replacement/);
  assert.match(appSource, /const MENU_NAV = \[\.\.\.NAV,/);
});

test('every story card opens its own bilingual reader with previous and next navigation', () => {
  assert.match(appSource, /const STORY_READINGS = \[/);
  assert.equal((appSource.match(/id: '(?:story-travelled|garden-words|little-builders)'/g) || []).length, 3);
  assert.match(appSource, /data-route="ere_game" data-story="\$\{story\.id\}"/);
  assert.match(appSource, /English translation/);
  assert.match(appSource, /lang="yo"/);
  assert.match(appSource, /Previous story/);
  assert.match(appSource, /Next story/);
  assert.match(appSource, /data-key="\$\{story\.id\}"/);
});

test('reference homepage and story navigation have responsive layouts', () => {
  assert.match(styleSource, /@media \(max-width: 620px\)[\s\S]*?\.home-reference-page \.hero-grid \{/);
  assert.match(styleSource, /\.home-reference-actions\s*\{/);
  assert.match(styleSource, /\.home-app-layout\s*\{/);
  assert.match(styleSource, /\.story-navigation-link \{[\s\S]*?min-height: 44px/);
});

test('homepage omits the extra promotional sections outside the supplied reference', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderFullHome()'));
  assert.doesNotMatch(homeSource, /visual-journey-3d-section|how-it-works-journey-section|home-trainer-feature-section|story-feature|audience-section|home-cta-section/);
});

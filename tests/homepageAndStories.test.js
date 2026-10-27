import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const indexSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function jpegDimensions(buffer) {
  let offset = 2;
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;

    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;

    const segmentLength = buffer.readUInt16BE(offset);
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    offset += segmentLength;
  }

  throw new Error('JPEG image has no supported start-of-frame marker');
}

test('homepage uses the approved bilingual font families and removes the video CTA', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderLanguageCard'));
  assert.match(indexSource, /<body data-default-route="index">/);
  assert.match(indexSource, /family=Inter:wght@400;500;600;700&family=Plus\+Jakarta\+Sans:wght@600;700;800/);
  assert.match(homeSource, /Preserving African Culture\.<br \/><span>Promoting Technology\.<\/span>/);
  assert.match(homeSource, /Explore Stories/);
  assert.doesNotMatch(homeSource, /visual-journey-3d-section|Talking Drum|Living Glyphs/);
  assert.match(appSource, /case 'index': return renderHome\(\);/);
  assert.doesNotMatch(homeSource, /Watch Video/);
  assert.doesNotMatch(homeSource, /landing-language-flag|flag: '🇳🇬'|flag: '🇹🇿'/);
  assert.match(styleSource, /landing-hero-copy h1[\s\S]*?font-size: 28px;[\s\S]*?line-height: 33px/);
  assert.match(styleSource, /landing-hero-copy > p[\s\S]*?font-size: 14px;[\s\S]*?line-height: 22px/);
  assert.match(styleSource, /landing-hero-actions \.button[\s\S]*?min-height: 48px;[\s\S]*?font-size: 14px/);
});

test('main and expanded mobile navigation order lessons between Explore and Code', () => {
  const navSource = appSource.match(/const NAV = \[([\s\S]*?)\n  \];/)?.[1];
  assert.ok(navSource, 'main navigation list should exist');
  const navLabels = [...navSource.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(navLabels, ['Home', 'Explore', 'Voice Lessons', 'Code', 'Curriculum']);
  assert.match(appSource, /const MENU_NAV = \[\.\.\.NAV,/);
});

test('homepage language photos do not have country-symbol overlays', () => {
  const homeSource = appSource.slice(appSource.indexOf('function renderHome()'), appSource.indexOf('function renderLanguageCard'));

  assert.equal((homeSource.match(/class="landing-language-card"/g) || []).length, 1);
  assert.match(homeSource, /class="landing-language-name">\$\{language\.name\}/);
  assert.doesNotMatch(homeSource, /landing-language-flag|language\.flag/);
  assert.doesNotMatch(styleSource, /\.landing-language-flag/);
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

test('mobile landing layouts and story navigation have responsive no-overflow rules', () => {
  assert.match(styleSource, /@media \(max-width: 620px\)[\s\S]*?landing-home \.container \{ width: calc\(100% - 40px\)/);
  assert.match(styleSource, /@media \(max-width: 359px\)[\s\S]*?landing-home \.container \{ width: calc\(100% - 32px\)/);
  assert.match(styleSource, /\.landing-future-card \{[^}]*color: var\(--ink\);[^}]*background: var\(--mint\)/);
  assert.match(styleSource, /\.landing-future-card \.text-link \{ color: var\(--green-dark\);/);
  assert.match(styleSource, /\.story-navigation-link \{[\s\S]*?min-height: 44px/);
});

test('homepage How It Works section uses the supplied artwork unchanged', async () => {
  const image = await readFile(new URL('../public/assets/how-it-works-journey-reference.jpg', import.meta.url));

  assert.equal(createHash('sha256').update(image).digest('hex'), 'fb715733b68f5d740cf11f5b52f3618de53644cb2ebe56071e2e0e07ab482005');
  assert.deepEqual(jpegDimensions(image), { width: 1080, height: 720 });
  assert.match(appSource, /<section class="container how-it-works-journey-section"[\s\S]*?<img class="how-it-works-journey-image" src="\$\{imageUrl\('how-it-works-journey-reference\.jpg'\)\}"/);
  assert.doesNotMatch(appSource, /journey-step-card|journey-step-visual/);
  assert.match(styleSource, /\.how-it-works-journey-image\s*\{[^}]*width: 100%;[^}]*height: auto;/s);
});

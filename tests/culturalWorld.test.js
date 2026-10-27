import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CULTURAL_BIOMES } from '../src/culturalWorld.js';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const stylesSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const culturalWorldArtwork = await readFile(new URL('../public/assets/cultural-world-replacement.png', import.meta.url));
const culturalWorldArtwork5k = await readFile(new URL('../public/assets/cultural-world-replacement-5k.jpg', import.meta.url));

function getJpegDimensions(image) {
  const startOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset < image.length) {
    if (image[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = image[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 7 > image.length) return null;
    if (startOfFrameMarkers.has(marker)) {
      return { width: image.readUInt16BE(offset + 5), height: image.readUInt16BE(offset + 3) };
    }
    offset += image.readUInt16BE(offset);
  }
  return null;
}

test('Cultural World uses the supplied artwork unchanged and aligns its interactive areas', () => {
  assert.equal(createHash('sha256').update(culturalWorldArtwork).digest('hex'), 'a24f8ac67f8281e5b3398627fac46574e043b4dbf282f5630a64962120914df8');
  assert.equal(culturalWorldArtwork.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(culturalWorldArtwork.readUInt32BE(16), 877);
  assert.equal(culturalWorldArtwork.readUInt32BE(20), 768);
  assert.deepEqual(getJpegDimensions(culturalWorldArtwork5k), { width: 5000, height: 4379 });

  const culturalWorld = appSource.slice(
    appSource.indexOf('function renderCulturalWorld()'),
    appSource.indexOf('function openCulturalZone')
  );
  assert.match(culturalWorld, /src="\.\/assets\/cultural-world-replacement\.png" srcset="\.\/assets\/cultural-world-replacement\.png 877w, \.\/assets\/cultural-world-replacement-5k\.jpg 5000w" sizes="\(min-width: 1232px\) 1200px, calc\(100vw - 32px\)" width="877" height="768"/);
  assert.match(culturalWorld, /aria-label="Start exploring"/);
  assert.match(culturalWorld, /data-action="cultural-zone" data-zone="\$\{biome\.id\}"/);
  assert.match(culturalWorld, /world-artwork-top-languages/);
  assert.match(culturalWorld, /world-artwork-language-marker-\$\{id\}/);
  assert.match(culturalWorld, /routeLink\('profile', '<span class="sr-only">Start your learning journey: open your profile<\/span>'/);
  assert.match(stylesSource, /\.world-artwork-hotspot \.sr-only\s*\{[^}]*clip-path: inset\(50%\);/s);
  assert.match(stylesSource, /\.world-artwork-start \{\s*top: 35%;\s*left: 5%;\s*width: 21%;/);
  assert.match(stylesSource, /\.world-artwork-zone \{\s*left: 65%;\s*width: 32%;\s*height: 6%;/);
  assert.match(stylesSource, /\.world-artwork-zone-language \{ top: 53\.4%; \}/);
  assert.match(stylesSource, /\.world-artwork-zone-voice \{ top: 61%; \}/);
  assert.match(stylesSource, /\.world-artwork-zone-stories \{ top: 68\.9%; \}/);
  assert.match(stylesSource, /\.world-artwork-zone-proverbs \{ top: 76\.8%; \}/);
  assert.match(stylesSource, /\.world-artwork-zone-code \{ top: 84\.1%; \}/);
  assert.match(stylesSource, /\.world-artwork-language-marker \{\s*width: 12%;/);
  assert.match(stylesSource, /\.world-artwork-language-marker-english \{ top: 56%; left: 6%; \}/);
  assert.match(stylesSource, /\.world-artwork-language-marker-french \{ top: 53\.5%; left: 26%; \}/);
  assert.match(stylesSource, /\.world-artwork-language-marker-mandarin \{ top: 56%; left: 48%; \}/);
  assert.match(stylesSource, /\.world-artwork-language-marker-spanish \{ top: 75\.5%; left: 10%; \}/);
  assert.match(stylesSource, /\.world-artwork-language-marker-swahili \{ top: 72\.5%; left: 38%; \}/);
  assert.match(stylesSource, /\.world-artwork-profile \{\s*top: 91\.5%;/);
  assert.match(stylesSource, /\.world-artwork-page\s*\{[^}]*width: min\(1200px, calc\(100% - 32px\)\);/);
  assert.match(stylesSource, /\.world-artwork-frame > img\s*\{[^}]*width: 100%;[^}]*max-width: 100%;[^}]*height: auto;/s);
  assert.doesNotMatch(appSource, /passport/i);
  assert.match(appSource, /route: 'profile', label: 'Profile', ico: 'user'/);
});

test('the cultural world covers Idilewa language, voice, oral culture, and coding goals', () => {
  assert.deepEqual(CULTURAL_BIOMES.map(({ id }) => id), ['language', 'voice', 'stories', 'proverbs', 'code']);
  assert.deepEqual(CULTURAL_BIOMES.map(({ route }) => route), ['course', 'trainer', 'ere', 'owe', 'coding']);
  assert.equal(CULTURAL_BIOMES[0].phrase, 'Ẹ káàárọ̀');
  assert.equal(CULTURAL_BIOMES[0].translation, 'Good morning');
  assert.ok(CULTURAL_BIOMES.slice(1).every(({ translation }) => translation === null));
  assert.ok(CULTURAL_BIOMES.every(({ position, color, accent }) =>
    position.length === 3 && position.every(Number.isFinite) && Number.isInteger(color) && Number.isInteger(accent)));
});

test('the world and profile are routed through the existing Idilewa SPA', () => {
  assert.match(appSource, /case 'world': return renderCulturalWorld\(\);/);
  assert.match(appSource, /case 'profile': return renderProfile\(\);/);
  assert.match(appSource, /case 'learn':\s*case 'curriculum': return renderCurriculum\(\);\s*case 'languages': return renderLanguages\(\);/);
  assert.match(appSource, /if \(page === 'learn'\) page = 'curriculum';/);
  assert.match(appSource, /routeLink\('world', `Explore the World/);
  assert.match(appSource, /initCulturalWorld\(worldCanvas, \(zoneId\) => openCulturalZone\(zoneId\)\)/);
  assert.match(appSource, /case 'launch-cultural-zone': \{/);
});

test('the map provides accessible non-WebGL navigation and reduced-motion support', () => {
  assert.match(appSource, /aria-label="Explore languages and cultures"/);
  assert.match(appSource, /world-artwork-zone-\$\{biome\.id\}/);
  assert.match(appSource, /role="dialog" aria-modal="true"/);
  assert.match(stylesSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?world-lesson-sheet/);
  assert.match(stylesSource, /env\(safe-area-inset-bottom\)/);
  assert.match(stylesSource, /backdrop-filter: blur\(24px\)/);
});

test('the existing Idilewa green palette is preserved', () => {
  assert.match(stylesSource, /--green: #15764a;/);
  assert.match(stylesSource, /--green-dark: #0c5737;/);
  assert.match(stylesSource, /--paper: #fffefa;/);
  assert.doesNotMatch(stylesSource, /--green: #a9543e|--clay:|--royal-indigo:|--sahara-gold:|--savannah-green:/);
});

test('lesson and route images use the site-root assets path', () => {
  assert.match(appSource, /const imageUrl = .*`\/assets\/\$\{filename\}`/);
  assert.ok(appSource.includes('return output.replace(/(\\bsrc=["\'])\\.\\/assets\\//gi, \'$1/assets/\');'));
});

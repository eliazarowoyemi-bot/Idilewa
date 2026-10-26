import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CULTURAL_BIOMES } from '../src/culturalWorld.js';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const stylesSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('the cultural world covers Idilewa language, voice, oral culture, and coding goals', () => {
  assert.deepEqual(CULTURAL_BIOMES.map(({ id }) => id), ['language', 'voice', 'stories', 'proverbs', 'code']);
  assert.deepEqual(CULTURAL_BIOMES.map(({ route }) => route), ['course', 'trainer', 'ere', 'owe', 'coding']);
  assert.equal(CULTURAL_BIOMES[0].phrase, 'Ẹ káàárọ̀');
  assert.equal(CULTURAL_BIOMES[0].translation, 'Good morning');
  assert.ok(CULTURAL_BIOMES.slice(1).every(({ translation }) => translation === null));
  assert.ok(CULTURAL_BIOMES.every(({ position, color, accent }) =>
    position.length === 3 && position.every(Number.isFinite) && Number.isInteger(color) && Number.isInteger(accent)));
});

test('the world and learning passport are routed through the existing Idilewa SPA', () => {
  assert.match(appSource, /case 'world': return renderCulturalWorld\(\);/);
  assert.match(appSource, /case 'passport': return renderProfile\(\{ passport: true \}\);/);
  assert.match(appSource, /routeLink\('world', `Explore the World/);
  assert.match(appSource, /initCulturalWorld\(worldCanvas, \(zoneId\) => openCulturalZone\(zoneId\)\)/);
  assert.match(appSource, /case 'launch-cultural-zone': \{/);
});

test('the map provides accessible non-WebGL navigation and reduced-motion support', () => {
  assert.match(appSource, /Choose a learning place/);
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

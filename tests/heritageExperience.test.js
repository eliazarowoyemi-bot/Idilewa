import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const readAsset = (name) => access(new URL(`../assets/${name}`, import.meta.url));

test('Heritage Stories is a standalone route with all navigable app screens', () => {
  assert.match(appSource, /'heritage'/);
  assert.match(appSource, /case 'heritage': return renderHeritageExperience\(params\);/);
  const homePreview = appSource.slice(appSource.indexOf('function renderHomeAppPreview()'), appSource.indexOf('function renderLegacyHome()'));
  assert.match(homePreview, /label: 'Stories · Culture'[\s\S]*?route: 'heritage'/);
  for (const screen of [
    'home', 'story-list', 'story-reader', 'story-lesson', 'progress', 'culture-list',
    'festival', 'culture-quiz', 'culture-progress', 'collection', 'riddle-list',
    'riddle-challenge', 'riddle-answer', 'riddle-streak', 'profile'
  ]) {
    assert.match(appSource, new RegExp(`'${screen}'`));
  }
  assert.match(appSource, /'screen', 'riddle', 'category'/);
  assert.match(appSource, /data-route="heritage"/);
});

test('story, culture and riddle interactions provide working audio, quizzes, hints, and saved progress', () => {
  assert.match(appSource, /data-action="play-audio" data-language="en-US"/);
  assert.match(appSource, /data-form="heritage-story-quiz"/);
  assert.match(appSource, /data-form="heritage-culture-quiz"/);
  assert.match(appSource, /data-form="heritage-riddle"/);
  assert.match(appSource, /<details class="heritage-hint">/);
  assert.match(appSource, /recordHeritageActivity\(\)/);
  assert.match(appSource, /storiesRead/);
  assert.match(appSource, /riddlesSolved/);
  assert.match(appSource, /state\.quizResults\[key\] = correct \? 'correct' : 'retry'/);
});

test('Heritage experience reuses existing image assets without adding image files', async () => {
  for (const filename of ['story-grandmother.jpg', 'page-oral-1.jpg', 'hero-reader.jpg', 'page-ere-1.jpg', 'code-kids.jpg']) {
    await readAsset(filename);
  }
  assert.match(appSource, /imageUrl\('story-grandmother\.jpg'\)/);
  assert.match(appSource, /imageUrl\('page-oral-1\.jpg'\)/);
  assert.match(appSource, /image: 'code-kids\.jpg'/);
  assert.match(appSource, /imageUrl\(card\.image\)/);
});

test('Heritage experience has responsive navigation, accessible controls, and reduced-motion styling', () => {
  assert.match(styleSource, /@media \(max-width: 760px\)[\s\S]*?\.heritage-device \{[^}]*height: 100dvh/);
  assert.match(styleSource, /@media \(max-width: 360px\)[\s\S]*?\.heritage-screen \{[^}]*padding-inline: 12px/);
  assert.match(styleSource, /\.heritage-bottom-nav \{[^}]*grid-template-columns: repeat\(5/);
  assert.match(styleSource, /\.heritage-button:focus-visible/);
  assert.match(styleSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.heritage-button, \.heritage-category-card/);
});

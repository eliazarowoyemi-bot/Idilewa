import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const childrenArt = await readFile(new URL('../public/assets/code-reference-children.png', import.meta.url));
const robotArt = await readFile(new URL('../public/assets/code-reference-buddy.png', import.meta.url));

test('Code navigation opens the designed landing page and Start Coding opens its studio', () => {
  assert.match(appSource, /'coding', 'coding-studio'/);
  assert.match(appSource, /case 'coding': return renderCoding\(\);/);
  assert.match(appSource, /case 'coding-studio': return renderCodingStudio\(\);/);
  assert.match(appSource, /data-route="coding-studio"/);
  assert.match(appSource, /data-route="coding"[^>]*>[\s\S]*?Back to Home/);
  assert.match(appSource, /'coding-studio': 'code'/);
});

test('Code landing page includes the provided layout sections and keeps the preview image assets', () => {
  const landing = appSource.slice(appSource.indexOf('function renderCoding()'), appSource.indexOf('function renderCodingStudio()'));
  assert.match(landing, /Let’s Code<br><em>&amp; Translate!/);
  assert.match(landing, /Start Coding/);
  assert.match(landing, /Build Your Code/);
  assert.match(landing, /See Your Result in<br>Different Languages/);
  assert.match(landing, /Why Kids Love It/);
  assert.match(landing, /code-reference-children\.png/);
  assert.match(landing, /code-reference-buddy\.png/);
  assert.ok(childrenArt.length > 0);
  assert.ok(robotArt.length > 0);
  assert.doesNotMatch(landing, /ide-fullscreen-page|ide-workbench-shell|c4k-ide-section/);
});

test('Coding studio supports block editing, undo, run, translation, and audio controls', () => {
  const studio = appSource.slice(appSource.indexOf('function renderCodingStudio()'), appSource.indexOf('function setCodeBlocks('));
  assert.match(studio, /My Code/);
  assert.match(studio, /Your Result/);
  assert.match(studio, /data-code-drop-zone/);
  assert.match(studio, /code-undo/);
  assert.match(studio, /code-redo/);
  assert.match(studio, /code-clear/);
  assert.match(studio, /data-action="code-run"/);
  assert.match(appSource, /function renderCodeLanguageTiles\([\s\S]*?data-action="\$\{action\}"/);
  assert.match(studio, /data-action="code-speak-output"/);
  assert.match(appSource, /case 'code-add-block'/);
  assert.match(appSource, /case 'code-remove-block'/);
  assert.match(appSource, /async function runCodeStudio\(\)/);
  assert.match(appSource, /document\.addEventListener\('drop'/);
});

test('the new coding layouts adapt for tablets and mobile screens', () => {
  assert.match(styleSource, /\.code-design-page \{/);
  assert.match(styleSource, /@media\(max-width:900px\)[\s\S]*?\.code-studio-workbench/);
  assert.match(styleSource, /@media\(max-width:650px\)[\s\S]*?\.code-landing-preview/);
  assert.match(styleSource, /@media\(max-width:650px\)[\s\S]*?\.code-studio-workbench \{ grid-template-columns: 1fr;/);
});

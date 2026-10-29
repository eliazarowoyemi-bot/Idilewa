import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const styleSource = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const imagePath = new URL('../public/assets/contact-idilewa-team.png', import.meta.url);

test('Contact page displays the supplied Idilewa team artwork without replacing existing contact details', async () => {
  const contactSource = appSource.slice(appSource.indexOf('function renderContact()'), appSource.indexOf('function renderPrivacy()'));
  assert.match(contactSource, /class="contact-team-image"[\s\S]*?imageUrl\('contact-idilewa-team\.png'\)/);
  assert.match(contactSource, /idilewa2026@gmail\.com/);
  assert.match(contactSource, /contact-privacy-note/);
  await access(imagePath);
  const image = await readFile(imagePath);
  assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});

test('Contact team artwork stays uncropped and responsive', () => {
  assert.match(styleSource, /\.contact-team-image img \{[^}]*width: 100%;[^}]*height: auto/);
  assert.match(styleSource, /@media \(max-width: 560px\)[\s\S]*?\.contact-team-image \{ margin-bottom: 20px; \}/);
});

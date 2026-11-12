import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateLearnerProjectBundle,
  validateSceneDocument,
} from '../src/creativeStudioValidation.js';

function projectBundle(overrides = {}) {
  return {
    version: '11.4',
    project: JSON.stringify({
      layers: [{
        name: 'Sketch',
        visible: true,
        locked: false,
        img: 'data:image/png;base64,AA==',
      }],
      activeLayer: 0,
      camera: { yaw: 0.35, pitch: 0.12, zoom: 1 },
      sceneItems: [{ id: 'a1', kind: 'person', x: 0, z: 0, scale: 1, rot: 0 }],
    }),
    geometry: null,
    mode: null,
    motion: { sceneMotion114: 'bounce', sceneSpeed114: 1, sceneAmount114: 0.65 },
    ...overrides,
  };
}

function sceneDocument(overrides = {}) {
  return {
    format: 'idilewa-scene',
    version: 2,
    scene: {
      items: [{ id: 'a1', kind: 'person', x: 0, z: 0, scale: 1, rot: 0 }],
      roomEnabled: true,
      roomColour: '#e8c68c',
      scene: 'village',
      gridSnap: true,
    },
    camera: { yaw: 0.35, pitch: 0.12, zoom: 1 },
    dialogue: 'Ẹ káàárọ̀!',
    ...overrides,
  };
}

test('validates and normalizes learner project bundles for on-device import', () => {
  const safe = validateLearnerProjectBundle(projectBundle(), 200);
  const project = JSON.parse(safe.project);

  assert.equal(project.layers[0].name, 'Sketch');
  assert.equal(project.sceneItems[0].id, 'a1');
  assert.deepEqual(safe.motion, {
    sceneMotion114: 'bounce',
    sceneSpeed114: 1,
    sceneAmount114: 0.65,
  });
});

test('rejects unsafe IDs, invalid images, oversized files and unsupported settings', () => {
  const unsafeProject = JSON.parse(projectBundle().project);
  unsafeProject.sceneItems[0].id = `x');alert(1);//`;
  assert.throws(() => validateLearnerProjectBundle(
    projectBundle({ project: JSON.stringify(unsafeProject) }),
    200,
  ), /invalid ID/);

  const invalidImageProject = JSON.parse(projectBundle().project);
  invalidImageProject.layers[0].img = 'data:image/svg+xml,<svg>';
  assert.throws(() => validateLearnerProjectBundle(
    projectBundle({ project: JSON.stringify(invalidImageProject) }),
    200,
  ), /valid PNG/);
  assert.throws(() => validateLearnerProjectBundle(projectBundle(), 15_000_001), /15 MB/);
  assert.throws(() => validateLearnerProjectBundle(
    projectBundle({ motion: { sceneMotion114: 'explode', sceneSpeed114: 1, sceneAmount114: 1 } }),
    200,
  ), /animation is unsupported/);
});

test('validates imported scenes and rejects malformed geometry and object data', () => {
  const safe = validateSceneDocument(sceneDocument());
  assert.equal(safe.scene.items[0].kind, 'person');
  assert.equal(safe.dialogue, 'Ẹ káàárọ̀!');

  const invalid = sceneDocument();
  invalid.scene.items[0].x = 50;
  assert.throws(() => validateSceneDocument(invalid), /X position/);
});

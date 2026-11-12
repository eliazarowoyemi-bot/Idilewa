const MAX_FILE_BYTES = 15_000_000;
const MAX_GEOMETRY_BYTES = 8_000_000;
const COLOR_PATTERN = /^#[\da-f]{6}$/i;
const SCENE_NAMES = new Set(['classroom', 'village', 'forest', 'city', 'beach', 'space']);
const OBJECT_KINDS = new Set([
  'person', 'table', 'chair', 'sofa', 'shelf', 'bed', 'plant', 'lamp',
  'rug', 'tree', 'house', 'car', 'ball', 'drawing',
]);
const LANGUAGES = new Set(['en', 'yo', 'ig', 'ha', 'sw']);
const MOTIONS = new Set(['bounce', 'spin', 'sway', 'slide', 'pulse']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  return value;
}

function requireText(value, label, maxLength, fallback) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw new Error(`${label} must be text no longer than ${maxLength} characters.`);
  }
  return value;
}

function requireNumber(value, label, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be a number from ${min} to ${max}.`);
  }
  return value;
}

function requireBoolean(value, label, fallback) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'boolean') throw new Error(`${label} must be true or false.`);
  return value;
}

function requireColor(value, label, fallback) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || !COLOR_PATTERN.test(value)) {
    throw new Error(`${label} must be a six-digit colour value.`);
  }
  return value;
}

function validateCamera(value) {
  const camera = requireRecord(value, 'Camera');
  return {
    yaw: requireNumber(camera.yaw, 'Camera angle', -1_000_000, 1_000_000),
    pitch: requireNumber(camera.pitch, 'Camera tilt', -1.6, 1.6),
    zoom: requireNumber(camera.zoom, 'Camera zoom', 0.1, 10),
  };
}

function validateSceneItems(value, label = 'Scene items') {
  if (!Array.isArray(value) || value.length > 500) {
    throw new Error(`${label} must contain no more than 500 objects.`);
  }

  return value.map((item, index) => {
    const object = requireRecord(item, `${label} item ${index + 1}`);
    if (typeof object.id !== 'string' || !/^[a-z\d_-]{1,80}$/i.test(object.id)) {
      throw new Error(`${label} item ${index + 1} has an invalid ID.`);
    }
    if (!OBJECT_KINDS.has(object.kind)) {
      throw new Error(`${label} item ${index + 1} has an unsupported object type.`);
    }

    const validated = {
      id: object.id,
      kind: object.kind,
      x: requireNumber(object.x, 'Object X position', -5, 5),
      z: requireNumber(object.z, 'Object Z position', -5, 5),
      scale: requireNumber(object.scale, 'Object size', 0.2, 5),
      rot: requireNumber(object.rot, 'Object rotation', -3_600, 3_600),
    };

    if (object.name !== undefined) validated.name = requireText(object.name, 'Object name', 80);
    if (object.visible !== undefined) validated.visible = requireBoolean(object.visible, 'Object visibility');
    if (object.locked !== undefined) validated.locked = requireBoolean(object.locked, 'Object lock state');
    if (object.labels !== undefined) {
      const labels = requireRecord(object.labels, 'Object names');
      validated.labels = {};
      for (const [language, name] of Object.entries(labels)) {
        if (!LANGUAGES.has(language)) throw new Error('An object name uses an unsupported language.');
        validated.labels[language] = requireText(name, 'Object name', 80);
      }
    }
    return validated;
  });
}

function sanitizeJson(value, depth = 0, budget = { nodes: 0 }, fieldName = '') {
  budget.nodes += 1;
  if (budget.nodes > 200_000 || depth > 12) throw new Error('Project data is too complex to import.');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const maxLength = fieldName === 'img' ? MAX_FILE_BYTES : 2_000;
    if (value.length > maxLength) throw new Error('A project text field is too long.');
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Project numbers must be finite.');
    return value;
  }
  if (Array.isArray(value)) {
    const maxLength = fieldName === 'triangles' ? 50_000
      : fieldName === 'vertices' ? 10_000
        : 5_000;
    if (value.length > maxLength) throw new Error('A project list is too large.');
    return value.map((entry) => sanitizeJson(entry, depth + 1, budget));
  }
  if (!isRecord(value)) throw new Error('Project data contains an unsupported value.');
  const clean = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!/^[\w-]{1,80}$/.test(key) || ['__proto__', 'prototype', 'constructor'].includes(key)) {
      throw new Error('Project data contains an invalid field name.');
    }
    clean[key] = sanitizeJson(entry, depth + 1, budget, key);
  }
  return clean;
}

function validateGeometry(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string' || raw.length > MAX_GEOMETRY_BYTES) {
    throw new Error('3D geometry is too large to import.');
  }

  let geometry;
  try {
    geometry = JSON.parse(raw);
  } catch {
    throw new Error('3D geometry is not valid JSON.');
  }
  requireRecord(geometry, '3D geometry');
  if (geometry.paths !== undefined) {
    if (!Array.isArray(geometry.paths) || geometry.paths.length > 2_000) {
      throw new Error('3D drawing paths exceed the import limit.');
    }
    for (const path of geometry.paths) {
      requireRecord(path, 'Drawing path');
      if (!Array.isArray(path.points) || path.points.length > 5_000) {
        throw new Error('A drawing path has too many points.');
      }
    }
  }
  if (geometry.mesh?.parts !== undefined) {
    if (!Array.isArray(geometry.mesh.parts) || geometry.mesh.parts.length > 1_800) {
      throw new Error('3D model parts exceed the import limit.');
    }
    for (const part of geometry.mesh.parts) {
      requireRecord(part, '3D model part');
      if (!Array.isArray(part.vertices) || part.vertices.length > 10_000
        || !Array.isArray(part.triangles) || part.triangles.length > 50_000) {
        throw new Error('A 3D model part is too complex to import.');
      }
    }
  }
  return JSON.stringify(sanitizeJson(geometry));
}

function validateMode(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string' || raw.length > 2_000) throw new Error('Studio settings are too large.');
  let mode;
  try {
    mode = JSON.parse(raw);
  } catch {
    throw new Error('Studio settings are not valid JSON.');
  }
  requireRecord(mode, 'Studio settings');
  if (!['drawing', 'toon', 'both'].includes(mode.mode)
    || !MOTIONS.has(mode.motion)) throw new Error('Studio settings contain an unsupported option.');
  return JSON.stringify({
    mode: mode.mode,
    motion: mode.motion,
    speed: requireNumber(mode.speed, 'Drawing speed', 0.25, 4),
    amplitude: requireNumber(mode.amplitude, 'Drawing movement amount', 0.1, 2),
  });
}

function validateProjectState(raw) {
  let project;
  try {
    project = JSON.parse(raw);
  } catch {
    throw new Error('The saved project is not valid JSON.');
  }
  requireRecord(project, 'Saved project');
  if (!Array.isArray(project.layers) || project.layers.length < 1 || project.layers.length > 50) {
    throw new Error('A project must contain between 1 and 50 drawing layers.');
  }

  const layers = project.layers.map((layer, index) => {
    requireRecord(layer, `Drawing layer ${index + 1}`);
    if (typeof layer.img !== 'string'
      || layer.img.length > MAX_FILE_BYTES
      || !/^data:image\/png;base64,[\da-z+/]+=*$/i.test(layer.img)) {
      throw new Error(`Drawing layer ${index + 1} does not contain a valid PNG image.`);
    }
    return {
      name: requireText(layer.name, `Drawing layer ${index + 1} name`, 80, `Layer ${index + 1}`),
      visible: requireBoolean(layer.visible, 'Layer visibility', true),
      locked: requireBoolean(layer.locked, 'Layer lock state', false),
      img: layer.img,
    };
  });

  if (!Number.isInteger(project.activeLayer) || project.activeLayer < 0 || project.activeLayer >= layers.length) {
    throw new Error('The active drawing layer is invalid.');
  }
  if (project.scene !== undefined && !SCENE_NAMES.has(project.scene)) {
    throw new Error('The project uses an unsupported scene.');
  }
  const safeProject = sanitizeJson(project);
  safeProject.layers = layers;
  safeProject.sceneItems = validateSceneItems(project.sceneItems || [], 'Project scene items');
  if (project.camera !== undefined) safeProject.camera = validateCamera(project.camera);
  if (project.roomColour !== undefined) safeProject.roomColour = requireColor(project.roomColour, 'Room colour');
  if (project.roomEnabled !== undefined) safeProject.roomEnabled = requireBoolean(project.roomEnabled, 'Room visibility');
  if (project.gridSnap !== undefined) safeProject.gridSnap = requireBoolean(project.gridSnap, 'Grid snapping');
  if (project.dialogue !== undefined) safeProject.dialogue = requireText(project.dialogue, 'Story dialogue', 500);
  return JSON.stringify(safeProject);
}

export function validateSceneDocument(document) {
  requireRecord(document, 'Scene file');
  if (document.format !== 'idilewa-scene' || document.version !== 2) {
    throw new Error('This is not a supported Ìdíléwa scene file.');
  }
  const scene = requireRecord(document.scene, 'Scene');
  if (scene.scene !== undefined && !SCENE_NAMES.has(scene.scene)) {
    throw new Error('The scene uses an unsupported environment.');
  }
  const safeScene = {
    items: validateSceneItems(scene.items, 'Scene items'),
    roomEnabled: requireBoolean(scene.roomEnabled, 'Room visibility', true),
    roomColour: requireColor(scene.roomColour, 'Room colour', '#e8c68c'),
    scene: scene.scene || 'village',
    gridSnap: requireBoolean(scene.gridSnap, 'Grid snapping', true),
  };
  return {
    scene: safeScene,
    camera: validateCamera(document.camera),
    dialogue: requireText(document.dialogue, 'Story dialogue', 500, ''),
  };
}

export function validateLearnerProjectBundle(bundle, fileSize) {
  requireRecord(bundle, 'Project file');
  if (bundle.version !== '11.4') throw new Error('This is not a supported Ìdíléwa project file.');
  if (!Number.isInteger(fileSize) || fileSize < 1 || fileSize > MAX_FILE_BYTES) {
    throw new Error('Project files must be smaller than 15 MB.');
  }
  if (typeof bundle.project !== 'string') throw new Error('The project data is missing.');
  return {
    project: validateProjectState(bundle.project),
    geometry: validateGeometry(bundle.geometry),
    mode: validateMode(bundle.mode),
    motion: bundle.motion === undefined || bundle.motion === null
      ? { sceneMotion114: 'bounce', sceneSpeed114: 1, sceneAmount114: 0.65 }
      : (() => {
        const motion = requireRecord(bundle.motion, 'Scene animation settings');
        if (!MOTIONS.has(motion.sceneMotion114)) throw new Error('The scene animation is unsupported.');
        return {
          sceneMotion114: motion.sceneMotion114,
          sceneSpeed114: requireNumber(motion.sceneSpeed114, 'Scene animation speed', 0.25, 4),
          sceneAmount114: requireNumber(motion.sceneAmount114, 'Scene movement amount', 0.1, 2),
        };
      })(),
  };
}

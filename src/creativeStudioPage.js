import { validateLearnerProjectBundle, validateSceneDocument } from './creativeStudioValidation.js';

function reportImportError(error, prefix) {
  const detail = error instanceof Error ? error.message : 'The file could not be read.';
  if (typeof window.notify === 'function') window.notify(`${prefix} ${detail}`);
  else console.error(`${prefix} ${detail}`);
}

function readJsonFile(file, maxBytes) {
  if (!file) throw new Error('Choose a project file first.');
  if (file.size < 1 || file.size > maxBytes) throw new Error('The selected file is empty or too large.');
  return file.text().then((text) => JSON.parse(text));
}

function installLearnerProjectImport() {
  const input = document.getElementById('studioImport114');
  if (!input) throw new Error('Creative Studio project-import control is missing.');

  input.onchange = async (event) => {
    const source = event.currentTarget;
    const file = source.files?.[0];
    if (!file) return;
    try {
      const bundle = await readJsonFile(file, 15_000_000);
      const safe = validateLearnerProjectBundle(bundle, file.size);
      if (typeof window.loadProject !== 'function') {
        throw new Error('Project loading is unavailable. Reload the page and try again.');
      }
      if (!window.idilewaCreativeStudioBridge) {
        throw new Error('Project import is unavailable. Reload the page and try again.');
      }
      let previous;
      try {
        previous = new Map([
          ['idilewa-m10', localStorage.getItem('idilewa-m10')],
          ['idilewa-v11-geometry', localStorage.getItem('idilewa-v11-geometry')],
          ['idilewa-v113-mode', localStorage.getItem('idilewa-v113-mode')],
        ]);
      } catch {
        throw new Error('This browser does not allow access to local project storage.');
      }
      try {
        localStorage.setItem('idilewa-m10', safe.project);
        if (safe.geometry) localStorage.setItem('idilewa-v11-geometry', safe.geometry);
        else localStorage.removeItem('idilewa-v11-geometry');
        if (safe.mode) localStorage.setItem('idilewa-v113-mode', safe.mode);
        else localStorage.removeItem('idilewa-v113-mode');
      } catch (error) {
        const rollbackErrors = [];
        for (const [key, value] of previous) {
          try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
          } catch (rollbackError) {
            rollbackErrors.push(rollbackError);
          }
        }
        const recovery = rollbackErrors.length ? ' Some prior settings could not be restored.' : '';
        throw new Error(`Browser storage is unavailable or full. Free space, then import again. ${error.message}${recovery}`);
      }
      window.idilewaCreativeStudioBridge.setMotion(safe.motion);
      window.loadProject();
      if (typeof window.notify !== 'function') throw new Error('Import status notifications are unavailable.');
      window.notify('Project imported on this device.');
    } catch (error) {
      reportImportError(error, 'Could not import this project.');
    } finally {
      source.value = '';
    }
  };
}

function installSceneImport() {
  if (typeof window.sceneImportJSON !== 'function') {
    throw new Error('Creative Studio scene-import action is missing.');
  }

  window.sceneImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.hidden = true;
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) {
        input.remove();
        return;
      }
      try {
        const documentData = await readJsonFile(file, 15_000_000);
        const safe = validateSceneDocument(documentData);
        window.idilewaCreativeStudioBridge.importScene(safe.scene, safe.camera, safe.dialogue);
        window.notify?.('Scene imported on this device.');
      } catch (error) {
        reportImportError(error, 'Could not import this scene.');
      } finally {
        input.value = '';
        input.remove();
      }
    });
    document.body.append(input);
    input.click();
  };
}

installLearnerProjectImport();
installSceneImport();

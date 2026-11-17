import { getUserProgress, isSupabaseConfigured, saveProgress, supabase } from './supabaseClient.js';
import {
  DEFAULT_PROGRESS,
  hasMilestoneProgress,
  mergeMilestoneProgress,
  normalizeMilestoneProgress,
} from './milestoneProgressState.js';

const OWNER_KEY = 'idilewa-v25-progress-owner';
const PROGRESS_EVENT = 'idilewa:milestone-progress-saved';
const status = document.createElement('p');
status.className = 'milestone-sync-status';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
status.hidden = true;
status.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:1000;max-width:min(360px,calc(100vw - 24px));margin:0;padding:10px 14px;border:1px solid #b8d7bf;border-radius:12px;background:#fff;color:#123d30;font:600 13px/1.45 system-ui,sans-serif;box-shadow:0 6px 24px #123d3024';
document.body.append(status);

const bridge = window.idilewaMilestoneProgress;
if (!bridge) throw new Error('Milestone progress integration could not connect to the game.');

let activeUserId = null;
let hydrationVersion = 0;
let applyingAccountProgress = false;
let saveTimer = 0;
let saveQueue = Promise.resolve();

function report(message) {
  status.textContent = message;
  status.hidden = !message;
}

function readLocalProgress() {
  try {
    return normalizeMilestoneProgress(bridge.read());
  } catch (error) {
    console.error('Milestone progress could not be read from this device.', error);
    report('Local progress could not be read. Your latest challenge may not be saved.');
    return normalizeMilestoneProgress(DEFAULT_PROGRESS);
  }
}

function writeAccountProgress(userId, value) {
  const progress = normalizeMilestoneProgress({ ...value, savedAt: Date.now() });
  const save = () => saveProgress({
    userId,
    lessonType: 'milestone',
    lessonId: 'v25-life-adventures',
    meta: progress,
  });

  saveQueue = saveQueue
    .catch(() => undefined)
    .then(() => {
      if (activeUserId !== userId) return undefined;
      return save();
    })
    .then(() => {
      if (activeUserId === userId) report('Milestone progress synced to your account.');
    })
    .catch((error) => {
      if (activeUserId !== userId) return;
      console.error('Milestone progress could not sync to the learner account.', error);
      report('Progress is saved on this device, but account sync failed. Check your connection and try again.');
    });
}

function scheduleAccountSave(value) {
  if (!activeUserId) return;
  const userId = activeUserId;
  const progress = normalizeMilestoneProgress(value);
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    if (activeUserId === userId) writeAccountProgress(userId, progress);
  }, 350);
}

async function hydrateAccount(userId, version) {
  const currentOwner = localStorage.getItem(OWNER_KEY);
  const localProgress = currentOwner && currentOwner !== userId
    ? normalizeMilestoneProgress(DEFAULT_PROGRESS)
    : readLocalProgress();

  if (currentOwner && currentOwner !== userId) {
    applyingAccountProgress = true;
    bridge.apply(normalizeMilestoneProgress(DEFAULT_PROGRESS), false);
    applyingAccountProgress = false;
  }

  try {
    const records = await getUserProgress(userId);
    if (activeUserId !== userId || hydrationVersion !== version) return;
    const remoteRecord = records.find(
      (entry) => entry.lessonType === 'milestone' && entry.lessonId === 'v25-life-adventures',
    );
    const remoteProgress = remoteRecord?.meta;
    const merged = mergeMilestoneProgress(localProgress, remoteProgress);

    applyingAccountProgress = true;
    bridge.apply(merged);
    localStorage.setItem(OWNER_KEY, userId);
    applyingAccountProgress = false;

    if (hasMilestoneProgress(merged) && JSON.stringify(merged) !== JSON.stringify(normalizeMilestoneProgress(remoteProgress))) {
      writeAccountProgress(userId, merged);
    } else {
      report('Milestone progress synced to your account.');
    }
  } catch (error) {
    applyingAccountProgress = false;
    if (activeUserId !== userId || hydrationVersion !== version) return;
    console.error('Milestone progress could not load from the learner account.', error);
    report('Progress is saved on this device, but account sync failed. Check your connection and try again.');
  }
}

window.addEventListener(PROGRESS_EVENT, (event) => {
  if (applyingAccountProgress || !activeUserId) return;
  const progress = normalizeMilestoneProgress(JSON.parse(event.detail.value));
  scheduleAccountSave(progress);
});

report('Progress is saved on this device. Sign in to sync it across devices.');

if (isSupabaseConfigured && supabase) {
  const handleSession = (userId) => {
    if (userId === activeUserId) return;
    activeUserId = userId;
    const version = ++hydrationVersion;
    if (userId) {
      void hydrateAccount(userId, version);
    } else {
      report('Progress is saved on this device. Sign in to sync it across devices.');
    }
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    handleSession(session?.user?.id || null);
  });

  void supabase.auth.getSession().then(({ data, error }) => {
    if (error) throw error;
    handleSession(data.session?.user?.id || null);
  }).catch((error) => {
    console.error('Milestone progress could not check the account session.', error);
    report('Progress is saved on this device, but sign-in status could not be checked.');
  });

  window.addEventListener('pagehide', () => subscription.unsubscribe(), { once: true });
}

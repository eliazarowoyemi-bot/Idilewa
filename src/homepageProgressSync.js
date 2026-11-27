import {
  getUserProgress,
  restoreAuthSession,
  saveProgress,
} from './supabaseClient.js';
import { installHomepageLearningView } from './homepageLearningView.js';

const LESSON_TYPE = 'homepage-academy-stage';
const TOTAL_STAGES = 20;

function isAcademyRecord(record) {
  const { language, level, age, stage } = record?.meta || {};
  return record?.lessonType === LESSON_TYPE
    && typeof language === 'string'
    && typeof level === 'string'
    && typeof age === 'string'
    && Number.isInteger(stage)
    && stage >= 1
    && stage <= TOTAL_STAGES;
}

export function createHomepageProgressSync({
  restoreSession = restoreAuthSession,
  getProgress = getUserProgress,
  save = saveProgress,
  setStatus = () => {},
  applyProgress = () => {},
  onAuthSessionChecked = () => {},
} = {}) {
  let accountTask = null;
  let accountRecords = [];

  async function loadAccount() {
    if (!accountTask) {
      accountTask = (async () => {
        let user;
        try {
          user = await restoreSession();
        } catch (error) {
          onAuthSessionChecked({ user: null, error });
          throw error;
        }
        onAuthSessionChecked({ user, error: null });
        if (!user?.id) return null;

        const records = await getProgress(user.id);
        accountRecords = records.filter(isAcademyRecord);
        applyProgress(accountRecords);
        return user;
      })().catch((error) => {
        accountTask = null;
        throw error;
      });
    }

    return accountTask;
  }

  async function initialize() {
    try {
      await loadAccount();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Account progress could not be loaded.';
      setStatus(`Your device-saved progress is unchanged, but account progress could not be loaded: ${message}`);
    }
  }

  async function handleCompletion(completion) {
    const { language, level, age, stage } = completion || {};
    if (typeof language !== 'string'
      || typeof level !== 'string'
      || typeof age !== 'string'
      || !Number.isInteger(stage)
      || stage < 0
      || stage >= TOTAL_STAGES) {
      setStatus('This stage could not be synced. Your device-saved progress is unchanged.');
      return;
    }

    let user;
    try {
      user = await loadAccount();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'The account service could not be reached.';
      setStatus(`Your lesson remains saved on this device, but account sync failed: ${message}`);
      return;
    }

    if (!user?.id) {
      setStatus('Lesson progress is saved on this device. Sign in to sync it across devices.');
      return;
    }

    const lessonId = [
      language,
      level,
      age,
      `stage-${stage + 1}`,
    ].map(encodeURIComponent).join(':');

    let record;
    try {
      record = await save({
        userId: user.id,
        lessonType: LESSON_TYPE,
        lessonId,
        meta: { language, level, age, stage: stage + 1 },
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'The account service could not save this stage.';
      setStatus(`Your lesson remains saved on this device, but account sync failed: ${message}`);
      return;
    }

    accountRecords = [
      ...accountRecords.filter((item) => item.lessonId !== record.lessonId),
      record,
    ];
    try {
      applyProgress(accountRecords);
      setStatus('Stage progress synced to your account.');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'The account progress summary could not be refreshed.';
      setStatus(`Stage saved to your account, but the progress summary could not be refreshed: ${message}`);
    }
  }

  return { handleCompletion, initialize };
}

export function installHomepageProgressSync({
  windowObject = window,
  documentObject = document,
  ...dependencies
} = {}) {
  const feedback = documentObject.getElementById('feedback');
  const progressSummary = documentObject.getElementById('progressSummary');
  const originalAnswer = windowObject.answer;
  const originalRenderProgress = windowObject.renderProgress;
  if (!feedback || !progressSummary
    || typeof originalAnswer !== 'function'
    || typeof originalRenderProgress !== 'function') {
    throw new Error('Homepage lesson progress controls could not be initialized.');
  }

  const status = documentObject.createElement('p');
  status.className = 'notice';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  feedback.insertAdjacentElement('afterend', status);

  const accountSummary = documentObject.createElement('div');
  accountSummary.id = 'accountProgressSummary';
  accountSummary.hidden = true;
  progressSummary.insertAdjacentElement('afterend', accountSummary);

  function renderAccountProgress(records) {
    accountSummary.replaceChildren();
    accountSummary.hidden = false;

    const heading = documentObject.createElement('h3');
    heading.textContent = 'Progress saved to your account';
    accountSummary.append(heading);

    const groups = new Map();
    records.forEach((record) => {
      const { language, level, age, stage } = record.meta;
      const label = `${language} · ${level} · Ages ${age}`;
      if (!groups.has(label)) groups.set(label, new Set());
      groups.get(label).add(stage);
    });

    if (!groups.size) {
      const empty = documentObject.createElement('p');
      empty.textContent = 'No stages have been synced to your account yet.';
      accountSummary.append(empty);
      return;
    }

    groups.forEach((stages, label) => {
      const item = documentObject.createElement('p');
      item.textContent = `${label}: ${stages.size} / ${TOTAL_STAGES} stages completed.`;
      accountSummary.append(item);
    });
  }

  const sync = createHomepageProgressSync({
    ...dependencies,
    setStatus(message) {
      status.textContent = message;
      status.hidden = !message;
    },
    applyProgress: renderAccountProgress,
    onAuthSessionChecked({ user, error }) {
      if (user?.id) return;
      const initialErrorMessage = error
        ? 'We could not verify your saved sign-in. Please sign in to continue to the homepage.'
        : '';
      void import('./authDialog.js').then(({ openAuthDialog }) => {
        openAuthDialog({
          role: 'parent',
          mode: error ? 'signin' : 'signup',
          required: true,
          returnToHomepage: true,
          initialErrorMessage,
        });
      }).catch((loadError) => {
        console.error('The homepage account dialog could not be opened.', loadError);
        status.textContent = 'Sign in or create an account to continue. Reload the page to try again.';
        status.hidden = false;
      });
    },
  });

  windowObject.renderProgress = function renderProgressWithAccountData(...args) {
    const result = originalRenderProgress.apply(this, args);
    if (!accountSummary.hidden) {
      progressSummary.insertAdjacentElement('afterend', accountSummary);
    }
    return result;
  };

  windowObject.answer = function answerWithAccountSync(button, correct, ...args) {
    const result = originalAnswer.call(this, button, correct, ...args);
    if (correct === true
      && button?.classList?.contains('good')
      && button.dataset.homepageProgressSync !== 'true') {
      button.dataset.homepageProgressSync = 'true';
      const courseTitle = documentObject.getElementById('courseTitle')?.textContent || '';
      const [language, level] = courseTitle.split(' · ');
      const age = (documentObject.getElementById('journeyAge')?.textContent || '')
        .replace(/^Ages\s+/i, '');
      const stageMatch = (documentObject.getElementById('stageCounter')?.textContent || '')
        .match(/\bStage\s+(\d+)\s+of\s+20\b/);

      if (!stageMatch) {
        status.textContent = 'Your lesson remains saved on this device, but its stage could not be synced.';
        status.hidden = false;
      } else {
        void sync.handleCompletion({
          language,
          level,
          age,
          stage: Number(stageMatch[1]) - 1,
        });
      }
    }
    return result;
  };

  void sync.initialize();

  return () => {
    windowObject.answer = originalAnswer;
    windowObject.renderProgress = originalRenderProgress;
    status.remove();
    accountSummary.remove();
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  installHomepageLearningView();
  installHomepageProgressSync();
}

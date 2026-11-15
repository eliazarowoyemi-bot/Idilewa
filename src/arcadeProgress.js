import {
  getCurrentUser,
  isSupabaseConfigured,
  restoreAuthSession,
  saveProgress,
} from './supabaseClient.js';
import { verifyGameCompletionMessage } from './gameCompletion.js';

const progressStatus = document.getElementById('progressStatus');
const gameFrame = document.getElementById('gameFrame')
  || document.getElementById('arcade-merged-frame');

if (!progressStatus) throw new Error('The arcade progress status element is missing.');
if (!gameFrame) throw new Error('The arcade game frame is missing.');

let sessionReady = Promise.resolve(true);
if (isSupabaseConfigured) {
  progressStatus.textContent = 'Checking your saved sign-in…';
  sessionReady = restoreAuthSession().then(
    () => true,
    (error) => {
      console.error('The arcade could not restore the saved sign-in.', error);
      progressStatus.textContent = 'Your sign-in could not be checked. Reload the page or sign in again before saving account progress.';
      return false;
    },
  );
}

window.addEventListener('message', async (event) => {
  const completion = verifyGameCompletionMessage(event, gameFrame, window.location.origin);
  if (!completion || !(await sessionReady)) return;

  try {
    const user = isSupabaseConfigured ? getCurrentUser() : null;
    progressStatus.textContent = 'Saving completed game progress…';
    await saveProgress({
      userId: user?.id || null,
      lessonType: 'coding',
      lessonId: `kids-arcade-${completion.game}`,
      meta: {
        outcome: completion.outcome,
        score: completion.score,
        difficulty: completion.difficulty,
        language: completion.language,
      },
    });
    progressStatus.textContent = user?.id
      ? 'Game progress saved to your Idilewa account.'
      : 'Game progress saved on this device. Sign in to sync it across devices.';
  } catch (error) {
    console.error('Arcade game progress could not be saved.', error);
    progressStatus.textContent = 'Your game was completed, but progress could not be saved. Check your connection or browser storage, then try again.';
  }
});

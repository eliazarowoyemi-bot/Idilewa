import {
  completeAuthCallback,
  isSignupPasswordValid,
  updateAccountPassword,
} from './supabaseClient.js';

const status = document.getElementById('authCallbackStatus');
const recoveryForm = document.getElementById('authRecoveryForm');
const recoveryError = document.getElementById('authRecoveryError');
const loginLink = document.getElementById('authCallbackLogin');

function showError(message) {
  status.textContent = message;
  loginLink.hidden = false;
}

async function initializeAuthCallback() {
  let callback;
  try {
    callback = await completeAuthCallback(window.location.href);
  } catch (error) {
    showError(error instanceof Error ? error.message : 'This sign-in link could not be verified.');
  }

  if (callback?.type === 'recovery') {
    status.textContent = 'Your email is verified. Choose a new password to finish recovery.';
    recoveryForm.hidden = false;
  } else if (callback) {
    const next = new URLSearchParams(window.location.search).get('next');
    const destination = ['index', 'login', 'profile', 'tutor-login'].includes(next || '') ? next : 'index';
    window.location.replace(destination === 'login' ? '/#/login?mode=signin' : `/#/${destination}`);
  }
}

void initializeAuthCallback();

recoveryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  recoveryError.hidden = true;
  const password = document.getElementById('authRecoveryPassword').value;
  const confirmation = document.getElementById('authRecoveryConfirm').value;
  if (!isSignupPasswordValid(password)) {
    recoveryError.textContent = 'Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.';
    recoveryError.hidden = false;
    return;
  }
  if (password !== confirmation) {
    recoveryError.textContent = 'The passwords do not match.';
    recoveryError.hidden = false;
    return;
  }

  const submitButton = recoveryForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    await updateAccountPassword(password);
    status.textContent = 'Your password has been updated. Returning to Idilewa…';
    window.location.replace('/#/index');
  } catch (error) {
    recoveryError.textContent = error instanceof Error ? error.message : 'Your password could not be updated.';
    recoveryError.hidden = false;
    submitButton.disabled = false;
  }
});

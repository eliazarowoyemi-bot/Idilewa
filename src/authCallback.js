import {
  clearPendingEducatorGoogleSignup,
  completeEducatorGoogleSignup,
  completeAuthCallback,
  getPendingEducatorGoogleSignup,
  isSignupPasswordValid,
  restoreAuthSession,
  signOut as signOutAccount,
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

function showTutorSignup(message) {
  status.textContent = message;
  loginLink.href = '/educator-portal.html#/tutor-signup';
  loginLink.textContent = 'Continue tutor sign-up';
  loginLink.hidden = false;
}

function showTutorLogin(message) {
  status.textContent = message;
  loginLink.href = '/educator-portal.html#/tutor-login';
  loginLink.textContent = 'Return to tutor sign in';
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
    const destination = ['index', 'login', 'profile', 'tutor-login', 'parent-dashboard'].includes(next || '') ? next : 'index';
    if (destination === 'tutor-login') {
      const providers = callback.session.user.app_metadata?.providers;
      const isGoogleAccount = Array.isArray(providers) && providers.includes('google');
      let pendingSignup;
      try {
        pendingSignup = getPendingEducatorGoogleSignup();
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Your pending Google tutor signup could not be read.');
        return;
      }

      if (pendingSignup) {
        if (!isGoogleAccount) {
          showTutorSignup('This tutor signup was started with Google. Return to the tutor signup page and try again.');
          return;
        }
        try {
          await completeEducatorGoogleSignup({
            accessToken: callback.session.access_token,
            ...pendingSignup,
          });
          clearPendingEducatorGoogleSignup();
          const user = await restoreAuthSession();
          if (user?.role !== 'educator') {
            throw new Error('Google sign-in succeeded, but the educator role could not be confirmed.');
          }
          window.location.replace('/educator-portal.html#/tutor-dashboard');
        } catch (error) {
          try {
            await signOutAccount({ notify: false });
          } catch (signOutError) {
            showTutorLogin(`${error instanceof Error ? error.message : 'Google tutor sign-up could not be completed.'} Your sign-in could not be cleared; contact Idilewa support.`);
            return;
          }
          showTutorSignup(error instanceof Error ? error.message : 'Google tutor sign-up could not be completed. Review your details and try again.');
        }
        return;
      }

      if (callback.user.role === 'educator') {
        window.location.replace(isGoogleAccount
          ? '/educator-portal.html#/tutor-dashboard'
          : '/educator-portal.html#/tutor-login');
        return;
      }

      if (isGoogleAccount && callback.user.role === 'adult') {
        showTutorSignup('This Google account is ready. Complete the tutor details and enter your one-time invitation to register as an educator.');
        return;
      }

      try {
        await signOutAccount({ notify: false });
      } catch {
        showTutorLogin('This Google account is not an educator account, and its sign-in could not be cleared. Contact Idilewa support.');
        return;
      }
      showTutorLogin('This account is not registered as an Idilewa tutor. Use a tutor account or complete tutor sign-up.');
      return;
    }
    const redirectUrl = destination === 'tutor-login'
      ? '/educator-portal.html#/tutor-login'
      : destination === 'login'
        ? '/#/login?mode=signin'
        : `/#/${destination}`;
    window.location.replace(redirectUrl);
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

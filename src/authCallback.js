import {
  clearPendingEducatorGoogleSignup,
  completeEducatorGoogleSignup,
  completeParentGoogleSignup,
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
const tutorSignupForm = document.getElementById('authTutorSignupForm');
const tutorSignupEmail = document.getElementById('authTutorSignupEmail');
const tutorSignupError = document.getElementById('authTutorSignupError');
const title = document.getElementById('authCallbackTitle');
let tutorSignupSession = null;
let tutorSignupReturnToHomepage = false;

function showError(message) {
  status.textContent = message;
  loginLink.hidden = false;
}

function showTutorSignupLink(message) {
  status.textContent = message;
  loginLink.href = '/educator-portal.html#/tutor-signup';
  loginLink.textContent = 'Continue tutor sign-up';
  loginLink.hidden = false;
}

function showTutorSignupForm(message, session, returnToHomepage, pendingSignup = null) {
  if (!session?.access_token) {
    showTutorSignupLink('Sign in with Google to complete tutor registration.');
    return;
  }
  title.textContent = 'Complete your tutor sign-up';
  status.textContent = message;
  tutorSignupSession = session;
  tutorSignupReturnToHomepage = returnToHomepage;
  tutorSignupEmail.textContent = session.user?.email || 'Verified Google account';
  tutorSignupForm.hidden = false;
  loginLink.href = '/';
  loginLink.textContent = 'Return to homepage';
  loginLink.hidden = false;

  const values = {
    firstName: pendingSignup?.firstName || '',
    lastName: pendingSignup?.lastName || '',
    country: pendingSignup?.profile?.country || '',
    timeZone: pendingSignup?.profile?.timeZone || '',
    teachingSubject: pendingSignup?.profile?.teachingSubject || '',
    teachingExperience: pendingSignup?.profile?.teachingExperience || '',
    qualifications: pendingSignup?.profile?.qualifications || '',
  };
  for (const [name, value] of Object.entries(values)) {
    tutorSignupForm.elements.namedItem(name).value = value;
  }
}

function showTutorLogin(message) {
  status.textContent = message;
  loginLink.href = '/educator-portal.html#/tutor-login';
  loginLink.textContent = 'Return to tutor sign in';
  loginLink.hidden = false;
}

function showParentSignup(message) {
  status.textContent = message;
  loginLink.href = '/parents.html#/parent-signup';
  loginLink.textContent = 'Return to parent sign-up';
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
    const callbackParams = new URLSearchParams(window.location.search);
    const next = callbackParams.get('next');
    const returnToHomepage = callbackParams.get('returnTo') === 'index';
    const destination = ['index', 'login', 'profile', 'tutor-login', 'parent-dashboard', 'parent-signup'].includes(next || '') ? next : 'index';
    if (destination === 'parent-signup') {
      try {
        const providers = callback.session.user.app_metadata?.providers;
        if (!Array.isArray(providers) || !providers.includes('google')) {
          throw new Error('Use a verified Google account to complete parent registration.');
        }
        await completeParentGoogleSignup({ accessToken: callback.session.access_token });
        const user = await restoreAuthSession();
        if (user?.role !== 'parent') {
          throw new Error('Google sign-in succeeded, but the parent role could not be confirmed.');
        }
        window.location.replace(returnToHomepage ? '/' : '/parents.html#/parent-dashboard');
      } catch (error) {
        try {
          await signOutAccount({ notify: false });
        } catch {
          showParentSignup(`${error instanceof Error ? error.message : 'Google parent signup could not be completed.'} Your sign-in could not be cleared; contact Idilewa support.`);
          return;
        }
        showParentSignup(error instanceof Error ? error.message : 'Google parent signup could not be completed. Please try again.');
      }
      return;
    }
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
          showTutorSignupLink('This tutor signup was started with Google. Return to the tutor signup page and try again.');
          return;
        }
        try {
          clearPendingEducatorGoogleSignup();
        } catch (error) {
          showTutorSignupForm(
            error instanceof Error ? error.message : 'Your tutor details could not be prepared for completion.',
            callback.session,
            returnToHomepage,
            pendingSignup,
          );
          return;
        }
        let signupCompleted = false;
        try {
          await completeEducatorGoogleSignup({
            accessToken: callback.session.access_token,
            ...pendingSignup,
          });
          signupCompleted = true;
          const user = await restoreAuthSession();
          if (user?.role !== 'educator') {
            throw new Error('Google sign-in succeeded, but the educator role could not be confirmed.');
          }
          window.location.replace(returnToHomepage ? '/' : '/educator-portal.html#/tutor-dashboard');
        } catch (error) {
          if (signupCompleted) {
            showTutorLogin(
              `${error instanceof Error ? error.message : 'Your tutor account is ready.'} Sign in again to continue.`,
            );
          } else {
            showTutorSignupForm(
              `${error instanceof Error ? error.message : 'Google tutor sign-up could not be completed.'} Review your details and try again.`,
              callback.session,
              returnToHomepage,
              pendingSignup,
            );
          }
        }
        return;
      }

      if (callback.user.role === 'educator') {
        window.location.replace(returnToHomepage
          ? '/'
          : isGoogleAccount
            ? '/educator-portal.html#/tutor-dashboard'
            : '/educator-portal.html#/tutor-login');
        return;
      }

      if (isGoogleAccount && callback.user.role === 'adult') {
        showTutorSignupForm(
          'Your Google account is ready. Complete these tutor details to finish registration.',
          callback.session,
          returnToHomepage,
        );
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
        ? '/parents.html#/parent-login'
        : `/#/${destination}`;
    window.location.replace(redirectUrl);
  }
}

void initializeAuthCallback();

tutorSignupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  tutorSignupError.hidden = true;
  if (!tutorSignupSession?.access_token) {
    showTutorSignupLink('Your Google session expired. Sign in with Google again to complete tutor registration.');
    return;
  }
  if (!tutorSignupForm.reportValidity()) return;

  const formData = new FormData(tutorSignupForm);
  const submitButton = tutorSignupForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Completing tutor sign-up…';
  let signupCompleted = false;
  try {
    await completeEducatorGoogleSignup({
      accessToken: tutorSignupSession.access_token,
      firstName: String(formData.get('firstName') || ''),
      lastName: String(formData.get('lastName') || ''),
      educatorProfile: {
        country: String(formData.get('country') || ''),
        timeZone: String(formData.get('timeZone') || ''),
        teachingSubject: String(formData.get('teachingSubject') || ''),
        teachingExperience: String(formData.get('teachingExperience') || ''),
        qualifications: String(formData.get('qualifications') || ''),
      },
    });
    signupCompleted = true;
    const user = await restoreAuthSession();
    if (user?.role !== 'educator') {
      throw new Error('Your tutor account is ready, but your educator profile could not be confirmed.');
    }
    window.location.replace(tutorSignupReturnToHomepage
      ? '/'
      : '/educator-portal.html#/tutor-dashboard');
  } catch (error) {
    if (signupCompleted) {
      showTutorLogin(
        `${error instanceof Error ? error.message : 'Your tutor account is ready.'} Sign in again to continue.`,
      );
      return;
    }
    tutorSignupError.textContent = error instanceof Error
      ? error.message
      : 'Your tutor account could not be completed. Review your details and try again.';
    tutorSignupError.hidden = false;
    tutorSignupError.focus();
  } finally {
    if (submitButton.isConnected && !signupCompleted) {
      submitButton.disabled = false;
      submitButton.textContent = 'Complete tutor sign-up';
    }
  }
});

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

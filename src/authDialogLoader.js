import { getAuthIntent } from './authIntent.js';

let authDialogPromise;

function intentFromLocation() {
  const url = new URL(window.location.href);
  return getAuthIntent({
    href: url.href,
    route: url.hash,
    role: url.searchParams.get('role') || '',
    mode: url.searchParams.get('mode') || '',
  });
}

function loadAuthDialog(intent) {
  if (!authDialogPromise) {
    authDialogPromise = import('./authDialog.js').catch((error) => {
      authDialogPromise = undefined;
      console.error('The shared account dialog could not be loaded.', error);
      throw error;
    });
  }

  return authDialogPromise.then(({ openAuthDialog }) => {
    if (intent) openAuthDialog(intent);
  });
}

function handleAuthTrigger(event) {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest('a, button');
  if (!trigger || document.querySelector('dialog.id-auth-dialog')?.contains(trigger)) return;

  const inlineRoute = trigger.getAttribute('onclick')?.match(/go\(['"]([^'"]+)['"]\)/)?.[1] || '';
  const intent = getAuthIntent({
    href: trigger.getAttribute('href') || '',
    route: trigger.dataset.route || trigger.dataset.idilewaRoute || inlineRoute,
    label: trigger.getAttribute('aria-label') || trigger.innerText || trigger.textContent || '',
    role: trigger.dataset.authRole || '',
    mode: trigger.dataset.authMode || trigger.dataset.authOpen || '',
  });
  if (!intent) return;

  event.preventDefault();
  event.stopPropagation();
  void loadAuthDialog(intent);
}

document.addEventListener('click', handleAuthTrigger, true);
window.addEventListener('hashchange', () => {
  if (intentFromLocation()) void loadAuthDialog();
});

if (intentFromLocation()) void loadAuthDialog();

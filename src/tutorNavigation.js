import '../styles/tutor-navigation.css';

const header = document.querySelector('.top');
const logo = header?.querySelector('.logo');
const nav = header?.querySelector('#nav');
const applicationForm = document.querySelector('#applyForm');

if (!header || !logo || !nav || !applicationForm) {
  throw new Error('Tutor page navigation could not find its header elements.');
}

const actions = document.createElement('div');
actions.className = 'tutor-navigation-actions';

const backButton = document.createElement('button');
backButton.type = 'button';
backButton.className = 'tutor-navigation-link';
backButton.textContent = '← Back';
backButton.setAttribute('aria-label', 'Go back to the previous page');
backButton.addEventListener('click', () => {
  const referrer = document.referrer;
  const currentUrl = new URL(window.location.href);
  const previousUrl = referrer ? new URL(referrer) : null;
  const canGoBack = previousUrl
    && previousUrl.origin === currentUrl.origin
    && previousUrl.href !== currentUrl.href
    && window.history.length > 1;

  if (canGoBack) {
    window.history.back();
  } else {
    window.location.assign('./index.html');
  }
});

const homeLink = document.createElement('a');
homeLink.className = 'tutor-navigation-link';
homeLink.href = './index.html';
homeLink.textContent = 'Home';
homeLink.setAttribute('aria-label', 'Go to Idilewa home');

const brandLink = document.createElement('a');
brandLink.className = 'tutor-brand-link';
brandLink.href = './index.html';
brandLink.setAttribute('aria-label', 'Ìdíléwa home');
logo.replaceWith(brandLink);
brandLink.append(logo);

actions.append(backButton, homeLink);
header.insertBefore(actions, brandLink);
header.insertBefore(brandLink, nav);

function createPortalLink(route, label) {
  const link = document.createElement('a');
  link.className = 'tutor-portal-link';
  link.href = `./educator-portal.html#/${route}`;
  link.textContent = label;
  return link;
}

nav.querySelector('[data-go="tutor"]')?.replaceWith(createPortalLink('tutor-dashboard', 'Tutor Dashboard'));
nav.querySelector('[data-go="apply"]')?.replaceWith(createPortalLink('tutor-signup', 'Become a Tutor'));

const signupPanel = document.createElement('div');
signupPanel.className = 'card tutor-signup-cta';
const signupHeading = document.createElement('h3');
signupHeading.textContent = 'Ready to teach with Ìdíléwa?';
const signupDescription = document.createElement('p');
signupDescription.className = 'muted';
signupDescription.textContent = 'Create an educator account with your one-time invitation code. Your application details and sign-in stay in the secure tutor portal.';
const signupActions = document.createElement('div');
signupActions.className = 'actions';
signupActions.append(
  createPortalLink('tutor-signup', 'Create Tutor Account'),
  createPortalLink('tutor-login', 'Already registered? Sign in'),
);
signupPanel.append(signupHeading, signupDescription, signupActions);
applicationForm.replaceWith(signupPanel);

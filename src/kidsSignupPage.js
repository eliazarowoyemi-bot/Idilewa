import { getCurrentUser, getSessionAccessToken, restoreAuthSession } from './supabaseClient.js';

const form = document.getElementById('signup');
const submitButton = document.getElementById('signupButton');
const status = document.getElementById('signupStatus');
const prompt = document.getElementById('accountPrompt');
let parentReady = false;

function showStatus(message, kind = '') {
  status.textContent = message;
  status.classList.toggle('is-error', kind === 'error');
}

async function readJson(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.ok
      ? 'The child-profile service returned an unexpected response.'
      : 'The child-profile service could not be reached. Please try again later.');
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error('The child-profile service returned an unreadable response. Please try again later.', { cause: error });
  }
}

function setAccountPrompt(user) {
  prompt.replaceChildren();
  if (user?.role === 'parent') {
    document.getElementById('parentName').value = user.name || '';
    document.getElementById('parentEmail').value = user.email || '';
    parentReady = true;
    prompt.textContent = `Signed in as ${user.email}. The profile will belong to your parent account.`;
    return;
  }

  parentReady = false;
  const message = document.createTextNode('A verified parent account is required to create and manage child profiles. ');
  const signIn = document.createElement('a');
  signIn.href = '/parents.html#/parent-login';
  signIn.textContent = 'Sign in';
  const separator = document.createTextNode(' or ');
  const signUp = document.createElement('a');
  signUp.href = '/parents.html#/parent-signup';
  signUp.textContent = 'create a parent account';
  prompt.append(message, signIn, separator, signUp, document.createTextNode(' first.'));
}

async function initialize() {
  try {
    await restoreAuthSession();
    setAccountPrompt(getCurrentUser());
  } catch (error) {
    setAccountPrompt(null);
    showStatus(error instanceof Error ? error.message : 'Your parent account could not be checked.', 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  showStatus('');
  if (!form.reportValidity()) return;
  if (!parentReady || getCurrentUser()?.role !== 'parent') {
    showStatus('Sign in to a verified parent account before creating a child profile.', 'error');
    return;
  }

  const languages = [...form.querySelectorAll('input[name="languages"]:checked')].map((input) => input.value);
  if (!languages.length) {
    showStatus('Choose at least one preferred language for your child.', 'error');
    form.querySelector('input[name="languages"]')?.focus();
    return;
  }
  if (document.getElementById('website').value) {
    showStatus('The request could not be completed. Please refresh the page and try again.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Sending consent request…';
  try {
    const token = await getSessionAccessToken();
    const body = {
      childName: document.getElementById('childName').value.trim(),
      ageGroup: document.getElementById('age').value,
      gender: form.querySelector('input[name="gender"]:checked')?.value || null,
      avatar: form.querySelector('input[name="avatar"]:checked')?.value || 'a1',
      languages,
      interests: [...form.querySelectorAll('input[name="interests"]:checked')].map((input) => input.value),
      parentName: document.getElementById('parentName').value.trim(),
      parentEmail: document.getElementById('parentEmail').value.trim(),
      relationship: document.getElementById('relationship').value,
      consent: document.getElementById('consent').checked,
      marketingOptIn: document.getElementById('updates').checked,
    };
    const response = await fetch('/api/guardian/children', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const result = await readJson(response);
    if (!response.ok) throw new Error(result?.error || 'The child profile could not be created.');
    showStatus(result.message || 'Check your email to confirm guardian consent. The child profile is not active until then.');
    submitButton.textContent = 'Consent email sent';
  } catch (error) {
    showStatus(error instanceof Error ? error.message : 'The consent request could not be sent. Please try again.', 'error');
    submitButton.disabled = false;
    submitButton.textContent = 'Create Child Profile →';
  }
});

void initialize();

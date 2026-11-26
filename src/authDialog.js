import './authDialog.css';
import { getAuthIntent } from './authIntent.js';
import {
  beginEducatorGoogleSignup,
  getCurrentUser,
  getSessionAccessToken,
  isGoogleAuthEnabled,
  isSignupPasswordValid,
  isSupabaseConfigured,
  resendSignupConfirmation,
  requestPasswordReset,
  restoreAuthSession,
  sendAuthActivityEmail,
  signIn,
  signInWithGoogle,
  signUp,
} from './supabaseClient.js';

const state = {
  role: 'parent',
  mode: 'signup',
  screen: 'form',
  pendingChild: false,
  parentCheck: 'idle',
  parentCheckError: '',
  parent: null,
  pendingEmail: '',
  feedback: null,
  result: null,
  cordY: 300,
  draggingCord: false,
  suppressCordClick: false,
};

let dialog;
let googleProbe = 0;
let parentCheck = 0;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function roleButton(role, title, detail) {
  return `<button type="button" class="id-auth-role" data-auth-role="${role}" aria-pressed="${state.role === role}">
    <span>${title}</span><small>${detail}</small>
  </button>`;
}

function modeButton(mode, label) {
  return `<button type="button" class="id-auth-mode" data-auth-mode="${mode}" aria-pressed="${state.mode === mode}">${label}</button>`;
}

function feedbackMarkup() {
  const feedback = state.feedback;
  return `<p class="id-auth-feedback${feedback?.kind === 'error' ? ' is-error' : ''}" data-auth-feedback role="${feedback?.kind === 'error' ? 'alert' : 'status'}" aria-live="polite" tabindex="-1"${feedback?.message ? '' : ' hidden'}>${escapeHtml(feedback?.message || '')}</p>`;
}

function passwordField({ id, name, label, autocomplete, minlength, required = true, confirm = false }) {
  return `<label class="id-auth-field${confirm ? ' id-auth-span' : ''}" for="${id}">${label}
    <span class="id-auth-password">
      <input id="${id}" name="${name}" type="password" autocomplete="${autocomplete}" minlength="${minlength}" maxlength="128"${required ? ' required' : ''} />
      <button type="button" class="id-auth-password-toggle" data-auth-toggle-password aria-label="Show password" aria-pressed="false">Show</button>
    </span>
  </label>`;
}

function parentForm() {
  const signup = state.mode === 'signup';
  return `<form class="id-auth-form" data-auth-form="parent" data-mode="${state.mode}" aria-labelledby="id-auth-form-title" autocomplete="on">
    <h3 id="id-auth-form-title">${signup ? 'Create your parent account' : 'Sign in to your family account'}</h3>
    <p class="id-auth-form-copy">${signup
      ? 'Create your account and give your child the gift of a global voice.'
      : 'Welcome back. Sign in to continue to your family learning dashboard.'}</p>
    ${signup ? `<div class="id-auth-google" data-auth-google hidden>
      <span>Or sign up with</span>
      <button type="button" data-auth-google-action="signup">
        <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.75 6.01c4.52-4.18 7.09-10.34 7.09-17.72Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1-.75-4.59c0-1.59.27-3.13.75-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.73l-7.75-6.01c-2.15 1.45-4.9 2.31-8.15 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
        Sign up with Google
      </button>
    </div>` : ''}
    <div class="id-auth-fields">
      ${signup ? `<label class="id-auth-field id-auth-span" for="id-auth-parent-name">Full name
        <input id="id-auth-parent-name" name="name" autocomplete="name" maxlength="60" required />
      </label>` : ''}
      <label class="id-auth-field${signup ? '' : ' id-auth-span'}" for="id-auth-parent-email">Email address
        <input id="id-auth-parent-email" name="email" type="email" autocomplete="${signup ? 'email' : 'username'}" autocapitalize="none" spellcheck="false" maxlength="254" required />
      </label>
      ${signup ? `<label class="id-auth-field" for="id-auth-parent-phone">Phone number
        <input id="id-auth-parent-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" pattern="[+]?[0-9() -]{7,24}" maxlength="24" required />
      </label>` : ''}
      ${passwordField({
        id: 'id-auth-parent-password',
        name: 'password',
        label: 'Password',
        autocomplete: signup ? 'new-password' : 'current-password',
        minlength: signup ? '12' : '1',
        confirm: signup,
      })}
    </div>
    ${signup ? '<p class="id-auth-hint id-auth-span">Use 12–128 characters, including uppercase and lowercase letters, a number, and a symbol.</p>' : ''}
    ${feedbackMarkup()}
    ${signup ? '' : '<button class="id-auth-secondary" type="button" data-auth-action="forgot-password">Forgot password?</button>'}
    <button class="id-auth-submit" type="submit">${signup ? 'Create parent account' : 'Sign in'}</button>
    <p class="id-auth-switch">${signup ? 'Already have a parent account?' : 'New to Idilewa?'}
      <button type="button" data-auth-mode="${signup ? 'signin' : 'signup'}">${signup ? 'Sign in' : 'Create an account'}</button>
    </p>
  </form>`;
}

function tutorForm() {
  const signup = state.mode === 'signup';
  const form = `<form class="id-auth-form" data-auth-form="tutor" data-mode="${state.mode}" aria-labelledby="id-auth-form-title" autocomplete="on">
    <h3 id="id-auth-form-title">${signup ? 'Create your tutor account' : 'Sign in to the tutor portal'}</h3>
    <p class="id-auth-form-copy">${signup
      ? 'Create your secure tutor account. No payment details are needed to join.'
      : 'Log in to continue your teaching journey.'}</p>
    <div class="id-auth-fields">
      ${signup ? `<label class="id-auth-field" for="id-auth-tutor-first-name">First name
        <input id="id-auth-tutor-first-name" name="firstName" autocomplete="given-name" maxlength="40" data-google-required required />
      </label>
      <label class="id-auth-field" for="id-auth-tutor-last-name">Last name
        <input id="id-auth-tutor-last-name" name="lastName" autocomplete="family-name" maxlength="40" data-google-required required />
      </label>
      <label class="id-auth-field id-auth-span" for="id-auth-tutor-email">Email address
        <input id="id-auth-tutor-email" name="email" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="254" required />
      </label>
      <label class="id-auth-field" for="id-auth-tutor-country">Country
        <select id="id-auth-tutor-country" name="country" autocomplete="country-name" data-google-required required>
          <option value="">Choose country</option><option>United Kingdom</option><option>Nigeria</option><option>Ghana</option><option>United States</option><option>Canada</option><option>Other</option>
        </select>
      </label>
      <label class="id-auth-field" for="id-auth-tutor-time-zone">Time zone
        <select id="id-auth-tutor-time-zone" name="timeZone" data-google-required required>
          <option value="">Choose time zone</option><option value="Europe/London">UK / London</option><option value="Africa/Lagos">Nigeria / Lagos</option><option value="Africa/Accra">Ghana / Accra</option><option value="America/New_York">US / Eastern</option><option value="America/Los_Angeles">US / Pacific</option><option value="other">Other</option>
        </select>
      </label>
      <label class="id-auth-field" for="id-auth-tutor-subject">Main teaching subject
        <select id="id-auth-tutor-subject" name="teachingSubject" data-google-required required>
          <option value="">Choose a subject</option><option>Yorùbá</option><option>Igbo</option><option>Hausa</option><option>Arabic</option><option>Kiswahili</option><option>Mathematics</option><option>English</option><option>Science</option><option>Coding</option><option>Other</option>
        </select>
      </label>
      <label class="id-auth-field" for="id-auth-tutor-experience">Teaching experience
        <select id="id-auth-tutor-experience" name="teachingExperience" data-google-required required>
          <option value="">Choose experience</option><option>Less than 1 year</option><option>1–3 years</option><option>4–7 years</option><option>8+ years</option>
        </select>
      </label>
      <label class="id-auth-field id-auth-span" for="id-auth-tutor-qualifications">Qualifications and experience
        <textarea id="id-auth-tutor-qualifications" name="qualifications" maxlength="600" rows="3" autocomplete="off" placeholder="Share relevant teaching experience or qualifications (optional)"></textarea>
      </label>
      ${passwordField({
        id: 'id-auth-tutor-password',
        name: 'password',
        label: 'Password',
        autocomplete: 'new-password',
        minlength: '12',
      })}
      ${passwordField({
        id: 'id-auth-tutor-confirm-password',
        name: 'confirmPassword',
        label: 'Confirm password',
        autocomplete: 'new-password',
        minlength: '12',
        confirm: true,
      })}
    </div>
    <p class="id-auth-hint">Use 12–128 characters, including uppercase and lowercase letters, a number, and a symbol.</p>
    <label class="id-auth-consent"><input type="checkbox" name="agreement" data-google-required required />
      <span>I agree to follow Idilewa’s child-safeguarding and privacy requirements.</span>
    </label>` : `<div class="id-auth-fields">
      <label class="id-auth-field id-auth-span" for="id-auth-tutor-email">Email address
        <input id="id-auth-tutor-email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="254" required />
      </label>
      ${passwordField({
        id: 'id-auth-tutor-password',
        name: 'password',
        label: 'Password',
        autocomplete: 'current-password',
        minlength: '1',
        confirm: true,
      })}
    </div>`}
    ${feedbackMarkup()}
    ${signup ? '' : '<button class="id-auth-secondary" type="button" data-auth-action="forgot-password">Forgot password?</button>'}
    <button class="id-auth-submit" type="submit">${signup ? 'Create tutor account' : 'Sign in'}</button>
    <p class="id-auth-switch">${signup ? 'Already have a tutor account?' : 'New to the tutor portal?'}
      <button type="button" data-auth-mode="${signup ? 'signin' : 'signup'}">${signup ? 'Sign in' : 'Create an account'}</button>
    </p>
  </form>
  <div class="id-auth-google" data-auth-google hidden>
    <span>Or use your Google account</span>
    <button type="button" data-auth-google-action="${signup ? 'signup' : 'signin'}">
      <svg aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.75 6.01c4.52-4.18 7.09-10.34 7.09-17.72Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1-.75-4.59c0-1.59.27-3.13.75-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.73l-7.75-6.01c-2.15 1.45-4.9 2.31-8.15 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
      Continue with Google
    </button>
    ${signup ? '<small>Google sign-up requires your tutor details and safeguarding agreement.</small>' : ''}
  </div>`;
  return form;
}

function childGate() {
  if (state.parentCheck === 'checking') {
    return `<section class="id-auth-gate"><h3>Checking your parent account</h3><p>We’re verifying that a parent or guardian account is signed in.</p><span class="id-auth-loader" aria-label="Checking account"></span></section>`;
  }
  const extra = state.parentCheckError
    ? `<p class="id-auth-feedback is-error" role="alert" aria-live="polite">${escapeHtml(state.parentCheckError)}</p>
       <button class="id-auth-secondary" type="button" data-auth-action="retry-parent-check">Try again</button>`
    : '';
  return `<section class="id-auth-gate"><h3>Children’s profiles need a parent or guardian</h3>
    <p>A verified parent account manages the profile and confirms consent. Children can’t create accounts independently.</p>
    ${extra}
    <div class="id-auth-gate-actions">
      <button class="id-auth-submit" type="button" data-auth-action="child-parent-signin">Sign in as a parent</button>
      <button class="id-auth-secondary" type="button" data-auth-action="child-parent-signup">Create a parent account</button>
    </div>
  </section>`;
}

function childForm() {
  const signup = state.mode === 'signup';
  if (!signup) {
    return `<form class="id-auth-form" data-auth-form="child" data-mode="signin" aria-labelledby="id-auth-form-title" autocomplete="on">
      <h3 id="id-auth-form-title">Sign in to your child account</h3>
      <p class="id-auth-form-copy">Use the email and password created with guardian approval. No guardian passcode is required.</p>
      <div class="id-auth-fields">
        <label class="id-auth-field id-auth-span" for="id-auth-child-email">Child email address
          <input id="id-auth-child-email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="254" required />
        </label>
        ${passwordField({ id: 'id-auth-child-password', name: 'password', label: 'Password', autocomplete: 'current-password', minlength: '1', confirm: true })}
      </div>
      ${feedbackMarkup()}
      <button class="id-auth-secondary" type="button" data-auth-action="forgot-password">Forgot password?</button>
      <button class="id-auth-submit" type="submit">Sign in</button>
    </form>`;
  }
  return `<form class="id-auth-form" data-auth-form="child" data-mode="signup" aria-labelledby="id-auth-form-title" autocomplete="on">
    <h3 id="id-auth-form-title">Create a child account</h3>
    <p class="id-auth-form-copy">A parent or guardian must approve the account. No guardian passcode is needed after approval.</p>
    <div class="id-auth-fields">
      <label class="id-auth-field" for="id-auth-child-name">Child name
        <input id="id-auth-child-name" name="name" autocomplete="name" maxlength="80" required />
      </label>
      <label class="id-auth-field" for="id-auth-child-email">Child email address
        <input id="id-auth-child-email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="254" required />
      </label>
      ${passwordField({ id: 'id-auth-child-password', name: 'password', label: 'Password', autocomplete: 'new-password', minlength: '12' })}
      ${passwordField({ id: 'id-auth-child-confirm-password', name: 'confirmPassword', label: 'Confirm password', autocomplete: 'new-password', minlength: '12', confirm: true })}
      <label class="id-auth-field id-auth-span" for="id-auth-child-approval-code">Guardian approval code
        <input id="id-auth-child-approval-code" name="approvalCode" type="text" inputmode="numeric" autocomplete="one-time-code" minlength="6" maxlength="6" pattern="[0-9]{6}" placeholder="6-digit code" required />
        <small>The code is emailed to the child after the parent or guardian approves.</small>
      </label>
    </div>
    ${feedbackMarkup()}
    <button class="id-auth-submit" type="submit">Verify approval and create account</button>
  </form>`;
}

function resultPanel() {
  const result = state.result;
  if (!result) return '';
  if (state.screen === 'confirmation') {
    return `<section class="id-auth-result">
      <span class="id-auth-result-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/></svg></span>
      <h3>Check your email</h3>
      <p>${escapeHtml(result.message)}</p>
      <p class="id-auth-result-email">${escapeHtml(state.pendingEmail)}</p>
      <p class="id-auth-feedback" data-confirm-feedback role="status" aria-live="polite"></p>
      <button class="id-auth-submit" type="button" data-auth-action="resend-confirmation">Resend confirmation email</button>
      <button class="id-auth-secondary" type="button" data-auth-action="return-to-signin">Return to sign in</button>
    </section>`;
  }
  const dashboard = result.role === 'tutor'
    ? 'tutor-dashboard'
    : result.role === 'child'
      ? 'child-dashboard'
      : 'parent-dashboard';
  const destination = result.role === 'tutor'
    ? 'tutor'
    : result.role === 'child'
      ? 'learning'
      : 'family';
  return `<section class="id-auth-result">
    <span class="id-auth-result-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/></svg></span>
    <h3>${escapeHtml(result.title)}</h3>
    <p>${escapeHtml(result.message)}</p>
    <button class="id-auth-submit" type="button" data-auth-action="continue" data-dashboard="${dashboard}">Continue to ${destination === 'tutor' ? 'tutor portal' : destination === 'learning' ? 'learning' : 'family dashboard'}</button>
    <button class="id-auth-secondary" type="button" data-auth-close>Stay on this page</button>
  </section>`;
}

function panelContent() {
  if (state.screen !== 'form') return resultPanel();
  if (state.role === 'child') return childForm();
  return state.role === 'tutor' ? tutorForm() : parentForm();
}

function dialogMarkup() {
  return `<dialog class="id-auth-dialog" aria-labelledby="id-auth-dialog-title" aria-describedby="id-auth-dialog-description" closedby="any">
    <div class="id-auth-layout">
      <aside class="id-auth-visual" aria-label="Interactive desk lamp">
        <div class="id-auth-visual-copy">
          <h2>Bring your language closer.</h2>
          <p>Learn, play, and grow with your family, your tutor, and your community.</p>
        </div>
        <div class="id-auth-lamp-wrap">
          <svg class="id-auth-lamp" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" aria-labelledby="id-auth-lamp-title" role="img">
            <title id="id-auth-lamp-title">A brass desk lamp with a pull cord</title>
            <defs>
              <linearGradient id="id-auth-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#59685e"/><stop offset=".5" stop-color="#99a79b"/><stop offset="1" stop-color="#34463a"/></linearGradient>
              <linearGradient id="id-auth-brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8dfa3"/><stop offset=".5" stop-color="#bc8d37"/><stop offset="1" stop-color="#6f521e"/></linearGradient>
              <linearGradient id="id-auth-shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#53665a"/><stop offset=".52" stop-color="#2e4a3a"/><stop offset="1" stop-color="#1b3528"/></linearGradient>
              <radialGradient id="id-auth-reflector" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#fff5d5"/><stop offset=".45" stop-color="#d8ba75"/><stop offset="1" stop-color="#7c6334"/></radialGradient>
              <linearGradient id="id-auth-beam" x1="0%" y1="0%" x2="90%" y2="70%"><stop offset="0" stop-color="rgba(220,232,220,.72)"/><stop offset=".3" stop-color="rgba(200,222,201,.42)"/><stop offset="1" stop-color="rgba(200,222,201,0)"/></linearGradient>
              <filter id="id-auth-bulb-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <ellipse cx="190" cy="460" rx="90" ry="16" fill="rgba(27,67,50,.18)"/>
            <polygon class="id-auth-light-beam" points="182,185 308,225 440,480 275,480" fill="url(#id-auth-beam)"/>
            <g>
              <ellipse cx="190" cy="445" rx="72" ry="14" fill="#26392d"/>
              <ellipse cx="190" cy="443" rx="70" ry="12" fill="url(#id-auth-metal)"/>
              <ellipse cx="190" cy="441" rx="66" ry="10" fill="#314638"/>
              <circle cx="190" cy="439" r="15" fill="url(#id-auth-brass)"/>
              <circle cx="190" cy="439" r="7" fill="#26392d"/>
              <circle cx="190" cy="439" r="3" fill="#9ba89d"/>
            </g>
            <g fill="none" stroke="url(#id-auth-metal)" stroke-linecap="round">
              <path d="M186 439 156 295M194 439 164 295" stroke-width="4.5"/>
              <path d="M160 295 215 175" stroke-width="5"/>
              <path d="M188 420Q175 360 163 305" stroke="#718177" stroke-width="2" stroke-dasharray="3 3"/>
            </g>
            <g>
              <circle cx="160" cy="295" r="13" fill="url(#id-auth-brass)"/><circle cx="160" cy="295" r="6" fill="#26392d"/>
              <circle cx="215" cy="175" r="11" fill="url(#id-auth-brass)"/>
              <rect x="209" y="162" width="16" height="15" rx="3" fill="url(#id-auth-metal)" transform="rotate(25 217 169)"/>
            </g>
            <g class="id-auth-lamp-shade">
              <path d="M182.3 184.6C188 135 220 112 248 115c27 3 50 40 59.7 110.4a66 22 18 0 1-125.4-40.8Z" fill="url(#id-auth-shade)" stroke="#1b3528" stroke-width="2"/>
              <path d="M187 181c6-42 34-62 60-61 20 2 39 24 50 58-26-15-73-25-110 3Z" fill="rgba(255,255,255,.09)"/>
              <ellipse class="id-auth-reflector" cx="245" cy="205" rx="66" ry="22" transform="rotate(18 245 205)" fill="url(#id-auth-reflector)"/>
              <ellipse cx="245" cy="205" rx="49" ry="14" transform="rotate(18 245 205)" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="1"/>
              <path d="M182.3 184.6a66 22 18 0 0 125.4 40.8" fill="none" stroke="url(#id-auth-brass)" stroke-width="4" stroke-linecap="round"/>
              <ellipse cx="245" cy="195" rx="14" ry="17" transform="rotate(18 245 195)" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.4)"/>
              <path class="id-auth-filament" d="M241 189q4-6 8 0" fill="none" stroke="#526255" stroke-width="2"/>
              <circle class="id-auth-bulb" cx="245" cy="188" r="11" fill="#f3d996" filter="url(#id-auth-bulb-glow)"/>
              <rect x="242" y="206" width="6" height="6" rx="1.5" fill="url(#id-auth-brass)"/>
              <circle cx="245" cy="212" r="3" fill="#f8dfa3" stroke="#72541c"/>
            </g>
            <path class="id-auth-cord" d="M245 212Q245 256 245 300" fill="none" stroke="#b48b3a" stroke-width="2.6" stroke-linecap="round"/>
            <g class="id-auth-cord-bead" transform="translate(245 300)" role="button" tabindex="0" aria-label="Pull the lamp cord to turn the light on" aria-pressed="false">
              <circle class="id-auth-bead-aura" r="16" fill="#2d8a4e" opacity="0"/>
              <path d="M-4-8h8l3 14c0 4-14 4-14 0Z" fill="url(#id-auth-brass)" stroke="#6f521e"/>
              <ellipse cx="2" cy="0" rx="2" ry="4" fill="#fff" opacity=".55"/>
              <circle r="30" fill="transparent"/>
            </g>
          </svg>
        </div>
        <p class="id-auth-lamp-hint" data-auth-lamp-hint>Pull the cord to light the way</p>
      </aside>
      <section class="id-auth-panel">
        <header class="id-auth-header">
          <div>
            <h2 id="id-auth-dialog-title" tabindex="-1">Welcome to Ìdíléwa</h2>
            <p id="id-auth-dialog-description">Choose an account type. Every child profile stays under a parent or guardian.</p>
          </div>
          <button type="button" class="id-auth-close" data-auth-close aria-label="Close account dialog"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg></button>
        </header>
        <div class="id-auth-role-picker" aria-label="Choose an account type">
          ${roleButton('parent', 'Parent', 'For families')}
          ${roleButton('tutor', 'Tutor', 'For educators')}
          ${roleButton('child', 'Child profile', 'Parent-managed')}
        </div>
        <div class="id-auth-mode-picker" aria-label="Choose sign-in or sign-up">
          ${modeButton('signup', 'Sign up')}
          ${modeButton('signin', 'Sign in')}
        </div>
        <div class="id-auth-content" data-auth-content></div>
        <p class="id-auth-privacy">Your account is protected by Idilewa sign-in. Child profiles activate only after guardian consent.</p>
      </section>
    </div>
  </dialog>`;
}

function ensureDialog() {
  if (dialog?.isConnected) return dialog;
  const template = document.createElement('template');
  template.innerHTML = dialogMarkup();
  dialog = template.content.firstElementChild;
  if (!(dialog instanceof HTMLDialogElement)) {
    throw new Error('The Idilewa account dialog could not be created.');
  }
  document.body.append(dialog);
  dialog.addEventListener('click', handleDialogClick);
  dialog.addEventListener('submit', handleDialogSubmit);
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      const clickedOutside = event.clientX < bounds.left
        || event.clientX > bounds.right
        || event.clientY < bounds.top
        || event.clientY > bounds.bottom;
      if (clickedOutside) dialog.close('dismissed');
    });
  }
  dialog.addEventListener('input', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
      clearFeedback();
    }
  });
  dialog.addEventListener('close', () => {
    dialog.returnValue = '';
    dialog.querySelectorAll('input[type="password"]').forEach((input) => { input.value = ''; });
    state.feedback = null;
    state.result = null;
    state.screen = 'form';
  });
  attachCordInteraction(dialog);
  renderPanel();
  return dialog;
}

function renderPanel() {
  if (!dialog) return;
  dialog.dataset.lampOn = String(Boolean(dialog.dataset.lampOn === 'true'));
  dialog.querySelectorAll('[data-auth-role]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.authRole === state.role));
  });
  dialog.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.authMode === state.mode));
  });
  const modePicker = dialog.querySelector('.id-auth-mode-picker');
  modePicker.hidden = state.screen !== 'form';
  dialog.querySelector('[data-auth-content]').innerHTML = panelContent();
  updateGoogleVisibility();
}

function setFeedback(message, kind = 'error') {
  state.feedback = { message, kind };
  const feedback = dialog?.querySelector('[data-auth-feedback]');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.hidden = !message;
  feedback.classList.toggle('is-error', kind === 'error');
  feedback.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  if (kind === 'error') feedback.focus();
}

function clearFeedback() {
  state.feedback = null;
  const feedback = dialog?.querySelector('[data-auth-feedback]');
  if (!feedback) return;
  feedback.textContent = '';
  feedback.hidden = true;
}

function setConfirmation(message, email) {
  state.screen = 'confirmation';
  state.pendingEmail = email;
  state.result = { message };
  state.feedback = null;
  renderPanel();
}

function setAccountReady(role, user, message) {
  state.screen = 'success';
  state.result = {
    role,
    title: `Welcome${user?.name ? `, ${user.name}` : ''}`,
    message,
  };
  state.feedback = null;
  renderPanel();
}

async function checkParentAccount() {
  const request = ++parentCheck;
  state.parentCheck = 'checking';
  state.parentCheckError = '';
  state.parent = null;
  renderPanel();
  try {
    await restoreAuthSession();
    if (request !== parentCheck || state.role !== 'child') return;
    const user = getCurrentUser();
    state.parent = user?.role === 'parent' ? user : null;
    state.parentCheck = 'ready';
  } catch (error) {
    if (request !== parentCheck || state.role !== 'child') return;
    state.parentCheck = 'error';
    state.parentCheckError = error instanceof Error
      ? `Your parent account could not be checked. ${error.message}`
      : 'Your parent account could not be checked. Please try again.';
  }
  renderPanel();
}

function setRole(role, { pendingChild = false, mode = state.mode } = {}) {
  state.role = role;
  state.mode = mode;
  state.screen = 'form';
  state.pendingChild = pendingChild;
  state.feedback = null;
  state.result = null;
  state.parent = null;
  state.parentCheck = role === 'child' ? 'checking' : 'idle';
  state.parentCheckError = '';
  parentCheck += 1;
  renderPanel();
  if (role === 'child') void checkParentAccount();
}

export function openAuthDialog({ role = 'parent', mode = 'signup', pendingChild = false } = {}) {
  const nextRole = ['parent', 'tutor', 'child'].includes(role) ? role : 'parent';
  const nextMode = mode === 'signin' ? 'signin' : 'signup';
  const currentDialog = ensureDialog();
  setRole(nextRole, { pendingChild, mode: nextMode });
  if (!currentDialog.open) {
    currentDialog.showModal();
    currentDialog.querySelector('#id-auth-dialog-title')?.focus({ preventScroll: true });
  }
  return currentDialog;
}

function intentFromLocation() {
  const url = new URL(window.location.href);
  const queryRole = url.searchParams.get('role') || '';
  const queryMode = url.searchParams.get('mode') || '';
  return getAuthIntent({
    href: url.href,
    route: url.hash,
    role: queryRole,
    mode: queryMode,
  });
}

function openFromLocation() {
  const intent = intentFromLocation();
  if (intent) openAuthDialog(intent);
}

function labelForElement(element) {
  return element.getAttribute('aria-label') || element.innerText || element.textContent || '';
}

function handleDocumentClick(event) {
  if (!(event.target instanceof Element)) return;
  const trigger = event.target.closest('a, button');
  if (!trigger || dialog?.contains(trigger)) return;
  const inlineRoute = trigger.getAttribute('onclick')?.match(/go\(['"]([^'"]+)['"]\)/)?.[1] || '';
  const intent = getAuthIntent({
    href: trigger.getAttribute('href') || '',
    route: trigger.dataset.route || trigger.dataset.idilewaRoute || inlineRoute,
    label: labelForElement(trigger),
    role: trigger.dataset.authRole || '',
    mode: trigger.dataset.authMode || trigger.dataset.authOpen || '',
  });
  if (!intent) return;
  event.preventDefault();
  event.stopPropagation();
  openAuthDialog(intent);
}

function handleDialogClick(event) {
  if (!(event.target instanceof Element)) return;
  const closeButton = event.target.closest('[data-auth-close]');
  if (closeButton) {
    dialog.close('dismissed');
    return;
  }

  const roleButton = event.target.closest('[data-auth-role]');
  if (roleButton) {
    const nextRole = roleButton.dataset.authRole;
    if (nextRole && nextRole !== state.role) setRole(nextRole);
    return;
  }

  const modeButton = event.target.closest('[data-auth-mode]');
  if (modeButton) {
    const nextMode = modeButton.dataset.authMode;
    if (nextMode && nextMode !== state.mode) {
      state.mode = nextMode;
      state.screen = 'form';
      state.feedback = null;
      state.result = null;
      renderPanel();
    }
    return;
  }

  const passwordToggle = event.target.closest('[data-auth-toggle-password]');
  if (passwordToggle) {
    const input = passwordToggle.parentElement?.querySelector('input');
    if (!(input instanceof HTMLInputElement)) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    passwordToggle.setAttribute('aria-pressed', String(visible));
    passwordToggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    passwordToggle.textContent = visible ? 'Hide' : 'Show';
    return;
  }

  const googleButton = event.target.closest('[data-auth-google-action]');
  if (googleButton) {
    void startGoogleAuth(googleButton.dataset.authGoogleAction, googleButton);
    return;
  }

  const actionButton = event.target.closest('[data-auth-action]');
  if (!actionButton) return;
  switch (actionButton.dataset.authAction) {
    case 'child-parent-signin':
      setRole('parent', { pendingChild: true, mode: 'signin' });
      break;
    case 'child-parent-signup':
      setRole('parent', { pendingChild: true, mode: 'signup' });
      break;
    case 'retry-parent-check':
      void checkParentAccount();
      break;
    case 'continue': {
      const route = actionButton.dataset.dashboard;
      if (route) continueToDashboard(route);
      break;
    }
    case 'return-to-signin':
      state.mode = 'signin';
      state.screen = 'form';
      state.feedback = null;
      state.result = null;
      renderPanel();
      break;
    case 'forgot-password':
      void handleForgotPassword(actionButton);
      break;
    case 'resend-confirmation':
      void resendConfirmation(actionButton);
      break;
    default:
      break;
  }
}

function continueToDashboard(route) {
  dialog.close('continue');
  window.location.assign(route === 'tutor-dashboard'
    ? '/educator-portal.html#/tutor-dashboard'
    : route === 'child-dashboard'
      ? '/?view=academy'
      : '/parents.html#/parent-dashboard');
}

async function handleForgotPassword(button) {
  const form = button.closest('form');
  const emailInput = form?.querySelector('input[name="email"]');
  if (!(emailInput instanceof HTMLInputElement)) return;
  if (!emailInput.reportValidity()) {
    emailInput.focus();
    return;
  }
  button.disabled = true;
  const previousLabel = button.textContent;
  button.textContent = 'Sending recovery email…';
  try {
    await requestPasswordReset(emailInput.value);
    setFeedback('If an account exists for this email, a password recovery link has been sent.', 'success');
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : 'Password recovery could not be started.', 'error');
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }
}

async function resendConfirmation(button) {
  button.disabled = true;
  const feedback = dialog.querySelector('[data-confirm-feedback]');
  if (feedback) feedback.textContent = 'Sending confirmation email…';
  try {
    await resendSignupConfirmation(state.pendingEmail);
    if (feedback) feedback.textContent = `A new confirmation link was sent to ${state.pendingEmail}.`;
  } catch (error) {
    if (feedback) feedback.textContent = error instanceof Error
      ? error.message
      : 'The confirmation email could not be sent. Please try again.';
  } finally {
    if (button.isConnected) button.disabled = false;
  }
}

async function startGoogleAuth(action, button) {
  const parentSignup = state.role === 'parent' && action === 'signup';
  const form = parentSignup ? null : dialog.querySelector('[data-auth-form="tutor"]');
  if (!parentSignup && !(form instanceof HTMLFormElement)) return;
  const feedback = (message) => setFeedback(message, 'error');
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Connecting to Google…';
  try {
    if (parentSignup) {
      await signInWithGoogle({ redirectRoute: 'parent-signup' });
    } else if (action === 'signup') {
      const invalidField = [...form.querySelectorAll('[data-google-required]')]
        .find((field) => !field.checkValidity());
      if (invalidField) {
        invalidField.reportValidity();
        button.disabled = false;
        button.textContent = originalLabel;
        return;
      }
      const data = new FormData(form);
      await beginEducatorGoogleSignup({
        firstName: String(data.get('firstName') || ''),
        lastName: String(data.get('lastName') || ''),
        educatorProfile: {
          country: String(data.get('country') || ''),
          timeZone: String(data.get('timeZone') || ''),
          teachingSubject: String(data.get('teachingSubject') || ''),
          teachingExperience: String(data.get('teachingExperience') || ''),
          qualifications: String(data.get('qualifications') || ''),
        },
      });
    } else {
      await signInWithGoogle({ redirectRoute: 'tutor-login' });
    }
  } catch (error) {
    feedback(error instanceof Error ? error.message : 'Google sign-in could not be started.');
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function updateGoogleVisibility() {
  const request = ++googleProbe;
  const googlePanel = dialog?.querySelector('[data-auth-google]');
  if (!googlePanel) return;
  googlePanel.hidden = true;
  const isTutorForm = state.role === 'tutor';
  const isParentSignup = state.role === 'parent' && state.mode === 'signup';
  if ((!isTutorForm && !isParentSignup) || state.screen !== 'form') return;
  void isGoogleAuthEnabled().then((enabled) => {
    if (request !== googleProbe || !dialog?.open || state.screen !== 'form'
      || (state.role !== 'tutor' && !(state.role === 'parent' && state.mode === 'signup'))) return;
    googlePanel.hidden = !enabled;
  }).catch((error) => {
    if (request !== googleProbe || !dialog?.open) return;
    setFeedback(error instanceof Error
      ? `Google sign-in availability could not be checked. ${error.message}`
      : 'Google sign-in availability could not be checked.');
  });
}

async function handleDialogSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (!form.matches('[data-auth-form], [data-auth-child-form]')) return;
  event.preventDefault();
  clearFeedback();
  if (!form.reportValidity()) return;
  if (form.matches('[data-auth-child-form]')) {
    await handleChildProfileSubmit(form);
    return;
  }
  if (!isSupabaseConfigured) {
    setFeedback('Account sign-in is not configured on this deployment. Please try again later.');
    return;
  }

  const formData = new FormData(form);
  const role = form.dataset.authForm;
  const mode = form.dataset.mode;
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const submitButton = form.querySelector('button[type="submit"]');
  if (!(submitButton instanceof HTMLButtonElement)) return;

  if (role === 'child') {
    submitButton.disabled = true;
    submitButton.textContent = mode === 'signup' ? 'Creating child account…' : 'Signing in…';
    try {
      if (mode === 'signup') {
        if (password !== String(formData.get('confirmPassword') || '')) {
          setFeedback('The passwords do not match.');
          form.querySelector('[name="confirmPassword"]')?.focus();
          return;
        }
        if (!isSignupPasswordValid(password)) {
          setFeedback('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.');
          form.querySelector('[name="password"]')?.focus();
          return;
        }
        const approvalCode = String(formData.get('approvalCode') || '').trim();
        if (!/^\d{6}$/.test(approvalCode)) {
          setFeedback('Enter the six-digit guardian approval code.');
          form.querySelector('[name="approvalCode"]')?.focus();
          return;
        }
        const approvalResponse = await fetch('/api/guardian/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email, code: approvalCode }),
        });
        const approvalResult = await approvalResponse.json().catch(() => null);
        if (!approvalResponse.ok || !approvalResult?.approvalId) {
          throw new Error(approvalResult?.error || 'The guardian approval code is invalid or expired.');
        }
        const { session, user, welcomeEmailError } = await signUp({
          email,
          password,
          name: String(formData.get('name') || '').trim(),
          role: 'child',
          guardianAccessRequestId: approvalResult.approvalId,
          redirectRoute: 'index',
        });
        if (!session) {
          setConfirmation('Your child account was created. Confirm the account email before signing in.', email);
          return;
        }
        setAccountReady('child', user, welcomeEmailError
          ? `Your child account is ready. ${welcomeEmailError}`
          : 'Your child account is ready.');
        return;
      }

      const user = await signIn({ email, password, expectedRole: 'child' });
      setAccountReady('child', user, 'Welcome back. Your child account is ready.');
      return;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The child account could not be verified.');
      return;
    } finally {
      if (submitButton.isConnected && state.screen === 'form') {
        submitButton.disabled = false;
        submitButton.textContent = mode === 'signup' ? 'Verify approval and create account' : 'Sign in';
      }
    }
  }

  if (role === 'parent' && mode === 'signup') {
    const phone = String(formData.get('phone') || '').trim();
    if (!/^\+?[0-9\s()-]{7,24}$/.test(phone)) {
      setFeedback('Enter a valid phone number.');
      form.querySelector('[name="phone"]')?.focus();
      return;
    }
    if (!isSignupPasswordValid(password)) {
      setFeedback('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.');
      form.querySelector('[name="password"]')?.focus();
      return;
    }
  }
  if (role === 'tutor' && mode === 'signup') {
    const firstName = String(formData.get('firstName') || '').trim();
    const lastName = String(formData.get('lastName') || '').trim();
    if (`${firstName} ${lastName}`.trim().length > 80) {
      setFeedback('Enter a first and last name using no more than 80 characters.');
      form.querySelector('[name="firstName"]')?.focus();
      return;
    }
    if (password !== String(formData.get('confirmPassword') || '')) {
      setFeedback('The passwords do not match.');
      form.querySelector('[name="confirmPassword"]')?.focus();
      return;
    }
    if (!isSignupPasswordValid(password)) {
      setFeedback('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.');
      form.querySelector('[name="password"]')?.focus();
      return;
    }
  }

  submitButton.disabled = true;
  submitButton.textContent = mode === 'signup' ? 'Creating account…' : 'Signing in…';
  try {
    if (role === 'parent' && mode === 'signup') {
      const { session, user, welcomeEmailError } = await signUp({
        email,
        password,
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        role: 'parent',
        redirectRoute: 'parent-dashboard',
      });
      if (!session) {
        setConfirmation(
          'Account created. Confirm your email to finish setting up your parent account. After confirming, sign in to continue.',
          email,
        );
        return;
      }
      if (state.pendingChild) {
        state.parent = user;
        state.parentCheck = 'ready';
        state.role = 'child';
        state.mode = 'signup';
        state.screen = 'form';
        state.feedback = { message: 'Your parent account is ready. Now create the child profile.', kind: 'success' };
        state.result = null;
        renderPanel();
        return;
      }
      let message = 'Your parent account is ready.';
      if (welcomeEmailError) message += ` ${welcomeEmailError}`;
      setAccountReady('parent', user, message);
      return;
    }

    if (role === 'tutor' && mode === 'signup') {
      const firstName = String(formData.get('firstName') || '').trim();
      const lastName = String(formData.get('lastName') || '').trim();
      const { session, user, welcomeEmailError } = await signUp({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        role: 'educator',
        educatorProfile: {
          country: String(formData.get('country') || '').trim(),
          timeZone: String(formData.get('timeZone') || '').trim(),
          teachingSubject: String(formData.get('teachingSubject') || '').trim(),
          teachingExperience: String(formData.get('teachingExperience') || '').trim(),
          qualifications: String(formData.get('qualifications') || '').trim(),
        },
        redirectRoute: 'tutor-login',
      });
      if (!session) {
        setConfirmation('Account created. Confirm your email to finish setting up your tutor account, then sign in.', email);
        return;
      }
      setAccountReady('tutor', user, welcomeEmailError
        ? `Your tutor account is ready. ${welcomeEmailError}`
        : 'Your tutor account is ready.');
      return;
    }

    const expectedRole = role === 'tutor' ? 'educator' : 'parent';
    const user = await signIn({ email, password, expectedRole });
    let activityEmailError = '';
    try {
      await sendAuthActivityEmail('sign-in');
    } catch (error) {
      activityEmailError = error instanceof Error
        ? error.message
        : 'The sign-in notification could not be sent.';
    }
    if (state.pendingChild && user?.role === 'parent') {
      state.parent = user;
      state.parentCheck = 'ready';
      state.role = 'child';
      state.mode = 'signup';
      state.screen = 'form';
      state.feedback = {
        message: activityEmailError
          ? `Parent account verified. ${activityEmailError}`
          : 'Parent account verified. Now create the child profile.',
        kind: 'success',
      };
      state.result = null;
      renderPanel();
      return;
    }
    setAccountReady(role, user, activityEmailError
      ? `Signed in successfully. ${activityEmailError}`
      : role === 'tutor' ? 'Welcome to your tutor portal.' : 'Welcome to your family portal.');
  } catch (error) {
    setFeedback(error instanceof Error
      ? error.message
      : 'Your account could not be verified. Please try again.');
  } finally {
    if (submitButton.isConnected && state.screen === 'form') {
      submitButton.disabled = false;
      submitButton.textContent = mode === 'signup'
        ? role === 'tutor' ? 'Create tutor account' : 'Create parent account'
        : 'Sign in';
    }
  }
}

async function handleChildProfileSubmit(form) {
  if (state.parentCheck !== 'ready' || state.parent?.role !== 'parent' || getCurrentUser()?.role !== 'parent') {
    setFeedback('Sign in to a verified parent account before creating a child profile.');
    return;
  }
  const languages = [...form.querySelectorAll('input[name="languages"]:checked')].map((input) => input.value);
  if (!languages.length) {
    setFeedback('Choose at least one preferred language for your child.');
    form.querySelector('input[name="languages"]')?.focus();
    return;
  }
  if (form.querySelector('[name="website"]')?.value) {
    setFeedback('The request could not be completed. Please refresh the page and try again.');
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  if (!(button instanceof HTMLButtonElement)) return;
  button.disabled = true;
  button.textContent = 'Sending consent request…';
  try {
    const parent = state.parent;
    const token = await getSessionAccessToken();
    const formData = new FormData(form);
    const response = await fetch('/api/guardian/children', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        childName: String(formData.get('childName') || '').trim(),
        ageGroup: String(formData.get('age') || ''),
        gender: String(formData.get('gender') || '') || null,
        avatar: String(formData.get('avatar') || 'a1'),
        languages,
        interests: [...form.querySelectorAll('input[name="interests"]:checked')].map((input) => input.value),
        parentName: parent.name || '',
        parentEmail: parent.email || '',
        relationship: String(formData.get('relationship') || ''),
        consent: formData.get('consent') === 'on',
        marketingOptIn: formData.get('updates') === 'on',
      }),
      cache: 'no-store',
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(response.ok
        ? 'The child-profile service returned an unexpected response.'
        : 'The child-profile service could not be reached. Please try again later.');
    }
    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error('The child-profile service returned an unreadable response. Please try again later.', { cause: error });
    }
    if (!response.ok) throw new Error(result?.error || 'The child profile could not be created.');
    setFeedback(result.message || 'Check your email to confirm guardian consent. The child profile is not active until then.', 'success');
    button.textContent = 'Consent email sent';
  } catch (error) {
    setFeedback(error instanceof Error
      ? error.message
      : 'The consent request could not be sent. Please try again.');
    button.disabled = false;
    button.textContent = 'Create child profile';
  }
}

function attachCordInteraction(root) {
  const svg = root.querySelector('.id-auth-lamp');
  const bead = root.querySelector('.id-auth-cord-bead');
  const cord = root.querySelector('.id-auth-cord');
  if (!svg || !bead || !cord) return;

  const updateCord = () => {
    const midY = (212 + state.cordY) / 2;
    const stretchRatio = Math.max(1, (state.cordY - 212) / 88);
    cord.setAttribute('d', `M245 212Q245 ${midY} 245 ${state.cordY}`);
    cord.setAttribute('stroke-width', String(Math.max(1.6, 2.6 / Math.sqrt(stretchRatio))));
    bead.setAttribute('transform', `translate(245 ${state.cordY})`);
  };
  const resetCord = () => {
    state.cordY = 300;
    state.draggingCord = false;
    bead.classList.remove('is-pulling');
    updateCord();
  };
  const toggleLamp = () => {
    const on = dialog.dataset.lampOn !== 'true';
    dialog.dataset.lampOn = String(on);
    bead.setAttribute('aria-pressed', String(on));
    bead.setAttribute('aria-label', on ? 'Pull the lamp cord to turn the light off' : 'Pull the lamp cord to turn the light on');
    const hint = dialog.querySelector('[data-auth-lamp-hint]');
    if (hint) hint.textContent = on ? 'The way is lit. Your account form is ready.' : 'Pull the cord to light the way';
  };

  bead.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    state.draggingCord = true;
    state.startPointerY = event.clientY;
    state.startCordY = state.cordY;
    bead.classList.add('is-pulling');
    try {
      svg.setPointerCapture(event.pointerId);
    } catch (error) {
      if (error instanceof DOMException && error.name !== 'NotFoundError') throw error;
    }
  });
  svg.addEventListener('pointermove', (event) => {
    if (!state.draggingCord) return;
    const rect = svg.getBoundingClientRect();
    const scale = 500 / Math.max(1, rect.height);
    state.cordY = Math.min(360, Math.max(300, state.startCordY + (event.clientY - state.startPointerY) * scale));
    updateCord();
  });
  svg.addEventListener('pointerup', (event) => {
    if (!state.draggingCord) return;
    const pulled = state.cordY - 300;
    resetCord();
    if (pulled >= 24) {
      toggleLamp();
      state.suppressCordClick = true;
      setTimeout(() => { state.suppressCordClick = false; }, 0);
    }
    try {
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    } catch (error) {
      if (error instanceof DOMException && error.name !== 'NotFoundError') throw error;
    }
  });
  svg.addEventListener('pointercancel', resetCord);
  bead.addEventListener('click', () => {
    if (state.suppressCordClick) return;
    toggleLamp();
  });
  bead.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    toggleLamp();
  });
}

function initialize() {
  document.addEventListener('click', handleDocumentClick, true);
  window.addEventListener('hashchange', openFromLocation);
  openFromLocation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}

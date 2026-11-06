/* Idilewa STEM Studio — sign-in: role, six-digit email code, family passcode. */

import { icon, ASSETS, esc } from '../ui.js';
import {
  isSupabaseConfigured,
  isSignupPasswordValid,
  requestSigninOtp,
  verifySigninOtp,
  signIn,
} from '../../supabaseClient.js';

const ROLES = [
  { id: 'child', label: 'Young learner', sub: 'Ages 6–13 · code sign-in', icon: 'sparkles' },
  { id: 'adult', label: 'Adult learner', sub: 'Language & code for you', icon: 'user' },
  { id: 'parent', label: 'Parent / guardian', sub: 'Consent, reports, billing', icon: 'shield' },
  { id: 'teacher', label: 'Teacher / tutor', sub: 'Classroom invite code', icon: 'book' },
];

const SUPABASE_ROLE = { child: 'child', adult: 'adult', parent: 'parent', teacher: 'educator' };

const wizard = { step: 1, role: 'child', email: '', busy: false };

function digitRow(count, name, label) {
  return Array.from({ length: count }, (_, index) => `
    <input class="cs-otp__box" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1"
      autocomplete="one-time-code" aria-label="${esc(label)} digit ${index + 1}"
      data-${name}="1" data-index="${index}" />`).join('');
}

function roleCard(role) {
  return `
  <button type="button" class="cs-role${wizard.role === role.id ? ' is-active' : ''}" data-role="${role.id}">
    <i>${icon(role.icon)}</i>
    <strong>${esc(role.label)}</strong>
    <span>${esc(role.sub)}</span>
  </button>`;
}

export function render(ctx) {
  const state = ctx.state;
  const childFlow = wizard.role === 'child';
  const steps = childFlow ? ['Role', 'Email', 'Code', 'Passcode'] : ['Role', 'Email', 'Passcode'];
  return `
  <div class="cs-auth">
    <figure class="cs-auth-hero">
      <img src="${ASSETS.storyGrandmother}" alt="Yorùbá grandmother sharing a folktale with a child" />
      <figcaption class="cs-auth-hero__copy">
        <span class="cs-kicker" style="color:rgba(242,255,248,.72)">Idilewa STEM Studio</span>
        <strong>Ẹ káàbọ̀ — welcome home</strong>
        <span>Language, dùndún rhythm and code, taught the way Ilé Ọlá taught us.</span>
      </figcaption>
    </figure>

    <form class="cs-auth-card" data-auth-form novalidate>
      <div class="cs-row cs-row--between">
        <span class="cs-kicker" data-step-label>Step 1 of ${steps.length} · ${esc(steps[0])}</span>
        <div class="cs-steps" data-steps>
          ${steps.map((_, index) => `<i${index === 0 ? ' class="is-on"' : ''}></i>`).join('')}
        </div>
      </div>

      <div class="cs-col" data-panel="role" style="gap:9px">
        <h2 class="cs-h2">Who is learning today?</h2>
        <div class="cs-role-grid">${ROLES.map(roleCard).join('')}</div>
        <p class="cs-hint">Your choice sets which labs, reports and consent screens open.</p>
      </div>

      <div class="cs-col" data-panel="email" hidden style="gap:9px">
        <h2 class="cs-h2">${wizard.role === 'child' ? 'Guardian email' : 'Your account email'}</h2>
        <label class="cs-field">
          <span class="cs-label">Email address</span>
          <input class="cs-input" type="email" name="email" autocomplete="email" required
            placeholder="you@example.com" value="${esc(wizard.email || state.user.email)}" data-email />
        </label>
        ${childFlow
          ? '<p class="cs-hint">We send a six-digit code to this address. Children never type a password.</p>'
          : `<label class="cs-field">
              <span class="cs-label">Password</span>
              <input class="cs-input" type="password" name="password" autocomplete="current-password"
                placeholder="12+ characters" data-password />
            </label>
            <p class="cs-hint">Account passwords are 12–128 characters with a capital, a number and a symbol.</p>`}
        <p class="cs-error" data-error hidden></p>
      </div>

      <div class="cs-col" data-panel="code" hidden style="gap:9px">
        <h2 class="cs-h2">Enter the six-digit code</h2>
        <p class="cs-sub">Sent to <b data-email-echo>${esc(wizard.email)}</b>. It expires in ten minutes.</p>
        <div class="cs-otp" data-otp-row>${digitRow(6, 'otp', 'Verification code')}</div>
        <p class="cs-error" data-error hidden></p>
        <p class="cs-resend">Nothing arrived? <b data-resend role="button">Send a new code</b></p>
      </div>

      <div class="cs-col" data-panel="passcode" hidden style="gap:9px">
        <h2 class="cs-h2">${childFlow || wizard.role === 'parent' ? 'Family passcode' : 'Studio PIN'}</h2>
        <p class="cs-sub">${childFlow
          ? 'Six digits the guardian chose. It signs this learner in and keeps the card safe.'
          : 'Six digits that unlock your saved progress on this device.'}</p>
        <div class="cs-passkey-grid" data-pass-row>${digitRow(6, 'pass', childFlow ? 'Family passcode' : 'Studio PIN')}</div>
        <p class="cs-error" data-error hidden></p>
      </div>

      <div class="cs-col" style="gap:8px">
        <button type="submit" class="cs-btn cs-btn--primary cs-btn--block" data-next>
          ${icon('arrowRight')} <span data-next-label>Continue</span>
        </button>
        <button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-back hidden>${icon('arrowLeft')} Back</button>
      </div>

      <div class="cs-or">or</div>
      <button type="button" class="cs-btn cs-btn--ghost cs-btn--block" data-guest>
        ${icon('eye')} Continue as a guest explorer
      </button>
      <p class="cs-tiny cs-center">${isSupabaseConfigured
        ? 'Secured by Supabase auth. Guardian consent is required for accounts under 13.'
        : 'Offline demo: codes are not emailed until Supabase keys are configured. Any six digits work.'}</p>
    </form>
  </div>`;
}

export function mount(root, ctx) {
  const form = root.querySelector('[data-auth-form]');
  if (!form) return undefined;

  const panel = {
    role: form.querySelector('[data-panel="role"]'),
    email: form.querySelector('[data-panel="email"]'),
    code: form.querySelector('[data-panel="code"]'),
    passcode: form.querySelector('[data-panel="passcode"]'),
  };
  const stepLabel = form.querySelector('[data-step-label]');
  const dots = Array.from(form.querySelectorAll('[data-steps] i'));
  const nextBtn = form.querySelector('[data-next]');
  const nextLabel = form.querySelector('[data-next-label]');
  const backBtn = form.querySelector('[data-back]');
  const otpRow = form.querySelector('[data-otp-row]');
  const passRow = form.querySelector('[data-pass-row]');
  const readOtp = otpRow ? wireDigits(otpRow) : () => '';
  const readPass = passRow ? wireDigits(passRow) : () => '';

  const order = () => (wizard.role === 'child' ? ['role', 'email', 'code', 'passcode'] : ['role', 'email', 'passcode']);
  const nextWords = { role: 'Continue', email: 'Send code', code: 'Verify & continue', passcode: 'Enter the studio' };
  let current = 0;
  let pending = null;

  function errorFor(name, message) {
    const slot = panel[name]?.querySelector('[data-error]');
    if (!slot) return;
    slot.textContent = message || '';
    slot.hidden = !message;
  }

  function show(index) {
    const keys = order();
    current = Math.max(0, Math.min(index, keys.length - 1));
    keys.forEach((key, position) => {
      if (panel[key]) panel[key].hidden = position !== current;
      if (dots[position]) dots[position].classList.toggle('is-on', position <= current);
    });
    dots.slice(keys.length).forEach((dot) => dot.classList.remove('is-on'));
    if (stepLabel) {
      const name = keys[current];
      stepLabel.textContent = `Step ${current + 1} of ${keys.length} · ${name[0].toUpperCase()}${name.slice(1)}`;
    }
    if (nextLabel) nextLabel.textContent = nextWords[keys[current]] || 'Continue';
    if (backBtn) backBtn.hidden = current === 0;
    const focusTarget = panel[keys[current]]?.querySelector('input');
    if (focusTarget) setTimeout(() => focusTarget.focus(), 60);
  }

  function busy(on, text) {
    nextBtn.disabled = on;
    if (nextLabel) nextLabel.textContent = on ? text : (nextWords[order()[current]] || 'Continue');
  }

  async function finish(patch, message) {
    await ctx.store.patch({ user: { ...ctx.state.user, ...patch }, route: 'home' });
    ctx.toast(message, { tone: 'success' });
    ctx.nav('home');
  }


  async function sendCode() {
    const email = (form.querySelector('[data-email]')?.value || '').trim().toLowerCase();
    wizard.email = email;
    errorFor('email', '');
    if (isSupabaseConfigured) {
      try {
        busy(true, 'Sending…');
        await requestSigninOtp(email, 'child-signin');
        busy(false);
      } catch (error) {
        busy(false);
        errorFor('email', error?.message || 'We could not send a code. Check the address and try again.');
        return false;
      }
    } else {
      await new Promise((resolve) => { pending = window.setTimeout(resolve, 400); });
      pending = null;
    }
    const echo = form.querySelector('[data-email-echo]');
    if (echo) echo.textContent = email;
    ctx.toast(isSupabaseConfigured ? `Code sent to ${email}.` : `Demo mode — any six digits work for ${email}.`);
    return true;
  }

  async function submitStage() {
    const stage = order()[current];
    if (stage === 'role') {
      show(current + 1);
      return;
    }

    if (stage === 'email') {
      const email = (form.querySelector('[data-email]')?.value || '').trim().toLowerCase();
      wizard.email = email;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        errorFor('email', 'Enter a valid email address, for example ada@example.com.');
        return;
      }
      errorFor('email', '');
      if (wizard.role === 'child') {
        if (await sendCode()) show(current + 1);
        return;
      }
      const password = form.querySelector('[data-password]')?.value || '';
      if (isSupabaseConfigured) {
        try {
          busy(true, 'Signing in…');
          const result = await signIn({ email, password, expectedRole: SUPABASE_ROLE[wizard.role] });
          busy(false);
          const record = result?.user || {};
          await finish({
            id: record.id || ctx.state.user.id,
            name: record.name || ctx.state.user.name,
            email,
            role: record.role === 'educator' ? 'teacher' : (record.role || wizard.role),
            signedIn: true,
            verified: true,
          }, `Ẹ kú àbọ̀, ${record.name || 'friend'}.`);
          return;
        } catch (error) {
          busy(false);
          errorFor('email', error?.message || 'Sign-in failed. Check your email and password.');
          return;
        }
      }
      if (!isSignupPasswordValid(password)) {
        errorFor('email', 'Passwords need 12+ characters with a capital, a number and a symbol.');
        return;
      }
      show(current + 1);
      return;
    }


    if (stage === 'code') {
      const token = readOtp();
      if (!/^\d{6}$/.test(token)) {
        errorFor('code', 'Enter all six digits from the email.');
        return;
      }
      errorFor('code', '');
      if (isSupabaseConfigured) {
        try {
          busy(true, 'Verifying…');
          const record = await verifySigninOtp({ email: wizard.email, token, expectedRole: 'child', purpose: 'child-signin' });
          busy(false);
          await finish({
            id: record?.id || ctx.state.user.id,
            name: record?.name || ctx.state.user.name,
            email: wizard.email,
            role: 'child',
            signedIn: true,
            verified: true,
          }, 'Code accepted. Now choose the family passcode.');
          return;
        } catch (error) {
          busy(false);
          errorFor('code', error?.message || 'That code did not work. Request a new one.');
          return;
        }
      }
      show(current + 1);
      return;
    }

    const passcode = readPass();
    if (!/^\d{6}$/.test(passcode)) {
      errorFor('passcode', 'The passcode must be exactly six digits.');
      return;
    }
    errorFor('passcode', '');
    await finish({
      email: wizard.email || ctx.state.user.email,
      role: wizard.role,
      signedIn: true,
      verified: true,
      passcodeSet: true,
    }, 'Passcode saved. Ṣé ká bẹ̀rẹ̀ — let’s learn!');
  }


  form.addEventListener('click', (event) => {
    const role = event.target.closest('[data-role]');
    if (role) {
      if (wizard.role === role.dataset.role) return;
      wizard.role = role.dataset.role;
      ctx.rerender();
      return;
    }
    if (event.target.closest('[data-resend]')) {
      sendCode();
      return;
    }
    if (event.target.closest('[data-back]')) {
      show(current - 1);
      return;
    }
    if (event.target.closest('[data-guest]')) {
      finish({ name: 'Guest explorer', role: 'child', signedIn: true, verified: false, email: '' }, 'Exploring as a guest. Progress still saves on this device.');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (nextBtn.disabled) return;
    await submitStage();
  });

  show(0);

  return () => {
    if (pending) window.clearTimeout(pending);
  };
}

function wireDigits(row) {
  const inputs = Array.from(row.querySelectorAll('input'));
  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 1);
      if (input.value && index < inputs.length - 1) inputs[index + 1].focus();
      if (input.value && index === inputs.length - 1) input.blur();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        event.preventDefault();
        inputs[index - 1].value = '';
        inputs[index - 1].focus();
      }
      if (event.key === 'ArrowLeft' && index > 0) inputs[index - 1].focus();
      if (event.key === 'ArrowRight' && index < inputs.length - 1) inputs[index + 1].focus();
    });
    input.addEventListener('paste', (event) => {
      const text = (event.clipboardData?.getData('text') || '').replace(/\D/g, '');
      if (!text) return;
      event.preventDefault();
      text.slice(0, inputs.length - index).split('').forEach((char, offset) => {
        inputs[index + offset].value = char;
      });
      inputs[Math.min(index + text.length, inputs.length - 1)].focus();
    });
  });
  return () => inputs.map((input) => input.value).join('');
}

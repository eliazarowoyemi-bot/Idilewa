/* Idilewa STEM Studio — security layer.
 *
 * Two separate concerns, kept honest:
 *  1. CryptoVault  — real cryptography. AES-GCM 256 + PBKDF2-SHA256 (250k iters)
 *                    for anything persisted to localStorage. Nothing sensitive is
 *                    ever stored in plaintext.
 *  2. ContentGuard — deterrence only. Screen-capture prevention is impossible on
 *                    the open web; this blurs + watermarks the UI when copy/print/
 *                    devtools/screenshot gestures are detected. It is a speed bump,
 *                    not encryption. Never present it as such.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

const DEVICE_SECRET_KEY = 'idilewa.studio.device.v1';

function deviceSecret() {
  try {
    const existing = localStorage.getItem(DEVICE_SECRET_KEY);
    if (existing) return existing;
    const created = toBase64(randomBytes(32));
    localStorage.setItem(DEVICE_SECRET_KEY, created);
    return created;
  } catch {
    return 'idilewa-studio-ephemeral';
  }
}

export class CryptoVault {
  constructor() {
    this.key = null;
    this.passphrase = null;
    this.ready = false;
  }

  /** Derive an AES-GCM key. Pass a family passcode for stronger protection. */
  async unlock(passphrase = deviceSecret()) {
    if (!globalThis.crypto?.subtle) {
      this.ready = false;
      return false;
    }
    const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    this.key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode('idilewa-studio-vault-v1'), iterations: 250000, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    this.passphrase = passphrase;
    this.ready = true;
    return true;
  }

  async encrypt(value) {
    if (!this.ready && !(await this.unlock())) return null;
    const iv = randomBytes(12);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, this.key, enc.encode(JSON.stringify(value)));
    return `v1.${toBase64(iv)}.${toBase64(cipher)}`;
  }

  async decrypt(payload) {
    if (!payload || typeof payload !== 'string') return null;
    if (!payload.startsWith('v1.')) {
      try { return JSON.parse(payload); } catch { return null; }
    }
    if (!this.ready && !(await this.unlock())) return null;
    const [, ivPart, dataPart] = payload.split('.');
    try {
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(ivPart) },
        this.key,
        fromBase64(dataPart),
      );
      return JSON.parse(dec.decode(plain));
    } catch {
      return null;
    }
  }

  async write(storageKey, value) {
    const encrypted = await this.encrypt(value);
    if (!encrypted) return false;
    try {
      localStorage.setItem(storageKey, encrypted);
      return true;
    } catch {
      return false;
    }
  }

  async read(storageKey, fallback = null) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return fallback;
      const value = await this.decrypt(raw);
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  clean(storageKey) {
    try { localStorage.removeItem(storageKey); } catch { /* storage disabled */ }
  }
}

export const vault = new CryptoVault();

/** Lightweight, non-reversible digest for analytics-style comparisons (never for passwords). */
export async function digest(value) {
  if (!globalThis.crypto?.subtle) return String(value).length.toString(16);
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(String(value)));
  return toBase64(hash).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

/* --------------------------- content deterrence --------------------------- */

const ALLOWED_COPY = 'input, textarea, .cs-code__mono, [data-allow-copy]';
const GUARD_FLAG = 'data-cs-guard';

let shieldTimer = null;

export function raiseShield(root, reason = 'Screen or clipboard protection triggered') {
  const host = root || document.querySelector('.cs-root');
  if (!host) return;
  host.classList.add('is-shielded');
  const label = host.querySelector('.cs-shield__reason');
  if (label) label.textContent = reason;
  window.clearTimeout(shieldTimer);
  shieldTimer = window.setTimeout(() => host.classList.remove('is-shielded'), 1400);
}

export function buildWatermark(label = 'Idilewa • Licensed learner copy') {
  const layer = document.createElement('div');
  layer.className = 'cs-watermark';
  layer.dataset.label = label;
  layer.setAttribute('aria-hidden', 'true');
  return layer;
}

export function shieldMarkup() {
  return `<div class="cs-shield" aria-hidden="true">
    <div class="cs-shield__inner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z"/><path d="M12 8v4m0 3h.01"/></svg>
      <h2>Protected lesson content</h2>
      <p class="cs-shield__reason">Idilewa material is licensed to the signed-in family. Copying, printing and screenshots are disabled.</p>
      <button type="button" class="cs-btn cs-btn--ochre cs-btn--sm" data-resume>Resume lesson</button>
    </div>
  </div>`;
}

/**
 * Content deterrence. Deterrence only — a determined user with OS-level capture
 * tools can still record the screen. Everything genuinely private lives in the vault.
 */
export function guardContent(root, { watermark = 'Idilewa • Licensed learner copy' } = {}) {
  const host = root || document.querySelector('.cs-root');
  if (!host || host.hasAttribute(GUARD_FLAG)) return () => {};
  host.setAttribute(GUARD_FLAG, 'true');

  const watermarkLayer = buildWatermark(watermark);
  host.appendChild(watermarkLayer);
  host.insertAdjacentHTML('beforeend', shieldMarkup());

  const resume = (event) => {
    event?.preventDefault();
    host.classList.remove('is-shielded');
  };

  const blockCopy = (event) => {
    if (event.target.closest?.(ALLOWED_COPY)) return;
    event.preventDefault();
    raiseShield(host, 'Copying is disabled for licensed lesson content.');
  };

  const blockMenu = (event) => {
    if (event.target.closest?.(ALLOWED_COPY)) return;
    event.preventDefault();
    raiseShield(host, 'Right-click is disabled inside the studio.');
  };

  const blockDrag = (event) => {
    if (event.target.closest?.('img, svg')) event.preventDefault();
  };

  const blockKeys = (event) => {
    const key = event.key.toLowerCase();
    const meta = event.ctrlKey || event.metaKey;
    const devtoolsCombo = (meta && event.shiftKey && ['i', 'j', 'c'].includes(key))
      || key === 'f12'
      || (meta && ['u', 's', 'p'].includes(key));
    const screenshotCombo = key === 'printscreen'
      || (event.metaKey && event.shiftKey && ['3', '4', '5'].includes(key));
    if (key === 'printscreen') {
      navigator.clipboard?.writeText?.('Idilewa protected content').catch(() => {});
    }
    if (devtoolsCombo || screenshotCombo) {
      event.preventDefault();
      raiseShield(host, 'Inspecting or capturing this lesson is not permitted.');
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') host.classList.add('is-shielded');
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') window.setTimeout(() => host.classList.remove('is-shielded'), 900);
  };

  host.addEventListener('click', (event) => {
    if (event.target.closest('[data-resume]')) resume(event);
  });
  document.addEventListener('copy', blockCopy);
  document.addEventListener('cut', blockCopy);
  document.addEventListener('contextmenu', blockMenu);
  document.addEventListener('dragstart', blockDrag);
  document.addEventListener('keydown', blockKeys);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('beforeprint', () => raiseShield(host, 'Printing is disabled for licensed lesson content.'));

  return () => {
    document.removeEventListener('copy', blockCopy);
    document.removeEventListener('cut', blockCopy);
    document.removeEventListener('contextmenu', blockMenu);
    document.removeEventListener('dragstart', blockDrag);
    document.removeEventListener('keydown', blockKeys);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('visibilitychange', onVisible);
    watermarkLayer.remove();
    host.removeAttribute(GUARD_FLAG);
  };
}


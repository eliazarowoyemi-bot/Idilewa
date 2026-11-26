export const AUTH_USER_STORAGE_KEY = 'idilewa_auth_user';
export const AUTH_STATE_CHANGED_EVENT = 'idilewa:auth-state-changed';

export function getCachedAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    throw new Error(`Could not read saved browser data (${AUTH_USER_STORAGE_KEY}).`, { cause: error });
  }
}

export function notifyAuthStateChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
  }
}

import { createClient } from '@supabase/supabase-js';

function readEnvValue(...names) {
  const clientEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
  for (const name of names) {
    const value = clientEnv[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function normalizeSupabaseUrl(value) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  if (!candidate) return '';
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
}

const supabaseUrl = normalizeSupabaseUrl(readEnvValue('VITE_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_PUBLIC_URL', 'NEXT_PUBLIC_SUPABASE_URL'));
const supabaseAnonKey = readEnvValue('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: 'pkce',
    },
  })
  : null;

const LOCAL_STORAGE_KEY_USER = 'idilewa_auth_user';
const LOCAL_STORAGE_KEY_PROGRESS = 'idilewa_db_progress';
const LOCAL_STORAGE_KEY_CODE = 'idilewa_db_code';
const LOCAL_STORAGE_KEY_VOICE = 'idilewa_db_voice';
let authStateSubscription = null;

function getLocalItem(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    throw new Error(`Could not read saved browser data (${key}).`, { cause: error });
  }
}

function setLocalItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new Error(`Could not save browser data (${key}).`, { cause: error });
  }
}

function requireSupabase() {
  if (!supabase) throw new Error('Account storage is not configured.');
  return supabase;
}

function isAuthenticatedUserId(userId) {
  return typeof userId === 'string' && userId.length > 0 && !userId.startsWith('usr_') && userId !== 'anonymous';
}

function requirePersistedResult(data, error, message) {
  if (error) throw new Error(message, { cause: error });
  if (!data) throw new Error(message);
  return data;
}

export function normalizeAuthError(error, operation) {
  const code = typeof error?.code === 'string' ? error.code.toLowerCase() : '';
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  const status = Number(error?.status);

  if (code === 'email_not_confirmed' || /email.*not confirmed/.test(message)) {
    return 'Confirm your email using the link we sent before signing in. You can request a new confirmation link below.';
  }
  if (code === 'invalid_credentials' || /invalid login credentials|invalid password/.test(message)) {
    return 'The email or password is incorrect. Check your details or use Forgot password to reset your password.';
  }
  if (code === 'user_already_exists' || /user already registered|already registered/.test(message)) {
    return 'An account may already use this email. Sign in or use Forgot password to recover access.';
  }
  if (code === 'weak_password' || /password.*(too short|at least|weak)/.test(message)) {
    return 'Choose a stronger password that meets the requirements shown on the form.';
  }
  if (/over_.*rate|rate limit|too many requests/.test(`${code} ${message}`)) {
    return 'Too many attempts. Wait a little before trying again.';
  }
  if (operation === 'signup' && status >= 500) {
    return 'Your account could not be created because profile setup failed. Please try again later or contact Idilewa support.';
  }
  if (status === 502 || status === 503 || status >= 500) {
    return 'The account service is temporarily unavailable. Please try again shortly.';
  }
  if (error instanceof TypeError || /failed to fetch|networkerror/.test(message)) {
    return 'Could not reach the account service. Check your connection and try again.';
  }
  return typeof error?.message === 'string' && error.message.trim()
    ? error.message
    : 'Authentication failed. Please try again.';
}

export function isSignupPasswordValid(password) {
  return typeof password === 'string'
    && password.length >= 12
    && password.length <= 128
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9\s]/.test(password);
}

function mapProgress(row) {
  return {
    id: row.id,
    userId: row.user_id,
    lessonType: row.lesson_type,
    lessonId: row.lesson_id,
    meta: row.meta || {},
    completedAt: row.completed_at,
  };
}

function mapCodeSubmission(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title || 'Koodu Yorùbá Titun',
    code: row.code,
    output: row.output || '',
    language: row.language || 'yorubascript',
    createdAt: row.created_at,
  };
}

function mapVoiceRecord(row) {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    targetLang: row.target_lang,
    audioScore: row.audio_score,
    pitchHz: row.pitch_hz,
    lessonId: row.lesson_id || '',
    createdAt: row.created_at,
  };
}

function mapAuthUser(authUser, metadata = authUser.user_metadata || {}) {
  return {
    id: authUser.id,
    email: authUser.email,
    name: metadata.name || authUser.email?.split('@')[0] || '',
    role: metadata.role || 'adult',
    avatar: metadata.avatar_url || '',
    bio: metadata.bio || '',
    learning_goal: metadata.learning_goal || '',
    learning_language: metadata.learning_language || 'yoruba',
    learning_level: metadata.learning_level || 'beginner',
    interests: Array.isArray(metadata.interests) ? metadata.interests : [],
    points: Number.isFinite(metadata.points) ? metadata.points : 0,
    streak: Number.isFinite(metadata.streak) ? metadata.streak : 0,
    createdAt: authUser.created_at || new Date().toISOString(),
  };
}

async function loadAccountProfile(client, authUser) {
  const { data: profile, error } = await client
    .from('profiles')
    .select('name, role, avatar_url, points, streak, parent_consent_request_id')
    .eq('id', authUser.id)
    .maybeSingle();
  if (error) throw new Error('Your account profile could not be loaded.', { cause: error });
  if (!profile) throw new Error('Your account profile is missing. Contact support before continuing.');
  if (profile.role === 'child') {
    const { data: guardianApproved, error: guardianError } = await client.rpc('child_guardian_is_approved');
    if (guardianError) {
      throw new Error('Child guardian approval could not be confirmed. Please try again later.', { cause: guardianError });
    }
    if (guardianApproved !== true || !profile.parent_consent_request_id) {
      throw new Error('A parent or guardian must approve this child account before sign-in.');
    }
  }
  return mapAuthUser(authUser, {
    ...authUser.user_metadata,
    ...profile,
    avatar_url: profile.avatar_url || authUser.user_metadata?.avatar_url,
  });
}

async function requestAuthEmailCode(email, purpose) {
  if (!['child-signin', 'password-reset'].includes(purpose)) {
    throw new Error('Email codes are only available for child sign-in and password recovery.');
  }
  const response = await fetch('/api/auth/welcome?action=email-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), purpose }),
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('The email-code service returned an invalid response.', { cause: error });
  }
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'The code email could not be sent. Please try again.');
  }
}

export async function signUp({ email, password, name, role = 'child', guardianAccessRequestId, educatorInviteId }) {
  const client = requireSupabase();
  if (!['child', 'adult', 'parent', 'educator'].includes(role)) {
    throw new Error('Choose a supported account type before creating an account.');
  }
  if (!isSignupPasswordValid(password)) {
    throw new Error('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.');
  }
  if (role === 'child' && !/^[0-9a-f-]{36}$/i.test(guardianAccessRequestId || '')) {
    throw new Error('A verified guardian approval is required before creating a child account.');
  }
  if (role === 'educator' && !/^[0-9a-f-]{36}$/i.test(educatorInviteId || '')) {
    throw new Error('A verified one-time educator invitation code is required before creating a teacher account.');
  }
  const normalizedEmail = email.toLowerCase().trim();
  const userName = (typeof name === 'string' ? name.trim().slice(0, 80) : '')
    || normalizedEmail.split('@')[0];
  const { data, error } = await client.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: userName,
        role,
        ...(role === 'child' ? { guardian_access_request_id: guardianAccessRequestId } : {}),
        ...(role === 'educator' ? { educator_invite_id: educatorInviteId } : {}),
      },
      emailRedirectTo: new URL('/auth-callback.html?next=index', window.location.origin).toString(),
    },
  });
  if (error) throw new Error(normalizeAuthError(error, 'signup'), { cause: error });
  if (!data?.user) throw new Error('The authentication service did not return an account.');
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('Could not create an account with this email. If you already registered, sign in or use Forgot password.');
  }

  let welcomeEmailError = '';
  if (data.session) {
    try {
      const response = await fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ userId: data.user.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        welcomeEmailError = typeof result?.error === 'string'
          ? result.error
          : 'Your account is ready, but the welcome email could not be sent.';
      }
    } catch (error) {
      welcomeEmailError = error instanceof Error
        ? `Your account is ready, but the welcome email could not be sent: ${error.message}`
        : 'Your account is ready, but the welcome email could not be sent.';
    }
  }

  let userRecord = mapAuthUser(data.user, { ...data.user.user_metadata, name: userName, role });
  try {
    if (data.session) userRecord = await loadAccountProfile(client, data.user);
  } catch (profileError) {
    const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
    if (signOutError) {
      throw new Error('The account profile could not be loaded and its session could not be cleared.', { cause: signOutError });
    }
    throw profileError;
  }
  if (data.session) setLocalItem(LOCAL_STORAGE_KEY_USER, userRecord);
  return {
    user: userRecord,
    session: data.session,
    confirmationRequired: !data.session,
    error: null,
    welcomeEmailError,
  };
}

export async function resendSignupConfirmation(email) {
  const client = requireSupabase();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address before requesting a new confirmation link.');
  }
  const { error } = await client.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo: new URL('/auth-callback.html?next=index', window.location.origin).toString(),
    },
  });
  if (error) throw new Error(normalizeAuthError(error, 'resend'), { cause: error });
}

export async function restoreAuthSession() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error('Your saved sign-in session could not be checked.', { cause: error });
  if (!authStateSubscription) {
    const { data: authState } = client.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return;
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
      } catch (storageError) {
        console.error('The signed-out account cache could not be cleared.', storageError);
      }
    });
    authStateSubscription = authState.subscription;
  }
  if (!data.session?.user) {
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    return null;
  }

  try {
    const userRecord = await loadAccountProfile(client, data.session.user);
    setLocalItem(LOCAL_STORAGE_KEY_USER, userRecord);
    return userRecord;
  } catch (profileError) {
    const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
    if (signOutError) {
      throw new Error('Your account profile could not be restored and the local session could not be cleared.', { cause: signOutError });
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    throw profileError;
  }
}

export async function completeAuthCallback(callbackUrl = window.location.href) {
  const client = requireSupabase();
  const url = new URL(callbackUrl);
  const callbackParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const callbackError = url.searchParams.get('error_description')
    || callbackParams.get('error_description')
    || url.searchParams.get('error')
    || callbackParams.get('error');
  if (callbackError) throw new Error(callbackError);

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error('The sign-in link could not be checked.', { cause: sessionError });
  let session = sessionData.session;
  const code = url.searchParams.get('code');
  if (!session && code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw new Error(normalizeAuthError(error, 'callback'), { cause: error });
    session = data.session;
  }
  if (!session?.user) {
    throw new Error('This sign-in link is invalid or has expired. Request a new link and try again.');
  }

  const userRecord = await loadAccountProfile(client, session.user);
  setLocalItem(LOCAL_STORAGE_KEY_USER, userRecord);
  return {
    user: userRecord,
    session,
    type: url.searchParams.get('type') || callbackParams.get('type') || '',
  };
}

export async function requestSigninOtp(email, purpose = 'child-signin') {
  if (!['child-signin', 'password-reset'].includes(purpose)) {
    throw new Error('Email codes are only available for child sign-in and password recovery.');
  }
  await requestAuthEmailCode(email, purpose === 'password-reset' ? 'recovery' : purpose);
}

export async function verifySigninOtp({ email, token, expectedRole, purpose = 'child-signin' }) {
  const client = requireSupabase();
  if (!['child-signin', 'password-reset'].includes(purpose)) {
    throw new Error('Email codes are only available for child sign-in and password recovery.');
  }
  if (purpose === 'child-signin' && expectedRole !== 'child') {
    throw new Error('Child sign-in codes can only be used for a child account.');
  }
  if (expectedRole && !['child', 'educator', 'adult', 'parent'].includes(expectedRole)) {
    throw new Error('Select a valid account type before using email-code sign-in.');
  }
  const normalizedEmail = email.toLowerCase().trim();
  if (!/^\d{6,8}$/.test(token)) throw new Error('Enter the verification code from your email.');
  const { data, error } = await client.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: purpose === 'password-reset' ? 'recovery' : 'magiclink',
  });
  if (error) throw new Error(normalizeAuthError(error, 'verification'), { cause: error });
  if (!data?.user || !data.session) throw new Error('Email verification did not return a signed-in account.');

  let userRecord;
  try {
    userRecord = await loadAccountProfile(client, data.user);
    if (expectedRole && userRecord.role !== expectedRole) {
      if (expectedRole === 'adult' && ['parent', 'educator'].includes(userRecord.role)) {
        setLocalItem(LOCAL_STORAGE_KEY_USER, userRecord);
        return { user: userRecord, session: data.session, error: null };
      }
      throw new Error(`This email belongs to a ${userRecord.role} account. Select the matching account type.`);
    }
  } catch (profileError) {
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw new Error('Could not clear the session after the account check failed.', { cause: signOutError });
    throw profileError;
  }

  setLocalItem(LOCAL_STORAGE_KEY_USER, userRecord);
  return userRecord;
}

export async function updateAccountPassword(password) {
  const client = requireSupabase();
  if (!isSignupPasswordValid(password)) {
    throw new Error('Use 12–128 characters with uppercase and lowercase letters, a number, and a symbol.');
  }
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw new Error(error.message, { cause: error });
  if (!data?.user) throw new Error('The authentication service did not confirm your new password.');
}

export async function signIn({ email, password, expectedRole }) {
  const client = requireSupabase();
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  if (error) throw new Error(normalizeAuthError(error, 'signin'), { cause: error });
  if (!data?.user || !data.session) throw new Error('The authentication service did not return a signed-in session.');

  let userRecord;
  try {
    userRecord = await loadAccountProfile(client, data.user);
    if (expectedRole && userRecord.role !== expectedRole
      && !(expectedRole === 'adult' && ['parent', 'educator'].includes(userRecord.role))) {
      throw new Error(`This email belongs to a ${userRecord.role} account. Select the matching account type.`);
    }
  } catch (profileError) {
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) {
      throw new Error('Your account check failed and the sign-in session could not be cleared.', { cause: signOutError });
    }
    throw profileError instanceof Error && profileError.message.startsWith('This email belongs to a ')
      ? profileError
      : new Error('Signed in, but your account profile could not be loaded. Confirm the Supabase migrations are applied.', { cause: profileError });
  }
  setLocalItem(LOCAL_STORAGE_KEY_USER, userRecord);
  return { user: userRecord, session: data.session, error: null };
}

export async function signOut({ notify = true } = {}) {
  let authError = null;
  let activityEmailError = null;
  if (supabase) {
    if (notify) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (sessionData.session?.access_token) {
          const response = await fetch('/api/auth/welcome?action=activity', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ event: 'sign-out' }),
          });
          if (!response.ok) {
            const result = await response.json().catch(() => null);
            throw new Error(result?.error || 'The sign-out notification could not be sent.');
          }
        }
      } catch (error) {
        activityEmailError = error;
      }
    }
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      authError = error;
    } catch (error) {
      authError = error;
    }
  }
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
  } catch (error) {
    throw new Error('Signed out, but the local account cache could not be cleared.', { cause: error });
  }
  if (authError) {
    throw new Error('Signed out on this device, but Supabase could not confirm the session revocation.', { cause: authError });
  }
  return {
    signedOut: true,
    activityEmailError: activityEmailError instanceof Error
      ? activityEmailError.message
      : activityEmailError ? 'The Idilewa sign-out email could not be sent.' : '',
  };
}

export async function sendAuthActivityEmail(event) {
  if (!['sign-in'].includes(event)) {
    throw new Error('The authentication activity is not supported.');
  }
  const accessToken = await getSessionAccessToken();
  const response = await fetch('/api/auth/welcome?action=activity', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ event }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'The Idilewa sign-in email could not be sent.');
  }
}

export function getCurrentUser() {
  return getLocalItem(LOCAL_STORAGE_KEY_USER, null);
}

export async function getSessionAccessToken() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error('Your sign-in session could not be checked.', { cause: error });
  if (!data.session?.access_token) throw new Error('Sign in again to open this dashboard.');
  return data.session.access_token;
}

export async function getRoleDashboard(endpoint) {
  const token = await getSessionAccessToken();
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('The dashboard returned an invalid response.', { cause: error });
  }
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'The dashboard could not be loaded.');
  }
  return result;
}

export async function submitEducatorConnectionRequest(childEmail) {
  const token = await getSessionAccessToken();
  const response = await fetch('/api/educator/connection-request', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ childEmail }),
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('The consent request returned an invalid response.', { cause: error });
  }
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'The consent request could not be sent.');
  }
  return result;
}

export async function withdrawEducatorConnection(connectionRequestId) {
  const token = await getSessionAccessToken();
  const response = await fetch('/api/dashboard/parent', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ connectionRequestId }),
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('The consent update returned an invalid response.', { cause: error });
  }
  if (!response.ok) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'Consent could not be withdrawn.');
  }
  return result;
}

export async function updateUserProfile(profile) {
  const client = requireSupabase();
  const { data, error } = await client.auth.updateUser({ data: profile });
  if (error) throw new Error(error.message, { cause: error });
  if (!data?.user) throw new Error('The account service did not return the updated profile.');
  const current = getCurrentUser() || {};
  const updated = { ...current, ...profile, id: data.user.id, email: data.user.email };
  setLocalItem(LOCAL_STORAGE_KEY_USER, updated);
  return updated;
}

export async function saveProgress({ userId, lessonType, lessonId, meta = {} }) {
  const completedAt = new Date().toISOString();
  if (isAuthenticatedUserId(userId)) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('progress')
      .upsert({
        user_id: userId,
        lesson_type: lessonType,
        lesson_id: lessonId,
        completed_at: completedAt,
        meta,
      }, { onConflict: 'user_id,lesson_type,lesson_id' })
      .select('id,user_id,lesson_type,lesson_id,meta,completed_at')
      .single();
    return mapProgress(requirePersistedResult(data, error, 'Lesson progress could not be saved to your account.'));
  }
  const entry = {
    id: `prog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: userId || 'anonymous',
    lessonType,
    lessonId,
    meta,
    completedAt,
  };
  const progressList = getLocalItem(LOCAL_STORAGE_KEY_PROGRESS, []);
  progressList.push(entry);
  setLocalItem(LOCAL_STORAGE_KEY_PROGRESS, progressList);
  return entry;
}

export async function getUserProgress(userId) {
  if (isAuthenticatedUserId(userId)) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('progress')
      .select('id,user_id,lesson_type,lesson_id,meta,completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    if (error) throw new Error('Lesson progress could not be loaded from your account.', { cause: error });
    return (data || []).map(mapProgress);
  }
  const all = getLocalItem(LOCAL_STORAGE_KEY_PROGRESS, []);
  return userId ? all.filter((entry) => entry.userId === userId || entry.userId === 'anonymous') : all;
}

export async function saveCodeSubmission({ userId, title, code, output = '', language = 'yorubascript' }) {
  if (isAuthenticatedUserId(userId)) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('code_submissions')
      .insert({
        user_id: userId,
        title: title || 'Koodu Yorùbá Titun',
        code,
        output,
        language,
      })
      .select('id,user_id,title,code,output,language,created_at')
      .single();
    return mapCodeSubmission(requirePersistedResult(data, error, 'Your code could not be saved to your account.'));
  }
  const submission = {
    id: `code_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: userId || 'anonymous',
    title: title || 'Koodu Yorùbá Titun',
    code,
    output,
    language,
    createdAt: new Date().toISOString(),
  };
  const codeList = getLocalItem(LOCAL_STORAGE_KEY_CODE, []);
  codeList.unshift(submission);
  setLocalItem(LOCAL_STORAGE_KEY_CODE, codeList);
  return submission;
}

export async function getUserCodeSubmissions(userId) {
  if (isAuthenticatedUserId(userId)) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('code_submissions')
      .select('id,user_id,title,code,output,language,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Your saved code could not be loaded from your account.', { cause: error });
    return (data || []).map(mapCodeSubmission);
  }
  const all = getLocalItem(LOCAL_STORAGE_KEY_CODE, []);
  return userId ? all.filter((entry) => entry.userId === userId || entry.userId === 'anonymous') : all;
}

export async function saveVoiceRecord({ userId, text, targetLang, audioScore, pitchHz, lessonId = '' }) {
  if (isAuthenticatedUserId(userId)) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('voice_submissions')
      .insert({
        user_id: userId,
        text,
        target_lang: targetLang,
        audio_score: audioScore,
        pitch_hz: pitchHz,
        lesson_id: lessonId,
      })
      .select('id,user_id,text,target_lang,audio_score,pitch_hz,lesson_id,created_at')
      .single();
    return mapVoiceRecord(requirePersistedResult(data, error, 'Your voice practice could not be saved to your account.'));
  }
  const record = {
    id: `voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId: userId || 'anonymous',
    text,
    targetLang,
    audioScore,
    pitchHz,
    lessonId,
    createdAt: new Date().toISOString(),
  };
  const voiceList = getLocalItem(LOCAL_STORAGE_KEY_VOICE, []);
  voiceList.unshift(record);
  setLocalItem(LOCAL_STORAGE_KEY_VOICE, voiceList);
  return record;
}

export async function getUserVoiceRecords(userId) {
  if (isAuthenticatedUserId(userId)) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('voice_submissions')
      .select('id,user_id,text,target_lang,audio_score,pitch_hz,lesson_id,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Your voice practice records could not be loaded from your account.', { cause: error });
    return (data || []).map(mapVoiceRecord);
  }
  const all = getLocalItem(LOCAL_STORAGE_KEY_VOICE, []);
  return userId ? all.filter((entry) => entry.userId === userId || entry.userId === 'anonymous') : all;
}

export async function getAdultLearningSummary(userId) {
  if (!isAuthenticatedUserId(userId)) {
    throw new Error('Sign in to load your learning summary.');
  }
  const client = requireSupabase();
  const [
    { count: lessonCount, error: lessonError },
    { count: codingCount, error: codingError },
    { count: voiceCount, error: voiceError },
    { data: recentActivity, error: activityError },
  ] = await Promise.all([
    client.from('progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('lesson_type', 'lesson'),
    client.from('code_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    client.from('voice_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    client.from('progress')
      .select('lesson_type,lesson_id,completed_at')
      .eq('user_id', userId)
      .eq('lesson_type', 'lesson')
      .order('completed_at', { ascending: false })
      .limit(5),
  ]);
  if (lessonError || codingError || voiceError || activityError) {
    throw new Error('Your learning summary could not be loaded.', {
      cause: lessonError || codingError || voiceError || activityError,
    });
  }
  if (![lessonCount, codingCount, voiceCount].every(Number.isInteger)) {
    throw new Error('Your learning summary returned incomplete totals.');
  }
  return {
    completedLessons: lessonCount,
    codingSessions: codingCount,
    voicePractices: voiceCount,
    recentActivity: recentActivity || [],
  };
}

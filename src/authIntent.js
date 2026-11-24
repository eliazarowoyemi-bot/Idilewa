function routeIntent(route) {
  const normalized = String(route || '').replace(/^#\/?/, '').split(/[?#]/, 1)[0].toLowerCase();
  const match = normalized.match(/^(?:parent|family|tutor|educator)-(login|signup)$/);
  if (match) {
    return {
      role: /^(?:tutor|educator)-/.test(normalized) ? 'tutor' : 'parent',
      mode: match[1] === 'signup' ? 'signup' : 'signin',
    };
  }
  if (/^(?:kids-signup|child-signup|child-profile)$/.test(normalized)) {
    return { role: 'child', mode: 'signup' };
  }
  return null;
}

export function getAuthIntent({ href = '', route = '', label = '', role = '', mode = '' } = {}) {
  const explicitRole = ['parent', 'tutor', 'child'].includes(String(role).toLowerCase())
    ? String(role).toLowerCase()
    : '';
  const explicitMode = ['signin', 'signup'].includes(String(mode).toLowerCase())
    ? String(mode).toLowerCase()
    : '';
  if (explicitRole && (explicitMode || explicitRole === 'child')) {
    return { role: explicitRole, mode: explicitMode || 'signup' };
  }

  const byRoute = routeIntent(route);
  if (byRoute) return byRoute;

  const cleanLabel = String(label).normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();
  const context = `${href} ${route} ${label}`;
  let url;
  try {
    url = new URL(href, 'https://idilewa.invalid');
  } catch {
    url = null;
  }

  const byHash = routeIntent(url?.hash);
  if (byHash) return byHash;
  if (/\/(?:kids-signup|child-signup)(?:\.html)?\/?$/i.test(url?.pathname || '')) {
    return { role: 'child', mode: 'signup' };
  }
  if (/\/(?:login|login\.html)\/?$/i.test(url?.pathname || '')) {
    return { role: /tutor|educator/i.test(context) ? 'tutor' : 'parent', mode: 'signin' };
  }

  if (/\b(?:get started|create account|create your account|sign up|join idilewa)\b/.test(cleanLabel)) {
    return { role: 'parent', mode: 'signup' };
  }
  if (/\b(?:sign in|log in|login)\b/.test(cleanLabel)) {
    const tutorContext = /tutor|educator/i.test(context);
    return { role: tutorContext ? 'tutor' : 'parent', mode: 'signin' };
  }
  if (/\b(?:create|sign up|register|join)\b/.test(cleanLabel)) {
    if (/tutor|educator/i.test(context)) return { role: 'tutor', mode: 'signup' };
    if (/parent|family/i.test(context)) return { role: 'parent', mode: 'signup' };
  }
  return null;
}

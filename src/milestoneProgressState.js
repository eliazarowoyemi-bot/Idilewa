const DEFAULT_PROGRESS = Object.freeze({
  primary: 'yo',
  support: 'en',
  level: 'Beginner',
  xp: 0,
  wallet: 7600,
  completed: 0,
  seen: {},
  recent: [],
  savedAt: 0,
});

const LANGUAGES = new Set(['yo', 'ig', 'ha', 'sw', 'pcm', 'en']);
const LEVELS = new Set(['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']);

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function boundedCount(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1_000_000_000, Math.max(0, Math.floor(number))) : fallback;
}

export function normalizeMilestoneProgress(value) {
  const progress = record(value);
  const primary = LANGUAGES.has(progress.primary) ? progress.primary : DEFAULT_PROGRESS.primary;
  const support = LANGUAGES.has(progress.support) && progress.support !== primary
    ? progress.support
    : primary === 'en' ? 'yo' : 'en';
  const seen = Object.fromEntries(
    Object.entries(record(progress.seen))
      .filter(([id, count]) => typeof id === 'string' && id.length <= 100 && Number.isFinite(Number(count)))
      .map(([id, count]) => [id, boundedCount(count)])
      .filter(([, count]) => count > 0),
  );
  const recent = Array.isArray(progress.recent)
    ? progress.recent.filter((id) => typeof id === 'string' && id.length <= 100).slice(0, 45)
    : [];
  const xp = Number(progress.xp);
  const wallet = Number(progress.wallet);
  const savedAt = Number(progress.savedAt);

  return {
    primary,
    support,
    level: LEVELS.has(progress.level) ? progress.level : DEFAULT_PROGRESS.level,
    xp: Number.isFinite(xp) ? Math.min(1_000_000_000, Math.max(0, xp)) : DEFAULT_PROGRESS.xp,
    wallet: Number.isFinite(wallet) ? Math.min(1_000_000_000, Math.max(0, wallet)) : DEFAULT_PROGRESS.wallet,
    completed: boundedCount(progress.completed),
    seen,
    recent,
    savedAt: Number.isFinite(savedAt) ? Math.max(0, savedAt) : DEFAULT_PROGRESS.savedAt,
  };
}

export function mergeMilestoneProgress(first, second) {
  const left = normalizeMilestoneProgress(first);
  const right = normalizeMilestoneProgress(second);
  const latest = left.savedAt >= right.savedAt ? left : right;
  const seen = { ...left.seen };
  for (const [id, count] of Object.entries(right.seen)) {
    seen[id] = Math.max(seen[id] || 0, count);
  }

  return normalizeMilestoneProgress({
    ...latest,
    xp: Math.max(left.xp, right.xp),
    completed: Math.max(left.completed, right.completed),
    seen,
    savedAt: Math.max(left.savedAt, right.savedAt),
  });
}

export function hasMilestoneProgress(value) {
  const progress = normalizeMilestoneProgress(value);
  return progress.xp > 0
    || progress.completed > 0
    || Object.keys(progress.seen).length > 0
    || progress.primary !== DEFAULT_PROGRESS.primary
    || progress.support !== DEFAULT_PROGRESS.support
    || progress.level !== DEFAULT_PROGRESS.level
    || progress.wallet !== DEFAULT_PROGRESS.wallet;
}

export { DEFAULT_PROGRESS };

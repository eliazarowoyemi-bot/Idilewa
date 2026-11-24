const GAME_CONFIGS = {
  'turbo-racers': {
    path: '/games/turbo-racers?embed=1',
    outcomes: ['won', 'finished'],
    difficulties: ['easy', 'medium', 'hard'],
  },
  'balloon-ludo': {
    path: '/games/balloon-ludo?embed=1',
    outcomes: ['won'],
    difficulties: ['beginner', 'intermediate', 'advanced'],
  },
};

const LANGUAGES = new Set(['en', 'yo', 'ig', 'ha', 'sw']);

export function verifyGameCompletionMessage(event, frame, origin) {
  if (!event || !frame || typeof origin !== 'string') return null;
  if (event.origin !== origin || event.source !== frame.contentWindow) return null;

  const payload = event.data;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  if (payload.type !== 'idilewa-game-complete' || typeof payload.game !== 'string') return null;
  if (!Object.hasOwn(GAME_CONFIGS, payload.game)) return null;

  const game = GAME_CONFIGS[payload.game];
  if (frame.getAttribute('src') !== game.path) return null;
  if (!game.outcomes.includes(payload.outcome)) return null;
  if (!game.difficulties.includes(payload.difficulty)) return null;
  if (!LANGUAGES.has(payload.language)) return null;
  if (!Number.isSafeInteger(payload.score) || payload.score < 0 || payload.score > 100000) return null;

  return {
    game: payload.game,
    outcome: payload.outcome,
    score: payload.score,
    difficulty: payload.difficulty,
    language: payload.language,
  };
}

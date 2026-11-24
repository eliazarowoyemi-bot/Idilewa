export const HOMEPAGE_ARCADE_GAMES = Object.freeze([
  Object.freeze({
    id: 'turbo-racers',
    emoji: '🏎️',
    title: 'Turbo Racers',
    description: 'Race, solve and celebrate your learning.',
    difficulty: 'Easy · Medium · Hard',
    path: '/games/turbo-racers.html',
  }),
  Object.freeze({
    id: 'balloon-ludo',
    emoji: '🎲',
    title: 'Balloon Ludo',
    description: 'Play together, solve timed questions and win knowledge stars.',
    difficulty: 'Beginner · Intermediate · Advanced',
    path: '/games/balloon-ludo.html',
  }),
]);

function createArcadeCard(documentRef, game) {
  const card = documentRef.createElement('article');
  card.className = 'game-directory-card';
  card.dataset.arcadeGame = game.id;

  const emoji = documentRef.createElement('div');
  emoji.style.fontSize = '32px';
  emoji.textContent = game.emoji;

  const heading = documentRef.createElement('h3');
  heading.textContent = game.title;

  const description = documentRef.createElement('p');
  description.textContent = game.description;

  const difficulty = documentRef.createElement('small');
  difficulty.textContent = game.difficulty;

  const button = documentRef.createElement('button');
  button.type = 'button';
  button.textContent = `Open ${game.title} →`;

  card.append(emoji, heading, description, difficulty, button);
  return { card, button };
}

function createSwitcherButton(documentRef, game) {
  const button = documentRef.createElement('button');
  button.type = 'button';
  button.className = 'idilewa-game-tile';
  button.dataset.game = game.id;
  button.setAttribute('aria-label', `Open ${game.title}`);

  const emoji = documentRef.createElement('span');
  emoji.className = 'game-emoji';
  emoji.textContent = game.emoji;

  const title = documentRef.createElement('span');
  title.textContent = game.title;
  button.append(emoji, title);
  return button;
}

export function installHomepageArcadeIntegration(documentRef, windowRef) {
  const gameDirectory = documentRef.getElementById('all-coding-games');
  const gameGrid = gameDirectory?.querySelector('.game-directory-grid');
  const gamePane = documentRef.getElementById('arcade-merged-pane');
  const gameFrame = documentRef.getElementById('arcade-merged-frame');
  const gameNavigation = documentRef.getElementById('game-nav-bar');
  const gameTitle = documentRef.getElementById('game-current-title');
  const switcher = documentRef.getElementById('idilewa-game-switcher');
  const switcherGrid = switcher?.querySelector('.idilewa-game-tiles');
  const switcherHeading = switcher?.querySelector('h3');
  const codeLab = documentRef.getElementById('codeLab');

  if (
    !gameDirectory
    || !gameGrid
    || !gamePane
    || !gameFrame
    || !gameNavigation
    || !gameTitle
    || !switcherGrid
    || !switcherHeading
    || !codeLab
  ) {
    throw new Error('The Code Playground is missing a required game directory or arcade view.');
  }

  for (const game of HOMEPAGE_ARCADE_GAMES) {
    if (!gameGrid.querySelector(`[data-arcade-game="${game.id}"]`)) {
      const { card, button } = createArcadeCard(documentRef, game);
      button.addEventListener('click', () => windowRef.openCodeGame(game.id));
      gameGrid.append(card);
    }

    if (!switcherGrid.querySelector(`[data-game="${game.id}"]`)) {
      const button = createSwitcherButton(documentRef, game);
      button.addEventListener('click', () => windowRef.openCodeGame(game.id));
      switcherGrid.append(button);
    }
  }

  switcherHeading.textContent = `🎮 Select a game · ${switcherGrid.querySelectorAll('button').length} games`;

  const originalOpen = windowRef.openCodeGame;
  const originalClose = windowRef.closeCodeGame;
  const originalNext = windowRef.nextCodeGame;
  if (typeof originalOpen !== 'function' || typeof originalClose !== 'function' || typeof originalNext !== 'function') {
    throw new Error('The Code Playground game controls are unavailable.');
  }

  let activeArcadeGame = null;

  windowRef.openCodeGame = (id) => {
    const game = HOMEPAGE_ARCADE_GAMES.find((entry) => entry.id === id);
    if (!game) {
      if (activeArcadeGame) {
        gameFrame.src = 'about:blank';
        activeArcadeGame = null;
      }
      return originalOpen(id);
    }

    if (typeof windowRef.go !== 'function') {
      throw new Error('The Code Playground navigation is unavailable.');
    }
    activeArcadeGame = game;
    windowRef.go('codeLab');
    codeLab.classList.add('code-playing');
    documentRef.querySelectorAll('#codeLab .game-view-pane').forEach((pane) => {
      pane.classList.remove('game-active');
    });
    gamePane.classList.add('game-active');
    gameNavigation.hidden = false;
    gameTitle.textContent = game.title;
    gameFrame.removeAttribute('srcdoc');
    gameFrame.src = game.path;
    const top = gameNavigation.getBoundingClientRect().top + windowRef.scrollY - 110;
    windowRef.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  };

  windowRef.closeCodeGame = () => {
    if (activeArcadeGame) {
      gameFrame.src = 'about:blank';
      activeArcadeGame = null;
    }
    return originalClose();
  };

  windowRef.nextCodeGame = () => {
    if (!activeArcadeGame) return originalNext();
    const currentIndex = HOMEPAGE_ARCADE_GAMES.findIndex((game) => game.id === activeArcadeGame.id);
    const nextGame = HOMEPAGE_ARCADE_GAMES[(currentIndex + 1) % HOMEPAGE_ARCADE_GAMES.length];
    return windowRef.openCodeGame(nextGame.id);
  };

  if (windowRef.location.hash === '#all-coding-games') {
    windowRef.requestAnimationFrame(() => {
      const top = gameDirectory.getBoundingClientRect().top + windowRef.scrollY - 110;
      windowRef.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    });
  }
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    installHomepageArcadeIntegration(document, window);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      installHomepageArcadeIntegration(document, window);
    }, { once: true });
  }
}

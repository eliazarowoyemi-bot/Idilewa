const HISTORY_KEY = 'idilewaLearningLesson';

export function installHomepageLearningView({
  windowObject = window,
  documentObject = document,
} = {}) {
  const learning = documentObject.getElementById('learning');
  const steps = documentObject.getElementById('steps');
  const lesson = learning?.querySelector('.panel.lesson');
  const lessonNavigation = lesson?.nextElementSibling;
  const learningParent = learning?.parentElement;
  const body = documentObject.body;
  const backgroundState = new Map();
  const overview = [
    learning?.querySelector(':scope > .row'),
    learning?.querySelector('.journeyHero'),
    learning?.querySelector('.journeyProgress'),
    learning?.querySelector('.journeyTitle'),
    steps,
  ];
  const originalGo = windowObject.go;

  if (!body || !learning || !learningParent || !steps || !lesson || !lessonNavigation
    || !lessonNavigation.classList.contains('toolbar')
    || overview.some((element) => !element)
    || typeof originalGo !== 'function') {
    throw new Error('Homepage learning view controls could not be initialized.');
  }

  const backButton = documentObject.createElement('button');
  backButton.type = 'button';
  backButton.className = 'secondary hidden';
  backButton.textContent = '← Back to Learning Journey';
  backButton.setAttribute('aria-label', 'Back to Learning Journey');
  learning.insertBefore(backButton, overview[0]);

  lesson.classList.add('hidden');
  lessonNavigation.classList.add('hidden');

  let lessonViewOpen = false;

  function showLessonView() {
    lessonViewOpen = true;
    isolatePageBackground();
    overview.forEach((element) => element.classList.add('hidden'));
    backButton.classList.remove('hidden');
    lesson.classList.remove('hidden');
    lessonNavigation.classList.remove('hidden');
    windowObject.scrollTo(0, 0);
    backButton.focus({ preventScroll: true });
  }

  function showJourneyView({ restoreFocus = true } = {}) {
    if (!lessonViewOpen) return;

    lessonViewOpen = false;
    overview.forEach((element) => element.classList.remove('hidden'));
    backButton.classList.add('hidden');
    lesson.classList.add('hidden');
    lessonNavigation.classList.add('hidden');
    restorePageBackground();
    windowObject.scrollTo(0, 0);

    if (restoreFocus) {
      steps.querySelector('.step.active')?.focus({ preventScroll: true });
    }
  }

  function getPageBackground() {
    const bodySiblings = [...body.children].filter((element) => (
      !element.contains(learning) && !['SCRIPT', 'STYLE'].includes(element.tagName)
    ));
    const mainSiblings = [...learningParent.children].filter((element) => element !== learning);
    return new Set([...bodySiblings, ...mainSiblings]);
  }

  function isolatePageBackground() {
    getPageBackground().forEach((element) => {
      if (!backgroundState.has(element)) {
        backgroundState.set(element, { hidden: element.hidden, inert: element.inert });
      }
      element.hidden = true;
      element.inert = true;
    });
  }

  function restorePageBackground() {
    backgroundState.forEach(({ hidden, inert }, element) => {
      element.hidden = hidden;
      element.inert = inert;
    });
    backgroundState.clear();
  }

  function openLessonView() {
    if (lessonViewOpen) return;

    const currentState = windowObject.history.state;
    const nextState = currentState && typeof currentState === 'object'
      ? { ...currentState }
      : {};
    nextState[HISTORY_KEY] = true;
    windowObject.history.pushState(nextState, '', windowObject.location.href);
    showLessonView();
  }

  function clearLessonHistoryMarker() {
    const currentState = windowObject.history.state;
    if (!currentState?.[HISTORY_KEY]) return;

    const nextState = currentState && typeof currentState === 'object'
      ? { ...currentState }
      : {};
    delete nextState[HISTORY_KEY];
    windowObject.history.replaceState(nextState, '', windowObject.location.href);
  }

  function handleStageClick(event) {
    if (!event.target?.closest?.('.step')) return;
    queueMicrotask(openLessonView);
  }

  function handleBackClick() {
    if (windowObject.history.state?.[HISTORY_KEY]) {
      windowObject.history.back();
      return;
    }
    showJourneyView();
  }

  function handlePopState(event) {
    if (event.state?.[HISTORY_KEY]) {
      showLessonView();
    } else {
      showJourneyView();
    }
  }

  const backgroundObserver = typeof windowObject.MutationObserver === 'function'
    ? new windowObject.MutationObserver(() => {
      if (lessonViewOpen) isolatePageBackground();
    })
    : null;
  backgroundObserver?.observe(body, { childList: true });
  backgroundObserver?.observe(learningParent, { childList: true });

  steps.addEventListener('click', handleStageClick, { capture: true });
  backButton.addEventListener('click', handleBackClick);
  windowObject.addEventListener('popstate', handlePopState);

  windowObject.go = function goWithLearningView(id, ...args) {
    if (id !== 'learning' && lessonViewOpen) {
      clearLessonHistoryMarker();
      showJourneyView({ restoreFocus: false });
    }
    return originalGo.call(windowObject, id, ...args);
  };

  if (windowObject.history.state?.[HISTORY_KEY]) {
    originalGo.call(windowObject, 'learning');
    showLessonView();
  }

  return () => {
    if (lessonViewOpen) showJourneyView({ restoreFocus: false });
    steps.removeEventListener('click', handleStageClick, { capture: true });
    backButton.removeEventListener('click', handleBackClick);
    windowObject.removeEventListener('popstate', handlePopState);
    windowObject.go = originalGo;
    backgroundObserver?.disconnect();
    backButton.remove();
  };
}

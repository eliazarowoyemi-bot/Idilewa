import assert from 'node:assert/strict';
import test from 'node:test';
import { installHomepageLearningView } from '../src/homepageLearningView.js';

class FakeClassList {
  constructor(values = []) {
    this.values = new Set(values);
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeElement {
  constructor(classNames = [], tagName = 'DIV') {
    this.classList = new FakeClassList(classNames);
    this.listeners = new Map();
    this.attributes = new Map();
    this.children = [];
    this.tagName = tagName;
    this.hidden = false;
    this.inert = false;
  }

  set className(value) {
    this.classList = new FakeClassList(value.split(/\s+/).filter(Boolean));
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.get(type) === listener) this.listeners.delete(type);
  }

  dispatch(type, event = {}) {
    this.listeners.get(type)?.(event);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  insertBefore(element, before) {
    this.children.splice(this.children.indexOf(before), 0, element);
    element.parentElement = this;
  }

  querySelector(selector) {
    if (selector === '.step.active') return this.activeStage;
    return null;
  }

  contains(element) {
    return this === element || this.children.some((child) => child.contains(element));
  }

  focus(options) {
    this.focusOptions = options;
  }

  remove() {
    this.parentElement?.children.splice(this.parentElement.children.indexOf(this), 1);
  }
}

function createLearningViewFixture() {
  const learning = new FakeElement();
  const steps = new FakeElement();
  const lesson = new FakeElement();
  const lessonNavigation = new FakeElement(['toolbar']);
  const activeStage = new FakeElement();
  const header = new FakeElement([], 'HEADER');
  const main = new FakeElement([], 'MAIN');
  const pageSection = new FakeElement([], 'SECTION');
  const tutorSection = new FakeElement([], 'SECTION');
  const body = new FakeElement([], 'BODY');
  const overview = {
    ':scope > .row': new FakeElement(),
    '.journeyHero': new FakeElement(),
    '.journeyProgress': new FakeElement(),
    '.journeyTitle': new FakeElement(),
  };
  learning.children.push(...Object.values(overview));
  learning.parentElement = main;
  pageSection.parentElement = main;
  main.children.push(learning, pageSection);
  header.parentElement = body;
  main.parentElement = body;
  tutorSection.parentElement = body;
  body.children.push(header, main, tutorSection);
  const elements = { learning, steps };
  const listeners = new Map();

  learning.querySelector = (selector) => (
    selector === '.panel.lesson' ? lesson : overview[selector]
  );
  learning.insertBefore = function insertBefore(element, before) {
    FakeElement.prototype.insertBefore.call(this, element, before);
    elements.backButton = element;
  };
  lesson.nextElementSibling = lessonNavigation;
  steps.activeStage = activeStage;

  const history = {
    state: null,
    backCalls: 0,
    pushState(state) {
      this.state = state;
    },
    replaceState(state) {
      this.state = state;
    },
    back() {
      this.backCalls += 1;
    },
  };
  const windowObject = {
    history,
    location: { href: 'https://idilewa.com/' },
    go(id) {
      this.lastRoute = id;
    },
    scrollTo() {},
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
  const documentObject = {
    body,
    getElementById(id) {
      return elements[id] || null;
    },
    createElement() {
      return new FakeElement();
    },
  };

  return {
    activeStage,
    elements,
    header,
    history,
    lesson,
    lessonNavigation,
    overview,
    pageSection,
    steps,
    tutorSection,
    windowObject,
    documentObject,
    windowListeners: listeners,
  };
}

async function clickStage(fixture) {
  fixture.steps.dispatch('click', {
    target: { closest: (selector) => (selector === '.step' ? fixture.activeStage : null) },
  });
  await new Promise((resolve) => setImmediate(resolve));
}

test('selecting a stage opens a focused lesson and Back restores the journey', async () => {
  const fixture = createLearningViewFixture();
  const dispose = installHomepageLearningView(fixture);
  const backButton = fixture.elements.backButton;

  assert.equal(fixture.lesson.classList.contains('hidden'), true);
  assert.equal(fixture.lessonNavigation.classList.contains('hidden'), true);

  await clickStage(fixture);

  assert.equal(fixture.history.state.idilewaLearningLesson, true);
  assert.equal(fixture.lesson.classList.contains('hidden'), false);
  assert.equal(fixture.lessonNavigation.classList.contains('hidden'), false);
  assert.equal(backButton.classList.contains('hidden'), false);
  assert.equal(backButton.attributes.get('aria-label'), 'Back to Learning Journey');
  assert.deepEqual(backButton.focusOptions, { preventScroll: true });
  assert.equal(fixture.header.hidden, true);
  assert.equal(fixture.header.inert, true);
  assert.equal(fixture.tutorSection.hidden, true);
  assert.equal(fixture.pageSection.hidden, true);
  assert.ok(Object.values(fixture.overview).every((element) => (
    element.classList.contains('hidden')
  )));

  backButton.dispatch('click');
  assert.equal(fixture.history.backCalls, 1);
  fixture.windowListeners.get('popstate')({ state: null });

  assert.equal(fixture.lesson.classList.contains('hidden'), true);
  assert.equal(backButton.classList.contains('hidden'), true);
  assert.equal(fixture.header.hidden, false);
  assert.equal(fixture.header.inert, false);
  assert.equal(fixture.tutorSection.hidden, false);
  assert.equal(fixture.pageSection.hidden, false);
  assert.ok(Object.values(fixture.overview).every((element) => (
    !element.classList.contains('hidden')
  )));
  assert.deepEqual(fixture.activeStage.focusOptions, { preventScroll: true });

  dispose();
});

test('leaving the learning section clears the focused-view history state', async () => {
  const fixture = createLearningViewFixture();
  const dispose = installHomepageLearningView(fixture);

  await clickStage(fixture);
  fixture.windowObject.go('studio');

  assert.equal(fixture.windowObject.lastRoute, 'studio');
  assert.equal(fixture.history.state.idilewaLearningLesson, undefined);
  assert.equal(fixture.lesson.classList.contains('hidden'), true);

  dispose();
});

test('a restored lesson history entry opens the learning section directly', () => {
  const fixture = createLearningViewFixture();
  fixture.history.state = { idilewaLearningLesson: true };
  const dispose = installHomepageLearningView(fixture);

  assert.equal(fixture.windowObject.lastRoute, 'learning');
  assert.equal(fixture.lesson.classList.contains('hidden'), false);
  assert.equal(fixture.tutorSection.hidden, true);

  dispose();

  assert.equal(fixture.tutorSection.hidden, false);
});

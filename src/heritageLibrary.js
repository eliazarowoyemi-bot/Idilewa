import { HERITAGE_LIBRARY_DATA as DATA } from './heritageLibraryData.js';

const STORAGE_KEY = 'idilewa-heritage-learning-v1';
const PAGE_SIZE = 12;
const DEFAULT_AGE = '9–12';
const STEPS = ['Explore', 'Overview', 'Read', 'Think', 'Vocabulary', 'Activity', 'Reflect', 'Celebrate'];
const CATEGORY_TITLES = {
  Folktales: 'Folktales & Stories',
  History: 'Historical Accounts',
  Lullabies: 'Lullabies & Songs',
  Proverbs: 'Proverbs & Sayings',
  Riddles: 'Riddles & Brainteasers',
  Poetry: 'Poetry & Oríkì',
};
const DEFAULT_PROGRESS = {
  step: 0,
  lang: 'en',
  answer: null,
  reflection: '',
  activityDone: false,
  readDone: false,
};

let progressLoaded = false;
let activeAge = DEFAULT_AGE;
let progressByAge = {};
let storageNotice = '';
let cataloguePage = 1;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function validAge(age) {
  return DATA.ageStories.some((story) => story.age === age);
}

function ensureProgressLoaded() {
  if (progressLoaded) return;
  progressLoaded = true;
  if (typeof window === 'undefined') return;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      throw new Error('Stored learning progress is invalid.');
    }
    if (validAge(saved.selectedAge)) activeAge = saved.selectedAge;
    if (saved.progressByAge && typeof saved.progressByAge === 'object' && !Array.isArray(saved.progressByAge)) {
      progressByAge = saved.progressByAge;
    }
  } catch {
    storageNotice = 'Saved progress could not be loaded. A new learning journey is ready for this visit.';
  }
}

function currentStory() {
  ensureProgressLoaded();
  return DATA.ageStories.find((story) => story.age === activeAge) || DATA.ageStories[0];
}

function currentProgress() {
  const story = currentStory();
  const saved = progressByAge[story.age] || {};
  const hasYoruba = Array.isArray(story.yo) && story.yo.length > 0;
  const answer = Number.isInteger(saved.answer) && saved.answer >= 0 && saved.answer < story.opts.length
    ? saved.answer
    : null;
  return {
    ...DEFAULT_PROGRESS,
    ...saved,
    step: Number.isInteger(saved.step) ? Math.max(0, Math.min(STEPS.length - 1, saved.step)) : 0,
    lang: saved.lang === 'yo' && hasYoruba ? 'yo' : 'en',
    answer,
    reflection: typeof saved.reflection === 'string' ? saved.reflection : '',
    activityDone: saved.activityDone === true,
    readDone: saved.readDone === true,
  };
}

function saveProgress(patch) {
  const story = currentStory();
  progressByAge[story.age] = { ...currentProgress(), ...patch };
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      selectedAge: activeAge,
      progressByAge,
    }));
    storageNotice = '';
  } catch {
    storageNotice = 'This browser could not save progress. Your current answers will remain available until you leave this page.';
  }
  updateStorageNotice();
}

function updateStorageNotice() {
  const status = document.getElementById('heritage-storage-status');
  if (!status) return;
  status.textContent = storageNotice || 'Reflections are saved only in this browser on this device.';
  status.dataset.warning = String(Boolean(storageNotice));
}

function learningStageError(message) {
  const status = document.getElementById('heritage-step-feedback');
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
}

function renderPassages(passages, language) {
  if (!Array.isArray(passages)) return '';
  return passages.map(([heading, body], index) => `<article class="heritage-story-chapter">
    <p class="heritage-chapter-label">Chapter ${String(index + 1).padStart(2, '0')}</p>
    <h3>${escapeHtml(heading)}</h3>
    <p lang="${language}">${escapeHtml(body)}</p>
  </article>`).join('');
}

function renderQuizFeedback(story, progress) {
  if (progress.answer === null) return '';
  const correct = progress.answer === story.correct;
  return `<p id="heritage-quiz-feedback" class="heritage-feedback ${correct ? 'is-success' : 'is-error'}" role="status">${correct
    ? 'Well done! Your answer is supported by the story.'
    : 'Not quite. Reread the important decision and try again.'}</p>`;
}

function renderStageContent(story, progress) {
  const hasYoruba = Array.isArray(story.yo) && story.yo.length > 0;
  switch (progress.step) {
    case 0:
      return `<h3>Welcome to the Proverb Collection</h3>
        <p>Explore an original story about integrity and kindness. Each age group has its own setting, characters and moral challenge.</p>`;
    case 1:
      return `<h3>Your learning goals</h3>
        <p>Understand <strong>ìwà</strong> (character), notice a difficult moral choice, explain its consequences, and apply the lesson in everyday life.</p>
        <p class="heritage-muted">This is an original educational adaptation of a moral theme, not a reproduced traditional folktale.</p>`;
    case 2: {
      const passages = progress.lang === 'yo' && hasYoruba ? story.yo : story.en;
      const language = progress.lang === 'yo' && hasYoruba ? 'yo' : 'en';
      return `<div class="heritage-language-switch" aria-label="Story language">
          <button type="button" data-action="heritage-language" data-language="en" aria-pressed="${progress.lang === 'en'}">English</button>
          <button type="button" data-action="heritage-language" data-language="yo" aria-pressed="${progress.lang === 'yo'}" ${hasYoruba ? '' : 'disabled'}>Yorùbá${hasYoruba ? '' : ' · pending'}</button>
        </div>
        <p class="heritage-note">${escapeHtml(story.translationStatus)}. ${hasYoruba ? 'Translations are editorial drafts, not independently verified.' : 'No substitute machine translation is shown.'}</p>
        ${renderPassages(passages, language)}
        <label class="heritage-check"><input type="checkbox" data-heritage-field="readDone" ${progress.readDone ? 'checked' : ''}><span>I have finished reading this story.</span></label>`;
    }
    case 3:
      return `<h3>Think carefully</h3>
        <fieldset class="heritage-quiz">
          <legend>${escapeHtml(story.question)}</legend>
          ${story.opts.map((option, index) => `<label class="heritage-choice">
            <input type="radio" name="heritage-answer" data-heritage-field="answer" value="${index}" ${progress.answer === index ? 'checked' : ''}>
            <span>${escapeHtml(option)}</span>
          </label>`).join('')}
        </fieldset>
        ${renderQuizFeedback(story, progress)}
        <p class="heritage-muted">Question translation is pending fluent-speaker review.</p>`;
    case 4: {
      const words = [
        ['Ìwà', 'Character or conduct'],
        ['Ẹwà', 'Beauty'],
        ['Ìwà rere', 'Good character'],
        ['Òtítọ́', 'Truth'],
        ['Ìrànlọ́wọ́', 'Help'],
        ['Ojúṣe', 'Responsibility'],
      ];
      return `<h3>Words that matter</h3>
        <p>Discover the meaning behind the story.</p>
        <dl class="heritage-vocabulary">${words.map(([yoruba, english]) => `<div>
          <dt lang="yo">${yoruba}</dt><dd>${english}</dd>
        </div>`).join('')}</dl>
        <p class="heritage-note">Pronunciation audio will be enabled only after reviewed recordings and performer-rights clearance.</p>`;
    }
    case 5:
      return `<h3>Your character challenge</h3>
        <p>${escapeHtml(story.activity)}</p>
        <label class="heritage-check"><input type="checkbox" data-heritage-field="activityDone" ${progress.activityDone ? 'checked' : ''}><span>I completed this activity or discussed it with a trusted adult.</span></label>`;
    case 6:
      return `<h3>Reflect on your choices</h3>
        <p>What would you do differently after reading this story?</p>
        <label class="heritage-field-label" for="heritage-reflection">My reflection</label>
        <textarea id="heritage-reflection" class="heritage-reflection" data-heritage-field="reflection" rows="5" placeholder="Write a short reflection here…">${escapeHtml(progress.reflection)}</textarea>
        <p id="heritage-storage-status" class="heritage-muted heritage-storage-status" data-warning="${Boolean(storageNotice)}" aria-live="polite">${escapeHtml(storageNotice || 'Your response is saved only in this browser on this device.')}</p>`;
    case 7:
      return `<div class="heritage-completion">
        <h3 lang="yo">Ẹ kú iṣẹ́!</h3>
        <p>You completed your Ìwà l'ẹwà learning journey.</p>
        <span class="heritage-completion-mark">Wisdom Star · Ages ${escapeHtml(story.age)}</span>
        <p class="heritage-muted">Good character grows through the choices we make. This learning marker is not a verified credential.</p>
        <a class="button button-outline" href="#heritage-age-paths">Explore another age</a>
      </div>`;
    default:
      return '';
  }
}

function renderLearningJourney() {
  const story = currentStory();
  const progress = currentProgress();
  const progressValue = progress.step + 1;
  return `<section class="heritage-learning-panel" id="heritage-learning-panel" aria-labelledby="heritage-learning-title">
    <header class="heritage-learning-heading">
      <div>
        <p class="heritage-age-label">Ages ${escapeHtml(story.age)} · ${STEPS[progress.step]}</p>
        <h2 id="heritage-learning-title" tabindex="-1">${escapeHtml(progress.lang === 'yo' && Array.isArray(story.yo) ? story.yoTitle : story.title)}</h2>
        <p class="heritage-proverb" lang="yo">Ìwà l'ẹwà · Good character is beauty</p>
      </div>
      <a class="heritage-change-age" href="#heritage-age-paths">Choose another age</a>
    </header>
    <nav class="heritage-stage-nav" aria-label="Learning stages">
      <ol>${STEPS.map((label, index) => `<li>
        <button type="button" data-action="heritage-step" data-step="${index}" ${progress.step === index ? 'aria-current="step"' : ''}>
          <span class="heritage-stage-number">${index + 1}</span><span>${label}</span>
        </button>
      </li>`).join('')}</ol>
    </nav>
    <div class="heritage-progress-copy">
      <span>Stage ${progressValue} of ${STEPS.length} · Ages ${escapeHtml(story.age)}</span>
      <progress max="${STEPS.length}" value="${progressValue}" aria-label="Learning journey progress"></progress>
    </div>
    <div class="heritage-stage-content">${renderStageContent(story, progress)}</div>
    <p id="heritage-step-feedback" class="heritage-feedback is-error" role="alert" hidden></p>
    <div class="heritage-stage-actions">
      <button type="button" class="button button-outline" data-action="heritage-back" ${progress.step === 0 ? 'disabled' : ''}>Back</button>
      ${progress.step < STEPS.length - 1 ? '<button type="button" class="button button-primary" data-action="heritage-next">Continue</button>' : ''}
    </div>
  </section>`;
}

function collectionCard(category, count) {
  const art = DATA.collectionArt[category];
  return `<button type="button" class="heritage-collection-card" data-action="heritage-filter-category" data-category="${escapeHtml(category)}">
    <img src="${art.src}" alt="${escapeHtml(art.alt)}" width="${art.width}" height="${art.height}" loading="lazy" decoding="async">
    <span class="heritage-collection-copy">
      <strong>${escapeHtml(CATEGORY_TITLES[category] || category)}</strong>
      <span>${count} ${count === 1 ? 'catalogue record' : 'catalogue records'} · educational drafts and samples</span>
    </span>
  </button>`;
}

function allCatalogueRecords() {
  return [...DATA.records, ...DATA.editorialLessons];
}

function renderRecordDetails(record) {
  const fullStory = record.body || record.story;
  const questions = Array.isArray(record.questions) ? record.questions : [];
  return `<details class="heritage-entry-details">
    <summary>Read draft details</summary>
    <div class="heritage-entry-detail-copy">
      ${fullStory ? `<p class="heritage-full-story">${escapeHtml(fullStory)}</p>` : ''}
      ${record.moral ? `<p><strong>Learning note:</strong> ${escapeHtml(record.moral)}</p>` : ''}
      ${record.question && !questions.length ? `<p><strong>Question:</strong> ${escapeHtml(record.question)}</p>` : ''}
      ${questions.length ? `<div><strong>Questions</strong><ol>${questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('')}</ol></div>` : ''}
      ${record.vocabulary ? `<p><strong>Vocabulary:</strong> ${escapeHtml(record.vocabulary)}</p>` : ''}
      ${record.activity ? `<p><strong>Activity:</strong> ${escapeHtml(record.activity)}</p>` : ''}
      ${record.reflection ? `<p><strong>Reflection:</strong> ${escapeHtml(record.reflection)}</p>` : ''}
      <p class="heritage-entry-status"><strong>Status:</strong> ${escapeHtml(record.status)}</p>
    </div>
  </details>`;
}

function renderRecordCard(record) {
  return `<article class="heritage-entry-card">
    <img src="${record.image}" alt="${escapeHtml(record.imageAlt)}" width="${record.imageWidth || 640}" height="${record.imageHeight || 420}" loading="lazy" decoding="async">
    <div class="heritage-entry-copy">
      <p class="heritage-entry-category">${escapeHtml(record.category)} · ${escapeHtml(record.language)}${record.age ? ` · Ages ${escapeHtml(record.age)}` : ''}</p>
      <h3>${escapeHtml(record.title)}</h3>
      <p>${escapeHtml(record.english && record.english !== record.title ? record.english : record.story)}</p>
      ${record.contentLanguage === 'English' ? '<span class="heritage-draft-label">English editorial draft</span>' : ''}
      ${renderRecordDetails(record)}
    </div>
  </article>`;
}

export function filterHeritageRecords(records, filters = {}) {
  const query = String(filters.query || '').trim().toLocaleLowerCase();
  const language = String(filters.language || '');
  const category = String(filters.category || '');
  const age = String(filters.age || '');
  const matching = records.filter((record) => {
    if (language && record.language !== language) return false;
    if (category && record.category !== category) return false;
    if (age && record.age !== age) return false;
    if (!query) return true;
    const searchableText = [
      record.id, record.title, record.english, record.category, record.language,
      record.story, record.body, record.moral, record.question, record.status,
    ].filter(Boolean).join(' ').toLocaleLowerCase();
    return searchableText.includes(query);
  });
  return matching.sort((left, right) => filters.sort === 'category'
    ? left.category.localeCompare(right.category) || left.title.localeCompare(right.title)
    : left.title.localeCompare(right.title));
}

export function getHeritageCollectionCounts(records, categories = DATA.categories) {
  return Object.fromEntries(categories.map((category) => [
    category,
    records.filter((record) => record.category === category).length,
  ]));
}

export function updateHeritageCatalogue() {
  const resultsRoot = document.getElementById('heritage-results');
  if (!resultsRoot) return;
  const getFilterValue = (name) => document.querySelector(`[data-heritage-filter="${name}"]`)?.value || '';
  const allRecords = allCatalogueRecords();
  const filtered = filterHeritageRecords(allRecords, {
    query: getFilterValue('query'),
    language: getFilterValue('language'),
    category: getFilterValue('category'),
    age: getFilterValue('age'),
    sort: getFilterValue('sort'),
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  cataloguePage = Math.max(1, Math.min(cataloguePage, pageCount));
  const start = (cataloguePage - 1) * PAGE_SIZE;
  const pageRecords = filtered.slice(start, start + PAGE_SIZE);
  resultsRoot.innerHTML = pageRecords.length
    ? pageRecords.map(renderRecordCard).join('')
    : '<p class="heritage-empty-results">No entries match these filters. Try another search or clear the filters.</p>';
  const count = document.getElementById('heritage-count');
  if (count) count.textContent = filtered.length
    ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} catalogue entries`
    : 'No catalogue entries match the current filters.';
  const pagination = document.getElementById('heritage-pagination');
  if (pagination) {
    pagination.innerHTML = `<button type="button" class="button button-outline" data-action="heritage-page-prev" ${cataloguePage <= 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${cataloguePage} of ${pageCount}</span>
      <button type="button" class="button button-outline" data-action="heritage-page-next" ${cataloguePage >= pageCount ? 'disabled' : ''}>Next</button>`;
  }
}

function renderCatalogue() {
  const counts = getHeritageCollectionCounts(allCatalogueRecords());
  const categories = DATA.categories;
  return `<section class="heritage-library-section" aria-labelledby="heritage-library-title">
    <header class="heritage-section-heading">
      <h2 id="heritage-library-title">Heritage &amp; Stories Library</h2>
      <p>Discover African stories, traditions and wisdom. Choose a collection or explore the age-based learning journeys above.</p>
    </header>
    <div class="heritage-collection-grid" aria-label="Heritage collections">
      ${categories.map((category) => collectionCard(category, counts[category])).join('')}
    </div>
    <section class="heritage-most-read" aria-labelledby="heritage-most-read-title">
      <div>
        <h3 id="heritage-most-read-title">Most Read Stories</h3>
        <p>Community favourites will appear when verified reading activity is available.</p>
      </div>
      <p class="heritage-ranking-status">Reading rankings are coming soon. No estimated or demonstration read counts are shown.</p>
    </section>
    <details class="heritage-catalogue-disclosure" id="heritage-catalogue">
      <summary>More Heritage Stories — Explore the 300-concept register</summary>
      <div class="heritage-catalogue-content">
        <p class="heritage-catalogue-note">The 300-entry expansion register is a development target. This catalogue currently contains 40 cultural concept records and 6 editorial lessons; language verification, rights checks and age adaptations remain pending.</p>
        <p class="heritage-note"><strong>Editorial status:</strong> 18 English drafts and samples are available (6 earlier samples and 12 new drafts); 282 of 300 planned concepts are not drafted, and none are publication-ready. The collection counters above count catalogue records, not finished lessons.</p>
        <search class="heritage-filters" aria-label="Search and filter heritage entries">
          <label class="heritage-search-field" for="heritage-search">Search stories and concepts
            <input id="heritage-search" type="search" data-heritage-filter="query" placeholder="Search by title or topic" autocomplete="off">
          </label>
          <label for="heritage-language-filter">Language
            <select id="heritage-language-filter" data-heritage-filter="language">
              <option value="">All languages</option>
              <option>Yorùbá</option><option>Igbo</option><option>Hausa</option><option>Kiswahili</option>
            </select>
          </label>
          <label for="heritage-category-filter">Collection
            <select id="heritage-category-filter" data-heritage-filter="category">
              <option value="">All collections</option>
              ${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(CATEGORY_TITLES[category] || category)}</option>`).join('')}
            </select>
          </label>
          <label for="heritage-age-filter">Age adaptation
            <select id="heritage-age-filter" data-heritage-filter="age" disabled aria-describedby="heritage-age-filter-note">
              <option value="">All ages</option>
              ${DATA.ageStories.map((story) => `<option value="${escapeHtml(story.age)}">${escapeHtml(story.age)}</option>`).join('')}
            </select>
            <span id="heritage-age-filter-note">Age suitability for catalogue entries is awaiting editorial review.</span>
          </label>
          <label for="heritage-sort-filter">Sort
            <select id="heritage-sort-filter" data-heritage-filter="sort">
              <option value="title">Title A–Z</option><option value="category">Collection</option>
            </select>
          </label>
        </search>
        <p id="heritage-count" class="heritage-result-count" aria-live="polite"></p>
        <div id="heritage-results" class="heritage-entry-grid"></div>
        <nav id="heritage-pagination" class="heritage-pagination" aria-label="Heritage catalogue pages"></nav>
      </div>
    </details>
  </section>`;
}

export function renderHeritageLibrary() {
  ensureProgressLoaded();
  const ages = DATA.ageStories;
  const ageCards = ages.map((story) => `<button type="button" class="heritage-age-card" data-action="heritage-select-age" data-age="${escapeHtml(story.age)}" aria-pressed="${story.age === activeAge}">
    <img src="${story.src}" alt="${escapeHtml(story.alt)}" width="${story.width}" height="${story.height}" ${story.age === DEFAULT_AGE ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
    <span class="heritage-age-range">Ages ${escapeHtml(story.age)}</span>
    <strong>${escapeHtml(story.title)}</strong>
    <span class="heritage-age-card-action">${story.age === activeAge ? 'Selected journey' : 'Open this journey'}</span>
  </button>`).join('');
  const markup = `<div class="container route-page heritage-library-page">
    <div class="breadcrumbs"><a href="#/index" data-route="index">Home</a><span class="breadcrumb-sep" aria-hidden="true"></span><a href="#/oral" data-route="oral">Read &amp; listen</a><span class="breadcrumb-sep" aria-hidden="true"></span><strong>Heritage Library</strong></div>
    <header class="heritage-intro">
      <h1>Discover the beauty of good character.</h1>
      <p>Five age-adapted journeys through the Yorùbá proverb <span lang="yo">Ìwà l'ẹwà</span>. Read, reflect, learn and celebrate meaningful progress.</p>
    </header>
    <section class="heritage-age-section" id="heritage-age-paths" aria-labelledby="heritage-age-title">
      <header class="heritage-section-heading">
        <h2 id="heritage-age-title">Choose an age journey</h2>
        <p>Stories and challenges change with age. Select a card to open its learning journey.</p>
      </header>
      <div class="heritage-age-grid">${ageCards}</div>
    </section>
    ${renderLearningJourney()}
    ${renderCatalogue()}
    <footer class="heritage-content-note">Ìdíléwa · Original educational fiction · Unverified translations are clearly labelled · This sample is not a rights-cleared production library.</footer>
  </div>`;
  requestAnimationFrame(updateHeritageCatalogue);
  return markup;
}

export function handleHeritageFieldChange(element) {
  const field = element?.dataset?.heritageField;
  if (!field) return false;
  if (field === 'readDone') {
    saveProgress({ readDone: element.checked });
    learningStageError('');
  } else if (field === 'activityDone') {
    saveProgress({ activityDone: element.checked });
    learningStageError('');
  } else if (field === 'answer') {
    const answer = Number(element.value);
    saveProgress({ answer });
    const status = document.getElementById('heritage-quiz-feedback');
    const story = currentStory();
    if (status) {
      const correct = answer === story.correct;
      status.textContent = correct
        ? 'Well done! Your answer is supported by the story.'
        : 'Not quite. Reread the important decision and try again.';
      status.className = `heritage-feedback ${correct ? 'is-success' : 'is-error'}`;
    } else {
      const fieldset = document.querySelector('.heritage-quiz');
      fieldset?.insertAdjacentHTML('afterend', renderQuizFeedback(story, currentProgress()));
    }
    learningStageError('');
  } else {
    return false;
  }
  return true;
}

export function handleHeritageFieldInput(element) {
  if (element?.dataset?.heritageField === 'reflection') {
    saveProgress({ reflection: element.value });
    learningStageError('');
    return true;
  }
  return false;
}

export function handleHeritageAction(action, element) {
  ensureProgressLoaded();
  const progress = currentProgress();
  switch (action) {
    case 'heritage-select-age':
      if (!validAge(element.dataset.age)) return false;
      activeAge = element.dataset.age;
      cataloguePage = 1;
      saveProgress({});
      return true;
    case 'heritage-step': {
      const step = Number(element.dataset.step);
      if (!Number.isInteger(step) || step < 0 || step >= STEPS.length) return false;
      saveProgress({ step });
      learningStageError('');
      return true;
    }
    case 'heritage-back':
      if (progress.step === 0) return false;
      saveProgress({ step: progress.step - 1 });
      learningStageError('');
      return true;
    case 'heritage-next': {
      const story = currentStory();
      if (progress.step === 2 && !progress.readDone) {
        learningStageError('Finish reading the story before continuing.');
        return false;
      }
      if (progress.step === 3 && progress.answer !== story.correct) {
        learningStageError('Choose the answer supported by the story before continuing.');
        return false;
      }
      if (progress.step === 5 && !progress.activityDone) {
        learningStageError('Complete the activity or discuss it with a trusted adult before continuing.');
        return false;
      }
      if (progress.step === 6 && !progress.reflection.trim()) {
        learningStageError('Write a short reflection before continuing.');
        return false;
      }
      if (progress.step >= STEPS.length - 1) return false;
      saveProgress({ step: progress.step + 1 });
      learningStageError('');
      return true;
    }
    case 'heritage-language': {
      const language = element.dataset.language;
      const story = currentStory();
      if (language !== 'en' && !(language === 'yo' && Array.isArray(story.yo) && story.yo.length)) return false;
      saveProgress({ lang: language });
      return true;
    }
    case 'heritage-filter-category': {
      const select = document.querySelector('[data-heritage-filter="category"]');
      const catalogue = document.getElementById('heritage-catalogue');
      if (!DATA.categories.includes(element.dataset.category) || !select || !catalogue) return false;
      select.value = element.dataset.category;
      cataloguePage = 1;
      updateHeritageCatalogue();
      catalogue.open = true;
      catalogue.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
      select.focus({ preventScroll: true });
      return false;
    }
    case 'heritage-page-prev':
      cataloguePage = Math.max(1, cataloguePage - 1);
      updateHeritageCatalogue();
      return false;
    case 'heritage-page-next':
      cataloguePage += 1;
      updateHeritageCatalogue();
      return false;
    default:
      return false;
  }
}

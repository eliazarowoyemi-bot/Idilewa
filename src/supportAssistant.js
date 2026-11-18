import './supportAssistant.css';
import { searchFaq } from './supportAssistantSearch.js';

const assistantId = 'idilewa-support-assistant';
if (!document.getElementById(assistantId)) {
  const host = document.createElement('div');
  host.id = assistantId;
  host.innerHTML = `
    <button class="id-support-launcher" type="button" aria-expanded="false" aria-controls="id-support-panel" aria-label="Open Ìdíléwa help assistant">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5a7.5 7.5 0 1 1 17-4Z"></path>
        <path d="M8 11h8M8 14.5h5"></path>
      </svg>
      <span>Help</span>
    </button>
    <aside class="id-support-panel" id="id-support-panel" aria-labelledby="id-support-title" hidden>
      <header class="id-support-header">
        <div>
          <h2 id="id-support-title">Ask Ìdíléwa</h2>
          <p>Answers from our Help Centre</p>
        </div>
        <button class="id-support-close" type="button" aria-label="Close help assistant">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="m5 5 10 10M15 5 5 15"></path>
          </svg>
        </button>
      </header>
      <p class="id-support-note">This assistant searches curated FAQs; it is not live AI. Your message is not sent to a service or saved by this assistant.</p>
      <div class="id-support-log" role="log" aria-label="Help conversation" aria-relevant="additions">
      </div>
      <div class="id-support-suggestions" role="group" aria-label="Suggested questions">
        <p>Try asking</p>
        <button type="button">Which languages can I learn?</button>
        <button type="button">Is tutor booking available?</button>
        <button type="button">How do family tasks work?</button>
      </div>
      <form class="id-support-form">
        <label for="id-support-input">Your question</label>
        <p id="id-support-hint">Search the current, verified Help Centre answers.</p>
        <div class="id-support-compose">
          <input id="id-support-input" type="search" maxlength="250" required autocomplete="off" enterkeyhint="search" aria-describedby="id-support-hint" placeholder="Type a question">
          <button type="submit" aria-label="Search Help Centre">
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M3 10h13M10 4l6 6-6 6"></path>
            </svg>
          </button>
        </div>
      </form>
      <footer class="id-support-footer">
        <a href="/faq.html">Browse FAQs</a>
        <a href="mailto:support@idilewa.com">Email support</a>
      </footer>
    </aside>
  `;
  document.body.append(host);

  const launcher = host.querySelector('.id-support-launcher');
  const panel = host.querySelector('.id-support-panel');
  const closeButton = host.querySelector('.id-support-close');
  const log = host.querySelector('.id-support-log');
  const form = host.querySelector('.id-support-form');
  const input = host.querySelector('#id-support-input');
  const suggestions = host.querySelector('.id-support-suggestions');

  function appendTextMessage(text, kind) {
    const message = document.createElement('p');
    message.className = `id-support-message id-support-message--${kind}`;
    message.textContent = text;
    log.append(message);
    log.scrollTop = log.scrollHeight;
  }

  function appendResult(result) {
    const article = document.createElement('article');
    article.className = 'id-support-result';
    const heading = document.createElement('h3');
    heading.textContent = result.question;
    const answer = document.createElement('p');
    answer.textContent = result.answer;
    const source = document.createElement('a');
    source.href = result.url;
    source.textContent = `More: ${result.label}`;
    article.append(heading, answer, source);
    log.append(article);
    log.scrollTop = log.scrollHeight;
  }

  function submitQuestion(question) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    appendTextMessage(trimmedQuestion, 'user');
    const results = searchFaq(trimmedQuestion);
    if (!results.length) {
      appendTextMessage(
        'I could not find a verified answer for that yet, so I will not guess. Try another topic, browse the Help Centre, or email support@idilewa.com.',
        'assistant',
      );
      return;
    }

    appendTextMessage(
      results.length === 1
        ? 'Here is the closest verified answer I found:'
        : `Here are ${results.length} relevant answers from the Help Centre:`,
      'assistant',
    );
    results.forEach(appendResult);
  }

  appendTextMessage(
    'Hello! Ask about learning, family accounts, culture, tutors, plans, or support. I can only answer from the curated FAQs shown on this site.',
    'assistant',
  );

  launcher.addEventListener('click', () => {
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    launcher.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) input.focus();
  });

  closeButton.addEventListener('click', () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitQuestion(input.value);
    input.value = '';
  });

  suggestions.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (!button) return;
    input.value = button.textContent;
    form.requestSubmit();
  });
}

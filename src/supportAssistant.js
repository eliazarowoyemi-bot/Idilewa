import './supportAssistant.css';
import { sendSupportAssistantMessage } from './supportAssistantClient.js';

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
          <p>AI guide for Idilewa</p>
        </div>
        <button class="id-support-close" type="button" aria-label="Close help assistant">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="m5 5 10 10M15 5 5 15"></path>
          </svg>
        </button>
      </header>
      <div class="id-support-log" role="log" aria-label="Idilewa assistant conversation" aria-relevant="additions">
      </div>
      <div class="id-support-suggestions" role="group" aria-label="Suggested questions">
        <p>Try asking</p>
        <button type="button">Which languages can I learn?</button>
        <button type="button">How can my family get started?</button>
        <button type="button">What can I do in Code and Creative Studio?</button>
      </div>
      <form class="id-support-form">
        <label for="id-support-input">Your question</label>
        <p id="id-support-hint">Ask about pages, features, plans, or how they work together.</p>
        <div class="id-support-compose">
          <textarea id="id-support-input" name="message" rows="2" maxlength="1000" required aria-describedby="id-support-hint" placeholder="Ask anything about Idilewa"></textarea>
          <button type="submit" aria-label="Send message">
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="M3 10h13M10 4l6 6-6 6"></path>
            </svg>
          </button>
        </div>
      </form>
      <footer class="id-support-footer">
        <a href="/faq.html">Browse FAQs</a>
        <a href="/parents.html#/privacy">Privacy</a>
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
  const submitButton = form.querySelector('button[type="submit"]');
  const suggestionButtons = [...suggestions.querySelectorAll('button')];
  const messageHistory = [];
  let isSubmitting = false;

  function appendTextMessage(text, kind) {
    const message = document.createElement('p');
    message.className = `id-support-message id-support-message--${kind}`;
    message.textContent = text;
    if (kind === 'status') message.setAttribute('role', 'status');
    log.append(message);
    log.scrollTop = log.scrollHeight;
  }

  function appendSources(sources) {
    if (!sources.length) return;
    const container = document.createElement('div');
    container.className = 'id-support-sources';
    const label = document.createElement('p');
    label.textContent = 'Explore related pages';
    const links = document.createElement('div');
    links.className = 'id-support-source-links';
    sources.slice(0, 5).forEach((source) => {
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.title;
      links.append(link);
    });
    container.append(label, links);
    log.append(container);
    log.scrollTop = log.scrollHeight;
  }

  async function submitQuestion(question) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSubmitting) return;

    appendTextMessage(trimmedQuestion, 'user');
    input.value = '';
    isSubmitting = true;
    submitButton.disabled = true;
    suggestionButtons.forEach((button) => { button.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    const status = document.createElement('p');
    status.className = 'id-support-message id-support-message--status';
    status.setAttribute('role', 'status');
    status.textContent = 'Thinking…';
    log.append(status);
    log.scrollTop = log.scrollHeight;

    try {
      const result = await sendSupportAssistantMessage({
        message: trimmedQuestion,
        messages: messageHistory,
      });
      status.remove();
      appendTextMessage(result.reply, 'assistant');
      appendSources(result.sources);
      messageHistory.push(
        { role: 'user', text: trimmedQuestion },
        { role: 'assistant', text: result.reply },
      );
      if (messageHistory.length > 8) messageHistory.splice(0, messageHistory.length - 8);
    } catch (error) {
      status.remove();
      appendTextMessage(
        error instanceof Error ? error.message : 'The assistant could not complete this request. Please try again.',
        'assistant',
      );
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      suggestionButtons.forEach((button) => { button.disabled = false; });
      form.removeAttribute('aria-busy');
    }
  }

  appendTextMessage(
    'Hi! I’m Ìdíléwa’s AI guide. Ask about our pages and features, or how different parts of the site work together.',
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
    void submitQuestion(input.value);
  });

  suggestions.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest('button');
    if (!button) return;
    input.value = button.textContent;
    form.requestSubmit();
  });
}

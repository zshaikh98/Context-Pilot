import { ChatMessage, SITES } from '../shared/sites';
import { bootstrap, observeChat, detectModel } from './common';

async function init(): Promise<void> {
  const ctx = await bootstrap();
  if (!ctx) return;

  console.log('[ContextPilot] Perplexity content script active.');

  const selectors = SITES.perplexity.selectors;

  function parseMessages(): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Perplexity renders user queries and assistant answers in alternating blocks
    const userEls = document.querySelectorAll(selectors.userMessage);
    const assistantEls = document.querySelectorAll(selectors.assistantMessage);

    userEls.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        messages.push({ role: 'user', text });
      }
    });

    assistantEls.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        messages.push({ role: 'assistant', text });
      }
    });

    return messages;
  }

  function getModel(): string | null {
    return detectModel('perplexity');
  }

  // Wait for chat content to load
  const waitForContent = () => {
    const container = document.querySelector(selectors.messageContainer);
    if (container) {
      observeChat('perplexity', parseMessages, getModel);
    } else {
      setTimeout(waitForContent, 500);
    }
  };
  waitForContent();
}

init();

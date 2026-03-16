import { ChatMessage, SITES } from '../shared/sites';
import { bootstrap, observeChat, detectModel } from './common';

async function init(): Promise<void> {
  const ctx = await bootstrap();
  if (!ctx) return;

  console.log('[ContextPilot] Claude content script active.');

  const selectors = SITES.claude.selectors;

  function parseMessages(): ChatMessage[] {
    const messages: ChatMessage[] = [];

    const userEls = document.querySelectorAll(selectors.userMessage);
    userEls.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        messages.push({ role: 'user', text });
      }
    });

    const assistantEls = document.querySelectorAll(selectors.assistantMessage);
    assistantEls.forEach((el) => {
      const text = el.textContent?.trim();
      if (text) {
        messages.push({ role: 'assistant', text });
      }
    });

    return messages;
  }

  function getModel(): string | null {
    return detectModel('claude');
  }

  const waitForContent = () => {
    const container = document.querySelector(selectors.messageContainer);
    if (container) {
      observeChat('claude', parseMessages, getModel);
    } else {
      setTimeout(waitForContent, 500);
    }
  };
  waitForContent();
}

init();

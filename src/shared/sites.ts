export type SiteKey = 'perplexity' | 'chatgpt' | 'claude';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'other';
  text: string;
  timestamp?: number;
}

export interface SiteSelectors {
  messageContainer: string;
  userMessage: string;
  assistantMessage: string;
  inputBox: string;
  modelSelector: string;
}

export interface SiteConfig {
  key: SiteKey;
  label: string;
  hostPatterns: string[];
  selectors: SiteSelectors;
}

export const SITES: Record<SiteKey, SiteConfig> = {
  perplexity: {
    key: 'perplexity',
    label: 'Perplexity',
    hostPatterns: ['www.perplexity.ai'],
    selectors: {
      messageContainer: '[class*="ConversationMessages"], main',
      userMessage: '[class*="query-text"], .whitespace-pre-line',
      assistantMessage: '.prose, [class*="answer-text"], [class*="markdown"]',
      inputBox: 'textarea',
      modelSelector: '[class*="model"], button[aria-label*="model"]',
    },
  },
  chatgpt: {
    key: 'chatgpt',
    label: 'ChatGPT',
    hostPatterns: ['chat.openai.com', 'chatgpt.com'],
    selectors: {
      messageContainer: '[class*="react-scroll-to-bottom"], main',
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      inputBox: '#prompt-textarea, textarea',
      modelSelector: '[class*="model-switcher"], button[aria-label*="Model"]',
    },
  },
  claude: {
    key: 'claude',
    label: 'Claude',
    hostPatterns: ['claude.ai'],
    selectors: {
      messageContainer: '[class*="conversation"], main',
      userMessage: '[data-testid="user-message"], [class*="human-turn"]',
      assistantMessage: '[data-testid="assistant-message"], [class*="assistant-turn"]',
      inputBox: '[contenteditable="true"], textarea',
      modelSelector: '[data-testid="model-selector"], button[class*="model"]',
    },
  },
};

export function detectSite(): SiteKey | null {
  const host = window.location.hostname;
  for (const [key, config] of Object.entries(SITES)) {
    if (config.hostPatterns.some((pattern) => host.includes(pattern))) {
      return key as SiteKey;
    }
  }
  return null;
}

export function detectSiteFromUrl(url: string): SiteKey | null {
  try {
    const host = new URL(url).hostname;
    for (const [key, config] of Object.entries(SITES)) {
      if (config.hostPatterns.some((pattern) => host.includes(pattern))) {
        return key as SiteKey;
      }
    }
  } catch {
    // invalid URL
  }
  return null;
}

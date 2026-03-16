export type SiteKey = 'perplexity' | 'chatgpt' | 'claude';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'other';
  text: string;
  timestamp?: number;
}

export interface SiteConfig {
  key: SiteKey;
  label: string;
  hostPatterns: string[];
}

export const SITES: Record<SiteKey, SiteConfig> = {
  perplexity: {
    key: 'perplexity',
    label: 'Perplexity',
    hostPatterns: ['www.perplexity.ai'],
  },
  chatgpt: {
    key: 'chatgpt',
    label: 'ChatGPT',
    hostPatterns: ['chat.openai.com', 'chatgpt.com'],
  },
  claude: {
    key: 'claude',
    label: 'Claude',
    hostPatterns: ['claude.ai'],
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

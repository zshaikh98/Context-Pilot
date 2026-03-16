import { SiteKey } from './sites';

export interface SiteSettings {
  enabled: boolean;
  warnThresholdTokens: number;
  historyDepthMessages: number;
}

export interface GlobalSettings {
  defaultCostPerMillionTokens: number;
  theme: 'light' | 'dark' | 'system';
}

export interface Settings {
  sites: Record<SiteKey, SiteSettings>;
  global: GlobalSettings;
}

export interface UsageEntry {
  site: SiteKey;
  date: string; // YYYY-MM-DD
  tokensInput: number;
  tokensOutput: number;
}

export type UsageStore = UsageEntry[];

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  enabled: true,
  warnThresholdTokens: 20000,
  historyDepthMessages: 10,
};

export const DEFAULT_SETTINGS: Settings = {
  sites: {
    perplexity: { ...DEFAULT_SITE_SETTINGS },
    chatgpt: { ...DEFAULT_SITE_SETTINGS },
    claude: { ...DEFAULT_SITE_SETTINGS },
  },
  global: {
    defaultCostPerMillionTokens: 2.5,
    theme: 'system',
  },
};

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get('settings');
  return result.settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

export async function getUsage(): Promise<UsageStore> {
  const result = await chrome.storage.local.get('usage');
  return result.usage ?? [];
}

export async function saveUsage(usage: UsageStore): Promise<void> {
  await chrome.storage.local.set({ usage });
}

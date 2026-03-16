import { SiteKey, ChatMessage } from '../shared/sites';
import { getSettings, getUsage, saveUsage, pruneUsage } from '../shared/storage';
import { estimateConversationTokens } from '../shared/tokenizer';

interface TabConversation {
  site: SiteKey;
  messages: ChatMessage[];
  tokenCount: number;
  model: string | null;
}

const tabState = new Map<number, TabConversation>();

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ContextPilot] Extension installed.');
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabState.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message.type === 'GET_SETTINGS') {
    getSettings().then((settings) => sendResponse(settings));
    return true;
  }

  if (message.type === 'CHAT_UPDATE') {
    handleChatUpdate(message, tabId).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'GET_USAGE') {
    getUsage().then((usage) => sendResponse(usage));
    return true;
  }

  if (message.type === 'GET_CURRENT_CONVERSATION') {
    const reqTabId = message.tabId as number | undefined;
    const state = reqTabId != null ? tabState.get(reqTabId) : undefined;
    sendResponse(state ?? null);
    return false;
  }

  return false;
});

async function handleChatUpdate(message: {
  site: SiteKey;
  messages: ChatMessage[];
  model: string | null;
}, tabId?: number): Promise<void> {
  const { tokens } = estimateConversationTokens(message.messages, message.model ?? undefined);
  const prevCount = tabId != null ? (tabState.get(tabId)?.tokenCount ?? 0) : 0;
  const delta = Math.max(0, tokens - prevCount);

  if (tabId != null) {
    tabState.set(tabId, {
      site: message.site,
      messages: message.messages,
      tokenCount: tokens,
      model: message.model,
    });
  }

  const usage = pruneUsage(await getUsage());
  const today = new Date().toISOString().slice(0, 10);

  let entry = usage.find((e) => e.site === message.site && e.date === today);
  if (!entry) {
    entry = { site: message.site, date: today, tokensInput: 0, tokensOutput: 0 };
    usage.push(entry);
  }
  entry.tokensInput += delta;

  await saveUsage(usage);
}

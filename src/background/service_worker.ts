import { getSettings, getUsage, saveUsage, UsageEntry } from '../shared/storage';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ContextPilot] Extension installed.');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    getSettings().then((settings) => sendResponse(settings));
    return true; // async response
  }

  if (message.type === 'CHAT_UPDATE') {
    handleChatUpdate(message).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'GET_USAGE') {
    getUsage().then((usage) => sendResponse(usage));
    return true;
  }

  return false;
});

async function handleChatUpdate(message: {
  site: UsageEntry['site'];
  tokenCount: number;
}): Promise<void> {
  const usage = await getUsage();
  const today = new Date().toISOString().slice(0, 10);

  let entry = usage.find((e) => e.site === message.site && e.date === today);
  if (!entry) {
    entry = { site: message.site, date: today, tokensInput: 0, tokensOutput: 0 };
    usage.push(entry);
  }
  entry.tokensInput = message.tokenCount;

  await saveUsage(usage);
}

import { SiteKey, ChatMessage, SITES, detectSite } from '../shared/sites';
import { Settings } from '../shared/storage';

export interface ContentScriptContext {
  site: SiteKey;
  settings: Settings;
}

export async function bootstrap(): Promise<ContentScriptContext | null> {
  const site = detectSite();
  if (!site) return null;

  let settings: Settings;
  try {
    settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  } catch {
    console.warn('[ContextPilot] Failed to get settings from background.');
    return null;
  }

  if (!settings.sites[site].enabled) {
    console.log(`[ContextPilot] ${SITES[site].label} is disabled in settings.`);
    return null;
  }

  return { site, settings };
}

export function sendChatUpdate(
  site: SiteKey,
  messages: ChatMessage[],
  model: string | null,
): void {
  try {
    chrome.runtime.sendMessage({
      type: 'CHAT_UPDATE',
      site,
      messages,
      model,
    });
  } catch {
    // background may not be ready
  }
}

export function detectModel(site: SiteKey): string | null {
  const selectors = SITES[site].selectors;
  const el = document.querySelector(selectors.modelSelector);
  if (el) {
    const text = el.textContent?.trim();
    if (text && text.length < 60) return text;
  }
  return null;
}

export function observeChat(
  site: SiteKey,
  parseMessages: () => ChatMessage[],
  getModel: () => string | null,
): void {
  const config = SITES[site];

  let lastMessageCount = 0;

  const update = () => {
    const messages = parseMessages();
    if (messages.length !== lastMessageCount) {
      lastMessageCount = messages.length;
      const model = getModel();
      sendChatUpdate(site, messages, model);
      updateOverlay(messages, model);
    }
  };

  // Initial parse
  update();

  // Observe DOM changes
  const container = document.querySelector(config.selectors.messageContainer) || document.body;
  const observer = new MutationObserver(() => update());
  observer.observe(container, { childList: true, subtree: true, characterData: true });

  // Monitor input box for live character-based token estimate
  monitorInput(site);
}

function monitorInput(site: SiteKey): void {
  const config = SITES[site];
  const check = () => {
    const input = document.querySelector(config.selectors.inputBox) as HTMLTextAreaElement | HTMLElement | null;
    if (input) {
      const handler = () => {
        const text = input instanceof HTMLTextAreaElement ? input.value : (input.textContent ?? '');
        const inputTokenEl = document.getElementById('contextpilot-input-tokens');
        if (inputTokenEl) {
          // Rough estimate: ~4 chars per token (avoids importing heavy tokenizer)
          const approxTokens = Math.ceil(text.length / 4);
          inputTokenEl.textContent = `Input: ~${approxTokens} tokens`;
        }
      };
      input.addEventListener('input', handler);
      if (!(input instanceof HTMLTextAreaElement)) {
        const obs = new MutationObserver(handler);
        obs.observe(input, { childList: true, subtree: true, characterData: true });
      }
    } else {
      setTimeout(check, 1000);
    }
  };
  check();
}

// --- Overlay ---

let overlayEl: HTMLDivElement | null = null;
let latestMessages: ChatMessage[] = [];

function createOverlay(): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.id = 'contextpilot-overlay';
  overlay.innerHTML = `
    <div id="contextpilot-header" style="cursor:move;font-weight:bold;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
      <span>ContextPilot</span>
      <span id="contextpilot-close" style="cursor:pointer;font-size:16px;line-height:1;">&times;</span>
    </div>
    <div id="contextpilot-input-tokens" style="font-size:12px;color:#888;">Input: 0 tokens</div>
    <div id="contextpilot-conv-tokens" style="font-size:12px;margin:4px 0;"></div>
    <div id="contextpilot-approx" style="font-size:10px;color:#aaa;"></div>
    <button id="contextpilot-summarize" style="
      margin-top:8px;width:100%;padding:6px 8px;font-size:12px;
      background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer;
    ">Summarize &amp; trim history</button>
  `;

  Object.assign(overlay.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '220px',
    padding: '12px',
    background: '#1e1e2e',
    color: '#e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    zIndex: '2147483647',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '13px',
    lineHeight: '1.4',
  });

  // Draggable
  const header = overlay.querySelector('#contextpilot-header') as HTMLElement;
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - overlay.getBoundingClientRect().left;
    offsetY = e.clientY - overlay.getBoundingClientRect().top;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    overlay.style.left = `${e.clientX - offsetX}px`;
    overlay.style.top = `${e.clientY - offsetY}px`;
    overlay.style.right = 'auto';
    overlay.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Close button
  overlay.querySelector('#contextpilot-close')!.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  // Summarize button
  overlay.querySelector('#contextpilot-summarize')!.addEventListener('click', handleSummarize);

  document.body.appendChild(overlay);
  return overlay;
}

function updateOverlay(messages: ChatMessage[], model: string | null): void {
  latestMessages = messages;

  if (!overlayEl) {
    overlayEl = createOverlay();
  }

  // Rough token estimate for overlay (avoids importing heavy tokenizer)
  const totalChars = messages.reduce((sum, m) => sum + m.text.length, 0);
  const approxTokens = Math.ceil(totalChars / 4);
  const isApprox = !model || !model.toLowerCase().startsWith('gpt');

  const convEl = document.getElementById('contextpilot-conv-tokens');
  if (convEl) {
    convEl.textContent = `Conversation: ${isApprox ? '~' : ''}${approxTokens.toLocaleString()} tokens (${messages.length} msgs)`;
  }

  const approxEl = document.getElementById('contextpilot-approx');
  if (approxEl) {
    approxEl.textContent = isApprox ? 'approx. (non-GPT model)' : '';
  }
}

async function handleSummarize(): Promise<void> {
  let settings: Settings;
  try {
    settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  } catch {
    return;
  }

  const site = detectSite();
  if (!site) return;

  const depth = settings.sites[site].historyDepthMessages;
  const messages = latestMessages;

  const keepCount = Math.min(depth, messages.length);
  const older = messages.slice(0, messages.length - keepCount);

  if (older.length === 0) {
    alert('Not enough messages to summarize.');
    return;
  }

  const olderText = older.map((m) => `[${m.role}]: ${m.text}`).join('\n\n');
  const prompt = [
    'Please summarize the following conversation context into a concise block ',
    'that preserves key facts, decisions, and context. ',
    'The summary should be usable as system context for a new conversation.\n\n',
    '--- Conversation to summarize ---\n\n',
    olderText,
    '\n\n--- End of conversation ---\n\n',
    'Provide a concise summary that I can paste at the top of a new conversation.',
  ].join('');

  const escaped = prompt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = [
    '<!DOCTYPE html><html><head><title>ContextPilot - Summarize</title>',
    '<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;}',
    'textarea{width:100%;height:300px;font-size:14px;padding:12px;border-radius:4px;border:1px solid #ccc;}',
    'h1{font-size:20px;} .instructions{background:#f0f4ff;padding:16px;border-radius:8px;margin:16px 0;}</style></head>',
    '<body><h1>ContextPilot - Summarize &amp; Trim</h1>',
    '<div class="instructions"><strong>Instructions:</strong><ol>',
    '<li>Copy the prompt below.</li>',
    '<li>Paste it into a new conversation in your AI tool.</li>',
    '<li>Use the generated summary as context for your new conversation.</li>',
    '</ol></div>',
    `<textarea readonly>${escaped}</textarea>`,
    '<br><button onclick="navigator.clipboard.writeText(document.querySelector(\'textarea\').value).then(()=>this.textContent=\'Copied!\')"',
    ' style="margin-top:8px;padding:8px 16px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer;">',
    'Copy to clipboard</button></body></html>',
  ].join('');

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

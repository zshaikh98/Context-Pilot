# ContextPilot Browser Extension – MVP Specification

## 1. Product overview

**Name (working):** ContextPilot
**Type:** Browser extension (Chrome/Edge MV3 first, Firefox later)
**Goal:** Help power users understand and control token usage for AI tools (Perplexity, ChatGPT, Claude, etc.) by monitoring usage and offering simple "optimize this chat" actions.

**Core value:**

- Track token/cost usage per conversation and per site.
- Surface where tokens are being wasted.
- Provide one-click context optimizations (summarize / trim / compress).

---

## 2. MVP feature set

### 2.1 Supported sites (v0)

- Perplexity web app.
- ChatGPT web app (chat.openai.com / chatgpt.com).
- Claude web app (claude.ai).

Implementation: site-specific content scripts that understand the DOM for chats.

### 2.2 Token estimation

- Use a JavaScript tokenizer library to estimate tokens client-side (no backend required for v0).
- Start with GPT-style tokenizer (e.g., js-tiktoken / gpt-tokenizer); treat non-GPT models as approximate and label clearly in the UI.
- Count tokens for:
  - Current message.
  - Current visible conversation (last N turns, configurable).
  - Total per chat session.

### 2.3 UI elements

#### 2.3.1 Toolbar popup UI

Shows:

- Current site and model (if detectable; else "Unknown model").
- Estimated tokens for current conversation and today's total.
- Simple cost estimate (user-configurable rate per 1M tokens).
- "Optimization suggestions" section (e.g., "You've sent ~30K tokens; consider summarizing old messages.").

#### 2.3.2 Per-conversation overlay (content script)

Small draggable panel injected into supported chat UIs with:

- Live token count for current input box.
- Badge for estimated tokens for last N turns.
- Button: "Summarize and trim history."

#### 2.3.3 Options page

Per-site settings:

- Enabled/disabled.
- Max tokens per conversation before warning.
- Default "history depth" (e.g., summarize anything older than last 10 turns).

Global settings:

- Default cost per 1M tokens (for estimates).
- Light/dark mode.

---

## 3. "Optimize this chat" flow (MVP)

### 3.1 Goal

Given a long conversation, help the user reduce token usage for future messages by replacing older parts with summaries.

### 3.2 Flow

1. User clicks "Summarize and trim history" in the overlay.
2. Extension:
   - Extracts last N messages as "keep as is."
   - Extracts older messages as "to be summarized."
   - Opens a new tab or side panel with a prefilled prompt instructing the AI tool to summarize the older portion into a concise context block (user runs it manually).
   - Provides copy-paste guidance: "Paste this summary at the top of your new conversation / as system context."

> v0 does **not** need its own LLM key; it piggybacks on the user's existing AI tool and just prepares the prompt.

Later enhancement (out of scope for v0): user can add their own API key and the extension can call a cheap model directly.

---

## 4. Architecture (Manifest V3–ready)

### 4.1 Files / modules

- `manifest.json` (v3)
- `src/background/service_worker.ts`
- `src/content/perplexity_content.ts`
- `src/content/chatgpt_content.ts`
- `src/content/claude_content.ts`
- `src/ui/popup.html` + `popup.tsx` (or `.ts`)
- `src/ui/options.html` + `options.tsx` (or `.ts`)
- `src/shared/tokenizer.ts`
- `src/shared/storage.ts`
- `src/shared/sites.ts` (site-specific selectors, parsers)

### 4.2 Manifest (high-level)

```jsonc
{
  "manifest_version": 3,
  "name": "ContextPilot",
  "version": "0.1.0",
  "description": "AI token and context companion for Perplexity, ChatGPT, and Claude.",
  "permissions": [
    "storage",
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "https://www.perplexity.ai/*",
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "options_page": "options.html",
  "content_scripts": [
    {
      "matches": ["https://www.perplexity.ai/*"],
      "js": ["perplexity_content.js"]
    },
    {
      "matches": ["https://chat.openai.com/*", "https://chatgpt.com/*"],
      "js": ["chatgpt_content.js"]
    },
    {
      "matches": ["https://claude.ai/*"],
      "js": ["claude_content.js"]
    }
  ]
}
```

### 4.3 Background service worker responsibilities

- Maintain per-domain daily usage aggregates (approx token counts, per site).
- Respond to messages from content scripts with:
  - Token estimates.
  - Config values.
- Persist settings via extension storage.

---

## 5. Data model

### 5.1 Settings

```ts
type SiteKey = 'perplexity' | 'chatgpt' | 'claude';

interface SiteSettings {
  enabled: boolean;
  warnThresholdTokens: number;      // e.g. 20000
  historyDepthMessages: number;     // e.g. keep last 10 turn pairs
}

interface GlobalSettings {
  defaultCostPerMillionTokens: number; // e.g. 2.50
  theme: 'light' | 'dark' | 'system';
}

interface Settings {
  sites: Record<SiteKey, SiteSettings>;
  global: GlobalSettings;
}
```

### 5.2 Usage stats (local only, v0)

```ts
interface UsageEntry {
  site: SiteKey;
  date: string;          // YYYY-MM-DD
  tokensInput: number;
  tokensOutput: number;  // best-effort or zero for now
}

type UsageStore = UsageEntry[];
```

---

## 6. Token estimation implementation

### 6.1 Library choice

- Use a JavaScript tokenizer suitable for GPT-style models.
- Implement a helper:

```ts
function estimateTokens(text: string, modelHint?: string): number;
```

- For Perplexity/Claude where exact encoding is unknown, use GPT-style estimation and mark in the UI as "approx."

### 6.2 Heuristics for conversations

- For each message, estimate tokens of:
  - Role label + content.
- For current chat:
  - Sum tokens for last N messages (based on user settings).
- Add a small per-message overhead in the estimate (document that this is approximate).

---

## 7. Content-script parsing (v0)

### 7.1 Generic approach

For each supported site:

- Identify DOM container(s) for messages.
- Map DOM elements into:

```ts
interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'other';
  text: string;
  timestamp?: number;
}
```

- Use a `MutationObserver` or polling interval to detect changes.
- On change, send:

```ts
chrome.runtime.sendMessage({
  type: 'CHAT_UPDATE',
  site,
  messages
});
```

- Inject overlay UI into a stable part of the chat page (e.g., bottom-right corner or near the input box).

---

## 8. Security & privacy constraints

- No third-party remote code; all code is packaged with the extension.
- Do **not** send conversation text off-device in v0.
- All token counting happens locally.
- If future versions add external APIs:
  - Make them opt-in.
  - Clearly label in UI and docs.
  - Store any user API keys via extension storage with appropriate warnings.

---

## 9. Non-goals for v0

- No backend server or user account system.
- No automatic proxying or rewriting of network requests.
- No guarantee of exact token parity with each provider (best-effort only).
- No team/workspace views (single-user only).

---

## 10. First implementation milestone

To get an initial working version:

1. Implement the extension skeleton with:
   - Manifest v3.
   - Background service worker.
   - Popup showing static text.
2. Implement Perplexity content script:
   - Extract messages from DOM.
   - Inject a simple overlay with static token estimate.
3. Implement `tokenizer.ts` with a basic token estimation function.
4. Wire content script → background → popup to show:
   - Estimated tokens for current Perplexity conversation.
5. Add basic options page for:
   - Perplexity enabled/disabled.
   - Warn threshold tokens.
   - Cost per 1M tokens.

Once that works end-to-end, clone the pattern for ChatGPT and Claude.

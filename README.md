# ContextPilot – AI Token & Context Companion

ContextPilot is an open-source browser extension that helps AI power users
understand and control token usage across tools like Perplexity, ChatGPT,
and Claude.

It runs entirely in your browser, estimating tokens locally and offering
simple actions to keep your chats lean and cheaper over time.

## Features

- Live token estimates for your current message and recent conversation
- Per-site and per-day token usage summaries
- Lightweight overlay inside supported AI chat UIs
- Warnings when a conversation gets "too long" by your own thresholds
- One-click "summarize and trim history" helper flow

> Token counts are approximate. Different providers use different
> encodings – this extension uses best-effort estimates.

## Supported sites (MVP)

- Perplexity (`perplexity.ai`)
- ChatGPT (`chat.openai.com` / `chatgpt.com`)
- Claude (`claude.ai`)

## Installation (development)

1. Clone the repository:

   ```bash
   git clone https://github.com/zshaikh98/Context-Pilot.git
   cd Context-Pilot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Load in Chrome/Edge:
   - Navigate to `chrome://extensions` (or `edge://extensions`)
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

For development with auto-rebuild:

```bash
npm run dev
```

## License

MIT

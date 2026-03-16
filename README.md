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

> ⚠️ Token counts are approximate. Different providers use different
> encodings – this extension uses best-effort estimates.

## Supported sites (MVP)

- Perplexity (`perplexity.ai`)
- ChatGPT (`chat.openai.com` / `chatgpt.com`)
- Claude (`claude.ai`)

Planned:
- Additional AI products and internal tools
- More granular per-conversation analytics

## How it works (high level)

- A content script runs on supported domains and:
  - Reads the chat messages from the page DOM
  - Injects a small overlay with live token estimates
  - Sends message metadata to the background service worker

- A background service worker:
  - Aggregates usage per site and per day
  - Stores settings and stats in `chrome.storage`

- A popup UI:
  - Shows your per-site token usage and rough cost estimates
  - Lets you tweak thresholds and history depth

All token estimation happens locally in your browser using a JavaScript
tokenizer – no conversation text is sent to any external server.

## Installation (development)

1. Clone the repository:

   ```bash
   git clone https://github.com/yourname/contextpilot.git
   cd contextpilot


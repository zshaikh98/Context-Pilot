import { ChatMessage } from './sites';

export interface SummarizeResult {
  keep: ChatMessage[];
  older: ChatMessage[];
  summarizePrompt: string;
}

export function buildSummarizePrompt(
  messages: ChatMessage[],
  historyDepth: number,
): SummarizeResult {
  const keepCount = Math.min(historyDepth, messages.length);
  const older = messages.slice(0, messages.length - keepCount);
  const keep = messages.slice(messages.length - keepCount);

  const olderText = older
    .map((m) => `[${m.role}]: ${m.text}`)
    .join('\n\n');

  const summarizePrompt = older.length > 0
    ? [
        'Please summarize the following conversation context into a concise block ',
        'that preserves key facts, decisions, and context. ',
        'The summary should be usable as system context for a new conversation.\n\n',
        '--- Conversation to summarize ---\n\n',
        olderText,
        '\n\n--- End of conversation ---\n\n',
        'Provide a concise summary that I can paste at the top of a new conversation.',
      ].join('')
    : '';

  return { keep, older, summarizePrompt };
}

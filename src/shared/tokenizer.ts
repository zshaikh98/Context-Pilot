import { encode } from 'gpt-tokenizer';
import { ChatMessage } from './sites';

const PER_MESSAGE_OVERHEAD = 4;

export interface TokenEstimate {
  tokens: number;
  approximate: boolean;
}

/**
 * Estimate the number of tokens in a text string.
 * Uses GPT-style tokenizer; for non-GPT models this is approximate.
 */
export function estimateTokens(text: string, modelHint?: string): TokenEstimate {
  if (!text) return { tokens: 0, approximate: isApproximate(modelHint) };
  const tokens = encode(text).length + PER_MESSAGE_OVERHEAD;
  return { tokens, approximate: isApproximate(modelHint) };
}

/**
 * Estimate total tokens for an array of chat messages.
 */
export function estimateConversationTokens(
  messages: ChatMessage[],
  modelHint?: string,
): TokenEstimate {
  let total = 0;
  for (const msg of messages) {
    const rolePrefix = `${msg.role}: `;
    total += encode(rolePrefix + msg.text).length + PER_MESSAGE_OVERHEAD;
  }
  return { tokens: total, approximate: isApproximate(modelHint) };
}

function isApproximate(modelHint?: string): boolean {
  if (!modelHint) return true;
  const lower = modelHint.toLowerCase();
  return !lower.startsWith('gpt');
}

import { encode } from 'gpt-tokenizer';

const PER_MESSAGE_OVERHEAD = 4;

/**
 * Estimate the number of tokens in a text string.
 * Uses GPT-style tokenizer; for non-GPT models this is approximate.
 */
export function estimateTokens(text: string, _modelHint?: string): number {
  if (!text) return 0;
  return encode(text).length + PER_MESSAGE_OVERHEAD;
}

/**
 * AI Gateway — provider-agnostic interface for all Morphic Studio agents.
 *
 * Features:
 *  - Provider fallback chain (primary → fallback → error)
 *  - Per-request timeout via AbortController
 *  - Exponential-backoff retries on 429 / 5xx
 *  - Model selection per call
 *  - Set AI_PROVIDER=openai (default) or AI_PROVIDER=openrouter in env
 */
import logger from '../utils/logger.js';

const log = logger.child('gateway');

// ── Provider registry ────────────────────────────────────────────────────────

const PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    key: () => process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-4o-mini',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: () => process.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-4o-mini',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://morphic-studio.replit.app',
      'X-Title': 'Morphic Studio',
      'Content-Type': 'application/json',
    }),
  },
};

// Fallback chain — if primary fails, try these in order
const FALLBACK_CHAIN = {
  openai: ['openrouter'],
  openrouter: ['openai'],
};

// ── Core call (single provider, one attempt) ─────────────────────────────────

async function _callProvider(providerName, { messages, model, maxTokens, timeoutMs = 30_000 }) {
  const p = PROVIDERS[providerName];
  if (!p) throw new Error(`Unknown AI provider: "${providerName}".`);

  const key = p.key();
  if (!key) {
    const keyName = providerName === 'openai' ? 'OPENAI_API_KEY' : 'OPENROUTER_API_KEY';
    throw new Error(`Provider "${providerName}" needs ${keyName} set.`);
  }

  const body = {
    model: model || p.defaultModel,
    messages,
    max_tokens: maxTokens,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(key),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`HTTP ${response.status}: ${errText}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return { content, usage: data.usage, provider: providerName, model: data.model };
  } finally {
    clearTimeout(timer);
  }
}

// ── Retry with exponential backoff ───────────────────────────────────────────

async function _withRetry(fn, { maxRetries = 2, baseDelayMs = 800 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = err.status === 429 || (err.status >= 500 && err.status < 600) || err.name === 'AbortError';
      if (!retryable || attempt === maxRetries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      log.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`, { status: err.status });
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * callAI({ systemPrompt, messages, model, maxTokens, provider, timeoutMs })
 * Returns { content, usage, provider, model }
 *
 * Automatically falls back to secondary provider on failure.
 */
export async function callAI({
  systemPrompt,
  messages = [],
  model,
  maxTokens = 2000,
  provider: providerOverride,
  timeoutMs = 30_000,
} = {}) {
  const primaryName = providerOverride || process.env.AI_PROVIDER || 'openai';
  const chain = [primaryName, ...(FALLBACK_CHAIN[primaryName] ?? [])];

  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  log.info(`callAI — chain: ${chain.join(' → ')}`, { model: model || 'default', turns: allMessages.length });

  let lastErr;
  for (const providerName of chain) {
    try {
      const result = await _withRetry(
        () => _callProvider(providerName, { messages: allMessages, model, maxTokens, timeoutMs }),
        { maxRetries: 2 }
      );
      log.info(`callAI complete via ${providerName}`, { tokens: result.usage?.total_tokens });
      return result;
    } catch (err) {
      log.warn(`Provider "${providerName}" failed — ${err.message}`);
      lastErr = err;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastErr?.message}`);
}

/**
 * parseJSON(text) — safely extract a JSON block from AI output.
 * Handles markdown fences, leading/trailing text, partial JSON.
 */
export function parseJSON(text) {
  const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[{[]/);
    if (start !== -1) {
      // Find matching close bracket and try parsing
      const sub = cleaned.slice(start);
      try { return JSON.parse(sub); } catch { /* fall through */ }
    }
    return null;
  }
}

export default { callAI, parseJSON };

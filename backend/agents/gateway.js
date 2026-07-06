/**
 * AI Gateway — provider-agnostic interface for all Morphic Studio agents.
 *
 * Features:
 *  - Provider fallback chain: OpenAI → OpenRouter → Gemini
 *  - Per-request timeout via AbortController
 *  - Exponential-backoff retries on 429 / 5xx
 *  - Model selection per call
 *  - Cost estimation & logging
 *  - Provider health check endpoint
 *  - Gemini (Google GenAI) support
 *  - Set AI_PROVIDER=openai (default), openrouter, or gemini in env
 */

import logger from '../utils/logger.js';

const log = logger.child('gateway');

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:5000';
}

// ── Cost estimates (USD per 1K tokens) ───────────────────────────────────────

const COST_PER_1K = {
  'gpt-4o-mini':              { input: 0.00015, output: 0.0006  },
  'gpt-4o':                   { input: 0.005,   output: 0.015   },
  'openai/gpt-4o-mini':       { input: 0.00015, output: 0.0006  },
  'openai/gpt-4o':            { input: 0.005,   output: 0.015   },
  'google/gemini-flash-1.5':  { input: 0.000075,output: 0.0003  },
  'google/gemini-pro':        { input: 0.0005,  output: 0.0015  },
  'anthropic/claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'anthropic/claude-3-sonnet':{ input: 0.003,   output: 0.015   },
  default:                    { input: 0.001,   output: 0.003   },
};

function estimateCost(model, usage) {
  if (!usage) return null;
  const rates = COST_PER_1K[model] ?? COST_PER_1K.default;
  return ((usage.prompt_tokens ?? 0) / 1000) * rates.input
       + ((usage.completion_tokens ?? 0) / 1000) * rates.output;
}

// ── Provider registry ─────────────────────────────────────────────────────────

const PROVIDERS = {
  openai: {
    name: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    key: () => process.env.OPENAI_API_KEY,
    defaultModel: 'gpt-4o-mini',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    }),
    buildBody: ({ messages, model, maxTokens, temperature }) => ({
      model,
      messages,
      max_tokens: maxTokens,
      ...(temperature != null ? { temperature } : {}),
    }),
    extractContent: (data) => data.choices?.[0]?.message?.content ?? '',
    extractUsage:   (data) => data.usage,
    extractModel:   (data) => data.model,
  },

  openrouter: {
    name: 'openrouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: () => process.env.OPENROUTER_API_KEY,
    defaultModel: 'openai/gpt-4o-mini',
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': getAppUrl(),
      'X-Title': 'Morphic Studio',
      'Content-Type': 'application/json',
    }),
    buildBody: ({ messages, model, maxTokens, temperature }) => ({
      model,
      messages,
      max_tokens: maxTokens,
      ...(temperature != null ? { temperature } : {}),
    }),
    extractContent: (data) => data.choices?.[0]?.message?.content ?? '',
    extractUsage:   (data) => data.usage,
    extractModel:   (data) => data.model,
  },

  gemini: {
    name: 'gemini',
    // Gemini REST API (v1beta)
    url: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model ?? 'gemini-1.5-flash'}:generateContent`,
    key: () => process.env.GEMINI_API_KEY,
    defaultModel: 'gemini-1.5-flash',
    headers: (_key) => ({ 'Content-Type': 'application/json' }),
    buildBody: ({ messages, maxTokens, temperature }) => {
      // Convert OpenAI-style messages to Gemini format
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const systemMsg = messages.find(m => m.role === 'system');
      const body = {
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          ...(temperature != null ? { temperature } : {}),
        },
      };
      if (systemMsg) {
        body.system_instruction = { parts: [{ text: systemMsg.content }] };
      }
      return body;
    },
    extractContent: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    extractUsage:   (data) => ({
      prompt_tokens:     data.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens:      data.usageMetadata?.totalTokenCount ?? 0,
    }),
    extractModel: (_data, model) => model,
  },
};

// Fallback chain — if primary fails, try these in order
const FALLBACK_CHAIN = {
  openai:     ['openrouter', 'gemini'],
  openrouter: ['openai',     'gemini'],
  gemini:     ['openrouter', 'openai'],
};

// ── Health tracking ───────────────────────────────────────────────────────────

const _health = {
  openai:     { healthy: true, lastChecked: null, failCount: 0 },
  openrouter: { healthy: true, lastChecked: null, failCount: 0 },
  gemini:     { healthy: true, lastChecked: null, failCount: 0 },
};

function _markFailure(providerName) {
  if (_health[providerName]) {
    _health[providerName].failCount++;
    _health[providerName].lastChecked = new Date().toISOString();
    if (_health[providerName].failCount >= 3) {
      _health[providerName].healthy = false;
      log.warn(`Provider "${providerName}" marked unhealthy after ${_health[providerName].failCount} failures`);
    }
  }
}

function _markSuccess(providerName) {
  if (_health[providerName]) {
    _health[providerName].healthy = true;
    _health[providerName].failCount = 0;
    _health[providerName].lastChecked = new Date().toISOString();
  }
}

export function getProviderHealth() {
  return { ..._health };
}

// ── Core call (single provider, one attempt) ──────────────────────────────────

async function _callProvider(providerName, { messages, model, maxTokens, temperature, timeoutMs = 30_000 }) {
  const p = PROVIDERS[providerName];
  if (!p) throw new Error(`Unknown AI provider: "${providerName}".`);

  const key = p.key();
  if (!key) {
    const keyNames = { openai: 'OPENAI_API_KEY', openrouter: 'OPENROUTER_API_KEY', gemini: 'GEMINI_API_KEY' };
    throw new Error(`Provider "${providerName}" needs ${keyNames[providerName] ?? 'API key'} set.`);
  }

  const resolvedModel = model || p.defaultModel;
  const url = typeof p.url === 'function' ? `${p.url(resolvedModel)}?key=${key}` : p.url;

  const body = p.buildBody({ messages, model: resolvedModel, maxTokens, temperature });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: p.headers(key),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      const err = new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = p.extractContent(data);
    const usage   = p.extractUsage(data);
    const usedModel = p.extractModel(data, resolvedModel);

    const cost = estimateCost(usedModel, usage);
    log.info(`✓ ${providerName}/${usedModel}`, {
      tokens: usage?.total_tokens,
      cost_usd: cost?.toFixed(5),
    });

    _markSuccess(providerName);
    return { content, usage, provider: providerName, model: usedModel, cost };

  } finally {
    clearTimeout(timer);
  }
}

// ── Retry with exponential backoff ────────────────────────────────────────────

async function _withRetry(fn, { maxRetries = 2, baseDelayMs = 800 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = err.status === 429
        || (err.status >= 500 && err.status < 600)
        || err.name === 'AbortError'
        || err.message === 'fetch failed'
        || err.message.includes('fetch');
      if (!retryable || attempt === maxRetries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      log.warn(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms`, { status: err.status });
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * callAI({ systemPrompt, messages, model, maxTokens, provider, timeoutMs })
 * Returns { content, usage, provider, model, cost }
 *
 * Automatically falls back through the provider chain on failure.
 * Skips providers marked unhealthy.
 */
export async function callAI({
  systemPrompt,
  messages = [],
  model,
  maxTokens = 2000,
  temperature,
  provider: providerOverride,
  timeoutMs = 30_000,
} = {}) {
  const primaryName = providerOverride || process.env.AI_PROVIDER || 'openai';
  const fullChain = [primaryName, ...(FALLBACK_CHAIN[primaryName] ?? [])];

  // Filter out known-unhealthy providers (except if it's the only one)
  const chain = fullChain.filter(p => _health[p]?.healthy !== false) .length > 0
    ? fullChain.filter(p => _health[p]?.healthy !== false)
    : fullChain; // fallback: try all if all unhealthy

  const allMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages,
  ];

  log.info(`callAI — chain: ${chain.join(' → ')}`, { model: model ?? 'default', turns: allMessages.length });

  let lastErr;
  for (const providerName of chain) {
    try {
      const result = await _withRetry(
        () => _callProvider(providerName, { messages: allMessages, model, maxTokens, temperature, timeoutMs }),
        { maxRetries: 2 }
      );
      return result;
    } catch (err) {
      log.warn(`Provider "${providerName}" failed — ${err.message}`);
      _markFailure(providerName);
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
      const sub = cleaned.slice(start);
      try { return JSON.parse(sub); } catch { /* fall through */ }
    }
    return null;
  }
}

export default { callAI, parseJSON, getProviderHealth };

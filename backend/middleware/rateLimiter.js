/**
 * Rate Limiter Middleware
 *
 * In-memory rate limiting (no Redis required for single-instance Replit deployment).
 * Applied per IP address.
 *
 * Tiers:
 *  - General API:  200 req / 15 min
 *  - AI endpoints: 20 req / 1 min (expensive calls)
 *  - Health:       unlimited
 */

import logger from '../utils/logger.js';

const log = logger.child('rateLimiter');

// ── In-memory store ───────────────────────────────────────────────────────────

class InMemoryStore {
  constructor() {
    this._store = new Map();
    // Clean up every 5 minutes
    setInterval(() => this._cleanup(), 5 * 60 * 1000).unref();
  }

  increment(key, windowMs) {
    const now = Date.now();
    let entry = this._store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
      this._store.set(key, entry);
      return entry;
    }

    entry.count++;
    return entry;
  }

  _cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this._store) {
      if (now > entry.resetAt) { this._store.delete(key); cleaned++; }
    }
    if (cleaned > 0) log.info(`Rate limiter: cleaned ${cleaned} expired entries`);
  }
}

const store = new InMemoryStore();

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * createRateLimiter({ windowMs, max, message })
 * Returns an Express middleware function.
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 200, message = 'Too many requests.' } = {}) {
  // Each limiter instance gets its own namespace to prevent counter collisions
  const namespace = `${windowMs}:${max}`;

  return function rateLimiter(req, res, next) {
    const ip  = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `rl:${namespace}:${ip}`;

    const entry = store.increment(key, windowMs);

    const remaining = Math.max(0, max - entry.count);
    const resetSec  = Math.ceil((entry.resetAt - Date.now()) / 1000);

    res.setHeader('X-RateLimit-Limit',     max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset',     resetSec);

    if (entry.count > max) {
      log.warn(`Rate limit exceeded`, { ip, count: entry.count, max });
      return res.status(429).json({
        error: message,
        retryAfterSeconds: resetSec,
      });
    }

    next();
  };
}

// Pre-built limiters
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests. Please wait a moment.',
});

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'AI request limit reached. Please wait 1 minute.',
});

export const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many requests for this action.',
});

export default { createRateLimiter, generalLimiter, aiLimiter, strictLimiter };

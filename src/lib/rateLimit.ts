/**
 * Simple in-memory sliding-window rate limiter for serverless/edge functions.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const cache = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Time window in ms (e.g. 60,000 for 1 min)
  max: number;      // Maximum allowed requests in window
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, max: 10 }
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = cache.get(identifier) || { timestamps: [] };

  // Filter timestamps within the window
  record.timestamps = record.timestamps.filter(
    (ts) => now - ts < options.windowMs
  );

  if (record.timestamps.length >= options.max) {
    const oldest = record.timestamps[0];
    const resetMs = options.windowMs - (now - oldest);
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  record.timestamps.push(now);
  cache.set(identifier, record);

  return {
    allowed: true,
    remaining: options.max - record.timestamps.length,
    resetMs: options.windowMs,
  };
}

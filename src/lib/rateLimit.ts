/**
 * In-memory sliding window rate limiter.
 * Suitable for single-instance / serverless node processes with fallback memory cache.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 15 * 60 * 1000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Checks and records a rate limit attempt for a specific key (e.g. IP or userId).
 * Default: 10 attempts per 15 minutes (900,000 ms).
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const maxAttempts = options.maxAttempts ?? 10;
  const windowMs = options.windowMs ?? 15 * 60 * 1000; // 15 minutes
  const now = Date.now();

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldestTimestamp = record.timestamps[0] ?? now;
    const resetTime = oldestTimestamp + windowMs;
    return {
      success: false,
      remaining: 0,
      resetTime,
      limit: maxAttempts,
    };
  }

  record.timestamps.push(now);
  const remaining = maxAttempts - record.timestamps.length;
  const resetTime = (record.timestamps[0] ?? now) + windowMs;

  return {
    success: true,
    remaining,
    resetTime,
    limit: maxAttempts,
  };
}

/**
 * Helper to extract client identifier (IP address) from Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

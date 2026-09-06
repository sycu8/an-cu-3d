/**
 * Best-effort in-memory rate limiter for MVP.
 * Resets on Worker isolate restart; not shared across instances — use a durable
 * store (e.g. KV/Durable Objects) for strict production limits.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(
  key: string,
  now = Date.now(),
  maxRequests = MAX_REQUESTS,
): boolean {
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > maxRequests;
}

export function resetRateLimits(): void {
  buckets.clear();
}

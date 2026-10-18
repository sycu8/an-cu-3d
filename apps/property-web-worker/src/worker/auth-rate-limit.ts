/** Per-isolate counter. Stops a single Worker instance from grinding login or bootstrap. */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 30;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientAddress(request: Request): string {
  const cf = request.headers.get("CF-Connecting-IP")?.trim();
  return cf || "unknown";
}

export function allowAuthAttempt(
  ip: string,
  scope: "login" | "bootstrap",
  now = Date.now(),
  limit = MAX_ATTEMPTS,
  windowMs = WINDOW_MS,
): boolean {
  const key = `${scope}:${ip}`;
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [bucketKey, bucket] of buckets) {
        if (now >= bucket.resetAt) buckets.delete(bucketKey);
      }
    }
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

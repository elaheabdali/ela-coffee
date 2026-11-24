/**
 * In-memory token-bucket rate limiter (per IP, per route).
 *
 * Simple and honest: it only limits within ONE server instance.
 * On Vercel each serverless instance has its own buckets, so this is
 * a basic abuse guard, not a distributed limiter — a hosted store
 * (e.g. Upstash) is a later step, and deliberately NOT a blocked
 * service in Iran. Limits are documented in docs/fa/phase-06-backend.md.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the bucket has at least one token again. */
  retryAfterSeconds: number;
}

/**
 * Consume one token from the bucket for `key` (usually `${route}:${ip}`).
 * `maxRequests` tokens per `windowSeconds`, refilled continuously.
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const refillPerMs = maxRequests / (windowSeconds * 1000);
  const existing = buckets.get(key);
  const bucket: Bucket = existing ?? { tokens: maxRequests, lastRefill: now };
  const elapsed = now - bucket.lastRefill;
  bucket.tokens = Math.min(maxRequests, bucket.tokens + elapsed * refillPerMs);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  buckets.set(key, bucket);
  const retryAfterSeconds = Math.max(1, Math.ceil((1 - bucket.tokens) / refillPerMs / 1000));
  return { allowed: false, retryAfterSeconds };
}

/** Best-effort client IP from the request (proxy headers first). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Test-only: wipe all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** Standard rate-limit headers for a 429 response. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return { "Retry-After": String(result.retryAfterSeconds) };
}

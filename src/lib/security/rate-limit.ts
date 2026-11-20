interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  if (buckets.size > 500) {
    for (const [bucketKey, entry] of buckets.entries()) {
      if (entry.resetAt <= now) {
        buckets.delete(bucketKey);
      }
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.count >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  current.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp ? realIp.slice(0, 80) : 'local-client';
}

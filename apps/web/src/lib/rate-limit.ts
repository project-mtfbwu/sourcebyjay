const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { ok: true };
}

export function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = 'Too many requests. Please try again later.'
): void {
  const result = rateLimit(key, limit, windowMs);
  if (!result.ok) {
    throw new Error(message);
  }
}

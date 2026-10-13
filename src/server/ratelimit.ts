const hits = new Map<string, { n: number; reset: number }>();

/** Simple in-memory limiter (per server instance): max `limit` attempts per `windowMs` per key. */
export function rateLimit(key: string, limit = 5, windowMs = 15 * 60_000) {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || cur.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  cur.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  return cur.n > limit ? { ok: false, retryAfter: Math.ceil((cur.reset - now) / 1000) } : { ok: true, retryAfter: 0 };
}

export const resetLimit = (key: string) => hits.delete(key);

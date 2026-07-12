/**
 * Warm-instance TTL for domain refresh*() calls.
 * Prevents duplicate Supabase round-trips on rapid navigations
 * (Home → Orders → Clients) when in-memory cache is already warm.
 */

export const DOMAIN_REFRESH_TTL_MS = 15_000;

export type RefreshTtlStats = { hits: number; misses: number };

const stats = new Map<string, RefreshTtlStats>();

export function getRefreshTtlStats(): Record<string, RefreshTtlStats> {
  const out: Record<string, RefreshTtlStats> = {};
  for (const [key, value] of stats) {
    out[key] = { ...value };
  }
  return out;
}

export function resetRefreshTtlStats(): void {
  for (const value of stats.values()) {
    value.hits = 0;
    value.misses = 0;
  }
}

type Gate<T> = {
  refreshedAt: number;
  inFlight: Promise<T> | null;
};

/**
 * Wrap a refresh loader with warm TTL + in-flight dedupe.
 * `hasData` must be true before a TTL hit is allowed (never serve empty forever).
 */
export function withRefreshTtl<T>(options: {
  key: string;
  ttlMs?: number;
  hasData: () => boolean;
  read: () => T;
  load: () => Promise<T>;
}): () => Promise<T> {
  const ttlMs = options.ttlMs ?? DOMAIN_REFRESH_TTL_MS;
  const gate: Gate<T> = { refreshedAt: 0, inFlight: null };

  if (!stats.has(options.key)) {
    stats.set(options.key, { hits: 0, misses: 0 });
  }

  return async () => {
    let bucket = stats.get(options.key);
    if (!bucket) {
      bucket = { hits: 0, misses: 0 };
      stats.set(options.key, bucket);
    }
    if (
      options.hasData() &&
      gate.refreshedAt > 0 &&
      Date.now() - gate.refreshedAt < ttlMs
    ) {
      bucket.hits += 1;
      return options.read();
    }
    if (gate.inFlight) {
      return gate.inFlight;
    }

    bucket.misses += 1;
    gate.inFlight = (async () => {
      try {
        const result = await options.load();
        gate.refreshedAt = Date.now();
        return result;
      } finally {
        gate.inFlight = null;
      }
    })();

    return gate.inFlight;
  };
}

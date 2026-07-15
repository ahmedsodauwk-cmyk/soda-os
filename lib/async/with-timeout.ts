/**
 * Race a promise against a deadline. On timeout (or reject), resolve to
 * `fallback` and leave the original work running in the background.
 * Used so app shell / splash never wait forever on auth, Connect, or domain refresh.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(fallback), ms);
    promise.then(
      (value) => finish(value),
      () => finish(fallback)
    );
  });
}

/** Soft ceiling for splash / shell boot — product rule: never block forever. */
export const BOOT_BUDGET_MS = 3_000;

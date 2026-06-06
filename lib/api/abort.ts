/**
 * AbortSignal composition for queries. `composeSignals` merges TanStack Query's
 * signal with feature-owned aborts (unmount, debounced-search supersede);
 * `withTimeout` bounds a wait. Single source so call sites don't re-derive it.
 */

/** Merge multiple signals — aborts when any input aborts. */
export function composeSignals(
  ...signals: Array<AbortSignal | undefined | null>
): AbortSignal {
  const present = signals.filter((s): s is AbortSignal => s != null);
  if (present.length === 1) return present[0];

  const controller = new AbortController();
  const onAbort = (reason: unknown) => controller.abort(reason);

  for (const signal of present) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => onAbort(signal.reason), {
      once: true,
      signal: controller.signal,
    });
  }

  return controller.signal;
}

/** A signal that aborts after `ms`, optionally composed with an upstream one. */
export function withTimeout(ms: number, signal?: AbortSignal): AbortSignal {
  return composeSignals(signal, AbortSignal.timeout(ms));
}

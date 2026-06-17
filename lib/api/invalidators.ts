import type { QueryClient } from "@tanstack/react-query";
import type { QueryScope } from "./query-keys";

/**
 * Named invalidation helpers. Mutations call these instead of poking the
 * QueryClient directly, so the invalidation surface for a resource lives in one
 * place. Per-resource invalidators are added by their owning features.
 */

/** Invalidate everything under a workspace scope (e.g. after a workspace switch). */
export function invalidateScope(
  qc: QueryClient,
  scope: QueryScope,
): Promise<void> {
  return qc.invalidateQueries({ queryKey: [scope] });
}

/** Invalidate a specific keyed resource. */
export function invalidateKey(
  qc: QueryClient,
  key: readonly unknown[],
): Promise<void> {
  return qc.invalidateQueries({ queryKey: key });
}

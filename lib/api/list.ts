import type { ListResult } from "./envelope";

/**
 * Normalize a list endpoint's (already envelope-unwrapped) body to a plain
 * array. The envelope interceptor turns a paginated `{ Items, Options }` Result
 * into `{ items, count }` (a `ListResult`), while a non-paginated list comes
 * through as a bare array. Either way, feature code wants the array — and the
 * generated factory types mislabel some of these as bare arrays, so call this
 * instead of casting `res.data as Model[]`.
 */
export function itemsOf<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as ListResult<T>).items)
  ) {
    return (data as ListResult<T>).items;
  }
  return [];
}

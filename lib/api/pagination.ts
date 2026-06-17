import type { ListResult } from "./envelope";

/**
 * Pagination helpers shared by list hooks and infinite queries. The backend
 * paginates with `Skip`/`Take` and returns a total `Count`; these helpers keep
 * the cursor math in one place.
 */
export interface PageParams {
  skip: number;
  take: number;
}

export const DEFAULT_PAGE_SIZE = 50;

export function firstPage(take: number = DEFAULT_PAGE_SIZE): PageParams {
  return { skip: 0, take };
}

/** Next page params, or `null` when the current page is the last. */
export function nextPage<T>(
  current: PageParams,
  result: ListResult<T>,
): PageParams | null {
  // Stop on an empty page so a stale/over-reported `count` can't loop forever.
  if (result.items.length === 0) return null;
  const consumed = current.skip + result.items.length;
  return consumed < result.count
    ? { skip: consumed, take: current.take }
    : null;
}

export function hasMore<T>(current: PageParams, result: ListResult<T>): boolean {
  return current.skip + result.items.length < result.count;
}

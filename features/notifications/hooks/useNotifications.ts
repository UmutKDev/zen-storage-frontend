"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { firstPage, nextPage } from "@/lib/api";
import { getNotifications, notificationKeys } from "../api";

/** Page size for the inbox list. Small — the panel shows the most recent;
 *  "Load more" fetches the next page when there are older ones. */
const PAGE = 20;

/**
 * The notification inbox list. Fetches on panel open (`enabled`), paginates via
 * the shared `firstPage`/`nextPage` cursor helpers, and flattens pages to a flat
 * newest-first array. The query key is stable (no page param) so the optimistic
 * mark-read updates in `useNotificationActions` target one cache entry.
 */
export function useNotifications(open: boolean) {
  const query = useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam, signal }) => getNotifications(pageParam, signal),
    initialPageParam: firstPage(PAGE),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      nextPage(lastPageParam, lastPage),
    enabled: open,
    staleTime: 30_000,
  });

  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    /** True total across all pages (any page carries it) — drives "Load more". */
    count: query.data?.pages[0]?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
  };
}

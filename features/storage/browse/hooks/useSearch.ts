"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOwnerId } from "../../lib/useOwnerId";
import { getSearch, storageKeys } from "../api";
import { arrangeEntries, toEntries, type FolderEntry } from "../lib/entries";
import { useViewPrefs } from "../stores/viewPrefs.store";

export type SearchScope = "current" | "global";

/** Minimum query length the backend accepts (`Cloud/Search` enforces ≥2). */
export const SEARCH_MIN_CHARS = 2;
/** Single non-paginated result window (no infinite scroll for search at MVP). */
const SEARCH_TAKE = 100;

/**
 * Filename search via `Cloud/Search`, scoped to the current folder or global.
 * Results map through the same `toEntries` + arrange pipeline as folder browse,
 * so the active sort/filter apply and `ListView`/`GridView` render them as-is.
 * The query only fires when ≥2 chars (the backend rejects shorter); switching
 * scope changes the query key so the in-flight request is abandoned.
 */
export function useSearch(opts: {
  query: string;
  scope: SearchScope;
  path: string;
  extension?: string;
}) {
  const ownerId = useOwnerId();
  const query = opts.query.trim();
  const extension = (opts.extension ?? "").trim().toLowerCase();
  const enabled = Boolean(ownerId) && query.length >= SEARCH_MIN_CHARS;

  const sortKey = useViewPrefs((s) => s.sortKey);
  const sortDir = useViewPrefs((s) => s.sortDir);
  const filterType = useViewPrefs((s) => s.filterType);
  const filterExt = useViewPrefs((s) => s.filterExt);

  const search = useQuery({
    queryKey: storageKeys.search(
      ownerId ?? "anon",
      opts.scope,
      opts.path,
      query,
      extension,
    ),
    queryFn: ({ signal }) =>
      getSearch(
        {
          query,
          path: opts.scope === "current" ? opts.path : undefined,
          extension: extension || undefined,
          take: SEARCH_TAKE,
        },
        signal,
      ),
    enabled,
    // Keep the previous results on screen while a new query resolves (no flash).
    placeholderData: (prev) => prev,
  });

  const entries = useMemo<FolderEntry[]>(() => {
    const data = search.data;
    if (!data) return [];
    return arrangeEntries(
      toEntries(data.Directories ?? [], data.Objects ?? []),
      { sortKey, sortDir, filterType, filterExt },
    );
  }, [search.data, sortKey, sortDir, filterType, filterExt]);

  return {
    entries,
    enabled,
    // `isPending` is `true` for a disabled query in TanStack v5; gate on enabled.
    isPending: enabled && search.isPending,
    isFetching: search.isFetching,
    isError: search.isError,
    refetch: () => void search.refetch(),
  };
}

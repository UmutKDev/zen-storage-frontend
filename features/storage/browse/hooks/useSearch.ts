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
 * Global ("Everywhere") filename search via `Cloud/Search`. The "This folder"
 * scope is handled **client-side** in `StorageBrowser` (a `matchEntries` filter
 * over the already-loaded listing — the folder is a single non-paginated call, so
 * that match is complete and instant), so this query only enables for
 * `scope === "global"` and never round-trips for an in-folder search.
 *
 * Results map through the same `toEntries` + arrange pipeline as folder browse,
 * so the active sort/filter apply and `ListView`/`SmartGridView` render them as-is.
 * The query only fires when ≥2 chars (the backend rejects shorter).
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
  const enabled =
    Boolean(ownerId) &&
    query.length >= SEARCH_MIN_CHARS &&
    opts.scope === "global";

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
          // Always a global search — folder-scoped search never reaches here.
          path: undefined,
          extension: extension || undefined,
          take: SEARCH_TAKE,
        },
        signal,
      ),
    enabled,
    // Keep the previous results on screen while a new query resolves (no flash).
    placeholderData: (prev) => prev,
  });

  const raw = useMemo<FolderEntry[]>(() => {
    const data = search.data;
    if (!data) return [];
    return toEntries(data.Directories ?? [], data.Objects ?? []);
  }, [search.data]);
  const entries = useMemo<FolderEntry[]>(
    () => arrangeEntries(raw, { sortKey, sortDir, filterType, filterExt }),
    [raw, sortKey, sortDir, filterType, filterExt],
  );

  return {
    entries,
    /** Match count BEFORE the type/extension filter — lets the browser tell a
     *  "filter hid the matches" empty (offer Clear filter) from a true no-match. */
    rawCount: raw.length,
    enabled,
    // `isPending` is `true` for a disabled query in TanStack v5; gate on enabled.
    isPending: enabled && search.isPending,
    isFetching: search.isFetching,
    isError: search.isError,
    refetch: () => void search.refetch(),
  };
}

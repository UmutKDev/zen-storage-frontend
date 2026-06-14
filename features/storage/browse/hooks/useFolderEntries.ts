"use client";

import { useMemo } from "react";
import { useViewPrefs } from "../stores/viewPrefs.store";
import { arrangeEntries, toEntries } from "../lib/entries";
import { useDirectories } from "./useDirectories";
import { useObjects } from "./useObjects";

/** Dedupe by a stable key — a cheap safety net against any backend overlap. */
function dedupeBy<T>(items: ReadonlyArray<T>, key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/** Merges the directories + objects queries into one sorted (folders-first)
 *  entry list, with combined loading/error state. */
export function useFolderEntries(path: string) {
  const dirsQuery = useDirectories(path);
  const filesQuery = useObjects(path);
  const sortKey = useViewPrefs((s) => s.sortKey);
  const sortDir = useViewPrefs((s) => s.sortDir);
  const filterType = useViewPrefs((s) => s.filterType);
  const filterExt = useViewPrefs((s) => s.filterExt);

  const dirs = useMemo(
    () => dedupeBy(dirsQuery.data ?? [], (d) => d.Prefix),
    [dirsQuery.data],
  );
  const files = useMemo(
    () => dedupeBy(filesQuery.data ?? [], (f) => f.Path.Key),
    [filesQuery.data],
  );
  const raw = useMemo(() => toEntries(dirs, files), [dirs, files]);
  const entries = useMemo(
    () => arrangeEntries(raw, { sortKey, sortDir, filterType, filterExt }),
    [raw, sortKey, sortDir, filterType, filterExt],
  );

  return {
    entries,
    /** Count before the type/extension filter — lets the browser show a
     *  "filter hid everything" state instead of the "empty folder" state. */
    totalCount: raw.length,
    isFiltered: filterType !== "all" || filterExt !== "",
    isPending: dirsQuery.isPending || filesQuery.isPending,
    isError: dirsQuery.isError || filesQuery.isError,
    refetch: () => {
      void dirsQuery.refetch();
      void filesQuery.refetch();
    },
  };
}

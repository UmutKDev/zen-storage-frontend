"use client";

import { useMemo } from "react";
import { isApiError } from "@/lib/api";
import { resolveToken, useSecureFoldersStore } from "@/features/secure-folders";
import { useViewPrefs } from "../stores/viewPrefs.store";
import { applyOwnedUnlocks, arrangeEntries, toEntries } from "../lib/entries";
import { folderPathOf } from "../lib/href";
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
  // Encrypted tokens the client currently holds — used to treat a folder this
  // session already unlocked as enterable when it's listed from a parent (the
  // backend can't know the parent request covers a descendant's session).
  const encTokens = useSecureFoldersStore((s) => s.tokens.encrypted);

  const dirs = useMemo(
    () =>
      applyOwnedUnlocks(
        dedupeBy(dirsQuery.data ?? [], (d) => d.Prefix),
        (d) => resolveToken(encTokens, folderPathOf(path, d.Name)) !== null,
      ),
    [dirsQuery.data, encTokens, path],
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
    /** A `403 FORBIDDEN` listing = an encrypted folder reached without a session
     *  (deep-link / TTL expiry) → the browser shows the unlock prompt, not an error. */
    isLocked:
      (isApiError(dirsQuery.error) && dirsQuery.error.code === "FORBIDDEN") ||
      (isApiError(filesQuery.error) && filesQuery.error.code === "FORBIDDEN"),
    refetch: () => {
      void dirsQuery.refetch();
      void filesQuery.refetch();
    },
  };
}

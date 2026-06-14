"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";
import { isPreviewableName } from "@/lib/preview";
import { useSecureFolderUiStore } from "@/features/secure-folders";
import {
  BROWSE_CONTENT_ID,
  BulkActionBar,
  CreateMenu,
  DndMoveLayer,
  EntryActionsSheet,
  SecureFolderDialogs,
  useItemSelection,
} from "../../operations";
import { FileDropZone } from "../../upload/components/FileDropZone";
import { UploadButton } from "../../upload/components/UploadButton";
import { useFolderEntries } from "../hooks/useFolderEntries";
import { SEARCH_MIN_CHARS, useSearch, type SearchScope } from "../hooks/useSearch";
import { useStorageCommands } from "../hooks/useStorageCommands";
import { usePreviewNavStore } from "../stores/previewNav.store";
import { useViewPrefs } from "../stores/viewPrefs.store";
import { BreadcrumbBar } from "./BreadcrumbBar";
import {
  BrowserError,
  BrowserSkeleton,
  EmptyFolder,
  FilteredEmpty,
  FolderLocked,
  SearchEmpty,
} from "./BrowserStates";
import { CommandSearch } from "./CommandSearch";
import { FilterMenu } from "./FilterMenu";
import { GridView } from "./GridView";
import { ListView } from "./ListView";
import { SortMenu } from "./SortMenu";
import { ViewToggle } from "./ViewToggle";

export function StorageBrowser({ path }: { path: string }) {
  const view = useViewPrefs((s) => s.view);
  const setFilter = useViewPrefs((s) => s.setFilter);

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const scope = (params.get("scope") as SearchScope) ?? "current";
  const searching = query.length >= SEARCH_MIN_CHARS;

  // Both queries are always mounted (folder browse is cached, search is gated by
  // `enabled`); we render whichever mode the URL is in.
  const folder = useFolderEntries(path);
  const search = useSearch({ query, scope, path });
  const active = searching ? search : folder;
  const entries = active.entries;

  const selection = useItemSelection(entries, path);
  useStorageCommands({ path, selection });

  // Publish the ordered previewable-file keys (in display order) for the preview
  // modal's ←/→ navigation — a neutral hand-off so preview never imports browse
  // internals (storage writes, preview reads).
  const previewKeys = useMemo(
    () =>
      entries
        .filter((e) => e.kind === "file" && isPreviewableName(e.name))
        .map((e) => e.key),
    [entries],
  );
  useEffect(() => {
    usePreviewNavStore.getState().setKeys(previewKeys);
  }, [previewKeys]);

  const broadenSearch = () =>
    router.replace(
      `${pathname}?${new URLSearchParams({ q: query, scope: "global" }).toString()}`,
      { scroll: false },
    );
  const clearSearch = () => router.replace(pathname, { scroll: false });

  // Live-region message: the count while selecting, an explicit "cleared" on
  // the N→0 transition (an emptied region announces nothing on its own).
  // Adjusted during render (the sanctioned derive-on-change pattern).
  const [liveMessage, setLiveMessage] = useState("");
  const [prevCount, setPrevCount] = useState(0);
  if (selection.count !== prevCount) {
    setPrevCount(selection.count);
    setLiveMessage(
      selection.count > 0
        ? `${selection.count} ${t("storage.ops.selection.selectedSuffix")}`
        : t("storage.ops.selection.cleared"),
    );
  }

  // Search result count, announced politely (separate region — it changes
  // independently of selection). Gated on `!isFetching` so a refetch that keeps
  // the previous results on screen (placeholderData) doesn't announce a stale
  // count before the new one settles.
  const searchLive =
    searching && !search.isFetching && !search.isError
      ? entries.length === 1
        ? t("storage.search.oneResult")
        : `${entries.length} ${t("storage.search.resultsSuffix")}`
      : "";

  let content: ReactNode;
  if (searching) {
    content = search.isError ? (
      <BrowserError onRetry={search.refetch} />
    ) : search.isPending ? (
      <BrowserSkeleton />
    ) : entries.length === 0 ? (
      <SearchEmpty
        query={query}
        scope={scope}
        onBroaden={broadenSearch}
        onClear={clearSearch}
      />
    ) : view === "grid" ? (
      <GridView entries={entries} path={path} selection={selection} />
    ) : (
      <ListView entries={entries} path={path} selection={selection} />
    );
  } else {
    // Error before loading: surface a failure immediately over a skeleton.
    content = folder.isLocked ? (
      <FolderLocked
        onUnlock={() =>
          useSecureFolderUiStore
            .getState()
            .open({ kind: "unlock", path, mode: "folder" })
        }
      />
    ) : folder.isError ? (
      <BrowserError onRetry={folder.refetch} />
    ) : folder.isPending ? (
      <BrowserSkeleton />
    ) : entries.length === 0 ? (
      folder.totalCount > 0 && folder.isFiltered ? (
        <FilteredEmpty onClear={() => setFilter("all", "")} />
      ) : (
        <EmptyFolder />
      )
    ) : view === "grid" ? (
      <GridView entries={entries} path={path} selection={selection} />
    ) : (
      <ListView entries={entries} path={path} selection={selection} />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <DndMoveLayer entries={entries} path={path} selection={selection}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BreadcrumbBar path={path} />
            <div className="flex items-center gap-2">
              <UploadButton path={path} />
              <CreateMenu path={path} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CommandSearch />
            <div className="flex items-center gap-2">
              <FilterMenu />
              <SortMenu />
              <ViewToggle />
            </div>
          </div>
        </div>
        <FileDropZone path={path}>
          <div
            id={BROWSE_CONTENT_ID}
            tabIndex={-1}
            className="min-h-0 flex-1 outline-none"
          >
            {content}
          </div>
        </FileDropZone>
      </DndMoveLayer>
      <BulkActionBar path={path} selection={selection} />
      <EntryActionsSheet path={path} />
      <SecureFolderDialogs />
      {/* Permanently mounted so the announcement isn't missed on first mount. */}
      <span aria-live="polite" className="sr-only">
        {liveMessage}
      </span>
      <span aria-live="polite" className="sr-only">
        {searchLive}
      </span>
    </div>
  );
}

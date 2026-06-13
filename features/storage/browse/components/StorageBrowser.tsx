"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import {
  BROWSE_CONTENT_ID,
  BulkActionBar,
  CreateMenu,
  DndMoveLayer,
  useItemSelection,
} from "../../operations";
import { FileDropZone } from "../../upload/components/FileDropZone";
import { UploadButton } from "../../upload/components/UploadButton";
import { useFolderEntries } from "../hooks/useFolderEntries";
import { useViewPrefs } from "../stores/viewPrefs.store";
import { BreadcrumbBar } from "./BreadcrumbBar";
import {
  BrowserError,
  BrowserSkeleton,
  EmptyFolder,
} from "./BrowserStates";
import { GridView } from "./GridView";
import { ListView } from "./ListView";
import { SortMenu } from "./SortMenu";
import { ViewToggle } from "./ViewToggle";

export function StorageBrowser({ path }: { path: string }) {
  const view = useViewPrefs((s) => s.view);
  const { entries, isPending, isError, refetch } = useFolderEntries(path);
  const selection = useItemSelection(entries, path);

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

  // Error before loading: if one query failed while the other is still pending,
  // surface the failure immediately instead of a skeleton over a known error.
  const content = isError ? (
    <BrowserError onRetry={refetch} />
  ) : isPending ? (
    <BrowserSkeleton />
  ) : entries.length === 0 ? (
    <EmptyFolder />
  ) : view === "grid" ? (
    <GridView entries={entries} path={path} selection={selection} />
  ) : (
    <ListView entries={entries} path={path} selection={selection} />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <DndMoveLayer entries={entries} path={path} selection={selection}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BreadcrumbBar path={path} />
          <div className="flex items-center gap-2">
            <UploadButton path={path} />
            <CreateMenu path={path} />
            <SortMenu />
            <ViewToggle />
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
      {/* Permanently mounted so the announcement isn't missed on first mount. */}
      <span aria-live="polite" className="sr-only">
        {liveMessage}
      </span>
    </div>
  );
}

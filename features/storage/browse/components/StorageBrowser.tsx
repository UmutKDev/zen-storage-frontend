"use client";

import { CreateMenu } from "../../operations";
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
import { UsageBar } from "./UsageBar";
import { ViewToggle } from "./ViewToggle";

export function StorageBrowser({ path }: { path: string }) {
  const view = useViewPrefs((s) => s.view);
  const { entries, isPending, isError, refetch } = useFolderEntries(path);

  // Error before loading: if one query failed while the other is still pending,
  // surface the failure immediately instead of a skeleton over a known error.
  const content = isError ? (
    <BrowserError onRetry={refetch} />
  ) : isPending ? (
    <BrowserSkeleton />
  ) : entries.length === 0 ? (
    <EmptyFolder />
  ) : view === "grid" ? (
    <GridView entries={entries} path={path} />
  ) : (
    <ListView entries={entries} path={path} />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BreadcrumbBar path={path} />
        <div className="flex items-center gap-2">
          <CreateMenu path={path} />
          <SortMenu />
          <ViewToggle />
        </div>
      </div>
      <div className="min-h-0 flex-1">{content}</div>
      <UsageBar />
    </div>
  );
}

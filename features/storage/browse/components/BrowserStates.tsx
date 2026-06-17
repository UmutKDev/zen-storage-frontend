"use client";

import { FilterX, FolderOpen, Lock, SearchX } from "lucide-react";
import { t } from "@/lib/i18n";
import type { SearchScope } from "../hooks/useSearch";
import { Button, Skeleton } from "@/components/ui";

export function BrowserSkeleton() {
  return (
    <div className="space-y-2" aria-busy aria-label={t("common.loading")}>
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function EmptyFolder() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <FolderOpen className="size-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        {t("storage.empty.title")}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("storage.empty.description")}
      </p>
    </div>
  );
}

/** No search results. Offers broadening to a global search (current scope only)
 *  and clearing the search. The query is rendered in JSX (no interpolation). */
export function SearchEmpty({
  query,
  scope,
  onBroaden,
  onClear,
}: {
  query: string;
  scope: SearchScope;
  onBroaden: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <SearchX className="size-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        {t("storage.search.noResultsTitle")}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("storage.search.noResultsDescription")}{" "}
        <span className="font-medium text-foreground">“{query}”</span>
      </p>
      <div className="mt-2 flex items-center gap-2">
        {scope === "current" ? (
          <Button variant="outline" size="sm" onClick={onBroaden}>
            {t("storage.search.broaden")}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t("storage.search.clear")}
        </Button>
      </div>
    </div>
  );
}

/** A non-empty folder with nothing matching the active filter (distinct from the
 *  truly-empty folder state, which prompts an upload). */
export function FilteredEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <FilterX className="size-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        {t("storage.filter.noMatchTitle")}
      </p>
      <p className="text-sm text-muted-foreground">
        {t("storage.filter.noMatchDescription")}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={onClear}
      >
        {t("storage.filter.clear")}
      </Button>
    </div>
  );
}

/** A locked encrypted folder reached directly (deep-link/refresh) or after the
 *  session TTL expired — prompts for the passphrase instead of an error. */
export function FolderLocked({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
      role="status"
    >
      <Lock className="size-10 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        {t("storage.ops.secure.lockedFolder.title")}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {t("storage.ops.secure.lockedFolder.body")}
      </p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onUnlock}>
        {t("storage.ops.secure.lockedFolder.action")}
      </Button>
    </div>
  );
}

export function BrowserError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-foreground">
        {t("storage.error.title")}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  );
}

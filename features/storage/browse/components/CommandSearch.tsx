"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useShortcut } from "@/lib/shortcuts";
import { Input } from "@/components/ui";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { SearchScope } from "../hooks/useSearch";

/** Stable id so the `/` shortcut can focus the search box from anywhere. */
export const SEARCH_INPUT_ID = "storage-search-input";

/** Build the storage URL for a given query + scope (scope only rides along while
 *  a query exists — it's meaningless without one). */
function searchUrl(pathname: string, query: string, scope: SearchScope): string {
  const q = query.trim();
  if (!q) return pathname;
  const sp = new URLSearchParams({ q, scope });
  return `${pathname}?${sp.toString()}`;
}

/**
 * Search box + scope toggle. The URL (`?q=&scope=`) is the source of truth so a
 * search is shareable; the input keeps a local echo for instant typing and
 * writes the URL debounced (replace, never push). External URL changes —
 * folder navigation (links drop the query), the ⌘K palette's "search
 * everywhere", a shared link — sync back into the box.
 */
export function CommandSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const urlQuery = params.get("q") ?? "";
  const [raw, setRaw] = useState(urlQuery);
  const [scope, setScope] = useState<SearchScope>(
    () => (params.get("scope") as SearchScope) ?? "current",
  );
  const debounced = useDebouncedValue(raw, 300);

  // URL → local echo: reflect *external* query changes (folder nav clears the
  // query, the ⌘K palette sets it, a shared link arrives). Done by adjusting
  // state during render (the sanctioned pattern) rather than in an effect, and
  // skipped when the URL already matches our own debounced write.
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    if (urlQuery.trim() !== raw.trim()) setRaw(urlQuery);
  }

  // Local echo (debounced) + scope → URL. Guarded so our own writes don't loop.
  useEffect(() => {
    const q = debounced.trim();
    const currentQ = (params.get("q") ?? "").trim();
    const currentScope = params.get("scope") ?? "current";
    if (q === currentQ && (!q || scope === currentScope)) return;
    router.replace(searchUrl(pathname, q, scope), { scroll: false });
  }, [debounced, scope, params, pathname, router]);

  const onScope = (next: SearchScope) => {
    setScope(next);
    const q = raw.trim();
    if (q) router.replace(searchUrl(pathname, q, next), { scroll: false });
  };

  // `/` focuses the search box — registered here so the binding only exists
  // while the storage screen (this component) is mounted.
  useShortcut(
    useMemo(
      () => ({
        id: "storage.focus-search",
        keys: "/",
        scope: "storage",
        description: t("shortcuts.focusSearch"),
        run: () => {
          const el = document.getElementById(
            SEARCH_INPUT_ID,
          ) as HTMLInputElement | null;
          el?.focus();
          el?.select();
        },
      }),
      [],
    ),
  );

  const hasQuery = raw.trim().length > 0;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
      <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={SEARCH_INPUT_ID}
          type="search"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && hasQuery) {
              e.preventDefault();
              setRaw("");
            }
          }}
          placeholder={t("storage.search.placeholder")}
          aria-label={t("storage.search.label")}
          className="h-9 pl-9 pr-9"
          // Native clear control is redundant with our own button.
          autoComplete="off"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => setRaw("")}
            aria-label={t("storage.search.clear")}
            className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Scope toggle — only meaningful while a query exists. */}
      {hasQuery ? (
        <div
          role="group"
          aria-label={t("storage.search.scopeLabel")}
          className="inline-flex shrink-0 rounded-md border border-border bg-surface p-0.5"
        >
          {(
            [
              ["current", t("storage.search.currentScope")],
              ["global", t("storage.search.globalScope")],
            ] as ReadonlyArray<[SearchScope, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => onScope(value)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                scope === value
                  ? "bg-surface-elevated text-foreground shadow-e1"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { VirtualList } from "@/components/patterns/virtual-list";
import { t } from "@/lib/i18n";
import type { ItemSelection } from "../../operations";
import type { FolderEntry } from "../lib/entries";
import type { PendingEntry } from "../lib/pending";
import { BrowseRow } from "./BrowseRow";
import { PendingRow } from "./PendingRow";

export function ListView({
  entries,
  path,
  selection,
  pending = [],
}: {
  entries: FolderEntry[];
  path: string;
  selection: ItemSelection;
  /** In-flight operations shown as non-interactive rows above the real entries. */
  pending?: PendingEntry[];
}) {
  return (
    <div className="zs-file-panel flex h-full flex-col">
      {/* Visual column header — decorative over the virtualized list, so it's
          hidden from the a11y tree (the list keeps its own list semantics). */}
      <div className="zs-file-panel__head" aria-hidden>
        <span className="min-w-0 flex-1 pl-[60px]">{t("storage.columns.name")}</span>
        <span className="w-20 shrink-0 text-right">{t("storage.columns.size")}</span>
        <span className="hidden w-40 shrink-0 text-right sm:block">
          {t("storage.columns.modified")}
        </span>
        <span className="w-[40px] shrink-0" />
      </div>
      {/* Pending rows render ABOVE the virtualized list (not inside it): a
          virtualized list only renders its scroll window, so an in-flight row at
          index 0 vanishes once the user scrolls — but a background job must stay
          visible the whole time. This also matches the intended layout ("pending
          rows above the real entries"). Selection/DnD never see these rows. */}
      {pending.length > 0 ? (
        <div
          role="list"
          aria-label={t("storage.pending.label")}
          className="shrink-0"
        >
          {pending.map((p) => (
            <div role="listitem" key={`pending:${p.id}`}>
              <PendingRow entry={p} />
            </div>
          ))}
        </div>
      ) : null}
      <VirtualList
        rows={entries}
        estimateSize={57}
        renderRow={(entry) => (
          <BrowseRow entry={entry} path={path} selection={selection} />
        )}
        getRowKey={(entry) => `${entry.kind}:${entry.key}`}
        ariaLabel={t("storage.list.label")}
        className="min-h-0 flex-1"
      />
    </div>
  );
}

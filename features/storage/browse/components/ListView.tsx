"use client";

import { VirtualList } from "@/components/patterns/virtual-list";
import { t } from "@/lib/i18n";
import type { ItemSelection } from "../../operations";
import type { FolderEntry } from "../lib/entries";
import type { PendingEntry } from "../lib/pending";
import { BrowseRow } from "./BrowseRow";
import { PendingRow } from "./PendingRow";

/** A list row is either an in-flight pending placeholder (rendered above) or a
 *  real entry. Kept local to the render so selection/DnD never see pending. */
type ListRow = { pending: PendingEntry } | { entry: FolderEntry };

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
  const rows: ListRow[] = [
    ...pending.map((p) => ({ pending: p })),
    ...entries.map((e) => ({ entry: e })),
  ];
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
      <VirtualList
        rows={rows}
        estimateSize={57}
        renderRow={(row) =>
          "pending" in row ? (
            <PendingRow entry={row.pending} />
          ) : (
            <BrowseRow entry={row.entry} path={path} selection={selection} />
          )
        }
        getRowKey={(row) =>
          "pending" in row
            ? `pending:${row.pending.id}`
            : `${row.entry.kind}:${row.entry.key}`
        }
        ariaLabel={t("storage.list.label")}
        className="min-h-0 flex-1"
      />
    </div>
  );
}

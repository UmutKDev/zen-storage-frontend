"use client";

import { VirtualList } from "@/components/patterns/virtual-list";
import { t } from "@/lib/i18n";
import type { ItemSelection } from "../../operations";
import type { FolderEntry } from "../lib/entries";
import { BrowseRow } from "./BrowseRow";

export function ListView({
  entries,
  path,
  selection,
}: {
  entries: FolderEntry[];
  path: string;
  selection: ItemSelection;
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

"use client";

import { VirtualList } from "@/components/patterns/virtual-list";
import { t } from "@/lib/i18n";
import type { FolderEntry } from "../lib/entries";
import { BrowseRow } from "./BrowseRow";

export function ListView({
  entries,
  path,
}: {
  entries: FolderEntry[];
  path: string;
}) {
  return (
    <VirtualList
      rows={entries}
      estimateSize={48}
      renderRow={(entry) => <BrowseRow entry={entry} path={path} />}
      getRowKey={(entry) => `${entry.kind}:${entry.key}`}
      ariaLabel={t("storage.list.label")}
      className="h-full"
    />
  );
}

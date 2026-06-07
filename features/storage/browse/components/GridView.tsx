"use client";

import { VirtualList } from "@/components/patterns/virtual-list";
import { t } from "@/lib/i18n";
import type { FolderEntry } from "../lib/entries";
import { useGridColumns } from "../hooks/useGridColumns";
import { BrowseCard } from "./BrowseCard";

function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) return [items];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function GridView({
  entries,
  path,
}: {
  entries: FolderEntry[];
  path: string;
}) {
  const { ref, columns } = useGridColumns();
  const rows = chunk(entries, columns);

  return (
    <div ref={ref} className="h-full">
      <VirtualList
        rows={rows}
        itemCount={entries.length}
        estimateSize={156}
        rowRole="none"
        renderRow={(row) => (
          <div
            className="grid gap-3 py-1.5"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {row.map((entry) => (
              <div
                key={`${entry.kind}:${entry.key}`}
                role="listitem"
                className="h-36"
              >
                <BrowseCard entry={entry} path={path} />
              </div>
            ))}
          </div>
        )}
        getRowKey={(row, index) =>
          row[0] ? `${row[0].kind}:${row[0].key}` : index
        }
        ariaLabel={t("storage.list.label")}
        className="h-full"
      />
    </div>
  );
}

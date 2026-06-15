"use client";

import { t } from "@/lib/i18n";
import { cn, fileMeta, formatBytes, isThumbnailable, toneClass } from "@/lib/utils";
import { Badge, Checkbox } from "@/components/ui";
import type { CloudDuplicateFileModel, CloudDuplicateGroupModel } from "@/service/models";

function FileThumb({ file }: { file: CloudDuplicateFileModel }) {
  const url = file.Path?.Url;
  if (isThumbnailable(file.Name) && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- presigned CDN URL, lazy
      <img
        src={url}
        alt=""
        loading="lazy"
        className="size-9 shrink-0 rounded-md object-cover"
      />
    );
  }
  const meta = fileMeta(file.Name, "file");
  const Icon = meta.icon;
  return (
    <span
      className={cn("zs-tile-icon size-9 shrink-0 [&>svg]:size-4", toneClass(meta.tone))}
      aria-hidden
    >
      <Icon />
    </span>
  );
}

/**
 * One duplicate group: an exact (SHA-256) or perceptual (dHash) match set. The
 * header carries the match-type badge + potential savings; each file row is a
 * checkbox (selected = marked for deletion) + thumbnail/icon + name + size. The
 * first file (largest) is kept by default — the parent seeds the selection.
 */
export function DuplicateGroupCard({
  group,
  selected,
  onToggle,
}: {
  group: CloudDuplicateGroupModel;
  selected: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  const exact = group.MatchType === "exact";
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <Badge variant={exact ? "secondary" : "info"}>
          {exact
            ? t("storage.duplicate.matchExact")
            : `${t("storage.duplicate.matchSimilar")} · ${group.Similarity}%`}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatBytes(group.PotentialSavingsBytes)} {t("storage.duplicate.savable")}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {group.Files.map((file) => {
          const isSelected = selected.has(file.Key);
          return (
            <li key={file.Key} className="flex items-center gap-3 px-3 py-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(file.Key)}
                aria-label={`${isSelected ? t("storage.duplicate.keepFile") : t("storage.duplicate.deleteFile")}: ${file.Name}`}
              />
              <FileThumb file={file} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">
                  {file.Name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {file.Key}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatBytes(file.Size)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

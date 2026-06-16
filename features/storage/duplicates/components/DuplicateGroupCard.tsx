"use client";

import { Check, Trash2 } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn, fileMeta, formatBytes, isThumbnailable, toneClass } from "@/lib/utils";
import { Badge } from "@/components/ui";
import type {
  CloudDuplicateFileModel,
  CloudDuplicateGroupModel,
} from "@/service/models";

function TileMedia({ file }: { file: CloudDuplicateFileModel }) {
  const url = file.Path?.Url;
  if (isThumbnailable(file.Name) && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- presigned CDN URL, lazy
      <img src={url} alt="" loading="lazy" className="size-full object-cover" />
    );
  }
  const meta = fileMeta(file.Name, "file");
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center [&>svg]:size-10",
        toneClass(meta.tone),
      )}
      aria-hidden
    >
      <Icon />
    </span>
  );
}

/**
 * One file in a duplicate group, rendered as a large selectable tile so copies
 * can be compared side by side. `isSelected` = marked for deletion (the parent
 * keeps the largest by default). The whole tile is the toggle — click the image
 * to flip keep ↔ delete.
 */
function FileTile({
  file,
  isSelected,
  onToggle,
}: {
  file: CloudDuplicateFileModel;
  isSelected: boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(file.Key)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? t("storage.duplicate.deleteFile") : t("storage.duplicate.keepFile")}: ${file.Name}`}
      className={cn(
        "relative flex w-36 shrink-0 flex-col gap-2 rounded-xl p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        isSelected ? "bg-destructive/5" : "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-lg bg-muted ring-2 transition-colors",
          isSelected ? "ring-destructive/50" : "ring-primary/60",
        )}
      >
        <TileMedia file={file} />
        {isSelected && (
          <span className="absolute inset-0 bg-destructive/25" aria-hidden />
        )}
        <span
          className={cn(
            "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full text-white shadow-sm [&>svg]:size-3.5",
            isSelected ? "bg-destructive" : "bg-primary",
          )}
          aria-hidden
        >
          {isSelected ? <Trash2 /> : <Check />}
        </span>
        <span
          className={cn(
            "absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase",
            isSelected ? "bg-destructive/90" : "bg-primary/90",
          )}
          aria-hidden
        >
          {isSelected
            ? t("storage.duplicate.deleteFile")
            : t("storage.duplicate.keepFile")}
        </span>
      </div>
      <div className="min-w-0 px-0.5">
        <span className="block truncate text-xs font-medium text-foreground">
          {file.Name}
        </span>
        <span className="block text-[11px] text-muted-foreground tabular-nums">
          {formatBytes(file.Size)}
        </span>
      </div>
    </button>
  );
}

/**
 * One duplicate group: an exact (SHA-256) or perceptual (dHash) match set. A
 * header carries the match-type badge, file count and potential savings; the
 * body is a horizontal gallery of selectable tiles so the user compares the
 * copies visually and flips which to delete.
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
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={exact ? "secondary" : "info"}>
            {exact
              ? t("storage.duplicate.matchExact")
              : `${t("storage.duplicate.matchSimilar")} · ${group.Similarity}%`}
          </Badge>
          <span className="truncate text-xs text-muted-foreground">
            {group.Files.length} {t("storage.duplicate.filesSuffix")}
          </span>
        </div>
        <span className="shrink-0 text-xs font-semibold text-foreground/80">
          {formatBytes(group.PotentialSavingsBytes)}{" "}
          {t("storage.duplicate.savable")}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto p-4">
        {group.Files.map((file) => (
          <FileTile
            key={file.Key}
            file={file}
            isSelected={selected.has(file.Key)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

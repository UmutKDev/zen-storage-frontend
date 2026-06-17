"use client";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import type { DocumentDiffResponseModel } from "@/service/models";

/** Color a unified-diff line by its leading marker, via semantic tokens. */
function lineClass(line: string): string {
  const marker = line.charCodeAt(0);
  if (marker === 43 /* + */) return "bg-success/15 text-success";
  if (marker === 45 /* - */) return "bg-destructive/10 text-destructive";
  return "text-muted-foreground";
}

/**
 * Renders a **backend-computed** unified diff of a document version vs the
 * current content (`DocumentDiffResponseModel`): a stats summary, then each
 * hunk's `@@` header and its raw `+/-/ `-prefixed `Lines`, colored by leading
 * marker with semantic tokens. There is **no client-side diffing** — the server
 * produces the hunks; we only style them. Empty hunks → a "no changes" note.
 */
export function DiffView({ diff }: { diff: DocumentDiffResponseModel }) {
  if (diff.Hunks.length === 0) {
    return (
      <p className="px-3 py-3 text-xs text-muted-foreground">
        {t("preview.diff.noChanges")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border/60 bg-surface">
      <div className="flex items-center gap-3 border-b border-border/60 px-3 py-1.5 text-xs tabular-nums">
        <span className="font-medium text-foreground">
          {t("preview.diff.title")}
        </span>
        <span className="text-success">+{diff.Stats.Additions}</span>
        <span className="text-destructive">&minus;{diff.Stats.Deletions}</span>
      </div>
      <pre className="max-h-64 overflow-auto py-1 text-xs leading-relaxed">
        <code className="block font-mono">
          {diff.Hunks.map((hunk, hi) => (
            <span key={hi} className="block">
              <span className="block bg-accent/40 px-3 py-0.5 text-muted-foreground">
                @@ -{hunk.OldStart},{hunk.OldLines} +{hunk.NewStart},
                {hunk.NewLines} @@
              </span>
              {hunk.Lines.map((line, li) => (
                <span
                  key={`${hi}:${li}`}
                  className={cn("block whitespace-pre px-3", lineClass(line))}
                >
                  {line.length > 0 ? line : " "}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

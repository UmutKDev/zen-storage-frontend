"use client";

import type { ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { t } from "@/lib/i18n";
import { useFileDrop } from "../hooks/useFileDrop";
import { useUploadQueue } from "../hooks/useUploadQueue";

/**
 * OS-file drop target over the browse surface (file-drop = upload; the
 * dnd-kit move layer handles item-drops — separate event systems, never
 * ambiguous per upload-pipeline §3). The dashed overlay is the upload-drop
 * affordance, visually distinct from the move layer's per-row rings.
 */
export function FileDropZone({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const queue = useUploadQueue();
  const { isDragActive, dropProps } = useFileDrop((files) => {
    void queue.enqueue(files, path);
  });

  return (
    <div {...dropProps} className="relative flex min-h-0 flex-1 flex-col">
      {children}
      {isDragActive ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-brand bg-brand/[0.06] backdrop-blur-[2px]">
          <p className="flex items-center gap-2.5 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground shadow-e2">
            <UploadCloud className="size-5 text-primary" />
            {t("storage.upload.drop.hint")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

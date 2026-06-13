"use client";

import { useRef, useState } from "react";
import { Check, FolderUp, Lock, Upload, UploadCloud, X } from "lucide-react";
import { cn, basename, fileMeta, formatBytes, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { Button, Dialog, DialogContent } from "@/components/ui";
import { SectionedDialog } from "../../operations/components/SectionedDialog";
import { useFileDrop } from "../hooks/useFileDrop";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { filesFromDirectoryInput } from "../lib/traverse";
import type { UploadItem, UploadStatus } from "../stores/uploads.store";

const ACTIVE: ReadonlySet<UploadStatus> = new Set([
  "queued",
  "presigning",
  "uploading",
  "completing",
  "paused",
]);

/** One queue row — a VIEW of the engine's item (the tray owns the controls). */
function UploadRow({
  item,
  onCancel,
  onDismiss,
}: {
  item: UploadItem;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const meta = fileMeta(item.fileName, "file");
  const Icon = meta.icon;
  const percent =
    item.totalSize > 0
      ? Math.round((item.uploadedBytes / item.totalSize) * 100)
      : item.status === "done"
        ? 100
        : 0;
  const done = item.status === "done";
  const failed = item.status === "error" || item.status === "blocked";
  const active = ACTIVE.has(item.status);

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 [&+li]:border-t [&+li]:border-border/50">
      <span className={cn("zs-tile-icon size-8 shrink-0 [&>svg]:size-4", toneClass(meta.tone))}>
        <Icon />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <span className="min-w-0 flex-1 truncate text-sm font-medium tracking-[-0.01em] text-foreground">
            {item.fileName}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatBytes(item.totalSize)}
          </span>
        </div>
        {done ? (
          <span className="truncate text-xs text-success">
            {t("storage.upload.status.done")}
          </span>
        ) : failed ? (
          <span className="truncate text-xs text-destructive">
            {item.errorMessage ?? t("storage.upload.status.error")}
          </span>
        ) : (
          <span className="zs-rail" aria-hidden>
            <span className="zs-rail__fill" style={{ width: `${percent}%` }} />
          </span>
        )}
      </div>
      <div className="flex w-7 shrink-0 items-center justify-center">
        {done ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="size-3.5" />
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              active
                ? t("storage.upload.actions.cancel")
                : t("storage.upload.actions.dismiss")
            }
            onClick={() => (active ? onCancel(item.id) : onDismiss(item.id))}
          >
            <X />
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Premium upload surface opened by the hero Upload button: machined emblem
 * head, an engraved dropzone (browse + drag-and-drop + folder pick), and a live
 * per-file queue. It is an ENTRY affordance + live mirror over the existing
 * engine — `enqueue` feeds the same `useUploadsStore`, and "Hide" closes the
 * dialog while uploads continue in the always-mounted background tray.
 */
export function UploadDialog({
  path,
  open,
  onOpenChange,
}: {
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queue = useUploadQueue();
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [folderPickerSupported] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const { isDragActive, dropProps } = useFileDrop((files) => {
    void queue.enqueue(files, path);
  });

  const destination = basename(path) || t("storage.breadcrumb.home");
  const activeCount = queue.items.filter((i) => ACTIVE.has(i.status)).length;
  const hasItems = queue.items.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[560px]"
      >
        <SectionedDialog
          icon={Upload}
          emblemTone="armed"
          title={t("storage.upload.dialog.title")}
          subtitle={
            <>
              {t("storage.upload.dialog.to")}{" "}
              <strong className="font-medium text-foreground">{destination}</strong>
            </>
          }
          footStart={
            <span className="zs-section-cipher">
              <Lock className="size-3" />
              {t("storage.upload.dialog.cipher")}
            </span>
          }
          footActions={
            <>
              {activeCount > 0 ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {activeCount} {t("storage.upload.tray.activeSuffix")}
                </span>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {hasItems ? t("storage.upload.dialog.hide") : t("common.cancel")}
              </Button>
            </>
          }
        >
          <div
            {...dropProps}
            role="button"
            tabIndex={0}
            aria-label={t("storage.upload.dialog.cta")}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInput.current?.click();
              }
            }}
            className={cn("zs-dropzone", isDragActive && "zs-dropzone--over")}
          >
            <span className="zs-dropzone__disc" aria-hidden>
              <UploadCloud className="size-6" />
            </span>
            <p className="text-sm font-medium text-foreground">
              {t("storage.upload.dialog.cta")}{" "}
              <span className="font-semibold text-primary underline underline-offset-2">
                {t("storage.upload.dialog.browse")}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("storage.upload.dialog.hint")}
            </p>
            {folderPickerSupported ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInput.current?.click();
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight),0_1px_2px_0_rgb(0_0_0/0.06)] transition-colors hover:border-brand/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <FolderUp className="size-3.5 text-muted-foreground" />
                {t("storage.upload.dialog.folder")}
              </button>
            ) : null}
          </div>

          {hasItems ? (
            <ul className="max-h-60 overflow-y-auto rounded-lg border border-border bg-surface shadow-[inset_0_1px_0_0_var(--glass-highlight)]">
              {queue.items.map((item) => (
                <UploadRow
                  key={item.id}
                  item={item}
                  onCancel={queue.cancel}
                  onDismiss={queue.dismiss}
                />
              ))}
            </ul>
          ) : (
            <p className="px-1 text-center text-xs text-muted-foreground">
              {t("storage.upload.dialog.empty")}
            </p>
          )}
        </SectionedDialog>

        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).map((file) => ({
              file,
              relativeDir: "",
            }));
            e.target.value = "";
            if (files.length > 0) void queue.enqueue(files, path);
          }}
        />
        <input
          ref={folderInput}
          type="file"
          hidden
          {...{ webkitdirectory: "" }}
          onChange={(e) => {
            const files = filesFromDirectoryInput(e.target.files ?? []);
            e.target.value = "";
            if (files.length > 0) void queue.enqueue(files, path);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

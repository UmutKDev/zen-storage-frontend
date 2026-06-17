"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { cn, fileMeta, formatBytes, toneClass } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { toast as toastVariant } from "@/lib/motion";
import { Button, Dialog, DialogContent, Progress } from "@/components/ui";
import { ConflictPrompt } from "../../operations/components/ConflictPrompt";
import { focusBrowseContent } from "../../operations/lib/feedback";
import { uploadEngine } from "../core/engine";
import { useUploadEngineBoot, useUploadQueue } from "../hooks/useUploadQueue";
import {
  useUploadsStore,
  type UploadItem,
  type UploadStatus,
} from "../stores/uploads.store";

const STATUS_KEY: Record<UploadStatus, string> = {
  queued: "storage.upload.status.queued",
  presigning: "storage.upload.status.presigning",
  uploading: "storage.upload.status.uploading",
  completing: "storage.upload.status.completing",
  done: "storage.upload.status.done",
  error: "storage.upload.status.error",
  paused: "storage.upload.status.paused",
  canceled: "storage.upload.status.canceled",
  conflict: "storage.upload.status.conflict",
  blocked: "storage.upload.status.blocked",
};

const ACTIVE: ReadonlySet<UploadStatus> = new Set([
  "queued",
  "presigning",
  "uploading",
  "completing",
]);

/** 32px visual + 4px hit-slop each side = 40px effective target (a11y §7);
 *  paired with `gap-3` so adjacent expanded targets don't overlap. */
const TRAY_BUTTON = "relative after:absolute after:-inset-1 after:content-['']";

/** The single always-positioned primary action — same DOM node across status
 *  flips (pause↔resume↔retry), so keyboard focus survives the swap. */
function primaryAction(
  item: UploadItem,
  queue: ReturnType<typeof useUploadQueue>,
): { icon: typeof Pause; label: string; run: () => void } | null {
  switch (item.status) {
    case "queued":
    case "presigning":
    case "uploading":
      return {
        icon: Pause,
        label: t("storage.upload.actions.pause"),
        run: () => queue.pause(item.id),
      };
    case "paused":
      return {
        icon: Play,
        label: t("storage.upload.actions.resume"),
        run: () => queue.resume(item.id),
      };
    case "error":
    case "blocked":
      return {
        icon: RotateCcw,
        label: t("storage.upload.actions.retry"),
        run: () => queue.retry(item.id),
      };
    default:
      return null;
  }
}

function TrayRow({
  item,
  queue,
  onDismiss,
}: {
  item: UploadItem;
  queue: ReturnType<typeof useUploadQueue>;
  onDismiss: (id: string) => void;
}) {
  const percent =
    item.totalSize > 0
      ? Math.round((item.uploadedBytes / item.totalSize) * 100)
      : item.status === "done"
        ? 100
        : 0;
  const failed = item.status === "error" || item.status === "blocked";
  const cancelable = ACTIVE.has(item.status) || item.status === "paused";
  const action = primaryAction(item, queue);
  const ActionIcon = action?.icon;
  const meta = fileMeta(item.fileName, "file");
  const FileTypeIcon = meta.icon;

  return (
    <li className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "zs-tile-icon size-7 shrink-0 [&>svg]:size-3.5",
            toneClass(meta.tone),
          )}
          aria-hidden
        >
          <FileTypeIcon />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          {item.fileName}
        </span>
        {action && ActionIcon ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className={TRAY_BUTTON}
            aria-label={action.label}
            onClick={action.run}
          >
            <ActionIcon />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          className={TRAY_BUTTON}
          aria-label={
            cancelable
              ? t("storage.upload.actions.cancel")
              : t("storage.upload.actions.dismiss")
          }
          onClick={() =>
            cancelable ? queue.cancel(item.id) : onDismiss(item.id)
          }
        >
          <X />
        </Button>
      </div>
      {cancelable ? (
        <Progress
          value={percent}
          aria-label={t("storage.upload.tray.progressLabel")}
        />
      ) : null}
      <p
        className={cn(
          "truncate text-xs",
          failed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {item.status === "uploading"
          ? `${t(STATUS_KEY[item.status])} ${formatBytes(item.uploadedBytes)} / ${formatBytes(item.totalSize)}`
          : (item.errorMessage ?? t(STATUS_KEY[item.status]))}
      </p>
    </li>
  );
}

/** Conflict gate: prompts for the FIRST conflicted upload; "apply to all"
 *  remembers the strategy for the rest of that batch (one user action). */
function UploadConflictDialog({ items }: { items: ReadonlyArray<UploadItem> }) {
  const [applyToAll, setApplyToAll] = useState(false);
  const hasConflict = items.some((i) => i.status === "conflict");
  const conflict = hasConflict ? uploadEngine.firstConflict() : null;

  if (!conflict) return null;
  const close = () => {
    uploadEngine.resolveConflict(conflict.id, "SKIP", false);
    setApplyToAll(false);
  };
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <ConflictPrompt
          details={conflict.details}
          onResolve={(strategy) => {
            uploadEngine.resolveConflict(conflict.id, strategy, applyToAll);
            setApplyToAll(false);
          }}
          onCancel={close}
          applyToAll={
            conflict.batchSize > 1
              ? { checked: applyToAll, onChange: setApplyToAll }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Persistent queue tray (bottom-right, survives folder navigation — mounted
 * in the app layout). Glass-overlay pane (design-system signature tier),
 * per-file progress + pause/resume/retry/cancel, polite + assertive live
 * regions for status transitions, and the conflict gate.
 */
export function UploadTray() {
  useUploadEngineBoot();
  const queue = useUploadQueue();
  // While the upload dialog is open it already shows the queue — suppress the
  // tray pane so progress isn't shown twice (the engine, live regions, and
  // conflict gate below stay mounted).
  const dialogOpen = useUploadsStore((s) => s.dialogOpen);
  const [collapsed, setCollapsed] = useState(false);
  const collapseRef = useRef<HTMLButtonElement>(null);
  const activeCount = queue.items.filter((i) => ACTIVE.has(i.status)).length;

  // Live-region messages, adjusted during render (derive-on-change pattern —
  // an emptied region announces nothing, so transitions set explicit copy):
  // polite for done/paused/all-complete, assertive for error/blocked. The
  // suppressed central toast makes the tray the ONLY error surface.
  const [prevStatuses, setPrevStatuses] = useState<
    ReadonlyMap<string, UploadStatus>
  >(new Map());
  const [politeMessage, setPoliteMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const statusesChanged =
    queue.items.length !== prevStatuses.size ||
    queue.items.some((i) => prevStatuses.get(i.id) !== i.status);
  if (statusesChanged) {
    for (const item of queue.items) {
      const was = prevStatuses.get(item.id);
      if (was === item.status) continue;
      if (item.status === "done" || item.status === "paused") {
        setPoliteMessage(`${item.fileName} — ${t(STATUS_KEY[item.status])}`);
      } else if (item.status === "error" || item.status === "blocked") {
        setAlertMessage(
          `${item.fileName}: ${item.errorMessage ?? t(STATUS_KEY[item.status])}`,
        );
      }
    }
    const wasActive = [...prevStatuses.values()].some((s) => ACTIVE.has(s));
    if (wasActive && activeCount === 0 && queue.items.length > 0) {
      setPoliteMessage(t("storage.upload.tray.allComplete"));
    }
    setPrevStatuses(new Map(queue.items.map((i) => [i.id, i.status])));
  }

  const dismissWithFocusHandoff = (id: string) => {
    const last = queue.items.length === 1;
    queue.dismiss(id);
    // The focused X just left the DOM — hand focus to a stable target.
    if (last) focusBrowseContent();
    else collapseRef.current?.focus();
  };

  return (
    <>
      <AnimatePresence>
        {queue.items.length > 0 && !dialogOpen ? (
          <motion.section
            variants={toastVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-label={t("storage.upload.tray.title")}
            className="glass-overlay fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg"
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2">
              <h2 className="flex-1 text-sm font-medium text-foreground">
                {t("storage.upload.tray.title")}
                {activeCount > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {activeCount} {t("storage.upload.tray.activeSuffix")}
                  </span>
                ) : null}
              </h2>
              <Button
                ref={collapseRef}
                variant="ghost"
                size="icon-sm"
                className={TRAY_BUTTON}
                aria-expanded={!collapsed}
                aria-label={
                  collapsed
                    ? t("storage.upload.tray.expand")
                    : t("storage.upload.tray.collapse")
                }
                onClick={() => setCollapsed((c) => !c)}
              >
                {collapsed ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </header>
            {collapsed ? null : (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {queue.items.map((item) => (
                  <TrayRow
                    key={item.id}
                    item={item}
                    queue={queue}
                    onDismiss={dismissWithFocusHandoff}
                  />
                ))}
              </ul>
            )}
          </motion.section>
        ) : null}
      </AnimatePresence>
      {/* Permanently mounted live regions (mount-with-message isn't announced). */}
      <span aria-live="polite" className="sr-only">
        {politeMessage}
      </span>
      <span role="alert" className="sr-only">
        {alertMessage}
      </span>
      <UploadConflictDialog items={queue.items} />
    </>
  );
}

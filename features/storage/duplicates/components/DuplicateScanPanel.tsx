"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Label,
  Progress,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { VirtualList } from "@/components/patterns/virtual-list";
import type { CloudDuplicateGroupModel } from "@/service/models";
import { useDuplicateScan } from "../hooks/useDuplicateScan";
import {
  defaultSelectedKeys,
  pruneGroups,
  selectedBytes,
  selectedCount,
} from "../lib/resolve";
import { DuplicateGroupCard } from "./DuplicateGroupCard";

const PRESETS = { strict: 98, balanced: 95, loose: 90 } as const;
type Preset = keyof typeof PRESETS;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5">
      <div className="truncate text-base font-semibold text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  );
}

/**
 * Duplicate-scan panel (§6.2): a constrained flex-column Dialog (header · scroll
 * body · sticky footer) whose body swaps by the tracked job's state — options →
 * scanning (progress from the job store) → results (a gallery of match groups,
 * resolve by picking which copies to delete). The topbar `JobsMenu` also surfaces
 * the scan; this is the review/resolve UI.
 */
export function DuplicateScanPanel({
  path,
  open,
  onOpenChange,
}: {
  path: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { scanId, job, result, start, cancel, deleteFiles, deleting, reset } =
    useDuplicateScan(path);

  const [recursive, setRecursive] = useState(true);
  const [preset, setPreset] = useState<Preset>("balanced");
  const [groups, setGroups] = useState<CloudDuplicateGroupModel[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [announce, setAnnounce] = useState(""); // polite: found / freed
  const [alert, setAlert] = useState(""); // assertive: failed / cancelled
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [statusAnnounced, setStatusAnnounced] = useState<string | null>(null);

  // Render-time guarded setState (the sanctioned derive-on-change pattern; an
  // effect would cascade-render). Seed the working groups + default selection
  // (keep largest, delete the rest) when a completed result first arrives.
  if (result.data && result.data.ScanId !== seededFor) {
    setSeededFor(result.data.ScanId);
    setGroups(result.data.Groups);
    setSelected(defaultSelectedKeys(result.data.Groups));
    setAnnounce(
      result.data.TotalDuplicateGroups === 0
        ? t("storage.duplicate.emptyTitle")
        : `${result.data.TotalDuplicateGroups} ${t("storage.duplicate.foundSuffix")}`,
    );
  }
  // Announce a failed/cancelled scan assertively (reset the guard once the scan
  // is cleared so a fresh failure re-announces).
  if (!scanId && statusAnnounced !== null) setStatusAnnounced(null);
  if (
    job &&
    (job.status === "failed" || job.status === "cancelled") &&
    statusAnnounced !== job.status
  ) {
    setStatusAnnounced(job.status);
    setAlert(
      job.status === "cancelled"
        ? t("storage.duplicate.cancelledBody")
        : (job.error ?? t("storage.duplicate.failedBody")),
    );
  }

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const count = selectedCount(groups, selected);
  const freed = selectedBytes(groups, selected);
  const totalReclaimable = groups.reduce(
    (sum, g) => sum + g.PotentialSavingsBytes,
    0,
  );

  const onConfirmDelete = async () => {
    const keys = [...selected];
    const freedBytes = selectedBytes(groups, selected);
    const ok = await deleteFiles(keys);
    setConfirmOpen(false);
    if (!ok) return;
    const pruned = pruneGroups(groups, selected);
    setGroups(pruned);
    setSelected(defaultSelectedKeys(pruned));
    setAnnounce(`${t("storage.duplicate.freed")} ${formatBytes(freedBytes)}`);
    toast.success(`${t("storage.duplicate.freed")} ${formatBytes(freedBytes)}`);
  };

  const terminalBad = job?.status === "failed" || job?.status === "cancelled";
  const view = !scanId
    ? "options"
    : terminalBad
      ? "terminal"
      : job?.status !== "complete"
        ? "scanning"
        : result.isPending
          ? "loading"
          : result.isError
            ? "error"
            : groups.length === 0
              ? "empty"
              : "results";

  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (view === "options") {
    body = (
      <div className="space-y-6 py-1">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <Label htmlFor="dup-recursive" className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {t("storage.duplicate.recursive")}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {t("storage.duplicate.recursiveHint")}
            </span>
          </Label>
          <Switch
            id="dup-recursive"
            checked={recursive}
            onCheckedChange={setRecursive}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("storage.duplicate.similarity")}
          </Label>
          <Tabs value={preset} onValueChange={(v) => setPreset(v as Preset)}>
            <TabsList className="w-full">
              <TabsTrigger value="strict">
                {t("storage.duplicate.presetStrict")}
              </TabsTrigger>
              <TabsTrigger value="balanced">
                {t("storage.duplicate.presetBalanced")}
              </TabsTrigger>
              <TabsTrigger value="loose">
                {t("storage.duplicate.presetLoose")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {t("storage.duplicate.similarityHint")}
          </p>
        </div>
      </div>
    );
    footer = (
      <div className="flex justify-end">
        <Button onClick={() => start({ recursive, threshold: PRESETS[preset] })}>
          {t("storage.duplicate.start")}
        </Button>
      </div>
    );
  } else if (view === "terminal") {
    body = (
      <div className="space-y-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {job?.status === "cancelled"
            ? t("storage.duplicate.cancelledBody")
            : (job?.error ?? t("storage.duplicate.failedBody"))}
        </p>
        <Button variant="outline" onClick={reset}>
          {t("storage.duplicate.retry")}
        </Button>
      </div>
    );
  } else if (view === "scanning") {
    const phase = job?.phase ? t(`jobs.phase.${job.phase}`) : "";
    body = (
      <div className="space-y-4 py-8">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Loader2
            className="size-4 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span>{phase || t("storage.duplicate.scanning")}</span>
        </div>
        <Progress
          value={job?.percentage ?? 0}
          aria-label={t("storage.duplicate.scanning")}
        />
      </div>
    );
    footer = (
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void cancel()}>
          {t("storage.duplicate.cancel")}
        </Button>
      </div>
    );
  } else if (view === "loading") {
    body = (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("storage.duplicate.loadingResult")}
      </div>
    );
  } else if (view === "error") {
    body = (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {t("storage.duplicate.resultError")}
        </p>
        <Button variant="outline" onClick={() => void result.refetch()}>
          {t("storage.duplicate.retry")}
        </Button>
      </div>
    );
  } else if (view === "empty") {
    body = (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          {t("storage.duplicate.emptyTitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("storage.duplicate.emptyBody")}
        </p>
      </div>
    );
  } else {
    // ── Results ────────────────────────────────────────────────────────────
    body = (
      <VirtualList
        rows={groups}
        estimateSize={300}
        getRowKey={(g) => g.GroupId}
        ariaLabel={t("storage.duplicate.resultsLabel")}
        className="min-h-0 flex-1 px-6 py-4"
        renderRow={(g) => (
          <div className="pb-4">
            <DuplicateGroupCard group={g} selected={selected} onToggle={toggle} />
          </div>
        )}
      />
    );
    footer = (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {count > 0
            ? `${count} ${t("storage.duplicate.selectedSuffix")} · ${formatBytes(freed)}`
            : t("storage.duplicate.selectHint")}
        </span>
        <Button
          variant="destructive"
          disabled={count === 0 || deleting}
          onClick={() => setConfirmOpen(true)}
        >
          {t("storage.duplicate.deleteSelected")}
        </Button>
      </div>
    );
  }

  const isResults = view === "results";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          {/* Header */}
          <div className="shrink-0 border-b border-border/60 px-6 py-5">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t("storage.duplicate.title")}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {t("storage.duplicate.subtitle")}
            </DialogDescription>
            {isResults && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Stat
                  value={String(groups.length)}
                  label={t("storage.duplicate.statGroups")}
                />
                <Stat
                  value={formatBytes(totalReclaimable)}
                  label={t("storage.duplicate.statReclaimable")}
                />
                <Stat
                  value={String(count)}
                  label={t("storage.duplicate.statToRemove")}
                />
              </div>
            )}
          </div>

          {/* Body — the single scroll region. The scroll element is a direct
              flex child (`flex-1 min-h-0`) so its height is bounded by the flex
              column without relying on percentage-height resolution. */}
          {isResults ? (
            body
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{body}</div>
          )}

          {/* Footer */}
          {footer && (
            <div className="shrink-0 border-t border-border/60 bg-muted/20 px-6 py-4">
              {footer}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live regions are permanently mounted here (the panel is always mounted by
          the controller) — not inside DialogContent, which is torn down on close,
          so the announcement would be missed. Polite for found/freed, assertive
          for failed/cancelled. */}
      <span aria-live="polite" className="sr-only">
        {announce}
      </span>
      {/* aria-live (not role="alert") so this always-mounted region doesn't claim
          the alert role app-wide (it's inside StorageBrowser) — still assertive. */}
      <span aria-live="assertive" className="sr-only">
        {alert}
      </span>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("storage.duplicate.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {`${count} ${t("storage.duplicate.confirmBody")} ${formatBytes(freed)}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("storage.duplicate.confirmCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void onConfirmDelete();
              }}
            >
              {t("storage.duplicate.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

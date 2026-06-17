"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Ban,
  FolderPlus,
  ListChecks,
  Loader2,
  ScanSearch,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn, toneClass, type FileTone } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Progress,
} from "@/components/ui";
import { useJobsStore, type Job, type JobKind, type JobStatus } from "../stores/jobs.store";
import { cancelJob } from "../api/jobs.mutations";

const KIND_META: Record<
  JobKind,
  { icon: LucideIcon; tone: FileTone; labelKey: string; cancellable: boolean }
> = {
  "archive-create": { icon: Archive, tone: "amber", labelKey: "jobs.kind.archiveCreate", cancellable: true },
  "archive-extract": { icon: ArchiveRestore, tone: "amber", labelKey: "jobs.kind.archiveExtract", cancellable: true },
  "duplicate-scan": { icon: ScanSearch, tone: "teal", labelKey: "jobs.kind.duplicateScan", cancellable: true },
  // A single S3 put — no cancel endpoint; show no Cancel control (would be a no-op).
  "folder-create": { icon: FolderPlus, tone: "blue", labelKey: "jobs.kind.folderCreate", cancellable: false },
};

const STATUS_KEY: Record<JobStatus, string> = {
  running: "jobs.status.running",
  complete: "jobs.status.complete",
  failed: "jobs.status.failed",
  cancelled: "jobs.status.cancelled",
};

/** A phase label (duplicate-scan), composed in code since `t()` has no interpolation. */
function phaseLabel(job: Job): string | null {
  if (job.kind !== "duplicate-scan" || !job.phase) return null;
  const key = `jobs.phase.${job.phase}`;
  const label = t(key);
  return label === key ? null : label;
}

/** A running job's secondary line: phase / counts / percent (all composed in code). */
function detailLine(job: Job): string {
  if (job.status !== "running") {
    return job.status === "failed" && job.error
      ? job.error
      : t(STATUS_KEY[job.status]);
  }
  const phase = phaseLabel(job);
  if (
    job.entriesProcessed !== undefined &&
    job.totalEntries !== undefined &&
    job.totalEntries > 0
  ) {
    const counts = `${job.entriesProcessed} / ${job.totalEntries}`;
    return phase ? `${phase} · ${counts}` : counts;
  }
  if (job.percentage > 0) {
    const pct = `${job.percentage}%`;
    return phase ? `${phase} · ${pct}` : pct;
  }
  return phase ?? t(STATUS_KEY.running);
}

function JobRow({
  job,
  onDismiss,
  onCancel,
}: {
  job: Job;
  onDismiss: (id: string) => void;
  onCancel: (job: Job) => void;
}) {
  const meta = KIND_META[job.kind];
  const KindIcon = meta.icon;
  const finished = job.status !== "running";

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
          <KindIcon />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          {job.title || t(meta.labelKey)}
        </span>
        {finished ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative after:absolute after:-inset-1 after:content-['']"
            aria-label={t("jobs.tray.dismiss")}
            onClick={() => onDismiss(job.id)}
          >
            <X />
          </Button>
        ) : meta.cancellable ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative after:absolute after:-inset-1 after:content-['']"
            aria-label={t("jobs.tray.cancel")}
            onClick={() => onCancel(job)}
          >
            <Ban />
          </Button>
        ) : null}
      </div>
      {job.status === "running" ? (
        <Progress value={job.percentage} aria-label={t("jobs.progressLabel")} />
      ) : null}
      <p
        className={cn(
          "truncate text-xs",
          job.status === "failed" ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {detailLine(job)}
      </p>
    </li>
  );
}

/**
 * Topbar background-tasks menu (the discoverable §6.1 indicator — replaces the
 * floating tray). Mirrors the notification bell: an icon that appears whenever a
 * task exists (a spinner + active-count badge while running) and opens a dropdown
 * listing each task's live progress with **Cancel** (running) / dismiss (finished).
 * Driven entirely by `useJobsStore`; the duplicate-scan / archive panels only
 * `track()` a job. The live regions stay mounted (announcements fire even with the
 * menu closed).
 */
export function JobsMenu() {
  const jobs = useJobsStore((s) => s.jobs);
  const remove = useJobsStore((s) => s.remove);
  const list = Object.values(jobs).sort((a, b) => b.createdAt - a.createdAt);
  const activeCount = list.filter((j) => j.status === "running").length;
  const finishedCount = list.length - activeCount;
  const [open, setOpen] = useState(false);

  // Live-region copy, derived on status change (the sanctioned derive-on-change
  // pattern). Polite for completions/cancellations, assertive for failures.
  const [prev, setPrev] = useState<ReadonlyMap<string, JobStatus>>(new Map());
  const [polite, setPolite] = useState("");
  const [alert, setAlert] = useState("");
  const changed =
    list.length !== prev.size || list.some((j) => prev.get(j.id) !== j.status);
  if (changed) {
    for (const job of list) {
      if (prev.get(job.id) === job.status) continue;
      const label = job.title || t(KIND_META[job.kind].labelKey);
      if (job.status === "complete" || job.status === "cancelled") {
        setPolite(`${label} — ${t(STATUS_KEY[job.status])}`);
      } else if (job.status === "failed") {
        setAlert(`${label}: ${job.error ?? t(STATUS_KEY.failed)}`);
      }
    }
    setPrev(new Map(list.map((j) => [j.id, j.status])));
  }

  const handleCancel = (job: Job) => {
    void cancelJob(job).then((ok) => {
      if (ok) useJobsStore.getState().settle(job.id, "cancelled");
    });
  };
  const handleClearFinished = () => useJobsStore.getState().clearFinished();

  const TriggerIcon = activeCount > 0 ? Loader2 : ListChecks;
  const triggerLabel =
    activeCount > 0
      ? `${t("jobs.tray.title")}, ${activeCount} ${t("jobs.tray.activeSuffix")}`
      : t("jobs.tray.title");

  return (
    <>
      {list.length > 0 ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={triggerLabel}
            >
              <TriggerIcon
                className={cn("size-4", activeCount > 0 && "animate-spin")}
              />
              {activeCount > 0 ? (
                <Badge
                  variant="default"
                  className="absolute -top-0.5 -right-0.5 size-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none shadow-[0_0_0_2px_var(--surface)]"
                  aria-hidden
                >
                  {activeCount > 99 ? "99+" : activeCount}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[348px] p-0 zs-overlay-solid">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <h2 className="flex-1 text-sm font-medium text-foreground">
                {t("jobs.tray.title")}
                {activeCount > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {activeCount} {t("jobs.tray.activeSuffix")}
                  </span>
                ) : null}
              </h2>
              {finishedCount > 0 ? (
                <Button variant="ghost" size="sm" onClick={handleClearFinished}>
                  {t("jobs.tray.clearFinished")}
                </Button>
              ) : null}
            </div>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {list.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onDismiss={remove}
                  onCancel={handleCancel}
                />
              ))}
            </ul>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {polite}
      </span>
      <span aria-live="assertive" className="sr-only">
        {alert}
      </span>
    </>
  );
}

"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArchiveRestore, ScanSearch, X, type LucideIcon } from "lucide-react";
import { cn, toneClass, type FileTone } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { toast as toastVariant } from "@/lib/motion";
import { Button, Progress } from "@/components/ui";
import { useJobsStore, type Job, type JobKind, type JobStatus } from "../stores/jobs.store";

const KIND_META: Record<JobKind, { icon: LucideIcon; tone: FileTone; labelKey: string }> = {
  "archive-create": { icon: Archive, tone: "amber", labelKey: "jobs.kind.archiveCreate" },
  "archive-extract": { icon: ArchiveRestore, tone: "amber", labelKey: "jobs.kind.archiveExtract" },
  "duplicate-scan": { icon: ScanSearch, tone: "teal", labelKey: "jobs.kind.duplicateScan" },
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

function JobRow({ job, onDismiss }: { job: Job; onDismiss: (id: string) => void }) {
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
 * Shared background-job tray (the §6.1 indicator). Driven entirely by
 * `useJobsStore`; the duplicate-scan / archive panels (§6.2/§6.3) only `track()`
 * a job and this renders its live progress + terminal state. Bottom-right,
 * survives navigation (mounted in the app layout); stacks below the upload tray
 * (unifying the two is a follow-up when the job-starting panels land). Polite +
 * assertive live regions announce completions / failures.
 */
export function JobIndicator() {
  const jobs = useJobsStore((s) => s.jobs);
  const remove = useJobsStore((s) => s.remove);
  const list = Object.values(jobs).sort((a, b) => b.createdAt - a.createdAt);
  const activeCount = list.filter((j) => j.status === "running").length;

  // Live-region copy, derived on status change (mirrors the upload tray).
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

  // Focus handoff: when a dismissed/cleared button leaves the DOM, move focus to
  // the still-present tray region so it doesn't fall to <body> (mirrors UploadTray).
  const trayRef = useRef<HTMLElement>(null);
  const handleDismiss = (id: string) => {
    const others = list.length > 1;
    remove(id);
    if (others) trayRef.current?.focus();
  };
  const handleClearFinished = () => {
    useJobsStore.getState().clearFinished();
    if (activeCount > 0) trayRef.current?.focus();
  };

  return (
    <>
      <AnimatePresence>
        {list.length > 0 ? (
          <motion.section
            ref={trayRef}
            tabIndex={-1}
            variants={toastVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-label={t("jobs.tray.title")}
            className="glass-overlay fixed bottom-4 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-lg outline-none"
          >
            <header className="flex items-center gap-2 border-b border-border px-3 py-2">
              <h2 className="flex-1 text-sm font-medium text-foreground">
                {t("jobs.tray.title")}
                {activeCount > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {activeCount} {t("jobs.tray.activeSuffix")}
                  </span>
                ) : null}
              </h2>
              {activeCount < list.length ? (
                <Button variant="ghost" size="sm" onClick={handleClearFinished}>
                  {t("jobs.tray.clearFinished")}
                </Button>
              ) : null}
            </header>
            <ul className="max-h-72 divide-y divide-border overflow-y-auto">
              {list.map((job) => (
                <JobRow key={job.id} job={job} onDismiss={handleDismiss} />
              ))}
            </ul>
          </motion.section>
        ) : null}
      </AnimatePresence>
      <span aria-live="polite" className="sr-only">
        {polite}
      </span>
      <span role="alert" className="sr-only">
        {alert}
      </span>
    </>
  );
}

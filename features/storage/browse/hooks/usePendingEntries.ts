"use client";

import { useMemo } from "react";
import { t } from "@/lib/i18n";
import { useJobsStore } from "@/features/jobs";
import { usePendingOpsStore } from "../../operations";
import type { PendingEntry } from "../lib/pending";

/** Job kinds that create entries INTO a folder, so they read as an inline pending
 *  row there. A whole-storage duplicate scan does not. (`folder-create` is added
 *  by the Part C backend job and matches here automatically once it exists.) */
const INLINE_JOB_KINDS = new Set<string>([
  "archive-extract",
  "archive-create",
  "folder-create",
]);

/**
 * The in-flight operations to show as inline pending rows for `path`, merged from
 * two sources rendered identically:
 *  • **optimistic** — fast synchronous creates (`pendingOps`), shown instantly and
 *    reconciled away when the success refetch swaps in the real entry; and
 *  • **durable jobs** — `useJobsStore` running jobs landing entries in this folder
 *    (archive extract/create, later folder-create), which survive a page refresh
 *    via the jobs persist + reconcile machinery.
 */
export function usePendingEntries(path: string): PendingEntry[] {
  const jobs = useJobsStore((s) => s.jobs);
  const ops = usePendingOpsStore((s) => s.ops);

  return useMemo(() => {
    const optimistic: PendingEntry[] = Object.values(ops)
      .filter((o) => o.path === path)
      .map((o) => ({
        id: o.id,
        label: o.name,
        detail:
          o.kind === "create-folder"
            ? t("storage.pending.creatingFolder")
            : t("storage.pending.creatingFile"),
      }));

    const fromJobs: PendingEntry[] = Object.values(jobs)
      .filter(
        (j) =>
          j.status === "running" &&
          j.path === path &&
          INLINE_JOB_KINDS.has(j.kind),
      )
      .map((j) => ({ id: j.id, label: j.title, percentage: j.percentage }));

    return [...optimistic, ...fromJobs];
  }, [ops, jobs, path]);
}

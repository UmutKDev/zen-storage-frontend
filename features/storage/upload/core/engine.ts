import { isApiError, newIdempotencyKey } from "@/lib/api";
import { t } from "@/lib/i18n";
import {
  ABORT_MAX_ATTEMPTS,
  MAX_CONCURRENT_FILES,
  MAX_INFLIGHT_BYTES,
  MAX_PARALLEL_PARTS_PER_FILE,
  PART_RETRY_DELAYS_MS,
  PART_SIZE_BYTES,
} from "@/lib/upload/config";
import { inferContentType } from "@/lib/upload/mime";
import type { ConflictDetailsResponseModel } from "@/service/models";
import { extractConflictDetails } from "../../operations/lib/conflict";
import {
  abortUpload,
  completeUpload,
  createUpload,
  uploadPart,
  type UploadConflictStrategy,
} from "../api";
import { partMd5Base64 } from "../lib/md5";
import { destinationFileKey, partCount, partRange } from "../lib/plan";
import {
  loadEntries,
  persistEntry,
  removeEntry,
  type PersistedUploadEntry,
} from "../storage/queue";
import { useUploadsStore, type UploadItem } from "../stores/uploads.store";

/**
 * The upload queue engine — a module singleton driving the whole pipeline:
 * scheduling (3 files / 4 parts-per-file / 60 MB in-flight, from
 * `lib/upload/config.ts`), per-part retries with backoff, pause (drain) /
 * cancel (abort) / retry, refresh-resume from IndexedDB (degraded, D-P3.3:
 * no `ListParts` — the local `partETags` record is the resume state and
 * missing parts are re-PUT idempotently), batch-scoped conflict resolution
 * (apply-to-all radius = one user action), and zero-byte uploads (one empty
 * part). It writes UI state to `uploads.store`; React reaches it through
 * `useUploadQueue`.
 *
 * Upload-specific conflict rule (D-P3.10): the backend REJECTS `SKIP` on
 * uploads (400), so SKIP resolves client-locally as cancel — never re-sent.
 */

interface RuntimeEntry {
  persisted: PersistedUploadEntry;
  batchId: string;
  controller: AbortController;
  paused: boolean;
  /** True while `runFile` owns this entry — resume-while-draining must not
   *  start a second run (double Complete). */
  running: boolean;
  /** Live bytes of parts currently in flight (partNumber → sent bytes). */
  partProgress: Map<number, number>;
  conflict?: ConflictDetailsResponseModel;
  /** Strategy the user chose for THIS entry's conflict (single resolve). */
  chosenStrategy?: UploadConflictStrategy;
}

export interface EnqueueFile {
  file: File;
  /** Destination folder path ("" = root). */
  path: string;
  /** Overrides the file's own name (folder uploads keep relative paths' leaf). */
  name?: string;
}

/** Polling interval while a part waits for global in-flight byte budget. */
const BUDGET_WAIT_MS = 200;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });

function isAbort(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error &&
      (error.name === "CanceledError" || error.name === "AbortError"))
  );
}

function isTransient(error: unknown): boolean {
  return (
    isApiError(error) &&
    (error.code === "SERVER_ERROR" ||
      error.code === "NETWORK" ||
      error.code === "RATE_LIMITED")
  );
}

function retryDelayMs(error: unknown, attempt: number): number {
  const base =
    PART_RETRY_DELAYS_MS[attempt] ??
    PART_RETRY_DELAYS_MS[PART_RETRY_DELAYS_MS.length - 1];
  if (isApiError(error) && error.code === "RATE_LIMITED" && error.retryAfter) {
    return Math.max(base, error.retryAfter * 1000);
  }
  return base;
}

/** The backend's quota rejections are 400s distinguishable only by copy. */
function isQuotaMessage(error: unknown): boolean {
  return (
    isApiError(error) && error.messages.some((m) => /storage limit/i.test(m))
  );
}

class PausedError extends Error {
  constructor() {
    super("paused");
    this.name = "PausedError";
  }
}

class UploadEngine {
  private entries = new Map<string, RuntimeEntry>();
  private rememberedStrategy = new Map<string, UploadConflictStrategy>();
  private onCompleted: ((path: string) => void) | null = null;
  private inflightBytes = 0;
  private nextId = 0;
  private restoredOwner: string | null = null;

  /** The hook registers cache invalidation here (engine stays query-free). */
  setOnCompleted(callback: ((path: string) => void) | null): void {
    this.onCompleted = callback;
  }

  private store() {
    return useUploadsStore.getState();
  }

  private mintId(): string {
    this.nextId += 1;
    return `u${Date.now().toString(36)}-${this.nextId}`;
  }

  /** Pre-flighted by the caller (`useUploadQueue`); this just enqueues. */
  enqueue(files: ReadonlyArray<EnqueueFile>, ownerId: string): void {
    const batchId = this.mintId();
    for (const { file, path, name } of files) {
      const id = this.mintId();
      const fileName = name ?? file.name;
      const persisted: PersistedUploadEntry = {
        id,
        ownerId,
        file,
        fileName,
        contentType: inferContentType(file),
        totalSize: file.size,
        path,
        key: destinationFileKey(path, fileName),
        uploadId: "",
        partSize: PART_SIZE_BYTES,
        partETags: {},
        idempotencyKey: newIdempotencyKey(),
        status: "queued",
        createdAt: Date.now(),
      };
      this.entries.set(id, {
        persisted,
        batchId,
        controller: new AbortController(),
        paused: false,
        running: false,
        partProgress: new Map(),
      });
      this.store().upsert(this.toItem(id, "queued"));
    }
    this.pump();
  }

  /** Rebuild runtime state from IndexedDB on app load (refresh-resume).
   *  Idempotent per owner — remounts/StrictMode double-effects are no-ops. */
  async restore(ownerId: string): Promise<void> {
    if (this.restoredOwner === ownerId) return;
    this.restoredOwner = ownerId;
    const persisted = await loadEntries(ownerId, Date.now());
    for (const entry of persisted) {
      if (this.entries.has(entry.id)) continue;
      if (entry.status === "abortPending") {
        void this.deliverAbort(entry);
        continue;
      }
      // In-progress / completing entries re-enter the scheduler as queued;
      // parts already in partETags are skipped, Complete reuses its key.
      const errored = entry.status === "error";
      if (!errored) entry.status = "queued";
      this.entries.set(entry.id, {
        persisted: entry,
        batchId: entry.id, // original batch is gone; each resumes alone
        controller: new AbortController(),
        paused: false,
        running: false,
        partProgress: new Map(),
      });
      const uploaded = Object.keys(entry.partETags).length * entry.partSize;
      this.store().upsert({
        ...this.toItem(entry.id, errored ? "error" : "queued"),
        uploadedBytes: Math.min(uploaded, entry.totalSize),
        errorMessage: errored ? t("common.errorGeneric") : undefined,
      });
    }
    this.pump();
  }

  pause(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    const status = entry.persisted.status;
    if (status !== "uploadInProgress" && status !== "queued") return;
    entry.paused = true;
    this.store().patch(id, { status: "paused" });
  }

  resume(id: string): void {
    const entry = this.entries.get(id);
    if (!entry || !entry.paused) return;
    entry.paused = false;
    if (entry.running) {
      // Still draining — the original run picks the flag up and continues.
      this.store().patch(id, { status: "uploading" });
      return;
    }
    // Re-enter the scheduler; runFile skips Create when a session exists.
    entry.persisted.status = "queued";
    this.store().patch(id, { status: "queued" });
    this.pump();
  }

  /** Retry an errored file: re-enters the scheduler; parts already in
   *  `partETags` are skipped; the persisted Complete idempotency key is reused. */
  retry(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    entry.controller = new AbortController();
    entry.paused = false;
    entry.persisted.status = "queued";
    this.store().patch(id, { status: "queued", errorMessage: undefined });
    this.pump();
  }

  cancel(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    entry.controller.abort();
    this.store().patch(id, { status: "canceled" });
    if (entry.persisted.uploadId) {
      entry.persisted.status = "abortPending";
      // Persist FIRST: if the tab dies mid-delivery, the next load's restore()
      // retries the abort instead of resuming a canceled upload.
      void persistEntry(entry.persisted).finally(() => {
        void this.deliverAbort(entry.persisted);
      });
    } else {
      void removeEntry(entry.persisted.id);
    }
    this.entries.delete(id);
    this.pump();
  }

  /** Sign-out teardown: abort everything, clear memory + tray. (IndexedDB
   *  entries remain for the owner's next session — they're owner-scoped.) */
  cancelAll(): void {
    for (const entry of this.entries.values()) entry.controller.abort();
    this.entries.clear();
    this.rememberedStrategy.clear();
    this.inflightBytes = 0;
    this.restoredOwner = null;
    this.store().clear();
  }

  /** Dismiss a finished (done/error/canceled/blocked) row from the tray. */
  dismiss(id: string): void {
    this.entries.delete(id);
    this.store().remove(id);
    void removeEntry(id);
  }

  resolveConflict(
    id: string,
    strategy: UploadConflictStrategy,
    applyToAll: boolean,
  ): void {
    const entry = this.entries.get(id);
    if (!entry) return;

    if (strategy === "SKIP") {
      // Backend rejects SKIP on uploads — client-local cancel (no session yet).
      const targets = applyToAll
        ? [...this.entries].filter(
            ([, e]) => e.batchId === entry.batchId && e.conflict,
          )
        : ([[id, entry]] as const);
      for (const [targetId, target] of targets) {
        target.conflict = undefined;
        this.entries.delete(targetId);
        this.store().patch(targetId, { status: "canceled" });
        void removeEntry(targetId);
      }
      this.pump();
      return;
    }

    if (applyToAll) this.rememberedStrategy.set(entry.batchId, strategy);
    const targets = applyToAll
      ? [...this.entries.values()].filter(
          (e) => e.batchId === entry.batchId && e.conflict,
        )
      : [entry];
    for (const target of targets) {
      target.conflict = undefined;
      target.chosenStrategy = strategy;
      target.persisted.status = "queued";
      this.store().patch(target.persisted.id, { status: "queued" });
    }
    this.pump();
  }

  /** The first conflicted entry, if any — feeds the tray's prompt dialog. */
  firstConflict(): {
    id: string;
    details: ConflictDetailsResponseModel;
    batchSize: number;
  } | null {
    for (const [id, entry] of this.entries) {
      if (entry.conflict) {
        let batchSize = 0;
        for (const other of this.entries.values()) {
          if (other.batchId === entry.batchId) batchSize += 1;
        }
        return { id, details: entry.conflict, batchSize };
      }
    }
    return null;
  }

  private toItem(id: string, status: UploadItem["status"]): UploadItem {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`unknown upload ${id}`);
    const { persisted } = entry;
    return {
      id,
      batchId: entry.batchId,
      fileName: persisted.fileName,
      path: persisted.path,
      totalSize: persisted.totalSize,
      uploadedBytes: 0,
      status,
    };
  }

  /** Scheduler: start queued files while under the file-concurrency cap. */
  private pump(): void {
    let active = 0;
    for (const entry of this.entries.values()) {
      if (entry.running && !entry.paused) active += 1;
    }
    for (const [id, entry] of this.entries) {
      if (active >= MAX_CONCURRENT_FILES) break;
      if (entry.persisted.status !== "queued") continue;
      if (entry.paused || entry.conflict || entry.running) continue;
      active += 1;
      entry.persisted.status = "uploadInProgress";
      void this.runFile(id);
    }
  }

  private async runFile(id: string): Promise<void> {
    const entry = this.entries.get(id);
    if (!entry || entry.running) return;
    const { persisted, controller } = entry;
    entry.running = true;

    try {
      if (!persisted.uploadId) {
        this.store().patch(id, { status: "presigning" });
        const created = await createUpload(
          {
            key: persisted.key,
            contentType: persisted.contentType,
            totalSize: persisted.totalSize,
            strategy:
              entry.chosenStrategy ??
              this.rememberedStrategy.get(entry.batchId),
          },
          controller.signal,
        );
        // The RESOLVED key is authoritative (KEEP_BOTH renames server-side).
        persisted.key = created.Key;
        persisted.uploadId = created.UploadId;
        await persistEntry(persisted);
      }

      this.store().patch(id, { status: "uploading" });
      // Loop until every part has an ETag: a pause→quick-resume can flip the
      // flag between worker drain and the check, leaving pending parts.
      const total = partCount(persisted.totalSize, persisted.partSize);
      while (Object.keys(persisted.partETags).length < total) {
        await this.uploadParts(entry);
        if (entry.paused) return; // drained into paused; resume re-enters
      }

      persisted.status = "completing";
      await persistEntry(persisted);
      this.store().patch(id, { status: "completing" });
      await completeUpload(
        {
          key: persisted.key,
          uploadId: persisted.uploadId,
          parts: Object.entries(persisted.partETags)
            .map(([n, etag]) => ({ PartNumber: Number(n), ETag: etag }))
            .sort((a, b) => a.PartNumber - b.PartNumber),
          idempotencyKey: persisted.idempotencyKey,
        },
        controller.signal,
      );

      await removeEntry(persisted.id);
      this.store().patch(id, {
        status: "done",
        uploadedBytes: persisted.totalSize,
      });
      this.entries.delete(id);
      this.onCompleted?.(persisted.path);
    } catch (error) {
      this.handleFileError(id, error);
    } finally {
      entry.running = false;
      this.pump();
    }
  }

  /** Worker pool over the file's pending parts: ≤4 workers, each claims the
   *  next part, waits for global byte budget, uploads with retries. Failures
   *  are captured (never unhandled) and the first one is rethrown. */
  private async uploadParts(entry: RuntimeEntry): Promise<void> {
    const { persisted, controller } = entry;
    const total = partCount(persisted.totalSize, persisted.partSize);
    const claimed = new Set<number>();
    let failure: unknown = null;

    const claimNext = (): number | undefined => {
      for (let n = 1; n <= total; n += 1) {
        if (!persisted.partETags[n] && !claimed.has(n)) {
          claimed.add(n);
          return n;
        }
      }
      return undefined;
    };

    const worker = async (): Promise<void> => {
      while (
        failure === null &&
        !entry.paused &&
        !controller.signal.aborted
      ) {
        const partNumber = claimNext();
        if (partNumber === undefined) return;
        const { start, end } = partRange(persisted.totalSize, partNumber, persisted.partSize);
        const size = end - start;
        try {
          // Byte budget WINS over chunk-count caps (§6.1) — but never starves:
          // a part always proceeds when nothing else is in flight globally.
          while (
            this.inflightBytes > 0 &&
            this.inflightBytes + size > MAX_INFLIGHT_BYTES
          ) {
            await sleep(BUDGET_WAIT_MS, controller.signal);
            if (failure !== null || entry.paused) {
              claimed.delete(partNumber);
              return;
            }
          }
          this.inflightBytes += size;
          try {
            await this.uploadOnePart(entry, partNumber, start, end);
          } finally {
            this.inflightBytes -= size;
          }
        } catch (error) {
          claimed.delete(partNumber);
          if (failure === null) failure = error;
          return;
        }
      }
    };

    await Promise.all(
      Array.from({ length: MAX_PARALLEL_PARTS_PER_FILE }, () => worker()),
    );
    if (failure !== null) throw failure;
  }

  private async uploadOnePart(
    entry: RuntimeEntry,
    partNumber: number,
    start: number,
    end: number,
  ): Promise<void> {
    const { persisted, controller } = entry;
    const blob = persisted.file.slice(start, end);

    for (let attempt = 0; ; attempt += 1) {
      try {
        const md5 = await partMd5Base64(blob);
        const result = await uploadPart(
          {
            key: persisted.key,
            uploadId: persisted.uploadId,
            partNumber,
            part: blob,
            contentMd5: md5,
          },
          {
            signal: controller.signal,
            onProgress: (event) => {
              entry.partProgress.set(partNumber, event.loaded ?? 0);
              this.reportProgress(entry);
            },
          },
        );
        // §6.4: persist the ETag IMMEDIATELY — not batched, not deferred.
        persisted.partETags[partNumber] = result.ETag;
        entry.partProgress.delete(partNumber);
        await persistEntry(persisted);
        this.reportProgress(entry);
        return;
      } catch (error) {
        entry.partProgress.delete(partNumber);
        this.reportProgress(entry);
        if (isAbort(error) || controller.signal.aborted) throw error;
        if (entry.paused) throw new PausedError();
        if (!isTransient(error) || attempt >= PART_RETRY_DELAYS_MS.length - 1) {
          throw error;
        }
        await sleep(retryDelayMs(error, attempt), controller.signal);
      }
    }
  }

  private reportProgress(entry: RuntimeEntry): void {
    const { persisted } = entry;
    const settled = Object.keys(persisted.partETags).reduce((sum, n) => {
      const { start, end } = partRange(persisted.totalSize, Number(n), persisted.partSize);
      return sum + (end - start);
    }, 0);
    let live = 0;
    for (const bytes of entry.partProgress.values()) live += bytes;
    this.store().patch(persisted.id, {
      uploadedBytes: Math.min(settled + live, persisted.totalSize),
    });
  }

  private handleFileError(id: string, error: unknown): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    if (error instanceof PausedError) {
      // Drained into the paused state; resume() re-enters the scheduler.
      return;
    }
    if (isAbort(error) || entry.controller.signal.aborted) return; // canceled

    const conflict = extractConflictDetails(error);
    if (conflict) {
      entry.persisted.status = "queued";
      if (this.rememberedStrategy.has(entry.batchId)) {
        // Auto-resolve with the batch's remembered choice on the next pump.
        this.store().patch(id, { status: "queued" });
      } else {
        entry.conflict = conflict;
        this.store().patch(id, { status: "conflict" });
      }
      return;
    }

    entry.persisted.status = "error";
    void persistEntry(entry.persisted);
    const message =
      isApiError(error) && error.messages[0]
        ? error.messages[0]
        : t("common.errorGeneric");
    this.store().patch(id, { status: "error", errorMessage: message });
    // Stop spending bandwidth on this file's remaining in-flight parts.
    entry.controller.abort();

    // Quota crossed mid-batch: halt this batch's remaining queued files too.
    if (isQuotaMessage(error)) {
      for (const [otherId, other] of this.entries) {
        if (
          other.batchId === entry.batchId &&
          other.persisted.status === "queued" &&
          !other.conflict
        ) {
          other.persisted.status = "error";
          this.store().patch(otherId, {
            status: "blocked",
            errorMessage: t("storage.upload.errors.quotaBatch"),
          });
        }
      }
    }
  }

  /** Fire the server-side Abort with a small retry budget. S3 `NoSuchUpload`
   *  surfaces as a generic 500 here (no error mapping in the backend), so any
   *  outcome after the budget is treated as terminal and the entry dropped —
   *  the backend's orphan sweep owns whatever escapes (§6.3, degraded). */
  private async deliverAbort(persisted: PersistedUploadEntry): Promise<void> {
    for (let attempt = 0; attempt < ABORT_MAX_ATTEMPTS; attempt += 1) {
      try {
        await abortUpload({ key: persisted.key, uploadId: persisted.uploadId });
        break;
      } catch {
        // swallow — repeat up to the budget, then give up
      }
    }
    await removeEntry(persisted.id);
  }
}

export const uploadEngine = new UploadEngine();

"use client";

import { create } from "zustand";

/** A fast (synchronous) list operation, shown as an instant optimistic row until
 *  its mutation settles and the real entry arrives via invalidation. Long-running
 *  durable ops use the jobs system instead (rendered the same way, but survive a
 *  refresh). */
export interface PendingOp {
  /** Stable id — also the pending row key. */
  id: string;
  /** Folder the row belongs to (matches the browser's `path`). */
  path: string;
  /** Display name of the item being created. */
  name: string;
  kind: "create-folder" | "create-file";
}

interface PendingOpsState {
  /** New rows (optimistic creates), keyed by op id. */
  ops: Record<string, PendingOp>;
  /** Existing rows being transformed in place (move/rename), keyed by entry key. */
  busyKeys: Record<string, true>;
  add: (op: PendingOp) => void;
  remove: (id: string) => void;
  /** Mark entries busy (a dimmed in-place spinner) while a move/rename is in flight. */
  setBusy: (keys: readonly string[]) => void;
  clearBusy: (keys: readonly string[]) => void;
}

/**
 * Feature-local, in-memory (NOT persisted) registry of in-flight fast list
 * operations — drives the instant optimistic pending row (`ops`) and the in-place
 * busy treatment for move/rename (`busyKeys`). Sub-second ops don't need
 * refresh-durability (the post-refresh refetch is ground truth); durable ops use
 * `useJobsStore`. Mirrors the uploads/selection feature-local stores.
 */
export const usePendingOpsStore = create<PendingOpsState>((set) => ({
  ops: {},
  busyKeys: {},
  add: (op) => set((state) => ({ ops: { ...state.ops, [op.id]: op } })),
  remove: (id) =>
    set((state) => {
      if (!state.ops[id]) return state;
      const next = { ...state.ops };
      delete next[id];
      return { ops: next };
    }),
  setBusy: (keys) =>
    set((state) => {
      const next = { ...state.busyKeys };
      for (const k of keys) next[k] = true;
      return { busyKeys: next };
    }),
  clearBusy: (keys) =>
    set((state) => {
      const next = { ...state.busyKeys };
      for (const k of keys) delete next[k];
      return { busyKeys: next };
    }),
}));

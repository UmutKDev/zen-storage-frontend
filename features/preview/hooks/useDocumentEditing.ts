"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateScope, isApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores";
import { discardDraft, saveDraft, updateDocument } from "../api";

/** Draft auto-save is throttled to ≤1 per 10s (backend rate-limits faster). */
const DRAFT_THROTTLE_MS = 10_000;

/**
 * Editing actions for an open document: throttled draft auto-save, an explicit
 * commit (optimistic-concurrency via the tracked base `ContentHash`), and
 * discard. A `409` on commit surfaces a `conflict` flag (the editor shows a
 * reload banner) and keeps the user's text as a draft so nothing is lost. A
 * successful commit invalidates the owner scope (object/folder/usage refresh).
 */
export function useDocumentEditing(key: string, initialHash: string) {
  const qc = useQueryClient();
  const ownerId = useWorkspaceStore((s) => s.ownerId);

  const baseHashRef = useRef(initialHash);
  const lastDraftAtRef = useRef(0);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDraftRef = useRef<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const flushDraft = useCallback(() => {
    const content = pendingDraftRef.current;
    pendingDraftRef.current = null;
    draftTimerRef.current = null;
    if (content == null) return;
    lastDraftAtRef.current = Date.now();
    void saveDraft(key, content).catch(() => undefined); // throttle/transient: suppressed
  }, [key]);

  /** Queue a throttled draft save (trailing-edge flush of the latest content). */
  const queueDraft = useCallback(
    (content: string) => {
      pendingDraftRef.current = content;
      if (draftTimerRef.current) return;
      const wait = Math.max(
        0,
        DRAFT_THROTTLE_MS - (Date.now() - lastDraftAtRef.current),
      );
      draftTimerRef.current = setTimeout(flushDraft, wait);
    },
    [flushDraft],
  );

  /** Best-effort immediate draft (tab close / visibility hidden). */
  const flushDraftNow = useCallback(
    (content: string) => {
      pendingDraftRef.current = null;
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
      lastDraftAtRef.current = Date.now();
      void saveDraft(key, content).catch(() => undefined);
    },
    [key],
  );

  /** Commit content; resolves `true` on success, `false` on conflict/failure. */
  const commit = useCallback(
    async (content: string): Promise<boolean> => {
      if (!ownerId) return false;
      setSaving(true);
      setConflict(false);
      try {
        const res = await updateDocument({
          Key: key,
          Content: content,
          ExpectedContentHash: baseHashRef.current,
        });
        baseHashRef.current = res.ContentHash;
        setSavedAt(res.LastModified);
        void discardDraft(key).catch(() => undefined);
        void invalidateScope(qc, ownerId);
        toast.success(t("preview.editor.saved"));
        return true;
      } catch (error) {
        // 409 = changed elsewhere → reload banner; keep the user's text as a draft.
        if (isApiError(error) && error.code === "CONFLICT") {
          setConflict(true);
          void saveDraft(key, content).catch(() => undefined);
        }
        // Other failures toast centrally (updateDocument doesn't suppress).
        return false;
      } finally {
        setSaving(false);
      }
    },
    [key, ownerId, qc],
  );

  const discard = useCallback(async () => {
    pendingDraftRef.current = null;
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
    await discardDraft(key).catch(() => undefined);
  }, [key]);

  /** After a 409 reload: adopt the freshly-fetched hash + clear the conflict. */
  const resetBase = useCallback((hash: string) => {
    baseHashRef.current = hash;
    setConflict(false);
  }, []);

  // Clear any pending draft timer on unmount.
  useEffect(
    () => () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    },
    [],
  );

  return {
    saving,
    savedAt,
    conflict,
    queueDraft,
    flushDraftNow,
    commit,
    discard,
    resetBase,
  };
}

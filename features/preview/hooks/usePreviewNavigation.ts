"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { previewHref } from "@/lib/preview";
import { usePreviewNavStore } from "@/features/storage";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
}

/**
 * ←/→ navigation across the previewable files of the current folder view. Reads
 * the ordered key list published by `StorageBrowser` (storage → neutral store).
 * Uses `router.replace` (not push) so Back closes the modal instead of walking
 * back through every previewed file. On a cold deep-link the list is empty →
 * both directions disabled.
 */
export function usePreviewNavigation(currentKey: string) {
  const router = useRouter();
  const keys = usePreviewNavStore((s) => s.keys);

  const index = keys.indexOf(currentKey);
  const prevKey = index > 0 ? keys[index - 1] : null;
  const nextKey = index >= 0 && index < keys.length - 1 ? keys[index + 1] : null;

  const goTo = useCallback(
    (key: string | null) => {
      if (key) router.replace(previewHref(key));
    },
    [router],
  );
  const goPrev = useCallback(() => goTo(prevKey), [goTo, prevKey]);
  const goNext = useCallback(() => goTo(nextKey), [goTo, nextKey]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditableTarget(e.target)) return;
      if (e.key === "ArrowLeft" && prevKey) {
        e.preventDefault();
        goTo(prevKey);
      } else if (e.key === "ArrowRight" && nextKey) {
        e.preventDefault();
        goTo(nextKey);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevKey, nextKey, goTo]);

  return { hasPrev: Boolean(prevKey), hasNext: Boolean(nextKey), goPrev, goNext };
}

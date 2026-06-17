"use client";

import { useEffect, useState } from "react";
import { isApiError } from "@/lib/api";
import { DocumentLockResponseModelLockStatusEnum } from "@/service/models";
import { acquireLock, extendLock, releaseLock } from "../api";

/** TTL is 5 min; refresh well inside it. */
const HEARTBEAT_MS = 180_000;
const LOCK_HELD_HTTP = 423;

export type LockState =
  | "acquiring"
  | "mine"
  | "other"
  | "lost"
  | "unavailable";

/**
 * Pessimistic edit lock lifecycle: acquire on enable, heartbeat every ~3 min,
 * release on unmount. `423` (held by another) → `"other"` (read-only). All
 * setState happens in async callbacks (not synchronously in the effect), so the
 * React-Compiler `set-state-in-effect` rule is satisfied; the state is seeded
 * via the initializer and the editor mounts the hook once per file.
 */
export function useDocumentLock(key: string, enabled: boolean) {
  const [lockState, setLockState] = useState<LockState>(() =>
    enabled ? "acquiring" : "unavailable",
  );
  const [lockedByName, setLockedByName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !key) return;
    let cancelled = false;

    acquireLock(key)
      .then((lock) => {
        if (cancelled) return;
        if (lock.LockStatus === DocumentLockResponseModelLockStatusEnum.LockedByOther) {
          setLockState("other");
          setLockedByName(lock.LockedByName);
        } else {
          setLockState("mine");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setLockState(
          isApiError(error) && error.httpStatus === LOCK_HELD_HTTP
            ? "other"
            : "unavailable",
        );
      });

    const interval = setInterval(() => {
      extendLock(key).catch((error) => {
        // Lost the lock we held (TTL lapsed / taken over) → read-only, distinct
        // from "locked by another on open" (no LockedByName on the extend path).
        if (isApiError(error) && error.httpStatus === LOCK_HELD_HTTP) {
          setLockState("lost");
          clearInterval(interval);
        }
      });
    }, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      void releaseLock(key).catch(() => undefined);
    };
  }, [key, enabled]);

  return { lockState, lockedByName, canEdit: lockState === "mine" };
}

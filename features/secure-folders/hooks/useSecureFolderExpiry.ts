"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import {
  resolveTokenEntry,
  useSecureFoldersStore,
} from "../stores/secureFolders.store";
import { useSecureFolderUiStore } from "../stores/secureFolderUi.store";

/** `setTimeout`'s delay is a signed 32-bit int; a value past ~24.8 days overflows
 *  and fires immediately. Secure-folder TTLs are minutes, so this clamp never
 *  trips in practice — it just stops a pathological far-future `ExpiresAt` from
 *  scheduling an instant (wrong) re-lock. */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** ms from now until `expiresAtSeconds` (epoch seconds), floored at 0 — an
 *  already-expired token re-locks immediately — and capped at the 32-bit max. */
function delayUntil(expiresAtSeconds: number): number {
  return Math.min(
    Math.max(expiresAtSeconds * 1000 - Date.now(), 0),
    MAX_TIMEOUT_MS,
  );
}

/**
 * While viewing `path`, watch the nearest covering secure-folder session token in
 * each namespace and act the instant it expires — decrypted/revealed content must
 * not linger past its TTL:
 *   • ENCRYPTED → drop the token (the directory/object listings lose the header,
 *     refetch, and 403 into the locked state) **and** re-open the unlock prompt,
 *     so a user sitting inside an encrypted folder is asked for the passphrase
 *     again. This is the same `open(...)` call the locked state's Unlock button
 *     makes — `useUnlock` keys the fresh token by the API's returned root, so
 *     prompting with a descendant path still resolves correctly.
 *   • HIDDEN    → drop the token so the revealed children silently re-hide. No
 *     prompt: revealing surfaces hidden siblings in a parent listing, it isn't an
 *     "inside the folder" session, so quietly re-hiding is the correct outcome.
 *
 * Clearing the token is a store mutation, so the query-key token fold updates and
 * TanStack drives the refetch — the same path the manual lock/conceal flow takes.
 * Re-unlocking mints a fresh token (later `ExpiresAt`); the effect reschedules.
 * Background tabs throttle timers, so the listing poll + window-focus refetch
 * backstop the away case. Resolving ignores expiry here (no clock in render —
 * pure); the real expiry decision is the `Date.now()` read at fire time.
 */
export function useSecureFolderExpiry(path: string): void {
  const tokens = useSecureFoldersStore((s) => s.tokens);
  const encrypted = resolveTokenEntry(tokens.encrypted, path);
  const hidden = resolveTokenEntry(tokens.hidden, path);
  // Depend on primitives, not the per-render entry object, so the effects only
  // reschedule when the covering token (or its expiry) actually changes.
  const encKey = encrypted?.key ?? null;
  const encExpiresAt = encrypted?.expiresAt ?? null;
  const hiddenKey = hidden?.key ?? null;
  const hiddenExpiresAt = hidden?.expiresAt ?? null;

  // Encrypted: re-lock + re-prompt for the current path.
  useEffect(() => {
    if (encKey === null || encExpiresAt === null) return;
    const id = setTimeout(() => {
      useSecureFoldersStore.getState().clearToken("encrypted", encKey);
      useSecureFolderUiStore
        .getState()
        .open({ kind: "unlock", path, mode: "folder" });
    }, delayUntil(encExpiresAt));
    return () => clearTimeout(id);
  }, [encKey, encExpiresAt, path]);

  // Hidden: re-hide. No prompt, but a polite toast (announced via the Toaster's
  // live region) tells the user why the revealed items just vanished — otherwise
  // the content change is silent for sighted and screen-reader users alike.
  useEffect(() => {
    if (hiddenKey === null || hiddenExpiresAt === null) return;
    const id = setTimeout(() => {
      useSecureFoldersStore.getState().clearToken("hidden", hiddenKey);
      toast(t("storage.ops.secure.expired.hidden"));
    }, delayUntil(hiddenExpiresAt));
    return () => clearTimeout(id);
  }, [hiddenKey, hiddenExpiresAt]);
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import {
  useConceal,
  useDecrypt,
  useEncrypt,
  useHide,
  useLock,
  useReveal,
  useSecureFolderUiStore,
  useUnhide,
  useUnlock,
} from "@/features/secure-folders";
import { UnlockDialog } from "./UnlockDialog";
import { PassphraseDialog } from "./PassphraseDialog";

/**
 * Single controller for the secure-folder dialogs, mounted once in the storage
 * surface. Reads the `secureFolderUi` action (set by a locked-row click, the
 * action menu, or the ⇧⇧ reveal gesture) and renders the matching dialog wired
 * to the secure-folder hooks — keeping the browse/menu components presentational
 * (they just call `open(...)`). `lock`/`conceal` take no input: they fire once
 * and close.
 */
export function SecureFolderDialogs() {
  const action = useSecureFolderUiStore((s) => s.action);
  const close = useSecureFolderUiStore((s) => s.close);
  const router = useRouter();
  const unlock = useUnlock();
  const reveal = useReveal();
  const encrypt = useEncrypt();
  const decrypt = useDecrypt();
  const hide = useHide();
  const unhide = useUnhide();
  const lock = useLock();
  const conceal = useConceal();

  // No-input actions (lock / conceal) fire once per request — the ref guards
  // React strict-mode's double-invoke — then close. State changes only on success.
  const firedRef = useRef<string | null>(null);
  useEffect(() => {
    if (action && (action.kind === "lock" || action.kind === "conceal")) {
      const fireKey = `${action.kind}:${action.path}`;
      if (firedRef.current !== fireKey) {
        firedRef.current = fireKey;
        (action.kind === "lock" ? lock : conceal).submit(action.path);
        close();
      }
    } else if (!action) {
      firedRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  if (!action || action.kind === "lock" || action.kind === "conceal") {
    return null;
  }

  // Password gate — encrypted unlock (navigates in) or hidden reveal (no nav).
  if (action.kind === "unlock" || action.kind === "reveal") {
    const isReveal = action.kind === "reveal";
    const hook = isReveal ? reveal : unlock;
    return (
      <UnlockDialog
        open
        onOpenChange={(o) => {
          if (!o) {
            hook.reset();
            close();
          }
        }}
        mode={isReveal ? "hidden" : (action.mode ?? "folder")}
        pending={hook.isPending}
        error={hook.error}
        onSubmit={async (passphrase) => {
          const ok = await hook.submit(action.path, passphrase);
          if (ok) {
            close();
            if (!isReveal && action.navigateTo) router.push(action.navigateTo);
          }
        }}
      />
    );
  }

  // Passphrase entry — encrypt / decrypt / hide / unhide.
  const ns = action.kind; // "encrypt" | "decrypt" | "hide" | "unhide"
  const hook = { encrypt, decrypt, hide, unhide }[ns];
  return (
    <PassphraseDialog
      open
      onOpenChange={(o) => {
        if (!o) {
          hook.reset();
          close();
        }
      }}
      title={t(`storage.ops.secure.${ns}.title`)}
      subtitle={t(`storage.ops.secure.${ns}.subtitle`)}
      submitLabel={t(`storage.ops.secure.${ns}.submit`)}
      pending={hook.isPending}
      error={hook.error}
      onSubmit={async (passphrase) => {
        const ok = await hook.submit(action.path, passphrase);
        if (ok) {
          toast.success(t(`storage.ops.secure.${ns}.done`));
          close();
        }
      }}
    />
  );
}

"use client";

import { useMutation } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

/**
 * Shared shape for the passphrase-gated secure-folder mutations (unlock / encrypt
 * / decrypt). `submit` resolves `true`/`false` so a dialog can decide whether to
 * close; `error` is the message to render inline — a `403 FORBIDDEN` (wrong
 * passphrase) maps to `wrongPassphraseMessage`, anything else to
 * `genericMessage`. The wrappers pass `suppressErrorToast`, so the dialog is the
 * sole error surface (no double toast).
 */
export function usePassphraseMutation<T>(opts: {
  run: (path: string, passphrase: string) => Promise<T>;
  onDone?: (result: T, path: string) => void;
  wrongPassphraseMessage?: string;
  genericMessage?: string;
}) {
  const mutation = useMutation({
    mutationFn: (vars: { path: string; passphrase: string }) =>
      opts.run(vars.path, vars.passphrase),
    onSuccess: (result, vars) => opts.onDone?.(result, vars.path),
  });

  const forbidden =
    mutation.isError &&
    isApiError(mutation.error) &&
    mutation.error.code === "FORBIDDEN";
  const error = !mutation.isError
    ? null
    : forbidden && opts.wrongPassphraseMessage
      ? opts.wrongPassphraseMessage
      : (opts.genericMessage ?? null);

  return {
    submit: async (path: string, passphrase: string): Promise<boolean> => {
      try {
        await mutation.mutateAsync({ path, passphrase });
        return true;
      } catch {
        return false;
      }
    },
    isPending: mutation.isPending,
    error,
    reset: mutation.reset,
  };
}

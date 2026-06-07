"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
} from "@simplewebauthn/browser";
import { invalidateKey, isApiError, type ApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { PasskeyViewModel } from "@/service/models";
import {
  deletePasskey,
  getPasskeys,
  passkeyRegisterBegin,
  passkeyRegisterFinish,
} from "../api";
import { accountKeys } from "../lib/account-keys";

export function usePasskeys() {
  return useQuery({
    queryKey: accountKeys.passkeys(),
    queryFn: getPasskeys,
  });
}

/** True when the user aborted the WebAuthn ceremony (not a real failure). */
function isWebAuthnCancel(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "NotAllowedError" || error.name === "AbortError")
  );
}

/**
 * Full passkey-registration ceremony: begin → `startRegistration` → finish.
 * Server errors are toasted centrally by the Instance; client WebAuthn errors
 * (other than user-cancel) are toasted here; cancellation is silent.
 */
export function useRegisterPasskey() {
  const qc = useQueryClient();
  return useMutation<PasskeyViewModel, unknown, string>({
    mutationFn: async (deviceName: string) => {
      const begin = await passkeyRegisterBegin(deviceName);
      const credential = await startRegistration({
        optionsJSON:
          begin.Options as unknown as PublicKeyCredentialCreationOptionsJSON,
      });
      return passkeyRegisterFinish(deviceName, credential);
    },
    onSuccess: () => {
      toast.success(t("account.security.passkeys.registered"));
      void invalidateKey(qc, accountKeys.passkeys());
      void invalidateKey(qc, accountKeys.twoFactorStatus());
    },
    onError: (error) => {
      if (isWebAuthnCancel(error)) return; // user cancelled — silent
      if (!isApiError(error)) toast.error(t("account.errors.generic"));
      // ApiError instances are already toasted by the Instance interceptor.
    },
  });
}

export function useDeletePasskey() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deletePasskey,
    onSuccess: () => {
      toast.success(t("account.security.passkeys.deleted"));
      void invalidateKey(qc, accountKeys.passkeys());
      void invalidateKey(qc, accountKeys.twoFactorStatus());
    },
  });
}

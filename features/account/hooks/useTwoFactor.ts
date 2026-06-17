"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateKey, type ApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import type {
  TwoFactorBackupCodesResponseModel,
  TwoFactorSetupResponseModel,
} from "@/service/models";
import {
  getTwoFactorStatus,
  regenerateBackupCodes,
  twoFactorDisable,
  twoFactorSetup,
  twoFactorVerify,
} from "../api";
import { accountKeys } from "../lib/account-keys";

export function use2FAStatus() {
  return useQuery({
    queryKey: accountKeys.twoFactorStatus(),
    queryFn: getTwoFactorStatus,
  });
}

/** Begin enrollment — returns the secret + otpauth URL for the QR code. */
export function use2FASetup() {
  return useMutation<TwoFactorSetupResponseModel, ApiError, void>({
    mutationFn: twoFactorSetup,
  });
}

/** Verify the first code to enable 2FA — returns one-time backup codes. */
export function use2FAVerify() {
  const qc = useQueryClient();
  return useMutation<TwoFactorBackupCodesResponseModel, ApiError, string>({
    mutationFn: twoFactorVerify,
    onSuccess: () => {
      toast.success(t("account.security.twoFactor.enabled"));
      void invalidateKey(qc, accountKeys.twoFactorStatus());
    },
  });
}

export function use2FADisable() {
  const qc = useQueryClient();
  return useMutation<boolean, ApiError, string>({
    mutationFn: twoFactorDisable,
    onSuccess: () => {
      toast.success(t("account.security.twoFactor.disabled"));
      void invalidateKey(qc, accountKeys.twoFactorStatus());
    },
  });
}

/** Regenerate backup codes (code-gated) — returns new one-time codes. */
export function useRegenerateBackupCodes() {
  const qc = useQueryClient();
  return useMutation<TwoFactorBackupCodesResponseModel, ApiError, string>({
    mutationFn: regenerateBackupCodes,
    onSuccess: () => {
      toast.success(t("account.security.twoFactor.regenerated"));
      void invalidateKey(qc, accountKeys.twoFactorStatus());
    },
  });
}

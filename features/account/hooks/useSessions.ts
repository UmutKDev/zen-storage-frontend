"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateKey, type ApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import { signOutAndCleanup } from "@/features/auth";
import { getSessions, logoutAll, logoutOthers, revokeSession } from "../api";
import { accountKeys } from "../lib/account-keys";

export function useSessions() {
  return useQuery({
    queryKey: accountKeys.sessions(),
    queryFn: getSessions,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: revokeSession,
    onSuccess: () => {
      toast.success(t("account.security.sessions.revoked"));
      void invalidateKey(qc, accountKeys.sessions());
    },
  });
}

export function useLogoutOthers() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: logoutOthers,
    onSuccess: () => {
      toast.success(t("account.security.sessions.revoked"));
      void invalidateKey(qc, accountKeys.sessions());
    },
  });
}

/**
 * Signs out **everywhere, including this device** — so on success we run the
 * full client teardown (which also hard-redirects to /login).
 */
export function useLogoutAll() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: logoutAll,
    onSuccess: () => {
      void signOutAndCleanup(qc);
    },
  });
}

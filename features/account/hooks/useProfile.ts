"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateKey, type ApiError } from "@/lib/api";
import { t } from "@/lib/i18n";
import type {
  AccountChangePasswordRequestModel,
  AccountProfileResponseModel,
  AccountPutBodyRequestModel,
} from "@/service/models";
import { changePassword, editProfile, getProfile } from "../api";
import { accountKeys } from "../lib/account-keys";

/** Canonical signed-in profile (source of truth for the shell + profile screen). */
export function useProfile() {
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: getProfile,
  });
}

/** Optimistic profile edit with rollback. `edit` returns only a boolean, so the
 *  optimistic cache value is the display source until `onSettled` reconciles. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<
    boolean,
    ApiError,
    AccountPutBodyRequestModel,
    { prev?: AccountProfileResponseModel }
  >({
    mutationFn: editProfile,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: accountKeys.profile() });
      const prev = qc.getQueryData<AccountProfileResponseModel>(
        accountKeys.profile(),
      );
      if (prev) {
        qc.setQueryData<AccountProfileResponseModel>(accountKeys.profile(), {
          ...prev,
          FullName: vars.FullName,
          PhoneNumber: vars.PhoneNumber,
        });
      }
      return { prev };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(accountKeys.profile(), ctx.prev);
    },
    onSuccess: () => {
      toast.success(t("account.profile.saved"));
    },
    onSettled: () => {
      void invalidateKey(qc, accountKeys.profile());
    },
  });
}

export function useChangePassword() {
  return useMutation<boolean, ApiError, AccountChangePasswordRequestModel>({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success(t("account.security.password.changed"));
    },
  });
}

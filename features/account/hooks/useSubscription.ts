"use client";

import { useQuery } from "@tanstack/react-query";
import { getMySubscription } from "../api";
import { accountKeys } from "../lib/account-keys";

export function useSubscription() {
  return useQuery({
    queryKey: accountKeys.subscription(),
    queryFn: getMySubscription,
  });
}

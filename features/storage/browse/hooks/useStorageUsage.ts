"use client";

import { useQuery } from "@tanstack/react-query";
import { useOwnerId } from "../../lib/useOwnerId";
import { getStorageUsage, storageKeys } from "../api";

/** Account storage usage for the usage bar. */
export function useStorageUsage() {
  const ownerId = useOwnerId();
  return useQuery({
    queryKey: storageKeys.usage(ownerId ?? "anon"),
    queryFn: ({ signal }) => getStorageUsage(signal),
    enabled: Boolean(ownerId),
  });
}

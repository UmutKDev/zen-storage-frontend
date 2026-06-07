"use client";

import { useQuery } from "@tanstack/react-query";
import { useOwnerId } from "../../lib/useOwnerId";
import { getObjects, storageKeys } from "../api";

/** File objects for a folder (single call, no pagination). */
export function useObjects(path: string) {
  const ownerId = useOwnerId();
  return useQuery({
    queryKey: storageKeys.objects(ownerId ?? "anon", path),
    queryFn: ({ signal }) => getObjects(path, signal),
    enabled: Boolean(ownerId),
  });
}

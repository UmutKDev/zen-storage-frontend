"use client";

import { useQuery } from "@tanstack/react-query";
import { useOwnerId } from "../../lib/useOwnerId";
import { getDirectories, storageKeys } from "../api";

/** Directories for a folder (single call, no pagination). `enabled` lets the
 *  closed move-picker skip the fetch. */
export function useDirectories(path: string, enabled = true) {
  const ownerId = useOwnerId();
  return useQuery({
    queryKey: storageKeys.directories(ownerId ?? "anon", path),
    queryFn: ({ signal }) => getDirectories(path, signal),
    enabled: enabled && Boolean(ownerId),
  });
}

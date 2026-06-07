"use client";

import { useWorkspaceStore } from "@/stores";

/**
 * The current workspace storage-owner id (`user.Id` in Personal, the team id in
 * a team workspace). Wired from the session in `SessionSync`. Storage queries
 * key on this and guard with `enabled: Boolean(ownerId)` so they don't fire
 * before the session is ready.
 */
export function useOwnerId(): string | null {
  return useWorkspaceStore((state) => state.ownerId);
}

import { create } from "zustand";

/**
 * The only workspace-scope source of truth. `ownerId` is the storage owner
 * (`user.Id` in Personal, the team id in a team workspace) and drives BOTH the
 * `X-Team-Id` header (via the token-source seam) and every query-key scope.
 * Created in Phase 0 even though the switch UI lands in Phase 8.
 */
interface WorkspaceState {
  ownerId: string | null;
  teamId: string | null;
  setOwner: (ownerId: string | null) => void;
  switchTo: (target: { ownerId: string; teamId: string | null }) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ownerId: null,
  teamId: null,
  setOwner: (ownerId) => set({ ownerId }),
  switchTo: ({ ownerId, teamId }) => set({ ownerId, teamId }),
}));

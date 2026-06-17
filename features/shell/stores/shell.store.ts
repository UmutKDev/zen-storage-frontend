import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Shell UI state (feature-local). `sidebarCollapsed` is a persisted UI
 * preference (allowed — the persist ban applies only to the secure-folders
 * store); `mobileNavOpen` is ephemeral and resets each load.
 */
interface ShellState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    }),
    {
      name: "shell",
      version: 1,
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);

import { create } from "zustand";

/** Storage-quota banner level, pushed by the socket `QUOTA_WARNING/EXCEEDED` events. */
export type QuotaLevel = "none" | "warning" | "exceeded";

/** Global, cross-feature UI state: modal stack + command-palette + shortcuts-help. */
interface UiState {
  modalStack: string[];
  commandPaletteOpen: boolean;
  helpOpen: boolean;
  quotaLevel: QuotaLevel;
  pushModal: (id: string) => void;
  popModal: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  setHelpOpen: (open: boolean) => void;
  setQuotaLevel: (level: QuotaLevel) => void;
  /** Full reset — used by the sign-out teardown. */
  reset: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  modalStack: [],
  commandPaletteOpen: false,
  helpOpen: false,
  quotaLevel: "none",
  pushModal: (id) => set((state) => ({ modalStack: [...state.modalStack, id] })),
  popModal: () =>
    set((state) => ({ modalStack: state.modalStack.slice(0, -1) })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setQuotaLevel: (quotaLevel) => set({ quotaLevel }),
  reset: () =>
    set({
      modalStack: [],
      commandPaletteOpen: false,
      helpOpen: false,
      quotaLevel: "none",
    }),
}));

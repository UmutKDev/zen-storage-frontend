import { create } from "zustand";

/** Global, cross-feature UI state: modal stack + command-palette + shortcuts-help. */
interface UiState {
  modalStack: string[];
  commandPaletteOpen: boolean;
  helpOpen: boolean;
  pushModal: (id: string) => void;
  popModal: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  setHelpOpen: (open: boolean) => void;
  /** Full reset — used by the sign-out teardown. */
  reset: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  modalStack: [],
  commandPaletteOpen: false,
  helpOpen: false,
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
  reset: () => set({ modalStack: [], commandPaletteOpen: false, helpOpen: false }),
}));

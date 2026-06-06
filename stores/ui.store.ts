import { create } from "zustand";

/** Global, cross-feature UI state: modal stack + command-palette open flag. */
interface UiState {
  modalStack: string[];
  commandPaletteOpen: boolean;
  pushModal: (id: string) => void;
  popModal: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  /** Full reset — used by the sign-out teardown. */
  reset: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  modalStack: [],
  commandPaletteOpen: false,
  pushModal: (id) => set((state) => ({ modalStack: [...state.modalStack, id] })),
  popModal: () =>
    set((state) => ({ modalStack: state.modalStack.slice(0, -1) })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  reset: () => set({ modalStack: [], commandPaletteOpen: false }),
}));

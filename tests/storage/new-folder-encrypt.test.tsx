import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";

const mutate = vi.fn();
vi.mock("@/features/storage/operations/hooks/useCreateFolder", () => ({
  useCreateFolder: () => ({
    mutate,
    isPending: false,
    conflict: null,
    cancelConflict: vi.fn(),
    resolve: vi.fn(),
  }),
}));

const { NewFolderDialog } = await import(
  "@/features/storage/operations/components/NewFolderDialog"
);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

const setup = () =>
  renderWithProviders(
    <NewFolderDialog path="" open onOpenChange={() => {}} />,
  );

describe("NewFolderDialog — encrypt", () => {
  it("creates a plain folder when encrypt is off", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/folder name/i), "Docs");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(mutate).toHaveBeenCalledWith({
      name: "Docs",
      encrypt: false,
      passphrase: "",
    });
  });

  it("requires a ≥8-char passphrase before creating an encrypted folder", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText(/folder name/i), "Secret");
    await user.click(screen.getByRole("button", { name: /encrypt this folder/i }));
    // Too short → blocked.
    await user.type(screen.getByLabelText(/password/i), "short");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8/i);
    // Long enough → submits with the passphrase.
    await user.type(screen.getByLabelText(/password/i), "long!");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(mutate).toHaveBeenCalledWith({
      name: "Secret",
      encrypt: true,
      passphrase: "shortlong!",
    });
  });
});

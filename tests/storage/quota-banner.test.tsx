import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";
import { useUiStore } from "@/stores/ui.store";

// The banner derives its level from the usage query; mock the hook so each test
// drives an exact percentage / IsLimitExceeded without a real fetch.
const useStorageUsage = vi.fn();
vi.mock("@/features/storage/browse/hooks/useStorageUsage", () => ({
  useStorageUsage,
}));

const { QuotaBanner } = await import(
  "@/features/storage/browse/components/QuotaBanner"
);

function usage(pct: number, exceeded = false) {
  useStorageUsage.mockReturnValue({
    data: { UsagePercentage: pct, IsLimitExceeded: exceeded },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useUiStore.getState().reset(); // quotaLevel → "none"
  usage(0);
});
afterEach(() => useUiStore.getState().reset());

describe("QuotaBanner — threshold derivation (§6.4 acceptance)", () => {
  it("renders nothing below 80%", () => {
    usage(79);
    renderWithProviders(<QuotaBanner />);
    expect(screen.queryByText(/storage almost full/i)).toBeNull();
    expect(screen.queryByText(/storage full/i)).toBeNull();
  });

  it("shows the warning banner at 80% and 90%", () => {
    usage(80);
    const { unmount } = renderWithProviders(<QuotaBanner />);
    expect(screen.getByText(/storage almost full/i)).toBeInTheDocument();
    unmount();

    usage(90);
    renderWithProviders(<QuotaBanner />);
    expect(screen.getByText(/storage almost full/i)).toBeInTheDocument();
  });

  it("shows the exceeded banner at 100%", () => {
    usage(100);
    renderWithProviders(<QuotaBanner />);
    expect(screen.getByText(/storage full/i)).toBeInTheDocument();
  });

  it("treats IsLimitExceeded as exceeded regardless of percentage", () => {
    usage(42, true);
    renderWithProviders(<QuotaBanner />);
    expect(screen.getByText(/storage full/i)).toBeInTheDocument();
  });

  it("honors a socket-pushed level over a low percentage", () => {
    usage(10);
    useUiStore.getState().setQuotaLevel("warning");
    const { unmount } = renderWithProviders(<QuotaBanner />);
    expect(screen.getByText(/storage almost full/i)).toBeInTheDocument();
    unmount();

    useUiStore.getState().setQuotaLevel("exceeded");
    renderWithProviders(<QuotaBanner />);
    expect(screen.getByText(/storage full/i)).toBeInTheDocument();
  });

  it("dismisses the warning, then re-appears when it escalates to exceeded", async () => {
    const user = userEvent.setup();
    usage(85);
    const { rerender } = renderWithProviders(<QuotaBanner />);
    expect(screen.getByText(/storage almost full/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText(/storage almost full/i)).toBeNull();

    // Escalation: SEVERITY(exceeded) > SEVERITY(dismissed=warning) → re-shows.
    usage(100);
    rerender(<QuotaBanner />);
    expect(screen.getByText(/storage full/i)).toBeInTheDocument();
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test-utils";

const getUnreadCount = vi.fn();
vi.mock("@/features/notifications/api", () => ({ getUnreadCount }));

const { NotificationBell } = await import(
  "@/features/notifications/components/NotificationBell"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NotificationBell", () => {
  it("renders the unread count badge and an accessible label", async () => {
    getUnreadCount.mockResolvedValue({ Count: 3 });
    renderWithProviders(<NotificationBell />);

    await waitFor(() => expect(screen.getByText("3")).toBeVisible());
    expect(
      screen.getByRole("button", { name: /3 unread/i }),
    ).toBeInTheDocument();
  });

  it("shows no badge when there are no unread notifications", async () => {
    getUnreadCount.mockResolvedValue({ Count: 0 });
    renderWithProviders(<NotificationBell />);

    // Give the query a tick; the badge must not appear.
    await waitFor(() =>
      expect(getUnreadCount).toHaveBeenCalled(),
    );
    expect(screen.queryByText("0")).toBeNull();
  });
});

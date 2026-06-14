import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";

const getUnreadCount = vi.fn();
const getNotifications = vi.fn();
const markAsRead = vi.fn();
const markAllAsRead = vi.fn();

// Override the network fns; keep `notificationKeys` (and anything else) real.
vi.mock("@/features/notifications/api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/notifications/api")>();
  return { ...actual, getUnreadCount, getNotifications, markAsRead, markAllAsRead };
});

const { NotificationBell } = await import(
  "@/features/notifications/components/NotificationBell"
);

const NOTIFS = [
  {
    Id: "n1",
    Type: "UPLOAD_FAILED",
    Title: "Upload failed",
    Message: "report.zip could not be uploaded.",
    Data: null,
    IsRead: false,
    CreatedAt: new Date().toISOString(),
  },
  {
    Id: "n2",
    Type: "ARCHIVE_EXTRACT_COMPLETE",
    Title: "Extraction complete",
    Message: "backup.zip was extracted.",
    Data: null,
    IsRead: true,
    CreatedAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  getUnreadCount.mockResolvedValue({ Count: 0 });
  getNotifications.mockResolvedValue({ items: [], count: 0 });
  markAsRead.mockResolvedValue(undefined);
  markAllAsRead.mockResolvedValue(undefined);
});

describe("NotificationBell — badge", () => {
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

    await waitFor(() => expect(getUnreadCount).toHaveBeenCalled());
    expect(screen.queryByText("0")).toBeNull();
  });
});

describe("NotificationBell — inbox panel", () => {
  const open = async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />);
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    return user;
  };

  it("fetches and lists notifications when opened", async () => {
    getUnreadCount.mockResolvedValue({ Count: 1 });
    getNotifications.mockResolvedValue({ items: NOTIFS, count: 2 });

    await open();

    expect(
      await screen.findByRole("menuitem", { name: /Upload failed/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Extraction complete/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/could not be uploaded/i)).toBeInTheDocument();
  });

  it("marks an unread item read on click, but not an already-read one", async () => {
    getUnreadCount.mockResolvedValue({ Count: 1 });
    getNotifications.mockResolvedValue({ items: NOTIFS, count: 2 });

    const user = await open();
    await user.click(
      await screen.findByRole("menuitem", { name: /Extraction complete/i }),
    );
    expect(markAsRead).not.toHaveBeenCalled(); // already read → no-op

    await user.click(screen.getByRole("menuitem", { name: /Upload failed/i }));
    expect(markAsRead).toHaveBeenCalledWith("n1");
  });

  it("marks all read via the header action", async () => {
    getUnreadCount.mockResolvedValue({ Count: 2 });
    getNotifications.mockResolvedValue({ items: NOTIFS, count: 2 });

    const user = await open();
    await user.click(
      await screen.findByRole("menuitem", { name: /Mark all read/i }),
    );
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it("disables 'Mark all read' when nothing is unread", async () => {
    getUnreadCount.mockResolvedValue({ Count: 0 });
    getNotifications.mockResolvedValue({ items: [NOTIFS[1]], count: 1 });

    await open();
    const action = await screen.findByRole("menuitem", {
      name: /Mark all read/i,
    });
    expect(action).toHaveAttribute("aria-disabled", "true");
  });

  it("shows the empty state when there are no notifications", async () => {
    getUnreadCount.mockResolvedValue({ Count: 0 });
    getNotifications.mockResolvedValue({ items: [], count: 0 });

    await open();
    // Present in both the visible empty state and the sr-only live region.
    expect((await screen.findAllByText(/all caught up/i)).length).toBeGreaterThan(0);
  });

  it("shows an error + retry when the list fails", async () => {
    getUnreadCount.mockResolvedValue({ Count: 0 });
    getNotifications.mockRejectedValue(new Error("boom"));

    await open();
    // Present in both the visible error text and the sr-only live region.
    expect(
      (await screen.findAllByText(/load notifications/i)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("menuitem", { name: /try again/i }),
    ).toBeInTheDocument();
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";

/* Mock the account network boundary so we exercise the hooks + components
   (the network layer itself is covered by tests/smoke/data-layer.test.ts). */
const getProfile = vi.fn();
const editProfile = vi.fn();
const changePassword = vi.fn();
const getSessions = vi.fn();
const getPasskeys = vi.fn();
const getTwoFactorStatus = vi.fn();
const revokeSession = vi.fn();
const logoutOthers = vi.fn();
const logoutAll = vi.fn();
const passkeyRegisterBegin = vi.fn();
const passkeyRegisterFinish = vi.fn();
const deletePasskey = vi.fn();
const twoFactorSetup = vi.fn();
const twoFactorVerify = vi.fn();
const twoFactorDisable = vi.fn();
const regenerateBackupCodes = vi.fn();
const getMySubscription = vi.fn();
const startRegistration = vi.fn();
const signOutAndCleanup = vi.fn();

vi.mock("@/features/account/api", () => ({
  getProfile,
  editProfile,
  changePassword,
  getSessions,
  getPasskeys,
  getTwoFactorStatus,
  revokeSession,
  logoutOthers,
  logoutAll,
  passkeyRegisterBegin,
  passkeyRegisterFinish,
  deletePasskey,
  twoFactorSetup,
  twoFactorVerify,
  twoFactorDisable,
  regenerateBackupCodes,
  getMySubscription,
}));
vi.mock("@simplewebauthn/browser", () => ({ startRegistration }));
vi.mock("@/features/auth", () => ({ signOutAndCleanup }));

const { ProfileForm } = await import("@/features/account/components/ProfileForm");
const { ChangePasswordForm } = await import(
  "@/features/account/components/ChangePasswordForm"
);
const { AvatarBlock } = await import(
  "@/features/account/components/AvatarBlock"
);
const { TwoFactorSection } = await import(
  "@/features/account/components/TwoFactorSection"
);
const { PasskeysSection } = await import(
  "@/features/account/components/PasskeysSection"
);
const { SessionsSection } = await import(
  "@/features/account/components/SessionsSection"
);
const { SubscriptionScreen } = await import("@/features/account");

const PROFILE = {
  Id: "u1",
  Email: "ada@example.com",
  FullName: "Ada Lovelace",
  PhoneNumber: "+1 555",
  Image: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProfileForm", () => {
  it("submits edited profile values", async () => {
    editProfile.mockResolvedValue(true);
    const user = userEvent.setup();
    renderWithProviders(
      <ProfileForm profile={PROFILE as never} />,
    );

    const fullName = screen.getByLabelText("Full name");
    await user.clear(fullName);
    await user.type(fullName, "Ada B. Lovelace");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(editProfile).toHaveBeenCalled());
    expect(editProfile.mock.calls[0]?.[0]).toMatchObject({
      FullName: "Ada B. Lovelace",
    });
  });

  it("email field is read-only", () => {
    renderWithProviders(<ProfileForm profile={PROFILE as never} />);
    expect(screen.getByLabelText("Email")).toBeDisabled();
  });
});

describe("ChangePasswordForm", () => {
  it("blocks submit and shows an error when new passwords mismatch", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "oldpass12");
    await user.type(screen.getByLabelText("New password"), "newpass123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "different99",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("Passwords do not match.")).toBeVisible();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("submits when the new passwords match", async () => {
    changePassword.mockResolvedValue(true);
    const user = userEvent.setup();
    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "oldpass12");
    await user.type(screen.getByLabelText("New password"), "newpass123");
    await user.type(screen.getByLabelText("Confirm new password"), "newpass123");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => expect(changePassword).toHaveBeenCalled());
    expect(changePassword.mock.calls[0]?.[0]).toMatchObject({
      CurrentPassword: "oldpass12",
      NewPassword: "newpass123",
      NewPasswordConfirmation: "newpass123",
    });
  });
});

describe("AvatarBlock", () => {
  it("does not render the upload control while the flag is off (endpoint inactive)", () => {
    renderWithProviders(
      <AvatarBlock name="Ada Lovelace" email="ada@example.com" />,
    );
    expect(
      screen.queryByRole("button", { name: "Change photo" }),
    ).toBeNull();
    // initials fallback renders
    expect(screen.getByText("AL")).toBeInTheDocument();
  });
});

describe("TwoFactorSection", () => {
  it("shows the enabled state with remaining backup codes", async () => {
    getTwoFactorStatus.mockResolvedValue({
      IsEnabled: true,
      Method: "TOTP",
      HasPasskey: false,
      BackupCodesRemaining: 5,
    });
    renderWithProviders(<TwoFactorSection />);

    expect(
      await screen.findByText("Two-factor authentication is on."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Disable two-factor" }),
    ).toBeInTheDocument();
  });

  it("triggers setup when enabling from the disabled state", async () => {
    getTwoFactorStatus.mockResolvedValue({
      IsEnabled: false,
      Method: "",
      HasPasskey: false,
      BackupCodesRemaining: 0,
    });
    twoFactorSetup.mockResolvedValue({
      Secret: "ABC",
      Issuer: "Storage",
      AccountName: "ada",
      OtpAuthUrl: "otpauth://totp/x",
    });
    const user = userEvent.setup();
    renderWithProviders(<TwoFactorSection />);

    await user.click(
      await screen.findByRole("button", { name: "Enable two-factor" }),
    );
    await waitFor(() => expect(twoFactorSetup).toHaveBeenCalled());
  });
});

describe("PasskeysSection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "PublicKeyCredential", {
      value: function PublicKeyCredential() {},
      configurable: true,
    });
  });

  it("runs the registration ceremony: begin → startRegistration → finish", async () => {
    getPasskeys.mockResolvedValue([]);
    passkeyRegisterBegin.mockResolvedValue({
      Challenge: "c",
      Options: { challenge: "c" },
    });
    startRegistration.mockResolvedValue({ id: "cred-1" });
    passkeyRegisterFinish.mockResolvedValue({ Id: "pk1", DeviceName: "Mac" });

    const user = userEvent.setup();
    renderWithProviders(<PasskeysSection />);

    const addButton = await screen.findByRole("button", {
      name: "Add passkey",
    });
    await waitFor(() => expect(addButton).toBeEnabled());
    await user.click(addButton);

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Passkey name"), "Mac");
    await user.click(
      within(dialog).getByRole("button", { name: "Add passkey" }),
    );

    await waitFor(() =>
      expect(passkeyRegisterBegin).toHaveBeenCalledWith("Mac"),
    );
    await waitFor(() => expect(startRegistration).toHaveBeenCalled());
    await waitFor(() =>
      expect(passkeyRegisterFinish).toHaveBeenCalledWith("Mac", {
        id: "cred-1",
      }),
    );
  });
});

describe("section error states", () => {
  it("PasskeysSection shows an error + retry instead of an empty state on query failure", async () => {
    getPasskeys.mockRejectedValue(new Error("boom"));
    renderWithProviders(<PasskeysSection />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.queryByText("No passkeys yet.")).toBeNull();
  });

  it("SessionsSection shows an error + retry instead of an empty state on query failure", async () => {
    getSessions.mockRejectedValue(new Error("boom"));
    renderWithProviders(<SessionsSection />);

    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.queryByText("No active sessions.")).toBeNull();
  });
});

describe("SessionsSection", () => {
  it("marks the current device and signs out everywhere via teardown", async () => {
    getSessions.mockResolvedValue([
      {
        Id: "s1",
        DeviceInfo: { browser: "Chrome" },
        IpAddress: "1.1.1.1",
        CreatedAt: "2026-01-01",
        LastActivityAt: "2026-06-01",
        IsCurrent: true,
      },
      {
        Id: "s2",
        DeviceInfo: { browser: "Safari" },
        IpAddress: "2.2.2.2",
        CreatedAt: "2026-01-01",
        LastActivityAt: "2026-05-01",
        IsCurrent: false,
      },
    ]);
    logoutAll.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithProviders(<SessionsSection />);

    expect(await screen.findByText("This device")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Sign out everywhere" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Sign out everywhere" }),
    );

    await waitFor(() => expect(logoutAll).toHaveBeenCalled());
  });
});

describe("SubscriptionScreen", () => {
  it("shows Unlimited when the storage limit is 0", async () => {
    getMySubscription.mockResolvedValue({
      Id: "sub1",
      StartAt: "2026-01-01",
      IsTrial: false,
      Price: 0,
      Subscription: {
        Id: "p1",
        Name: "Pro",
        Slug: "pro",
        Currency: "USD",
        BillingCycle: "MONTHLY",
        StorageLimitBytes: 0,
        Status: "ACTIVE",
        Date: { Created: "", Updated: "" },
      },
      Date: { Created: "", Updated: "" },
    });
    renderWithProviders(<SubscriptionScreen />);

    expect(await screen.findByText("Pro")).toBeVisible();
    expect(screen.getByText("Unlimited")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /subscribe|upgrade|buy/i }),
    ).toBeNull();
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test-utils";

// Mock the boundary modules so we test the SCREEN's multi-step orchestration
// (the network layer itself is covered by tests/smoke/data-layer.test.ts).
const signIn = vi.fn(async () => ({ ok: true, error: null }));
const push = vi.fn();
const loginCheck = vi.fn();
const login = vi.fn();
const verify2FA = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn,
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/auth/api", () => ({
  loginCheck,
  login,
  verify2FA,
  register: vi.fn(),
  resetPassword: vi.fn(),
}));

const { LoginScreen } = await import("@/features/auth");

describe("LoginScreen multi-step flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("password-only path: email → password → finalize via signIn", async () => {
    loginCheck.mockResolvedValue({
      HasPasskey: false,
      HasTwoFactor: false,
      AvailableMethods: ["password"],
      TwoFactorMethod: "",
    });
    login.mockResolvedValue({ SessionId: "sess_1", ExpiresAt: "2099-01-01" });

    const user = userEvent.setup();
    renderWithProviders(<LoginScreen />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(loginCheck).toHaveBeenCalledWith("user@example.com"),
    );
    // advanced to the password step
    const password = await screen.findByLabelText("Password");
    await user.type(password, "hunter2pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("user@example.com", "hunter2pass"),
    );
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({ sessionId: "sess_1", redirect: false }),
      ),
    );
    expect(verify2FA).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/storage");
  });

  it("2FA path: shows the OTP step when HasTwoFactor and verifies with the login session id", async () => {
    loginCheck.mockResolvedValue({
      HasPasskey: false,
      HasTwoFactor: true,
      AvailableMethods: ["password"],
      TwoFactorMethod: "TOTP",
    });
    login.mockResolvedValue({ SessionId: "login_sess", ExpiresAt: "" });
    verify2FA.mockResolvedValue({ SessionId: "final_sess", ExpiresAt: "" });

    const user = userEvent.setup();
    renderWithProviders(<LoginScreen />);

    await user.type(screen.getByLabelText("Email"), "u@e.co");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const password = await screen.findByLabelText("Password");
    await user.type(password, "hunter2pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // 2FA step appears; signIn not yet called
    await screen.findByText("Two-factor authentication");
    expect(signIn).not.toHaveBeenCalled();

    await user.keyboard("123456");
    await user.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() =>
      expect(verify2FA).toHaveBeenCalledWith("123456", "login_sess"),
    );
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({ sessionId: "final_sess" }),
      ),
    );
  });
});

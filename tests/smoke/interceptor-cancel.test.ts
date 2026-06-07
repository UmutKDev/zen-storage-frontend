import { describe, expect, it, vi, beforeEach } from "vitest";

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));
vi.mock("@/service/token-sources", () => ({
  getSignOut: () => vi.fn(),
}));

const { envelopeResponseRejected } = await import(
  "@/service/interceptors/envelope"
);

beforeEach(() => vi.clearAllMocks());

describe("envelope interceptor — cancellation is silent", () => {
  it("does NOT toast a canceled request (TanStack abort on nav/unmount)", async () => {
    const canceled = Object.assign(new Error("canceled"), {
      code: "ERR_CANCELED",
      name: "CanceledError",
    });
    await expect(
      envelopeResponseRejected(canceled as never),
    ).rejects.toBe(canceled);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("DOES toast a real server error (5xx)", async () => {
    const serverError = {
      name: "AxiosError",
      code: "ERR_BAD_RESPONSE",
      response: { status: 500, data: {}, headers: {} },
      config: {},
    };
    await expect(
      envelopeResponseRejected(serverError as never),
    ).rejects.toBeTruthy();
    expect(toastError).toHaveBeenCalledTimes(1);
  });
});

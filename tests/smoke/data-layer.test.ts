// @vitest-environment node
// Node env so axios uses the http adapter that msw/node intercepts (jsdom's XHR
// is not patched by msw/node).
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../msw/server";
import { okStatusFixture } from "../fixtures/status.fixtures";
import { accountApiFactory } from "@/service/factories";
import { registerSignOut } from "@/service/token-sources";
import { ApiError, isApiError } from "@/lib/api";

const PROFILE_URL = "http://localhost:8080/Api/Account/Profile";

describe("data layer / Instance", () => {
  it("unwraps the { Result, Status } envelope to bare data", async () => {
    server.use(
      http.get(PROFILE_URL, () =>
        HttpResponse.json({
          Result: { Id: "u1", Email: "a@b.co" },
          Status: okStatusFixture,
        }),
      ),
    );

    const res = await accountApiFactory.profile();
    expect((res.data as unknown as { Id: string }).Id).toBe("u1");
  });

  it("maps 401 to a typed ApiError(UNAUTHORIZED) and signs out", async () => {
    const signOut = vi.fn();
    registerSignOut(signOut);
    server.use(
      http.get(PROFILE_URL, () => new HttpResponse(null, { status: 401 })),
    );

    let caught: unknown;
    try {
      await accountApiFactory.profile();
    } catch (error) {
      caught = error;
    }

    expect(isApiError(caught)).toBe(true);
    expect((caught as ApiError).code).toBe("UNAUTHORIZED");
    expect(signOut).toHaveBeenCalledOnce();
  });
});

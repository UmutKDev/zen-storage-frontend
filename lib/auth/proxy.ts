import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import {
  STATIC_HEADERS,
  buildCsp,
  generateNonce,
  hstsHeader,
} from "@/lib/security";

/**
 * The real logic behind the root `proxy.ts` shim (Next 16.2 rename of
 * middleware; Node runtime only). Emits the security headers + a per-request
 * CSP nonce. Route protection for `(app)/*` lands in Phase 1.
 *
 * P0 ships CSP as **Report-Only** (non-blocking): nonce-based enforcement would
 * force every page to dynamic rendering (Next CSP guide), risking the static
 * not-found page. Flip to enforcing `Content-Security-Policy` in P7 (D-P0.8).
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = generateNonce();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const [key, value] of Object.entries(STATIC_HEADERS)) {
    response.headers.set(key, value);
  }

  // HSTS + CSP are production-only. In `next dev`, a report-only CSP just adds
  // console noise (no report endpoint; HMR/eval and Next's un-nonced inline
  // scripts trip it) for no gain. Verification runs against `next start` (prod),
  // where the report-only CSP + per-request nonce are present. Enforced in P7.
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", hstsHeader());
    response.headers.set("Content-Security-Policy-Report-Only", buildCsp(nonce));
  }

  return response;
}

// NOTE: the proxy `config.matcher` is defined in the root `proxy.ts` (Next
// requires it as a static literal in that file, not re-exported from here).

import "server-only";
import { NextResponse } from "next/server";

/**
 * The real logic behind the root `proxy.ts` shim (Next 16.2 rename of
 * middleware; Node runtime only). Route protection for `(app)/*` lands in
 * Phase 1 — pass-through for now (the `request` param returns in P1).
 */
export function proxy(): NextResponse {
  return NextResponse.next();
}

// NOTE: the proxy `config.matcher` is defined in the root `proxy.ts` (Next
// requires it as a static literal in that file, not re-exported from here).

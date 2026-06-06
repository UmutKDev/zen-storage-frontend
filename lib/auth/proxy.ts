import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./config";
import {
  STATIC_HEADERS,
  buildCsp,
  generateNonce,
  hstsHeader,
} from "@/lib/security";

// Lightweight instance from the edge-safe base config — used ONLY to read the
// session JWT in the proxy (no providers / factory / sonner pulled in).
const { auth } = NextAuth(authConfig);

// `(app)` content lives at these path prefixes (route groups don't appear in
// the URL). Auth screens live at the auth prefixes.
const PROTECTED_PREFIXES = ["/storage", "/account", "/notifications"];
const AUTH_PREFIXES = ["/login", "/register", "/reset"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Attach security headers (+ a per-request CSP nonce) to a response. */
function withSecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  nonce: string,
): NextResponse {
  for (const [key, value] of Object.entries(STATIC_HEADERS)) {
    response.headers.set(key, value);
  }
  // CSP/HSTS are production-only (dev would just be console noise; see D-P0.8/9).
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", hstsHeader());
    response.headers.set("Content-Security-Policy-Report-Only", buildCsp(nonce));
  }
  // Keep `request` referenced for symmetry with the next() request rewrite.
  void request;
  return response;
}

/**
 * The real logic behind the root `proxy.ts` shim (Next 16.2 rename of
 * middleware; Node runtime only). Wrapped with Auth.js `auth` so `req.auth`
 * carries the session. Does two jobs: route protection + security headers.
 */
export const proxy = auth((req) => {
  const nonce = generateNonce();
  const { pathname } = req.nextUrl;
  const isAuthed = Boolean(req.auth?.sessionId);

  // Unauthenticated → out of the app area (preserve intended path).
  if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !isAuthed) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("from", pathname);
    return withSecurityHeaders(NextResponse.redirect(url), req, nonce);
  }

  // Authenticated → away from the auth screens.
  if (matchesPrefix(pathname, AUTH_PREFIXES) && isAuthed) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/storage", req.nextUrl)),
      req,
      nonce,
    );
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    req,
    nonce,
  );
});

// NOTE: the proxy `config.matcher` is defined in the root `proxy.ts` (Next
// requires it as a static literal in that file, not re-exported from here).

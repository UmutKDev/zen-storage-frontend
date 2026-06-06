import { env } from "@/config/env";

/**
 * Security response headers + the CSP policy builder. Pure (no next/server) so
 * it composes cleanly into the proxy. Per security-headers.md, headers are
 * emitted from the proxy (NOT next.config) so the per-request CSP nonce can be
 * threaded.
 */

const isDev = process.env.NODE_ENV === "development";

/** Static headers applied to every (matched) response. HSTS is added separately, prod-only. */
export const STATIC_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "on",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Cross-Origin-Resource-Policy": "same-site",
  // No X-Frame-Options — CSP `frame-ancestors 'none'` covers it.
  "Permissions-Policy": [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
    "interest-cohort=()",
    "clipboard-read=(self)",
    "clipboard-write=(self)",
    "fullscreen=(self)",
  ].join(", "),
};

/** 16-byte base64 nonce, fresh per request. */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function hstsHeader(): string {
  return "max-age=63072000; includeSubDomains; preload";
}

/**
 * Build the CSP for a request's nonce. `script-src` is strict (nonce +
 * strict-dynamic, no unsafe-inline; `unsafe-eval` only in dev for React's
 * debugger). `style-src` keeps `unsafe-inline` because framer-motion + Radix
 * emit inline style attributes that nonces can't cover (tightened in P7).
 */
export function buildCsp(nonce: string): string {
  const apiOrigin = env.NEXT_PUBLIC_API_URL.replace(/\/Api\/?$/, "");
  const wsOrigin = apiOrigin.replace(/^http/, "ws");
  const cdn = "https://cdn.storage.umutk.me";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${cdn}`,
    "font-src 'self' data:",
    `connect-src 'self' ${apiOrigin} ${wsOrigin} https://*.s3.amazonaws.com ${cdn}`,
    `media-src 'self' blob: ${cdn}`,
    "worker-src 'self' blob:",
    "frame-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // `upgrade-insecure-requests` is ignored in Report-Only (and logs a console
    // error); re-add it when CSP is enforced in P7.
  ].join("; ");
}

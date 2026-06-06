/**
 * PII scrubber — runs on every payload before it reaches the reporter (and any
 * future Sentry egress). Privacy rule: NEVER transmit emails, file Paths/Names,
 * tokens, auth headers, or presigned URLs. Over-redaction is intentional.
 * See docs/06-cross-cutting/privacy-compliance.md §6.
 */
const REDACTED = "[redacted]";

// Key names whose VALUE is always sensitive (case-insensitive, exact match).
const SENSITIVE_KEY =
  /^(email|password|passphrase|token|authorization|cookie|set-cookie|x-session-id|x-folder-session|x-hidden-session|path|filename|name|displayname|avatarurl)$/i;
// Any *Token / *Key suffix (e.g. SessionToken, ApiKey, SecretKey).
const SENSITIVE_SUFFIX = /(token|key)$/i;

// Value patterns redacted anywhere inside strings.
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const SECRET_PREFIX = /\b[a-z]{2}_[a-z]+_[A-Za-z0-9]{8,}\b/g; // sk_live_…, pk_test_…

function scrubString(value: string): string {
  // Strip query strings off URLs (presigned S3/CDN params are sensitive).
  const base =
    /^https?:\/\//.test(value) && value.includes("?")
      ? value.slice(0, value.indexOf("?"))
      : value;
  return base
    .replace(JWT, REDACTED)
    .replace(SECRET_PREFIX, REDACTED)
    .replace(EMAIL, REDACTED);
}

function walk(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((item) => walk(item, seen));
  if (value && typeof value === "object") {
    if (seen.has(value)) return REDACTED;
    seen.add(value);
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] =
        SENSITIVE_KEY.test(key) || SENSITIVE_SUFFIX.test(key)
          ? REDACTED
          : walk(val, seen);
    }
    return out;
  }
  return value;
}

/** Deep-scrub an arbitrary payload (event, context, request body). */
export function scrub<T>(payload: T): T {
  return walk(payload, new WeakSet()) as T;
}

export interface Breadcrumb {
  message?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Scrub a breadcrumb (message + data) before it's recorded. */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  return scrub(breadcrumb);
}

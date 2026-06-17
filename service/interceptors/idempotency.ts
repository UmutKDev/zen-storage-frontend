import type { InternalAxiosRequestConfig } from "axios";
import { HEADERS } from "@/config/constants";
import { newIdempotencyKey } from "@/lib/api";

/** URL fragments of operations that require an idempotency key. */
const IDEMPOTENT_URL_HINTS = ["/Move", "/CompleteMultipartUpload"] as const;

/**
 * Attach `Idempotency-Key` to Move / Delete / CompleteMultipartUpload. If the
 * call site already pre-minted a key (to reuse across retries/rollbacks), it is
 * left untouched — the call site owns the key per data-layer §2.8.
 */
export function idempotencyRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (config.headers.has(HEADERS.idempotencyKey)) return config;

  const method = (config.method ?? "get").toUpperCase();
  const url = config.url ?? "";
  const needsKey =
    method === "DELETE" ||
    IDEMPOTENT_URL_HINTS.some((hint) => url.includes(hint));

  if (needsKey) config.headers.set(HEADERS.idempotencyKey, newIdempotencyKey());
  return config;
}

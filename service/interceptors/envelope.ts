import type { AxiosError, AxiosResponse } from "axios";
import {
  ApiError,
  unwrapEnvelope,
  extractEnvelopeMessages,
  toastApiError,
  type ResultEnvelope,
} from "@/lib/api";
import { t } from "@/lib/i18n";
import { getSignOut } from "../token-sources";

function hasResultEnvelope(data: unknown): data is ResultEnvelope<unknown> {
  return typeof data === "object" && data !== null && "Result" in data;
}

/**
 * Success path: unwrap `{ Result, Status }` → bare `Result` (or `{ items, count }`
 * for lists) so feature code never sees the wrapper. Non-enveloped bodies
 * (binary/health) pass through untouched.
 */
export function envelopeResponseFulfilled(
  response: AxiosResponse,
): AxiosResponse {
  if (hasResultEnvelope(response.data)) {
    response.data = unwrapEnvelope(response.data);
  }
  return response;
}

/**
 * Error path: map HTTP/network failures to a typed `ApiError`. `401` triggers
 * central sign-out; `403`/`409` pass through silently for feature handlers;
 * everything else toasts once. Never retries (that is TanStack Query's job).
 */
export async function envelopeResponseRejected(
  error: AxiosError,
): Promise<never> {
  const status = error.response?.status;
  const messages = extractEnvelopeMessages(error.response?.data);
  const apiError = ApiError.fromHttp(
    status,
    messages.length > 0 ? messages : [t("common.errorGeneric")],
    error.response?.data,
  );

  if (apiError.code === "UNAUTHORIZED") {
    await getSignOut()();
  } else if (apiError.code !== "FORBIDDEN" && apiError.code !== "CONFLICT") {
    toastApiError(apiError);
  }

  throw apiError;
}

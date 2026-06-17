import { ApiError, isApiError } from "@/lib/api";

/** Normalize an unknown thrown value to a typed `ApiError` for display. */
export function toApiError(e: unknown): ApiError {
  return isApiError(e) ? e : new ApiError({ code: "UNKNOWN", messages: [] });
}

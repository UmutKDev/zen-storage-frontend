import { toast } from "sonner";
import { ApiError } from "./ApiError";
import { friendlyMessage } from "./error-messages";

/**
 * The one place an `ApiError` becomes a user-visible toast. Driven by the
 * envelope interceptor — feature code never toasts errors by hand. Guarded so it
 * is a no-op during SSR / RSC (sonner is a client concern).
 */
export function toastApiError(error: ApiError): void {
  if (typeof window === "undefined") return;
  toast.error(friendlyMessage(error));
}

import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * Set by queue-managed callers (the upload engine) whose UI owns error
     * presentation: the envelope interceptor still maps the failure to a
     * typed `ApiError` but skips the central toast, so per-part retries
     * don't toast-storm. Everything else keeps the central toast (rule #9).
     */
    suppressErrorToast?: boolean;
  }
}

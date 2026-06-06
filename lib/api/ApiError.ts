/**
 * The single typed error the whole app speaks. The envelope interceptor maps
 * every failed backend call to an `ApiError`; feature handlers branch on
 * `code` (e.g. `FORBIDDEN` → secure-folder gate, `CONFLICT` → conflict dialog).
 */

export type ApiErrorCode =
  | "UNAUTHORIZED" // 401 — handled centrally (re-auth / sign-out)
  | "FORBIDDEN" // 403 — passes through to feature handlers
  | "CONFLICT" // 409 — passes through (conflict resolution)
  | "IDEMPOTENCY_CONFLICT" // 409 with idempotency replay mismatch
  | "NOT_FOUND" // 404
  | "VALIDATION" // 400 / 422
  | "RATE_LIMITED" // 429
  | "SERVER_ERROR" // 5xx
  | "NETWORK" // no response (offline, CORS, timeout)
  | "UNKNOWN";

export interface ApiErrorInit {
  code: ApiErrorCode;
  messages: string[];
  httpStatus?: number;
  raw?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly messages: string[];
  readonly httpStatus?: number;
  readonly raw?: unknown;

  constructor({ code, messages, httpStatus, raw }: ApiErrorInit) {
    super(messages[0] ?? code);
    this.name = "ApiError";
    this.code = code;
    this.messages = messages.length > 0 ? messages : [code];
    this.httpStatus = httpStatus;
    this.raw = raw;
  }

  /** Map an HTTP status (or `undefined` for a network failure) to a code. */
  static codeFromStatus(status: number | undefined): ApiErrorCode {
    if (status === undefined) return "NETWORK";
    if (status === 401) return "UNAUTHORIZED";
    if (status === 403) return "FORBIDDEN";
    if (status === 404) return "NOT_FOUND";
    if (status === 409) return "CONFLICT";
    if (status === 429) return "RATE_LIMITED";
    if (status === 400 || status === 422) return "VALIDATION";
    if (status >= 500) return "SERVER_ERROR";
    return "UNKNOWN";
  }

  static fromHttp(
    status: number | undefined,
    messages: string[],
    raw?: unknown,
  ): ApiError {
    return new ApiError({
      code: ApiError.codeFromStatus(status),
      messages,
      httpStatus: status,
      raw,
    });
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

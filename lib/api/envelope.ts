/**
 * Backend response envelope contract (from the generated client — the source of
 * truth): every response is `{ Result, Status }`. List endpoints carry the page
 * payload as `{ Options: { …, Count }, Items }` inside `Result`.
 *
 * The envelope interceptor is the ONLY caller — it unwraps `response.data` to
 * the bare `Result` (or `{ items, count }` for lists) so feature hooks never see
 * the wrapper. If you spot `.Result`/`.Status` at a call site, the unwrap
 * boundary has leaked — fix the interceptor, not the call site.
 */

export interface EnvelopeStatus {
  Messages: string[];
  Code: number;
  Timestamp: string;
  Path: string;
}

export interface ResultEnvelope<T> {
  Result: T;
  Status: EnvelopeStatus;
}

export interface ArrayResult<T> {
  Options: { Search: string; Skip: number; Take: number; Count: number };
  Items: T[];
}

export interface ListResult<T> {
  items: T[];
  count: number;
}

function isArrayResult(value: unknown): value is ArrayResult<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as ArrayResult<unknown>).Items)
  );
}

export function unwrapEnvelope<T>(body: ResultEnvelope<ArrayResult<T>>): ListResult<T>;
export function unwrapEnvelope<T>(body: ResultEnvelope<T>): T;
export function unwrapEnvelope<T>(
  body: ResultEnvelope<T> | ResultEnvelope<ArrayResult<T>>,
): T | ListResult<T> {
  const result = body.Result as unknown;
  if (isArrayResult(result)) {
    return { items: result.Items as T[], count: result.Options?.Count ?? result.Items.length };
  }
  return result as T;
}

/** Pull human-readable messages out of an error envelope (best-effort). */
export function extractEnvelopeMessages(body: unknown): string[] {
  if (typeof body !== "object" || body === null) return [];
  const status = (body as Partial<ResultEnvelope<unknown>>).Status;
  if (status && Array.isArray(status.Messages)) {
    return status.Messages.filter((m): m is string => typeof m === "string");
  }
  return [];
}

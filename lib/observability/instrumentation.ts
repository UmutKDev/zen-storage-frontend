import { reportError } from "./reporter";

/**
 * The logic behind the root `instrumentation.ts` shim. `register` runs once per
 * server instance; `onRequestError` forwards server errors to the reporter.
 */
export function register(): void {
  // Observability bootstrap (OTel/Sentry init) lands with the real reporter.
}

export function onRequestError(
  error: unknown,
  ...rest: unknown[]
): void {
  reportError(error, { source: "instrumentation", rest });
}

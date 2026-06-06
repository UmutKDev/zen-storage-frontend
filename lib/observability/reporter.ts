import type { TelemetryEvent } from "./events";

/**
 * Observability reporter. In dev it logs; a real provider (Sentry) + the PII
 * scrubber are wired later (0.4a, deferred). All payloads must pass through the
 * scrubber before reaching a real provider.
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "production") {
    console.error("[observability] error", error, context);
  }
}

export function reportEvent(
  event: TelemetryEvent,
  data?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[observability] event", event, data);
  }
}

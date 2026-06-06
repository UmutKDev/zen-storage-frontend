import type { TelemetryEvent } from "./events";
import { scrub } from "./scrubber";

/**
 * Observability reporter. Every payload is PII-scrubbed before it's logged or
 * (later) sent to a provider. A real reporter (Sentry) wires its `beforeSend`
 * through the same `scrub`.
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const safeContext = context ? scrub(context) : undefined;
  if (process.env.NODE_ENV !== "production") {
    console.error("[observability] error", error, safeContext);
  }
}

export function reportEvent(
  event: TelemetryEvent,
  data?: Record<string, unknown>,
): void {
  const safeData = data ? scrub(data) : undefined;
  if (process.env.NODE_ENV !== "production") {
    console.debug("[observability] event", event, safeData);
  }
}

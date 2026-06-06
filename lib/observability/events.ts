/** Typed telemetry event catalog. Add events here; never log raw strings. */
export const events = {
  appBooted: "app.booted",
  signedOut: "auth.signed_out",
  uploadStarted: "upload.started",
  uploadCompleted: "upload.completed",
} as const;

export type TelemetryEvent = (typeof events)[keyof typeof events];

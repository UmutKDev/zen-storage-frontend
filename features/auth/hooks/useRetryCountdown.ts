"use client";

import { useEffect, useState } from "react";
import type { ApiError } from "@/lib/api";

/**
 * Seconds remaining before retry is allowed after a 429. Reads `retryAfter`
 * (from the `Retry-After` header) and ticks down once per second. Returns 0 when
 * the error isn't a rate-limit. Drives both the countdown copy and submit-disable.
 */
export function useRetryCountdown(error: ApiError | null): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- seed/reset the countdown
       from the (prop-derived) error; the per-second ticks below run async. */
    if (error?.code !== "RATE_LIMITED") {
      setSeconds(0);
      return;
    }
    let remaining = error.retryAfter ?? 60;
    setSeconds(remaining);
    /* eslint-enable react-hooks/set-state-in-effect */
    const id = setInterval(() => {
      remaining -= 1;
      setSeconds(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [error]);

  return seconds;
}

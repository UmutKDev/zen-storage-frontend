"use client";

import { useCallback, useState } from "react";
import { ApiError, isApiError } from "@/lib/api";
import { resetPassword } from "../api";

export function useReset() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = useCallback(async (email: string) => {
    setPending(true);
    setError(null);
    try {
      await resetPassword(email);
      // Neutral confirmation regardless of whether the email exists (the backend
      // does not reveal existence). Errors here are transport/throttle only.
      setSent(true);
    } catch (e) {
      setError(isApiError(e) ? e : new ApiError({ code: "UNKNOWN", messages: [] }));
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, sent, error, submit };
}

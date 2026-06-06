"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ApiError, isApiError } from "@/lib/api";
import { register as registerApi } from "../api";

export function useRegister() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      setPending(true);
      setError(null);
      try {
        const res = await registerApi(email, password, passwordConfirmation);
        const signInRes = await signIn("credentials", {
          sessionId: res.SessionId,
          expiresAt: res.ExpiresAt ?? "",
          redirect: false,
        });
        if (signInRes?.error) {
          setError(new ApiError({ code: "UNAUTHORIZED", messages: [] }));
          return;
        }
        router.push("/storage");
        router.refresh();
      } catch (e) {
        setError(isApiError(e) ? e : new ApiError({ code: "UNKNOWN", messages: [] }));
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  return { pending, error, submit };
}

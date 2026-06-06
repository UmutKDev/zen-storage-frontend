"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ApiError, isApiError } from "@/lib/api";
import type { LoginCheckResponseModel } from "@/service/models";
import { login, loginCheck, verify2FA } from "../api";

export type LoginStep = "email" | "password" | "twoFactor";

function toApiError(e: unknown): ApiError {
  return isApiError(e) ? e : new ApiError({ code: "UNKNOWN", messages: [] });
}

/**
 * UI-driven multi-step login (auth-integration §2). Walks the backend flow via
 * the factories, holding step state in React, then finalizes with Auth.js
 * `signIn("credentials", { sessionId })`.
 */
export function useLoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [check, setCheck] = useState<LoginCheckResponseModel | null>(null);
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const finalize = useCallback(
    async (sessionId: string, expiresAt?: string) => {
      const res = await signIn("credentials", {
        sessionId,
        expiresAt: expiresAt ?? "",
        redirect: false,
      });
      if (res?.error) {
        setError(new ApiError({ code: "UNAUTHORIZED", messages: [] }));
        return;
      }
      const from = params.get("from");
      router.push(from?.startsWith("/") ? from : "/storage");
      router.refresh();
    },
    [params, router],
  );

  const submitEmail = useCallback(async (value: string) => {
    setPending(true);
    setError(null);
    try {
      const result = await loginCheck(value);
      setEmail(value);
      setCheck(result);
      setStep("password");
    } catch (e) {
      setError(toApiError(e));
    } finally {
      setPending(false);
    }
  }, []);

  const submitPassword = useCallback(
    async (password: string) => {
      setPending(true);
      setError(null);
      try {
        const result = await login(email, password);
        if (check?.HasTwoFactor) {
          setLoginSessionId(result.SessionId);
          setStep("twoFactor");
        } else {
          await finalize(result.SessionId, result.ExpiresAt);
        }
      } catch (e) {
        setError(toApiError(e));
      } finally {
        setPending(false);
      }
    },
    [email, check, finalize],
  );

  const submitOtp = useCallback(
    async (code: string) => {
      if (!loginSessionId) return;
      setPending(true);
      setError(null);
      try {
        const result = await verify2FA(code, loginSessionId);
        await finalize(result.SessionId, result.ExpiresAt);
      } catch (e) {
        setError(toApiError(e));
      } finally {
        setPending(false);
      }
    },
    [loginSessionId, finalize],
  );

  const restart = useCallback(() => {
    setStep("email");
    setError(null);
  }, []);

  return {
    step,
    email,
    check,
    pending,
    error,
    submitEmail,
    submitPassword,
    submitOtp,
    restart,
  };
}

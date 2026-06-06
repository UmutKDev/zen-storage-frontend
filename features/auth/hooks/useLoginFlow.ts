"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  startAuthentication,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { ApiError, isApiError } from "@/lib/api";
import type { LoginCheckResponseModel } from "@/service/models";
import {
  login,
  loginCheck,
  verify2FA,
  passkeyLoginBegin,
  passkeyLoginFinish,
} from "../api";

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

  const submitPasskey = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const begin = await passkeyLoginBegin(email);
      const credential = await startAuthentication({
        optionsJSON: begin.Options as unknown as PublicKeyCredentialRequestOptionsJSON,
      });
      const result = await passkeyLoginFinish(email, credential);
      await finalize(result.SessionId, result.ExpiresAt); // bypasses 2FA
    } catch (e) {
      // User cancellation / no credential → not a hard error; stay on password.
      if (
        e instanceof Error &&
        (e.name === "NotAllowedError" || e.name === "AbortError")
      ) {
        return;
      }
      setError(toApiError(e));
    } finally {
      setPending(false);
    }
  }, [email, finalize]);

  const restart = useCallback(() => {
    setStep("email");
    setError(null);
  }, []);

  // Passkey is offered only when the account has one AND the browser supports
  // WebAuthn; otherwise we silently fall back to the password path.
  const canPasskey =
    Boolean(check?.HasPasskey) &&
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined";

  return {
    step,
    email,
    check,
    pending,
    error,
    canPasskey,
    submitEmail,
    submitPassword,
    submitOtp,
    submitPasskey,
    restart,
  };
}

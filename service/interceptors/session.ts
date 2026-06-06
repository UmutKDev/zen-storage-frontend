import type { InternalAxiosRequestConfig } from "axios";
import { HEADERS } from "@/config/constants";
import { getSessionToken } from "../token-sources";

/** Inject `X-Session-Id` when a session token is registered (isomorphic). */
export function sessionRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const token = getSessionToken();
  if (token) config.headers.set(HEADERS.sessionId, token);
  return config;
}

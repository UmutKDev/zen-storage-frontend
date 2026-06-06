import type { InternalAxiosRequestConfig } from "axios";
import { HEADERS } from "@/config/constants";
import { getTeamId } from "../token-sources";

/**
 * Inject `X-Team-Id` when a team workspace is active. Null in Personal — the
 * header is simply absent. Wired from Phase 0; the switch UI activates in P8.
 */
export function teamRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const teamId = getTeamId();
  if (teamId) config.headers.set(HEADERS.teamId, teamId);
  return config;
}

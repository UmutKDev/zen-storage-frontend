import type { InternalAxiosRequestConfig } from "axios";
import { HEADERS } from "@/config/constants";
import { getSecureFolderToken } from "../token-sources";

/**
 * For `/Cloud/*` requests, attach the ancestor-aware secure-folder tokens
 * (`X-Folder-Session` / `X-Hidden-Session`). The getter ships as a no-op in
 * Phase 0; Phase 5 registers the real, in-memory token source.
 */
export function secureFolderRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const url = config.url ?? "";
  if (!url.includes("/Cloud")) return config;

  const tokens = getSecureFolderToken(url);
  if (tokens?.folder) config.headers.set(HEADERS.folderSession, tokens.folder);
  if (tokens?.hidden) config.headers.set(HEADERS.hiddenSession, tokens.hidden);
  return config;
}

import type { InternalAxiosRequestConfig } from "axios";
import { HEADERS } from "@/config/constants";
import { getSecureFolderToken } from "../token-sources";

/**
 * Pull the operation's target folder path out of a `/Cloud/*` request so the
 * token source can resolve an ancestor-aware token for it. The path lives in:
 *   • the query string of GET reads (the generated client appends `?Path=…` /
 *     `?Key=…` to `config.url`), or `config.params` if axios holds it there;
 *   • the JSON body of POST/PUT/DELETE mutations (`config.data` — still the JS
 *     request model at request-interceptor time, before transformRequest).
 * A file `Key` (e.g. `a/b/file.txt`) resolves fine against an ancestor root
 * (`a`) so no parent-folder derivation is needed here. Returns `null` for
 * path-less requests (usage/quota) → no secure-folder header.
 */
function extractTargetPath(config: InternalAxiosRequestConfig): string | null {
  const url = config.url ?? "";
  const queryIndex = url.indexOf("?");
  if (queryIndex !== -1) {
    const query = new URLSearchParams(url.slice(queryIndex + 1));
    // A *present* `Path` param is the target — even when empty (`?Path=`), which
    // is the root folder, so the root listing still carries a root-scoped token.
    if (query.has("Path")) return query.get("Path") ?? "";
    const key = query.get("Key");
    if (key) return key;
  }

  const params = config.params as Record<string, unknown> | undefined;
  if (params) {
    const fromParams = params.Path ?? params.Key;
    if (typeof fromParams === "string") return fromParams;
  }

  // POST/PUT/DELETE body. The generated client **pre-serializes** the request
  // model to a JSON string before the interceptor chain runs (factories built
  // with no `configuration` → `serializeDataIfNeeded` always stringifies), so
  // `config.data` is normally a string here — parse it back. (Guard the object
  // case too, in case a caller bypasses serialization.)
  let body: unknown = config.data;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = undefined;
    }
  }
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const direct = record.Path ?? record.Key;
    if (typeof direct === "string") return direct;
    // Defensive: a nested request-model wrapper ({ xRequestModel: { Path } }).
    for (const value of Object.values(record)) {
      if (value && typeof value === "object") {
        const nested = value as Record<string, unknown>;
        const inner = nested.Path ?? nested.Key;
        if (typeof inner === "string") return inner;
      }
    }
  }

  return null;
}

/**
 * For `/Cloud/*` requests, attach the ancestor-aware secure-folder tokens
 * (`X-Folder-Session` / `X-Hidden-Session`) for the request's target path. The
 * getter ships as a no-op in Phase 0; Phase 5 registers the real, in-memory
 * token source — so this is header-free until then.
 */
export function secureFolderRequestInterceptor(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const url = config.url ?? "";
  if (!url.includes("/Cloud")) return config;

  const targetPath = extractTargetPath(config);
  if (targetPath === null) return config;

  const tokens = getSecureFolderToken(targetPath);
  if (tokens?.folder) config.headers.set(HEADERS.folderSession, tokens.folder);
  if (tokens?.hidden) config.headers.set(HEADERS.hiddenSession, tokens.hidden);
  return config;
}

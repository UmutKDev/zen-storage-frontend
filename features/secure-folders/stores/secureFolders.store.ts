/**
 * Secure-folder session tokens — two namespaces:
 *   • ENCRYPTED → header `X-Folder-Session`, minted by `Directory/Unlock`
 *   • HIDDEN    → header `X-Hidden-Session`, minted by `Directory/Reveal`
 *
 * ⚠ SECURITY (CLAUDE rule #5): only the backend-minted, **TTL-bounded session
 * token** is kept here — the **passphrase is NEVER stored** (it rides the
 * `X-Folder-Passphrase` header for one request and is dropped). Tokens persist to
 * **`sessionStorage` only** so an unlock/reveal survives a page refresh within the
 * same tab, and are pruned by expiry on rehydrate. They are tab-scoped (the
 * browser clears `sessionStorage` when the tab closes) and dropped on sign-out.
 * **No `localStorage`, no cookie, no cross-tab persistence** — the ESLint override
 * on THIS exact file (`eslint.config.mjs`) still hard-bans those; do not widen it.
 *
 * ⚠ DevTools / at-rest (accepted at MVP — secure-folder-lifecycle §16): the token
 * now sits in `sessionStorage` for the tab's lifetime, so any same-origin script
 * (bounded by the strict CSP, rule #12) or DevTools can read it while a session is
 * live. The threat is bounded (TTL-short, trusted machine, tab-scoped, passphrase
 * never stored); post-MVP we revisit a module-private + WebCrypto-wrapped store.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { isAncestor } from "@/lib/utils";

export type SecureNamespace = "encrypted" | "hidden";

interface TokenEntry {
  token: string;
  /** Unix epoch **seconds** (matches the API `ExpiresAt`). */
  expiresAt: number;
}

type NamespaceMap = Record<string, TokenEntry>;

interface SecureFoldersState {
  tokens: Record<SecureNamespace, NamespaceMap>;
  /** Store a freshly-minted token keyed by its returned root folder path. */
  setToken: (
    ns: SecureNamespace,
    rootPath: string,
    token: string,
    expiresAt: number,
  ) => void;
  /** Drop a single root's token (explicit lock / conceal). */
  clearToken: (ns: SecureNamespace, rootPath: string) => void;
  /** Drop every token in both namespaces (sign-out). */
  clearAll: () => void;
}

/** Persist key in `sessionStorage` (tab-scoped). */
const STORAGE_KEY = "secure-folder-sessions";

/** Server-side / no-`window` fallback so the persist middleware never touches an
 *  undefined `sessionStorage` during SSR (it just reads/writes nothing there). */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Drop entries whose token has already expired (epoch **seconds**). Pure — used at
 * rehydrate so a refreshed tab never resurrects a dead token into the query-key
 * fold (the interceptor getter also re-checks expiry before sending a header).
 */
export function pruneExpired(
  entries: NamespaceMap,
  nowSeconds: number,
): NamespaceMap {
  const out: NamespaceMap = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (entry.expiresAt > nowSeconds) out[key] = entry;
  }
  return out;
}

export const useSecureFoldersStore = create<SecureFoldersState>()(
  persist(
    (set) => ({
      tokens: { encrypted: {}, hidden: {} },
      setToken: (ns, rootPath, token, expiresAt) =>
        set((s) => ({
          tokens: {
            ...s.tokens,
            [ns]: { ...s.tokens[ns], [rootPath]: { token, expiresAt } },
          },
        })),
      clearToken: (ns, rootPath) =>
        set((s) => {
          const next = { ...s.tokens[ns] };
          delete next[rootPath];
          return { tokens: { ...s.tokens, [ns]: next } };
        }),
      clearAll: () => set({ tokens: { encrypted: {}, hidden: {} } }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.sessionStorage,
      ),
      // Only the token map is persisted (never the action fns); the passphrase is
      // never in this state to begin with.
      partialize: (s) => ({ tokens: s.tokens }),
      // Rehydration runs once at store creation (outside React render — the clock
      // read is fine here): drop tokens that expired while the tab was away.
      merge: (persisted, current) => {
        const saved = (persisted as { tokens?: SecureFoldersState["tokens"] })
          ?.tokens;
        if (!saved) return current;
        const now = Date.now() / 1000;
        return {
          ...current,
          tokens: {
            encrypted: pruneExpired(saved.encrypted ?? {}, now),
            hidden: pruneExpired(saved.hidden ?? {}, now),
          },
        };
      },
    },
  ),
);

/** The nearest-ancestor token resolved for a path, with the bits a caller needs
 *  to act on it: the store **key** it's filed under (the minted root path, for
 *  `clearToken`) and its `expiresAt` (to schedule the TTL re-lock). */
export interface ResolvedTokenEntry {
  key: string;
  token: string;
  /** Unix epoch **seconds**. */
  expiresAt: number;
}

/**
 * Resolve the **nearest ancestor** entry for `path` within one namespace's map —
 * the heart of ancestor-aware reuse: unlocking `a` covers `a/b/c` without
 * re-prompting. When `nowSeconds` is given, expired entries are skipped (the
 * interceptor getter passes the clock so a stale token is never sent); when it's
 * omitted, expiry is ignored (the React query-key fold only needs to react to
 * set/clear — expiry isn't a store mutation, so it can't move the key anyway,
 * and reading the clock in render is impure). Pure + `now`-injectable for tests.
 */
export function resolveTokenEntry(
  entries: NamespaceMap,
  path: string,
  nowSeconds?: number,
): ResolvedTokenEntry | null {
  let best: ResolvedTokenEntry | null = null;
  for (const [key, entry] of Object.entries(entries)) {
    if (nowSeconds !== undefined && entry.expiresAt <= nowSeconds) continue;
    if (!isAncestor(key, path)) continue;
    // Prefer the nearest ancestor (longest matching key); any valid one works.
    if (!best || key.length > best.key.length)
      best = { key, token: entry.token, expiresAt: entry.expiresAt };
  }
  return best;
}

/** Token-only variant of {@link resolveTokenEntry} — the common case (header
 *  attach, query-key fold) that only cares about the value, not its filing key. */
export function resolveToken(
  entries: NamespaceMap,
  path: string,
  nowSeconds?: number,
): string | null {
  return resolveTokenEntry(entries, path, nowSeconds)?.token ?? null;
}

/** Imperative clear-all for the sign-out teardown (also wipes `sessionStorage`
 *  via the persist middleware). */
export function clearAllSecureFolderTokens(): void {
  useSecureFoldersStore.getState().clearAll();
}

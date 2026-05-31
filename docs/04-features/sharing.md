# Feature — Sharing 🟢 (presigned URL — the sharing mechanism)

> Let a user share a file. **Decided ([Q1](../07-decisions/open-questions.md) resolved):** sharing is done with
> **`GET /Api/Cloud/PresignedUrl`** — that endpoint *is* the share mechanism. There is **no separate share‑link backend
> planned**; advanced link management (custom permissions, revoke, public ACL) is **out of scope** unless requested
> later.

## How it works (MVP, ships now)
- **Where:** Share button in the preview toolbar ([preview](./preview.md)) + item/row menu.
- **How:** `Cloud/PresignedUrl` → a signed, **time‑limited** URL (served from `cdn.storage.umutk.me`, HMAC‑signed via
  rustfs) → **Web Share API** (mobile/supported) or **copy to clipboard**.
- **Communicate the TTL:** the link expires; say so ("link valid for a limited time"). The expiry is **inherent to the
  presigned URL** — there's no separate expiry/permission UI because the model is a direct signed link, by design.
- **Components:** `ShareButton`, `ShareSheet` (glass `glass-overlay`) with copy + Web Share; success toast.
- **Endpoints:** `Cloud/PresignedUrl` ✅ (only). Do **not** invent share endpoints.
- One `useShare` hook funnels it (single place to extend if the model ever changes).

## States (matrix)
generating link (loading) · copied (success toast) · share unsupported (fallback to copy) · AV‑infected (block share of
an infected file) · expired‑link awareness. See [state-matrix](../02-architecture/state-matrix.md).

## Not planned (unless requested)
Managed share links with user‑set permissions (view vs download), revoke, link lists, or public‑anyone ACLs. The
presigned URL is a direct signed link with a built‑in TTL — that's the intended sharing model. If richer sharing is
wanted later, it becomes a new backend feature + a `ShareSheet` extension.

## Honesty rule
Label it as a **time‑limited link**, not a managed share with permissions the user controls — because that's exactly
what it is.

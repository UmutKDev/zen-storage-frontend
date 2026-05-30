# DECISIONS.md

> Decisions log + open questions for v2. **D#** = decided, **Q#** = open. Locked decisions from INIT.md §0.5 are
> recorded as decided. New answers from the planning round are D-A1..A4.

## Decided

### Locked (INIT.md §0.5 / §0.6 / §0.7)
| # | Decision |
|---|---|
| D1 | **Design:** premium feel on shadcn/ui + Tailwind v4; **framer-motion** motion system designed in Phase 0 (variants, duration/easing tokens, `prefers-reduced-motion`). Pull primitives via the **shadcn MCP**, then customize (don't fork gratuitously). |
| D2 | **Auth model:** session-based (session id via cookie / `X-Session-Id`), **no refresh token to the client**. Ignore the v2 scaffold README. |
| D3 | **MVP scope:** Personal end-to-end first; **Teams is the LAST phase**. Architect team-ready (`X-Team-Id`, storage owner, query keys) but build no team UI early. |
| D4 | **Trash:** not in API yet → **not in MVP**; design delete UX so trash/restore can slot in later. |
| D5 | **Multi-select + bulk** (delete/move/download) + **drag-and-drop move** (dnd-kit). |
| D6 | **Theme:** light/dark toggle (system preference). |
| D7 | **i18n:** two languages planned, **English-only at MVP**; structure now, **no hardcoded copy** (all via keys). |
| D8 | **Search scope:** global vs current folder, **user chooses, default current** (API `Cloud/Search` has Path + Extension filters — verified). |
| D9 | **Notifications:** unobtrusive **toasts** + a **notification inbox** with history (socket gateway + `Notification/History` — verified). |
| D10 | **Pricing:** a page in **"coming soon"** style — show plans (from `Subscription/My` / plan list) but no checkout in MVP. |
| D11 | **API/data layer:** every call via generated **factories**; every DTO from generated **models**; generated client is build output (**never hand-edit**); one improved **axios `Instance`** centralizes auth/team/folder headers, idempotency, envelope unwrap, typed errors/toasts, `401→re-auth`, timeouts/retry/`AbortSignal`. |

### Answered this round
| # | Question | Decision |
|---|---|---|
| D-A1 | How to do **Share** (API has none)? | **Build on `GET /Cloud/PresignedUrl`** — generate a time-limited presigned URL and Web-Share / copy-to-clipboard. Keep a Share affordance in the preview toolbar. A real share-link backend (expiry policy / permissions / public ACL) is **future work** → see Q1. |
| D-A2 | Default **conflict** strategy? | **Prompt** with one reusable dialog; **apply-to-all** for bulk. No silent overwrites. Strategies: `FAIL/REPLACE/SKIP/KEEP_BOTH`. |
| D-A3 | **Long-job** progress transport? | **Socket-first** (`/notifications` gateway) with **status-polling fallback** (archive create/extract, duplicate scan). |
| D-A4 | **Auth** library on Next 16.2? | **Auth.js v5 (NextAuth)** credentials, mirroring the old multi-step flow. Verify Next 16.2/React 19 compat in Phase 0; thin custom cookie-session is the fallback if blocked. |

## Open questions
| # | Question | Why it matters | Default / proposal | Status |
|---|---|---|---|---|
| Q1 | Is a **real sharing backend** (link with expiry / permissions / public access) planned on the API? | Determines whether v2 preview should leave room beyond presigned-URL copy. | Assume presigned-URL only for MVP; design Share UI to extend later. | **UNVERIFIED** — none exists today (exhaustive grep). Ask API team. |
| Q2 | **Webhook HMAC** enforcement? | Only the developer API/Webhooks surface (post-MVP). | Defer; surface in Account ▸ API Keys later. | **UNVERIFIED** — `HmacRequired`/tier hints found, no enforcement in controllers. |
| Q3 | **Large-folder** strategy: virtualization + infinite scroll? | Performance on big folders. | **Yes** — `@tanstack/react-virtual` + infinite query (envelope carries `Skip/Take/Count`). | Proposed; confirm in Phase 3. |
| Q4 | **Preview coverage** at MVP — audio? office docs? | Scope of Phase 4 preview. | Image / video / text-code / PDF **in**; audio + office **out** of MVP. | Proposed; confirm in Phase 4. |
| Q5 | **CDN resizing** — does CloudFront honor `?w=&h=`? | Image scaled rendering + scaled-vs-original download. | Assume yes (old frontend did). | **UNVERIFIED** — infra check at Phase 4. |
| Q6 | **Pricing data source** for the "coming soon" page — is a public plan-list endpoint exposed, or admin-only? | What the Pricing page renders. | Use `Subscription/My` + static plan cards if no public list. | Confirm in Phase 7. |
| Q7 | **Avatar upload** response shape (`Account/Upload/Image`)? | Profile rendering after upload. | Re-fetch profile after upload. | **UNVERIFIED** — confirm at Phase 2. |

## Notes / verified facts worth pinning
- **Global prefix `/Api`** + **URI versioning**: session app `/Api/Cloud/*`, API-key `/Api/v1/*`, notifications REST `/Api/v1/Notification/*` (`src/main.ts`).
- **Envelope** `{ Result, Status }`, arrays carry `Options.Count` (`transform.interceptor.ts`).
- **Storage owner** `user.Id` vs `team/{TeamId}` (`cloud.context.ts`).
- **Secure-folder tokens**: minted by `Directory/Unlock`/`Reveal` with `{SessionToken,ExpiresAt,TTL}`, replayed via `X-Folder-Session`/`X-Hidden-Session`, ancestor-applicable.
- **Document lock** TTL 5 min (+heartbeat); **draft** throttle 1/10s + S3 backup every 5th.
- **Quota** socket warnings at 80/90/100% (`cloud.usage.service.ts`); upload pre-flight blocks on max-size/quota.

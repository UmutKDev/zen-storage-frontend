# API — Developer API (`/Api/v1/*`, API‑key) + misc

> Post‑MVP reference. Files: `src/modules/api/controllers/*`. Guards: `ApiAuthGuard`, `ApiScopeGuard`
> (READ/WRITE/DELETE/ADMIN), `ApiQuotaGuard`, `ApiRateLimitGuard`. Back to [API index](../API-INVENTORY.md).

## Developer API (API‑key auth: `x-api-key` + `x-api-secret`)
Controllers: `api-storage`, `api-upload`, `api-download`, `api-directory`, `api-usage`, `api-webhook`.

| Area | Endpoints (shape) |
|---|---|
| Storage | List / Find / Search / Move / Delete |
| Upload | CreateMultipart / GetPartUrl(s) / Complete / Abort |
| Download | stream (subscription‑throttled) |
| Directory | create / delete |
| Usage | Usage / Current |
| Webhooks | CRUD / Test / Deliveries — **5‑stage retry**; HMAC for some tiers **`UNVERIFIED`** ([Q2](../../07-decisions/open-questions.md)) |

> Not needed for the user‑facing MVP. Relevant to the **Account ▸ API Keys** surface (scaffolded, post‑MVP) and a future
> developer page. Idempotency via `@Idempotent()` + Redis (24h).

## Misc controllers (not MVP)
| Controller | Path | Note |
|---|---|---|
| User | `/Api/User/*` | platform‑admin CRUD; not MVP |
| Definition | `/Api/Definition/*` | lookup groups; Find endpoints are stubs (**`UNVERIFIED`**/incomplete) |
| Health | `/Api/Health` | `@Public` health check |
| Core | `@Controller()` → `/Api` | root/info endpoint |

# API — Subscription

> Files: `subscription.user.controller.ts` (user), `subscription.controller.ts` (admin) → `/Api/Subscription/*`.
> Back to [API index](../API-INVENTORY.md). Feature: [account](../../04-features/account.md), [public](../../04-features/public.md).

| Method | Path | Request | Response | Audience |
|---|---|---|---|---|
| GET | `/My` | — | `UserSubscriptionResponseModel \| null` | **user** (Pricing/plan view) |
| POST | `/My/Subscribe` | `SubscribeRequestModel` (SubscriptionId, IsTrial) | `boolean` | user (post‑MVP / "coming soon") |
| DELETE | `/My/Unsubscribe` | — | `boolean` | user |
| GET | `/List` · `/Find/:id` · POST `/Create` · PUT `/Edit/:id` · DELETE `/Delete/:id` · POST `/Assign` · DELETE `/Unsubscribe/:id` | | | **admin** (Manage Subscription) |

## Plan entity (`subscription.entity.ts`)
`Id, Name, Slug, Description?, Price(cents), Currency, BillingCycle, StorageLimitBytes(bigint; **0 = unlimited**),
MaxUploadSizeBytes?, MaxObjectCount?, Features(JSON e.g. {downloadSpeedBytesPerSec}), Status`.

- Download speed by `Features.downloadSpeedBytesPerSec` → slug default (free 50KB/s, pro 500KB/s, enterprise 5MB/s) →
  50KB/s fallback (`cloud.usage.service.ts`).

## MVP usage
- **Account ▸ Subscription** shows `Subscription/My` (read‑only).
- **Pricing page** is "coming soon": shows plans, **no checkout**. Whether a **public** plan‑list endpoint exists (vs
  admin‑only `List`) is **open** ([Q6](../../07-decisions/open-questions.md)) — fall back to static cards.

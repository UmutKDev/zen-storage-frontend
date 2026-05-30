# Open Questions

> Unresolved questions, each with **why it matters**, a **default/proposal**, the **owner**, and the **phase to
> resolve**. Decided items live in [DECISIONS.md](./DECISIONS.md). `UNVERIFIED` = not provable from code today.

| # | Question | Why it matters | Default / proposal | Owner | Resolve by | Status |
|---|---|---|---|---|---|---|
| **Q1** | Is a **real sharing backend** (link with expiry / permissions / public access) planned? | Whether v2 preview should leave room beyond presigned‑URL copy. | Presigned‑URL only for MVP; design Share UI to extend later. | API team | Phase 4 | **UNVERIFIED** — none exists (exhaustive grep). |
| **Q2** | **Webhook HMAC** enforcement? | Only the developer API/Webhooks surface (post‑MVP). | Defer; surface in Account ▸ API Keys later. | API team | post‑MVP | **UNVERIFIED** — `HmacRequired`/tier hints found, no enforcement in controllers. |
| **Q3** | **Large‑folder** strategy: virtualization + infinite scroll? | Performance on big folders. | **Yes** — `@tanstack/react-virtual` + infinite query (envelope `Skip/Take/Count`). | FE | Phase 3 | Proposed; confirm in Phase 3. |
| **Q4** | **Preview coverage** at MVP — audio? office docs? | Scope of Phase 4 preview. | Image / video / text‑code / PDF **in**; audio + office **out**. | FE/product | Phase 4 | Proposed; confirm in Phase 4. |
| **Q5** | **CDN resizing** — does CloudFront honor `?w=&h=`? | Image scaled rendering + scaled‑vs‑original download. | Assume yes (old frontend did); **fall back to original** if not. | Infra | Phase 4 | **UNVERIFIED** — infra check. |
| **Q6** | **Pricing data source** for "coming soon" — public plan‑list endpoint, or admin‑only? | What the Pricing page renders. | `Subscription/My` + static cards if no public list. | API team | Phase 7 | Open. |
| **Q7** | **Avatar upload** response shape (`Account/Upload/Image`)? | Profile rendering after upload. | Re‑fetch profile after upload. | API team | Phase 2 | **UNVERIFIED**. |
| **Q8** | **`Options.Count` surfacing** to list hooks (meta channel vs list wrapper)? | Clean pagination/virtualization ergonomics. | Decide a single mechanism in the Instance. | FE | Phase 3 | Open (impl detail). |
| **Q9** | **Preview routing**: intercepting route vs query‑param modal under Next 16.2? | Deep‑linking + arrow‑nav implementation. | Pick after reading bundled Next docs; both satisfy requirements. | FE | Phase 4 | Open. |

## How to use this file
- When a question is answered, **move it to [DECISIONS.md](./DECISIONS.md)** (as a D‑entry) and link the commit/phase.
- New questions discovered during implementation get added here with the same columns.
- `UNVERIFIED` items must be resolved **before** any feature relies on the unproven behavior.

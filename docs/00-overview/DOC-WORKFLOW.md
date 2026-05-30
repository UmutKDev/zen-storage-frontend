# Doc Workflow — how to read & maintain these docs

> These are **living documents**. They are only useful if they stay true. This file defines how we read them during
> implementation and how we keep them accurate.

## The mental model

```
00-overview     →  why + vocabulary + rules        (rarely changes)
01-roadmap      →  order + phase checklists         (changes every phase)
02-architecture →  how it's wired                   (changes when a pattern changes)
03-design-system→  how it looks/moves               (changes when tokens/variants change)
04-features     →  screen-level specs               (changes as features are refined)
05-api          →  the contract                     (changes only when the backend changes)
06-cross-cutting→  i18n / a11y / perf / testing / seo
07-decisions    →  the record of every fork
```

## Reading order for a newcomer

1. [`PROJECT-OVERVIEW.md`](./PROJECT-OVERVIEW.md) — the product and the three code layers.
2. [`GLOSSARY.md`](./GLOSSARY.md) + [`CONVENTIONS.md`](./CONVENTIONS.md) — vocabulary and rules.
3. [`../01-roadmap/ROADMAP.md`](../01-roadmap/ROADMAP.md) — the plan and where we are.
4. [`../02-architecture/ARCHITECTURE.md`](../02-architecture/ARCHITECTURE.md) — how the app is built.
5. Then dive into whichever phase/feature you're implementing.

## The phase workflow (how implementation proceeds)

We move **one phase at a time**, in order. For each phase:

1. **Kickoff.** Open `01-roadmap/phases/phase-N-*.md`. It lists the in‑scope feature specs, architecture concerns, and
   design pieces, plus the acceptance‑test checklist.
2. **Gather context.** Follow the links: each task points to its [feature spec](../04-features/), the
   [architecture concern](../02-architecture/) it relies on, the [design](../03-design-system/) it must match, and the
   [endpoints](../05-api/) it calls. Don't re‑derive conventions.
3. **Build.** Implement task by task. Tick `- [ ]` → `- [x]` in the phase file as you go.
4. **Verify.** Run the phase's acceptance‑test checklist. A phase is **not done** until every item passes.
5. **Record.** Update [`STATUS.md`](../01-roadmap/STATUS.md) and add one line to the
   [ROADMAP changelog](../01-roadmap/ROADMAP.md#changelog). If you made a decision, log it in
   [`DECISIONS.md`](../07-decisions/DECISIONS.md); if you discovered a question, add it to
   [`open-questions.md`](../07-decisions/open-questions.md).

> We do not start a phase's code until the previous phase's exit criteria are met **or** the user explicitly approves
> parallel work. The user drives with "implement Phase X".

## Update rules (important)

- **Edit, don't rewrite.** Change the relevant section in place. Wholesale rewrites lose history and break links.
- **One fact, one home.** A fact lives in exactly one canonical doc; everywhere else **links** to it. (E.g. endpoint
  contracts live only in `05-api`; features link to them.)
- **Mark uncertainty.** Anything not provable from code is **`UNVERIFIED`** and gets an entry in `open-questions.md`.
- **Keep the changelog.** Material changes get a dated line in the ROADMAP changelog.
- **Cross‑link generously.** New content should link up (to architecture/design) and down (to API), so the graph stays
  navigable.
- **Status legend** (used in ROADMAP/STATUS and phase files): ⏳ not started · 🚧 in progress · ✅ done · 🚫 blocked.

## Anatomy of each doc type

- **Phase file** — objective; in/out scope; task breakdown (checkboxes, grouped); dependencies; endpoints used;
  acceptance‑test checklist; risks + mitigations; rollback; exit criteria; links.
- **Architecture concern** — the decision, the design, the data/sequence flow, the contract it depends on, edge cases,
  and the open questions it carries.
- **Design doc** — principles, tokens/values, usage do/don't, and how it maps to Tailwind/shadcn/framer‑motion.
- **Feature spec** — screen(s) & layout, components, endpoints, the full state matrix for that surface, keyboard &
  interaction notes, edge cases, and phase tag.
- **API module doc** — endpoints (method/path/request/response), headers/auth/CASL, key model fields, error codes,
  and notes — each traceable to a controller file path.

## Where things live (quick index)

| Need | File |
|---|---|
| Endpoint contract | [`../05-api/API-INVENTORY.md`](../05-api/API-INVENTORY.md) → `modules/*` |
| Query‑key shape | [`../02-architecture/state-management.md`](../02-architecture/state-management.md) |
| A color/spacing/motion value | [`../03-design-system/`](../03-design-system/DESIGN-SYSTEM.md) |
| Why we chose X | [`../07-decisions/DECISIONS.md`](../07-decisions/DECISIONS.md) |
| What "done" means | [`CONVENTIONS.md`](./CONVENTIONS.md#9-definition-of-done-for-a-task) |
| The states a surface must handle | [`../02-architecture/state-matrix.md`](../02-architecture/state-matrix.md) |

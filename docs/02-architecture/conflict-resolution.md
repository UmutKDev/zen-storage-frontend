# Conflict Resolution

> One reusable pattern for **every** name clash: upload, create, move, rename. **Decided: prompt + apply‑to‑all**
> (no silent overwrites). See [DECISIONS](../07-decisions/DECISIONS.md) D‑A2.

## 1. Strategies (backend `ConflictStrategy`)

| Strategy | Effect |
|---|---|
| `FAIL` | reject the op on a clash (default backend behavior if unspecified) |
| `REPLACE` | overwrite the existing item |
| `SKIP` | keep existing, skip the new one |
| `KEEP_BOTH` | write the new one under a non‑clashing name |

## 2. The pattern

- A single **`ConflictDialog` + `useConflictResolution` hook** is the only place clashes are handled. Features call it;
  they don't implement ad‑hoc clash logic.
- On a clash, the backend returns **409** with `ConflictDetailsResponseModel`. The [Instance](./data-layer.md) **passes
  409 through** (it's not a generic error), and the feature opens the dialog.
- The dialog offers the four strategies, defaulting to a safe choice, and re‑issues the op with the chosen
  `ConflictStrategy`.

## 3. Bulk operations — apply‑to‑all

```
bulk move/upload of N items
  → first clash opens the dialog with an "apply to all" checkbox
  → user picks strategy (+ apply-to-all)
  → remembered choice auto-resolves the rest of THIS batch
  → next batch starts fresh
```

This avoids N prompts while never silently overwriting.

## 4. Where it's used
- **Upload** (`CreateMultipartUpload` clash, or on completion) — see [upload-pipeline](./upload-pipeline.md).
- **Create** folder/file (`Cloud/Directory`, `Cloud/Documents`).
- **Move** (`Cloud/Move`).
- **Rename** (`Cloud/Update`, `Cloud/Directory/Rename`).
- **Archive extract** output clashes ([Phase 6](../01-roadmap/phases/phase-6-advanced.md)).

## 5. Rules
- **No silent overwrites by default** — `REPLACE` is always an explicit user choice.
- The dialog copy is i18n‑keyed and explains each option's consequence.
- Optimistic UI waits for conflict resolution before committing the cache change for the clashing item.

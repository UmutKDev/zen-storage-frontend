import { isApiError } from "@/lib/api";
import type {
  ConflictDetailsResponseModel,
  ConflictResolutionModelStrategyEnum,
} from "@/service/models";

/** Backend conflict strategies (the generated enums all share this literal set). */
export type ConflictStrategy = ConflictResolutionModelStrategyEnum;

/**
 * Pull conflict details out of a 409 `ApiError`. The backend wraps the
 * `ConflictDetailsResponseModel` in `Status.Messages[0]` (verified against the
 * old frontend + backend). Returns `null` when the error isn't a conflict; for
 * a conflict with no parseable details, returns an empty shell so the prompt
 * can still open with generic copy.
 */
export function extractConflictDetails(
  error: unknown,
): ConflictDetailsResponseModel | null {
  if (!isApiError(error) || error.code !== "CONFLICT") return null;
  const raw = error.raw as { Status?: { Messages?: unknown[] } } | undefined;
  const first = raw?.Status?.Messages?.[0];
  if (first && typeof first === "object" && "Conflicts" in first) {
    return first as ConflictDetailsResponseModel;
  }
  return { Conflicts: [], TotalItems: 0, ConflictCount: 0 };
}

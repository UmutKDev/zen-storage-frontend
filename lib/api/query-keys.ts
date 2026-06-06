/**
 * Team-aware query-key factory. Every cached resource is keyed under a **scope**
 * — the `ownerId` (`user.Id` in Personal, `team/{TeamId}` in a team workspace).
 * Switching workspace therefore swaps the whole cache namespace for free.
 *
 * Usage: `scopedKey(ownerId, 'storage', 'folder', path)`.
 */
export type QueryScope = string;

export function scopedKey(
  scope: QueryScope,
  ...parts: ReadonlyArray<unknown>
): readonly unknown[] {
  return [scope, ...parts];
}

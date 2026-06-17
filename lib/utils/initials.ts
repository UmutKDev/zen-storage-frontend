/**
 * Up-to-two-letter initials for an avatar fallback, derived from a name or
 * email. `"Ada Lovelace"` → `"AL"`, `"ada@x.com"` → `"A"`. Empty → `"?"`.
 */
export function getInitials(nameOrEmail: string | null | undefined): string {
  const value = nameOrEmail?.trim();
  if (!value) return "?";
  const local = value.includes("@") ? value.split("@")[0] : value;
  const parts = local.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

import en from "./dictionaries/en.json";

/**
 * Minimal translation lookup. `t('common.retry')` resolves a dot path in the EN
 * dictionary. A missing key dev-warns and returns the key itself so the UI never
 * crashes on a typo. A real i18n runtime (interpolation, plurals, locale switch)
 * can replace this without changing call sites.
 */
export function t(key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc != null && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      en,
    );

  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] missing or non-string key: "${key}"`);
    }
    return key;
  }

  return value;
}

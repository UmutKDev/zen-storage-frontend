/** Supported locales. EN only at MVP; the structure is ready for a second. */
export const locales = ["en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

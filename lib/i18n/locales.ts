/**
 * Bilingual shell configuration.
 *
 * Per spec: V1 must support both Russian and English in the shell. The default
 * locale is read from `DEFAULT_LOCALE` and falls back to `ru`.
 */

export const SUPPORTED_LOCALES = ["ru", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = ((): Locale => {
  const raw = process.env.DEFAULT_LOCALE?.toLowerCase();
  return raw === "en" ? "en" : "ru";
})();

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ru" || value === "en";
}

import "server-only";

import { cookies } from "next/headers";

import { LOCALE_COOKIE } from "@/lib/i18n/cookie-client";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locales";

export { LOCALE_COOKIE };

export async function readLocaleFromCookies(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

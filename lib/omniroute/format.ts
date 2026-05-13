import type { Locale } from "@/lib/i18n/locales";

/**
 * Locale-aware presentation helpers for OmniRoute UI.
 * Kept tiny on purpose — we render numbers, durations, and relative times
 * in the same handful of places across overview / providers / live-runs.
 */

const LOCALE_TAG: Record<Locale, string> = { ru: "ru-RU", en: "en-US" };

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], options).format(value);
}

export function formatDuration(ms: number, locale: Locale): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return locale === "ru" ? `${minutes} мин ${seconds} с` : `${minutes}m ${seconds}s`;
}

export function formatPercent(ratio: number | null | undefined, locale: Locale): string {
  if (ratio == null) return "—";
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: "percent",
    maximumFractionDigits: ratio >= 0.999 ? 2 : 1,
  }).format(ratio);
}

export function formatTimestamp(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(d);
}

const REL_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.345],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

export function formatRelative(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffSeconds = Math.round((d.getTime() - Date.now()) / 1000);
  let value = diffSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";
  for (const [u, divisor] of REL_UNITS) {
    if (Math.abs(value) < divisor) {
      unit = u;
      break;
    }
    value = Math.round(value / divisor);
  }
  return new Intl.RelativeTimeFormat(LOCALE_TAG[locale], { numeric: "auto" }).format(value, unit);
}

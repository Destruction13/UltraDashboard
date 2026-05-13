import { Cable, Search } from "lucide-react";

import { HealthPill } from "@/components/omniroute/health-pill";
import { OmniRouteOfflineBanner } from "@/components/omniroute/offline-banner";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getOmniRouteDictionary } from "@/lib/omniroute/dictionaries";
import { formatNumber, formatRelative, formatTimestamp } from "@/lib/omniroute/format";
import { checkOmniRouteAvailable, listProviders } from "@/lib/omniroute/repository";
import type { OmniRouteHealthStatus } from "@/lib/omniroute/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  provider?: string;
  health?: string;
  isActive?: string;
  limit?: string;
  offset?: string;
}

const HEALTHS: OmniRouteHealthStatus[] = ["active", "degraded", "rate_limited", "error", "unknown"];

export default async function OmniRouteProvidersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const locale = await readLocaleFromCookies();
  const copy = getOmniRouteDictionary(locale);

  const availability = checkOmniRouteAvailable();
  const limit = clampInt(params.limit, 25, 1, 500);
  const offset = clampInt(params.offset, 0, 0, 1_000_000);

  const isActiveParam =
    params.isActive === "true"
      ? true
      : params.isActive === "false"
        ? false
        : undefined;

  const health = HEALTHS.includes(params.health as OmniRouteHealthStatus)
    ? (params.health as OmniRouteHealthStatus)
    : undefined;

  const { items, total } = listProviders({
    q: params.q?.trim() || undefined,
    provider: params.provider?.trim() || undefined,
    health,
    isActive: isActiveParam,
    limit,
    offset,
  });

  // Distinct provider families for the filter dropdown — sourced from the same query.
  const providerOptions = Array.from(
    new Set(
      listProviders({ limit: 500 }).items.map((row) => row.provider),
    ),
  ).sort();

  return (
    <div className="flex flex-col gap-6">
      {!availability.available ? (
        <OmniRouteOfflineBanner copy={copy.banner} storagePath={process.env.OMNIROUTE_SQLITE_PATH ?? null} />
      ) : null}

      <SectionHeader
        eyebrow={copy.providers.eyebrow}
        title={copy.providers.eyebrow}
        description={copy.providers.description}
      />

      <GlassPanel className="p-4">
        <form
          method="get"
          className="flex flex-wrap items-end gap-3 text-sm"
          aria-label={copy.providers.eyebrow}
        >
          <label className="flex flex-1 min-w-[220px] flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.providers.filters.searchPlaceholder}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder={copy.providers.filters.searchPlaceholder}
                className="w-full rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[hsl(var(--shader-b)/0.6)]"
              />
            </div>
          </label>
          <label className="flex w-44 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.providers.columns.provider}
            </span>
            <select
              name="provider"
              defaultValue={params.provider ?? ""}
              className="rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--shader-b)/0.6)]"
            >
              <option value="">{copy.providers.filters.allProviders}</option>
              {providerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-44 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.providers.columns.health}
            </span>
            <select
              name="health"
              defaultValue={params.health ?? ""}
              className="rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--shader-b)/0.6)]"
            >
              <option value="">{copy.providers.filters.allHealths}</option>
              {HEALTHS.map((h) => (
                <option key={h} value={h}>
                  {copy.providers.health[h]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-52 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.providers.filters.activeOnly}
            </span>
            <select
              name="isActive"
              defaultValue={params.isActive ?? ""}
              className="rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--shader-b)/0.6)]"
            >
              <option value="">{copy.providers.filters.includeInactive}</option>
              <option value="true">{copy.providers.filters.activeOnly}</option>
              <option value="false">{copy.providers.inactive}</option>
            </select>
          </label>
          <input type="hidden" name="limit" value={String(limit)} />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.7)] px-4 text-sm font-medium transition-colors hover:bg-[hsl(var(--card)/0.9)]"
          >
            <Cable className="h-4 w-4" />
            {copy.shared.refresh}
          </button>
        </form>
      </GlassPanel>

      <GlowCard scaleOnHover={false} innerClassName="p-0">
        {items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            {copy.providers.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <tr className="border-b border-[hsl(var(--glass-stroke)/0.55)]">
                  <th className="px-5 py-3 text-left">{copy.providers.columns.account}</th>
                  <th className="px-5 py-3 text-left">{copy.providers.columns.provider}</th>
                  <th className="px-5 py-3 text-left">{copy.providers.columns.health}</th>
                  <th className="px-5 py-3 text-right">{copy.providers.columns.priority}</th>
                  <th className="px-5 py-3 text-left">{copy.providers.columns.group}</th>
                  <th className="px-5 py-3 text-left">{copy.providers.columns.lastUsed}</th>
                  <th className="px-5 py-3 text-left">{copy.providers.columns.lastError}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[hsl(var(--glass-stroke)/0.3)] last:border-b-0 hover:bg-[hsl(var(--card)/0.45)]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{row.displayName}</span>
                        {row.email && row.email !== row.displayName ? (
                          <span className="text-xs text-muted-foreground">{row.email}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="sky" className="text-[10px]">
                        {row.provider}
                      </Badge>
                      {row.authType ? (
                        <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          {row.authType}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <HealthPill
                          status={row.health}
                          label={copy.providers.health[row.health]}
                          hint={row.lastError ?? undefined}
                        />
                        {!row.isActive ? (
                          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            {copy.providers.inactive}
                          </span>
                        ) : null}
                        {row.rateLimitedUntil ? (
                          <span className="text-[11px] text-[hsl(var(--tag-amber))]">
                            {copy.providers.rateLimitedUntil}{" "}
                            {formatRelative(row.rateLimitedUntil, locale)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatNumber(row.priority, locale)}
                      {row.backoffLevel ? (
                        <span className="ml-1 text-xs text-[hsl(var(--tag-amber))]">
                          ↑{row.backoffLevel}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">{row.group ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {row.lastUsedAt
                        ? formatRelative(row.lastUsedAt, locale)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 max-w-[280px] text-xs">
                      {row.lastError ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="truncate text-[hsl(var(--tag-rose))]" title={row.lastError}>
                            {row.lastError}
                          </span>
                          {row.lastErrorAt ? (
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimestamp(row.lastErrorAt, locale)}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>

      <PaginationFooter
        locale={locale}
        copy={copy}
        total={total}
        shown={items.length}
        limit={limit}
        offset={offset}
        params={params}
      />
    </div>
  );
}

function PaginationFooter({
  locale,
  copy,
  total,
  shown,
  limit,
  offset,
  params,
}: {
  locale: "ru" | "en";
  copy: ReturnType<typeof getOmniRouteDictionary>;
  total: number;
  shown: number;
  limit: number;
  offset: number;
  params: SearchParams;
}) {
  const text = copy.shared.rowsCount
    .replace("{shown}", formatNumber(shown, locale))
    .replace("{total}", formatNumber(total, locale));

  const baseQuery = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === "offset" || k === "limit") continue;
    if (typeof v === "string" && v.length > 0) baseQuery.set(k, v);
  }
  baseQuery.set("limit", String(limit));
  const prevOffset = Math.max(0, offset - limit);
  const nextOffset = offset + limit;

  const prevHref =
    offset === 0
      ? null
      : `?${new URLSearchParams({ ...Object.fromEntries(baseQuery), offset: String(prevOffset) }).toString()}`;
  const nextHref =
    nextOffset >= total
      ? null
      : `?${new URLSearchParams({ ...Object.fromEntries(baseQuery), offset: String(nextOffset) }).toString()}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <span>{text}</span>
      <div className="flex items-center gap-2">
        <a
          aria-disabled={!prevHref}
          href={prevHref ?? "#"}
          className={`rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] px-3 py-1.5 transition-colors ${
            prevHref
              ? "hover:bg-[hsl(var(--card)/0.7)]"
              : "pointer-events-none opacity-40"
          }`}
        >
          {locale === "ru" ? "← Назад" : "← Prev"}
        </a>
        <a
          aria-disabled={!nextHref}
          href={nextHref ?? "#"}
          className={`rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] px-3 py-1.5 transition-colors ${
            nextHref
              ? "hover:bg-[hsl(var(--card)/0.7)]"
              : "pointer-events-none opacity-40"
          }`}
        >
          {locale === "ru" ? "Дальше →" : "Next →"}
        </a>
      </div>
    </div>
  );
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

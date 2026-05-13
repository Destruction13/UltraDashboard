import { Activity, Search } from "lucide-react";

import { OmniRouteOfflineBanner } from "@/components/omniroute/offline-banner";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getOmniRouteDictionary } from "@/lib/omniroute/dictionaries";
import {
  formatDuration,
  formatNumber,
  formatRelative,
  formatTimestamp,
} from "@/lib/omniroute/format";
import { checkOmniRouteAvailable, listLiveRuns, listProviders } from "@/lib/omniroute/repository";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  provider?: string;
  status?: string;
  errorsOnly?: string;
  limit?: string;
  offset?: string;
}

const STATUS_OPTIONS = ["2xx", "4xx", "5xx"] as const;

export default async function OmniRouteLiveRunsPage({
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

  let statusFilter: "2xx" | "4xx" | "5xx" | number | undefined;
  if (params.status && STATUS_OPTIONS.includes(params.status as (typeof STATUS_OPTIONS)[number])) {
    statusFilter = params.status as "2xx" | "4xx" | "5xx";
  } else if (params.status && /^\d{3}$/.test(params.status)) {
    statusFilter = Number.parseInt(params.status, 10);
  }

  const { items, total } = listLiveRuns({
    q: params.q?.trim() || undefined,
    provider: params.provider?.trim() || undefined,
    statusFilter,
    errorsOnly: params.errorsOnly === "true",
    limit,
    offset,
  });

  const providerOptions = Array.from(
    new Set(listProviders({ limit: 500 }).items.map((row) => row.provider)),
  ).sort();

  return (
    <div className="flex flex-col gap-6">
      {!availability.available ? (
        <OmniRouteOfflineBanner
          copy={copy.banner}
          storagePath={process.env.OMNIROUTE_SQLITE_PATH ?? null}
        />
      ) : null}

      <SectionHeader
        eyebrow={copy.liveRuns.eyebrow}
        title={copy.liveRuns.eyebrow}
        description={copy.liveRuns.description}
      />

      <GlassPanel className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.liveRuns.filters.searchPlaceholder}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder={copy.liveRuns.filters.searchPlaceholder}
                className="w-full rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[hsl(var(--shader-b)/0.6)]"
              />
            </div>
          </label>
          <label className="flex w-44 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.liveRuns.columns.provider}
            </span>
            <select
              name="provider"
              defaultValue={params.provider ?? ""}
              className="rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--shader-b)/0.6)]"
            >
              <option value="">{copy.liveRuns.filters.allProviders}</option>
              {providerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-48 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.liveRuns.columns.status}
            </span>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--shader-b)/0.6)]"
            >
              <option value="">{copy.liveRuns.filters.allStatuses}</option>
              <option value="2xx">{copy.liveRuns.filters.success}</option>
              <option value="4xx">{copy.liveRuns.filters.clientError}</option>
              <option value="5xx">{copy.liveRuns.filters.serverError}</option>
            </select>
          </label>
          <label className="flex w-44 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.liveRuns.filters.errorsOnly}
            </span>
            <select
              name="errorsOnly"
              defaultValue={params.errorsOnly === "true" ? "true" : ""}
              className="rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--shader-b)/0.6)]"
            >
              <option value="">{copy.liveRuns.filters.showAll}</option>
              <option value="true">{copy.liveRuns.filters.errorsOnly}</option>
            </select>
          </label>
          <input type="hidden" name="limit" value={String(limit)} />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.7)] px-4 text-sm font-medium transition-colors hover:bg-[hsl(var(--card)/0.9)]"
          >
            <Activity className="h-4 w-4" />
            {copy.shared.refresh}
          </button>
        </form>
      </GlassPanel>

      <GlowCard scaleOnHover={false} innerClassName="p-0">
        {items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            {copy.liveRuns.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <tr className="border-b border-[hsl(var(--glass-stroke)/0.55)]">
                  <th className="px-5 py-3 text-left">{copy.liveRuns.columns.timestamp}</th>
                  <th className="px-5 py-3 text-left">{copy.liveRuns.columns.method}</th>
                  <th className="px-5 py-3 text-left">{copy.liveRuns.columns.path}</th>
                  <th className="px-5 py-3 text-right">{copy.liveRuns.columns.status}</th>
                  <th className="px-5 py-3 text-left">{copy.liveRuns.columns.model}</th>
                  <th className="px-5 py-3 text-left">{copy.liveRuns.columns.provider}</th>
                  <th className="px-5 py-3 text-left">{copy.liveRuns.columns.account}</th>
                  <th className="px-5 py-3 text-right">{copy.liveRuns.columns.latency}</th>
                  <th className="px-5 py-3 text-right">{copy.liveRuns.columns.tokensIn}</th>
                  <th className="px-5 py-3 text-right">{copy.liveRuns.columns.tokensOut}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[hsl(var(--glass-stroke)/0.3)] last:border-b-0 hover:bg-[hsl(var(--card)/0.45)]"
                  >
                    <td className="px-5 py-3 text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {formatRelative(row.timestamp, locale)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimestamp(row.timestamp, locale)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{row.method ?? "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs">{row.path ?? "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{row.model ?? "—"}</span>
                        {row.requestedModel && row.requestedModel !== row.model ? (
                          <span className="text-[10px] text-muted-foreground">
                            ←{row.requestedModel}
                          </span>
                        ) : null}
                        {row.comboName ? (
                          <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--tag-violet))]">
                            {copy.liveRuns.combo}: {row.comboName}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {row.provider ? (
                        <Badge variant="sky" className="text-[10px]">
                          {row.provider}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      <code>{row.account ?? "—"}</code>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatDuration(row.durationMs, locale)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatNumber(row.tokensIn, locale)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {formatNumber(row.tokensOut, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>

      <p className="text-xs text-muted-foreground">
        {copy.shared.rowsCount
          .replace("{shown}", formatNumber(items.length, locale))
          .replace("{total}", formatNumber(total, locale))}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: number | null }) {
  if (status == null) {
    return <Badge variant="rose">—</Badge>;
  }
  if (status >= 500) return <Badge variant="rose">{status}</Badge>;
  if (status >= 400) return <Badge variant="amber">{status}</Badge>;
  if (status >= 300) return <Badge variant="violet">{status}</Badge>;
  if (status >= 200) return <Badge variant="emerald">{status}</Badge>;
  return <Badge>{status}</Badge>;
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

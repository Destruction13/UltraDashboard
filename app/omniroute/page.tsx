import {
  Activity,
  AlertCircle,
  Ban,
  CheckCircle2,
  Cpu,
  Gauge,
  Hourglass,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

import { OmniRouteOfflineBanner } from "@/components/omniroute/offline-banner";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { KpiTile } from "@/components/shell/kpi-tile";
import { SectionHeader } from "@/components/shell/section-header";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getOmniRouteDictionary } from "@/lib/omniroute/dictionaries";
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/omniroute/format";
import { getOverview } from "@/lib/omniroute/repository";
import type { OmniRouteWindow } from "@/lib/omniroute/types";

export const dynamic = "force-dynamic";

export default async function OmniRouteOverviewPage() {
  const locale = await readLocaleFromCookies();
  const copy = getOmniRouteDictionary(locale);
  const overview = getOverview();

  const last24h = overview.windows.last24h;

  return (
    <div className="flex flex-col gap-8">
      {!overview.available ? (
        <OmniRouteOfflineBanner copy={copy.banner} storagePath={overview.storagePath} />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label={copy.overview.kpi.providersTotal}
          value={formatNumber(overview.providers.total, locale)}
          hint={copy.overview.kpi.providersTotalHint}
          icon={<Cpu />}
          tone="brand"
        />
        <KpiTile
          label={copy.overview.kpi.providersActive}
          value={formatNumber(overview.providers.active, locale)}
          hint={copy.overview.kpi.providersActiveHint}
          icon={<CheckCircle2 />}
          tone="emerald"
        />
        <KpiTile
          label={copy.overview.kpi.providersRateLimited}
          value={formatNumber(overview.providers.rateLimited, locale)}
          hint={copy.overview.kpi.providersRateLimitedHint}
          icon={<Hourglass />}
          tone="amber"
        />
        <KpiTile
          label={copy.overview.kpi.providersWithErrors}
          value={formatNumber(overview.providers.withErrors, locale)}
          hint={copy.overview.kpi.providersWithErrorsHint}
          icon={<AlertCircle />}
          tone="rose"
        />
        <KpiTile
          label={copy.overview.kpi.routesTotal}
          value={formatNumber(overview.routes.total, locale)}
          hint={copy.overview.kpi.routesTotalHint}
          icon={<Workflow />}
          tone="violet"
        />
        <KpiTile
          label={copy.overview.kpi.calls24h}
          value={formatNumber(last24h.callCount, locale)}
          hint={copy.overview.kpi.calls24hHint}
          icon={<Activity />}
          tone="sky"
        />
        <KpiTile
          label={copy.overview.kpi.successRate24h}
          value={formatPercent(last24h.successRate, locale)}
          hint={copy.overview.kpi.successRate24hHint}
          icon={<TrendingUp />}
          tone="emerald"
        />
        <KpiTile
          label={copy.overview.kpi.avgLatency24h}
          value={formatDuration(last24h.avgDurationMs, locale)}
          hint={copy.overview.kpi.avgLatency24hHint}
          icon={<Zap />}
          tone="amber"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <GlowCard scaleOnHover={false} innerClassName="p-6 sm:p-7">
          <SectionHeader
            eyebrow="24h"
            title={copy.overview.cards.topProvidersTitle}
            description={copy.overview.cards.topProvidersDescription}
          />
          <TopProvidersTable
            window={last24h}
            locale={locale}
            columns={copy.overview.columns}
            emptyLabel={copy.overview.labels.noTraffic}
          />
        </GlowCard>

        <div className="flex flex-col gap-5">
          <GlowCard scaleOnHover={false} innerClassName="p-6 sm:p-7">
            <SectionHeader
              title={copy.overview.cards.windowsTitle}
              description={copy.overview.cards.windowsDescription}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <WindowMiniStat
                label={copy.overview.labels.last24h}
                w={overview.windows.last24h}
                locale={locale}
              />
              <WindowMiniStat
                label={copy.overview.labels.last7d}
                w={overview.windows.last7d}
                locale={locale}
              />
            </div>
          </GlowCard>

          <GlowCard scaleOnHover={false} innerClassName="p-6 sm:p-7">
            <SectionHeader
              title={copy.overview.cards.recentTitle}
              description={copy.overview.cards.recentDescription}
            />
            <dl className="mt-5 grid gap-3 text-sm">
              <RecentRow
                icon={<Activity className="h-4 w-4 text-[hsl(var(--tag-sky))]" />}
                label={copy.overview.kpi.lastCall}
                value={formatRelative(overview.recent.lastCallAt, locale)}
              />
              <RecentRow
                icon={<CheckCircle2 className="h-4 w-4 text-[hsl(var(--tag-emerald))]" />}
                label={
                  locale === "ru" ? "Последний успех" : "Last success"
                }
                value={formatRelative(overview.recent.lastSuccessAt, locale)}
              />
              <RecentRow
                icon={<Ban className="h-4 w-4 text-[hsl(var(--tag-rose))]" />}
                label={
                  locale === "ru" ? "Последняя ошибка" : "Last error"
                }
                value={formatRelative(overview.recent.lastErrorAt, locale)}
              />
            </dl>
          </GlowCard>
        </div>
      </section>

      <GlassPanel className="p-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <Gauge className="h-4 w-4" />
          <span>
            {locale === "ru" ? "Снимок собран" : "Snapshot at"}{" "}
            <span className="font-medium text-foreground">{overview.generatedAt}</span>
          </span>
          {overview.storagePath ? (
            <>
              <span aria-hidden>·</span>
              <code className="rounded bg-[hsl(var(--card)/0.6)] px-1.5 py-0.5">
                {overview.storagePath}
              </code>
            </>
          ) : null}
        </div>
      </GlassPanel>
    </div>
  );
}

function TopProvidersTable({
  window,
  locale,
  columns,
  emptyLabel,
}: {
  window: OmniRouteWindow;
  locale: "ru" | "en";
  columns: {
    provider: string;
    calls: string;
    success: string;
    errors: string;
    avgLatency: string;
    tokensIn: string;
    tokensOut: string;
  };
  emptyLabel: string;
}) {
  if (window.topProviders.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }
  return (
    <div className="mt-5 -mx-2 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <tr>
            <Th>{columns.provider}</Th>
            <Th align="right">{columns.calls}</Th>
            <Th align="right">{columns.success}</Th>
            <Th align="right">{columns.errors}</Th>
            <Th align="right">{columns.avgLatency}</Th>
            <Th align="right">{columns.tokensIn}</Th>
            <Th align="right">{columns.tokensOut}</Th>
          </tr>
        </thead>
        <tbody className="text-foreground">
          {window.topProviders.map((row) => (
            <tr
              key={row.provider}
              className="border-t border-[hsl(var(--glass-stroke)/0.4)]"
            >
              <Td className="font-medium">{row.provider}</Td>
              <Td align="right">{formatNumber(row.callCount, locale)}</Td>
              <Td align="right" className="text-[hsl(var(--tag-emerald))]">
                {formatNumber(row.successCount, locale)}
              </Td>
              <Td align="right" className="text-[hsl(var(--tag-rose))]">
                {formatNumber(row.errorCount, locale)}
              </Td>
              <Td align="right">{formatDuration(row.avgDurationMs, locale)}</Td>
              <Td align="right">{formatNumber(row.tokensIn, locale)}</Td>
              <Td align="right">{formatNumber(row.tokensOut, locale)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WindowMiniStat({
  label,
  w,
  locale,
}: {
  label: string;
  w: OmniRouteWindow;
  locale: "ru" | "en";
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--glass-stroke)/0.5)] bg-[hsl(var(--card)/0.5)] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
        {formatNumber(w.callCount, locale)}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatPercent(w.successRate, locale)} · {formatDuration(w.avgDurationMs, locale)}
      </p>
    </div>
  );
}

function RecentRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--glass-stroke)/0.4)] bg-[hsl(var(--card)/0.4)] px-3 py-2">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`px-2 py-2 font-medium ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <td
      className={`px-2 py-2 tabular-nums ${
        align === "right" ? "text-right" : "text-left"
      } ${className ?? ""}`}
    >
      {children}
    </td>
  );
}

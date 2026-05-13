import { Search, Workflow } from "lucide-react";

import { OmniRouteOfflineBanner } from "@/components/omniroute/offline-banner";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getOmniRouteDictionary } from "@/lib/omniroute/dictionaries";
import { formatNumber, formatRelative } from "@/lib/omniroute/format";
import { checkOmniRouteAvailable, listRoutes } from "@/lib/omniroute/repository";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  limit?: string;
  offset?: string;
}

export default async function OmniRouteRoutesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const locale = await readLocaleFromCookies();
  const copy = getOmniRouteDictionary(locale);
  const availability = checkOmniRouteAvailable();

  const limit = clampInt(params.limit, 50, 1, 500);
  const offset = clampInt(params.offset, 0, 0, 1_000_000);

  const { items, total } = listRoutes({
    q: params.q?.trim() || undefined,
    limit,
    offset,
  });

  return (
    <div className="flex flex-col gap-6">
      {!availability.available ? (
        <OmniRouteOfflineBanner
          copy={copy.banner}
          storagePath={process.env.OMNIROUTE_SQLITE_PATH ?? null}
        />
      ) : null}

      <SectionHeader
        eyebrow={copy.routes.eyebrow}
        title={copy.routes.eyebrow}
        description={copy.routes.description}
      />

      <GlassPanel className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {copy.routes.columns.name}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={params.q ?? ""}
                className="w-full rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.5)] py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[hsl(var(--shader-b)/0.6)]"
              />
            </div>
          </label>
          <input type="hidden" name="limit" value={String(limit)} />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[hsl(var(--glass-stroke)/0.6)] bg-[hsl(var(--card)/0.7)] px-4 text-sm font-medium transition-colors hover:bg-[hsl(var(--card)/0.9)]"
          >
            <Workflow className="h-4 w-4" />
            {copy.shared.refresh}
          </button>
        </form>
      </GlassPanel>

      {items.length === 0 ? (
        <GlowCard scaleOnHover={false} innerClassName="p-10 text-center">
          <p className="text-sm text-muted-foreground">{copy.routes.empty}</p>
        </GlowCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((row) => (
            <GlowCard key={row.id} scaleOnHover={false} innerClassName="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-foreground">{row.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {copy.routes.columns.updated}: {formatRelative(row.updatedAt, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="violet">
                    {copy.routes.columns.sortOrder} #{row.sortOrder}
                  </Badge>
                  {row.stepCount != null ? (
                    <Badge variant="sky">
                      {formatNumber(row.stepCount, locale)} {copy.routes.columns.steps.toLowerCase()}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex flex-col gap-1">
                  <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.routes.columns.systemMessage}
                  </dt>
                  <dd className="rounded-lg border border-[hsl(var(--glass-stroke)/0.4)] bg-[hsl(var(--card)/0.4)] px-3 py-2 text-xs leading-relaxed text-foreground">
                    {row.systemMessage ?? (
                      <span className="text-muted-foreground">{copy.routes.untitledSystem}</span>
                    )}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.routes.columns.toolFilter}
                  </dt>
                  <dd className="rounded-lg border border-[hsl(var(--glass-stroke)/0.4)] bg-[hsl(var(--card)/0.4)] px-3 py-2 font-mono text-xs text-foreground">
                    {row.toolFilterRegex ?? copy.routes.none}
                  </dd>
                </div>
              </dl>
            </GlowCard>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {copy.shared.rowsCount
          .replace("{shown}", formatNumber(items.length, locale))
          .replace("{total}", formatNumber(total, locale))}
      </p>
    </div>
  );
}

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

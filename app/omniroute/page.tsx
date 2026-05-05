import { Activity, Cable, Gauge, RefreshCw } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { KpiTile } from "@/components/shell/kpi-tile";
import { PageShell } from "@/components/shell/page-shell";
import { PhaseTag } from "@/components/shell/phase-tag";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const COPY = {
  ru: {
    eyebrow: "OmniRoute",
    headline: "Оперативная сводка",
    description:
      "Карточки этой страницы наполнятся реальными данными после Phase 5 (read-only SQLite-адаптер) и Phase 6 (UI). Сейчас отображается каркас, чтобы было видно структуру и места под виджеты.",
    refresh: "Обновить вручную",
    kpis: {
      providers: { label: "Провайдеры", hint: "Активные / всего" },
      windows: { label: "Окна без расхода", hint: "Сводка по квотам" },
      avgRemaining: { label: "Средний остаток", hint: "Среднее по всем провайдерам" },
      lastSync: { label: "Последняя синхронизация", hint: "Появится после Phase 5" },
    },
    cards: {
      providers: {
        title: "Провайдеры",
        description: "Список провайдеров с состоянием активности и сводкой по квотам.",
      },
      quota: {
        title: "Сигналы квот",
        description: "Окна без расхода, исчерпанные окна, средний остаток в процентах.",
      },
      tunnel: {
        title: "Туннель",
        description: "Хост, локальный/удалённый эндпоинт, заметки и кнопка копирования.",
      },
      sync: {
        title: "Синхронизация",
        description: "Время последней успешной синхронизации и текущий статус задачи.",
      },
    },
    placeholderTag: "Phase 5–6",
  },
  en: {
    eyebrow: "OmniRoute",
    headline: "Operational summary",
    description:
      "Real cards land after Phase 5 (read-only SQLite adapter) and Phase 6 (UI). For now, this is the skeleton so the page structure and widget slots are visible.",
    refresh: "Manual refresh",
    kpis: {
      providers: { label: "Providers", hint: "Active / total" },
      windows: { label: "Available windows", hint: "Quota summary" },
      avgRemaining: { label: "Average remaining", hint: "Mean across providers" },
      lastSync: { label: "Last sync", hint: "Lands in Phase 5" },
    },
    cards: {
      providers: {
        title: "Providers",
        description: "Provider list with active state and quota summary.",
      },
      quota: {
        title: "Quota signals",
        description: "Available windows, exhausted windows, average remaining percentage.",
      },
      tunnel: {
        title: "Tunnel",
        description: "Host, local/remote endpoint, notes, copy actions.",
      },
      sync: {
        title: "Sync",
        description: "Last successful sync time and current run status.",
      },
    },
    placeholderTag: "Phase 5–6",
  },
} as const;

export default async function OmniRoutePage() {
  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];

  return (
    <PageShell
      eyebrow={copy.eyebrow}
      title={copy.headline}
      description={shell.states.pendingOmniRouteData}
      actions={
        <Button variant="outline" disabled aria-disabled className="self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          {copy.refresh}
        </Button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label={copy.kpis.providers.label}
          loading
          hint={copy.kpis.providers.hint}
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <KpiTile
          label={copy.kpis.windows.label}
          loading
          hint={copy.kpis.windows.hint}
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
        <KpiTile
          label={copy.kpis.avgRemaining.label}
          loading
          hint={copy.kpis.avgRemaining.hint}
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
        <KpiTile
          label={copy.kpis.lastSync.label}
          loading
          hint={copy.kpis.lastSync.hint}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SkeletonCard
          icon={<Activity className="h-5 w-5" />}
          title={copy.cards.providers.title}
          description={copy.cards.providers.description}
          tag={copy.placeholderTag}
        />
        <SkeletonCard
          icon={<Gauge className="h-5 w-5" />}
          title={copy.cards.quota.title}
          description={copy.cards.quota.description}
          tag={copy.placeholderTag}
        />
        <SkeletonCard
          icon={<Cable className="h-5 w-5" />}
          title={copy.cards.tunnel.title}
          description={copy.cards.tunnel.description}
          tag={copy.placeholderTag}
        />
        <SkeletonCard
          icon={<RefreshCw className="h-5 w-5" />}
          title={copy.cards.sync.title}
          description={copy.cards.sync.description}
          tag={copy.placeholderTag}
        />
      </section>
    </PageShell>
  );
}

function SkeletonCard({
  icon,
  title,
  description,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <GlassPanel>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground/5 text-foreground/80">
          {icon}
        </div>
        <PhaseTag>{tag}</PhaseTag>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 grid gap-2">
        <Skeleton className="h-2.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
    </GlassPanel>
  );
}

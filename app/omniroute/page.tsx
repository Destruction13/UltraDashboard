import { Activity, Cable, Gauge, RefreshCw } from "lucide-react";

import { GlowCard } from "@/components/shell/glow-card";
import { KpiTile } from "@/components/shell/kpi-tile";
import { PageShell } from "@/components/shell/page-shell";
import { PhaseTag } from "@/components/shell/phase-tag";
import { ScrollReveal } from "@/components/shell/scroll-reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="flex flex-col gap-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label={copy.kpis.providers.label}
            loading
            hint={copy.kpis.providers.hint}
            icon={<Activity />}
            tone="brand"
          />
          <KpiTile
            label={copy.kpis.windows.label}
            loading
            hint={copy.kpis.windows.hint}
            icon={<Gauge />}
            tone="emerald"
          />
          <KpiTile
            label={copy.kpis.avgRemaining.label}
            loading
            hint={copy.kpis.avgRemaining.hint}
            icon={<Gauge />}
            tone="sky"
          />
          <KpiTile
            label={copy.kpis.lastSync.label}
            loading
            hint={copy.kpis.lastSync.hint}
            icon={<RefreshCw />}
            tone="amber"
          />
        </section>

        <ScrollReveal once distance={16}>
          <section className="grid gap-5 md:grid-cols-2">
            <ModuleSkeletonCard
              icon={<Activity className="h-5 w-5" />}
              title={copy.cards.providers.title}
              description={copy.cards.providers.description}
              tag={copy.placeholderTag}
            />
            <ModuleSkeletonCard
              icon={<Gauge className="h-5 w-5" />}
              title={copy.cards.quota.title}
              description={copy.cards.quota.description}
              tag={copy.placeholderTag}
            />
            <ModuleSkeletonCard
              icon={<Cable className="h-5 w-5" />}
              title={copy.cards.tunnel.title}
              description={copy.cards.tunnel.description}
              tag={copy.placeholderTag}
            />
            <ModuleSkeletonCard
              icon={<RefreshCw className="h-5 w-5" />}
              title={copy.cards.sync.title}
              description={copy.cards.sync.description}
              tag={copy.placeholderTag}
            />
          </section>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}

function ModuleSkeletonCard({
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
    <GlowCard innerClassName="flex h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--shader-a)/0.85)] via-[hsl(var(--shader-b)/0.85)] to-[hsl(var(--shader-c)/0.85)] text-primary-foreground shadow-[0_18px_48px_-24px_hsl(var(--shader-a)/0.6)]">
          <span
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--glass-highlight)/0.7),transparent_60%)]"
          />
          <span className="relative">{icon}</span>
        </span>
        <PhaseTag>{tag}</PhaseTag>
      </div>
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="mt-auto grid gap-2">
        <Skeleton className="h-2.5 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
    </GlowCard>
  );
}

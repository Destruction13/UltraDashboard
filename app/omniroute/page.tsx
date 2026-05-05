import { Activity, Cable, Gauge, RefreshCw } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { Button } from "@/components/ui/button";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";

const COPY = {
  ru: {
    headline: "OmniRoute · оперативная сводка",
    description:
      "Карточки этой страницы наполнятся реальными данными после Phase 5 (read-only SQLite-адаптер) и Phase 6 (UI). Сейчас отображается каркас, чтобы было видно структуру и места под виджеты.",
    refresh: "Обновить вручную",
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
    headline: "OmniRoute · operational summary",
    description:
      "Real cards land after Phase 5 (read-only SQLite adapter) and Phase 6 (UI). For now, this is the skeleton so the page structure and widget slots are visible.",
    refresh: "Manual refresh",
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
  const copy = COPY[locale];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <GlassPanel className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.headline}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Button variant="outline" disabled aria-disabled className="self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          {copy.refresh}
        </Button>
      </GlassPanel>

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
    </div>
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
        <span className="rounded-full border border-border/60 bg-background/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {tag}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 grid gap-1.5">
        <Bar widthClass="w-3/4" />
        <Bar widthClass="w-1/2" />
        <Bar widthClass="w-2/3" />
      </div>
    </GlassPanel>
  );
}

function Bar({ widthClass }: { widthClass: string }) {
  return (
    <div className={`h-2 rounded-full bg-foreground/5 ${widthClass}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-foreground/10 via-foreground/5 to-transparent" />
    </div>
  );
}

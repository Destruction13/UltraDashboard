import { Plus, Search, Tag, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shell/empty-state";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { PhaseTag } from "@/components/shell/phase-tag";
import { SectionHeader } from "@/components/shell/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const FAMILY_SLUGS = ["github", "google", "zoho"] as const;
type FamilySlug = (typeof FAMILY_SLUGS)[number];

function isFamilySlug(value: string): value is FamilySlug {
  return (FAMILY_SLUGS as readonly string[]).includes(value);
}

const COPY = {
  ru: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Семейство",
    description:
      "Здесь будет таблица root-аккаунтов выбранного семейства, поиск и фильтрация по тегам.",
    searchPlaceholder: "Поиск аккаунта…",
    tagsTitle: "Теги",
    tagsHint: "Появятся после Phase 3 — теги seed-нуты в БД, фильтр будет в UI.",
    listTitle: "Root-аккаунты",
    listEmptyTitle: "Пока нет аккаунтов",
    listEmptyHint:
      "Создайте первый root-аккаунт после реализации Phase 3 — таблица и редактор появятся в этой панели.",
    createCta: "Создать root-аккаунт",
    placeholderTag: "Phase 3",
  },
  en: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Family",
    description:
      "Family root account table, search, and tag filtering land here.",
    searchPlaceholder: "Search account…",
    tagsTitle: "Tags",
    tagsHint: "Tags ship in Phase 3 — they're seeded in the DB; filtering UI lands with the table.",
    listTitle: "Root accounts",
    listEmptyTitle: "No root accounts yet",
    listEmptyHint:
      "You'll create the first root account once Phase 3 lands the table and editor in this panel.",
    createCta: "Create root account",
    placeholderTag: "Phase 3",
  },
} as const;

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ family: string }>;
}) {
  const { family } = await params;
  if (!isFamilySlug(family)) notFound();

  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];
  const familyName = shell.family[family];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
      <GlowCard innerClassName="flex flex-col gap-5 p-7 sm:p-9">
        <SectionHeader
          eyebrow={`${copy.eyebrow} · ${copy.descriptionPrefix} ${familyName}`}
          title={copy.listTitle}
          description={shell.states.pendingFamilyData}
          actions={
            <>
              <PhaseTag className="hidden sm:inline-flex">{copy.placeholderTag}</PhaseTag>
              <Button variant="outline" disabled aria-disabled>
                <Plus className="h-4 w-4" />
                {copy.createCta}
              </Button>
            </>
          }
        />

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder={copy.searchPlaceholder}
            disabled
            aria-disabled
            className="w-full rounded-xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.55)] py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <RowSkeleton key={idx} />
          ))}
          <EmptyState
            icon={<Users className="h-4 w-4" />}
            title={copy.listEmptyTitle}
            description={copy.listEmptyHint}
          />
        </div>
      </GlowCard>

      <GlassPanel className="flex flex-col gap-3 p-6 lg:sticky lg:top-24 lg:self-start">
        <SectionHeader
          eyebrow={copy.placeholderTag}
          title={copy.tagsTitle}
          actions={<PhaseTag>{copy.placeholderTag}</PhaseTag>}
        />
        <p className="text-xs text-muted-foreground">{copy.tagsHint}</p>
        <ul className="grid gap-2">
          {[
            "primary",
            "secondary",
            "agent",
            "automation",
            "billing",
            "rotate-soon",
          ].map((slug) => (
            <li
              key={slug}
              className="group flex items-center justify-between rounded-md border border-[hsl(var(--glass-stroke)/0.5)] bg-[hsl(var(--card)/0.45)] px-3 py-2 text-xs transition-colors duration-300 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:bg-[hsl(var(--card)/0.65)]"
            >
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Tag className="h-3.5 w-3.5 transition-colors duration-300 group-hover:text-foreground" />
                <span className="font-medium text-foreground/80 transition-colors duration-300 group-hover:text-foreground">
                  {slug}
                </span>
              </span>
              <Skeleton className="h-2 w-10" />
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--glass-stroke)/0.5)] bg-[hsl(var(--card)/0.4)] px-4 py-3 transition-colors duration-300 hover:border-[hsl(var(--glass-stroke)/0.85)]">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="grid gap-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="h-2.5 w-16" />
    </div>
  );
}

export function generateStaticParams() {
  return FAMILY_SLUGS.map((slug) => ({ family: slug }));
}

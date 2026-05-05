import { notFound } from "next/navigation";

import { GlassPanel } from "@/components/shell/glass-panel";
import { Button } from "@/components/ui/button";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const FAMILY_SLUGS = ["github", "google", "zoho"] as const;
type FamilySlug = (typeof FAMILY_SLUGS)[number];

function isFamilySlug(value: string): value is FamilySlug {
  return (FAMILY_SLUGS as readonly string[]).includes(value);
}

const COPY = {
  ru: {
    description:
      "Здесь будет таблица root-аккаунтов выбранного семейства, поиск и фильтрация по тегам. Появится в Phase 3 трекера.",
    createCta: "Создать root-аккаунт",
    placeholderTag: "Phase 3",
  },
  en: {
    description:
      "Family root account table, search, and tag filtering land here in Phase 3 of the tracker.",
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

  return (
    <GlassPanel className="flex flex-col gap-4 p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {shell.family[family]}
          </span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{shell.family[family]}</h2>
        </div>
        <Button variant="outline" disabled aria-disabled>
          {copy.createCta}
        </Button>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
      <span className="self-start rounded-full border border-border/60 bg-background/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {copy.placeholderTag}
      </span>
    </GlassPanel>
  );
}

export function generateStaticParams() {
  return FAMILY_SLUGS.map((slug) => ({ family: slug }));
}

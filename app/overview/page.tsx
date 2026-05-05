import { ChevronRight, Network, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { GlassPanel } from "@/components/shell/glass-panel";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const COPY = {
  ru: {
    eyebrow: "Phase 0 · фундамент",
    headline: "Премиум-панель для OmniRoute и AccountManager",
    description:
      "Это стартовый экран. Полный набор виджетов появится по мере выполнения Phase 1–6 трекера: счётчики семейств, статус последней синхронизации OmniRoute, туннель и закреплённые инструкции.",
    modules: {
      omniroute: {
        title: "OmniRoute",
        description:
          "Сводный статус провайдеров и квот, информация о туннеле и эндпоинтах, ручное обновление синхронизации.",
        cta: "Открыть OmniRoute",
      },
      accountManager: {
        title: "AccountManager",
        description:
          "Семейства GitHub / Google / Zoho, root-аккаунты и связанные сервисы. Карточка с логином, паролем, актуальным TOTP и роадмапом инструкций.",
        cta: "Открыть AccountManager",
      },
    },
    placeholders: {
      lastSync: "Последняя синхронизация OmniRoute",
      lastSyncEmpty: "Появится после Phase 5",
      counts: "Счётчики аккаунтов по семействам",
      countsEmpty: "Появятся после Phase 1",
      tunnel: "Туннель и эндпоинт",
      tunnelEmpty: "Появятся после Phase 6",
    },
  },
  en: {
    eyebrow: "Phase 0 · foundation",
    headline: "Premium control panel for OmniRoute and AccountManager",
    description:
      "This is the starter overview. Full widgets land as Phase 1–6 of the tracker ships: family counts, last OmniRoute sync, tunnel context, and pinned guidance blocks.",
    modules: {
      omniroute: {
        title: "OmniRoute",
        description:
          "Provider availability, quota signals, tunnel and endpoint context, plus a manual sync action.",
        cta: "Open OmniRoute",
      },
      accountManager: {
        title: "AccountManager",
        description:
          "GitHub / Google / Zoho families, root accounts and linked services. Detail card with login, password, current TOTP, and the structured instruction roadmap.",
        cta: "Open AccountManager",
      },
    },
    placeholders: {
      lastSync: "Last OmniRoute sync",
      lastSyncEmpty: "Lands in Phase 5",
      counts: "Account counts per family",
      countsEmpty: "Lands in Phase 1",
      tunnel: "Tunnel and endpoint",
      tunnelEmpty: "Lands in Phase 6",
    },
  },
} as const;

export default async function OverviewPage() {
  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <GlassPanel className="p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {copy.eyebrow}
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {copy.headline}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {copy.description}
          </p>
        </GlassPanel>

        <GlassPanel className="flex flex-col justify-center gap-3 p-8">
          <PlaceholderRow
            label={copy.placeholders.lastSync}
            empty={copy.placeholders.lastSyncEmpty}
          />
          <PlaceholderRow label={copy.placeholders.counts} empty={copy.placeholders.countsEmpty} />
          <PlaceholderRow label={copy.placeholders.tunnel} empty={copy.placeholders.tunnelEmpty} />
        </GlassPanel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ModuleCard
          href="/omniroute"
          icon={<Network className="h-5 w-5" />}
          title={copy.modules.omniroute.title}
          description={copy.modules.omniroute.description}
          cta={copy.modules.omniroute.cta}
        />
        <ModuleCard
          href="/account-manager"
          icon={<Users className="h-5 w-5" />}
          title={copy.modules.accountManager.title}
          description={copy.modules.accountManager.description}
          cta={copy.modules.accountManager.cta}
        />
      </section>

      <p className="text-center text-xs text-muted-foreground">
        <Sparkles className="mr-1 inline h-3 w-3" /> {shell.brand.tagline}
      </p>
    </div>
  );
}

function PlaceholderRow({ label, empty }: { label: string; empty: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">{empty}</span>
    </div>
  );
}

function ModuleCard({
  href,
  icon,
  title,
  description,
  cta,
}: {
  href: "/omniroute" | "/account-manager";
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius)]"
    >
      <GlassPanel className="h-full transition-transform duration-300 group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--shader-a))] via-[hsl(var(--shader-b))] to-[hsl(var(--shader-c))] text-primary-foreground shadow-glass">
            {icon}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-6 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-primary">
          {cta} <ChevronRight className="h-3 w-3" />
        </span>
      </GlassPanel>
    </Link>
  );
}

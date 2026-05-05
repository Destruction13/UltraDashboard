import {
  Activity,
  ArrowRight,
  Cpu,
  Database,
  Globe2,
  Network,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shell/empty-state";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { KpiTile } from "@/components/shell/kpi-tile";
import { PageShell } from "@/components/shell/page-shell";
import { PhaseTag } from "@/components/shell/phase-tag";
import { ScrollReveal } from "@/components/shell/scroll-reveal";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const COPY = {
  ru: {
    eyebrow: "Phase 0 · фундамент",
    headline: "Премиум-панель для OmniRoute и AccountManager",
    description:
      "Стартовый экран. Полный набор виджетов появится по мере выполнения Phase 1–6 трекера: счётчики семейств, статус последней синхронизации OmniRoute, туннель и закреплённые инструкции.",
    kpis: {
      families: { label: "Семейства", hint: "GitHub · Google · Zoho" },
      roots: { label: "Root-аккаунты", hint: "Появится после Phase 3" },
      services: { label: "Связанные сервисы", hint: "Появится после Phase 3" },
      sync: { label: "Последняя синхронизация", hint: "Появится после Phase 5" },
    },
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
    instructionsTitle: "Закреплённые инструкции",
    instructionsHint:
      "Сюда попадут самые свежие инструкции по аккаунтам. Появятся в Phase 4 после рендера роадмапа.",
    instructionsTag: "Phase 4",
  },
  en: {
    eyebrow: "Phase 0 · foundation",
    headline: "Premium control panel for OmniRoute and AccountManager",
    description:
      "Starter overview. Full widgets land as Phase 1–6 of the tracker ships: family counts, last OmniRoute sync, tunnel context, and pinned guidance blocks.",
    kpis: {
      families: { label: "Service families", hint: "GitHub · Google · Zoho" },
      roots: { label: "Root accounts", hint: "Lands in Phase 3" },
      services: { label: "Linked services", hint: "Lands in Phase 3" },
      sync: { label: "Last sync", hint: "Lands in Phase 5" },
    },
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
    instructionsTitle: "Pinned instructions",
    instructionsHint:
      "Latest account instructions will surface here once the roadmap renderer ships in Phase 4.",
    instructionsTag: "Phase 4",
  },
} as const;

export default async function OverviewPage() {
  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];

  return (
    <PageShell
      eyebrow={copy.eyebrow}
      title={copy.headline}
      description={copy.description}
      actions={
        <Badge variant="violet" className="hidden sm:inline-flex">
          <Shield className="h-3 w-3" />
          {shell.copy.perimeterTrust}
        </Badge>
      }
    >
      <div className="flex flex-col gap-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label={copy.kpis.families.label}
            value="3"
            hint={copy.kpis.families.hint}
            icon={<Database />}
            tone="brand"
          />
          <KpiTile
            label={copy.kpis.roots.label}
            loading
            hint={copy.kpis.roots.hint}
            icon={<Users />}
            tone="violet"
          />
          <KpiTile
            label={copy.kpis.services.label}
            loading
            hint={copy.kpis.services.hint}
            icon={<Cpu />}
            tone="sky"
          />
          <KpiTile
            label={copy.kpis.sync.label}
            loading
            hint={copy.kpis.sync.hint}
            icon={<Activity />}
            tone="emerald"
          />
        </section>

        <ScrollReveal once distance={16}>
          <section className="grid gap-5 lg:grid-cols-2">
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
        </ScrollReveal>

        <ScrollReveal once distance={16}>
          <GlassPanel className="flex flex-col gap-4 p-6 sm:p-8">
            <SectionHeader
              eyebrow={copy.instructionsTag}
              title={copy.instructionsTitle}
              actions={<PhaseTag>{copy.instructionsTag}</PhaseTag>}
            />
            <EmptyState
              icon={<Sparkles className="h-4 w-4" />}
              title={shell.states.empty}
              description={copy.instructionsHint}
            />
          </GlassPanel>
        </ScrollReveal>

        <p className="text-center text-xs text-muted-foreground">
          <Globe2 className="mr-1 inline h-3 w-3" /> {shell.brand.tagline}
        </p>
      </div>
    </PageShell>
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
      className="group block rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <GlowCard withArrow className="h-full" innerClassName="flex h-full flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--shader-a)/0.95)] via-[hsl(var(--shader-b)/0.9)] to-[hsl(var(--shader-c)/0.95)] text-primary-foreground shadow-[0_18px_48px_-24px_hsl(var(--shader-a)/0.8)]">
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--glass-highlight)/0.8),transparent_60%)]"
            />
            <span className="relative">{icon}</span>
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-foreground/85 transition-colors group-hover:text-foreground">
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </GlowCard>
    </Link>
  );
}

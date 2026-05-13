import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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
import {
  getAccountManagerStats,
  type AccountManagerStats,
} from "@/lib/account-manager/repository";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";
import { formatNumber, formatPercent, formatRelative } from "@/lib/omniroute/format";
import { getOverview } from "@/lib/omniroute/repository";
import type { OmniRouteOverview } from "@/lib/omniroute/types";

export const dynamic = "force-dynamic";

const COPY = {
  ru: {
    eyebrow: "UltraDashboard · V1",
    headline: "Премиум-панель для OmniRoute и AccountManager",
    description:
      "Сводка по живым данным OmniRoute и хранилищу аккаунтов. Доступ открыт только через SSH-туннель на VPS.",
    kpis: {
      families: { label: "Семейства", hint: "GitHub · Google · Zoho" },
      roots: { label: "Root-аккаунты", hint: "Активных записей в БД" },
      services: { label: "Связанные сервисы", hint: "Linked services" },
      sync: { label: "Снимок OmniRoute", hint: "Свежесть снапшота" },
    },
    omniroute: {
      eyebrow: "OmniRoute",
      title: "Сводка проксирования",
      description:
        "Краткий статус read-only зеркала OmniRoute. Полные таблицы — в /omniroute.",
      providers: "Активных провайдеров",
      providersHint: "is_active = 1",
      calls: "Запросов за 24ч",
      callsHint: "call_logs (24h)",
      success: "Доля успехов",
      successHint: "HTTP 2xx / всего",
      errors: "Ошибок",
      errorsHint: "non-2xx за 24ч",
      offlineTitle: "Снимок OmniRoute недоступен",
      offlineHint:
        "Дашборд не смог открыть /var/omniroute/storage.sqlite. Проверь omniroute-snapshot.timer на VPS.",
      lastCall: "Последний запрос",
      cta: "Открыть OmniRoute",
    },
    families: {
      title: "Семейства аккаунтов",
      description: "Распределение root + linked записей по платформам.",
      cta: "Открыть AccountManager",
      empty: "Записи появятся после первого импорта.",
    },
    modules: {
      omniroute: {
        title: "OmniRoute",
        description:
          "Сводный статус провайдеров и квот, последние запуски и фильтры по ошибкам.",
        cta: "Открыть OmniRoute",
      },
      accountManager: {
        title: "AccountManager",
        description:
          "Семейства GitHub / Google / Zoho, root-аккаунты и связанные сервисы с TOTP, заметками и инструкциями.",
        cta: "Открыть AccountManager",
      },
    },
    integrations: {
      eyebrow: "Phase 7 · API",
      title: "Интеграция для агентов",
      description:
        "Все основные операции доступны через JSON-эндпоинты. Документация — в репо.",
      cta: "docs/agent-integration.md",
    },
    snapshotFresh: "Снимок свежий",
    snapshotStale: "Снимок устарел",
    never: "—",
  },
  en: {
    eyebrow: "UltraDashboard · V1",
    headline: "Premium control panel for OmniRoute and AccountManager",
    description:
      "Live overview across OmniRoute's read-only mirror and the account storage. Reachable only via the SSH tunnel on the VPS.",
    kpis: {
      families: { label: "Service families", hint: "GitHub · Google · Zoho" },
      roots: { label: "Root accounts", hint: "Active rows in Postgres" },
      services: { label: "Linked services", hint: "Linked services" },
      sync: { label: "OmniRoute snapshot", hint: "Snapshot freshness" },
    },
    omniroute: {
      eyebrow: "OmniRoute",
      title: "Proxy summary",
      description:
        "Quick read on the OmniRoute read-only mirror. Full tables live under /omniroute.",
      providers: "Active providers",
      providersHint: "is_active = 1",
      calls: "Calls in 24h",
      callsHint: "call_logs (24h)",
      success: "Success rate",
      successHint: "HTTP 2xx / total",
      errors: "Errors",
      errorsHint: "non-2xx in 24h",
      offlineTitle: "OmniRoute snapshot unavailable",
      offlineHint:
        "The dashboard couldn't open /var/omniroute/storage.sqlite. Check omniroute-snapshot.timer on the VPS.",
      lastCall: "Last call",
      cta: "Open OmniRoute",
    },
    families: {
      title: "Account families",
      description: "Distribution of root + linked records across platforms.",
      cta: "Open AccountManager",
      empty: "Records will appear after the first import.",
    },
    modules: {
      omniroute: {
        title: "OmniRoute",
        description:
          "Provider availability, recent runs, error filters.",
        cta: "Open OmniRoute",
      },
      accountManager: {
        title: "AccountManager",
        description:
          "GitHub / Google / Zoho families, root accounts and linked services with TOTP, notes and instructions.",
        cta: "Open AccountManager",
      },
    },
    integrations: {
      eyebrow: "Phase 7 · API",
      title: "Agent integration",
      description:
        "All core operations are reachable through JSON endpoints. Docs live in the repo.",
      cta: "docs/agent-integration.md",
    },
    snapshotFresh: "Snapshot fresh",
    snapshotStale: "Snapshot stale",
    never: "—",
  },
} as const;

type Locale = keyof typeof COPY;

const STALE_AFTER_MS = 5 * 60 * 1000;

export default async function OverviewPage() {
  const locale = (await readLocaleFromCookies()) as Locale;
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];

  const [accountStats, omniroute] = await Promise.all([
    getAccountManagerStats().catch((): AccountManagerStats => ({
      families: 0,
      rootAccounts: 0,
      linkedServices: 0,
      archivedRootAccounts: 0,
      archivedLinkedServices: 0,
      perFamily: [],
      latestRootCreatedAt: null,
    })),
    Promise.resolve(getOverview()),
  ]);

  const snapshotAvailable = omniroute.available;
  const snapshotAgeMs = omniroute.generatedAt
    ? Date.now() - Date.parse(omniroute.generatedAt)
    : null;
  const snapshotFresh =
    snapshotAvailable && snapshotAgeMs !== null && snapshotAgeMs < STALE_AFTER_MS;

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
            value={formatNumber(accountStats.families, locale)}
            hint={copy.kpis.families.hint}
            icon={<Database />}
            tone="brand"
          />
          <KpiTile
            label={copy.kpis.roots.label}
            value={formatNumber(
              accountStats.rootAccounts - accountStats.archivedRootAccounts,
              locale,
            )}
            hint={copy.kpis.roots.hint}
            icon={<Users />}
            tone="violet"
          />
          <KpiTile
            label={copy.kpis.services.label}
            value={formatNumber(
              accountStats.linkedServices - accountStats.archivedLinkedServices,
              locale,
            )}
            hint={copy.kpis.services.hint}
            icon={<Cpu />}
            tone="sky"
          />
          <KpiTile
            label={copy.kpis.sync.label}
            value={
              omniroute.generatedAt
                ? formatRelative(omniroute.generatedAt, locale)
                : copy.never
            }
            hint={
              snapshotAvailable
                ? snapshotFresh
                  ? copy.snapshotFresh
                  : copy.snapshotStale
                : copy.kpis.sync.hint
            }
            icon={<Activity />}
            tone={snapshotFresh ? "emerald" : snapshotAvailable ? "amber" : "rose"}
          />
        </section>

        <ScrollReveal once distance={16}>
          <GlassPanel className="flex flex-col gap-5 p-6 sm:p-8">
            <SectionHeader
              eyebrow={copy.omniroute.eyebrow}
              title={copy.omniroute.title}
              description={copy.omniroute.description}
              actions={
                <Link
                  href="/omniroute"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/85 transition-colors hover:text-foreground"
                >
                  {copy.omniroute.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            {snapshotAvailable ? (
              <OmniRouteSummary copy={copy.omniroute} locale={locale} overview={omniroute} />
            ) : (
              <EmptyState
                icon={<AlertTriangle className="h-4 w-4" />}
                title={copy.omniroute.offlineTitle}
                description={copy.omniroute.offlineHint}
              />
            )}
          </GlassPanel>
        </ScrollReveal>

        <ScrollReveal once distance={16}>
          <GlassPanel className="flex flex-col gap-5 p-6 sm:p-8">
            <SectionHeader
              title={copy.families.title}
              description={copy.families.description}
              actions={
                <Link
                  href="/account-manager"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/85 transition-colors hover:text-foreground"
                >
                  {copy.families.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            {accountStats.perFamily.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-4 w-4" />}
                title={shell.states.empty}
                description={copy.families.empty}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {accountStats.perFamily.map((family) => (
                  <Link
                    key={family.slug}
                    href={`/account-manager/${family.slug}`}
                    className="group rounded-[var(--radius)] border border-border/60 bg-card/40 p-5 transition-all hover:border-border hover:bg-card/70"
                  >
                    <div className="flex items-center justify-between text-sm font-medium text-foreground/80">
                      {family.label}
                      <ArrowRight className="h-3.5 w-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div>
                        <div className="text-2xl font-semibold text-foreground">
                          {formatNumber(family.rootAccounts, locale)}
                        </div>
                        <div>root</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-foreground">
                          {formatNumber(family.linkedServices, locale)}
                        </div>
                        <div>linked</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </GlassPanel>
        </ScrollReveal>

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
              eyebrow={copy.integrations.eyebrow}
              title={copy.integrations.title}
              description={copy.integrations.description}
              actions={<PhaseTag>{copy.integrations.eyebrow}</PhaseTag>}
            />
            <a
              href="https://github.com/Destruction13/UltraDashboard/blob/main/docs/agent-integration.md"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border/60 bg-card/40 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-card/70"
            >
              {copy.integrations.cta}
              <ArrowRight className="h-3 w-3" />
            </a>
          </GlassPanel>
        </ScrollReveal>

        <p className="text-center text-xs text-muted-foreground">
          <Globe2 className="mr-1 inline h-3 w-3" /> {shell.brand.tagline}
        </p>
      </div>
    </PageShell>
  );
}

function successTone(rate: number | null): "emerald" | "amber" | "rose" {
  if (rate === null) return "amber";
  if (rate >= 0.95) return "emerald";
  if (rate >= 0.8) return "amber";
  return "rose";
}

function OmniRouteSummary({
  copy,
  locale,
  overview,
}: {
  copy: (typeof COPY)[Locale]["omniroute"];
  locale: Locale;
  overview: OmniRouteOverview;
}) {
  const window24h = overview.windows.last24h;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label={copy.providers}
          value={formatNumber(overview.providers.active, locale)}
          hint={copy.providersHint}
          icon={<CheckCircle2 />}
          tone="emerald"
        />
        <KpiTile
          label={copy.calls}
          value={formatNumber(window24h.callCount, locale)}
          hint={copy.callsHint}
          icon={<Activity />}
          tone="sky"
        />
        <KpiTile
          label={copy.success}
          value={formatPercent(window24h.successRate ?? 0, locale)}
          hint={copy.successHint}
          icon={<CheckCircle2 />}
          tone={successTone(window24h.successRate)}
        />
        <KpiTile
          label={copy.errors}
          value={formatNumber(window24h.errorCount, locale)}
          hint={copy.errorsHint}
          icon={<AlertTriangle />}
          tone={window24h.errorCount > 0 ? "rose" : "emerald"}
        />
      </div>
      {overview.recent.lastCallAt ? (
        <p className="text-xs text-muted-foreground">
          {copy.lastCall}:{" "}
          <span className="font-medium text-foreground/85">
            {formatRelative(overview.recent.lastCallAt, locale)}
          </span>
        </p>
      ) : null}
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

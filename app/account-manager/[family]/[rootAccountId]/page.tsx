import { ArrowRight, Database, ShieldCheck, TestTube2, Vault } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shell/empty-state";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFamilySlug } from "@/lib/account-manager/families";
import { getVaultwardenRootAccountDetail } from "@/lib/account-manager/vaultwarden-bridge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const COPY = {
  ru: {
    eyebrow: "Vaultwarden bridge",
    title: "Синтетический root-аккаунт",
    description:
      "Это live-мост к bot-vault через localhost-only bw serve. Ниже лежат реальные items, доступные UltraDashboard прямо сейчас.",
    cards: {
      items: "Доступные items",
      source: "Источник секретов",
      fixture: "Smoke fixture",
      mode: "Режим доступа",
    },
    servicesTitle: "Linked service items",
    servicesHint:
      "Пока collections не заведены, список не режется по family и показывает всё, что видно bot-аккаунту в Vaultwarden.",
    emptyTitle: "В vault пока нет items",
    emptyHint:
      "Проверьте bot-аккаунт или создайте первую запись через Vaultwarden, после чего она появится здесь без дополнительного sync шага.",
    openCta: "Открыть карточку",
    backCta: "Назад к family",
    fixtureTag: "Fixture",
    yes: "Да",
    no: "Нет",
    missingUsername: "Логин не сохранён",
    hasPassword: "пароль есть",
    noPassword: "без пароля",
    hasTotp: "totp есть",
    noTotp: "без totp",
    statuses: {
      online: "Unlocked",
      offline: "Offline",
      unconfigured: "Не настроен",
    },
  },
  en: {
    eyebrow: "Vaultwarden bridge",
    title: "Synthetic root account",
    description:
      "This is the live bridge to the bot vault through localhost-only bw serve. The cards below are real items UltraDashboard can already read.",
    cards: {
      items: "Accessible items",
      source: "Secret source",
      fixture: "Smoke fixture",
      mode: "Access mode",
    },
    servicesTitle: "Linked service items",
    servicesHint:
      "Until collections exist, the list is not split by family and shows everything visible to the bot account in Vaultwarden.",
    emptyTitle: "No items in the vault yet",
    emptyHint:
      "Check the bot account or create the first entry through Vaultwarden. It will appear here without a separate sync step.",
    openCta: "Open card",
    backCta: "Back to family",
    fixtureTag: "Fixture",
    yes: "Yes",
    no: "No",
    missingUsername: "No username stored",
    hasPassword: "password",
    noPassword: "no password",
    hasTotp: "totp",
    noTotp: "no totp",
    statuses: {
      online: "Unlocked",
      offline: "Offline",
      unconfigured: "Unconfigured",
    },
  },
} as const;

function getStatusVariant(status: "online" | "offline" | "unconfigured") {
  if (status === "online") return "emerald" as const;
  if (status === "offline") return "rose" as const;
  return "amber" as const;
}

export default async function RootAccountDetailPage({
  params,
}: {
  params: Promise<{ family: string; rootAccountId: string }>;
}) {
  const { family, rootAccountId } = await params;
  if (!isFamilySlug(family)) notFound();

  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];
  const familyName = shell.family[family];

  const detail = await getVaultwardenRootAccountDetail(family, rootAccountId);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-5">
      <GlowCard innerClassName="flex flex-col gap-6 p-7 sm:p-9">
        <SectionHeader
          eyebrow={`${copy.eyebrow} · ${familyName}`}
          title={copy.title}
          description={copy.description}
          actions={
            <>
              <Badge variant={getStatusVariant(detail.status)}>
                {copy.statuses[detail.status]}
              </Badge>
              {detail.hasFixture ? <Badge variant="sky">{copy.fixtureTag}</Badge> : null}
              <Button asChild variant="outline">
                <Link href={`/account-manager/${family}` as Route}>{copy.backCta}</Link>
              </Button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<Database className="h-4 w-4" />} label={copy.cards.items} value={String(detail.itemCount)} />
          <MetricCard icon={<Vault className="h-4 w-4" />} label={copy.cards.source} value="Vaultwarden" />
          <MetricCard icon={<TestTube2 className="h-4 w-4" />} label={copy.cards.fixture} value={detail.hasFixture ? copy.yes : copy.no} />
          <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label={copy.cards.mode} value={detail.bridgeMode} />
        </div>
      </GlowCard>

      <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
        <SectionHeader title={copy.servicesTitle} description={copy.servicesHint} />

        {detail.services.length ? (
          <div className="grid gap-3">
            {detail.services.map((service) => {
              const href = `/account-manager/${family}/${detail.id}/services/${service.id}` as Route;
              return (
                <Link
                  key={service.id}
                  href={href}
                  className="group rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.42)] px-4 py-4 transition-all duration-300 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:bg-[hsl(var(--card)/0.62)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{service.title}</span>
                        <Badge variant="violet">{service.serviceName}</Badge>
                        {service.isFixture ? <Badge variant="sky">{copy.fixtureTag}</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {service.username ?? copy.missingUsername}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{service.hasPassword ? copy.hasPassword : copy.noPassword}</span>
                        <span>•</span>
                        <span>{service.hasTotp ? copy.hasTotp : copy.noTotp}</span>
                        {service.updatedAt ? (
                          <>
                            <span>•</span>
                            <span>{service.updatedAt}</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/85 transition-colors group-hover:text-foreground">
                      {copy.openCta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={<Vault className="h-4 w-4" />} title={copy.emptyTitle} description={detail.issue ?? copy.emptyHint} />
        )}
      </GlassPanel>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.42)] px-4 py-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--shader-a)/0.82)] via-[hsl(var(--shader-b)/0.82)] to-[hsl(var(--shader-c)/0.82)] text-primary-foreground shadow-[0_18px_48px_-28px_hsl(var(--shader-a)/0.8)]">
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

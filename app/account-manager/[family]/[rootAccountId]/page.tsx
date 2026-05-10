import {
  ArrowRight,
  Database,
  Mail,
  NotebookText,
  ShieldCheck,
  TestTube2,
  User2,
  Vault,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateLinkedServiceForm } from "@/components/account-manager/create-linked-service-form";
import { EmptyState } from "@/components/shell/empty-state";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
  isFamilySlug,
} from "@/lib/account-manager/families";
import { getRootAccountDetail } from "@/lib/account-manager/repository";
import { getVaultwardenRootAccountDetail } from "@/lib/account-manager/vaultwarden-bridge";
import { LINKED_SERVICE_CATALOG } from "@/lib/db/catalog";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const DB_COPY = {
  ru: {
    eyebrow: "Root-аккаунт",
    backCta: "Назад к family",
    metaTitle: "Сводка",
    metaServicesLabel: "Сервисов",
    metaPrimaryEmailLabel: "Email",
    metaUsernameLabel: "Username",
    metaStatusLabel: "Статус",
    servicesTitle: "Привязанные сервисы",
    servicesHint:
      "Каждая запись хранится в Postgres; live-секреты автоматически подтягиваются из Vaultwarden, когда указан vault_item_id.",
    notesTitle: "Заметки",
    emptyTitle: "Пока ни одного linked service",
    emptyHint:
      "Привяжите ChatGPT / Codex / GitHub / Devin к этому root-аккаунту. Vaultwarden item_id опционально.",
    openCta: "Открыть",
    untilLogin: "Логин не сохранён",
    hasPassword: "пароль",
    noPassword: "без пароля",
    hasTotp: "totp",
    noTotp: "без totp",
    vaultBound: "Vaultwarden item",
    plaintext: "Plaintext fallback",
    createForm: {
      toggleOpenLabel: "Новый сервис",
      toggleCloseLabel: "Свернуть",
      title: "Привязать сервис к root-аккаунту",
      description:
        "Заполните vault_item_id, чтобы live-секреты автоматически тянулись из Vaultwarden. Иначе используется plaintext fallback.",
      presetLabel: "Шаблон сервиса",
      presetPlaceholder: "— выбрать каталог —",
      serviceName: "Название сервиса",
      serviceSlug: "Slug",
      loginOrEmail: "Логин / email",
      loginUrl: "Login URL",
      vaultItemId: "Vaultwarden item ID",
      vaultItemHint:
        "Если задано — live login/password/TOTP читаются из Vaultwarden через bw serve.",
      passwordPlaintext: "Пароль (legacy fallback)",
      totpSecret: "TOTP secret (legacy fallback, base32)",
      secretsHint:
        "Plaintext секреты — fallback на время миграции. Предпочитайте vault_item_id.",
      notes: "Заметки",
      tagSlugs: "Теги (через запятую)",
      tagSlugsHint: "Например: primary, agent, billing",
      submit: "Создать",
    },
  },
  en: {
    eyebrow: "Root account",
    backCta: "Back to family",
    metaTitle: "Summary",
    metaServicesLabel: "Services",
    metaPrimaryEmailLabel: "Email",
    metaUsernameLabel: "Username",
    metaStatusLabel: "Status",
    servicesTitle: "Linked services",
    servicesHint:
      "Each record is stored in Postgres; live secrets are pulled from Vaultwarden automatically when vault_item_id is set.",
    notesTitle: "Notes",
    emptyTitle: "No linked services yet",
    emptyHint:
      "Attach ChatGPT / Codex / GitHub / Devin to this root account. The Vaultwarden item id is optional.",
    openCta: "Open",
    untilLogin: "No login stored",
    hasPassword: "password",
    noPassword: "no password",
    hasTotp: "totp",
    noTotp: "no totp",
    vaultBound: "Vaultwarden item",
    plaintext: "Plaintext fallback",
    createForm: {
      toggleOpenLabel: "New service",
      toggleCloseLabel: "Collapse",
      title: "Attach a service to this root account",
      description:
        "Set vault_item_id to pull live secrets from Vaultwarden. Otherwise the plaintext fallback columns are used.",
      presetLabel: "Catalog preset",
      presetPlaceholder: "— pick a catalog entry —",
      serviceName: "Service name",
      serviceSlug: "Slug",
      loginOrEmail: "Login / email",
      loginUrl: "Login URL",
      vaultItemId: "Vaultwarden item ID",
      vaultItemHint:
        "If set, live login/password/TOTP are read from Vaultwarden through bw serve.",
      passwordPlaintext: "Password (legacy fallback)",
      totpSecret: "TOTP secret (legacy fallback, base32)",
      secretsHint:
        "Plaintext secrets are a fallback during migration. Prefer vault_item_id.",
      notes: "Notes",
      tagSlugs: "Tags (comma-separated)",
      tagSlugsHint: "For example: primary, agent, billing",
      submit: "Create",
    },
  },
} as const;

const BRIDGE_COPY = {
  ru: {
    eyebrow: "Vaultwarden bridge",
    title: "Синтетический root-аккаунт",
    description:
      "Live-мост к bot-vault через localhost-only bw serve. Items, видимые здесь, можно превращать в реальные linked services.",
    cards: {
      items: "Доступные items",
      source: "Источник секретов",
      fixture: "Smoke fixture",
      mode: "Режим доступа",
    },
    servicesTitle: "Items в Vaultwarden",
    servicesHint:
      "Пока collections не заведены, список не режется по family и показывает всё, что видит bot-аккаунт.",
    emptyTitle: "В vault пока нет items",
    emptyHint:
      "Проверьте bot-аккаунт или создайте запись через Vaultwarden. Здесь она появится без sync шага.",
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
      "Live link to the bot vault through localhost-only bw serve. The items shown here can be promoted into real linked services.",
    cards: {
      items: "Accessible items",
      source: "Secret source",
      fixture: "Smoke fixture",
      mode: "Access mode",
    },
    servicesTitle: "Items in Vaultwarden",
    servicesHint:
      "Until collections exist, the list is not split by family and shows everything visible to the bot account.",
    emptyTitle: "No items in the vault yet",
    emptyHint:
      "Check the bot account or create the first entry through Vaultwarden — it appears here without a separate sync step.",
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
  const familyName = shell.family[family];

  if (rootAccountId === SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID) {
    return <BridgeRootView family={family} familyName={familyName} locale={locale} />;
  }

  return (
    <DbRootView
      family={family}
      familyName={familyName}
      rootAccountId={rootAccountId}
      locale={locale}
    />
  );
}

async function DbRootView({
  family,
  familyName,
  rootAccountId,
  locale,
}: {
  family: "github" | "google" | "zoho";
  familyName: string;
  rootAccountId: string;
  locale: "ru" | "en";
}) {
  const detail = await getRootAccountDetail(rootAccountId);
  if (!detail) notFound();
  const copy = DB_COPY[locale];

  return (
    <div className="flex flex-col gap-5">
      <GlowCard innerClassName="flex flex-col gap-5 p-7 sm:p-9">
        <SectionHeader
          eyebrow={`${copy.eyebrow} · ${familyName}`}
          title={detail.displayName}
          description={detail.notes ?? undefined}
          actions={
            <>
              <Badge variant={detail.status === "active" ? "emerald" : "amber"}>
                {detail.status}
              </Badge>
              <Button asChild variant="outline">
                <Link href={`/account-manager/${family}` as Route}>{copy.backCta}</Link>
              </Button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Database className="h-4 w-4" />}
            label={copy.metaServicesLabel}
            value={String(detail.linkedServiceCount)}
          />
          <MetricCard
            icon={<Mail className="h-4 w-4" />}
            label={copy.metaPrimaryEmailLabel}
            value={detail.primaryEmail ?? "—"}
          />
          <MetricCard
            icon={<User2 className="h-4 w-4" />}
            label={copy.metaUsernameLabel}
            value={detail.username ?? "—"}
          />
          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label={copy.metaStatusLabel}
            value={detail.status}
          />
        </div>
      </GlowCard>

      <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
        <SectionHeader
          title={copy.servicesTitle}
          description={copy.servicesHint}
          actions={
            <CreateLinkedServiceForm
              familySlug={family}
              rootAccountId={detail.id}
              catalog={LINKED_SERVICE_CATALOG.map((entry) => ({
                slug: entry.slug,
                serviceName: entry.serviceName,
                defaultLoginUrl: entry.defaultLoginUrl,
              }))}
              copy={copy.createForm}
            />
          }
        />

        {detail.linkedServices.length === 0 ? (
          <EmptyState
            icon={<Vault className="h-4 w-4" />}
            title={copy.emptyTitle}
            description={copy.emptyHint}
          />
        ) : (
          <ul className="grid gap-3">
            {detail.linkedServices.map((service) => {
              const href =
                `/account-manager/${family}/${detail.id}/services/${service.id}` as Route;
              const hasPassword = Boolean(service.passwordPlaintext) || Boolean(service.vaultItemId);
              const hasTotp = Boolean(service.totpSecretPlaintext) || Boolean(service.vaultItemId);
              return (
                <li key={service.id}>
                  <Link
                    href={href}
                    className="group block rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.42)] px-4 py-4 transition-all duration-300 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:bg-[hsl(var(--card)/0.62)] sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {service.serviceName}
                          </span>
                          <Badge variant={service.vaultItemId ? "violet" : "outline"}>
                            {service.vaultItemId ? copy.vaultBound : copy.plaintext}
                          </Badge>
                          {service.tags.map((tag) => (
                            <Badge key={tag.id} variant="sky">
                              {tag.label}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {service.loginOrEmail ?? copy.untilLogin}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{hasPassword ? copy.hasPassword : copy.noPassword}</span>
                          <span>•</span>
                          <span>{hasTotp ? copy.hasTotp : copy.noTotp}</span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/85 transition-colors group-hover:text-foreground">
                        {copy.openCta}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </GlassPanel>

      {detail.notes ? (
        <GlassPanel className="flex flex-col gap-3 p-6 sm:p-7">
          <SectionHeader title={copy.notesTitle} />
          <div className="rounded-xl border border-border/60 bg-background/35 p-4 text-sm leading-relaxed text-muted-foreground">
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75">
              <NotebookText className="h-3.5 w-3.5" />
              {copy.notesTitle}
            </div>
            <p className="whitespace-pre-wrap">{detail.notes}</p>
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}

async function BridgeRootView({
  family,
  familyName,
  locale,
}: {
  family: "github" | "google" | "zoho";
  familyName: string;
  locale: "ru" | "en";
}) {
  const detail = await getVaultwardenRootAccountDetail(family, SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID);
  if (!detail) notFound();
  const copy = BRIDGE_COPY[locale];

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
          <MetricCard
            icon={<Database className="h-4 w-4" />}
            label={copy.cards.items}
            value={String(detail.itemCount)}
          />
          <MetricCard
            icon={<Vault className="h-4 w-4" />}
            label={copy.cards.source}
            value="Vaultwarden"
          />
          <MetricCard
            icon={<TestTube2 className="h-4 w-4" />}
            label={copy.cards.fixture}
            value={detail.hasFixture ? copy.yes : copy.no}
          />
          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label={copy.cards.mode}
            value={detail.bridgeMode}
          />
        </div>
      </GlowCard>

      <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
        <SectionHeader title={copy.servicesTitle} description={copy.servicesHint} />

        {detail.services.length ? (
          <div className="grid gap-3">
            {detail.services.map((service) => {
              const href =
                `/account-manager/${family}/${detail.id}/services/${service.id}` as Route;
              return (
                <Link
                  key={service.id}
                  href={href}
                  className="group rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.42)] px-4 py-4 transition-all duration-300 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:bg-[hsl(var(--card)/0.62)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {service.title}
                        </span>
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
          <EmptyState
            icon={<Vault className="h-4 w-4" />}
            title={copy.emptyTitle}
            description={detail.issue ?? copy.emptyHint}
          />
        )}
      </GlassPanel>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.42)] px-4 py-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--shader-a)/0.82)] via-[hsl(var(--shader-b)/0.82)] to-[hsl(var(--shader-c)/0.82)] text-primary-foreground shadow-[0_18px_48px_-28px_hsl(var(--shader-a)/0.8)]">
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

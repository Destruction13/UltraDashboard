import { ArrowRight, Cable, Search, Vault } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shell/empty-state";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FAMILY_SLUGS,
  SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
  isFamilySlug,
} from "@/lib/account-manager/families";
import { getVaultwardenRootAccountSummary } from "@/lib/account-manager/vaultwarden-bridge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";
import { getVaultwardenConfig } from "@/lib/vaultwarden/config";

const COPY = {
  ru: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Семейство",
    listTitle: "Root-аккаунты",
    searchPlaceholder: "Фильтр по bridge-аккаунту…",
    searchButton: "Применить",
    emptyFilteredTitle: "Ничего не найдено",
    emptyFilteredHint:
      "Пока есть только синтетический root-аккаунт для Vaultwarden bridge. Сбросьте фильтр или добавьте новые источники позже.",
    bridgeTitle: "Vaultwarden bridge",
    bridgeSubtitle:
      "Локальный bw serve на VPS уже поднят. Эта строка ведёт к рабочему detail-view с live login / password / TOTP.",
    bridgeMeta: "Доступные items",
    fixtureBadge: "Smoke fixture",
    statusTitle: "Состояние bridge",
    statusHint:
      "Секреты больше не нужно тянуть в Postgres для UI. UltraDashboard читает их через localhost-only bw serve.",
    bridgePanelTitle: "Живой bridge",
    configLabel: "Режим",
    endpointLabel: "Vault URL",
    rootHint:
      "Пока organization и collections ещё не заведены, один и тот же bridge показывается в каждой family-вкладке.",
    onlineHint:
      "bw serve уже unlocked, поэтому следующий экран может читать реальные item-данные и текущие TOTP-коды из Vaultwarden.",
    offlineHint: "Vaultwarden в этом окружении ещё не настроен.",
    statuses: {
      online: "Unlocked",
      offline: "Offline",
      unconfigured: "Не настроен",
    },
  },
  en: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Family",
    listTitle: "Root accounts",
    searchPlaceholder: "Filter the bridge account…",
    searchButton: "Apply",
    emptyFilteredTitle: "Nothing matches this filter",
    emptyFilteredHint:
      "The only live root account right now is the synthetic Vaultwarden bridge. Clear the filter or add more sources later.",
    bridgeTitle: "Vaultwarden bridge",
    bridgeSubtitle:
      "The localhost bw serve bridge is already live on the VPS. This row opens a working detail view with live login, password, and TOTP.",
    bridgeMeta: "Accessible items",
    fixtureBadge: "Smoke fixture",
    statusTitle: "Bridge status",
    statusHint:
      "Secrets no longer need to be copied into Postgres for the UI. UltraDashboard reads them through localhost-only bw serve.",
    bridgePanelTitle: "Live bridge",
    configLabel: "Mode",
    endpointLabel: "Vault URL",
    rootHint:
      "Until the organization and collections are created, the same bridge appears under every family tab.",
    onlineHint:
      "bw serve is already unlocked, so the next screen can read real item data and current TOTP codes from Vaultwarden.",
    offlineHint: "Vaultwarden is not configured in this environment yet.",
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

export default async function FamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{ family: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ family }, { q }] = await Promise.all([params, searchParams]);
  if (!isFamilySlug(family)) notFound();

  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];
  const familyName = shell.family[family];
  const search = q?.trim() ?? "";

  const [summary, config] = await Promise.all([
    getVaultwardenRootAccountSummary(),
    Promise.resolve(getVaultwardenConfig()),
  ]);

  const searchMatch =
    search.length === 0 ||
    summary.displayName.toLowerCase().includes(search.toLowerCase()) ||
    "vaultwarden bridge".includes(search.toLowerCase());

  const rootHref = `/account-manager/${family}/${SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID}` as Route;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <GlowCard innerClassName="flex flex-col gap-5 p-7 sm:p-9">
        <SectionHeader
          eyebrow={`${copy.eyebrow} · ${copy.descriptionPrefix} ${familyName}`}
          title={copy.listTitle}
          description={copy.rootHint}
          actions={
            <>
              <Badge variant={getStatusVariant(summary.status)}>
                {copy.statuses[summary.status]}
              </Badge>
              {summary.hasFixture ? (
                <Badge variant="sky">{copy.fixtureBadge}</Badge>
              ) : null}
            </>
          }
        />

        <form className="flex flex-col gap-3 sm:flex-row" action="">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.55)] py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" variant="outline">
            {copy.searchButton}
          </Button>
        </form>

        {searchMatch ? (
          <Link
            href={rootHref}
            className="group rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.42)] px-4 py-4 transition-all duration-300 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:bg-[hsl(var(--card)/0.62)]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--shader-a)/0.88)] via-[hsl(var(--shader-b)/0.88)] to-[hsl(var(--shader-c)/0.88)] text-primary-foreground shadow-[0_18px_48px_-28px_hsl(var(--shader-a)/0.8)]">
                  <Vault className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {copy.bridgeTitle}
                    </span>
                    <Badge variant={getStatusVariant(summary.status)}>
                      {copy.statuses[summary.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {copy.bridgeSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-right">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {copy.bridgeMeta}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {summary.itemCount}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
            </div>
          </Link>
        ) : (
          <EmptyState
            icon={<Search className="h-4 w-4" />}
            title={copy.emptyFilteredTitle}
            description={copy.emptyFilteredHint}
          />
        )}
      </GlowCard>

      <GlassPanel className="flex flex-col gap-4 p-6 lg:sticky lg:top-24 lg:self-start">
        <SectionHeader eyebrow="Vaultwarden" title={copy.statusTitle} description={copy.statusHint} />

        <div className="grid gap-3 text-xs">
          <StatusRow label={copy.configLabel} value={config.accessMode ?? "disabled"} />
          <StatusRow label={copy.endpointLabel} value={config.baseUrl ?? "-"} />
          <StatusRow label="bw serve" value={config.bwServeUrl ?? "-"} />
          <StatusRow label="Root ID" value={SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID} />
          <StatusRow label="Family tabs" value={String(FAMILY_SLUGS.length)} />
          <StatusRow label="Fixture item" value={config.testItemId ?? "-"} />
        </div>

        <div className="rounded-xl border border-border/60 bg-background/35 p-4 text-xs leading-relaxed text-muted-foreground">
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75">
            <Cable className="h-3.5 w-3.5" />
            {copy.bridgePanelTitle}
          </div>
          <p>
            {summary.status === "online"
              ? copy.onlineHint
              : config.issue ?? copy.offlineHint}
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/35 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[180px] truncate font-mono text-[11px] text-foreground">{value}</span>
    </div>
  );
}

export function generateStaticParams() {
  return FAMILY_SLUGS.map((slug) => ({ family: slug }));
}

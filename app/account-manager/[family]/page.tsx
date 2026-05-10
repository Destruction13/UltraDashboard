import { ArrowRight, Cable, Search, Tag as TagIcon, Vault } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateRootAccountForm } from "@/components/account-manager/create-root-account-form";
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
import {
  listRootAccountsForFamily,
  listTags,
  type RootAccountWithCounts,
  type TagRow,
} from "@/lib/account-manager/repository";
import { getVaultwardenRootAccountSummary } from "@/lib/account-manager/vaultwarden-bridge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";
import { getVaultwardenConfig } from "@/lib/vaultwarden/config";

const COPY = {
  ru: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Семейство",
    listTitle: "Root-аккаунты",
    searchPlaceholder: "Поиск по имени, email, логину…",
    searchButton: "Применить",
    tagFilterLabel: "Фильтр по тегу",
    tagFilterClear: "Сбросить",
    emptyFilteredTitle: "Ничего не найдено",
    emptyFilteredHint:
      "Под текущие фильтры записей нет. Сбросьте поиск или создайте root-аккаунт.",
    emptyDbTitle: "В этом семействе ещё нет root-аккаунтов",
    emptyDbHint:
      "Добавьте первый root-аккаунт, чтобы зацепить к нему ChatGPT, Codex, GitHub, Devin и другие сервисы.",
    bridgeTitle: "Vaultwarden bridge",
    bridgeSubtitle:
      "Discovery-карточка: live-мост к bot-vault через localhost-only bw serve. Помогает мигрировать item-ы в реальные linked services.",
    bridgeMeta: "Items в vault",
    fixtureBadge: "Smoke fixture",
    statusTitle: "Состояние bridge",
    statusHint:
      "Vaultwarden остаётся источником секретов. Реальные linked services связываются с ним через vault_item_id.",
    bridgePanelTitle: "Живой bridge",
    configLabel: "Режим",
    endpointLabel: "Vault URL",
    rootHint:
      "Реальные dashboard-owned root-аккаунты. Привязывайте linked services к Vaultwarden через vault_item_id.",
    onlineHint:
      "bw serve уже unlocked — карточки сервисов читают live login/password/TOTP из Vaultwarden.",
    offlineHint: "Vaultwarden в этом окружении ещё не настроен.",
    statuses: {
      online: "Unlocked",
      offline: "Offline",
      unconfigured: "Не настроен",
    },
    createForm: {
      toggleOpenLabel: "Новый root",
      toggleCloseLabel: "Свернуть",
      title: "Создать root-аккаунт",
      description: "Это контейнер для linked services этого человека / личности.",
      displayName: "Отображаемое имя",
      primaryEmail: "Основной email",
      username: "Логин / username",
      notes: "Заметки",
      submit: "Создать",
    },
    services: "сервисов",
    untilLogin: "Логин не указан",
    untilEmail: "Email не указан",
  },
  en: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Family",
    listTitle: "Root accounts",
    searchPlaceholder: "Search by name, email, login…",
    searchButton: "Apply",
    tagFilterLabel: "Filter by tag",
    tagFilterClear: "Clear",
    emptyFilteredTitle: "Nothing matches this filter",
    emptyFilteredHint:
      "No records match the current filters. Clear the search or add a new root account.",
    emptyDbTitle: "No root accounts in this family yet",
    emptyDbHint:
      "Create the first root account, then link ChatGPT, Codex, GitHub, Devin, and other services to it.",
    bridgeTitle: "Vaultwarden bridge",
    bridgeSubtitle:
      "Discovery card: live link to the bot vault via localhost-only bw serve. Use it to migrate vault items into real linked services.",
    bridgeMeta: "Items in vault",
    fixtureBadge: "Smoke fixture",
    statusTitle: "Bridge status",
    statusHint:
      "Vaultwarden remains the live secret source. Real linked services bind to it through vault_item_id.",
    bridgePanelTitle: "Live bridge",
    configLabel: "Mode",
    endpointLabel: "Vault URL",
    rootHint:
      "Real dashboard-owned root accounts. Attach linked services to Vaultwarden through vault_item_id.",
    onlineHint:
      "bw serve is already unlocked — linked service cards read live login/password/TOTP from Vaultwarden.",
    offlineHint: "Vaultwarden is not configured in this environment yet.",
    statuses: {
      online: "Unlocked",
      offline: "Offline",
      unconfigured: "Unconfigured",
    },
    createForm: {
      toggleOpenLabel: "New root",
      toggleCloseLabel: "Collapse",
      title: "Create root account",
      description: "A container for the linked services of one person or identity.",
      displayName: "Display name",
      primaryEmail: "Primary email",
      username: "Login / username",
      notes: "Notes",
      submit: "Create",
    },
    services: "services",
    untilLogin: "No login stored",
    untilEmail: "No email stored",
  },
} as const;

function getStatusVariant(status: "online" | "offline" | "unconfigured") {
  if (status === "online") return "emerald" as const;
  if (status === "offline") return "rose" as const;
  return "amber" as const;
}

function buildFamilyHref(family: string, params: { q?: string; tag?: string }): Route {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tag) search.set("tag", params.tag);
  const qs = search.toString();
  return (`/account-manager/${family}${qs ? `?${qs}` : ""}`) as Route;
}

export default async function FamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{ family: string }>;
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const [{ family }, { q, tag }] = await Promise.all([params, searchParams]);
  if (!isFamilySlug(family)) notFound();

  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];
  const familyName = shell.family[family];
  const search = q?.trim() ?? "";
  const tagFilter = tag?.trim() ?? "";

  const [summary, config, rootAccounts, allTags] = await Promise.all([
    getVaultwardenRootAccountSummary(),
    Promise.resolve(getVaultwardenConfig()),
    listRootAccountsForFamily(family, {
      search: search || undefined,
      tagSlug: tagFilter || undefined,
    }),
    listTags(),
  ]);

  const bridgeMatchesSearch =
    search.length === 0 ||
    "vaultwarden bridge".includes(search.toLowerCase()) ||
    summary.displayName.toLowerCase().includes(search.toLowerCase());
  const showBridgeCard = !tagFilter && bridgeMatchesSearch;

  const bridgeHref =
    `/account-manager/${family}/${SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID}` as Route;

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
              <CreateRootAccountForm familySlug={family} copy={copy.createForm} />
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
          {tagFilter ? <input type="hidden" name="tag" value={tagFilter} /> : null}
          <Button type="submit" variant="outline">
            {copy.searchButton}
          </Button>
        </form>

        <TagFilterBar
          family={family}
          tags={allTags}
          activeTag={tagFilter}
          search={search}
          labels={{ label: copy.tagFilterLabel, clear: copy.tagFilterClear }}
        />

        {rootAccounts.length === 0 ? (
          search || tagFilter ? (
            <EmptyState
              icon={<Search className="h-4 w-4" />}
              title={copy.emptyFilteredTitle}
              description={copy.emptyFilteredHint}
            />
          ) : (
            <EmptyState
              icon={<TagIcon className="h-4 w-4" />}
              title={copy.emptyDbTitle}
              description={copy.emptyDbHint}
            />
          )
        ) : (
          <ul className="flex flex-col gap-3">
            {rootAccounts.map((root) => (
              <RootAccountRow
                key={root.id}
                family={family}
                root={root}
                servicesWord={copy.services}
                emptyLogin={copy.untilLogin}
                emptyEmail={copy.untilEmail}
              />
            ))}
          </ul>
        )}

        {showBridgeCard ? (
          <Link
            href={bridgeHref}
            className="group rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.32)] px-4 py-4 transition-all duration-300 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:bg-[hsl(var(--card)/0.52)]">
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
                  <p className="text-sm font-semibold text-foreground">{summary.itemCount}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
            </div>
          </Link>
        ) : null}
      </GlowCard>

      <GlassPanel className="flex flex-col gap-4 p-6 lg:sticky lg:top-24 lg:self-start">
        <SectionHeader eyebrow="Vaultwarden" title={copy.statusTitle} description={copy.statusHint} />

        <div className="grid gap-3 text-xs">
          <StatusRow label={copy.configLabel} value={config.accessMode ?? "disabled"} />
          <StatusRow label={copy.endpointLabel} value={config.baseUrl ?? "-"} />
          <StatusRow label="bw serve" value={config.bwServeUrl ?? "-"} />
          <StatusRow label="Bridge ID" value={SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID} />
          <StatusRow label="Family tabs" value={String(FAMILY_SLUGS.length)} />
          <StatusRow label="Fixture item" value={config.testItemId ?? "-"} />
        </div>

        <div className="rounded-xl border border-border/60 bg-background/35 p-4 text-xs leading-relaxed text-muted-foreground">
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75">
            <Cable className="h-3.5 w-3.5" />
            {copy.bridgePanelTitle}
          </div>
          <p>{summary.status === "online" ? copy.onlineHint : config.issue ?? copy.offlineHint}</p>
        </div>
      </GlassPanel>
    </div>
  );
}

function TagFilterBar({
  family,
  tags,
  activeTag,
  search,
  labels,
}: {
  family: string;
  tags: TagRow[];
  activeTag: string;
  search: string;
  labels: { label: string; clear: string };
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <TagIcon className="h-3.5 w-3.5" />
        {labels.label}
      </span>
      {tags.map((tag) => {
        const isActive = tag.slug === activeTag;
        return (
          <Link
            key={tag.id}
            href={buildFamilyHref(family, { q: search || undefined, tag: tag.slug })}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
          >
            <Badge variant={isActive ? "violet" : "outline"}>{tag.label}</Badge>
          </Link>
        );
      })}
      {activeTag ? (
        <Link
          href={buildFamilyHref(family, { q: search || undefined })}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {labels.clear}
        </Link>
      ) : null}
    </div>
  );
}

function RootAccountRow({
  family,
  root,
  servicesWord,
  emptyLogin,
  emptyEmail,
}: {
  family: string;
  root: RootAccountWithCounts;
  servicesWord: string;
  emptyLogin: string;
  emptyEmail: string;
}) {
  const href = `/account-manager/${family}/${root.id}` as Route;
  return (
    <li>
      <Link
        href={href}
        className="group block rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.42)] px-4 py-4 transition-all duration-300 hover:border-[hsl(var(--glass-stroke)/0.9)] hover:bg-[hsl(var(--card)/0.62)]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--shader-a)/0.65)] via-[hsl(var(--shader-b)/0.55)] to-[hsl(var(--shader-c)/0.65)] text-primary-foreground shadow-[0_18px_48px_-28px_hsl(var(--shader-a)/0.8)]">
              <span className="text-sm font-semibold uppercase">
                {root.displayName.slice(0, 2)}
              </span>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{root.displayName}</span>
                {root.status !== "active" ? <Badge variant="amber">{root.status}</Badge> : null}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {root.primaryEmail ?? emptyEmail} · {root.username ?? emptyLogin}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {servicesWord}
              </p>
              <p className="text-sm font-semibold text-foreground">{root.linkedServiceCount}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
          </div>
        </div>
      </Link>
    </li>
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

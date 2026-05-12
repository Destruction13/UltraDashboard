import { ArrowRight, Cable, Search, UserRoundPlus, Vault } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateRootAccountForm } from "@/components/account-manager/vaultwarden-forms";
import { EmptyState } from "@/components/shell/empty-state";
import { GlassPanel } from "@/components/shell/glass-panel";
import { GlowCard } from "@/components/shell/glow-card";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFamilySlug } from "@/lib/account-manager/families";
import { listVaultwardenRootAccounts } from "@/lib/account-manager/vaultwarden-bridge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";
import { getVaultwardenBridgeStatus } from "@/lib/vaultwarden/client";
import { getVaultwardenConfig } from "@/lib/vaultwarden/config";

const COPY = {
  ru: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Семейство",
    listTitle: "Root-аккаунты",
    rootHint:
      "Эта вкладка показывает реальные root-аккаунты, собранные из серверного Vaultwarden. Новые записи, созданные здесь, сразу уходят на VPS через bw serve.",
    searchPlaceholder: "Фильтр по root-аккаунту, email или username…",
    searchButton: "Применить",
    emptyTitle: "Подходящих root-аккаунтов пока нет",
    emptyHint:
      "Создайте первую запись ниже или добавьте item на сервере в Vaultwarden. После синка он появится здесь как часть соответствующего root-аккаунта.",
    bridgeMeta: "Linked items",
    fixtureBadge: "Smoke fixture",
    statusTitle: "Состояние bridge",
    statusHint:
      "Dashboard читает и пишет записи напрямую в Vaultwarden. Локальная разработка работает через SSH-forward до bw serve на VPS.",
    bridgePanelTitle: "Живой bridge",
    configLabel: "Режим",
    endpointLabel: "Vault URL",
    statuses: {
      online: "Unlocked",
      offline: "Offline",
      unconfigured: "Не настроен",
    },
    createTitle: "Создать серверную запись",
    createHint:
      "Ниже можно создать root-аккаунт и первый linked service прямо в Vaultwarden на сервере.",
    noRootsOnline: "Bridge живой, но root-аккаунтов в Vaultwarden ещё нет.",
    noRootsOffline: "Bridge пока недоступен. Проверьте SSH-forward до bw serve или серверный runtime.",
  },
  en: {
    eyebrow: "AccountManager",
    descriptionPrefix: "Family",
    listTitle: "Root accounts",
    rootHint:
      "This tab shows real root accounts projected from server-side Vaultwarden. New records created here are written to the VPS immediately through bw serve.",
    searchPlaceholder: "Filter by root account, email, or username…",
    searchButton: "Apply",
    emptyTitle: "No matching root accounts yet",
    emptyHint:
      "Create the first entry below or add an item on the server in Vaultwarden. After sync it will appear here under the matching root account.",
    bridgeMeta: "Linked items",
    fixtureBadge: "Smoke fixture",
    statusTitle: "Bridge status",
    statusHint:
      "The dashboard now reads and writes records directly in Vaultwarden. Local development talks to the VPS through an SSH forward to bw serve.",
    bridgePanelTitle: "Live bridge",
    configLabel: "Mode",
    endpointLabel: "Vault URL",
    statuses: {
      online: "Unlocked",
      offline: "Offline",
      unconfigured: "Unconfigured",
    },
    createTitle: "Create a server entry",
    createHint:
      "Use the form below to create a root account and its first linked service directly inside Vaultwarden on the server.",
    noRootsOnline: "The bridge is live, but there are no root accounts in Vaultwarden yet.",
    noRootsOffline: "The bridge is currently unavailable. Check the SSH forward to bw serve or the server runtime.",
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
  const search = q?.trim().toLowerCase() ?? "";

  const [roots, config, bridgeStatus] = await Promise.all([
    listVaultwardenRootAccounts(family),
    Promise.resolve(getVaultwardenConfig()),
    getVaultwardenBridgeStatus(),
  ]);

  const filteredRoots =
    search.length === 0
      ? roots
      : roots.filter((root) =>
          [root.displayName, root.description, root.primaryEmail ?? "", root.username ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(search),
        );

  const bridgeState = bridgeStatus.available
    ? "online"
    : bridgeStatus.configured
      ? "offline"
      : "unconfigured";
  const emptyDescription =
    bridgeState === "online"
      ? roots.length > 0
        ? copy.emptyHint
        : copy.noRootsOnline
      : copy.noRootsOffline;
  const bridgePanelDescription =
    bridgeStatus.issue ??
    (bridgeState === "online"
      ? roots.length > 0
        ? copy.statusHint
        : copy.noRootsOnline
      : copy.noRootsOffline);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
      <div className="grid gap-5">
        <GlowCard innerClassName="flex flex-col gap-5 p-7 sm:p-9">
          <SectionHeader
            eyebrow={`${copy.eyebrow} · ${copy.descriptionPrefix} ${familyName}`}
            title={copy.listTitle}
            description={copy.rootHint}
            actions={<Badge variant={getStatusVariant(bridgeState)}>{copy.statuses[bridgeState]}</Badge>}
          />

          <form className="flex flex-col gap-3 sm:flex-row" action="">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={q?.trim() ?? ""}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-xl border border-[hsl(var(--glass-stroke)/0.55)] bg-[hsl(var(--card)/0.55)] py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" variant="outline">
              {copy.searchButton}
            </Button>
          </form>

          {filteredRoots.length ? (
            <div className="grid gap-3">
              {filteredRoots.map((root) => {
                const rootHref = `/account-manager/${family}/${root.id}` as Route;
                return (
                  <Link
                    key={root.id}
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
                            <span className="text-sm font-semibold text-foreground">{root.displayName}</span>
                            <Badge variant={getStatusVariant(root.status)}>{copy.statuses[root.status]}</Badge>
                            {root.hasFixture ? <Badge variant="sky">{copy.fixtureBadge}</Badge> : null}
                          </div>

                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {root.description}
                          </p>

                          {(root.primaryEmail || root.username) ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              {root.primaryEmail ? <span>{root.primaryEmail}</span> : null}
                              {root.primaryEmail && root.username ? <span>•</span> : null}
                              {root.username ? <span>{root.username}</span> : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 text-right">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            {copy.bridgeMeta}
                          </p>
                          <p className="text-sm font-semibold text-foreground">{root.itemCount}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Vault className="h-4 w-4" />}
              title={copy.emptyTitle}
              description={emptyDescription}
            />
          )}
        </GlowCard>

        <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
          <SectionHeader
            eyebrow={<UserRoundPlus className="h-3.5 w-3.5" />}
            title={copy.createTitle}
            description={copy.createHint}
          />
          <CreateRootAccountForm family={family} locale={locale} />
        </GlassPanel>
      </div>

      <GlassPanel className="flex flex-col gap-4 p-6 lg:sticky lg:top-24 lg:self-start">
        <SectionHeader eyebrow="Vaultwarden" title={copy.statusTitle} description={copy.statusHint} />

        <div className="grid gap-3 text-xs">
          <StatusRow label={copy.configLabel} value={config.accessMode ?? "disabled"} />
          <StatusRow label={copy.endpointLabel} value={config.baseUrl ?? "-"} />
          <StatusRow label="bw serve" value={config.bwServeUrl ?? "-"} />
          <StatusRow label="Root accounts" value={String(roots.length)} />
          <StatusRow label="Linked items" value={String(roots.reduce((sum, root) => sum + root.itemCount, 0))} />
          <StatusRow label="Fixture item" value={config.testItemId ?? "-"} />
        </div>

        <div className="rounded-xl border border-border/60 bg-background/35 p-4 text-xs leading-relaxed text-muted-foreground">
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75">
            <Cable className="h-3.5 w-3.5" />
            {copy.bridgePanelTitle}
          </div>
          <p>{bridgePanelDescription}</p>
        </div>
      </GlassPanel>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/35 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[200px] truncate font-mono text-[11px] text-foreground">{value}</span>
    </div>
  );
}

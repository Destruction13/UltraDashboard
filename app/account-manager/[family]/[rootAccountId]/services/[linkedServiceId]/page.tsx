import {
  Calendar,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  NotebookText,
  ShieldCheck,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/account-manager/copy-button";
import { RoadmapRenderer } from "@/components/account-manager/roadmap-renderer";
import { GlassPanel } from "@/components/shell/glass-panel";
import { SectionHeader } from "@/components/shell/section-header";
import { TwoColumnDetail } from "@/components/shell/two-column-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFamilySlug } from "@/lib/account-manager/families";
import { getVaultwardenLinkedServiceDetail } from "@/lib/account-manager/vaultwarden-bridge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const COPY = {
  ru: {
    credentialTitle: "Учётные данные",
    credentialHint:
      "Эти значения читаются из Vaultwarden через bw serve на VPS. Ничего не копируется в клиентский код заранее.",
    actionsTitle: "Быстрые действия",
    metadataTitle: "Метаданные",
    notesTitle: "Заметки",
    username: "Логин / email",
    password: "Пароль",
    totp: "Текущий TOTP",
    loginUrl: "Login URL",
    createdAt: "Создано",
    updatedAt: "Обновлено",
    source: "Источник",
    copy: "Копировать",
    copied: "Готово",
    copyAll: "Скопировать всё",
    openService: "Открыть сервис",
    backCta: "Назад к item list",
    fixtureTag: "Fixture",
    emptyValue: "Нет значения",
    notesBlockLabel: "Заметки",
  },
  en: {
    credentialTitle: "Credentials",
    credentialHint:
      "These values are read from Vaultwarden through bw serve on the VPS. Nothing is pre-baked into the client bundle.",
    actionsTitle: "Quick actions",
    metadataTitle: "Metadata",
    notesTitle: "Notes",
    username: "Login / email",
    password: "Password",
    totp: "Current TOTP",
    loginUrl: "Login URL",
    createdAt: "Created",
    updatedAt: "Updated",
    source: "Source",
    copy: "Copy",
    copied: "Copied",
    copyAll: "Copy all",
    openService: "Open service",
    backCta: "Back to item list",
    fixtureTag: "Fixture",
    emptyValue: "No value stored",
    notesBlockLabel: "Notes",
  },
} as const;

export default async function LinkedServiceDetailPage({
  params,
}: {
  params: Promise<{ family: string; rootAccountId: string; linkedServiceId: string }>;
}) {
  const { family, rootAccountId, linkedServiceId } = await params;
  if (!isFamilySlug(family)) notFound();

  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];
  const familyName = shell.family[family];

  const detail = await getVaultwardenLinkedServiceDetail(rootAccountId, linkedServiceId);
  if (!detail) notFound();

  const copyAllValue = [
    detail.username ? `${copy.username}: ${detail.username}` : null,
    detail.password ? `${copy.password}: ${detail.password}` : null,
    detail.currentTotp ? `${copy.totp}: ${detail.currentTotp}` : null,
    detail.loginUrl ? `${copy.loginUrl}: ${detail.loginUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex flex-col gap-5">
      <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
        <SectionHeader
          eyebrow={`${familyName} · ${detail.rootAccountName}`}
          title={detail.title}
          description={detail.serviceName}
          actions={
            <>
              <Badge variant="violet">{detail.serviceName}</Badge>
              {detail.isFixture ? <Badge variant="sky">{copy.fixtureTag}</Badge> : null}
              <Button asChild variant="outline">
                <Link href={`/account-manager/${family}/${rootAccountId}` as Route}>{copy.backCta}</Link>
              </Button>
            </>
          }
        />
      </GlassPanel>

      <TwoColumnDetail
        left={
          <>
            <GlassPanel className="flex flex-col gap-5 p-6 sm:p-7">
              <SectionHeader title={copy.credentialTitle} description={copy.credentialHint} />

              <CredentialRow
                icon={<KeyRound className="h-4 w-4" />}
                label={copy.username}
                value={detail.username}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
              />
              <CredentialRow
                icon={<LockKeyhole className="h-4 w-4" />}
                label={copy.password}
                value={detail.password}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
              />
              <CredentialRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label={copy.totp}
                value={detail.currentTotp}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
                emphasize
              />
              <CredentialRow
                icon={<ExternalLink className="h-4 w-4" />}
                label={copy.loginUrl}
                value={detail.loginUrl}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
                linkValue={detail.loginUrl}
                linkLabel={copy.openService}
              />
            </GlassPanel>

            <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
              <SectionHeader title={copy.actionsTitle} />
              <div className="flex flex-wrap gap-2">
                <CopyButton value={copyAllValue || null} label={copy.copyAll} copiedLabel={copy.copied} />
                {detail.loginUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={detail.loginUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {copy.openService}
                    </a>
                  </Button>
                ) : null}
              </div>
            </GlassPanel>

            <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
              <SectionHeader title={copy.metadataTitle} />
              <MetadataRow label={copy.source} value="Vaultwarden / bw serve" />
              <MetadataRow label={copy.createdAt} value={detail.createdAt ?? copy.emptyValue} icon={<Calendar className="h-3.5 w-3.5" />} />
              <MetadataRow label={copy.updatedAt} value={detail.updatedAt ?? copy.emptyValue} icon={<Calendar className="h-3.5 w-3.5" />} />
            </GlassPanel>

            {detail.notes ? (
              <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
                <SectionHeader title={copy.notesTitle} />
                <div className="rounded-xl border border-border/60 bg-background/35 p-4 text-sm leading-relaxed text-muted-foreground">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75">
                    <NotebookText className="h-3.5 w-3.5" />
                    {copy.notesBlockLabel}
                  </div>
                  <p>{detail.notes}</p>
                </div>
              </GlassPanel>
            ) : null}
          </>
        }
        right={<RoadmapRenderer title={detail.instructionTitle} summary={detail.instructionSummary} content={detail.instructionContent} />}
      />
    </div>
  );
}

function CredentialRow({
  icon,
  label,
  value,
  copyLabel,
  copiedLabel,
  emptyValue,
  emphasize = false,
  linkValue,
  linkLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  copyLabel: string;
  copiedLabel: string;
  emptyValue: string;
  emphasize?: boolean;
  linkValue?: string | null;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/35 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="flex items-center gap-2">
          {linkValue && linkLabel ? (
            <Button asChild variant="ghost" size="sm">
              <a href={linkValue} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                {linkLabel}
              </a>
            </Button>
          ) : null}
          <CopyButton value={value} label={copyLabel} copiedLabel={copiedLabel} />
        </div>
      </div>
      <div
        className={[
          "break-all rounded-lg border border-border/60 bg-background/45 px-3 py-3 text-sm text-foreground",
          emphasize ? "font-mono text-xl tracking-[0.24em]" : "font-mono text-[13px]",
        ].join(" ")}
      >
        {value ?? emptyValue}
      </div>
    </div>
  );
}

function MetadataRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/35 px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="max-w-[230px] truncate font-mono text-[12px] text-foreground">{value}</span>
    </div>
  );
}

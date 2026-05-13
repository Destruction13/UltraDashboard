import {
  Calendar,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  NotebookText,
  ShieldCheck,
  Tag as TagIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArchiveLinkedServiceButton } from "@/components/account-manager/archive-linked-service-button";
import { CopyButton } from "@/components/account-manager/copy-button";
import { EditInstructionsForm } from "@/components/account-manager/edit-instructions-form";
import { EditNotesForm } from "@/components/account-manager/edit-notes-form";
import { RoadmapRenderer } from "@/components/account-manager/roadmap-renderer";
import { GlassPanel } from "@/components/shell/glass-panel";
import { SectionHeader } from "@/components/shell/section-header";
import { TwoColumnDetail } from "@/components/shell/two-column-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
  isFamilySlug,
  type FamilySlug,
} from "@/lib/account-manager/families";
import { isUuid } from "@/lib/account-manager/ids";
import {
  getLinkedServiceDetailById,
  type LinkedServiceDetail,
} from "@/lib/account-manager/repository";
import {
  getVaultwardenLinkedServiceDetail,
  type VaultwardenLinkedServiceDetail,
} from "@/lib/account-manager/vaultwarden-bridge";
import { readLocaleFromCookies } from "@/lib/i18n/cookie";
import { getShellDictionary } from "@/lib/i18n/dictionaries";

const COPY = {
  ru: {
    credentialTitle: "Учётные данные",
    credentialHintVault:
      "Live login/password/TOTP читаются из Vaultwarden через bw serve. В клиентский код ничего не прошито.",
    credentialHintPlaintext:
      "Используется legacy plaintext fallback. Привяжите vault_item_id, чтобы перейти на live-источник.",
    credentialHintEmpty:
      "Секреты не настроены. Привяжите vault_item_id или заполните plaintext поля.",
    bridgeIssue: "Vaultwarden bridge сообщил об ошибке:",
    actionsTitle: "Быстрые действия",
    metadataTitle: "Метаданные",
    notesTitle: "Заметки",
    editNotesTitle: "Редактировать заметки",
    instructionsTitle: "Инструкция (roadmap)",
    editInstructionsTitle: "Редактировать инструкцию",
    archiveTitle: "Архивировать",
    archiveDescription:
      "Архивная запись перестаёт показываться в списках, но данные остаются в БД.",
    archiveButton: "Архивировать",
    archiveConfirm: "Архивировать этот linked service?",
    tagsLabel: "Теги",
    sourceVault: "Vaultwarden item",
    sourcePlaintext: "Plaintext fallback",
    sourceEmpty: "Без секретов",
    username: "Логин / email",
    password: "Пароль",
    totp: "Текущий TOTP",
    loginUrl: "Login URL",
    createdAt: "Создано",
    updatedAt: "Обновлено",
    source: "Источник",
    vaultItemId: "Vault item",
    copy: "Копировать",
    copied: "Готово",
    copyAll: "Скопировать всё",
    openService: "Открыть сервис",
    backCta: "Назад к root",
    fixtureTag: "Fixture",
    emptyValue: "Нет значения",
    notesBlockLabel: "Заметки",
    notesPlaceholder:
      "Заметки оператора: что важно знать про эту учётку, специфика OTP, ограничения и т.д.",
    notesSubmit: "Сохранить заметки",
    instructionsTitleField: "Заголовок",
    instructionsSummaryField: "Краткое описание",
    instructionsContentField: "Содержимое (content_json)",
    instructionsContentHint:
      "Формат: { version: 1, blocks: [...] }. Поддерживаемые типы блоков: overview, steps, tips, warnings, links.",
    instructionsSubmit: "Сохранить инструкцию",
    instructionsValidationError:
      "Невалидный JSON. Ожидается { version: 1, blocks: [...] }.",
  },
  en: {
    credentialTitle: "Credentials",
    credentialHintVault:
      "Live login/password/TOTP are read from Vaultwarden through bw serve. Nothing is baked into the client bundle.",
    credentialHintPlaintext:
      "Using the legacy plaintext fallback. Attach a vault_item_id to migrate to the live source.",
    credentialHintEmpty:
      "No secrets configured. Attach a vault_item_id or fill in the plaintext columns.",
    bridgeIssue: "Vaultwarden bridge reported an error:",
    actionsTitle: "Quick actions",
    metadataTitle: "Metadata",
    notesTitle: "Notes",
    editNotesTitle: "Edit notes",
    instructionsTitle: "Instruction (roadmap)",
    editInstructionsTitle: "Edit instruction",
    archiveTitle: "Archive",
    archiveDescription:
      "Archived records stop showing in lists, but the row stays in the database.",
    archiveButton: "Archive",
    archiveConfirm: "Archive this linked service?",
    tagsLabel: "Tags",
    sourceVault: "Vaultwarden item",
    sourcePlaintext: "Plaintext fallback",
    sourceEmpty: "No secrets",
    username: "Login / email",
    password: "Password",
    totp: "Current TOTP",
    loginUrl: "Login URL",
    createdAt: "Created",
    updatedAt: "Updated",
    source: "Source",
    vaultItemId: "Vault item",
    copy: "Copy",
    copied: "Copied",
    copyAll: "Copy all",
    openService: "Open service",
    backCta: "Back to root",
    fixtureTag: "Fixture",
    emptyValue: "No value stored",
    notesBlockLabel: "Notes",
    notesPlaceholder:
      "Operator notes: what to know about this credential, OTP quirks, constraints, etc.",
    notesSubmit: "Save notes",
    instructionsTitleField: "Title",
    instructionsSummaryField: "Summary",
    instructionsContentField: "Content (content_json)",
    instructionsContentHint:
      "Format: { version: 1, blocks: [...] }. Supported block types: overview, steps, tips, warnings, links.",
    instructionsSubmit: "Save instruction",
    instructionsValidationError:
      "Invalid JSON. Expected { version: 1, blocks: [...] }.",
  },
} as const;

export default async function LinkedServiceDetailPage({
  params,
}: {
  params: Promise<{ family: string; rootAccountId: string; linkedServiceId: string }>;
}) {
  const { family, rootAccountId, linkedServiceId } = await params;
  if (!isFamilySlug(family)) notFound();

  if (rootAccountId === SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID) {
    return (
      <BridgeLinkedView
        family={family}
        rootAccountId={rootAccountId}
        linkedServiceId={linkedServiceId}
      />
    );
  }

  if (!isUuid(rootAccountId) || !isUuid(linkedServiceId)) notFound();

  return (
    <DbLinkedView
      family={family}
      rootAccountId={rootAccountId}
      linkedServiceId={linkedServiceId}
    />
  );
}

async function DbLinkedView({
  family,
  rootAccountId,
  linkedServiceId,
}: {
  family: FamilySlug;
  rootAccountId: string;
  linkedServiceId: string;
}) {
  const locale = await readLocaleFromCookies();
  const shell = getShellDictionary(locale);
  const copy = COPY[locale];
  const familyName = shell.family[family];

  const detail = await getLinkedServiceDetailById(linkedServiceId);
  if (!detail || detail.rootAccount.id !== rootAccountId || detail.family.slug !== family) {
    notFound();
  }

  const credentialHint =
    detail.resolved.source === "vaultwarden"
      ? copy.credentialHintVault
      : detail.resolved.source === "plaintext"
        ? copy.credentialHintPlaintext
        : copy.credentialHintEmpty;

  const sourceLabel =
    detail.resolved.source === "vaultwarden"
      ? copy.sourceVault
      : detail.resolved.source === "plaintext"
        ? copy.sourcePlaintext
        : copy.sourceEmpty;

  const copyAllValue = [
    detail.resolved.loginOrEmail ? `${copy.username}: ${detail.resolved.loginOrEmail}` : null,
    detail.resolved.password ? `${copy.password}: ${detail.resolved.password}` : null,
    detail.resolved.currentTotp ? `${copy.totp}: ${detail.resolved.currentTotp}` : null,
    detail.resolved.loginUrl ? `${copy.loginUrl}: ${detail.resolved.loginUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const instructionTitle = detail.instructionDocument?.title ?? detail.catalogDefault.title;
  const instructionSummary =
    detail.instructionDocument?.summary ?? detail.catalogDefault.summary;
  const instructionContent = (detail.instructionDocument?.contentJson ??
    detail.catalogDefault.content) as LinkedServiceDetail["catalogDefault"]["content"];

  return (
    <div className="flex flex-col gap-5">
      <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
        <SectionHeader
          eyebrow={`${familyName} · ${detail.rootAccount.displayName}`}
          title={detail.serviceName}
          description={detail.serviceSlug}
          actions={
            <>
              <Badge variant="violet">{detail.serviceName}</Badge>
              {detail.vaultItemId ? <Badge variant="sky">{copy.sourceVault}</Badge> : null}
              {detail.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.label}
                </Badge>
              ))}
              <Button asChild variant="outline">
                <Link href={`/account-manager/${family}/${rootAccountId}` as Route}>
                  {copy.backCta}
                </Link>
              </Button>
            </>
          }
        />
      </GlassPanel>

      <TwoColumnDetail
        left={
          <>
            <GlassPanel className="flex flex-col gap-5 p-6 sm:p-7">
              <SectionHeader title={copy.credentialTitle} description={credentialHint} />

              {detail.resolved.bridgeIssue ? (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {copy.bridgeIssue} {detail.resolved.bridgeIssue}
                </div>
              ) : null}

              <CredentialRow
                icon={<KeyRound className="h-4 w-4" />}
                label={copy.username}
                value={detail.resolved.loginOrEmail}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
              />
              <CredentialRow
                icon={<LockKeyhole className="h-4 w-4" />}
                label={copy.password}
                value={detail.resolved.password}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
              />
              <CredentialRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label={copy.totp}
                value={detail.resolved.currentTotp}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
                emphasize
              />
              <CredentialRow
                icon={<ExternalLink className="h-4 w-4" />}
                label={copy.loginUrl}
                value={detail.resolved.loginUrl}
                copyLabel={copy.copy}
                copiedLabel={copy.copied}
                emptyValue={copy.emptyValue}
                linkValue={detail.resolved.loginUrl}
                linkLabel={copy.openService}
              />
            </GlassPanel>

            <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
              <SectionHeader title={copy.actionsTitle} />
              <div className="flex flex-wrap gap-2">
                <CopyButton
                  value={copyAllValue || null}
                  label={copy.copyAll}
                  copiedLabel={copy.copied}
                />
                {detail.resolved.loginUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={detail.resolved.loginUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      {copy.openService}
                    </a>
                  </Button>
                ) : null}
              </div>
            </GlassPanel>

            <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
              <SectionHeader title={copy.metadataTitle} />
              <MetadataRow label={copy.source} value={sourceLabel} />
              {detail.vaultItemId ? (
                <MetadataRow label={copy.vaultItemId} value={detail.vaultItemId} />
              ) : null}
              <MetadataRow
                label={copy.createdAt}
                value={detail.createdAt.toISOString()}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <MetadataRow
                label={copy.updatedAt}
                value={detail.updatedAt.toISOString()}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              {detail.tags.length ? (
                <div className="rounded-lg border border-border/60 bg-background/35 px-3 py-2">
                  <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <TagIcon className="h-3 w-3" />
                    {copy.tagsLabel}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.tags.map((tag) => (
                      <Badge key={tag.id} variant="sky">
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </GlassPanel>

            <GlassPanel className="flex flex-col gap-4 p-6 sm:p-7">
              <SectionHeader title={copy.editNotesTitle} />
              <EditNotesForm
                familySlug={family}
                rootAccountId={rootAccountId}
                linkedServiceId={detail.id}
                initialNotes={detail.notes}
                copy={{
                  label: copy.notesBlockLabel,
                  placeholder: copy.notesPlaceholder,
                  submit: copy.notesSubmit,
                }}
              />
            </GlassPanel>

            <GlassPanel className="flex flex-col gap-3 p-6 sm:p-7">
              <SectionHeader title={copy.archiveTitle} description={copy.archiveDescription} />
              <ArchiveLinkedServiceButton
                familySlug={family}
                rootAccountId={rootAccountId}
                linkedServiceId={detail.id}
                label={copy.archiveButton}
                confirmText={copy.archiveConfirm}
              />
            </GlassPanel>
          </>
        }
        right={
          <>
            <RoadmapRenderer
              title={instructionTitle}
              summary={instructionSummary}
              content={instructionContent}
            />
            <GlassPanel className="mt-5 flex flex-col gap-3 p-6 sm:p-7">
              <SectionHeader title={copy.editInstructionsTitle} />
              <EditInstructionsForm
                familySlug={family}
                rootAccountId={rootAccountId}
                linkedServiceId={detail.id}
                initialTitle={instructionTitle}
                initialSummary={instructionSummary ?? null}
                initialContent={instructionContent}
                copy={{
                  label: copy.instructionsTitle,
                  title: copy.instructionsTitleField,
                  summary: copy.instructionsSummaryField,
                  contentJson: copy.instructionsContentField,
                  contentJsonHint: copy.instructionsContentHint,
                  submit: copy.instructionsSubmit,
                  validationError: copy.instructionsValidationError,
                }}
              />
            </GlassPanel>
          </>
        }
      />
    </div>
  );
}

async function BridgeLinkedView({
  family,
  rootAccountId,
  linkedServiceId,
}: {
  family: FamilySlug;
  rootAccountId: string;
  linkedServiceId: string;
}) {
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
    <BridgeRendering
      family={family}
      rootAccountId={rootAccountId}
      familyName={familyName}
      detail={detail}
      copy={copy}
      copyAllValue={copyAllValue}
    />
  );
}

type LocalizedCopy = (typeof COPY)["ru"] | (typeof COPY)["en"];

function BridgeRendering({
  family,
  rootAccountId,
  familyName,
  detail,
  copy,
  copyAllValue,
}: {
  family: FamilySlug;
  rootAccountId: string;
  familyName: string;
  detail: VaultwardenLinkedServiceDetail;
  copy: LocalizedCopy;
  copyAllValue: string;
}) {
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
                <Link href={`/account-manager/${family}/${rootAccountId}` as Route}>
                  {copy.backCta}
                </Link>
              </Button>
            </>
          }
        />
      </GlassPanel>

      <TwoColumnDetail
        left={
          <>
            <GlassPanel className="flex flex-col gap-5 p-6 sm:p-7">
              <SectionHeader title={copy.credentialTitle} description={copy.credentialHintVault} />

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
                <CopyButton
                  value={copyAllValue || null}
                  label={copy.copyAll}
                  copiedLabel={copy.copied}
                />
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
              <MetadataRow
                label={copy.createdAt}
                value={detail.createdAt ?? copy.emptyValue}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
              <MetadataRow
                label={copy.updatedAt}
                value={detail.updatedAt ?? copy.emptyValue}
                icon={<Calendar className="h-3.5 w-3.5" />}
              />
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
        right={
          <RoadmapRenderer
            title={detail.instructionTitle}
            summary={detail.instructionSummary}
            content={detail.instructionContent}
          />
        }
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

function MetadataRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
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

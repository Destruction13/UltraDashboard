import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { LINKED_SERVICE_CATALOG, type InstructionDocumentContent } from "@/lib/db/catalog";
import { type FamilySlug, isFamilySlug } from "@/lib/account-manager/families";
import {
  type VaultwardenField,
  type VaultwardenFolder,
  type VaultwardenItem,
  createVaultwardenFolder,
  createVaultwardenItem,
  deleteVaultwardenFolder,
  deleteVaultwardenItem,
  getVaultwardenBridgeStatus,
  getVaultwardenItemTemplate,
  getVaultwardenLoginTemplate,
  getVaultwardenTotp,
  listVaultwardenFolders,
  listVaultwardenItems,
  syncVaultwarden,
  updateVaultwardenItem,
} from "@/lib/vaultwarden/client";
import { getVaultwardenConfig } from "@/lib/vaultwarden/config";

const ULTRADASH_FOLDER_PREFIX = "UltraDashboard";
const META_VERSION = "ultradash.version";
const META_FAMILY = "ultradash.family";
const META_ROOT_KEY = "ultradash.rootKey";
const META_ROOT_DISPLAY_NAME = "ultradash.rootDisplayName";
const META_ROOT_PRIMARY_EMAIL = "ultradash.rootPrimaryEmail";
const META_ROOT_USERNAME = "ultradash.rootUsername";
const META_SERVICE_SLUG = "ultradash.serviceSlug";
const META_SERVICE_NAME = "ultradash.serviceName";

const ROOT_DETAIL_FALLBACK_ID = "vaultwarden-bridge";

export type VaultwardenRootAccountSummary = {
  id: string;
  displayName: string;
  description: string;
  status: "online" | "offline" | "unconfigured";
  itemCount: number;
  hasFixture: boolean;
  primaryEmail: string | null;
  username: string | null;
};

export type VaultwardenLinkedServiceSummary = {
  id: string;
  title: string;
  serviceName: string;
  serviceSlug: string;
  username: string | null;
  loginUrl: string | null;
  updatedAt: string | null;
  hasPassword: boolean;
  hasTotp: boolean;
  isFixture: boolean;
};

export type VaultwardenRootAccountDetail = VaultwardenRootAccountSummary & {
  family: FamilySlug;
  bridgeMode: string;
  baseUrl: string | null;
  services: VaultwardenLinkedServiceSummary[];
  issue: string | null;
  folderId: string | null;
  folderName: string | null;
  rootKey: string;
};

export type VaultwardenLinkedServiceDetail = VaultwardenLinkedServiceSummary & {
  rootAccountId: string;
  rootAccountName: string;
  notes: string | null;
  password: string | null;
  currentTotp: string | null;
  createdAt: string | null;
  instructionTitle: string;
  instructionSummary: string;
  instructionContent: InstructionDocumentContent;
};

export type VaultwardenRootAccountDraft = {
  family: FamilySlug;
  displayName: string;
  primaryEmail: string | null;
  username: string | null;
};

export type VaultwardenLinkedServiceDraft = {
  title: string | null;
  serviceSlug: string;
  serviceName: string | null;
  loginOrEmail: string | null;
  password: string | null;
  totpSecret: string | null;
  loginUrl: string | null;
  notes: string | null;
};

export type VaultwardenLinkedServicePatch = Partial<VaultwardenLinkedServiceDraft>;

type ParsedVaultwardenService = VaultwardenLinkedServiceSummary & {
  item: VaultwardenItem;
  family: FamilySlug;
  rootId: string;
  rootKey: string;
  rootDisplayName: string;
  rootPrimaryEmail: string | null;
  rootUsername: string | null;
  folderId: string | null;
  folderName: string | null;
};

type GroupedRootAccount = {
  id: string;
  family: FamilySlug;
  rootKey: string;
  displayName: string;
  primaryEmail: string | null;
  username: string | null;
  folderId: string | null;
  folderName: string | null;
  services: ParsedVaultwardenService[];
};

type VaultProjection = {
  status: Awaited<ReturnType<typeof getVaultwardenBridgeStatus>>;
  config: ReturnType<typeof getVaultwardenConfig>;
  rootsByFamily: Record<FamilySlug, GroupedRootAccount[]>;
  rootsById: Map<string, GroupedRootAccount>;
  servicesById: Map<string, ParsedVaultwardenService>;
};

function normalizeText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "custom";
}

function hashId(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 24);
}

function getItemLoginUrl(item: VaultwardenItem): string | null {
  return normalizeText(item.login?.uris?.find((uri) => normalizeText(uri.uri))?.uri);
}

function inferServiceSlug(item: VaultwardenItem): string {
  const loginUrl = getItemLoginUrl(item);
  const name = item.name.toLowerCase();

  if (loginUrl) {
    try {
      const url = new URL(loginUrl);
      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();

      if (host.includes("chatgpt.com") && path.includes("/codex")) {
        return "codex";
      }
      if (host.includes("chatgpt.com")) {
        return "chatgpt";
      }
      if (host.includes("github.com")) {
        return "github";
      }
      if (host.includes("devin.ai")) {
        return "devin";
      }
      if (host.includes("zoho.")) {
        return "zoho";
      }
    } catch {
      // Ignore malformed URLs and continue with name heuristics.
    }
  }

  if (name.includes("codex")) return "codex";
  if (name.includes("chatgpt")) return "chatgpt";
  if (name.includes("github")) return "github";
  if (name.includes("devin")) return "devin";
  if (name.includes("zoho")) return "zoho";
  return slugify(item.name);
}

function inferServiceName(item: VaultwardenItem, serviceSlug: string): string {
  const known = LINKED_SERVICE_CATALOG.find((entry) => entry.slug === serviceSlug);
  return known?.serviceName ?? item.name;
}

function inferFamilyFromServiceSlug(serviceSlug: string): FamilySlug {
  if (serviceSlug === "github") return "github";
  if (serviceSlug === "zoho") return "zoho";
  return "google";
}

function getFieldValue(item: VaultwardenItem, name: string): string | null {
  const matched = item.fields?.find(
    (field) => normalizeText(field.name)?.toLowerCase() === name.toLowerCase(),
  );
  return normalizeText(matched?.value);
}

function upsertField(fields: VaultwardenField[], name: string, value: string | null): VaultwardenField[] {
  const trimmedValue = normalizeText(value);
  const nextFields = fields.filter(
    (field) => normalizeText(field.name)?.toLowerCase() !== name.toLowerCase(),
  );

  if (!trimmedValue) {
    return nextFields;
  }

  nextFields.push({ name, value: trimmedValue, type: 0 });
  return nextFields;
}

function getFolderName(folderId: string | null | undefined, foldersById: Map<string, VaultwardenFolder>): string | null {
  if (!folderId) {
    return null;
  }
  return normalizeText(foldersById.get(folderId)?.name);
}

function parseFolderMetadata(folderName: string | null): {
  family: FamilySlug | null;
  displayName: string | null;
} {
  if (!folderName) {
    return { family: null, displayName: null };
  }

  const parts = folderName.split("/").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 3) {
    return { family: null, displayName: null };
  }

  if (parts[0]?.toLowerCase() !== ULTRADASH_FOLDER_PREFIX.toLowerCase()) {
    return { family: null, displayName: null };
  }

  const family = parts[1]?.toLowerCase() ?? "";
  const displayName = normalizeText(parts.slice(2).join(" / "));
  return {
    family: isFamilySlug(family) ? family : null,
    displayName,
  };
}

function buildRootId(rootKey: string): string {
  return /^[a-z0-9-]{8,}$/i.test(rootKey) ? rootKey : `vw-root-${hashId(rootKey)}`;
}

function buildRootFolderName(family: FamilySlug, displayName: string): string {
  return `${ULTRADASH_FOLDER_PREFIX}/${family}/${displayName}`;
}

function inferRootDisplayName(item: VaultwardenItem, folderDisplayName: string | null): string {
  const loginUsername = normalizeText(item.login?.username);
  return (
    normalizeText(getFieldValue(item, META_ROOT_DISPLAY_NAME)) ??
    folderDisplayName ??
    loginUsername ??
    item.name
  );
}

function inferRootPrimaryEmail(item: VaultwardenItem): string | null {
  const explicit = normalizeText(getFieldValue(item, META_ROOT_PRIMARY_EMAIL));
  if (explicit) {
    return explicit;
  }

  const loginUsername = normalizeText(item.login?.username);
  if (loginUsername?.includes("@")) {
    return loginUsername;
  }

  return null;
}

function inferRootUsername(item: VaultwardenItem): string | null {
  const explicit = normalizeText(getFieldValue(item, META_ROOT_USERNAME));
  if (explicit) {
    return explicit;
  }

  const loginUsername = normalizeText(item.login?.username);
  if (loginUsername && !loginUsername.includes("@")) {
    return loginUsername;
  }

  return null;
}

function parseVaultwardenService(
  item: VaultwardenItem,
  foldersById: Map<string, VaultwardenFolder>,
  fixtureItemId: string | null,
): ParsedVaultwardenService {
  const folderId = normalizeText(item.folderId);
  const folderName = getFolderName(folderId, foldersById);
  const folderMetadata = parseFolderMetadata(folderName);

  const rawServiceSlug = normalizeText(getFieldValue(item, META_SERVICE_SLUG));
  const serviceSlug = rawServiceSlug ? slugify(rawServiceSlug) : inferServiceSlug(item);
  const serviceName =
    normalizeText(getFieldValue(item, META_SERVICE_NAME)) ?? inferServiceName(item, serviceSlug);

  const rawFamily = normalizeText(getFieldValue(item, META_FAMILY))?.toLowerCase() ?? null;
  const family =
    (rawFamily && isFamilySlug(rawFamily) ? rawFamily : null) ??
    folderMetadata.family ??
    inferFamilyFromServiceSlug(serviceSlug);

  const rootDisplayName = inferRootDisplayName(item, folderMetadata.displayName);
  const rootPrimaryEmail = inferRootPrimaryEmail(item);
  const rootUsername = inferRootUsername(item);
  const derivedRootKey = [
    family,
    folderName,
    rootPrimaryEmail,
    rootUsername,
    rootDisplayName,
  ]
    .filter(Boolean)
    .join("|");
  const rootKey =
    normalizeText(getFieldValue(item, META_ROOT_KEY)) ??
    (derivedRootKey.length > 0 ? derivedRootKey : `${family}|${item.id}`);
  const rootId = buildRootId(rootKey);

  return {
    id: item.id,
    title: item.name,
    serviceName,
    serviceSlug,
    username: normalizeText(item.login?.username),
    loginUrl: getItemLoginUrl(item),
    updatedAt: item.revisionDate ?? null,
    hasPassword: Boolean(normalizeText(item.login?.password)),
    hasTotp: Boolean(normalizeText(item.login?.totp)),
    isFixture: fixtureItemId === item.id,
    item,
    family,
    rootId,
    rootKey,
    rootDisplayName,
    rootPrimaryEmail,
    rootUsername,
    folderId,
    folderName,
  };
}

function buildInstructionContent(item: VaultwardenItem, serviceSlug: string): {
  title: string;
  summary: string;
  content: InstructionDocumentContent;
} {
  const known = LINKED_SERVICE_CATALOG.find((entry) => entry.slug === serviceSlug);
  if (known) {
    return {
      title: known.defaultInstructionTitle,
      summary: known.defaultInstructionSummary,
      content: known.defaultContent,
    };
  }

  const loginUrl = getItemLoginUrl(item);
  return {
    title: `Use this ${item.name}`,
    summary: "Quick operator checklist for the linked Vaultwarden item.",
    content: {
      version: 1,
      blocks: [
        {
          type: "overview",
          text: "Open the login page, copy the credentials from the left panel, and use the live TOTP when prompted.",
        },
        {
          type: "steps",
          items: [
            {
              title: "Open the service",
              body: loginUrl ?? "Use the item metadata or notes to find the correct login entrypoint.",
            },
            {
              title: "Copy the credentials",
              body: "Use the one-click copy actions for login, password, and the current TOTP code.",
            },
          ],
        },
      ],
    },
  };
}

function toRootSummary(
  root: GroupedRootAccount,
  fixtureItemId: string | null,
  status: Awaited<ReturnType<typeof getVaultwardenBridgeStatus>>,
): VaultwardenRootAccountSummary {
  const description = root.primaryEmail ?? root.username ?? root.folderName ?? "Vaultwarden root account";
  return {
    id: root.id,
    displayName: root.displayName,
    description,
    status: status.available ? "online" : status.configured ? "offline" : "unconfigured",
    itemCount: root.services.length,
    hasFixture: root.services.some((service) => service.id === fixtureItemId),
    primaryEmail: root.primaryEmail,
    username: root.username,
  };
}

async function loadVaultProjection(): Promise<VaultProjection> {
  const [status, config] = await Promise.all([
    getVaultwardenBridgeStatus(),
    Promise.resolve(getVaultwardenConfig()),
  ]);

  const rootsByFamily: Record<FamilySlug, GroupedRootAccount[]> = {
    github: [],
    google: [],
    zoho: [],
  };
  const rootsById = new Map<string, GroupedRootAccount>();
  const servicesById = new Map<string, ParsedVaultwardenService>();

  if (!status.available) {
    return { status, config, rootsByFamily, rootsById, servicesById };
  }

  try {
    await syncVaultwarden();
  } catch {
    // If sync fails, keep serving the last local vault snapshot instead of hard failing the UI.
  }

  const [items, folders] = await Promise.all([
    listVaultwardenItems(),
    listVaultwardenFolders(),
  ]);
  const foldersById = new Map(folders.filter((folder) => folder.id).map((folder) => [folder.id, folder]));
  const groupedRoots = new Map<string, GroupedRootAccount>();

  for (const item of items) {
    const parsed = parseVaultwardenService(item, foldersById, config.testItemId);
    servicesById.set(parsed.id, parsed);

    const existing = groupedRoots.get(parsed.rootId);
    if (existing) {
      existing.services.push(parsed);
      if (!existing.primaryEmail && parsed.rootPrimaryEmail) {
        existing.primaryEmail = parsed.rootPrimaryEmail;
      }
      if (!existing.username && parsed.rootUsername) {
        existing.username = parsed.rootUsername;
      }
      if (!existing.folderId && parsed.folderId) {
        existing.folderId = parsed.folderId;
      }
      if (!existing.folderName && parsed.folderName) {
        existing.folderName = parsed.folderName;
      }
      continue;
    }

    groupedRoots.set(parsed.rootId, {
      id: parsed.rootId,
      family: parsed.family,
      rootKey: parsed.rootKey,
      displayName: parsed.rootDisplayName,
      primaryEmail: parsed.rootPrimaryEmail,
      username: parsed.rootUsername,
      folderId: parsed.folderId,
      folderName: parsed.folderName,
      services: [parsed],
    });
  }

  for (const root of groupedRoots.values()) {
    root.services.sort((left, right) => left.title.localeCompare(right.title));
    rootsByFamily[root.family].push(root);
    rootsById.set(root.id, root);
  }

  for (const family of Object.keys(rootsByFamily) as FamilySlug[]) {
    rootsByFamily[family].sort((left, right) => left.displayName.localeCompare(right.displayName));
  }

  return { status, config, rootsByFamily, rootsById, servicesById };
}

async function resolveRootAccount(
  family: FamilySlug,
  rootAccountId: string,
): Promise<{ projection: VaultProjection; root: GroupedRootAccount | null }> {
  const projection = await loadVaultProjection();

  if (rootAccountId === ROOT_DETAIL_FALLBACK_ID) {
    const [firstRoot] = projection.rootsByFamily[family];
    return { projection, root: firstRoot ?? null };
  }

  const root = projection.rootsById.get(rootAccountId) ?? null;
  if (!root || root.family !== family) {
    return { projection, root: null };
  }

  return { projection, root };
}

function normalizeDraft(draft: VaultwardenLinkedServiceDraft): VaultwardenLinkedServiceDraft {
  const serviceSlug = slugify(draft.serviceSlug);
  const knownService = LINKED_SERVICE_CATALOG.find((entry) => entry.slug === serviceSlug);
  const serviceName = normalizeText(draft.serviceName) ?? knownService?.serviceName ?? null;
  const loginUrl = normalizeText(draft.loginUrl) ?? knownService?.defaultLoginUrl ?? null;
  const title = normalizeText(draft.title) ?? serviceName ?? "Untitled item";

  return {
    title,
    serviceSlug,
    serviceName,
    loginOrEmail: normalizeText(draft.loginOrEmail),
    password: normalizeText(draft.password),
    totpSecret: normalizeText(draft.totpSecret),
    loginUrl,
    notes: normalizeText(draft.notes),
  };
}

async function ensureRootFolder(root: VaultwardenRootAccountDraft): Promise<VaultwardenFolder> {
  const folderName = buildRootFolderName(root.family, root.displayName);
  const existingFolders = await listVaultwardenFolders();
  const existing = existingFolders.find((folder) => folder.name === folderName);
  if (existing) {
    return existing;
  }

  return createVaultwardenFolder({ name: folderName });
}

function applyMetadataFields(
  item: Record<string, unknown>,
  root: VaultwardenRootAccountDraft & { rootKey: string; folderId: string | null },
  service: VaultwardenLinkedServiceDraft,
  existingFields?: VaultwardenField[] | null,
): VaultwardenField[] {
  let nextFields = [...(existingFields ?? [])];
  nextFields = upsertField(nextFields, META_VERSION, "1");
  nextFields = upsertField(nextFields, META_FAMILY, root.family);
  nextFields = upsertField(nextFields, META_ROOT_KEY, root.rootKey);
  nextFields = upsertField(nextFields, META_ROOT_DISPLAY_NAME, root.displayName);
  nextFields = upsertField(nextFields, META_ROOT_PRIMARY_EMAIL, root.primaryEmail);
  nextFields = upsertField(nextFields, META_ROOT_USERNAME, root.username);
  nextFields = upsertField(nextFields, META_SERVICE_SLUG, service.serviceSlug);
  nextFields = upsertField(nextFields, META_SERVICE_NAME, service.serviceName);

  item.fields = nextFields;
  item.folderId = root.folderId;
  return nextFields;
}

async function buildVaultwardenItemPayload(
  root: VaultwardenRootAccountDraft & { rootKey: string; folderId: string | null },
  draft: VaultwardenLinkedServiceDraft,
): Promise<Record<string, unknown>> {
  const [itemTemplate, loginTemplate] = await Promise.all([
    getVaultwardenItemTemplate(),
    getVaultwardenLoginTemplate(),
  ]);

  const normalized = normalizeDraft(draft);
  const login = {
    ...loginTemplate,
    username: normalized.loginOrEmail,
    password: normalized.password,
    totp: normalized.totpSecret,
    uris: normalized.loginUrl ? [{ uri: normalized.loginUrl }] : [],
  };

  const item: Record<string, unknown> = {
    ...itemTemplate,
    name: normalized.title,
    notes: normalized.notes,
    folderId: root.folderId,
    login,
    fields: [],
  };

  applyMetadataFields(item, root, normalized);
  return item;
}

export async function listVaultwardenRootAccounts(
  family: FamilySlug,
): Promise<VaultwardenRootAccountSummary[]> {
  const projection = await loadVaultProjection();
  return projection.rootsByFamily[family].map((root) =>
    toRootSummary(root, projection.config.testItemId, projection.status),
  );
}

export async function getVaultwardenRootAccountDetail(
  family: FamilySlug,
  rootAccountId: string,
): Promise<VaultwardenRootAccountDetail | null> {
  const { projection, root } = await resolveRootAccount(family, rootAccountId);
  if (!root) {
    return null;
  }

  return {
    ...toRootSummary(root, projection.config.testItemId, projection.status),
    family,
    bridgeMode: projection.config.accessMode ?? "disabled",
    baseUrl: projection.config.baseUrl,
    services: root.services.map(({ item: _item, family: _family, rootId: _rootId, rootKey: _rootKey, rootDisplayName: _rootDisplayName, rootPrimaryEmail: _rootPrimaryEmail, rootUsername: _rootUsername, folderId: _folderId, folderName: _folderName, ...summary }) => summary),
    issue: projection.status.issue,
    folderId: root.folderId,
    folderName: root.folderName,
    rootKey: root.rootKey,
  };
}

export async function getVaultwardenLinkedServiceDetail(
  _rootAccountId: string,
  linkedServiceId: string,
): Promise<VaultwardenLinkedServiceDetail | null> {
  const projection = await loadVaultProjection();
  const summary = projection.servicesById.get(linkedServiceId);
  if (!summary) {
    return null;
  }

  const instruction = buildInstructionContent(summary.item, summary.serviceSlug);

  let currentTotp: string | null = null;
  try {
    currentTotp = await getVaultwardenTotp(linkedServiceId);
  } catch {
    currentTotp = null;
  }

  return {
    id: summary.id,
    title: summary.title,
    serviceName: summary.serviceName,
    serviceSlug: summary.serviceSlug,
    username: summary.username,
    loginUrl: summary.loginUrl,
    updatedAt: summary.updatedAt,
    hasPassword: summary.hasPassword,
    hasTotp: summary.hasTotp,
    isFixture: summary.isFixture,
    rootAccountId: summary.rootId,
    rootAccountName: summary.rootDisplayName,
    notes: normalizeText(summary.item.notes),
    password: normalizeText(summary.item.login?.password),
    currentTotp,
    createdAt: summary.item.creationDate ?? null,
    instructionTitle: instruction.title,
    instructionSummary: instruction.summary,
    instructionContent: instruction.content,
  };
}

export async function createVaultwardenRootAccountWithService(
  rootDraft: VaultwardenRootAccountDraft,
  linkedDraft: VaultwardenLinkedServiceDraft,
): Promise<{ rootAccountId: string; linkedServiceId: string }> {
  const normalizedRoot: VaultwardenRootAccountDraft = {
    family: rootDraft.family,
    displayName: normalizeText(rootDraft.displayName) ?? "Untitled root account",
    primaryEmail: normalizeText(rootDraft.primaryEmail),
    username: normalizeText(rootDraft.username),
  };

  const folder = await ensureRootFolder(normalizedRoot);
  const rootKey = randomUUID();
  const payload = await buildVaultwardenItemPayload(
    { ...normalizedRoot, rootKey, folderId: normalizeText(folder.id) },
    linkedDraft,
  );
  const created = await createVaultwardenItem(payload);
  await syncVaultwarden(true);

  return {
    rootAccountId: buildRootId(rootKey),
    linkedServiceId: created.id,
  };
}

export async function createVaultwardenLinkedService(
  family: FamilySlug,
  rootAccountId: string,
  linkedDraft: VaultwardenLinkedServiceDraft,
): Promise<{ rootAccountId: string; linkedServiceId: string }> {
  const { root } = await resolveRootAccount(family, rootAccountId);
  if (!root) {
    throw new Error("Root account not found.");
  }

  const folder = root.folderName
    ? (await ensureRootFolder({
        family,
        displayName: root.displayName,
        primaryEmail: root.primaryEmail,
        username: root.username,
      }))
    : null;

  const payload = await buildVaultwardenItemPayload(
    {
      family,
      displayName: root.displayName,
      primaryEmail: root.primaryEmail,
      username: root.username,
      rootKey: root.rootKey,
      folderId: normalizeText(folder?.id) ?? root.folderId,
    },
    linkedDraft,
  );
  const created = await createVaultwardenItem(payload);
  await syncVaultwarden(true);

  return {
    rootAccountId: root.id,
    linkedServiceId: created.id,
  };
}

export async function updateVaultwardenLinkedService(
  linkedServiceId: string,
  patch: VaultwardenLinkedServicePatch,
): Promise<{ rootAccountId: string; linkedServiceId: string } | null> {
  const projection = await loadVaultProjection();
  const summary = projection.servicesById.get(linkedServiceId);
  if (!summary) {
    return null;
  }

  const currentDraft = normalizeDraft({
    title: summary.item.name,
    serviceSlug: summary.serviceSlug,
    serviceName: summary.serviceName,
    loginOrEmail: summary.item.login?.username ?? null,
    password: summary.item.login?.password ?? null,
    totpSecret: summary.item.login?.totp ?? null,
    loginUrl: getItemLoginUrl(summary.item),
    notes: summary.item.notes ?? null,
  });

  const nextDraft = normalizeDraft({
    title: patch.title ?? currentDraft.title,
    serviceSlug: patch.serviceSlug ?? currentDraft.serviceSlug,
    serviceName: patch.serviceName ?? currentDraft.serviceName,
    loginOrEmail:
      patch.loginOrEmail !== undefined ? patch.loginOrEmail : currentDraft.loginOrEmail,
    password: patch.password !== undefined ? patch.password : currentDraft.password,
    totpSecret: patch.totpSecret !== undefined ? patch.totpSecret : currentDraft.totpSecret,
    loginUrl: patch.loginUrl !== undefined ? patch.loginUrl : currentDraft.loginUrl,
    notes: patch.notes !== undefined ? patch.notes : currentDraft.notes,
  });

  const nextItem: Record<string, unknown> = {
    ...summary.item,
    name: nextDraft.title,
    notes: nextDraft.notes,
    login: {
      ...(summary.item.login ?? {}),
      username: nextDraft.loginOrEmail,
      password: nextDraft.password,
      totp: nextDraft.totpSecret,
      uris: nextDraft.loginUrl ? [{ uri: nextDraft.loginUrl }] : [],
    },
  };

  applyMetadataFields(
    nextItem,
    {
      family: summary.family,
      displayName: summary.rootDisplayName,
      primaryEmail: summary.rootPrimaryEmail,
      username: summary.rootUsername,
      rootKey: summary.rootKey,
      folderId: summary.folderId,
    },
    nextDraft,
    summary.item.fields ?? [],
  );

  await updateVaultwardenItem(linkedServiceId, nextItem);
  await syncVaultwarden(true);

  return {
    rootAccountId: summary.rootId,
    linkedServiceId,
  };
}

export async function deleteVaultwardenLinkedService(linkedServiceId: string): Promise<boolean> {
  const projection = await loadVaultProjection();
  const summary = projection.servicesById.get(linkedServiceId);
  if (!summary) {
    return false;
  }

  await deleteVaultwardenItem(linkedServiceId);
  await syncVaultwarden(true);

  if (summary.folderId) {
    const remainingItems = await listVaultwardenItems();
    const hasItemsInFolder = remainingItems.some(
      (item) => normalizeText(item.folderId) === summary.folderId,
    );

    if (!hasItemsInFolder) {
      try {
        await deleteVaultwardenFolder(summary.folderId);
        await syncVaultwarden(true);
      } catch {
        // Folder cleanup is best-effort. The item is already gone from the server.
      }
    }
  }

  return true;
}

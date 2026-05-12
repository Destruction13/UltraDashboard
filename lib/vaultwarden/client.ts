import "server-only";

import { z } from "zod";

import { getVaultwardenConfig } from "@/lib/vaultwarden/config";

const fieldSchema = z
  .object({
    name: z.string().nullable().optional(),
    value: z.string().nullable().optional(),
    type: z.number().nullable().optional(),
    linkedId: z.number().nullable().optional(),
  })
  .passthrough();

const loginSchema = z
  .object({
    username: z.string().nullable().optional(),
    password: z.string().nullable().optional(),
    totp: z.string().nullable().optional(),
    uris: z
      .array(
        z.object({
          uri: z.string().nullable().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

const itemSchema = z
  .object({
    id: z.string(),
    name: z.string().default("Untitled item"),
    notes: z.string().nullable().optional(),
    login: loginSchema.optional(),
    fields: z.array(fieldSchema).optional(),
    folderId: z.string().nullable().optional(),
    collectionIds: z.array(z.string()).nullable().optional(),
    creationDate: z.string().optional(),
    revisionDate: z.string().optional(),
    archivedDate: z.string().nullable().optional(),
    deletedDate: z.string().nullable().optional(),
  })
  .passthrough();

const folderSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    object: z.string().optional(),
  })
  .passthrough();

const itemTemplateSchema = z
  .object({
    passwordHistory: z.array(z.unknown()).optional(),
    revisionDate: z.string().nullable().optional(),
    creationDate: z.string().nullable().optional(),
    deletedDate: z.string().nullable().optional(),
    archivedDate: z.string().nullable().optional(),
    organizationId: z.string().nullable().optional(),
    collectionIds: z.array(z.string()).nullable().optional(),
    folderId: z.string().nullable().optional(),
    type: z.number().optional(),
    name: z.string().optional(),
    notes: z.string().nullable().optional(),
    favorite: z.boolean().optional(),
    fields: z.array(fieldSchema).optional(),
    login: loginSchema.nullable().optional(),
    secureNote: z.unknown().nullable().optional(),
    card: z.unknown().nullable().optional(),
    identity: z.unknown().nullable().optional(),
    sshKey: z.unknown().nullable().optional(),
    reprompt: z.number().optional(),
  })
  .passthrough();

const loginTemplateSchema = z
  .object({
    uris: z.array(z.object({ uri: z.string().nullable().optional() })).optional(),
    username: z.string().nullable().optional(),
    password: z.string().nullable().optional(),
    totp: z.string().nullable().optional(),
    fido2Credentials: z.array(z.unknown()).optional(),
  })
  .passthrough();

declare global {
  var __ultradash_bw_last_sync_at__: number | undefined;
}

export type VaultwardenField = z.infer<typeof fieldSchema>;
export type VaultwardenItem = z.infer<typeof itemSchema>;
export type VaultwardenFolder = z.infer<typeof folderSchema>;
export type VaultwardenItemTemplate = z.infer<typeof itemTemplateSchema>;
export type VaultwardenLoginTemplate = z.infer<typeof loginTemplateSchema>;

export type VaultwardenBridgeStatus = {
  configured: boolean;
  available: boolean;
  state: string;
  issue: string | null;
};

type BwServeRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | { name: string };
  syncBefore?: boolean;
};

function unwrapEnvelope(value: unknown): unknown {
  let current = value;

  while (current && typeof current === "object" && !Array.isArray(current)) {
    const record = current as Record<string, unknown>;

    if ("data" in record && record.data !== undefined && record.data !== null) {
      current = record.data;
      continue;
    }

    if ("template" in record && record.template !== undefined && record.template !== null) {
      current = record.template;
      continue;
    }

    break;
  }

  return current;
}

async function requestBwServe(path: string, init?: BwServeRequestOptions): Promise<unknown> {
  const config = getVaultwardenConfig();
  if (!config.enabled || !config.bwServeUrl) {
    throw new Error(config.issue ?? "Vaultwarden bridge is not configured.");
  }

  if (init?.syncBefore) {
    await syncVaultwarden();
  }

  const url = new URL(path.replace(/^\//, ""), `${config.bwServeUrl}/`);

  const headers = new Headers(init?.headers ?? undefined);
  if (!headers.has("accept")) {
    headers.set("accept", "application/json, text/plain;q=0.9");
  }

  let body = init?.body;
  if (body && !(body instanceof FormData) && typeof body !== "string" && !(body instanceof URLSearchParams)) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...init,
    body,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Vaultwarden bridge request failed (${response.status} ${response.statusText}): ${text.slice(0, 200)}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function parseItemPayload(payload: unknown): VaultwardenItem {
  return itemSchema.parse(unwrapEnvelope(payload));
}

function parseItemsPayload(payload: unknown): VaultwardenItem[] {
  const unwrapped = unwrapEnvelope(payload);
  return z.array(itemSchema).parse(unwrapped).filter((item) => !item.deletedDate);
}

function parseFoldersPayload(payload: unknown): VaultwardenFolder[] {
  const unwrapped = unwrapEnvelope(payload);
  return z.array(folderSchema).parse(unwrapped);
}

export async function syncVaultwarden(force = false): Promise<void> {
  const config = getVaultwardenConfig();
  if (!config.enabled || !config.bwServeUrl) {
    throw new Error(config.issue ?? "Vaultwarden bridge is not configured.");
  }

  const now = Date.now();
  const lastSyncAt = globalThis.__ultradash_bw_last_sync_at__ ?? 0;
  if (!force && now - lastSyncAt < 10_000) {
    return;
  }

  await requestBwServe("/sync", { method: "POST" });
  globalThis.__ultradash_bw_last_sync_at__ = now;
}

export async function getVaultwardenBridgeStatus(): Promise<VaultwardenBridgeStatus> {
  const config = getVaultwardenConfig();
  if (!config.enabled) {
    return {
      configured: false,
      available: false,
      state: "unconfigured",
      issue: config.issue,
    };
  }

  try {
    const payload = await requestBwServe("/status");
    const unwrapped = unwrapEnvelope(payload);

    const state =
      typeof unwrapped === "object" && unwrapped !== null && "status" in unwrapped
        ? String((unwrapped as Record<string, unknown>).status)
        : "online";

    return {
      configured: true,
      available: true,
      state,
      issue: null,
    };
  } catch (error) {
    return {
      configured: true,
      available: false,
      state: "offline",
      issue: error instanceof Error ? error.message : "Vaultwarden bridge is unavailable.",
    };
  }
}

export async function listVaultwardenItems(options?: { syncBefore?: boolean }): Promise<VaultwardenItem[]> {
  const payload = await requestBwServe("/list/object/items", { syncBefore: options?.syncBefore });
  return parseItemsPayload(payload).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getVaultwardenItem(itemId: string, options?: { syncBefore?: boolean }): Promise<VaultwardenItem | null> {
  try {
    const payload = await requestBwServe(`/object/item/${itemId}`, { syncBefore: options?.syncBefore });
    return parseItemPayload(payload);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

export async function getVaultwardenTotp(itemId: string): Promise<string | null> {
  try {
    const payload = await requestBwServe(`/object/totp/${itemId}`);
    const unwrapped = unwrapEnvelope(payload);

    if (typeof unwrapped === "string") {
      return unwrapped.trim() || null;
    }

    if (typeof unwrapped === "object" && unwrapped !== null) {
      const record = unwrapped as Record<string, unknown>;
      const possible = record.code ?? record.totp ?? record.value;
      if (typeof possible === "string") {
        return possible.trim() || null;
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

export async function listVaultwardenFolders(options?: { syncBefore?: boolean }): Promise<VaultwardenFolder[]> {
  const payload = await requestBwServe("/list/object/folders", { syncBefore: options?.syncBefore });
  return parseFoldersPayload(payload).sort((left, right) => left.name.localeCompare(right.name));
}

export async function createVaultwardenFolder(input: { name: string }): Promise<VaultwardenFolder> {
  const template = await getVaultwardenFolderTemplate();
  template.name = input.name;
  const payload = await requestBwServe("/object/folder", {
    method: "POST",
    body: template,
  });
  return folderSchema.parse(unwrapEnvelope(payload));
}

export async function deleteVaultwardenFolder(folderId: string): Promise<void> {
  await requestBwServe(`/object/folder/${folderId}`, { method: "DELETE" });
}

export async function getVaultwardenItemTemplate(): Promise<VaultwardenItemTemplate> {
  const payload = await requestBwServe("/object/template/item");
  return itemTemplateSchema.parse(unwrapEnvelope(payload));
}

export async function getVaultwardenLoginTemplate(): Promise<VaultwardenLoginTemplate> {
  const payload = await requestBwServe("/object/template/item.login");
  return loginTemplateSchema.parse(unwrapEnvelope(payload));
}

export async function getVaultwardenFolderTemplate(): Promise<{ name: string }> {
  const payload = await requestBwServe("/object/template/folder");
  return z.object({ name: z.string() }).parse(unwrapEnvelope(payload));
}

export async function createVaultwardenItem(payload: Record<string, unknown>): Promise<VaultwardenItem> {
  const response = await requestBwServe("/object/item", {
    method: "POST",
    body: payload,
  });
  return parseItemPayload(response);
}

export async function updateVaultwardenItem(
  itemId: string,
  payload: Record<string, unknown>,
): Promise<VaultwardenItem> {
  const response = await requestBwServe(`/object/item/${itemId}`, {
    method: "PUT",
    body: payload,
  });
  return parseItemPayload(response);
}

export async function deleteVaultwardenItem(itemId: string): Promise<void> {
  await requestBwServe(`/object/item/${itemId}`, { method: "DELETE" });
}

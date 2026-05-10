import "server-only";

import { z } from "zod";

import { getVaultwardenConfig } from "@/lib/vaultwarden/config";

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
    collectionIds: z.array(z.string()).optional(),
    creationDate: z.string().optional(),
    revisionDate: z.string().optional(),
    deletedDate: z.string().nullable().optional(),
  })
  .passthrough();

export type VaultwardenItem = z.infer<typeof itemSchema>;

export type VaultwardenBridgeStatus = {
  configured: boolean;
  available: boolean;
  state: string;
  issue: string | null;
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

async function requestBwServe(path: string, init?: RequestInit): Promise<unknown> {
  const config = getVaultwardenConfig();
  if (!config.enabled || !config.bwServeUrl) {
    throw new Error(config.issue ?? "Vaultwarden bridge is not configured.");
  }

  const url = new URL(path.replace(/^\//, ""), `${config.bwServeUrl}/`);
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json, text/plain;q=0.9",
      ...(init?.headers ?? {}),
    },
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

export async function listVaultwardenItems(): Promise<VaultwardenItem[]> {
  const payload = await requestBwServe("/list/object/items");
  return parseItemsPayload(payload).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getVaultwardenItem(itemId: string): Promise<VaultwardenItem | null> {
  try {
    const payload = await requestBwServe(`/object/item/${itemId}`);
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

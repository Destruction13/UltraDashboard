import "server-only";

import { z } from "zod";

const envSchema = z.object({
  VAULTWARDEN_BASE_URL: z.string().url().optional(),
  VAULTWARDEN_INTERNAL_ACCESS_MODE: z.enum(["bw-serve"]).optional(),
  BW_SERVE_URL: z.string().url().optional(),
  VAULTWARDEN_TEST_ITEM_ID: z.string().uuid().optional(),
  VAULTWARDEN_ORG_ID: z.string().optional(),
  VAULTWARDEN_COLLECTION_IDS: z.string().optional(),
});

export type VaultwardenConfig = {
  enabled: boolean;
  baseUrl: string | null;
  accessMode: "bw-serve" | null;
  bwServeUrl: string | null;
  testItemId: string | null;
  orgId: string | null;
  collectionIds: string | null;
  issue: string | null;
};

export function getVaultwardenConfig(): VaultwardenConfig {
  const parsed = envSchema.safeParse({
    VAULTWARDEN_BASE_URL: process.env.VAULTWARDEN_BASE_URL,
    VAULTWARDEN_INTERNAL_ACCESS_MODE: process.env.VAULTWARDEN_INTERNAL_ACCESS_MODE,
    BW_SERVE_URL: process.env.BW_SERVE_URL,
    VAULTWARDEN_TEST_ITEM_ID: process.env.VAULTWARDEN_TEST_ITEM_ID,
    VAULTWARDEN_ORG_ID: process.env.VAULTWARDEN_ORG_ID,
    VAULTWARDEN_COLLECTION_IDS: process.env.VAULTWARDEN_COLLECTION_IDS,
  });

  if (!parsed.success) {
    return {
      enabled: false,
      baseUrl: null,
      accessMode: null,
      bwServeUrl: null,
      testItemId: null,
      orgId: null,
      collectionIds: null,
      issue: parsed.error.issues[0]?.message ?? "Invalid Vaultwarden configuration.",
    };
  }

  const env = parsed.data;
  if (env.VAULTWARDEN_INTERNAL_ACCESS_MODE !== "bw-serve") {
    return {
      enabled: false,
      baseUrl: env.VAULTWARDEN_BASE_URL ?? null,
      accessMode: null,
      bwServeUrl: null,
      testItemId: env.VAULTWARDEN_TEST_ITEM_ID ?? null,
      orgId: env.VAULTWARDEN_ORG_ID ?? null,
      collectionIds: env.VAULTWARDEN_COLLECTION_IDS ?? null,
      issue: "VAULTWARDEN_INTERNAL_ACCESS_MODE is not configured.",
    };
  }

  if (!env.BW_SERVE_URL) {
    return {
      enabled: false,
      baseUrl: env.VAULTWARDEN_BASE_URL ?? null,
      accessMode: env.VAULTWARDEN_INTERNAL_ACCESS_MODE,
      bwServeUrl: null,
      testItemId: env.VAULTWARDEN_TEST_ITEM_ID ?? null,
      orgId: env.VAULTWARDEN_ORG_ID ?? null,
      collectionIds: env.VAULTWARDEN_COLLECTION_IDS ?? null,
      issue: "BW_SERVE_URL is required when Vaultwarden access mode is bw-serve.",
    };
  }

  return {
    enabled: true,
    baseUrl: env.VAULTWARDEN_BASE_URL ?? null,
    accessMode: env.VAULTWARDEN_INTERNAL_ACCESS_MODE,
    bwServeUrl: env.BW_SERVE_URL,
    testItemId: env.VAULTWARDEN_TEST_ITEM_ID ?? null,
    orgId: env.VAULTWARDEN_ORG_ID ?? null,
    collectionIds: env.VAULTWARDEN_COLLECTION_IDS ?? null,
    issue: null,
  };
}

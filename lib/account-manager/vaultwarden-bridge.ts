import "server-only";

import { LINKED_SERVICE_CATALOG, type InstructionDocumentContent } from "@/lib/db/catalog";
import {
  SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
  type FamilySlug,
} from "@/lib/account-manager/families";
import { type VaultwardenItem, getVaultwardenBridgeStatus, getVaultwardenItem, getVaultwardenTotp, listVaultwardenItems } from "@/lib/vaultwarden/client";
import { getVaultwardenConfig } from "@/lib/vaultwarden/config";

export type VaultwardenRootAccountSummary = {
  id: string;
  displayName: string;
  description: string;
  status: "online" | "offline" | "unconfigured";
  itemCount: number;
  hasFixture: boolean;
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

function getItemLoginUrl(item: VaultwardenItem): string | null {
  return item.login?.uris?.find((uri) => uri.uri)?.uri ?? null;
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
    } catch {
      // Ignore malformed URLs and continue with name heuristics.
    }
  }

  if (name.includes("codex")) return "codex";
  if (name.includes("chatgpt")) return "chatgpt";
  if (name.includes("github")) return "github";
  if (name.includes("devin")) return "devin";
  return "vaultwarden";
}

function inferServiceName(item: VaultwardenItem): string {
  const inferredSlug = inferServiceSlug(item);
  const known = LINKED_SERVICE_CATALOG.find((entry) => entry.slug === inferredSlug);
  return known?.serviceName ?? item.name;
}

function buildInstructionContent(item: VaultwardenItem): {
  title: string;
  summary: string;
  content: InstructionDocumentContent;
} {
  const slug = inferServiceSlug(item);
  const known = LINKED_SERVICE_CATALOG.find((entry) => entry.slug === slug);
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

function toLinkedServiceSummary(item: VaultwardenItem, fixtureItemId: string | null): VaultwardenLinkedServiceSummary {
  return {
    id: item.id,
    title: item.name,
    serviceName: inferServiceName(item),
    serviceSlug: inferServiceSlug(item),
    username: item.login?.username ?? null,
    loginUrl: getItemLoginUrl(item),
    updatedAt: item.revisionDate ?? null,
    hasPassword: Boolean(item.login?.password),
    hasTotp: Boolean(item.login?.totp),
    isFixture: fixtureItemId === item.id,
  };
}

async function safeListVaultwardenItems(): Promise<VaultwardenItem[]> {
  try {
    return await listVaultwardenItems();
  } catch {
    return [];
  }
}

export async function getVaultwardenRootAccountSummary(): Promise<VaultwardenRootAccountSummary> {
  const [status, config] = await Promise.all([
    getVaultwardenBridgeStatus(),
    Promise.resolve(getVaultwardenConfig()),
  ]);

  let itemCount = 0;
  if (status.available) {
    const items = await safeListVaultwardenItems();
    itemCount = items.length;
  }

  return {
    id: SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
    displayName: "Vaultwarden bridge",
    description: "Shared bot vault exposed through bw serve on localhost.",
    status: status.available ? "online" : status.configured ? "offline" : "unconfigured",
    itemCount,
    hasFixture: Boolean(config.testItemId),
  };
}

export async function getVaultwardenRootAccountDetail(
  family: FamilySlug,
  rootAccountId: string,
): Promise<VaultwardenRootAccountDetail | null> {
  if (rootAccountId !== SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID) {
    return null;
  }

  const [status, config] = await Promise.all([
    getVaultwardenBridgeStatus(),
    Promise.resolve(getVaultwardenConfig()),
  ]);
  const items = status.available ? await safeListVaultwardenItems() : [];

  return {
    id: SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
    displayName: "Vaultwarden bridge",
    description: "Shared bot vault exposed through bw serve on localhost.",
    status: status.available ? "online" : status.configured ? "offline" : "unconfigured",
    itemCount: items.length,
    hasFixture: Boolean(config.testItemId),
    family,
    bridgeMode: config.accessMode ?? "disabled",
    baseUrl: config.baseUrl,
    services: items.map((item) => toLinkedServiceSummary(item, config.testItemId)),
    issue: status.issue,
  };
}

export async function getVaultwardenLinkedServiceDetail(
  rootAccountId: string,
  linkedServiceId: string,
): Promise<VaultwardenLinkedServiceDetail | null> {
  if (rootAccountId !== SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID) {
    return null;
  }

  const [config, item] = await Promise.all([
    Promise.resolve(getVaultwardenConfig()),
    getVaultwardenItem(linkedServiceId),
  ]);

  if (!item) {
    return null;
  }

  let currentTotp: string | null = null;
  try {
    currentTotp = await getVaultwardenTotp(linkedServiceId);
  } catch {
    currentTotp = null;
  }

  const instruction = buildInstructionContent(item);
  const summary = toLinkedServiceSummary(item, config.testItemId);

  return {
    ...summary,
    rootAccountId,
    rootAccountName: "Vaultwarden bridge",
    notes: item.notes ?? null,
    password: item.login?.password ?? null,
    currentTotp,
    createdAt: item.creationDate ?? null,
    instructionTitle: instruction.title,
    instructionSummary: instruction.summary,
    instructionContent: instruction.content,
  };
}

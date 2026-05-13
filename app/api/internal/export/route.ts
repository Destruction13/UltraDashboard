import { NextResponse } from "next/server";

import { FAMILY_SLUGS, isFamilySlug, type FamilySlug } from "@/lib/account-manager/families";
import {
  listFamilies,
  listRootAccountsForFamily,
  getRootAccountDetail,
  type LinkedServiceListItem,
  type RootAccountWithCounts,
  type ServiceFamilyRow,
} from "@/lib/account-manager/repository";
import { getVaultwardenItem, getVaultwardenTotp } from "@/lib/vaultwarden/client";

type ExportedTag = {
  slug: string;
  name: string;
};

type ExportedLinkedService = {
  id: string;
  serviceName: string;
  serviceSlug: string;
  loginOrEmail: string | null;
  loginUrl: string | null;
  notes: string | null;
  status: string;
  archivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  vaultItemId: string | null;
  passwordPlaintext: string | null;
  totpSecretPlaintext: string | null;
  resolved: {
    password: string | null;
    currentTotp: string | null;
    source: "vaultwarden" | "plaintext" | "empty";
    bridgeIssue: string | null;
  };
  tags: ExportedTag[];
};

type ExportedRootAccount = {
  id: string;
  displayName: string;
  primaryEmail: string | null;
  username: string | null;
  notes: string | null;
  status: string;
  archivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  linkedServices: ExportedLinkedService[];
};

type ExportedFamily = {
  slug: FamilySlug;
  name: string;
  rootAccounts: ExportedRootAccount[];
};

type ExportPayload = {
  exportedAt: string;
  format: "ultradashboard.v1";
  includeSecrets: boolean;
  families: ExportedFamily[];
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function resolveCredentials(
  service: LinkedServiceListItem,
): Promise<ExportedLinkedService["resolved"]> {
  if (service.vaultItemId) {
    try {
      const item = await getVaultwardenItem(service.vaultItemId);
      let totp: string | null = null;
      try {
        totp = await getVaultwardenTotp(service.vaultItemId);
      } catch {
        totp = null;
      }
      return {
        password: item?.login?.password ?? null,
        currentTotp: totp,
        source: "vaultwarden",
        bridgeIssue: item ? null : "Vault item not found.",
      };
    } catch (error) {
      return {
        password: null,
        currentTotp: null,
        source: "vaultwarden",
        bridgeIssue: error instanceof Error ? error.message : "Vaultwarden read failed.",
      };
    }
  }
  if (service.passwordPlaintext || service.totpSecretPlaintext) {
    return {
      password: service.passwordPlaintext,
      currentTotp: null,
      source: "plaintext",
      bridgeIssue: null,
    };
  }
  return {
    password: null,
    currentTotp: null,
    source: "empty",
    bridgeIssue: null,
  };
}

function serializeService(
  service: LinkedServiceListItem,
  resolved: ExportedLinkedService["resolved"],
  includeSecrets: boolean,
): ExportedLinkedService {
  return {
    id: service.id,
    serviceName: service.serviceName,
    serviceSlug: service.serviceSlug,
    loginOrEmail: service.loginOrEmail,
    loginUrl: service.loginUrl,
    notes: service.notes,
    status: service.status,
    archivedAt: toIso(service.archivedAt),
    createdAt: toIso(service.createdAt),
    updatedAt: toIso(service.updatedAt),
    vaultItemId: service.vaultItemId,
    passwordPlaintext: includeSecrets ? service.passwordPlaintext : null,
    totpSecretPlaintext: includeSecrets ? service.totpSecretPlaintext : null,
    resolved: includeSecrets
      ? resolved
      : { ...resolved, password: null, currentTotp: null },
    tags: service.tags.map((tag) => ({ slug: tag.slug, name: tag.label })),
  };
}

function serializeRoot(
  root: RootAccountWithCounts,
  services: ExportedLinkedService[],
): ExportedRootAccount {
  return {
    id: root.id,
    displayName: root.displayName,
    primaryEmail: root.primaryEmail,
    username: root.username,
    notes: root.notes,
    status: root.status,
    archivedAt: toIso(root.archivedAt),
    createdAt: toIso(root.createdAt),
    updatedAt: toIso(root.updatedAt),
    linkedServices: services,
  };
}

function toCsv(payload: ExportPayload): string {
  const header = [
    "family_slug",
    "family_name",
    "root_account_id",
    "root_display_name",
    "root_primary_email",
    "root_username",
    "linked_service_id",
    "service_name",
    "service_slug",
    "login_or_email",
    "login_url",
    "vault_item_id",
    "password",
    "current_totp",
    "credential_source",
    "tags",
    "notes",
    "status",
    "created_at",
    "updated_at",
  ];

  const escape = (raw: unknown): string => {
    if (raw === null || raw === undefined) return "";
    const str = String(raw);
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
      return `"${str.replace(/"/g, "\"\"")}"`;
    }
    return str;
  };

  const lines = [header.join(",")];
  for (const family of payload.families) {
    for (const root of family.rootAccounts) {
      for (const service of root.linkedServices) {
        lines.push(
          [
            family.slug,
            family.name,
            root.id,
            root.displayName,
            root.primaryEmail,
            root.username,
            service.id,
            service.serviceName,
            service.serviceSlug,
            service.loginOrEmail,
            service.loginUrl,
            service.vaultItemId,
            payload.includeSecrets ? service.resolved.password : null,
            payload.includeSecrets ? service.resolved.currentTotp : null,
            service.resolved.source,
            service.tags.map((tag) => tag.slug).join("|"),
            service.notes,
            service.status,
            service.createdAt,
            service.updatedAt,
          ]
            .map(escape)
            .join(","),
        );
      }
    }
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const familyParam = url.searchParams.get("family");
  const includeSecrets = url.searchParams.get("includeSecrets") === "true";
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  const familyFilter: FamilySlug | null =
    familyParam && isFamilySlug(familyParam) ? familyParam : null;

  const families: ServiceFamilyRow[] = await listFamilies();
  const selectedFamilies = familyFilter
    ? families.filter((family) => family.slug === familyFilter)
    : families.filter((family) => FAMILY_SLUGS.includes(family.slug as FamilySlug));

  const exportedFamilies: ExportedFamily[] = [];
  for (const family of selectedFamilies) {
    if (!isFamilySlug(family.slug)) continue;
    const rootsLite = await listRootAccountsForFamily(family.slug, {
      includeArchived: false,
    });

    const rootsFull: ExportedRootAccount[] = [];
    for (const rootLite of rootsLite) {
      const detail = await getRootAccountDetail(rootLite.id);
      if (!detail) continue;

      const serializedServices: ExportedLinkedService[] = [];
      for (const service of detail.linkedServices) {
        const resolved = await resolveCredentials(service);
        serializedServices.push(serializeService(service, resolved, includeSecrets));
      }

      rootsFull.push(serializeRoot(rootLite, serializedServices));
    }

    exportedFamilies.push({
      slug: family.slug,
      name: family.name,
      rootAccounts: rootsFull,
    });
  }

  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    format: "ultradashboard.v1",
    includeSecrets,
    families: exportedFamilies,
  };

  if (format === "csv") {
    return new NextResponse(toCsv(payload), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ultradashboard-export-${
          new Date().toISOString().slice(0, 10)
        }.csv"`,
      },
    });
  }

  return NextResponse.json(payload);
}

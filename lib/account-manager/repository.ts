import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, isNotNull, isNull, or } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import {
  LINKED_SERVICE_CATALOG,
  type InstructionDocumentContent,
  type LinkedServiceCatalogEntry,
} from "@/lib/db/catalog";
import {
  type FamilySlug,
} from "@/lib/account-manager/families";
import {
  type VaultwardenItem,
  getVaultwardenItem,
  getVaultwardenTotp,
} from "@/lib/vaultwarden/client";

/* -------------------------------------------------------------------------- */
/*  Read DTOs                                                                  */
/* -------------------------------------------------------------------------- */

export type ServiceFamilyRow = typeof schema.serviceFamilies.$inferSelect;
export type RootAccountRow = typeof schema.rootAccounts.$inferSelect;
export type LinkedServiceAccountRow = typeof schema.linkedServiceAccounts.$inferSelect;
export type TagRow = typeof schema.tags.$inferSelect;
export type InstructionDocumentRow = typeof schema.instructionDocuments.$inferSelect;

export type RootAccountWithCounts = RootAccountRow & {
  family: ServiceFamilyRow;
  linkedServiceCount: number;
};

export type LinkedServiceListItem = LinkedServiceAccountRow & {
  tags: TagRow[];
};

export type RootAccountDetail = RootAccountWithCounts & {
  linkedServices: LinkedServiceListItem[];
};

export type LinkedServiceDetail = LinkedServiceAccountRow & {
  family: ServiceFamilyRow;
  rootAccount: RootAccountRow;
  tags: TagRow[];
  instructionDocument: InstructionDocumentRow | null;
  /** Resolved live values (Vaultwarden bridge if `vaultItemId`, else plaintext fallback). */
  resolved: {
    loginOrEmail: string | null;
    password: string | null;
    currentTotp: string | null;
    loginUrl: string | null;
    source: "vaultwarden" | "plaintext" | "empty";
    bridgeIssue: string | null;
  };
  /** Catalog default when no instruction document exists. */
  catalogDefault: {
    title: string;
    summary: string;
    content: InstructionDocumentContent;
  };
};

/* -------------------------------------------------------------------------- */
/*  Read helpers                                                               */
/* -------------------------------------------------------------------------- */

export async function listFamilies(): Promise<ServiceFamilyRow[]> {
  return db
    .select()
    .from(schema.serviceFamilies)
    .where(eq(schema.serviceFamilies.isActive, true))
    .orderBy(asc(schema.serviceFamilies.sortOrder), asc(schema.serviceFamilies.name));
}

export async function getFamilyBySlug(slug: FamilySlug): Promise<ServiceFamilyRow | null> {
  const [row] = await db
    .select()
    .from(schema.serviceFamilies)
    .where(eq(schema.serviceFamilies.slug, slug))
    .limit(1);
  return row ?? null;
}

export type ListRootAccountsOptions = {
  /** Free-text search against display name / username / linked service login. */
  search?: string;
  /** Filter to root accounts that have at least one linked service with this tag slug. */
  tagSlug?: string;
  /** Include archived rows (default: false). */
  includeArchived?: boolean;
};

export async function listRootAccountsForFamily(
  slug: FamilySlug,
  options: ListRootAccountsOptions = {},
): Promise<RootAccountWithCounts[]> {
  const family = await getFamilyBySlug(slug);
  if (!family) return [];

  const search = options.search?.trim();
  const tagSlug = options.tagSlug?.trim();

  let matchingRootIds: string[] | null = null;

  if (tagSlug) {
    const tagged = await db
      .select({ rootAccountId: schema.linkedServiceAccounts.rootAccountId })
      .from(schema.linkedServiceAccountTags)
      .innerJoin(schema.tags, eq(schema.linkedServiceAccountTags.tagId, schema.tags.id))
      .innerJoin(
        schema.linkedServiceAccounts,
        eq(schema.linkedServiceAccounts.id, schema.linkedServiceAccountTags.linkedServiceAccountId),
      )
      .where(eq(schema.tags.slug, tagSlug));

    matchingRootIds = Array.from(new Set(tagged.map((row) => row.rootAccountId)));
    if (matchingRootIds.length === 0) return [];
  }

  if (search) {
    const term = `%${search}%`;
    const matches = await db
      .selectDistinct({ rootAccountId: schema.linkedServiceAccounts.rootAccountId })
      .from(schema.linkedServiceAccounts)
      .where(ilike(schema.linkedServiceAccounts.loginOrEmail, term));

    const fromLinked = matches.map((row) => row.rootAccountId);
    const fromRoots = await db
      .select({ id: schema.rootAccounts.id })
      .from(schema.rootAccounts)
      .where(
        and(
          eq(schema.rootAccounts.serviceFamilyId, family.id),
          or(
            ilike(schema.rootAccounts.displayName, term),
            ilike(schema.rootAccounts.primaryEmail, term),
            ilike(schema.rootAccounts.username, term),
          ),
        ),
      );
    const ids = Array.from(new Set([...fromLinked, ...fromRoots.map((row) => row.id)]));

    matchingRootIds = matchingRootIds === null ? ids : matchingRootIds.filter((id) => ids.includes(id));

    if (matchingRootIds.length === 0) return [];
  }

  const conditions = [eq(schema.rootAccounts.serviceFamilyId, family.id)];
  if (!options.includeArchived) {
    conditions.push(isNull(schema.rootAccounts.archivedAt));
  }
  if (matchingRootIds !== null) {
    conditions.push(inArray(schema.rootAccounts.id, matchingRootIds));
  }

  const rows = await db
    .select()
    .from(schema.rootAccounts)
    .where(and(...conditions))
    .orderBy(asc(schema.rootAccounts.displayName));

  if (rows.length === 0) return [];

  const counts = await db
    .select({
      rootAccountId: schema.linkedServiceAccounts.rootAccountId,
    })
    .from(schema.linkedServiceAccounts)
    .where(
      and(
        inArray(
          schema.linkedServiceAccounts.rootAccountId,
          rows.map((row) => row.id),
        ),
        isNull(schema.linkedServiceAccounts.archivedAt),
      ),
    );

  const countByRoot = counts.reduce<Map<string, number>>((acc, row) => {
    acc.set(row.rootAccountId, (acc.get(row.rootAccountId) ?? 0) + 1);
    return acc;
  }, new Map());

  return rows.map((row) => ({
    ...row,
    family,
    linkedServiceCount: countByRoot.get(row.id) ?? 0,
  }));
}

export async function getRootAccountWithFamily(
  rootAccountId: string,
): Promise<{ rootAccount: RootAccountRow; family: ServiceFamilyRow } | null> {
  const [row] = await db
    .select({
      rootAccount: schema.rootAccounts,
      family: schema.serviceFamilies,
    })
    .from(schema.rootAccounts)
    .innerJoin(
      schema.serviceFamilies,
      eq(schema.serviceFamilies.id, schema.rootAccounts.serviceFamilyId),
    )
    .where(eq(schema.rootAccounts.id, rootAccountId))
    .limit(1);
  return row ?? null;
}

export async function getRootAccountDetail(
  rootAccountId: string,
): Promise<RootAccountDetail | null> {
  const root = await getRootAccountWithFamily(rootAccountId);
  if (!root) return null;

  const linkedServices = await db
    .select()
    .from(schema.linkedServiceAccounts)
    .where(
      and(
        eq(schema.linkedServiceAccounts.rootAccountId, rootAccountId),
        isNull(schema.linkedServiceAccounts.archivedAt),
      ),
    )
    .orderBy(asc(schema.linkedServiceAccounts.serviceName));

  const tagsByLinked = await loadTagsForLinkedServices(linkedServices.map((row) => row.id));

  return {
    ...root.rootAccount,
    family: root.family,
    linkedServiceCount: linkedServices.length,
    linkedServices: linkedServices.map((row) => ({
      ...row,
      tags: tagsByLinked.get(row.id) ?? [],
    })),
  };
}

async function loadTagsForLinkedServices(
  linkedIds: ReadonlyArray<string>,
): Promise<Map<string, TagRow[]>> {
  const result = new Map<string, TagRow[]>();
  if (linkedIds.length === 0) return result;

  const rows = await db
    .select({
      linkedServiceAccountId: schema.linkedServiceAccountTags.linkedServiceAccountId,
      tag: schema.tags,
    })
    .from(schema.linkedServiceAccountTags)
    .innerJoin(schema.tags, eq(schema.linkedServiceAccountTags.tagId, schema.tags.id))
    .where(inArray(schema.linkedServiceAccountTags.linkedServiceAccountId, [...linkedIds]));

  for (const row of rows) {
    const list = result.get(row.linkedServiceAccountId) ?? [];
    list.push(row.tag);
    result.set(row.linkedServiceAccountId, list);
  }
  return result;
}

function findCatalogEntry(slug: string): LinkedServiceCatalogEntry | undefined {
  return LINKED_SERVICE_CATALOG.find((entry) => entry.slug === slug);
}

function buildCatalogDefault(serviceSlug: string, fallbackName: string) {
  const entry = findCatalogEntry(serviceSlug);
  if (entry) {
    return {
      title: entry.defaultInstructionTitle,
      summary: entry.defaultInstructionSummary,
      content: entry.defaultContent,
    };
  }
  return {
    title: `Use this ${fallbackName}`,
    summary: "Operator checklist for this linked service account.",
    content: {
      version: 1 as const,
      blocks: [
        {
          type: "overview" as const,
          text: "Open the login page, copy the credentials from the left panel, and use the live TOTP when prompted.",
        },
      ],
    },
  };
}

function getItemLoginUrl(item: VaultwardenItem): string | null {
  return item.login?.uris?.find((uri) => uri.uri)?.uri ?? null;
}

async function resolveCredentials(
  row: LinkedServiceAccountRow,
): Promise<LinkedServiceDetail["resolved"]> {
  if (row.vaultItemId) {
    let item: VaultwardenItem | null = null;
    let bridgeIssue: string | null = null;
    try {
      item = await getVaultwardenItem(row.vaultItemId);
    } catch (error) {
      bridgeIssue = error instanceof Error ? error.message : "Vaultwarden bridge unavailable.";
    }

    let currentTotp: string | null = null;
    if (item) {
      try {
        currentTotp = await getVaultwardenTotp(row.vaultItemId);
      } catch {
        currentTotp = null;
      }
    }

    return {
      loginOrEmail: item?.login?.username ?? row.loginOrEmail ?? null,
      password: item?.login?.password ?? null,
      currentTotp,
      loginUrl: (item ? getItemLoginUrl(item) : null) ?? row.loginUrl ?? null,
      source: item ? "vaultwarden" : "empty",
      bridgeIssue,
    };
  }

  const hasPlaintext = Boolean(row.passwordPlaintext || row.totpSecretPlaintext);
  return {
    loginOrEmail: row.loginOrEmail ?? null,
    password: row.passwordPlaintext ?? null,
    // V1 deliberately does not generate OTP from plaintext columns yet (see spec §"TOTP design").
    currentTotp: null,
    loginUrl: row.loginUrl ?? null,
    source: hasPlaintext || row.loginOrEmail ? "plaintext" : "empty",
    bridgeIssue: null,
  };
}

export async function getLinkedServiceDetailById(
  linkedServiceId: string,
): Promise<LinkedServiceDetail | null> {
  const [row] = await db
    .select({
      linked: schema.linkedServiceAccounts,
      rootAccount: schema.rootAccounts,
      family: schema.serviceFamilies,
    })
    .from(schema.linkedServiceAccounts)
    .innerJoin(
      schema.rootAccounts,
      eq(schema.rootAccounts.id, schema.linkedServiceAccounts.rootAccountId),
    )
    .innerJoin(
      schema.serviceFamilies,
      eq(schema.serviceFamilies.id, schema.rootAccounts.serviceFamilyId),
    )
    .where(eq(schema.linkedServiceAccounts.id, linkedServiceId))
    .limit(1);

  if (!row) return null;

  const [tagsByLinked, instructionDoc, resolved] = await Promise.all([
    loadTagsForLinkedServices([row.linked.id]),
    db
      .select()
      .from(schema.instructionDocuments)
      .where(eq(schema.instructionDocuments.linkedServiceAccountId, row.linked.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    resolveCredentials(row.linked),
  ]);

  return {
    ...row.linked,
    family: row.family,
    rootAccount: row.rootAccount,
    tags: tagsByLinked.get(row.linked.id) ?? [],
    instructionDocument: instructionDoc,
    resolved,
    catalogDefault: buildCatalogDefault(row.linked.serviceSlug, row.linked.serviceName),
  };
}

/* -------------------------------------------------------------------------- */
/*  Tags                                                                       */
/* -------------------------------------------------------------------------- */

export async function listTags(): Promise<TagRow[]> {
  return db.select().from(schema.tags).orderBy(asc(schema.tags.label));
}

export type AccountManagerStats = {
  families: number;
  rootAccounts: number;
  linkedServices: number;
  archivedRootAccounts: number;
  archivedLinkedServices: number;
  perFamily: Array<{ slug: string; label: string; rootAccounts: number; linkedServices: number }>;
  latestRootCreatedAt: string | null;
};

export async function getAccountManagerStats(): Promise<AccountManagerStats> {
  const families = await db
    .select()
    .from(schema.serviceFamilies)
    .orderBy(asc(schema.serviceFamilies.sortOrder), asc(schema.serviceFamilies.name));

  const [rootTotalsRow] = await db
    .select({
      total: count(),
    })
    .from(schema.rootAccounts);

  const [rootArchivedRow] = await db
    .select({ total: count() })
    .from(schema.rootAccounts)
    .where(isNotNull(schema.rootAccounts.archivedAt));

  const [linkedTotalsRow] = await db
    .select({ total: count() })
    .from(schema.linkedServiceAccounts);

  const [linkedArchivedRow] = await db
    .select({ total: count() })
    .from(schema.linkedServiceAccounts)
    .where(isNotNull(schema.linkedServiceAccounts.archivedAt));

  const rootPerFamily = await db
    .select({
      familyId: schema.rootAccounts.serviceFamilyId,
      total: count(),
    })
    .from(schema.rootAccounts)
    .where(isNull(schema.rootAccounts.archivedAt))
    .groupBy(schema.rootAccounts.serviceFamilyId);

  const linkedPerFamily = await db
    .select({
      familyId: schema.rootAccounts.serviceFamilyId,
      total: count(),
    })
    .from(schema.linkedServiceAccounts)
    .innerJoin(
      schema.rootAccounts,
      eq(schema.rootAccounts.id, schema.linkedServiceAccounts.rootAccountId),
    )
    .where(
      and(
        isNull(schema.linkedServiceAccounts.archivedAt),
        isNull(schema.rootAccounts.archivedAt),
      ),
    )
    .groupBy(schema.rootAccounts.serviceFamilyId);

  const [latestRoot] = await db
    .select({ createdAt: schema.rootAccounts.createdAt })
    .from(schema.rootAccounts)
    .where(isNull(schema.rootAccounts.archivedAt))
    .orderBy(desc(schema.rootAccounts.createdAt))
    .limit(1);

  const rootByFamily = new Map(rootPerFamily.map((row) => [row.familyId, Number(row.total)]));
  const linkedByFamily = new Map(linkedPerFamily.map((row) => [row.familyId, Number(row.total)]));

  return {
    families: families.length,
    rootAccounts: Number(rootTotalsRow?.total ?? 0),
    linkedServices: Number(linkedTotalsRow?.total ?? 0),
    archivedRootAccounts: Number(rootArchivedRow?.total ?? 0),
    archivedLinkedServices: Number(linkedArchivedRow?.total ?? 0),
    perFamily: families.map((family) => ({
      slug: family.slug,
      label: family.name,
      rootAccounts: rootByFamily.get(family.id) ?? 0,
      linkedServices: linkedByFamily.get(family.id) ?? 0,
    })),
    latestRootCreatedAt: latestRoot?.createdAt ? new Date(latestRoot.createdAt).toISOString() : null,
  };
}

export async function setTagsForLinkedService(
  linkedServiceAccountId: string,
  tagSlugs: ReadonlyArray<string>,
): Promise<void> {
  const cleanSlugs = Array.from(new Set(tagSlugs.map((slug) => slug.trim()).filter(Boolean)));

  if (cleanSlugs.length === 0) {
    await db
      .delete(schema.linkedServiceAccountTags)
      .where(eq(schema.linkedServiceAccountTags.linkedServiceAccountId, linkedServiceAccountId));
    return;
  }

  const matchingTags = await db
    .select()
    .from(schema.tags)
    .where(inArray(schema.tags.slug, cleanSlugs));
  const tagIds = matchingTags.map((tag) => tag.id);

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.linkedServiceAccountTags)
      .where(eq(schema.linkedServiceAccountTags.linkedServiceAccountId, linkedServiceAccountId));
    if (tagIds.length === 0) return;
    await tx.insert(schema.linkedServiceAccountTags).values(
      tagIds.map((tagId) => ({
        linkedServiceAccountId,
        tagId,
      })),
    );
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations: root accounts                                                   */
/* -------------------------------------------------------------------------- */

export type CreateRootAccountInput = {
  familySlug: FamilySlug;
  displayName: string;
  primaryEmail?: string | null;
  username?: string | null;
  notes?: string | null;
};

export async function createRootAccount(input: CreateRootAccountInput): Promise<RootAccountRow> {
  const family = await getFamilyBySlug(input.familySlug);
  if (!family) {
    throw new Error(`Unknown service family slug: ${input.familySlug}`);
  }

  const [row] = await db
    .insert(schema.rootAccounts)
    .values({
      serviceFamilyId: family.id,
      displayName: input.displayName.trim(),
      primaryEmail: input.primaryEmail?.trim() || null,
      username: input.username?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "active",
    })
    .returning();
  return row;
}

export type UpdateRootAccountInput = Partial<{
  displayName: string;
  primaryEmail: string | null;
  username: string | null;
  notes: string | null;
  status: string;
}>;

export async function updateRootAccount(
  id: string,
  input: UpdateRootAccountInput,
): Promise<RootAccountRow | null> {
  const [row] = await db
    .update(schema.rootAccounts)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.rootAccounts.id, id))
    .returning();
  return row ?? null;
}

export async function archiveRootAccount(id: string): Promise<RootAccountRow | null> {
  const now = new Date();
  const [row] = await db
    .update(schema.rootAccounts)
    .set({ archivedAt: now, status: "archived", updatedAt: now })
    .where(eq(schema.rootAccounts.id, id))
    .returning();
  return row ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Mutations: linked service accounts                                         */
/* -------------------------------------------------------------------------- */

export type CreateLinkedServiceInput = {
  rootAccountId: string;
  serviceName: string;
  serviceSlug: string;
  loginOrEmail?: string | null;
  loginUrl?: string | null;
  vaultItemId?: string | null;
  passwordPlaintext?: string | null;
  totpSecretPlaintext?: string | null;
  notes?: string | null;
  tagSlugs?: ReadonlyArray<string>;
};

export async function createLinkedServiceAccount(
  input: CreateLinkedServiceInput,
): Promise<LinkedServiceAccountRow> {
  const fallbackUrl = findCatalogEntry(input.serviceSlug)?.defaultLoginUrl ?? null;

  const [row] = await db
    .insert(schema.linkedServiceAccounts)
    .values({
      rootAccountId: input.rootAccountId,
      serviceName: input.serviceName.trim(),
      serviceSlug: input.serviceSlug.trim(),
      loginOrEmail: input.loginOrEmail?.trim() || null,
      loginUrl: input.loginUrl?.trim() || fallbackUrl,
      vaultItemId: input.vaultItemId?.trim() || null,
      passwordPlaintext: input.passwordPlaintext ?? null,
      totpSecretPlaintext: input.totpSecretPlaintext ?? null,
      notes: input.notes?.trim() || null,
      status: "active",
    })
    .returning();

  if (input.tagSlugs && input.tagSlugs.length > 0) {
    await setTagsForLinkedService(row.id, input.tagSlugs);
  }
  return row;
}

export type UpdateLinkedServiceInput = Partial<{
  serviceName: string;
  serviceSlug: string;
  loginOrEmail: string | null;
  loginUrl: string | null;
  vaultItemId: string | null;
  passwordPlaintext: string | null;
  totpSecretPlaintext: string | null;
  notes: string | null;
  status: string;
}>;

export async function updateLinkedServiceAccount(
  id: string,
  input: UpdateLinkedServiceInput,
): Promise<LinkedServiceAccountRow | null> {
  const [row] = await db
    .update(schema.linkedServiceAccounts)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(schema.linkedServiceAccounts.id, id))
    .returning();
  return row ?? null;
}

export async function updateLinkedServiceNotes(
  id: string,
  notes: string | null,
): Promise<LinkedServiceAccountRow | null> {
  return updateLinkedServiceAccount(id, { notes: notes && notes.trim() ? notes.trim() : null });
}

export async function archiveLinkedServiceAccount(
  id: string,
): Promise<LinkedServiceAccountRow | null> {
  const now = new Date();
  const [row] = await db
    .update(schema.linkedServiceAccounts)
    .set({ archivedAt: now, status: "archived", updatedAt: now })
    .where(eq(schema.linkedServiceAccounts.id, id))
    .returning();
  return row ?? null;
}

export async function deleteLinkedServiceAccount(id: string): Promise<boolean> {
  const [row] = await db
    .delete(schema.linkedServiceAccounts)
    .where(eq(schema.linkedServiceAccounts.id, id))
    .returning({ id: schema.linkedServiceAccounts.id });
  return Boolean(row);
}

/* -------------------------------------------------------------------------- */
/*  Mutations: instruction documents                                           */
/* -------------------------------------------------------------------------- */

export type UpsertInstructionInput = {
  linkedServiceAccountId: string;
  title: string;
  summary?: string | null;
  contentJson: InstructionDocumentContent;
};

export async function upsertInstructionDocument(
  input: UpsertInstructionInput,
): Promise<InstructionDocumentRow> {
  const [row] = await db
    .insert(schema.instructionDocuments)
    .values({
      linkedServiceAccountId: input.linkedServiceAccountId,
      title: input.title.trim(),
      summary: input.summary?.trim() || null,
      contentJson: input.contentJson,
    })
    .onConflictDoUpdate({
      target: schema.instructionDocuments.linkedServiceAccountId,
      set: {
        title: input.title.trim(),
        summary: input.summary?.trim() || null,
        contentJson: input.contentJson,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

/* -------------------------------------------------------------------------- */
/*  Search                                                                     */
/* -------------------------------------------------------------------------- */

export type SearchOptions = {
  tagSlug?: string;
  q?: string;
  familySlug?: FamilySlug;
};

export type SearchResult = {
  linkedServiceAccount: LinkedServiceAccountRow;
  rootAccount: RootAccountRow;
  family: ServiceFamilyRow;
  tags: TagRow[];
};

export async function searchAccounts(opts: SearchOptions): Promise<SearchResult[]> {
  const conditions = [isNull(schema.linkedServiceAccounts.archivedAt)] as Array<
    ReturnType<typeof eq>
  >;

  if (opts.familySlug) {
    const family = await getFamilyBySlug(opts.familySlug);
    if (!family) return [];
    conditions.push(eq(schema.rootAccounts.serviceFamilyId, family.id));
  }

  const q = opts.q?.trim();
  if (q) {
    const term = `%${q}%`;
    conditions.push(
      or(
        ilike(schema.linkedServiceAccounts.loginOrEmail, term),
        ilike(schema.linkedServiceAccounts.serviceName, term),
        ilike(schema.rootAccounts.displayName, term),
      ) as ReturnType<typeof eq>,
    );
  }

  if (opts.tagSlug) {
    const taggedRows = await db
      .select({ linkedServiceAccountId: schema.linkedServiceAccountTags.linkedServiceAccountId })
      .from(schema.linkedServiceAccountTags)
      .innerJoin(schema.tags, eq(schema.linkedServiceAccountTags.tagId, schema.tags.id))
      .where(eq(schema.tags.slug, opts.tagSlug));
    const ids = taggedRows.map((row) => row.linkedServiceAccountId);
    if (ids.length === 0) return [];
    conditions.push(inArray(schema.linkedServiceAccounts.id, ids));
  }

  const rows = await db
    .select({
      linkedServiceAccount: schema.linkedServiceAccounts,
      rootAccount: schema.rootAccounts,
      family: schema.serviceFamilies,
    })
    .from(schema.linkedServiceAccounts)
    .innerJoin(
      schema.rootAccounts,
      eq(schema.rootAccounts.id, schema.linkedServiceAccounts.rootAccountId),
    )
    .innerJoin(
      schema.serviceFamilies,
      eq(schema.serviceFamilies.id, schema.rootAccounts.serviceFamilyId),
    )
    .where(and(...conditions))
    .orderBy(desc(schema.linkedServiceAccounts.updatedAt))
    .limit(200);

  const tagsByLinked = await loadTagsForLinkedServices(
    rows.map((row) => row.linkedServiceAccount.id),
  );

  return rows.map((row) => ({
    ...row,
    tags: tagsByLinked.get(row.linkedServiceAccount.id) ?? [],
  }));
}

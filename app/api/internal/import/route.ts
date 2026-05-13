import { NextResponse } from "next/server";
import { z } from "zod";

import { FAMILY_SLUGS, isFamilySlug, type FamilySlug } from "@/lib/account-manager/families";
import {
  createLinkedServiceAccount,
  createRootAccount,
  listRootAccountsForFamily,
  setTagsForLinkedService,
} from "@/lib/account-manager/repository";

const linkedServiceSchema = z.object({
  serviceName: z.string().min(1),
  serviceSlug: z.string().min(1),
  loginOrEmail: z.string().nullable().optional(),
  loginUrl: z.string().url().nullable().optional(),
  vaultItemId: z.string().nullable().optional(),
  passwordPlaintext: z.string().nullable().optional(),
  totpSecretPlaintext: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tagSlugs: z.array(z.string()).optional(),
});

const rootAccountSchema = z.object({
  familySlug: z.enum(FAMILY_SLUGS as readonly [FamilySlug, ...FamilySlug[]]),
  displayName: z.string().min(1),
  primaryEmail: z.string().email().nullable().optional(),
  username: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  /**
   * Optional deduplication key. When provided, an existing active root
   * account matching the family + (primaryEmail || username || displayName)
   * is reused instead of creating a duplicate.
   */
  dedupe: z.boolean().optional().default(true),
  linkedServices: z.array(linkedServiceSchema).optional().default([]),
});

const importSchema = z.object({
  rootAccounts: z.array(rootAccountSchema).min(1),
});

type ImportRootResult = {
  rootAccountId: string;
  familySlug: FamilySlug;
  reused: boolean;
  linkedServices: Array<{ id: string; serviceSlug: string; serviceName: string }>;
};

async function findExistingRoot(
  familySlug: FamilySlug,
  match: { primaryEmail?: string | null; username?: string | null; displayName: string },
): Promise<{ id: string } | null> {
  const rows = await listRootAccountsForFamily(familySlug);
  const norm = (value: string | null | undefined) =>
    value ? value.trim().toLowerCase() : null;

  const matchEmail = norm(match.primaryEmail);
  const matchUser = norm(match.username);
  const matchName = norm(match.displayName);

  for (const row of rows) {
    const rowEmail = norm(row.primaryEmail);
    const rowUser = norm(row.username);
    const rowName = norm(row.displayName);

    if (matchEmail && rowEmail && matchEmail === rowEmail) return row;
    if (matchUser && rowUser && matchUser === rowUser) return row;
    if (!matchEmail && !matchUser && matchName && rowName === matchName) return row;
  }
  return null;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const parsed = importSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results: ImportRootResult[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < parsed.data.rootAccounts.length; i += 1) {
    const root = parsed.data.rootAccounts[i];
    try {
      if (!isFamilySlug(root.familySlug)) {
        throw new Error(`Unknown family slug: ${root.familySlug}`);
      }

      let rootAccountId: string;
      let reused = false;

      if (root.dedupe) {
        const existing = await findExistingRoot(root.familySlug, {
          primaryEmail: root.primaryEmail ?? null,
          username: root.username ?? null,
          displayName: root.displayName,
        });
        if (existing) {
          rootAccountId = existing.id;
          reused = true;
        }
      }

      if (rootAccountId! === undefined) {
        const created = await createRootAccount({
          familySlug: root.familySlug,
          displayName: root.displayName,
          primaryEmail: root.primaryEmail ?? null,
          username: root.username ?? null,
          notes: root.notes ?? null,
        });
        rootAccountId = created.id;
      }

      const linkedResults: ImportRootResult["linkedServices"] = [];
      for (const linked of root.linkedServices ?? []) {
        const row = await createLinkedServiceAccount({
          rootAccountId,
          serviceName: linked.serviceName,
          serviceSlug: linked.serviceSlug,
          loginOrEmail: linked.loginOrEmail ?? null,
          loginUrl: linked.loginUrl ?? null,
          vaultItemId: linked.vaultItemId ?? null,
          passwordPlaintext: linked.passwordPlaintext ?? null,
          totpSecretPlaintext: linked.totpSecretPlaintext ?? null,
          notes: linked.notes ?? null,
        });

        if (linked.tagSlugs && linked.tagSlugs.length > 0) {
          await setTagsForLinkedService(row.id, linked.tagSlugs);
        }

        linkedResults.push({
          id: row.id,
          serviceSlug: row.serviceSlug,
          serviceName: row.serviceName,
        });
      }

      results.push({
        rootAccountId,
        familySlug: root.familySlug,
        reused,
        linkedServices: linkedResults,
      });
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : "Unknown import error.",
      });
    }
  }

  const status = errors.length === 0 ? 201 : results.length === 0 ? 400 : 207;
  return NextResponse.json(
    {
      created: results.filter((r) => !r.reused).length,
      reused: results.filter((r) => r.reused).length,
      failed: errors.length,
      results,
      errors,
    },
    { status },
  );
}

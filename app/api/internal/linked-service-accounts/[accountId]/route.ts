import { NextResponse } from "next/server";
import { z } from "zod";

import { SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID } from "@/lib/account-manager/families";
import {
  deleteLinkedServiceAccount,
  getLinkedServiceDetailById,
  setTagsForLinkedService,
  updateLinkedServiceAccount,
} from "@/lib/account-manager/repository";
import { getVaultwardenLinkedServiceDetail } from "@/lib/account-manager/vaultwarden-bridge";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;

  if (UUID_REGEX.test(accountId)) {
    const detail = await getLinkedServiceDetailById(accountId);
    if (detail) {
      return NextResponse.json({ data: detail });
    }
  }

  const bridgeDetail = await getVaultwardenLinkedServiceDetail(
    SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
    accountId,
  );
  if (!bridgeDetail) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }

  return NextResponse.json({ data: bridgeDetail });
}

const tagSlugRegex = /[a-zA-Z0-9_\-]+/g;

const updateSchema = z.object({
  serviceName: z.string().min(1).optional(),
  serviceSlug: z.string().min(1).optional(),
  loginOrEmail: z.string().nullable().optional(),
  loginUrl: z.string().url().nullable().optional(),
  vaultItemId: z.string().nullable().optional(),
  passwordPlaintext: z.string().nullable().optional(),
  totpSecretPlaintext: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
  tagSlugs: z.union([z.array(z.string()), z.string()]).nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;
  if (!UUID_REGEX.test(accountId)) {
    return NextResponse.json(
      { error: "PATCH only supports DB-backed linked service IDs." },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { tagSlugs, ...updates } = parsed.data;

  if (Object.keys(updates).length > 0) {
    const row = await updateLinkedServiceAccount(accountId, updates);
    if (!row) {
      return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
    }
  }

  if (tagSlugs !== undefined && tagSlugs !== null) {
    const slugs = Array.isArray(tagSlugs)
      ? tagSlugs
      : Array.from(tagSlugs.match(tagSlugRegex) ?? []);
    await setTagsForLinkedService(accountId, slugs);
  }

  const detail = await getLinkedServiceDetailById(accountId);
  if (!detail) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }
  return NextResponse.json({ data: detail });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;
  if (!UUID_REGEX.test(accountId)) {
    return NextResponse.json(
      { error: "DELETE only supports DB-backed linked service IDs." },
      { status: 400 },
    );
  }
  const ok = await deleteLinkedServiceAccount(accountId);
  if (!ok) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }
  return NextResponse.json({ data: { ok: true } });
}

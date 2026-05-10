import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createLinkedServiceAccount,
  getRootAccountDetail,
  setTagsForLinkedService,
} from "@/lib/account-manager/repository";

const tagSlugRegex = /[a-zA-Z0-9_\-]+/g;

const createSchema = z.object({
  serviceName: z.string().min(1),
  serviceSlug: z.string().min(1),
  loginOrEmail: z.string().nullable().optional(),
  loginUrl: z.string().url().nullable().optional(),
  vaultItemId: z.string().nullable().optional(),
  passwordPlaintext: z.string().nullable().optional(),
  totpSecretPlaintext: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tagSlugs: z.union([z.array(z.string()), z.string()]).nullable().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ rootAccountId: string }> },
) {
  const { rootAccountId } = await context.params;

  const root = await getRootAccountDetail(rootAccountId);
  if (!root) {
    return NextResponse.json({ error: "Root account not found." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const tagSlugs = (() => {
    const tags = parsed.data.tagSlugs;
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return Array.from(tags.match(tagSlugRegex) ?? []);
  })();

  const row = await createLinkedServiceAccount({
    rootAccountId,
    serviceName: parsed.data.serviceName,
    serviceSlug: parsed.data.serviceSlug,
    loginOrEmail: parsed.data.loginOrEmail,
    loginUrl: parsed.data.loginUrl,
    vaultItemId: parsed.data.vaultItemId,
    passwordPlaintext: parsed.data.passwordPlaintext,
    totpSecretPlaintext: parsed.data.totpSecretPlaintext,
    notes: parsed.data.notes,
    tagSlugs,
  });

  if (tagSlugs.length > 0) {
    await setTagsForLinkedService(row.id, tagSlugs);
  }

  return NextResponse.json({ data: row }, { status: 201 });
}

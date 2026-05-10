import { NextResponse } from "next/server";
import { z } from "zod";

import { isUuid } from "@/lib/account-manager/ids";
import {
  getLinkedServiceDetailById,
  upsertInstructionDocument,
} from "@/lib/account-manager/repository";
import type { InstructionDocumentContent } from "@/lib/db/catalog";

const contentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(z.unknown()).min(1),
});

const schema = z.object({
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  content: contentSchema.passthrough(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;

  if (!isUuid(accountId)) {
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

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const detail = await getLinkedServiceDetailById(accountId);
  if (!detail) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }

  const row = await upsertInstructionDocument({
    linkedServiceAccountId: accountId,
    title: parsed.data.title,
    summary: parsed.data.summary ?? null,
    contentJson: parsed.data.content as InstructionDocumentContent,
  });

  return NextResponse.json({ data: row });
}

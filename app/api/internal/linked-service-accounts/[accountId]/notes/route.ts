import { NextResponse } from "next/server";
import { z } from "zod";

import { isUuid } from "@/lib/account-manager/ids";
import { updateLinkedServiceNotes } from "@/lib/account-manager/repository";

const schema = z.object({
  notes: z.string().nullable(),
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

  const row = await updateLinkedServiceNotes(accountId, parsed.data.notes);
  if (!row) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }
  return NextResponse.json({ data: row });
}

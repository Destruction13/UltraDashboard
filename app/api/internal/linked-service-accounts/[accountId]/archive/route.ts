import { NextResponse } from "next/server";

import { isUuid } from "@/lib/account-manager/ids";
import { archiveLinkedServiceAccount } from "@/lib/account-manager/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;

  if (!isUuid(accountId)) {
    return NextResponse.json(
      { error: "POST only supports DB-backed linked service IDs." },
      { status: 400 },
    );
  }

  const row = await archiveLinkedServiceAccount(accountId);
  if (!row) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }
  return NextResponse.json({ data: row });
}

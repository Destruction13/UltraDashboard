import { NextResponse } from "next/server";

import { archiveLinkedServiceAccount } from "@/lib/account-manager/repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;
  const row = await archiveLinkedServiceAccount(accountId);
  if (!row) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }
  return NextResponse.json({ data: row });
}

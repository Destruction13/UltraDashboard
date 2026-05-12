import { NextResponse } from "next/server";

import { getVaultwardenLinkedServiceDetail } from "@/lib/account-manager/vaultwarden-bridge";

export async function GET(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;
  const detail = await getVaultwardenLinkedServiceDetail(accountId, accountId);

  if (!detail) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      accountId: detail.id,
      currentTotp: detail.currentTotp,
      source: "vaultwarden-bw-serve",
    },
  });
}

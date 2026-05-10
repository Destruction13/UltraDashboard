import { NextResponse } from "next/server";

import { SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID } from "@/lib/account-manager/families";
import { getVaultwardenLinkedServiceDetail } from "@/lib/account-manager/vaultwarden-bridge";

export async function GET(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;
  const detail = await getVaultwardenLinkedServiceDetail(
    SYNTHETIC_VAULTWARDEN_ROOT_ACCOUNT_ID,
    accountId,
  );

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

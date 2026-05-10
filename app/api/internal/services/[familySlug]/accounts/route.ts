import { NextResponse } from "next/server";

import { isFamilySlug } from "@/lib/account-manager/families";
import { getVaultwardenRootAccountSummary } from "@/lib/account-manager/vaultwarden-bridge";

export async function GET(
  _request: Request,
  context: { params: Promise<{ familySlug: string }> },
) {
  const { familySlug } = await context.params;
  if (!isFamilySlug(familySlug)) {
    return NextResponse.json({ error: "Unknown family slug." }, { status: 404 });
  }

  const summary = await getVaultwardenRootAccountSummary();
  return NextResponse.json({
    data: [
      {
        familySlug,
        id: summary.id,
        displayName: summary.displayName,
        description: summary.description,
        status: summary.status,
        itemCount: summary.itemCount,
        hasFixture: summary.hasFixture,
      },
    ],
  });
}

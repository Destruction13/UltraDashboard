import { NextResponse } from "next/server";

import { isFamilySlug } from "@/lib/account-manager/families";
import { listVaultwardenRootAccounts } from "@/lib/account-manager/vaultwarden-bridge";

export async function GET(
  _request: Request,
  context: { params: Promise<{ familySlug: string }> },
) {
  const { familySlug } = await context.params;
  if (!isFamilySlug(familySlug)) {
    return NextResponse.json({ error: "Unknown family slug." }, { status: 404 });
  }

  const summaries = await listVaultwardenRootAccounts(familySlug);
  return NextResponse.json({
    data: summaries.map((summary) => ({
      familySlug,
      id: summary.id,
      displayName: summary.displayName,
      description: summary.description,
      status: summary.status,
      itemCount: summary.itemCount,
      hasFixture: summary.hasFixture,
      primaryEmail: summary.primaryEmail,
      username: summary.username,
    })),
  });
}

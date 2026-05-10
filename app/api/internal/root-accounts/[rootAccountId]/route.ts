import { NextResponse } from "next/server";

import { isFamilySlug, type FamilySlug } from "@/lib/account-manager/families";
import { getVaultwardenRootAccountDetail } from "@/lib/account-manager/vaultwarden-bridge";

export async function GET(
  request: Request,
  context: { params: Promise<{ rootAccountId: string }> },
) {
  const { rootAccountId } = await context.params;
  const url = new URL(request.url);
  const familyParam = url.searchParams.get("family");
  const family = isFamilySlug(familyParam ?? "") ? (familyParam as FamilySlug) : "github";

  const detail = await getVaultwardenRootAccountDetail(family, rootAccountId);
  if (!detail) {
    return NextResponse.json({ error: "Root account not found." }, { status: 404 });
  }

  return NextResponse.json({ data: detail });
}

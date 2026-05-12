import { NextResponse } from "next/server";

import { FAMILY_SLUGS, isFamilySlug, type FamilySlug } from "@/lib/account-manager/families";
import { getVaultwardenRootAccountDetail } from "@/lib/account-manager/vaultwarden-bridge";

export async function GET(
  request: Request,
  context: { params: Promise<{ rootAccountId: string }> },
) {
  const { rootAccountId } = await context.params;
  const url = new URL(request.url);
  const familyParam = url.searchParams.get("family");
  const family = isFamilySlug(familyParam ?? "") ? (familyParam as FamilySlug) : null;

  if (family) {
    const detail = await getVaultwardenRootAccountDetail(family, rootAccountId);
    if (!detail) {
      return NextResponse.json({ error: "Root account not found." }, { status: 404 });
    }

    return NextResponse.json({ data: detail });
  }

  for (const candidateFamily of FAMILY_SLUGS) {
    const detail = await getVaultwardenRootAccountDetail(candidateFamily, rootAccountId);
    if (detail) {
      return NextResponse.json({ data: detail });
    }
  }

  return NextResponse.json({ error: "Root account not found." }, { status: 404 });
}

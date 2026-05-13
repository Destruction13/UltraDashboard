import { NextResponse } from "next/server";

import { isFamilySlug } from "@/lib/account-manager/families";
import { searchAccounts } from "@/lib/account-manager/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");
  const q = url.searchParams.get("q");
  const familyParam = url.searchParams.get("family");
  const familySlug = familyParam && isFamilySlug(familyParam) ? familyParam : undefined;

  const results = await searchAccounts({
    tagSlug: tag ?? undefined,
    q: q ?? undefined,
    familySlug,
  });

  return NextResponse.json({ data: results });
}

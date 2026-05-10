import { NextResponse } from "next/server";

import { FAMILY_SEEDS } from "@/lib/db/catalog";

export async function GET() {
  return NextResponse.json({
    data: FAMILY_SEEDS.map((family) => ({
      slug: family.slug,
      name: family.name,
      description: family.description,
    })),
  });
}

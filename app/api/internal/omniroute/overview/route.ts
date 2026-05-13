import { NextResponse } from "next/server";

import { getOverview } from "@/lib/omniroute/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const overview = getOverview();
  return NextResponse.json(overview, {
    status: overview.available ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { listRoutes } from "@/lib/omniroute/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { items, total } = listRoutes(parsed.data);
  return NextResponse.json(
    {
      data: items,
      total,
      limit: parsed.data.limit ?? 50,
      offset: parsed.data.offset ?? 0,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

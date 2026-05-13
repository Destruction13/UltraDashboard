import { NextResponse } from "next/server";
import { z } from "zod";

import { listProviders } from "@/lib/omniroute/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const healthSchema = z.enum(["active", "degraded", "rate_limited", "error", "unknown"]);

const querySchema = z.object({
  provider: z.string().min(1).optional(),
  health: healthSchema.optional(),
  isActive: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
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
  const { items, total } = listProviders(parsed.data);
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

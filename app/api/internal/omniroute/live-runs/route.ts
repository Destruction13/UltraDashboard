import { NextResponse } from "next/server";
import { z } from "zod";

import { listLiveRuns } from "@/lib/omniroute/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusSchema = z.union([
  z.literal("2xx"),
  z.literal("4xx"),
  z.literal("5xx"),
  z.coerce.number().int().min(100).max(599),
]);

const querySchema = z.object({
  provider: z.string().min(1).optional(),
  since: z.string().datetime({ offset: true }).optional(),
  status: statusSchema.optional(),
  pathContains: z.string().min(1).optional(),
  q: z.string().min(1).optional(),
  errorsOnly: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true")
    .optional(),
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

  const { status, ...rest } = parsed.data;
  const { items, total } = listLiveRuns({
    ...rest,
    statusFilter: status,
  });

  return NextResponse.json(
    {
      data: items,
      total,
      limit: parsed.data.limit ?? 25,
      offset: parsed.data.offset ?? 0,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

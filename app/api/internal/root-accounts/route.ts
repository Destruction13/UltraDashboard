import { NextResponse } from "next/server";
import { z } from "zod";

import { FAMILY_SLUGS } from "@/lib/account-manager/families";
import { createRootAccount } from "@/lib/account-manager/repository";

const createSchema = z.object({
  familySlug: z.enum(FAMILY_SLUGS),
  displayName: z.string().min(1),
  primaryEmail: z.string().email().nullable().optional(),
  username: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const row = await createRootAccount(parsed.data);
  return NextResponse.json({ data: row }, { status: 201 });
}

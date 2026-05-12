import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createVaultwardenRootAccountWithService } from "@/lib/account-manager/vaultwarden-bridge";
import { createRootAccountRequestSchema } from "@/lib/account-manager/vaultwarden-route-schemas";

export async function POST(request: Request) {
  try {
    const payload = createRootAccountRequestSchema.parse(await request.json());
    const created = await createVaultwardenRootAccountWithService(
      payload.root,
      payload.linkedService,
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid root account payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create root account." },
      { status: 500 },
    );
  }
}

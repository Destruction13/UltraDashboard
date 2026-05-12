import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createVaultwardenLinkedService } from "@/lib/account-manager/vaultwarden-bridge";
import { createLinkedServiceRequestSchema } from "@/lib/account-manager/vaultwarden-route-schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ rootAccountId: string }> },
) {
  try {
    const { rootAccountId } = await context.params;
    const payload = createLinkedServiceRequestSchema.parse(await request.json());
    const created = await createVaultwardenLinkedService(
      payload.family,
      rootAccountId,
      payload.linkedService,
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid linked service payload." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create linked service." },
      { status: 500 },
    );
  }
}

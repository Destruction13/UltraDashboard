import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  deleteVaultwardenLinkedService,
  getVaultwardenLinkedServiceDetail,
  updateVaultwardenLinkedService,
} from "@/lib/account-manager/vaultwarden-bridge";
import { patchLinkedServiceRequestSchema } from "@/lib/account-manager/vaultwarden-route-schemas";

export async function GET(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;
  const detail = await getVaultwardenLinkedServiceDetail(accountId, accountId);

  if (!detail) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }

  return NextResponse.json({ data: detail });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  try {
    const { accountId } = await context.params;
    const payload = patchLinkedServiceRequestSchema.parse(await request.json());
    const updated = await updateVaultwardenLinkedService(accountId, payload);

    if (!updated) {
      return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid linked service patch." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update linked service." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ accountId: string }> },
) {
  const { accountId } = await context.params;
  const deleted = await deleteVaultwardenLinkedService(accountId);

  if (!deleted) {
    return NextResponse.json({ error: "Linked service account not found." }, { status: 404 });
  }

  return NextResponse.json({ data: { deleted: true } });
}

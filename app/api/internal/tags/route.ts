import { NextResponse } from "next/server";

import { listTags } from "@/lib/account-manager/repository";

export async function GET() {
  const tags = await listTags();
  return NextResponse.json({ data: tags });
}

import { NextRequest, NextResponse } from "next/server";
import { diagnoseUser } from "@/lib/db";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  return NextResponse.json(diagnoseUser(userId));
}

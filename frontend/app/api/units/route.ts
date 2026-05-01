import { NextRequest, NextResponse } from "next/server";
import { listUnits } from "@/lib/db";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const grade = parseInt(searchParams.get("grade") || "3", 10);
  const subject = searchParams.get("subject") || "수학";
  const data = listUnits(grade, subject);
  return NextResponse.json(data);
}

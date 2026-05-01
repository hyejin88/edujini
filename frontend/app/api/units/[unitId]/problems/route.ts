import { NextRequest, NextResponse } from "next/server";
import { listProblemsByUnit } from "@/lib/db";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const { unitId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const includeAnswers = searchParams.get("include_answers") === "true";

  const items = listProblemsByUnit(unitId, limit).map((p) => {
    const base: any = {
      id: p.id,
      subject: p.subject,
      grade: p.grade,
      unit_id: p.unit_id,
      unit_name: p.unit_name,
      publisher: p.publisher,
      type: p.type,
      difficulty: p.difficulty,
      body: p.body,
      choices: p.choices,
      concept_tags: p.concept_tags || [],
    };
    if (includeAnswers) {
      base.answer = p.answer;
      base.explanation = p.explanation;
    }
    return base;
  });
  return NextResponse.json(items);
}

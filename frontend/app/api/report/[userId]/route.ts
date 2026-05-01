import { NextRequest, NextResponse } from "next/server";
import { diagnoseUser } from "@/lib/db";
import {
  callGemini,
  PARENT_REPORT_SYSTEM,
  safeParseJson,
} from "@/lib/gemini";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const childName = searchParams.get("child_name") || "OO";

  const diag = diagnoseUser(userId);
  let report: any = null;
  let source: "gemini" | "template" = "template";

  try {
    const resp = await callGemini(
      `자녀 별명: ${childName}\n진단 요약: ${JSON.stringify(diag)}\n\n위 데이터로 학부모용 주간 리포트를 작성해줘. JSON 출력.`,
      {
        systemInstruction: PARENT_REPORT_SYSTEM,
        temperature: 0.6,
        responseMimeType: "application/json",
      }
    );
    const parsed = safeParseJson<any>(resp);
    if (parsed && parsed.subject) {
      report = parsed;
      source = "gemini";
    }
  } catch {
    /* fall through to template */
  }

  if (!report) {
    const top = diag.weak_units?.[0];
    const weakText = top ? `${top.unit_name} 단원` : "전 단원 고르게 풀이";
    const nextAction = top
      ? `이번 주 ${top.unit_name} 단원만 5문항 더 풀어보기`
      : "현재 수준 유지하며 새로운 단원 도전";
    report = {
      subject: `이번 주 ${childName}이의 학습 리포트`,
      summary: `이번 진단에서 총 ${diag.total}문항 중 ${diag.correct}문항을 맞혀 ${diag.score_pct}점이에요.`,
      highlights: [
        `${childName}이는 진단을 끝까지 완주했어요.`,
        "풀이 시간에 집중이 잘 됐어요.",
      ],
      concerns: [`${weakText}에서 정답률이 낮아요. 개념 복습이 도움될 거예요.`],
      next_action: nextAction,
    };
  }

  return NextResponse.json({ diagnosis: diag, report, source });
}

import { NextRequest, NextResponse } from "next/server";
import {
  getProblem,
  isCorrect,
  heuristicErrorLabel,
  recordAttempt,
} from "@/lib/db";

export const runtime = "edge";

// 채점은 정적 정답·오답 매칭 (Gemini 호출 0).
// 4축 오답 라벨은 seed.json `common_errors` wrong_answer 매칭 → fallback "계산실수".
// 학부모 리포트(/api/report)에서만 Gemini 사용.

interface BatchAnswer {
  problem_id: string;
  user_answer: string;
}

interface BatchGradeRequest {
  user_id: string;
  answers: BatchAnswer[];
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as BatchGradeRequest;
  if (!payload?.user_id || !Array.isArray(payload.answers)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const results: any[] = [];
  let correctCount = 0;
  const errorCounts: Record<string, number> = {};

  for (const ans of payload.answers) {
    const p = getProblem(ans.problem_id);
    if (!p) continue;

    const ok = isCorrect(p, ans.user_answer);
    if (ok) correctCount += 1;

    let errorLabel: string | null = null;
    if (!ok) {
      errorLabel = heuristicErrorLabel(p, ans.user_answer);
      errorCounts[errorLabel] = (errorCounts[errorLabel] || 0) + 1;
    }

    recordAttempt({
      user_id: payload.user_id,
      problem_id: ans.problem_id,
      user_answer: ans.user_answer,
      is_correct: ok,
      error_label: errorLabel,
    });

    results.push({
      problem_id: ans.problem_id,
      correct: ok,
      correct_answer: p.answer,
      explanation: p.explanation,
      error_label: errorLabel,
    });
  }

  const total = results.length;
  return NextResponse.json({
    total,
    correct: correctCount,
    score_pct: total ? Math.round((correctCount / total) * 100) : 0,
    error_breakdown: errorCounts,
    results,
  });
}

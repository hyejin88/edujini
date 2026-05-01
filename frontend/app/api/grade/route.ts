import { NextRequest, NextResponse } from "next/server";
import {
  getProblem,
  isCorrect,
  heuristicErrorLabel,
  recordAttempt,
} from "@/lib/db";
import { callGemini, LABEL_SYSTEM, safeParseJson } from "@/lib/gemini";

export const runtime = "edge";

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
      try {
        const labelResp = await callGemini(
          [
            `문제: ${p.body}`,
            `정답: ${p.answer}`,
            `풀이: ${p.explanation}`,
            `학생 답: ${ans.user_answer}`,
            `이전 라벨 (있으면): `,
          ].join("\n"),
          {
            systemInstruction: LABEL_SYSTEM,
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        );
        const parsed = safeParseJson<{ label?: string }>(labelResp);
        errorLabel = parsed?.label || null;
      } catch {
        errorLabel = null;
      }
      if (!errorLabel) errorLabel = heuristicErrorLabel(p, ans.user_answer);
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

import { NextRequest, NextResponse } from "next/server";
import { diagnoseUser } from "@/lib/db";
import {
  callGemini,
  PARENT_REPORT_SYSTEM,
  safeParseJson,
} from "@/lib/gemini";
import type {
  ParentReport,
  ParentReportEnvelope,
  ParentReportRequest,
} from "@/lib/types";

export const runtime = "edge";

// Edge Runtime: Web Crypto 로 안정적인 해시 계산 (변경 감지용).
async function sha256Short(input: string): Promise<string> {
  try {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback: 문자열 길이 기반 약식 키
    return `len-${input.length}`;
  }
}

function buildTemplate(diag: any, childName: string): ParentReport {
  const top = diag.weak_units?.[0];
  const weakText = top ? `${top.unit_name} 단원` : "전 단원 고르게 풀이";
  const nextAction = top
    ? `이번 주 ${top.unit_name} 단원만 5문항 더 풀어보기`
    : "현재 수준 유지하며 새로운 단원 도전";
  return {
    subject: `이번 주 ${childName}이의 학습 리포트`,
    summary: `이번 진단에서 총 ${diag.total ?? 0}문항 중 ${diag.correct ?? 0}문항을 맞혀 ${diag.score_pct ?? 0}점이에요.`,
    highlights: [
      `${childName}이는 진단을 끝까지 완주했어요.`,
      "풀이 시간에 집중이 잘 됐어요.",
    ],
    concerns: [
      `${weakText}에서 정답률이 낮아요. 개념 복습이 도움될 거예요.`,
    ],
    axis_insight: undefined,
    next_action: nextAction,
    teacher_note: undefined,
  };
}

async function generateReport(
  diag: any,
  childName: string
): Promise<{ report: ParentReport; source: "gemini" | "template" }> {
  // GEMINI_API_KEY 미설정 시 즉시 fallback
  if (!process.env.GEMINI_API_KEY) {
    return { report: buildTemplate(diag, childName), source: "template" };
  }
  try {
    const resp = await callGemini(
      `자녀 별명: ${childName}\n진단 요약: ${JSON.stringify(diag)}\n\n위 데이터로 학부모용 주간 리포트를 작성해줘. JSON 출력.`,
      {
        systemInstruction: PARENT_REPORT_SYSTEM,
        temperature: 0.6,
        responseMimeType: "application/json",
      }
    );
    const parsed = safeParseJson<Partial<ParentReport>>(resp);
    if (parsed && parsed.subject && parsed.summary && parsed.next_action) {
      return {
        report: {
          subject: parsed.subject,
          summary: parsed.summary,
          highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
          concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
          axis_insight: parsed.axis_insight,
          next_action: parsed.next_action,
          teacher_note: parsed.teacher_note,
        },
        source: "gemini",
      };
    }
  } catch {
    /* fall through */
  }
  return { report: buildTemplate(diag, childName), source: "template" };
}

// V1 호환 — 서버 in-memory 진단을 그대로 사용 (PoC 용).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(req.url);
  const childName = searchParams.get("child_name") || "OO";

  const diag = diagnoseUser(userId);
  const { report, source } = await generateReport(diag, childName);
  const diagnosis_hash = await sha256Short(JSON.stringify(diag));

  // 기존 응답 호환: diagnosis 필드도 그대로 포함
  return NextResponse.json({
    diagnosis: diag,
    report,
    source,
    diagnosis_hash,
  });
}

// V2 — 클라이언트 localStorage 진단을 body 로 전달받아 Gemini 호출.
// 결과 페이지에서 이 엔드포인트를 사용.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  await params; // userId 는 현재 in-memory 가 비어있어 사용하지 않지만, 향후 audit log 용으로 보존.

  let body: ParentReportRequest;
  try {
    body = (await req.json()) as ParentReportRequest;
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const childName = body.child_name || "OO";
  const diag = body.diagnosis;

  if (!diag || typeof diag.total !== "number") {
    return NextResponse.json(
      { error: "diagnosis payload missing" },
      { status: 400 }
    );
  }

  // Gemini 가 학부모 언어로 풀어 쓸 수 있게 4축 % 도 같이 넘김
  const totalErrors = Object.values(diag.error_breakdown || {}).reduce(
    (a, b) => a + (b || 0),
    0
  );
  const axis_pct: Record<string, number> = {};
  if (totalErrors > 0) {
    for (const [k, v] of Object.entries(diag.error_breakdown || {})) {
      axis_pct[k] = Math.round(((v || 0) / totalErrors) * 100);
    }
  }
  const compactDiag = { ...diag, axis_pct };

  const { report, source } = await generateReport(compactDiag, childName);
  const diagnosis_hash = await sha256Short(JSON.stringify(compactDiag));

  const envelope: ParentReportEnvelope = {
    report,
    source,
    diagnosis_hash,
  };
  return NextResponse.json(envelope);
}

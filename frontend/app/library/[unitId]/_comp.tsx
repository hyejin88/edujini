"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { saveAttempts } from "@/lib/diagnose";
import { track } from "@vercel/analytics";
import {
  fetchUnitProblems,
  gradeBatch,
  makeUserId,
  recordPlayedUnit,
  type ProblemDTO,
  type UnitDTO,
} from "@/lib/client";
import { FigureRenderer, type Figure } from "@/components/Figures";

type Problem = ProblemDTO & {
  answer?: string;
  explanation?: string;
  error_type?: string;
  figure?: Figure;
};

function gradeLabel(g: number): string {
  if (g <= 6) return `초${g}`;
  if (g <= 9) return `중${g - 6}`;
  return `고${g - 9}`;
}

function gradeFromUnitId(unitId: string): number {
  const m = unitId.match(/^[a-z]+-(\d+)/i);
  return m ? parseInt(m[1], 10) : 3;
}

function MathText({ text, inline = false }: { text: string; inline?: boolean }) {
  const parts: { type: "text" | "inline" | "block"; content: string }[] = [];
  let remaining = text || "";

  while (remaining.length > 0) {
    const blockMatch = remaining.match(/^\$\$([\s\S]*?)\$\$/);
    if (blockMatch) {
      parts.push({ type: "block", content: blockMatch[1] });
      remaining = remaining.slice(blockMatch[0].length);
      continue;
    }
    const inlineMatch = remaining.match(/^\$([\s\S]*?)\$/);
    if (inlineMatch) {
      parts.push({ type: "inline", content: inlineMatch[1] });
      remaining = remaining.slice(inlineMatch[0].length);
      continue;
    }
    const nextBlock = remaining.indexOf("$$");
    const nextInline = remaining.indexOf("$");
    let nextMath = -1;
    if (nextBlock !== -1 && nextInline !== -1) {
      nextMath = Math.min(nextBlock, nextInline);
    } else if (nextBlock !== -1) {
      nextMath = nextBlock;
    } else if (nextInline !== -1) {
      nextMath = nextInline;
    }
    if (nextMath === -1) {
      parts.push({ type: "text", content: remaining });
      break;
    } else {
      if (nextMath > 0) {
        parts.push({ type: "text", content: remaining.slice(0, nextMath) });
      }
      remaining = remaining.slice(nextMath);
    }
  }

  return (
    <span className="[&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2">
      {parts.map((part, i) => {
        if (part.type === "block") {
          return inline ? (
            <InlineMath key={i} math={part.content} />
          ) : (
            <BlockMath key={i} math={part.content} />
          );
        } else if (part.type === "inline") {
          return <InlineMath key={i} math={part.content} />;
        }
        let cleaned = part.content.replace(/\s*\(그림:[^)]*\)\s*/g, "");
        cleaned = cleaned.replace(/\s+\*\s+/g, "\n· ").replace(/\s+-\s+/g, "\n· ");
        cleaned = cleaned.replace(/^\*\s+/gm, "· ").replace(/^-\s+/gm, "· ");
        return (
          <span key={i} style={{ whiteSpace: "pre-line" }}>
            {cleaned}
          </span>
        );
      })}
    </span>
  );
}

function measureProblem(problem: Problem): "compact" | "regular" | "long" {
  let score = 0;
  if (problem.body.length > 80) score += 2;
  else if (problem.body.length > 40) score += 1;
  if (problem.choices) {
    if (problem.choices.length >= 5) score += 2;
    else if (problem.choices.length === 4) score += 1;
    const maxChoiceLen = Math.max(...problem.choices.map((c) => c.length));
    if (maxChoiceLen > 30) score += 1;
  }
  if (problem.body.includes("$$")) score += 2;
  if (problem.body.includes("(그림:")) score += 2;
  if (score >= 4) return "long";
  if (score >= 2) return "regular";
  return "compact";
}

export default function ComprehensiveSheet({
  unitId,
  unit,
}: {
  unitId: string;
  unit: UnitDTO | null;
}) {
  const router = useRouter();
  const [unitProblems, setUnitProblems] = useState<Problem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  // 풀이 시작 시각 — 문제 로드 완료 시점
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    fetchUnitProblems(unitId, 20, true)
      .then((problems) => {
        setUnitProblems(problems as Problem[]);
        setIsLoading(false);
        recordPlayedUnit(unitId);
        setStartTime(Date.now());
      })
      .catch(() => setIsLoading(false));
  }, [unitId]);

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k]?.trim()
  ).length;
  const correctCount = Object.values(results).filter(Boolean).length;
  const score = unitProblems.length > 0
    ? Math.round((correctCount / unitProblems.length) * 100)
    : 0;

  const handleAnswerChange = useCallback((problemId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [problemId]: value }));
  }, []);

  const handleGrade = async () => {
    const userId = makeUserId();
    const list = Object.entries(answers)
      .filter(([, v]) => v && String(v).trim())
      .map(([problem_id, user_answer]) => ({ problem_id, user_answer }));
    const r = await gradeBatch(userId, list);
    const map: Record<string, boolean> = {};
    for (const it of r.results) map[it.problem_id] = it.correct;
    setResults(map);
    setIsGraded(true);
    const elapsed = startTime > 0 ? Date.now() - startTime : 0;
    setElapsedMs(elapsed);
    // 진단용 attempts 로컬 저장 (PoC: 클라이언트 사이드 진단)
    const now = new Date().toISOString();
    const attemptsToSave = r.results.map((res) => {
      const p = unitProblems.find((up) => up.id === res.problem_id);
      return {
        problem_id: res.problem_id,
        unit_id: p?.unit_id || unitId,
        unit_name: p?.unit_name || (unit?.unit_name ?? ""),
        subject: p?.subject || (unit?.subject ?? "수학"),
        user_answer: answers[res.problem_id] || "",
        is_correct: res.correct,
        error_label: res.error_label || null,
        correct_answer: res.correct_answer,
        created_at: now,
        source: "comp" as const,
        elapsed_ms: elapsed,
      };
    });
    saveAttempts(attemptsToSave);
    track("comp_graded", {
      unit_id: unitId,
      score,
      total: unitProblems.length,
      correct: correctCount,
      elapsed_sec: Math.round(elapsed / 1000),
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-[#6b7280]">문항 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] print:bg-white">
      <header className="no-print sticky top-0 z-10 border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex max-w-[210mm] flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:py-3">
          <Link
            href={`/library?grade=${unit?.grade ?? 3}&subject=${encodeURIComponent(unit?.subject ?? "수학")}&mode=comp`}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[#6b7280] hover:text-[#111827]"
          >
            <ArrowLeft className="h-4 w-4" />
            단원 목록
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex min-h-[40px] items-center gap-1 rounded border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#111827] hover:bg-[#f9fafb]"
            >
              <Printer className="h-3.5 w-3.5" />
              인쇄/PDF
            </button>
            {!isGraded ? (
              <button
                onClick={handleGrade}
                disabled={answeredCount === 0}
                className="min-h-[40px] flex-1 rounded bg-[#111827] px-3 py-1.5 text-sm text-white hover:bg-[#1f2937] disabled:opacity-50 sm:flex-none"
              >
                일괄 채점{" "}
                <span className="rounded bg-white/20 px-1.5 text-xs">
                  {answeredCount}/{unitProblems.length}
                </span>
              </button>
            ) : (
              <button
                onClick={() => router.push("/result")}
                className="min-h-[40px] flex-1 rounded bg-[#1e3a8a] px-3 py-1.5 text-sm text-white hover:bg-[#1e40af] sm:flex-none"
              >
                {score}점 · 학습 진단 →
              </button>
            )}
          </div>
        </div>
      </header>

      <main
        className="worksheet-page mx-auto my-8 max-w-[210mm] bg-white shadow-lg print:my-0 print:max-w-none print:p-0 print:shadow-none"
        style={{ padding: "16mm" }}
      >
        <div className="mb-6 print:mb-3">
          {/* 헤더 — 좌: 캐릭터, 가운데: 제목, 우: 균형 더미 (1줄) */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/character.png"
              alt="EDU Jini"
              className="h-12 w-12 print:h-10 print:w-10"
            />
            <h1 className="text-center font-serif text-xl font-bold text-[#111827]">
              {unit ? `${gradeLabel(unit.grade)} ${unit.subject}` : `${gradeLabel(gradeFromUnitId(unitId))} 수학`}{" "}
              · {unit?.unit_name || ""}
            </h1>
            <div className="h-12 w-12 print:h-10 print:w-10" aria-hidden="true" />
          </div>
          <div className="mt-2 mb-4 border-t border-[#111827]" />
          {/* 이름·날짜 — 인쇄 전용, 제목 아래 우측 정렬 */}
          <div className="mb-3 hidden justify-end gap-6 text-xs text-[#374151] print:flex">
            <span>이름 ____________</span>
            <span>날짜 ___ / ___</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 print:grid-cols-2">
          {unitProblems.map((problem, index) => (
            <ProblemCell
              key={problem.id}
              problem={problem}
              index={index + 1}
              answer={answers[problem.id] || ""}
              onAnswerChange={handleAnswerChange}
              isGraded={isGraded}
              isCorrect={results[problem.id]}
              layout={measureProblem(problem)}
            />
          ))}
        </div>

        {/* 답안지 - 인쇄 전용 */}
        <div className="answer-key hidden print:block" style={{ pageBreakBefore: "always" }}>
          <div className="mb-2 border-t-2 border-[#111827]" />
          <div className="mb-4 border-t border-[#111827]" />
          <h2 className="mb-4 text-center font-serif text-lg font-bold text-[#111827]">
            정답 및 해설
          </h2>
          <div className="mb-2 border-t border-[#111827]" />
          <div className="mb-6 border-t-2 border-[#111827]" />
          <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {unitProblems.map((problem, index) => (
              <div key={problem.id} className="flex gap-2">
                <span className="font-serif font-bold">{index + 1}.</span>
                <span>{problem.answer}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4 text-sm">
            {unitProblems.map((problem, index) => (
              <div key={problem.id} className="break-inside-avoid">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold">{index + 1}.</span>
                  <span className="font-medium text-[#1e3a8a]">
                    정답: {problem.answer}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line pl-5 text-xs leading-relaxed text-[#374151]">
                  {problem.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProblemCell({
  problem,
  index,
  answer,
  onAnswerChange,
  isGraded,
  isCorrect,
  layout,
}: {
  problem: Problem;
  index: number;
  answer: string;
  onAnswerChange: (id: string, value: string) => void;
  isGraded: boolean;
  isCorrect?: boolean;
  layout: "compact" | "regular" | "long";
}) {
  const choiceLabels = ["①", "②", "③", "④", "⑤"];
  const spanClass = layout === "long" ? "md:col-span-2 print:col-span-2" : "";

  return (
    <div
      className={`worksheet-problem break-inside-avoid ${spanClass}`}
      style={{ wordBreak: "keep-all" }}
    >
      <div className="flex">
        <div
          className="w-8 flex-shrink-0 font-serif font-bold text-[#111827]"
          style={{ fontSize: "22px", lineHeight: "1.8" }}
        >
          {index}.
        </div>
        <div className="flex-1 pl-1">
          <div
            className="text-[#111827]"
            style={{ fontSize: "16px", lineHeight: "1.8" }}
          >
            <MathText text={problem.body} />
          </div>
          {problem.figure && (
            <div className="mt-1">
              <FigureRenderer figure={problem.figure} />
            </div>
          )}

          {problem.type === "multiple_choice" && problem.choices ? (
            <div className="mt-2 space-y-1">
              {problem.choices.map((choice, i) => {
                const isSelected = answer === choice;
                const isCorrectChoice = choice === problem.answer;
                const isWrongSelection = isGraded && isSelected && !isCorrectChoice;
                const bgClass = isGraded
                  ? isCorrectChoice
                    ? "bg-green-50"
                    : isWrongSelection
                      ? "bg-rose-50"
                      : ""
                  : isSelected
                    ? "bg-gray-100"
                    : "hover:bg-gray-50";
                const textClass = isGraded
                  ? isCorrectChoice
                    ? "text-[#15803d] font-semibold"
                    : isWrongSelection
                      ? "text-[#b91c1c]"
                      : "text-[#111827]"
                  : isSelected
                    ? "text-[#111827] font-semibold"
                    : "text-[#111827]";

                return (
                  <label
                    key={i}
                    onClick={() => !isGraded && onAnswerChange(problem.id, choice)}
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 leading-tight transition print:bg-transparent print:p-0 ${bgClass} ${textClass}`}
                    style={{ pointerEvents: isGraded ? "none" : "auto" }}
                  >
                    <input
                      type="radio"
                      name={problem.id}
                      value={choice}
                      checked={isSelected}
                      onChange={() => onAnswerChange(problem.id, choice)}
                      disabled={isGraded}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <span
                      aria-hidden="true"
                      className="shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full border print:border-[#111827]"
                      style={{
                        borderColor: isSelected ? "#111827" : "#9ca3af",
                        borderWidth: isSelected ? 1.5 : 1,
                      }}
                    >
                      {isSelected && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: isGraded
                              ? isCorrectChoice
                                ? "#15803d"
                                : "#b91c1c"
                              : "#111827",
                          }}
                        />
                      )}
                    </span>
                    <span className="font-serif shrink-0" style={{ fontSize: "16px" }}>
                      {choiceLabels[i]}
                    </span>
                    <span
                      className="[&_.katex]:pointer-events-none"
                      style={{
                        fontSize: "15px",
                        lineHeight: 1.5,
                        textDecoration: isWrongSelection ? "line-through" : "none",
                      }}
                    >
                      <MathText text={choice} inline />
                    </span>
                    {isGraded && isCorrectChoice && (
                      <span className="ml-auto text-[#15803d]">✓</span>
                    )}
                    {isWrongSelection && (
                      <span className="ml-auto text-[#b91c1c]">✗</span>
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[#111827]" style={{ fontSize: "16px" }}>
                정답:
              </span>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9./:\-, ]*"
                value={answer}
                onChange={(e) => onAnswerChange(problem.id, e.target.value)}
                disabled={isGraded}
                className={`bg-transparent px-1 py-0.5 font-serif outline-none ${
                  isGraded
                    ? isCorrect
                      ? "text-[#15803d]"
                      : "text-[#b91c1c]"
                    : "text-[#111827]"
                }`}
                style={{
                  width: "36mm",
                  fontSize: "16px",
                  border: "none",
                  borderBottom: `0.5pt solid ${isGraded ? (isCorrect ? "#15803d" : "#b91c1c") : "#111827"}`,
                  borderRadius: 0,
                }}
              />
              {isGraded && isCorrect && <span className="text-[#15803d]">✓</span>}
              {isGraded && !isCorrect && <span className="text-[#b91c1c]">✗</span>}
            </div>
          )}

          {isGraded && (
            <div
              className="mt-4"
              style={{ border: "0.5pt solid #d1d5db", padding: "2mm 3mm" }}
            >
              <div
                className="mb-2 pb-1 text-sm font-bold uppercase tracking-wide text-[#111827]"
                style={{ borderBottom: "0.5pt solid #111827" }}
              >
                풀이
              </div>
              <div className="space-y-1">
                <p
                  className="font-medium text-[#1e3a8a]"
                  style={{ fontSize: "13px" }}
                >
                  정답: {problem.answer}
                </p>
                <p
                  className="whitespace-pre-line text-[#374151]"
                  style={{ fontSize: "13px", lineHeight: "1.6" }}
                >
                  {problem.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

export const runtime = "edge";

import { useState, useCallback, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import {
  fetchUnitProblems,
  gradeBatch,
  makeUserId,
  recordPlayedUnit,
  type ProblemDTO,
} from "@/lib/client";

type Problem = ProblemDTO;

function getGradeLabel(g: number): string {
  if (g <= 6) return `초${g}`;
  if (g <= 9) return `중${g - 6}`;
  return `고${g - 9}`;
}

// Parse math expressions from text
function MathText({ text, inline = false }: { text: string; inline?: boolean }) {
  const parts: { type: "text" | "inline" | "block"; content: string }[] = [];
  let remaining = text;

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
          // 보기·짧은 컨텍스트(inline=true)에서는 BlockMath 대신 InlineMath로 강제
          // → 한 줄 통째 차지 방지
          return inline ? (
            <InlineMath key={i} math={part.content} />
          ) : (
            <BlockMath key={i} math={part.content} />
          );
        } else if (part.type === "inline") {
          return <InlineMath key={i} math={part.content} />;
        }
        // 본문 후처리:
        //  1) "(그림:..)" 메타 묘사 제거
        //  2) 마크다운 bullet "* "/"- " → "· " 변환 (줄 시작 한정)
        //  3) 한 줄에 여러 bullet이 인라인으로 붙은 케이스 → 각 bullet 앞에 줄바꿈
        let cleaned = part.content.replace(/\s*\(그림:[^)]*\)\s*/g, "");
        // 인라인 bullet 분리: " * " 또는 " - " 패턴을 줄바꿈 + "· "로 변환
        cleaned = cleaned.replace(/\s+\*\s+/g, "\n· ").replace(/\s+-\s+/g, "\n· ");
        // 줄 시작의 "* " / "- " 도 처리
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

// Measure problem complexity for adaptive layout
function measureProblem(problem: Problem): "compact" | "regular" | "long" {
  let score = 0;
  
  // Body length scoring
  if (problem.body.length > 80) score += 2;
  else if (problem.body.length > 40) score += 1;
  
  // Choice count scoring
  if (problem.choices) {
    if (problem.choices.length >= 5) score += 2;
    else if (problem.choices.length === 4) score += 1;
    
    // Longest choice length scoring
    const maxChoiceLen = Math.max(...problem.choices.map(c => c.length));
    if (maxChoiceLen > 30) score += 1;
  }
  
  // Block math scoring
  if (problem.body.includes("$$")) score += 2;
  
  // Figure annotation scoring
  if (problem.body.includes("(그림:")) score += 2;
  
  if (score >= 4) return "long";
  if (score >= 2) return "regular";
  return "compact";
}

function WorksheetContent({ params }: { params: Promise<{ unitId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const grade = parseInt(searchParams.get("grade") || "3");

  const [unitProblems, setUnitProblems] = useState<Problem[]>([]);
  const unit = unitProblems[0]
    ? { id: unitProblems[0].unit_id, unit_name: unitProblems[0].unit_name }
    : { id: resolvedParams.unitId, unit_name: "" };
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProblems() {
      // include_answers=true → problem.answer + problem.explanation 클라이언트에 노출
      // (정답지 인쇄·채점 후 풀이 박스 둘 다 필요)
      const problems = await fetchUnitProblems(resolvedParams.unitId, 20, true);
      setUnitProblems(problems);
      setIsLoading(false);
      recordPlayedUnit(resolvedParams.unitId);
    }
    loadProblems();
  }, [resolvedParams.unitId]);

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
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-[#6b7280]">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] print:bg-white">
      {/* Toolbar - Hidden on Print */}
      <header className="no-print sticky top-0 z-10 border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between px-4 py-3">
          <Link
            href={`/library?grade=${grade}&subject=수학`}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#111827]"
          >
            ← 단원 목록
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#111827] hover:bg-[#f9fafb]"
            >
              🖨️ 인쇄/PDF
            </button>
            {!isGraded ? (
              <button
                onClick={handleGrade}
                disabled={answeredCount === 0}
                className="flex items-center gap-2 rounded bg-[#111827] px-3 py-1.5 text-sm text-white hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-50"
              >
                일괄 채점
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs">
                  {answeredCount}/{unitProblems.length}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-serif text-xl font-bold text-[#111827]">
                  {score}점
                </span>
                <span className="text-sm text-[#6b7280]">
                  · {correctCount}/{unitProblems.length}
                </span>
                <Link
                  href="/result"
                  className="text-sm text-[#1e3a8a] underline underline-offset-2 hover:text-[#1e40af]"
                >
                  학습 진단 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* A4 Paper Frame */}
      <main className="worksheet-page mx-auto my-8 max-w-[210mm] bg-white shadow-lg print:my-0 print:max-w-none print:p-[16mm] print:shadow-none" style={{ padding: "16mm" }}>
        {/* Header - Centered serif title with rule */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-xl font-bold text-[#111827]">
            {getGradeLabel(grade)} 수학 · {unit.unit_name}
          </h1>
          <div className="mx-auto mt-4 h-px w-full bg-[#111827]" style={{ height: "0.5pt" }} />
        </div>

        {/* Problems Grid - 2 columns */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 print:grid-cols-2">
          {unitProblems.map((problem, index) => {
            const layout = measureProblem(problem);
            return (
              <ProblemCell
                key={problem.id}
                problem={problem}
                index={index + 1}
                answer={answers[problem.id] || ""}
                onAnswerChange={handleAnswerChange}
                isGraded={isGraded}
                isCorrect={results[problem.id]}
                layout={layout}
              />
            );
          })}
        </div>

        {/* Score Banner - After grading (screen only) */}
        {isGraded && (
          <div className="no-print mt-8 flex items-center gap-4 pt-4" style={{ borderTop: "0.5pt solid #e5e7eb" }}>
            <span className="font-serif text-2xl font-bold text-[#111827]">
              {score}점
            </span>
            <span className="text-sm text-[#6b7280]">
              {correctCount}/{unitProblems.length}
            </span>
            <div className="flex-grow" />
            <Link
              href="/result"
              className="text-[#1e3a8a] underline underline-offset-2"
            >
              학습 진단 →
            </Link>
          </div>
        )}

        {/* Answer Key - Print Only */}
        <div className="answer-key hidden print:block" style={{ pageBreakBefore: "always" }}>
          {/* Double line header */}
          <div className="mb-2 border-t-2 border-[#111827]" />
          <div className="mb-4 border-t border-[#111827]" />
          <h2 className="mb-4 text-center font-serif text-lg font-bold text-[#111827]">
            정답 및 해설
          </h2>
          <div className="mb-2 border-t border-[#111827]" />
          <div className="mb-6 border-t-2 border-[#111827]" />

          {/* Compact 2-column answer list */}
          <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            {unitProblems.map((problem, index) => (
              <div key={problem.id} className="flex gap-2">
                <span className="font-serif font-bold text-[#111827]">{index + 1}.</span>
                <span className="text-[#111827]">{problem.answer}</span>
              </div>
            ))}
          </div>

          {/* Full explanations */}
          <div className="space-y-4 text-sm">
            {unitProblems.map((problem, index) => (
              <div key={problem.id} className="break-inside-avoid">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-[#111827]">{index + 1}.</span>
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
      {/* Problem Row: Number + Body */}
      <div className="flex">
        {/* Problem Number - Large bold serif, flush left */}
        <div 
          className="w-8 flex-shrink-0 font-serif font-bold text-[#111827]"
          style={{ fontSize: "22px", lineHeight: "1.8" }}
        >
          {index}.
        </div>

        {/* Problem Content - Indented */}
        <div className="flex-1 pl-1">
          {/* Problem Body */}
          <div 
            className="text-[#111827]"
            style={{ fontSize: "16px", lineHeight: "1.8" }}
          >
            <MathText text={problem.body} />
          </div>

          {/* Choices or Short Answer Input */}
          {problem.type === "multiple_choice" && problem.choices ? (
            <div className="mt-2 space-y-1" style={{ paddingLeft: "0" }}>
              {problem.choices.map((choice, i) => {
                const isSelected = answer === choice;
                const isCorrectChoice = choice === problem.answer;
                const isWrongSelection =
                  isGraded && isSelected && !isCorrectChoice;

                // 채점 전: 선택된 항목은 옅은 회색 배경 + bold
                // 채점 후: 정답 = 초록 배경 / 오답 선택 = 빨강 배경
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
                    {/* 라디오 시각화 — sr-only 대신 보이는 ○/● */}
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
                          style={{ background: isGraded ? (isCorrectChoice ? "#15803d" : "#b91c1c") : "#111827" }}
                        />
                      )}
                    </span>
                    <span className="font-serif shrink-0" style={{ fontSize: "16px" }}>
                      {choiceLabels[i]}
                    </span>
                    {/* KaTeX 렌더된 span 내부가 click을 가로채지 못하도록 pointer-events:none */}
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
            /* Short answer - inline "정답: __________" */
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[#111827]" style={{ fontSize: "16px" }}>정답:</span>
              <input
                type="text"
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
                  borderRadius: 0
                }}
              />
              {isGraded && isCorrect && (
                <span className="text-[#15803d]">✓</span>
              )}
              {isGraded && !isCorrect && (
                <span className="text-[#b91c1c]">✗</span>
              )}
            </div>
          )}

          {/* Explanation Box - Shows after grading */}
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
                <p className="font-medium text-[#1e3a8a]" style={{ fontSize: "13px" }}>
                  정답: {problem.answer}
                </p>
                <p 
                  className="whitespace-pre-line text-[#374151]"
                  style={{ fontSize: "13px", lineHeight: "1.6" }}
                >
                  {problem.explanation}
                </p>
                {problem.error_type && !isCorrect && (
                  <div className="flex justify-end pt-1">
                    <span 
                      className="rounded bg-[#f3f4f6] px-2 py-0.5 font-mono text-[#6b7280]"
                      style={{ fontSize: "11px" }}
                    >
                      {problem.error_type}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorksheetPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
          <p className="text-[#6b7280]">로딩 중...</p>
        </div>
      }
    >
      <WorksheetContent params={params} />
    </Suspense>
  );
}

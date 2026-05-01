"use client";

import { useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, CheckCircle2 } from "lucide-react";
import { units, problems, getGradeLabel, getDifficultyStars } from "@/lib/data";
import type { Problem } from "@/lib/data";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { Suspense } from "react";

// Parse math expressions from text
function MathText({ text }: { text: string }) {
  // Split by $$ (block) and $ (inline) math
  const parts: { type: "text" | "inline" | "block"; content: string }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for block math first ($$...$$)
    const blockMatch = remaining.match(/^\$\$([\s\S]*?)\$\$/);
    if (blockMatch) {
      parts.push({ type: "block", content: blockMatch[1] });
      remaining = remaining.slice(blockMatch[0].length);
      continue;
    }

    // Check for inline math ($...$)
    const inlineMatch = remaining.match(/^\$([\s\S]*?)\$/);
    if (inlineMatch) {
      parts.push({ type: "inline", content: inlineMatch[1] });
      remaining = remaining.slice(inlineMatch[0].length);
      continue;
    }

    // Find next math delimiter
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
    <span>
      {parts.map((part, i) => {
        if (part.type === "block") {
          return <BlockMath key={i} math={part.content} />;
        } else if (part.type === "inline") {
          return <InlineMath key={i} math={part.content} />;
        }
        return <span key={i}>{part.content}</span>;
      })}
    </span>
  );
}

function WorksheetContent({ params }: { params: Promise<{ unitId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const grade = parseInt(searchParams.get("grade") || "3");

  const unit = units.find((u) => u.id === resolvedParams.unitId) || units[0];
  const unitProblems = problems.filter((p) => p.unit_id === unit.id);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGraded, setIsGraded] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k]?.trim()
  ).length;
  const correctCount = Object.values(results).filter(Boolean).length;
  const score = Math.round((correctCount / unitProblems.length) * 100);

  const handleAnswerChange = useCallback((problemId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [problemId]: value }));
  }, []);

  const handleGrade = () => {
    const newResults: Record<string, boolean> = {};
    unitProblems.forEach((problem) => {
      const userAnswer = answers[problem.id]?.trim() || "";
      const correctAnswer = problem.answer.replace(/[개권]$/, "").trim();
      const normalizedUser = userAnswer.replace(/[개권]$/, "").trim();
      newResults[problem.id] =
        normalizedUser.toLowerCase() === correctAnswer.toLowerCase();
    });
    setResults(newResults);
    setIsGraded(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleViewDiagnosis = () => {
    router.push("/result");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar - Hidden on Print */}
      <header className="no-print sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            href={`/library?grade=${grade}&subject=수학`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            단원 목록
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              인쇄/PDF
            </Button>
            <Button
              size="sm"
              onClick={handleGrade}
              disabled={answeredCount === 0}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              일괄 채점
              <span className="rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
                {answeredCount}/{unitProblems.length}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Score Banner - Shows after grading */}
      {isGraded && (
        <div className="no-print sticky top-14 z-10 border-b border-primary/20 bg-primary/5 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-primary">{score}점</span>
              <span className="text-sm text-muted-foreground">
                {correctCount}/{unitProblems.length} 정답
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewDiagnosis}
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              학습 진단 보기
            </Button>
          </div>
        </div>
      )}

      {/* Worksheet Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Worksheet Header */}
        <div className="mb-8 border-b-2 border-foreground pb-4">
          <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground">
            EDUQA WORKSHEET
          </p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              {getGradeLabel(grade)} 수학 · {unit.unit_name}
            </h1>
            <div className="print-only flex gap-8 text-sm">
              <span>
                이름: <span className="inline-block w-24 border-b border-foreground" />
              </span>
              <span>
                날짜: <span className="inline-block w-24 border-b border-foreground" />
              </span>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="space-y-7">
          {unitProblems.map((problem, index) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              index={index + 1}
              answer={answers[problem.id] || ""}
              onAnswerChange={handleAnswerChange}
              isGraded={isGraded}
              isCorrect={results[problem.id]}
            />
          ))}
        </div>

        {/* Answer Key - Print Only */}
        <div className="answer-key print-only mt-16">
          <h2 className="mb-6 border-b-2 border-foreground pb-2 text-xl font-bold">
            정답 및 해설
          </h2>
          <div className="space-y-6">
            {unitProblems.map((problem, index) => (
              <div key={problem.id} className="text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-bold">{index + 1}.</span>
                  <span className="font-medium text-primary">
                    정답: {problem.answer}
                  </span>
                </div>
                <p className="whitespace-pre-line pl-5 text-muted-foreground">
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

function ProblemCard({
  problem,
  index,
  answer,
  onAnswerChange,
  isGraded,
  isCorrect,
}: {
  problem: Problem;
  index: number;
  answer: string;
  onAnswerChange: (id: string, value: string) => void;
  isGraded: boolean;
  isCorrect?: boolean;
}) {
  const choiceLabels = ["①", "②", "③", "④", "⑤"];

  return (
    <div className="worksheet-problem border-b border-dashed border-border pb-7">
      {/* Problem Header */}
      <div className="mb-3 flex items-center gap-3">
        {/* Number Circle */}
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
          {index}
        </div>

        {/* Difficulty & Type */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-amber-500">
            {getDifficultyStars(problem.difficulty)}
          </span>
          <Badge variant="outline" className="text-[10px] font-normal">
            {problem.type === "multiple_choice" ? "객관식" : "단답형"}
          </Badge>
        </div>
      </div>

      {/* Problem Body */}
      <div className="mb-4 pl-10 text-base leading-relaxed text-foreground">
        <MathText text={problem.body} />
      </div>

      {/* Choices or Input */}
      <div className="pl-10">
        {problem.type === "multiple_choice" && problem.choices ? (
          <div className="space-y-2">
            {problem.choices.map((choice, i) => {
              const isSelected = answer === choice;
              const isCorrectChoice = choice === problem.answer;
              let choiceStyle = "border-border hover:border-primary/50";

              if (isGraded) {
                if (isCorrectChoice) {
                  choiceStyle = "border-green-500 bg-green-50";
                } else if (isSelected && !isCorrectChoice) {
                  choiceStyle = "border-red-500 bg-red-50";
                }
              } else if (isSelected) {
                choiceStyle = "border-primary bg-primary/5";
              }

              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${choiceStyle}`}
                >
                  <input
                    type="radio"
                    name={problem.id}
                    value={choice}
                    checked={isSelected}
                    onChange={(e) => onAnswerChange(problem.id, e.target.value)}
                    disabled={isGraded}
                    className="sr-only"
                  />
                  <span className="text-lg text-muted-foreground">
                    {choiceLabels[i]}
                  </span>
                  <span className="text-sm">
                    <MathText text={choice} />
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">정답:</span>
            <Input
              type="text"
              value={answer}
              onChange={(e) => onAnswerChange(problem.id, e.target.value)}
              disabled={isGraded}
              placeholder="답을 입력하세요"
              className={`w-40 ${
                isGraded
                  ? isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Explanation - Shows after grading */}
      {isGraded && (
        <Card
          className={`mt-4 ml-10 border p-4 ${
            isCorrect
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                isCorrect ? "text-green-700" : "text-red-700"
              }`}
            >
              {isCorrect ? "정답!" : "오답"}
            </span>
            {!isCorrect && (
              <span className="text-sm text-muted-foreground">
                정답: <span className="font-medium">{problem.answer}</span>
              </span>
            )}
            {problem.error_type && !isCorrect && (
              <Badge
                variant="outline"
                className="ml-auto border-red-300 text-xs text-red-600"
              >
                {problem.error_type}
              </Badge>
            )}
          </div>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {problem.explanation}
          </p>
        </Card>
      )}
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
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      }
    >
      <WorksheetContent params={params} />
    </Suspense>
  );
}

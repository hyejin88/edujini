"use client";

import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, CheckCircle2, Lock } from "lucide-react";
import {
  FREE_UNIT_LIMIT,
  fetchUnitProblems,
  getPlayedUnits,
  gradeBatch,
  makeUserId,
  recordPlayedUnit,
  type ProblemDTO,
} from "@/lib/client";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

function gradeLabel(g: number): string {
  if (g <= 6) return `초${g}`;
  if (g <= 9) return `중${g - 6}`;
  return `고${g - 9}`;
}

function MathText({ text }: { text: string }) {
  if (!text) return null;
  type Part = { type: "text" | "inline" | "block"; content: string };
  const parts: Part[] = [];
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
    if (nextBlock !== -1 && nextInline !== -1) nextMath = Math.min(nextBlock, nextInline);
    else if (nextBlock !== -1) nextMath = nextBlock;
    else if (nextInline !== -1) nextMath = nextInline;
    if (nextMath === -1) {
      parts.push({ type: "text", content: remaining });
      break;
    }
    if (nextMath > 0) parts.push({ type: "text", content: remaining.slice(0, nextMath) });
    remaining = remaining.slice(nextMath);
  }
  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === "block") return <BlockMath key={i} math={part.content} />;
        if (part.type === "inline") return <InlineMath key={i} math={part.content} />;
        return (
          <span key={i} style={{ whiteSpace: "pre-line" }}>
            {part.content}
          </span>
        );
      })}
    </span>
  );
}

interface ResultMap {
  [problemId: string]: {
    correct: boolean;
    correct_answer: string;
    explanation: string;
    error_label: string | null;
  };
}

function WorksheetContent({ params }: { params: Promise<{ unitId: string }> }) {
  const resolvedParams = use(params);
  const unitId = decodeURIComponent(resolvedParams.unitId);
  const router = useRouter();

  const [problems, setProblems] = useState<ProblemDTO[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ResultMap>({});
  const [scoreSummary, setScoreSummary] = useState<{
    total: number;
    correct: number;
    score_pct: number;
    error_breakdown: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const played = getPlayedUnits();
    if (!played.includes(unitId) && played.length >= FREE_UNIT_LIMIT) {
      setLocked(true);
      setLoading(false);
      return;
    }
    makeUserId();
    fetchUnitProblems(unitId, 20)
      .then((data) => {
        setProblems(data);
        if (data.length === 0) setError("이 단원에 등록된 문항이 아직 없어요.");
        else recordPlayedUnit(unitId);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [unitId]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && String(v).trim()).length,
    [answers]
  );

  const handleAnswerChange = useCallback((problemId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [problemId]: value }));
  }, []);

  const handleGrade = async () => {
    setGrading(true);
    try {
      const list = problems
        .filter((p) => answers[p.id])
        .map((p) => ({ problem_id: p.id, user_answer: answers[p.id] }));
      const r = await gradeBatch(makeUserId(), list);
      const map: ResultMap = {};
      for (const it of r.results) {
        map[it.problem_id] = {
          correct: it.correct,
          correct_answer: it.correct_answer,
          explanation: it.explanation,
          error_label: it.error_label,
        };
      }
      setResults(map);
      setScoreSummary({
        total: r.total,
        correct: r.correct,
        score_pct: r.score_pct,
        error_breakdown: r.error_breakdown,
      });
      setTimeout(() => {
        document.getElementById("score-banner")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e: any) {
      setError(e?.message || "채점 중 오류");
    } finally {
      setGrading(false);
    }
  };

  if (locked) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-bold">무료 3개 단원 사용 완료</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            다음 단원을 풀려면 결제 후 이용할 수 있어요
          </p>
          <Link
            href={`/result?lock=${encodeURIComponent(unitId)}`}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            ₩990 단원 정복 팩
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        문항 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/library?grade=3&subject=수학" className="text-sm text-primary underline">
          단원 목록으로
        </Link>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">등록된 문항이 없어요.</p>
      </div>
    );
  }

  const unitName = problems[0].unit_name;
  const subjectLabel = problems[0].subject;
  const grade = problems[0].grade;

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            href={`/library?grade=${grade}&subject=${encodeURIComponent(subjectLabel)}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            단원 목록
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              인쇄/PDF
            </Button>
            {!scoreSummary ? (
              <Button
                size="sm"
                onClick={handleGrade}
                disabled={answeredCount === 0 || grading}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                {grading ? "채점 중..." : "일괄 채점"}
                <span className="rounded bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
                  {answeredCount}/{problems.length}
                </span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/result")}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                학습 진단 보기
              </Button>
            )}
          </div>
        </div>
      </header>

      {scoreSummary && (
        <div
          id="score-banner"
          className="no-print sticky top-14 z-10 border-b border-primary/20 bg-primary/5 py-3"
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-primary">
                {scoreSummary.score_pct}점
              </span>
              <span className="text-sm text-muted-foreground">
                {scoreSummary.correct}/{scoreSummary.total} 정답
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/result")}
              className="bg-primary hover:bg-primary/90"
            >
              학부모 리포트 받기
            </Button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 border-b-2 border-foreground pb-4">
          <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground">
            EDUJINI WORKSHEET
          </p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              {gradeLabel(grade)} {subjectLabel} · {unitName}
            </h1>
            <div className="print-only flex gap-8 text-sm">
              <span>이름: <span className="inline-block w-24 border-b border-foreground" /></span>
              <span>날짜: <span className="inline-block w-24 border-b border-foreground" /></span>
            </div>
          </div>
        </div>

        <div className="space-y-7">
          {problems.map((problem, index) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              index={index + 1}
              answer={answers[problem.id] || ""}
              onAnswerChange={handleAnswerChange}
              result={results[problem.id]}
            />
          ))}
        </div>

        {!scoreSummary && (
          <div className="no-print mt-10 flex items-center justify-between border-t border-border pt-6 text-sm">
            <span className="text-muted-foreground">
              답변 {answeredCount} / {problems.length}
            </span>
            <Button
              onClick={handleGrade}
              disabled={answeredCount === 0 || grading}
              className="bg-primary hover:bg-primary/90"
            >
              {grading ? "채점 중..." : "일괄 채점하기"}
            </Button>
          </div>
        )}

        <div className="answer-key print-only mt-16">
          <h2 className="mb-6 border-b-2 border-foreground pb-2 text-xl font-bold">
            정답 및 해설
          </h2>
          <div className="space-y-6">
            {problems.map((p, i) => (
              <div key={p.id} className="text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-bold">{i + 1}.</span>
                  <span className="font-medium text-primary">
                    정답: {p.answer || "(정답 데이터 미포함)"}
                  </span>
                </div>
                {p.explanation && (
                  <p className="whitespace-pre-line pl-5 text-muted-foreground">
                    {p.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProblemRow({
  problem,
  index,
  answer,
  onAnswerChange,
  result,
}: {
  problem: ProblemDTO;
  index: number;
  answer: string;
  onAnswerChange: (id: string, value: string) => void;
  result?: ResultMap[string];
}) {
  const choiceLabels = ["①", "②", "③", "④", "⑤"];
  const isGraded = !!result;

  return (
    <div className="worksheet-problem border-b border-dashed border-border pb-7">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
          {index}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-amber-500">
            {"★".repeat(problem.difficulty)}
            {"☆".repeat(5 - problem.difficulty)}
          </span>
          <Badge variant="outline" className="text-[10px] font-normal">
            {problem.type === "multiple_choice" ? "객관식" : "단답형"}
          </Badge>
        </div>
      </div>

      <div className="mb-4 pl-10 text-base leading-relaxed text-foreground">
        <MathText text={problem.body} />
      </div>

      <div className="pl-10">
        {problem.type === "multiple_choice" && problem.choices ? (
          <div className="space-y-2">
            {problem.choices.map((choice, i) => {
              const isSelected = answer === choice;
              const isCorrectChoice = isGraded && result && choice === result.correct_answer;
              const isWrongPick = isGraded && result && isSelected && !result.correct;
              let cls = "border-border hover:border-primary/50";
              if (isCorrectChoice) cls = "border-green-500 bg-green-50";
              else if (isWrongPick) cls = "border-rose-400 bg-rose-50";
              else if (isSelected) cls = "border-primary bg-primary/5";
              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 transition ${cls} ${
                    isGraded ? "cursor-default" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={problem.id}
                    value={choice}
                    checked={isSelected}
                    disabled={isGraded}
                    onChange={() => onAnswerChange(problem.id, choice)}
                    className="mt-1"
                  />
                  <span className="font-semibold text-muted-foreground">
                    {choiceLabels[i] || `(${i + 1})`}
                  </span>
                  <span className="flex-1 text-[15px]">
                    <MathText text={choice} />
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">정답:</span>
            <Input
              value={answer}
              disabled={isGraded}
              onChange={(e) => onAnswerChange(problem.id, e.target.value)}
              placeholder={isGraded ? "" : "답을 적으세요"}
              className={`max-w-[220px] ${
                isGraded && result?.correct
                  ? "border-green-500 bg-green-50"
                  : isGraded && !result?.correct
                  ? "border-rose-400 bg-rose-50"
                  : ""
              }`}
            />
          </div>
        )}

        {!isGraded && (
          <div className="mt-3 hidden h-24 rounded-md border border-dashed border-border bg-muted/20 print:block" />
        )}

        {isGraded && result && (
          <div
            className={`mt-3 rounded-md border p-3 text-[13px] ${
              result.correct
                ? "border-green-200 bg-green-50/50 text-green-900"
                : "border-rose-200 bg-rose-50/50 text-rose-900"
            }`}
          >
            <div className="mb-1 font-semibold">
              {result.correct ? "✓ 정답" : `✗ 정답: ${result.correct_answer}`}
              {result.error_label && (
                <span className="ml-2 rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-medium">
                  {result.error_label}
                </span>
              )}
            </div>
            <div className="leading-relaxed text-foreground/80">
              <MathText text={result.explanation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnitPage({
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

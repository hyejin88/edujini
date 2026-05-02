"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { generateDrill, type DrillProblem } from "@/lib/drillGen";
import type { SheetMeta } from "@/lib/sheets";
import type { UnitDTO } from "@/lib/client";
import { DrillSheet } from "@/components/DrillSheet";

function gradeLabel(g: number): string {
  if (g <= 6) return `초${g}`;
  if (g <= 9) return `중${g - 6}`;
  return `고${g - 9}`;
}

function gradeFromUnitId(unitId: string): number {
  const m = unitId.match(/^[a-z]+-(\d+)/i);
  return m ? parseInt(m[1], 10) : 3;
}

// 양식 제목/풀 키 기반 안내 문구 — 덧/뺄/곱/나/혼합/분수/소수 분기
function drillInstruction(sheet: SheetMeta): string {
  const title = sheet.title || "";
  const pk = sheet.pool_key || "";
  if (/±|혼합|덧셈\/뺄셈|덧셈과 뺄셈/.test(title) || pk.startsWith("three_num") || pk.startsWith("mixed_calc")) {
    return "계산하세요.";
  }
  if (/곱셈/.test(title) || pk.startsWith("h_mul") || pk.startsWith("frac_mul") || pk.startsWith("dec_mul")) {
    return "곱셈을 하세요.";
  }
  if (/나눗셈/.test(title) || pk.startsWith("h_div") || pk.startsWith("frac_div") || pk.startsWith("dec_div")) {
    return "나눗셈을 하세요.";
  }
  if (/뺄셈|받아내림|차/.test(title) || pk.startsWith("h_sub") || pk.startsWith("dec_sub") || pk === "frac_same_sub" || pk === "frac_diff_sub" || pk === "frac_natural_minus_proper" || pk === "frac_mixed_sub" || pk === "frac_mixed_sub_borrow") {
    return "뺄셈을 하세요.";
  }
  if (/덧셈|받아올림|모으기/.test(title) || pk.startsWith("h_add") || pk.startsWith("dec_add") || pk === "frac_same_add" || pk === "frac_same_add_improper" || pk === "frac_diff_add" || pk === "frac_mixed_add" || pk === "frac_mixed_add_carry") {
    return "덧셈을 하세요.";
  }
  if (pk === "decompose_9") return "두 수로 가르세요.";
  if (pk === "make_ten") return "10이 되도록 빈 칸을 채우세요.";
  if (pk === "break_ten") return "10에서 빼세요.";
  if (pk === "frac_proper_to_improper") return "대분수를 가분수로 나타내세요.";
  if (pk === "frac_improper_to_mixed") return "가분수를 대분수로 나타내세요.";
  if (pk === "frac_compare_same") return "두 분수의 크기를 비교하세요.";
  if (pk === "frac_reduce") return "분수를 약분하세요.";
  if (pk === "frac_common_denom") return "두 분수를 통분하세요.";
  if (pk === "factors") return "약수를 구하세요.";
  if (pk === "multiples") return "배수를 구하세요.";
  if (pk === "gcd") return "최대공약수를 구하세요.";
  if (pk === "lcm") return "최소공배수를 구하세요.";
  if (pk === "ratio_simplify") return "비를 가장 간단한 자연수의 비로 나타내세요.";
  if (pk === "ratio_to_pct") return "비율을 백분율로 나타내세요.";
  if (pk === "proportion") return "비례식을 풀어 빈 칸을 채우세요.";
  if (pk === "proportional_share") return "비례배분으로 두 수를 구하세요.";
  return "계산하세요.";
}

export default function DrillSheetPage({
  sheet,
  unit,
}: {
  sheet: SheetMeta;
  unit: UnitDTO | null;
}) {
  const [seedNonce, setSeedNonce] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isGraded, setIsGraded] = useState(false);
  const [problems, setProblems] = useState<DrillProblem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    generateDrill(sheet).then((p) => {
      if (mounted) {
        setProblems(p);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [sheet, seedNonce]);

  const answeredCount = Object.entries(answers).filter(
    ([, v]) => v && String(v).trim()
  ).length;

  const correctCount = isGraded
    ? problems.filter((p) => {
        if (p.is_example) return false;
        const ua = (answers[p.index] || "").replace(/[^\d-]/g, "");
        return Number(ua) === p.answer;
      }).length
    : 0;

  const total = problems.length - 1; // 1번은 시범, 채점 대상 X
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const handleGrade = () => setIsGraded(true);
  const handleNew = () => {
    setSeedNonce((n) => n + 1);
    setAnswers({});
    setIsGraded(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] print:bg-white">
      {/* 툴바 */}
      <header className="no-print sticky top-0 z-10 border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between px-4 py-3">
          <Link
            href={`/library/${encodeURIComponent(sheet.unit_id)}?mode=drill`}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#111827]"
          >
            <ArrowLeft className="h-4 w-4" />
            양식 목록
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="flex items-center gap-1 rounded border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#111827] hover:bg-[#f9fafb]"
              title="새 문제 받기"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              새 문제
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#111827] hover:bg-[#f9fafb]"
            >
              <Printer className="h-3.5 w-3.5" />
              인쇄/PDF
            </button>
            {!isGraded ? (
              <button
                onClick={handleGrade}
                disabled={answeredCount === 0}
                className="rounded bg-[#111827] px-3 py-1.5 text-sm text-white hover:bg-[#1f2937] disabled:opacity-50"
              >
                채점{" "}
                <span className="rounded bg-white/20 px-1.5 text-xs">
                  {answeredCount}/{total}
                </span>
              </button>
            ) : (
              <span className="font-serif text-lg font-bold text-[#111827]">
                {score}점 ·{" "}
                <span className="text-sm text-[#6b7280]">
                  {correctCount}/{total}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>

      <main
        className="mx-auto my-8 max-w-[210mm] bg-white shadow-lg print:my-0 print:max-w-none print:p-[16mm] print:shadow-none"
        style={{ padding: "16mm" }}
      >
        {/* 헤더 */}
        <div className="mb-6">
          <p className="mb-1 text-xs font-medium tracking-widest text-[#6b7280]">
            EDUJINI WORKSHEET
          </p>
          <div className="flex items-end justify-between">
            <h1 className="font-serif text-xl font-bold text-[#111827]">
              {unit ? `${gradeLabel(unit.grade)} ${unit.subject}` : `${gradeLabel(gradeFromUnitId(sheet.unit_id))} 수학`}{" "}
              · {sheet.title}
            </h1>
            <div className="hidden gap-6 text-xs text-[#6b7280] print:flex">
              <span>이름 ____________</span>
              <span>날짜 ___ / ___</span>
            </div>
          </div>
          <div className="mt-2 mb-4 border-t border-[#111827]" />
          <p className="text-sm text-[#374151]">
            {drillInstruction(sheet)}
            <span className="ml-2 text-xs text-[#6b7280]">
              (1번은 보기예요. 2번부터 풀어보세요.)
            </span>
          </p>
        </div>

        {/* 문제 그리드 */}
        <DrillSheet
          sheet={sheet}
          problems={problems}
          isGraded={isGraded}
          answers={answers}
          onChange={(idx, v) =>
            setAnswers((prev) => ({ ...prev, [idx]: v }))
          }
        />

        {/* 인쇄 답안지 */}
        <div className="answer-key hidden print:block" style={{ pageBreakBefore: "always" }}>
          <div className="mb-2 border-t-2 border-[#111827]" />
          <div className="mb-4 border-t border-[#111827]" />
          <h2 className="mb-4 text-center font-serif text-lg font-bold">
            정답
          </h2>
          <div className="mb-2 border-t border-[#111827]" />
          <div className="mb-6 border-t-2 border-[#111827]" />
          <div className="grid grid-cols-4 gap-x-6 gap-y-1 text-sm font-mono">
            {problems.map((p) => (
              <div key={p.index} className="flex gap-2">
                <span className="font-serif font-bold">{p.index}.</span>
                <span>{p.answer}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

export const runtime = "edge";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ArrowLeft, Printer, FileText, Pencil } from "lucide-react";
import {
  fetchUnits,
  type UnitDTO,
} from "@/lib/client";
import { getUnitSheets, getSheet, type SheetMeta } from "@/lib/sheets";
import ComprehensiveSheet from "./_comp";
import DrillSheetPage from "./_drill";

function gradeLabel(g: number): string {
  if (g <= 6) return `초${g}`;
  if (g <= 9) return `중${g - 6}`;
  return `고${g - 9}`;
}

// unitId 형식: "math-3-1-1" / "kor-4-2-3" → 학년 추출
function gradeFromUnitId(unitId: string): number {
  const m = unitId.match(/^[a-z]+-(\d+)/i);
  return m ? parseInt(m[1], 10) : 3;
}

function UnitContent({ unitId }: { unitId: string }) {
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheet");
  const mode = searchParams.get("mode"); // "drill" 일 때 연산 문제지 카드만
  const [unit, setUnit] = useState<UnitDTO | null>(null);
  const grade = gradeFromUnitId(unitId);

  useEffect(() => {
    fetchUnits(grade, "수학")
      .then((units) => {
        const found = units.find((u) => u.id === unitId);
        if (found) setUnit(found);
      })
      .catch(console.error);
  }, [unitId, grade]);

  // sheet 쿼리 있으면 해당 학습지 페이지로 분기
  if (sheetId) {
    const sheet = getSheet(unitId, sheetId);
    if (!sheet) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-[#6b7280]">해당 학습을 찾을 수 없어요.</p>
        </div>
      );
    }
    if (sheet.type === "comprehensive") {
      return <ComprehensiveSheet unitId={unitId} unit={unit} />;
    }
    return <DrillSheetPage sheet={sheet} unit={unit} />;
  }

  // 학습지 카드 그리드 (mode=drill이면 드릴만, 아니면 모두)
  const allSheets = getUnitSheets(unitId);
  const sheets =
    mode === "drill"
      ? allSheets.filter((s) => s.type !== "comprehensive")
      : allSheets;
  const titleLabel = mode === "drill" ? "연산 문제" : "단원 학습";
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href={`/library?grade=${grade}&subject=수학&mode=${mode === "drill" ? "drill" : "comp"}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            단원 목록
          </Link>
          <Brand />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            {titleLabel} · {unit ? `${gradeLabel(unit.grade)} ${unit.subject}` : `${gradeLabel(grade)} 수학`}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold">
            {unit?.unit_name || "단원"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "drill"
              ? "유형을 선택하세요. 가로식·세로식, 받아올림 여부별로 나눠져 있어요."
              : "이 단원의 종합 학습이에요. 선택형·서술형 20문항 + AI 자동 채점."}
          </p>
        </div>

        {sheets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            이 단원은 아직 학습지가 준비되지 않았어요.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sheets.map((s) => (
              <SheetCard key={s.id} unitId={unitId} sheet={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SheetCard({ unitId, sheet }: { unitId: string; sheet: SheetMeta }) {
  const isComp = sheet.type === "comprehensive";
  const Icon = isComp ? FileText : Pencil;
  const accent = isComp ? "border-primary/40" : "border-border";
  return (
    <Link
      href={`/library/${encodeURIComponent(unitId)}?sheet=${sheet.id}`}
      className={`group block rounded-xl border ${accent} bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-sm`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {isComp ? "단원 학습" : "연산 문제"}
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{sheet.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{sheet.subtitle}</p>
      <div className="mt-3 text-xs text-muted-foreground">
        {sheet.problem_count}문제
      </div>
    </Link>
  );
}

export default function UnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = use(params);
  const decoded = decodeURIComponent(unitId);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
          <p className="text-[#6b7280]">로딩 중...</p>
        </div>
      }
    >
      <UnitContent unitId={decoded} />
    </Suspense>
  );
}

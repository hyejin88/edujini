"use client";

export const runtime = "edge";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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

function UnitContent({ unitId }: { unitId: string }) {
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheet");
  const [unit, setUnit] = useState<UnitDTO | null>(null);

  useEffect(() => {
    fetchUnits(3, "수학")
      .then((units) => {
        const found = units.find((u) => u.id === unitId);
        if (found) setUnit(found);
      })
      .catch(console.error);
  }, [unitId]);

  // sheet 쿼리 있으면 해당 학습지 페이지로 분기
  if (sheetId) {
    const sheet = getSheet(unitId, sheetId);
    if (!sheet) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-[#6b7280]">학습지를 찾을 수 없어요.</p>
        </div>
      );
    }
    if (sheet.type === "comprehensive") {
      return <ComprehensiveSheet unitId={unitId} unit={unit} />;
    }
    return <DrillSheetPage sheet={sheet} unit={unit} />;
  }

  // 학습지 카드 그리드
  const sheets = getUnitSheets(unitId);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href="/library?grade=3&subject=수학"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            단원 목록
          </Link>
          <Link href="/" className="text-lg font-bold">
            EDU Jini
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            {unit ? `${gradeLabel(unit.grade)} · ${unit.subject}` : "초3 · 수학"}
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            {unit?.unit_name || "단원"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            오늘의 학습지를 골라보세요. 모두 무료, 인쇄 가능.
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
          {isComp ? "종합" : "연산 드릴"}
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{sheet.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{sheet.subtitle}</p>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Printer className="h-3.5 w-3.5" />
        <span>{sheet.problem_count}문제 · 인쇄 가능</span>
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

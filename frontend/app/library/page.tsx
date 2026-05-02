"use client";

export const runtime = "edge";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowLeft, Printer, FileText } from "lucide-react";
import {
  fetchUnits,
  getPlayedUnits,
  FREE_UNIT_LIMIT,
  type UnitDTO,
} from "@/lib/client";
import { AdSlot } from "@/components/AdSlot";
import { UNIT_SHEETS, getUnitSheets } from "@/lib/sheets";

function gradeLabel(g: number): string {
  if (g <= 6) return `초${g}`;
  if (g <= 9) return `중${g - 6}`;
  return `고${g - 9}`;
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const grade = parseInt(searchParams.get("grade") || "3", 10);
  const subject = searchParams.get("subject") || "수학";
  const mode = (searchParams.get("mode") || "comp") as "comp" | "drill";
  const modeLabel = mode === "drill" ? "연산 문제" : "단원 학습";

  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [played, setPlayed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlayed(getPlayedUnits());
    fetchUnits(grade, subject)
      .then(setUnits)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [grade, subject]);

  // 드릴 모드: UNIT_SHEETS에 드릴 양식 1+ 단원 표시
  // 종합 모드: seed.json에 콘텐츠 있는 단원 (unit.available)
  const hasDrill = (uid: string) =>
    getUnitSheets(uid).some((s) => s.type !== "comprehensive");
  const available = units.filter((u) =>
    mode === "drill" ? hasDrill(u.id) : u.available
  );
  // 드릴 모드는 양식 없는 단원을 "준비 중"으로도 노출하지 않음 (연산 무관 단원이 대부분)
  const upcoming =
    mode === "drill" ? [] : units.filter((u) => !u.available);
  const left = Math.max(0, FREE_UNIT_LIMIT - played.length);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>
          <Link href="/" className="text-lg font-bold text-foreground">
            EDU Jini
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              {modeLabel}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-foreground">
              {gradeLabel(grade)} · {subject}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "drill"
                ? "연산 반복 드릴 — 단원을 선택하면 가로식·세로식 양식별 문제지를 보여드려요."
                : "단원별 종합 학습 — 객관식·서술형 20문항 + AI 자동 채점."}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
          >
            전 단원 무료
          </Badge>
        </div>

        {loading ? (
          <div className="rounded-lg border border-border p-10 text-center text-muted-foreground">
            단원 불러오는 중...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : available.length === 0 ? (
          <Card className="p-10 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              아직 이 학년·과목에 등록된 단원이 없어요.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {available.map((unit, index) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                index={index}
                isPlayed={played.includes(unit.id)}
                isLockedByLimit={false}
                mode={mode}
              />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              준비 중인 단원
            </h2>
            <div className="grid gap-2 md:grid-cols-2">
              {upcoming.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                >
                  {u.unit_name}
                  <span className="ml-2 text-[11px]">{u.standard_code}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 작은 광고 1개 — 단원 그리드 한참 아래, 푸터 위. 학습지 페이지엔 절대 광고 없음 */}
        <AdSlot
          slot="LIBRARY_BOTTOM"
          format="rectangle"
          className="mx-auto mt-16 max-w-sm opacity-90"
        />
      </main>
    </div>
  );
}

function UnitCard({
  unit,
  index,
  isPlayed,
  isLockedByLimit,
  mode,
}: {
  unit: UnitDTO;
  index: number;
  isPlayed: boolean;
  isLockedByLimit: boolean;
  mode: "comp" | "drill";
}) {
  const inner = (
    <Card
      className={`group border border-border p-5 transition-all ${
        isLockedByLimit
          ? "bg-muted/30"
          : "cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-2 text-base font-bold text-foreground">
            {unit.unit_name}
          </h3>
          <p className="mb-3 text-sm text-muted-foreground">{unit.sub_unit}</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {unit.concepts.slice(0, 4).map((concept) => (
              <span
                key={concept}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {concept}
              </span>
            ))}
          </div>
          {mode === "comp" && unit.problem_count > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{unit.problem_count}문항</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {index + 1}
          </div>
        </div>
      </div>
    </Card>
  );
  if (isLockedByLimit) {
    return (
      <Link href={`/result?lock=${encodeURIComponent(unit.id)}`}>{inner}</Link>
    );
  }
  // 단원 학습지 = 바로 종합 학습지로 (sheet=comp)
  // 연산 문제지 = 단원 페이지에서 양식별 카드 5종 (mode=drill)
  const href =
    mode === "comp"
      ? `/library/${encodeURIComponent(unit.id)}?sheet=comp`
      : `/library/${encodeURIComponent(unit.id)}?mode=drill`;
  return <Link href={href}>{inner}</Link>;
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowLeft, Printer } from "lucide-react";
import { units, getGradeLabel } from "@/lib/data";
import { Suspense } from "react";

function LibraryContent() {
  const searchParams = useSearchParams();
  const grade = parseInt(searchParams.get("grade") || "3");
  const subject = searchParams.get("subject") || "수학";

  const freeUnitsCount = units.filter((u) => u.available).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Link>
          </div>
          <Link href="/" className="text-lg font-bold text-foreground">
            EduQA
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Title Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGradeLabel(grade)} · {subject}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              단원별 학습지를 선택하세요
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary hover:bg-primary/10"
          >
            무료 {freeUnitsCount}/{units.length} 단원
          </Badge>
        </div>

        {/* Unit Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {units.map((unit, index) => (
            <UnitCard key={unit.id} unit={unit} index={index} grade={grade} />
          ))}
        </div>

        {/* Upcoming Section */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            준비 중인 단원
          </h2>
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              추가 단원이 곧 업데이트됩니다
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function UnitCard({
  unit,
  index,
  grade,
}: {
  unit: (typeof units)[0];
  index: number;
  grade: number;
}) {
  const isLocked = !unit.available;

  const cardContent = (
    <Card
      className={`group border border-border p-5 transition-all ${
        isLocked
          ? "bg-muted/30"
          : "cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Unit Name */}
          <h3 className="mb-2 text-base font-bold text-foreground">
            {unit.unit_name}
          </h3>

          {/* Sub Unit */}
          <p className="mb-3 text-sm text-muted-foreground">{unit.sub_unit}</p>

          {/* Standard Code */}
          <Badge
            variant="outline"
            className="mb-3 border-border text-xs font-mono"
          >
            [{unit.standard_code}]
          </Badge>

          {/* Concept Tags */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {unit.concepts.map((concept) => (
              <span
                key={concept}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {concept}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Printer className="h-3.5 w-3.5" />
            <span>{unit.problem_count}문항 · 인쇄 가능</span>
          </div>
        </div>

        {/* Lock Icon or Index */}
        <div className="ml-4">
          {isLocked ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-accent">₩990</span>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {index + 1}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (isLocked) {
    return cardContent;
  }

  return (
    <Link href={`/library/${unit.id}?grade=${grade}`}>{cardContent}</Link>
  );
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

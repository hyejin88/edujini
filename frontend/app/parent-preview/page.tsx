"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, AlertCircle, ArrowRight, Printer } from "lucide-react";
import { computeDiagnosis, type DiagnosisResult } from "@/lib/diagnose";

function gradeLabel(g: number): string {
  if (g <= 6) return `초${g}`;
  if (g <= 9) return `중${g - 6}`;
  return `고${g - 9}`;
}

function gradeFromUnitId(uid: string): number {
  const m = uid.match(/^[a-z]+-(\d+)/i);
  return m ? parseInt(m[1], 10) : 3;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function topErrorLabel(eb: Record<string, number>): string | null {
  const entries = Object.entries(eb).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

const ERROR_GUIDE: Record<string, string> = {
  개념미숙: "기초 개념을 다시 짚어보면 좋아요. 단원 학습 처음부터 천천히 다시.",
  계산실수: "여유를 갖고 한 단계씩 손으로 써가며 풀게 도와주세요.",
  문제해석: "문제를 끝까지 읽고 무엇을 묻는지 표시해보세요.",
  함정미인지: "보기를 끝까지 비교해보고 그림·단위에 함정이 있는지 살피세요.",
};

export default function ParentPreviewPage() {
  const [d, setD] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    setD(computeDiagnosis());
  }, []);

  if (!d) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">리포트 불러오는 중...</p>
      </div>
    );
  }

  if (d.total === 0) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b border-border bg-background no-print">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <Link href="/result" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              진단 결과
            </Link>
            <span className="text-lg font-bold text-foreground">EDU Jini</span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="mb-4 text-lg text-foreground">아직 채점된 학습이 없어요.</p>
          <p className="mb-6 text-sm text-muted-foreground">
            단원 학습을 한 번이라도 풀고 채점하면 학부모 리포트가 자동으로 만들어져요.
          </p>
          <Link href="/library?grade=3&subject=수학&mode=comp">
            <Button>단원 학습 시작하기</Button>
          </Link>
        </main>
      </div>
    );
  }

  const recent = d.recent_session;
  const grade = recent ? gradeFromUnitId(recent.unit_id) : 3;
  const subject = "수학";
  const unitName = recent?.unit_name || "전체 학습";
  const score = recent?.score_pct ?? d.score_pct;
  const correct = recent?.correct ?? d.correct;
  const total = recent?.total ?? d.total;

  const top = topErrorLabel(d.error_breakdown);

  const highlights: string[] = [];
  if (score >= 80) highlights.push("정답률이 안정적이에요. 학습 흐름이 잘 잡혀 있습니다.");
  if (d.weak_units.length === 0 && d.total >= 10) highlights.push("최근 풀이 단원에서 약점이 두드러지지 않아요.");
  if (recent && recent.correct === recent.total) highlights.push("이번 학습에서 모든 문제를 맞혔어요.");
  if (highlights.length === 0) highlights.push("꾸준히 학습 진단을 쌓으면 강점이 더 잘 보여요.");

  const concerns: string[] = [];
  if (top && d.error_breakdown[top] > 0) {
    concerns.push(`${top} 유형 오답이 가장 많아요 — ${ERROR_GUIDE[top] ?? ""}`);
  }
  if (d.weak_units[0]) {
    const w = d.weak_units[0];
    concerns.push(`${w.unit_name} 정답률 ${w.accuracy}% — 같은 단원을 한 번 더 풀어보면 좋아요.`);
  }
  if (concerns.length === 0) {
    concerns.push("특별히 보완할 영역은 보이지 않아요. 같은 학년 다른 단원도 풀어보세요.");
  }

  const nexts: string[] = [];
  if (d.weak_units[0]) {
    nexts.push(`${d.weak_units[0].unit_name} 단원 학습 다시 풀기`);
  }
  if (top === "계산실수") nexts.push("연산 문제(드릴) 30문제 워밍업 후 단원 학습 재도전");
  if (top === "개념미숙" && d.weak_units[0]) nexts.push(`${d.weak_units[0].unit_name} 단원의 핵심 개념 다시 보기`);
  if (nexts.length < 2) nexts.push("다음 학년 단원 미리 보기 (선행 가볍게)");

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      <header className="border-b border-border bg-background no-print">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/result" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            진단 결과
          </Link>
          <span className="text-lg font-bold text-foreground">EDU Jini</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 print:py-0">
        <div className="mb-6 text-center no-print">
          <p className="mb-2 text-sm font-medium text-muted-foreground">학부모 리포트</p>
          <h1 className="text-xl font-bold text-foreground">{todayStr()} 학습 결과</h1>
        </div>

        <Card className="mx-auto max-w-xl border-2 border-border bg-background p-8 shadow-lg print:shadow-none">
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-xs tracking-widest text-muted-foreground">EDU Jini 학습 리포트</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              {gradeLabel(grade)} {subject} · {unitName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{todayStr()} 학습 결과</p>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">학습 요약</h3>
            <div className="rounded-lg bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총점</span>
                <span className="text-2xl font-bold text-primary">{score}점</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">정답률</span>
                <span className="font-medium text-foreground">{correct}/{total} ({score}%)</span>
              </div>
              {d.total !== total && (
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>누적 (전체)</span>
                  <span>{d.correct}/{d.total} ({d.score_pct}%)</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Check className="h-4 w-4 text-green-600" />
              잘한 점
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              보완할 점
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {concerns.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ArrowRight className="h-4 w-4 text-primary" />
              다음 학습 추천
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {nexts.map((n, i) => (
                <li key={i}>{i + 1}. {n}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              EDU Jini · NCIC 성취기준 기반 단원 학습
            </p>
          </div>
        </Card>

        <div className="mt-8 text-center no-print">
          <Button size="lg" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-5 w-5" />
            인쇄 / PDF 저장
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            이 단말의 채점 기록 기반으로 자동 작성됩니다. 회원가입·서버 저장 없음.
          </p>
        </div>
      </main>
    </div>
  );
}

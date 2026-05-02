"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import { computeDiagnosis, type DiagnosisResult, clearAttempts } from "@/lib/diagnose";

const errorTypes = [
  { key: "개념미숙" as const, label: "개념미숙", description: "기초 개념 이해 부족" },
  { key: "계산실수" as const, label: "계산실수", description: "단순 계산 오류" },
  { key: "문제해석" as const, label: "문제해석", description: "문제 이해 오류" },
  { key: "함정미인지" as const, label: "함정미인지", description: "함정 문제 미인지" },
];

export default function ResultPage() {
  const [d, setD] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    setD(computeDiagnosis());
  }, []);

  if (!d) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">진단 불러오는 중...</p>
      </div>
    );
  }

  if (d.total === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Link>
            <span className="text-lg font-bold text-foreground">EDU Jini</span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="mb-4 text-lg text-foreground">아직 채점된 학습이 없어요.</p>
          <p className="mb-6 text-sm text-muted-foreground">
            단원 학습을 풀고 채점하면 학습 진단이 자동으로 만들어져요.
          </p>
          <Link href="/library?grade=3&subject=수학&mode=comp">
            <Button>단원 학습 시작하기</Button>
          </Link>
        </main>
      </div>
    );
  }

  const { score_pct, correct, total, weak_units, error_breakdown, recent_session } = d;
  const wrong = total - correct;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>
          <span className="text-lg font-bold text-foreground">EDU Jini</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Recent session highlight */}
        {recent_session && recent_session.total > 0 && (
          <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
            <p className="text-muted-foreground">방금 푼 학습</p>
            <p className="mt-1 font-semibold text-foreground">
              {recent_session.unit_name} — {recent_session.score_pct}점 (
              {recent_session.correct}/{recent_session.total})
            </p>
          </div>
        )}

        {/* Score Section */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            전체 학습 진단 (누적)
          </p>
          <div className="mb-3">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-7xl font-bold text-transparent">
              {score_pct}
            </span>
            <span className="ml-1 text-2xl text-muted-foreground">점</span>
          </div>
          <p className="text-muted-foreground">
            지금까지 푼 {total}문제 중 {correct}문제 정답
          </p>
        </div>

        {/* Weak Units */}
        {weak_units.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <AlertTriangle className="h-5 w-5 text-accent" />
              보완이 필요한 단원
            </h2>
            <div className="space-y-3">
              {weak_units.map((u) => (
                <Card
                  key={u.unit_id}
                  className="flex items-center justify-between border border-border p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{u.unit_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {u.correct}/{u.total} · 추가 학습 권장
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">{u.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">정답률</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Error Breakdown */}
        {wrong > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              오답 유형 분석
            </h2>
            <Card className="border border-border p-6">
              <div className="grid grid-cols-2 gap-6">
                {errorTypes.map(({ key, label, description }) => {
                  const count = error_breakdown[key] || 0;
                  const percentage = wrong > 0 ? (count / wrong) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {count}문제
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

        {/* Reset / Parent Report */}
        <Card className="border-2 border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                학부모 리포트
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                자녀의 학습 현황과 맞춤형 학습 가이드를 받아보세요.
              </p>
              <Link href="/parent-preview">
                <Button className="bg-amber-500 text-foreground hover:bg-amber-600">
                  학부모 리포트 무료 미리보기
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (confirm("진단 데이터(이 단말의 채점 기록)를 모두 지울까요?")) {
                clearAttempts();
                setD(computeDiagnosis());
              }
            }}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            이 단말의 진단 기록 초기화
          </button>
        </div>
      </main>
    </div>
  );
}

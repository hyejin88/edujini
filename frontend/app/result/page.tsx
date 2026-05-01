"use client";

export const runtime = "edge";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, AlertTriangle } from "lucide-react";

// Mock diagnosis data
const diagnosisData = {
  score: 85,
  correct: 17,
  total: 20,
  weakUnits: [
    { name: "혼합계산", accuracy: 60 },
    { name: "문장제", accuracy: 67 },
    { name: "미지수 계산", accuracy: 75 },
  ],
  errorBreakdown: {
    개념미숙: 1,
    계산실수: 1,
    문제해석: 0,
    함정미인지: 1,
  },
};

const errorTypes = [
  { key: "개념미숙" as const, label: "개념미숙", description: "기초 개념 이해 부족" },
  { key: "계산실수" as const, label: "계산실수", description: "단순 계산 오류" },
  { key: "문제해석" as const, label: "문제해석", description: "문제 이해 오류" },
  { key: "함정미인지" as const, label: "함정미인지", description: "함정 문제 미인지" },
];

export default function ResultPage() {
  const { score, correct, total, weakUnits, errorBreakdown } = diagnosisData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/library?grade=3&subject=수학"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            단원 목록
          </Link>
          <span className="text-lg font-bold text-foreground">EDU Jini</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Score Section */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            학습 진단 결과
          </p>
          <div className="mb-3">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-7xl font-bold text-transparent">
              {score}
            </span>
            <span className="ml-1 text-2xl text-muted-foreground">점</span>
          </div>
          <p className="text-muted-foreground">
            {total}문제 중 {correct}문제 정답
          </p>
        </div>

        {/* Weak Units */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <AlertTriangle className="h-5 w-5 text-accent" />
            보완이 필요한 영역
          </h2>
          <div className="space-y-3">
            {weakUnits.map((unit) => (
              <Card
                key={unit.name}
                className="flex items-center justify-between border border-border p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{unit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    추가 학습이 필요합니다
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">
                    {unit.accuracy}%
                  </p>
                  <p className="text-xs text-muted-foreground">정답률</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Error Breakdown */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            오답 유형 분석
          </h2>
          <Card className="border border-border p-6">
            <div className="grid grid-cols-2 gap-6">
              {errorTypes.map(({ key, label, description }) => {
                const count = errorBreakdown[key];
                const percentage = (count / (total - correct)) * 100 || 0;
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

        {/* Parent Report CTA */}
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
                카카오톡으로 바로 전송해 드립니다.
              </p>
              <Link href="/parent-preview">
                <Button className="bg-amber-500 text-foreground hover:bg-amber-600">
                  학부모 리포트 무료 미리보기
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

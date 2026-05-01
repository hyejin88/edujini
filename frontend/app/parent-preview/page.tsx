"use client";

export const runtime = "edge";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, AlertCircle, ArrowRight, MessageCircle } from "lucide-react";

export default function ParentPreviewPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/result"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            진단 결과
          </Link>
          <span className="text-lg font-bold text-foreground">EDU Jini</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            학부모 리포트 미리보기
          </p>
          <h1 className="text-xl font-bold text-foreground">
            카카오톡으로 전송되는 형식입니다
          </h1>
        </div>

        {/* A4 Report Preview */}
        <Card className="mx-auto max-w-xl border-2 border-border bg-background p-8 shadow-lg">
          {/* Report Header */}
          <div className="mb-6 border-b border-border pb-4">
            <p className="text-xs tracking-widest text-muted-foreground">
              EDU Jini 학습 리포트
            </p>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              초3 수학 · 덧셈과 뺄셈
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              2024년 3월 15일 학습 결과
            </p>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              학습 요약
            </h3>
            <div className="rounded-lg bg-secondary p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총점</span>
                <span className="text-2xl font-bold text-primary">85점</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">정답률</span>
                <span className="font-medium text-foreground">17/20 (85%)</span>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Check className="h-4 w-4 text-green-600" />
              잘한 점
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                기본 덧셈과 뺄셈 연산을 정확하게 수행합니다
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                받아올림과 받아내림 개념을 잘 이해하고 있습니다
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                세 자리 수 계산에 자신감이 있습니다
              </li>
            </ul>
          </div>

          {/* Concerns */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              보완할 점
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                문장제 문제에서 연산 순서를 혼동하는 경향이 있습니다
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                함정 문제를 놓치지 않도록 문제를 끝까지 읽는 습관이 필요합니다
              </li>
            </ul>
          </div>

          {/* Next Actions */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ArrowRight className="h-4 w-4 text-primary" />
              다음 학습 추천
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>1. 문장제 문제 집중 연습 (혼합계산 단원)</li>
              <li>2. 미지수 계산 복습</li>
              <li>3. 덧셈과 뺄셈 심화 문제 도전</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-6 border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              EDU Jini · NCIC 성취기준 기반 학습지
            </p>
          </div>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="gap-2 bg-[#FEE500] text-foreground hover:bg-[#FDD800]"
          >
            <MessageCircle className="h-5 w-5" />
            카카오톡으로 받기
          </Button>
          <p className="mt-3 text-sm text-muted-foreground">
            현재는 무료 미리보기. 추후 카카오톡 자동 전송 추가 예정.
          </p>
        </div>
      </main>
    </div>
  );
}

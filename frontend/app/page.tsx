"use client";

export const runtime = "edge";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";

const grades = [
  { value: 1, label: "초1" },
  { value: 2, label: "초2" },
  { value: 3, label: "초3" },
  { value: 4, label: "초4" },
  { value: 5, label: "초5" },
  { value: 6, label: "초6" },
  { value: 7, label: "중1" },
  { value: 8, label: "중2" },
  { value: 9, label: "중3" },
  { value: 10, label: "고1" },
];

const subjects = [
  { value: "수학", label: "수학" },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState<number | null>(3);
  const [selectedSubject, setSelectedSubject] = useState<string>("수학");

  const goLibrary = (mode: "comp" | "drill") => {
    if (selectedGrade && selectedSubject) {
      router.push(
        `/library?grade=${selectedGrade}&subject=${selectedSubject}&mode=${mode}`
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            오늘의 학습,{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              골라보세요
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            단원별 학습부터 매일 새 연산 문제까지.
            <br className="hidden sm:block" />
            우리 아이 학년에 맞춰 바로 풀고 즉시 채점해요.
          </p>

          {/* Grade Picker */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-foreground">학년 선택</p>
            <div className="flex flex-wrap justify-center gap-2">
              {grades.map((grade) => (
                <button
                  key={grade.value}
                  onClick={() => setSelectedGrade(grade.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedGrade === grade.value
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:border-primary"
                  }`}
                >
                  {grade.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Picker */}
          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-foreground">과목 선택</p>
            <div className="flex justify-center gap-2">
              {subjects.map((subject) => (
                <button
                  key={subject.value}
                  onClick={() => setSelectedSubject(subject.value)}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                    selectedSubject === subject.value
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground hover:border-primary"
                  }`}
                >
                  {subject.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons — 두 갈래 */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => goLibrary("comp")}
              size="lg"
              className="group bg-primary px-8 text-base font-semibold hover:bg-primary/90"
            >
              단원 학습 보기
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              onClick={() => goLibrary("drill")}
              size="lg"
              variant="outline"
              className="group border-2 px-8 text-base font-semibold"
            >
              연산 문제 보기
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            단원 학습 = 객관식·서술형 + 즉시 채점 · 연산 문제 = 가로식·세로식 반복 드릴
          </p>
        </div>
      </section>

      {/* Free Tier Section */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "매일 새 문제", desc: "연산 드릴은 단원·날짜로 매번 새 숫자" },
              { title: "즉시 채점", desc: "정답·오답 유형까지 한 번에 표시" },
              { title: "회원가입 없이", desc: "지금 바로 풀고, 마음에 들면 인쇄해요" },
            ].map((item) => (
              <Card key={item.title} className="border border-border p-6 text-left">
                <p className="text-base font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="border-y border-border bg-secondary py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <blockquote className="text-xl font-medium text-foreground md:text-2xl">
            &ldquo;공부방 20만원짜리보다 자세하대요&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">
            - 초등 3학년 학부모
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-2 text-sm font-medium text-foreground">EDU Jini</p>
          <p className="mb-4 text-sm text-muted-foreground">
            NCIC 성취기준 기반 체계적인 학습
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="/about" className="hover:text-foreground">운영자 정보</a>
            <span>·</span>
            <a href="/privacy" className="hover:text-foreground">개인정보처리방침</a>
            <span>·</span>
            <a href="/terms" className="hover:text-foreground">이용약관</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

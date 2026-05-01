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

  const handleCTA = () => {
    if (selectedGrade && selectedSubject) {
      router.push(`/library?grade=${selectedGrade}&subject=${selectedSubject}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-4 text-sm font-medium tracking-wide text-muted-foreground">
            NCIC 성취기준 기반 학습지
          </p>
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            단원별 학습지를{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              초1~고3 전 단원
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            교육과정에 맞춘 체계적인 학습지. AI 자동 채점·해설 + A4 인쇄.
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

          {/* CTA Button */}
          <Button
            onClick={handleCTA}
            size="lg"
            className="group bg-primary px-8 text-base font-semibold hover:bg-primary/90"
          >
            단원 학습지 보기
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Free Tier Section */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "전 학년·전 과목", desc: "초1~고3 NCIC 성취기준 기반" },
              { title: "단원당 20문항", desc: "AI 자동 채점 + 단계별 해설" },
              { title: "A4 인쇄·PDF", desc: "학습지 그대로 출력 가능" },
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
          <p className="mb-2 text-sm font-medium text-foreground">Edujini</p>
          <p className="mb-4 text-sm text-muted-foreground">
            NCIC 성취기준 기반 체계적인 학습지
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span>고객센터</span>
            <span>·</span>
            <span>이용약관</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

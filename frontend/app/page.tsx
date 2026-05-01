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
              무료로 60문항
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            초등학교 1학년부터 고등학교 3학년까지, 교육과정에 맞춘 체계적인
            학습지를 인쇄하여 사용하세요.
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

      {/* Pricing Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center text-2xl font-bold text-foreground">
            학습 요금제
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            필요한 만큼만 선택하세요
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Free Plan */}
            <Card className="border border-border p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground">무료</p>
                <p className="text-3xl font-bold text-foreground">₩0</p>
              </div>
              <p className="mb-6 text-2xl font-semibold text-foreground">
                60문항 체험
              </p>
              <ul className="mb-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  단원당 20문항 제공
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  3개 단원 무료 이용
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  인쇄/PDF 다운로드
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  자동 채점 및 해설
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                시작하기
              </Button>
            </Card>

            {/* Unit Pack */}
            <Card className="relative border-2 border-primary p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                인기
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground">단원 정복</p>
                <p className="text-3xl font-bold text-foreground">₩990</p>
              </div>
              <p className="mb-6 text-2xl font-semibold text-foreground">
                단원 정복 팩
              </p>
              <ul className="mb-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  선택 단원 전체 문항
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  심화 문제 포함
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  상세 오답 분석
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  학부모 리포트
                </li>
              </ul>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                구매하기
              </Button>
            </Card>

            {/* Weekly Unlimited */}
            <Card className="border border-border p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground">무제한</p>
                <p className="text-3xl font-bold text-foreground">₩2,900</p>
              </div>
              <p className="mb-6 text-2xl font-semibold text-foreground">
                1주 무제한
              </p>
              <ul className="mb-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  전 학년 전 과목
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  모든 단원 이용
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  무제한 인쇄
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  우선 고객지원
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                구매하기
              </Button>
            </Card>
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
            <span>7일 환불 보장</span>
            <span>·</span>
            <span>고객센터</span>
            <span>·</span>
            <span>이용약관</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

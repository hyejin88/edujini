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
      {/* Hero Section — 옅은 하늘 그라디언트 (캐릭터 청록 톤) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E5F4FC] via-[#F4FAFD] to-white py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="EDU Jini — 초등학생 연산·학습 문제 제공"
            className="mx-auto mb-4 h-48 w-auto md:h-56"
          />
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            오늘의 학습,{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              골라보세요
            </span>
          </h1>
          <p className="mx-auto mb-3 max-w-2xl text-lg text-muted-foreground">
            <strong className="text-foreground">아이 오답 유형까지 분석해서 다음 문제를 골라주는</strong>{" "}
            <span className="whitespace-nowrap">무료 학습 사이트</span>
          </p>
          <p className="mx-auto mb-10 max-w-2xl text-sm text-muted-foreground">
            회원가입 없이 즉시 풀이 · 진단 결과는 카톡 공유 링크로 가족과 나눔
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
            단원 학습으로 약점 진단 · 연산 문제로 매일 30문제 반복 연습
          </p>
        </div>
      </section>

      {/* Free Tier Section */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "오답 유형 자동 분석", desc: "왜 틀렸는지(개념·계산·꼼꼼함) 4가지 유형으로 분류해서 다음 학습을 추천해요" },
              { title: "학교 진도와 정확히 맞춰요", desc: "교과서 단원·NCIC 성취기준 그대로. 매일 새 30문제 + 즉시 채점" },
              { title: "회원가입 없이", desc: "이 단말 안에서 진단 누적, 카톡 공유 링크로 가족과 나누기 — 가입·로그인 없음" },
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

      {/* AI 진단 미리보기 — 풀어보지 않은 사용자에게 결과물이 어떤지 보여주기 */}
      <section className="border-y border-border bg-secondary/30 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              EDU Jini가 자녀에게 보여주는 결과
            </p>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              풀고 나면 이런 학부모 리포트가 자동 생성돼요
            </h2>
          </div>

          <Card className="mx-auto max-w-2xl border-2 border-border bg-background p-6 shadow-sm">
            <div className="mb-4 border-b border-border pb-3">
              <p className="text-xs tracking-widest text-muted-foreground">
                EDU Jini 학습 리포트 — 미리보기
              </p>
              <p className="mt-1 font-semibold text-foreground">
                초3 수학 · 곱셈 단원 · 19/20 정답
              </p>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-foreground">잘한 점</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>· 받아올림 없는 두 자리 곱셈을 빠르게 풀었어요</li>
                <li>· 문장제에서 식 세우기까지 스스로 해냈어요</li>
              </ul>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-foreground">보완할 점</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>· 받아올림 2번 있는 곱셈에서 자릿값 정렬을 자주 놓쳐요</li>
                <li>· 함정 문제(단위 다른 비교)를 끝까지 안 읽는 경향</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">
                다음 학습 추천
              </p>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. 곱셈 단원 받아올림 2번 양식 30문제 워밍업</li>
                <li>2. (두 자리)×(두 자리) 단원 학습 재도전</li>
                <li>3. 문장제 끝까지 읽기 습관 만들기</li>
              </ol>
            </div>
          </Card>

          <p className="mx-auto mt-6 max-w-xl text-center text-sm text-muted-foreground">
            정답률만 알려주는 다른 학습지와 달리, <strong className="text-foreground">왜 틀렸는지</strong>까지 짚어주고
            <strong className="text-foreground"> 다음 학습</strong>을 추천해요.
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

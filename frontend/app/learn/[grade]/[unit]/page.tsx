import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brand } from "@/components/Brand";
import { ArrowLeft, ArrowRight, AlertCircle, Check } from "lucide-react";
import { findLearnUnit, LEARN_UNITS } from "@/lib/learn-units";

export const dynamic = "force-static";

// alias도 정적 prerender → /learn/grade-3/fraction 도 빌드됨 (canonical은 fraction-decimal)
const ALIAS_PARAMS: { grade: string; unit: string }[] = [
  // 흔한 영문 검색 변형들 — findLearnUnit이 자동 매칭
  ...["fraction", "fractions", "decimal"].flatMap((s) => [{ grade: "grade-3", unit: s }]),
  ...["fraction", "fractions"].flatMap((s) => [{ grade: "grade-4", unit: s }, { grade: "grade-5", unit: s }, { grade: "grade-6", unit: s }]),
  ...["multiplication", "times-table"].map((s) => ({ grade: "grade-2", unit: s })),
  ...["multiplication"].flatMap((s) => [{ grade: "grade-3", unit: s }, { grade: "grade-4", unit: s }]),
  ...["division"].flatMap((s) => [{ grade: "grade-3", unit: s }, { grade: "grade-4", unit: s }, { grade: "grade-6", unit: s }]),
  ...["addition", "subtraction"].flatMap((s) => [
    { grade: "grade-1", unit: s }, { grade: "grade-2", unit: s }, { grade: "grade-3", unit: s },
  ]),
  { grade: "grade-5", unit: "factors" },
  { grade: "grade-5", unit: "multiples" },
  { grade: "grade-6", unit: "ratio" },
  { grade: "grade-6", unit: "percentage" },
];

export async function generateStaticParams() {
  const canonical = LEARN_UNITS.map((u) => ({ grade: `grade-${u.grade}`, unit: u.slug }));
  // 중복 제거 (alias가 canonical과 겹칠 수 있음)
  const seen = new Set(canonical.map((p) => `${p.grade}/${p.unit}`));
  const aliases = ALIAS_PARAMS.filter((p) => !seen.has(`${p.grade}/${p.unit}`));
  return [...canonical, ...aliases];
}

function parseGrade(g: string): number | null {
  const m = g.match(/^grade-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string; unit: string }>;
}): Promise<Metadata> {
  const { grade: gradeStr, unit: slug } = await params;
  const grade = parseGrade(gradeStr);
  if (!grade) return {};
  const u = findLearnUnit(grade, slug);
  if (!u) return {};

  const title = `초${grade} 수학 ${u.unit_name} — EDU Jini`;
  const desc = `${u.short_description}. 학교 진도 그대로, 자녀가 어디서 막히는지 자동 진단해요. 회원가입 없이 무료.`;
  return {
    title,
    description: desc,
    keywords: [
      `초${grade} 수학`,
      `초${grade} ${u.unit_name}`,
      `${u.unit_name} 학습지`,
      `${u.unit_name} 무료`,
      ...u.search_intents,
    ],
    openGraph: {
      title,
      description: desc,
      url: `https://edujini.pages.dev/learn/grade-${grade}/${slug}`,
      type: "article",
    },
  };
}

export default async function LearnUnitPage({
  params,
}: {
  params: Promise<{ grade: string; unit: string }>;
}) {
  const { grade: gradeStr, unit: slug } = await params;
  const grade = parseGrade(gradeStr);
  if (!grade) notFound();
  const u = findLearnUnit(grade, slug);
  if (!u) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href={`/learn/grade-${grade}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            초{grade} 단원 목록
          </Link>
          <Brand />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            초{grade} 수학 · {u.semester}학기 · 무료
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {u.unit_name}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {u.short_description}
          </p>
        </div>

        {/* 본문 설명 */}
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            이 단원, 무엇을 배우나요?
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {u.long_description}
          </p>
        </section>

        {/* 자주 막히는 부분 */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            <AlertCircle className="h-5 w-5 text-accent" />
            자녀가 자주 막히는 부분
          </h2>
          <Card className="border border-border p-6">
            <ul className="space-y-3">
              {u.common_struggles.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              EDU Jini는 위 패턴을 자동으로 진단해서 어디서 막혔는지 알려드려요.
            </p>
          </Card>
        </section>

        {/* EDU Jini 차별화 */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            EDU Jini는 어떻게 도와주나요?
          </h2>
          <div className="space-y-3">
            {[
              { title: "선택형·서술형 20문항", desc: "학교 진도 그대로, 객관식과 단답형이 섞여 사고력까지 평가" },
              { title: "AI 자동 채점 + 4축 오답 분석", desc: "단순 정답률이 아니라 왜 틀렸는지(개념·계산·문제해석·꼼꼼함) 분류" },
              { title: "학부모 리포트 자동 생성", desc: "잘한 점·보완할 점·다음 학습 추천까지 한 페이지에" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Card className="border-2 border-primary/30 bg-gradient-to-b from-secondary/50 to-white p-6 text-center">
          <p className="mb-2 text-sm text-muted-foreground">회원가입 없이 지금 바로</p>
          <h3 className="mb-4 text-xl font-bold text-foreground">
            {u.unit_name} 학습 시작하기
          </h3>
          <Link href={`/library/${u.unit_id}?sheet=comp`}>
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
              단원 학습 시작
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            연산 반복 연습도 함께 →{" "}
            <Link href={`/library/${u.unit_id}?mode=drill`} className="underline">
              연산 문제 보기
            </Link>
          </p>
        </Card>

        {/* 관련 단원 */}
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            초{grade} 다른 단원
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            {LEARN_UNITS.filter((x) => x.grade === grade && x.slug !== u.slug)
              .slice(0, 4)
              .map((x) => (
                <Link
                  key={x.slug}
                  href={`/learn/grade-${x.grade}/${x.slug}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition hover:border-primary"
                >
                  <span className="text-foreground">{x.unit_name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
          </div>
        </section>

        {/* NCIC 코드 */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          NCIC 2022 개정 교육과정 성취기준: {u.ncic_codes.join(", ")}
        </p>
      </main>
    </div>
  );
}

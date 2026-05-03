import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Brand } from "@/components/Brand";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { unitsByGrade, LEARN_UNITS } from "@/lib/learn-units";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const grades = Array.from(new Set(LEARN_UNITS.map((u) => u.grade)));
  return grades.map((g) => ({ grade: `grade-${g}` }));
}

function parseGrade(g: string): number | null {
  const m = g.match(/^grade-(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string }>;
}): Promise<Metadata> {
  const { grade: gradeStr } = await params;
  const grade = parseGrade(gradeStr);
  if (!grade) return {};
  const units = unitsByGrade(grade);
  if (units.length === 0) return {};

  const title = `초${grade} 수학 단원 학습 — EDU Jini`;
  const desc = `초${grade} 수학 ${units.length}개 단원을 NCIC 성취기준 그대로. 자녀가 어디서 막히는지 자동 진단 + 학부모 리포트. 회원가입 없이 무료.`;
  return {
    title,
    description: desc,
    keywords: [
      `초${grade} 수학`,
      `초${grade} 수학 학습지`,
      `초${grade} 단원평가`,
      ...units.flatMap((u) => u.search_intents),
    ],
    openGraph: {
      title,
      description: desc,
      url: `https://edujini.pages.dev/learn/grade-${grade}`,
      type: "article",
    },
  };
}

export default async function GradeIndexPage({
  params,
}: {
  params: Promise<{ grade: string }>;
}) {
  const { grade: gradeStr } = await params;
  const grade = parseGrade(gradeStr);
  if (!grade) notFound();
  const units = unitsByGrade(grade);
  if (units.length === 0) notFound();

  // 학기별 그룹핑
  const byseme = units.reduce<Record<number, typeof units>>((acc, u) => {
    (acc[u.semester] = acc[u.semester] || []).push(u);
    return acc;
  }, {});

  const pageUrl = `https://edujini.pages.dev/learn/grade-${grade}`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `초${grade} 수학 단원 학습`,
    description: `초${grade} 수학 ${units.length}개 단원 — NCIC 성취기준 기반 무료 학습.`,
    url: pageUrl,
    inLanguage: "ko",
    isPartOf: {
      "@type": "WebSite",
      name: "EDU Jini",
      url: "https://edujini.pages.dev",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: units.length,
      itemListElement: units.map((u, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://edujini.pages.dev/learn/grade-${u.grade}/${u.slug}`,
        name: u.unit_name,
      })),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://edujini.pages.dev/" },
      { "@type": "ListItem", position: 2, name: `초${grade} 수학`, item: pageUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>
          <Brand />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            초{grade} 수학 · 무료 학습
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            초{grade} 수학 단원 학습
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            교과서 단원·NCIC 성취기준에 맞춰 {units.length}개 단원을 무료로 학습할 수 있어요.
            아이가 어디서 막히는지 자동으로 짚어드리고, 다음에 풀면 좋은 단원도 추천해요.
          </p>
        </div>

        {Object.keys(byseme).sort().map((semStr) => {
          const sem = parseInt(semStr, 10);
          const list = byseme[sem];
          return (
            <section key={sem} className="mb-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground">
                {sem}학기 ({list.length}단원)
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((u) => (
                  <Link
                    key={u.slug}
                    href={`/learn/grade-${u.grade}/${u.slug}`}
                    className="group block"
                  >
                    <Card className="h-full border border-border p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-sm">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {u.unit_name}
                        </h3>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-sm text-muted-foreground">{u.short_description}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* 다른 학년 */}
        <section className="mt-12 border-t border-border pt-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">다른 학년 보기</h2>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].filter((g) => g !== grade).map((g) => (
              <Link
                key={g}
                href={`/learn/grade-${g}`}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-primary hover:bg-secondary"
              >
                초{g}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

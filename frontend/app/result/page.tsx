"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle, Check, AlertCircle, ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { computeDiagnosis, type DiagnosisResult, clearAttempts } from "@/lib/diagnose";
import { fetchParentReportV2, makeUserId, type ParentReport } from "@/lib/client";
import { track } from "@vercel/analytics";

const errorTypes = [
  { key: "개념미숙" as const, label: "개념미숙", description: "기초 개념 이해 부족" },
  { key: "계산실수" as const, label: "계산실수", description: "단순 계산 오류" },
  { key: "문제해석" as const, label: "문제해석", description: "문제 이해 오류" },
  { key: "함정미인지" as const, label: "함정미인지", description: "함정 문제 미인지" },
];

const ERROR_GUIDE: Record<string, string> = {
  개념미숙: "기초 개념을 다시 짚어보면 좋아요. 단원 학습 처음부터 천천히 다시.",
  계산실수: "여유를 갖고 한 단계씩 손으로 써가며 풀게 도와주세요.",
  문제해석: "문제를 끝까지 읽고 무엇을 묻는지 표시해보세요.",
  함정미인지: "보기를 끝까지 비교해보고 그림·단위에 함정이 있는지 살피세요.",
};

function topErrorLabel(eb: Record<string, number>): string | null {
  const entries = Object.entries(eb).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function formatElapsed(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
}

// 학부모 리포트 캐시 (Gemini 호출 비용 절감)
const REPORT_CACHE_KEY = "edujini_parent_report_v1";
const REPORT_CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

interface CachedReport {
  ts: number;
  hash: string; // 진단 데이터 변경 감지
  source: "gemini" | "template";
  report: ParentReport;
}

// 진단 데이터 → 안정적 hash. 서버측 sha256 결과와 일치할 필요 없고,
// 변경 감지에만 쓰므로 길이+JSON 단순 fold 로 충분.
function diagHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return `c${(h >>> 0).toString(16)}`;
}

function loadCachedReport(): CachedReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REPORT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedReport;
    if (!parsed?.ts || !parsed.report) return null;
    if (Date.now() - parsed.ts > REPORT_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedReport(c: CachedReport) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export default function ResultPage() {
  const [d, setD] = useState<DiagnosisResult | null>(null);
  const [aiReport, setAiReport] = useState<ParentReport | null>(null);
  const [aiSource, setAiSource] = useState<"gemini" | "template" | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const diagnosis = computeDiagnosis();
    setD(diagnosis);
    if (diagnosis.total > 0) {
      track("result_view", {
        total: diagnosis.total,
        score_pct: diagnosis.score_pct,
        weak_units: diagnosis.weak_units.length,
      });
    }
  }, []);

  // 학부모 리포트 (Gemini) 자동 호출 — 진단이 충분히 쌓였을 때만
  useEffect(() => {
    if (!d || d.total < 5) return;

    // payload 압축 — top 3 weak_units, recent_session 핵심만
    const payload = {
      diagnosis: {
        total: d.total,
        correct: d.correct,
        score_pct: d.score_pct,
        weak_units: d.weak_units.slice(0, 3).map((u) => ({
          unit_id: u.unit_id,
          unit_name: u.unit_name,
          accuracy: u.accuracy,
          total: u.total,
          correct: u.correct,
        })),
        error_breakdown: d.error_breakdown,
        recent_session: d.recent_session
          ? {
              unit_id: d.recent_session.unit_id,
              unit_name: d.recent_session.unit_name,
              score_pct: d.recent_session.score_pct,
              correct: d.recent_session.correct,
              total: d.recent_session.total,
              source: d.recent_session.source,
              sheet_title: d.recent_session.sheet_title,
            }
          : null,
      },
    };

    const hash = diagHash(JSON.stringify(payload.diagnosis));

    // 캐시 hit (1시간 + 동일 hash) → 재호출 skip
    const cached = loadCachedReport();
    if (cached && cached.hash === hash) {
      setAiReport(cached.report);
      setAiSource(cached.source);
      return;
    }

    let cancelled = false;
    setAiLoading(true);
    (async () => {
      try {
        const uid = makeUserId();
        const env = await fetchParentReportV2(uid, payload);
        if (cancelled) return;
        setAiReport(env.report);
        setAiSource(env.source);
        saveCachedReport({
          ts: Date.now(),
          hash,
          source: env.source,
          report: env.report,
        });
      } catch {
        // 실패 → 기존 클라이언트 템플릿 fallback (UI 별도 처리)
        if (!cancelled) {
          setAiReport(null);
          setAiSource(null);
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [d]);

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
            <Brand />
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
  const top = topErrorLabel(error_breakdown);
  // 방금 푼 학습이 통과 수준(90점+) — 그러면 "다시 풀기" 권장 안 함
  const recentMastered = !!recent_session && recent_session.score_pct >= 90;
  // 추천 단원 = 방금 푼 단원이 통과 수준이면 *다른* 약점 단원, 아니면 첫 약점 단원
  const recommendUnit = recentMastered
    ? weak_units.find((u) => u.unit_id !== recent_session?.unit_id) ?? null
    : weak_units[0] ?? null;
  // 학년 추출 (디폴트 3) — recent_session.unit_id 우선
  const recentGrade = ((): number => {
    const m = recent_session?.unit_id?.match(/^[a-z]+-(\d+)/i);
    return m ? parseInt(m[1], 10) : 3;
  })();

  // 학부모 리포트 자동 생성 ─ 진단 데이터 기반
  const highlights: string[] = [];
  if (recentMastered) {
    highlights.push(`${recent_session!.unit_name} 단원에서 ${recent_session!.score_pct}점 — 잘했어요!`);
  }
  if (score_pct >= 80) highlights.push("정답률이 안정적이에요. 학습 흐름이 잘 잡혀 있습니다.");
  if (weak_units.length === 0 && total >= 10) highlights.push("최근 풀이 단원에서 약점이 두드러지지 않아요.");
  if (recent_session && recent_session.correct === recent_session.total) highlights.push("이번 학습에서 모든 문제를 맞혔어요.");
  if (highlights.length === 0) highlights.push("꾸준히 학습 진단을 쌓으면 강점이 더 잘 보여요.");

  const concerns: string[] = [];
  // 오답 유형은 2건 이상일 때만 (1건은 우연성 높음)
  if (top && error_breakdown[top] >= 2) concerns.push(`${top} 유형 오답이 가장 많아요 — ${ERROR_GUIDE[top] ?? ""}`);
  // 약점 단원은 정답률 80% 미만일 때만 (학년별 임계치 통과해도 80% 이상이면 "잘하는 편")
  if (recommendUnit && recommendUnit.accuracy < 80) {
    concerns.push(`${recommendUnit.unit_name} 정답률 ${recommendUnit.accuracy}% — 같은 단원을 한 번 더 풀어보면 좋아요.`);
  }
  if (concerns.length === 0) concerns.push("특별히 보완할 영역은 보이지 않아요. 같은 학년 다른 단원도 풀어보세요.");

  // 다음 학습 추천 — 텍스트 + 클릭 가능 링크 (있을 때만)
  type NextItem = { text: string; href?: string };
  const nexts: NextItem[] = [];
  if (recentMastered) {
    // 방금 풀이가 통과 수준 — 다음 도전
    if (recommendUnit) {
      nexts.push({
        text: `${recommendUnit.unit_name} 단원도 도전해 보세요`,
        href: `/library/${encodeURIComponent(recommendUnit.unit_id)}?sheet=comp`,
      });
    } else {
      nexts.push({
        text: "같은 학년 다른 단원도 도전해 보세요",
        href: `/library?grade=${recentGrade}&subject=수학&mode=comp`,
      });
    }
  } else if (recommendUnit) {
    nexts.push({
      text: `${recommendUnit.unit_name} 단원 학습 다시 풀기`,
      href: `/library/${encodeURIComponent(recommendUnit.unit_id)}?sheet=comp`,
    });
  }
  if (top === "계산실수" && recommendUnit) {
    nexts.push({
      text: `${recommendUnit.unit_name} 연산 문제 20문제 워밍업`,
      href: `/library/${encodeURIComponent(recommendUnit.unit_id)}?mode=drill`,
    });
  } else if (top === "계산실수" && !recentMastered) {
    nexts.push({ text: "연산 문제로 워밍업 후 단원 학습 재도전", href: `/library?grade=${recentGrade}&subject=수학&mode=drill` });
  }
  if (top === "개념미숙" && recommendUnit) {
    nexts.push({ text: `${recommendUnit.unit_name} 단원의 핵심 개념 다시 보기`, href: `/library/${encodeURIComponent(recommendUnit.unit_id)}?sheet=comp` });
  }
  if (nexts.length < 2) {
    nexts.push({ text: "다른 단원도 풀어보기", href: `/library?grade=${recentGrade}&subject=수학&mode=comp` });
  }

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
          <Brand />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Recent session highlight */}
        {recent_session && recent_session.total > 0 && (
          <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
            <p className="text-muted-foreground">방금 푼 학습</p>
            <p className="mt-1 font-semibold text-foreground">
              {recent_session.unit_name} — {recent_session.score_pct}점 ({recent_session.correct}/{recent_session.total})
              {recent_session.elapsed_ms !== undefined && recent_session.elapsed_ms > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  · 풀이 시간 {formatElapsed(recent_session.elapsed_ms)}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Score Section */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium text-muted-foreground">전체 학습 진단 (누적)</p>
          <div className="mb-3">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-7xl font-bold text-transparent">
              {score_pct}
            </span>
            <span className="ml-1 text-2xl text-muted-foreground">점</span>
          </div>
          <p className="text-muted-foreground">지금까지 푼 {total}문제 중 {correct}문제 정답</p>
        </div>

        {/* Weak Units — 클릭으로 바로 다시 풀기 */}
        {weak_units.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <AlertTriangle className="h-5 w-5 text-accent" />
              보완이 필요한 단원
            </h2>
            <div className="space-y-3">
              {weak_units.map((u) => (
                <Link
                  key={u.unit_id}
                  href={`/library/${encodeURIComponent(u.unit_id)}?sheet=comp`}
                  className="block"
                >
                  <Card className="flex items-center justify-between border border-border p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">{u.unit_name}</p>
                      <p className="text-sm text-muted-foreground">{u.correct}/{u.total} · 다시 풀러 가기 →</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">{u.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">정답률</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Error Breakdown */}
        {wrong > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-foreground">오답 유형 분석</h2>
            <Card className="border border-border p-6">
              <div className="grid grid-cols-2 gap-6">
                {errorTypes.map(({ key, label, description }) => {
                  const count = error_breakdown[key] || 0;
                  const percentage = wrong > 0 ? (count / wrong) * 100 : 0;
                  return (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <span className="text-sm text-muted-foreground">{count}문제</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        )}

        {/* 학부모 리포트 (Gemini V2 통합 + 템플릿 fallback) */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">학부모 리포트</h2>
            {aiSource === "gemini" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                선생님이 직접 작성
              </span>
            )}
          </div>
          <Card className="border border-border p-6">
            {aiLoading && !aiReport ? (
              // 로딩 상태 — skeleton
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : aiReport ? (
              <>
                {/* Gemini 응답 — subject + summary */}
                {aiReport.subject && (
                  <p className="mb-1 text-sm font-semibold text-foreground">{aiReport.subject}</p>
                )}
                {aiReport.summary && (
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{aiReport.summary}</p>
                )}

                {/* 잘한 점 */}
                {aiReport.highlights && aiReport.highlights.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Check className="h-4 w-4 text-green-600" />
                      잘한 점
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {aiReport.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 보완할 점 */}
                {aiReport.concerns && aiReport.concerns.length > 0 && (
                  <div className="mb-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      보완할 점
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {aiReport.concerns.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 약점 인사이트 (axis_insight) — 4축 분포 해석 */}
                {aiReport.axis_insight && (
                  <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
                    <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                      약점 인사이트
                    </h3>
                    <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                      {aiReport.axis_insight}
                    </p>
                  </div>
                )}

                {/* 다음 학습 추천 — Gemini next_action + 기존 CTA 링크 모두 보존 */}
                <div className="mb-5 rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    다음 학습 추천
                  </h3>
                  {aiReport.next_action && (
                    <p className="mb-3 text-sm text-foreground">{aiReport.next_action}</p>
                  )}
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {nexts.map((n, i) => (
                      <li key={i}>
                        <span className="mr-1">{i + 1}.</span>
                        {n.href ? (
                          <Link href={n.href} className="text-primary underline-offset-4 hover:underline">
                            {n.text} →
                          </Link>
                        ) : (
                          n.text
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 선생님 한마디 (teacher_note) */}
                {aiReport.teacher_note && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                      <MessageCircle className="h-4 w-4" />
                      선생님 한마디
                    </h3>
                    <p className="text-sm leading-relaxed text-foreground">{aiReport.teacher_note}</p>
                  </div>
                )}
              </>
            ) : (
              // Fallback — 기존 클라이언트 텍스트 템플릿 그대로
              <>
                <div className="mb-5">
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

                <div className="mb-5">
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
                      <li key={i}>
                        <span className="mr-1">{i + 1}.</span>
                        {n.href ? (
                          <Link href={n.href} className="text-primary underline-offset-4 hover:underline">
                            {n.text} →
                          </Link>
                        ) : (
                          n.text
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </Card>
        </section>

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

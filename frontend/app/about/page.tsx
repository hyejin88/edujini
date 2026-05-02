import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "운영자 정보 - EDU Jini",
  description: "EDU Jini 운영자 정보. 서비스 소개, 연락처, 콘텐츠 정책.",
};

export default function AboutPage() {
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

      <main className="mx-auto max-w-3xl px-4 py-12 prose prose-sm md:prose-base">
        <h1>운영자 정보</h1>

        <h2>서비스 소개</h2>
        <p>
          EDU Jini는 초1~초6 단원별 수학 학습지를 NCIC 성취기준에 맞춰 무료로 제공하는 서비스입니다.
          AI 자동 채점·단계별 해설·4축 오답 진단까지 한 번에 제공합니다.
        </p>

        <h2>운영 모델</h2>
        <ul>
          <li>1인 운영 + Claude(개발/QA) + Gemini(콘텐츠 생성)</li>
          <li><strong>Phase 1 (현재)</strong>: 회원가입 없이 모든 콘텐츠 무료. 광고 수익으로 운영비 충당. 학습 기록은 사용 단말 안에서만 누적(외부 서버 미전송).</li>
          <li><strong>Phase 2 (예정)</strong>: 학부모용 프리미엄(주간 코치 리포트 등) 도입 검토. 결제 시점에만 학부모 본인 인증 — 자녀가 직접 가입할 수 있는 절차는 영구히 두지 않습니다.</li>
          <li>사업자 미등록 부트스트랩 (수익 발생 시 개인사업자 등록 검토)</li>
        </ul>

        <h2>콘텐츠 출처</h2>
        <ul>
          <li><strong>80%</strong> 자체 생성 (Gemini AI 기반, 출판사 본문 복제 없음)</li>
          <li><strong>15%</strong> 공공 기출문제 (시·도교육청 학력평가, 한국교육과정평가원)</li>
          <li><strong>5%</strong> EBS 메타데이터 큐레이션 (외부 링크)</li>
        </ul>

        <h2>연락처</h2>
        <ul>
          <li>이메일: <a href="mailto:hello@edujini.pages.dev">hello@edujini.pages.dev</a> (예정, 정혜진이 활성 시점에 갱신)</li>
          <li>저작권 신고·서비스 문의·광고 문의 모두 위 이메일로 접수</li>
          <li>응답 시간: 평일 24시간 내</li>
        </ul>

        <h2>관련 페이지</h2>
        <ul>
          <li><Link href="/privacy">개인정보처리방침</Link></li>
          <li><Link href="/terms">이용약관</Link></li>
        </ul>
      </main>
    </div>
  );
}

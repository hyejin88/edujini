import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "이용약관 - EDU Jini",
  description: "EDU Jini 서비스 이용약관. 서비스 범위, 콘텐츠 라이선스, 면책 조항.",
};

export default function TermsPage() {
  const today = "2026년 5월 1일";
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
        <h1>이용약관</h1>
        <p className="text-sm text-muted-foreground">시행일자: {today}</p>

        <h2>1. 서비스 정의</h2>
        <p>
          EDU Jini는 NCIC 성취기준 기반 K-12 단원별 수학 학습지 + AI 자동 채점·해설 서비스입니다.
          현재 Phase 1으로 모든 콘텐츠를 무료 제공하며, 운영비는 광고 수익으로 충당합니다.
        </p>

        <h2>2. 콘텐츠 라이선스</h2>
        <ul>
          <li>
            EDU Jini가 제공하는 학습지 본문·해설은 자체 제작 콘텐츠 또는 공공저작물(시·도교육청 학력평가, KICE)에 기반합니다.
          </li>
          <li>출판사 본문을 복제하지 않으며, 출판사 상표를 표시하지 않습니다.</li>
          <li>
            사용자는 학습지를 개인·교육 목적으로 인쇄·복제할 수 있습니다.
            다만 영리 목적 재배포·재판매는 금지합니다.
          </li>
        </ul>

        <h2>3. 사용자 의무</h2>
        <ul>
          <li>서비스 안정성을 해치는 자동화 도구 사용 금지.</li>
          <li>타인을 비방하거나 부적절한 신고를 반복하는 행위 금지.</li>
          <li>학습지 콘텐츠를 영리 목적으로 재배포·재판매하지 않을 것.</li>
        </ul>

        <h2>4. 서비스 변경·중단</h2>
        <p>
          운영자는 사전 공지 후 서비스 일부 또는 전체를 변경·중단할 수 있습니다.
          무료 서비스 특성상 보상 의무는 없으며, 가능한 한 7일 이상 유예기간을 둡니다.
        </p>

        <h2>5. 면책</h2>
        <ul>
          <li>학습지 콘텐츠는 학습 보조 자료로, 정답·해설의 절대 정확성을 보장하지 않습니다.</li>
          <li>오류 발견 시 운영자에게 알려주시면 수정하겠습니다.</li>
          <li>서비스 중단·데이터 휘발로 인한 손해에 대해 책임지지 않습니다.</li>
        </ul>

        <h2>6. 광고</h2>
        <p>
          EDU Jini는 Google AdSense 광고를 노출합니다. 학습지·진단 결과·학부모 리포트 페이지에는 광고를 게재하지 않으며,
          단원 라이브러리 페이지 하단에 1개 슬롯만 운영합니다.
        </p>

        <h2>7. 저작권 신고</h2>
        <p>
          본인 저작물이 무단 사용되었다고 판단되시면 <Link href="/about">운영자 정보</Link>의 연락처로 신고해 주십시오.
          24시간 내 1차 응답하며, 사실관계 확인 후 해당 콘텐츠를 비공개·삭제 처리합니다.
        </p>

        <h2>8. 분쟁 해결</h2>
        <p>
          본 약관과 관련된 분쟁은 대한민국 법률을 따르며, 정혜진의 주소지를 관할하는 법원을 합의관할로 합니다.
        </p>
      </main>
    </div>
  );
}

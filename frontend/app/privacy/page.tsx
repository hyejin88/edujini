import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "개인정보처리방침 - EDU Jini",
  description: "EDU Jini 개인정보처리방침. 수집 항목, 이용 목적, 보유 기간, 광고·분석 도구 사용 내역.",
};

export default function PrivacyPage() {
  const today = "2026년 5월 2일";
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
        <h1>개인정보처리방침</h1>
        <p className="text-sm text-muted-foreground">시행일자: {today}</p>

        <h2>1. 수집 항목</h2>
        <p>
          EDU Jini는 <strong>회원가입 없이</strong> 사용 가능하며, 자녀 이름·전화번호·이메일 등 개인 식별 정보를
          입력받지 않습니다. 다음 정보만 자동 수집·생성합니다.
        </p>
        <ul>
          <li><strong>익명 사용자 ID</strong> — 브라우저 localStorage에 무작위 8자 문자열 (예: <code>u_abc12345</code>). 식별 정보 아님.</li>
          <li><strong>풀이 기록</strong> — 단원·문항·답·정답 여부·오답 유형. 브라우저 localStorage(<code>edujini_attempts_v1</code>)에만 저장. 외부 서버 전송 X.</li>
          <li><strong>풀이한 단원 목록</strong> — localStorage(<code>edujini_played_units</code>).</li>
          <li><strong>마지막 선택 학년</strong> — localStorage(<code>edujini_last_grade</code>) 재방문 편의용.</li>
          <li><strong>접속 로그</strong> — Cloudflare가 IP·User-Agent를 보안 목적으로 자동 수집·익명화 처리.</li>
          <li><strong>광고 쿠키</strong> — Google AdSense가 광고 노출·빈도 제어를 위해 익명 쿠키 사용 (자세한 내용은 3항).</li>
        </ul>

        <h2>2. 이용 목적</h2>
        <ul>
          <li>학습 진단·약점 단원 추천</li>
          <li>학부모 리포트 자동 생성 (선택)</li>
          <li>서비스 품질 개선 및 트래픽 분석</li>
          <li>광고 노출 (Google AdSense)</li>
        </ul>

        <h2>3. 제3자 제공·위탁</h2>
        <ul>
          <li><strong>Google Gemini API</strong> — 풀이 결과 텍스트(개인 식별 불가)를 4축 오답 라벨링·해설 생성에 활용.</li>
          <li><strong>Google AdSense</strong> — 광고 노출. 비개인화 광고 우선.</li>
          <li><strong>Cloudflare</strong> — 호스팅·CDN.</li>
          <li>사용자가 직접 입력하는 식별 정보는 수집·전송하지 않습니다.</li>
        </ul>

        <h2>4. 보유 기간</h2>
        <ul>
          <li>localStorage 데이터 — 사용자가 브라우저에서 삭제할 때까지.</li>
          <li>인메모리 풀이 기록 — Cloudflare Worker cold-start 시 자동 휘발 (수 시간 단위).</li>
          <li>접속 로그 — Cloudflare 정책에 따라 30일 이내 익명화 보관.</li>
        </ul>

        <h2>5. 어린이 개인정보 보호</h2>
        <p>
          EDU Jini는 초등학생(만 6~13세) 학습 서비스이므로 정보통신망법 및 COPPA를 준수합니다.
        </p>
        <ul>
          <li>회원가입·이메일·전화번호 등 <strong>개인 식별 정보를 수집하지 않습니다</strong>.</li>
          <li>자녀가 직접 가입할 수 있는 절차가 없으므로 법정대리인 동의 절차도 적용되지 않습니다.</li>
          <li>AdSense는 사이트 단위로 <strong>"어린이 대상" 처리</strong>되어 맞춤형 광고·행동 추적이 차단되며, 비개인화 광고만 노출됩니다.</li>
          <li>유료 서비스 도입 시(Phase 2) 결제 단계에서만 학부모(보호자) 본인 인증을 받을 예정이며, 자녀 직접 가입은 영구히 받지 않습니다.</li>
        </ul>

        <h2>6. 사용자 권리</h2>
        <ul>
          <li>localStorage 삭제로 풀이 기록을 즉시 삭제할 수 있습니다 (브라우저 설정 → 사이트 데이터 삭제).</li>
          <li>광고 비활성화: 브라우저의 광고 차단 도구를 사용할 수 있습니다.</li>
        </ul>

        <h2>7. 개정</h2>
        <p>본 방침이 개정될 경우 메인 페이지 공지 후 7일 이상 유예기간을 둡니다.</p>

        <h2>8. 문의</h2>
        <p>
          개인정보 관련 문의: <Link href="/about">운영자 정보</Link> 페이지의 연락처로 연락 부탁드립니다.
        </p>
      </main>
    </div>
  );
}

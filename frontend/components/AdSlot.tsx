"use client";

import { useEffect, useRef } from "react";

// AdSense 광고 슬롯
// 1. 정혜진이 https://www.google.com/adsense 가입
// 2. 사이트 등록 + 검토 통과 (1~2주)
// 3. Cloudflare Pages 환경변수에 NEXT_PUBLIC_ADSENSE_CLIENT 추가 (예: ca-pub-1234567890)
// 4. 슬롯 ID는 props로 전달 (대시보드에서 슬롯 생성 후 받음)
//
// 환경변수 미설정 또는 미승인 상태에선 placeholder UI만 노출 (AdSense 정책 위반 회피)
export function AdSlot({
  slot,
  format = "auto",
  className = "",
}: {
  slot?: string;
  format?: "auto" | "fluid" | "horizontal" | "rectangle";
  className?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const enabled = Boolean(client && slot);

  useEffect(() => {
    if (!enabled) return;
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 푸시 실패 무시 (정책 위반 X)
    }
  }, [enabled]);

  if (!enabled) {
    // Placeholder — 가입·승인 전까지 표시. 실제 운영에선 AdSense가 채움.
    return (
      <div
        className={`flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-xs text-gray-400 ${className}`}
        aria-hidden="true"
      >
        광고 영역 (AdSense 승인 후 자동 노출)
      </div>
    );
  }

  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className}`}
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

// AdSense 글로벌 스크립트 — layout에서 한 번만 주입
export function AdSenseScript() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}

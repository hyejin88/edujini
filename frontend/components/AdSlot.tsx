"use client";

import { useEffect, useRef } from "react";

// AdSense client ID — EDU Jini 정혜진 계정 (공개 정보, 환경변수로 override 가능)
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-4995246987313839";

// AdSense 광고 슬롯
// - 사이트 소유권 확인용 스크립트는 layout.tsx의 <AdSenseScript />에서 자동 주입
// - 광고 단위(slot) ID는 props로 전달 (AdSense 승인 후 광고 단위 생성해서 받음)
// - slot 미설정 시 placeholder UI만 표시 (정책 위반 회피)
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
  const enabled = Boolean(slot);

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
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

// AdSense 글로벌 스크립트 — layout에서 한 번만 주입
// 사이트 소유권 확인 + 광고 로드 베이스. 광고 단위 없어도 사이트 등록 검토는 진행됨.
export function AdSenseScript() {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}

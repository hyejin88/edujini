// Shared cross-module types.
// 클라이언트·서버에서 공통으로 쓰는 데이터 모양만 모음.

// PARENT_REPORT_SYSTEM (gemini.ts) 의 JSON 스키마와 1:1 매핑.
// 일부 필드는 V1 호환을 위해 optional 로 두고, 화면에서 fallback 처리.
export interface ParentReport {
  subject: string;
  summary: string;
  highlights: string[];
  concerns: string[];
  axis_insight?: string;
  next_action: string;
  teacher_note?: string;
}

// /api/report/[userId] 응답 envelope.
export interface ParentReportEnvelope {
  report: ParentReport;
  source: "gemini" | "template";
  // 진단 데이터 변경 감지용 hash (client cache 무효화에 사용)
  diagnosis_hash?: string;
}

// /api/report/[userId] 요청 body — client diagnosis (localStorage) 를 그대로 압축 전달.
export interface ParentReportRequest {
  child_name?: string;
  // computeDiagnosis() 결과의 핵심 부분만 추려 보냄 (payload 절약)
  diagnosis: {
    total: number;
    correct: number;
    score_pct: number;
    weak_units: {
      unit_id: string;
      unit_name: string;
      accuracy: number;
      total: number;
      correct: number;
    }[];
    error_breakdown: Record<string, number>;
    recent_session: {
      unit_id: string;
      unit_name: string;
      score_pct: number;
      correct: number;
      total: number;
      source?: "comp" | "drill";
      sheet_title?: string;
    } | null;
    // 4축 비율 (%) — Gemini 가 axis_insight 작성 시 직접 활용
    axis_pct?: Record<string, number>;
  };
}

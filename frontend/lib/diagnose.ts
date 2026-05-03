// 클라이언트 사이드 학습 진단 — localStorage 기반 (회원가입 없는 PoC)
// _comp.tsx 채점 시 saveAttempts() 호출 → /result에서 computeDiagnosis() 사용

const KEY = "edujini_attempts_v1";

export interface AttemptRecord {
  problem_id: string;
  unit_id: string;
  unit_name: string;
  subject: string;
  user_answer: string;
  is_correct: boolean;
  error_label: string | null;
  correct_answer?: string;
  created_at: string;
  // 출처 구분 — 진단 분석 시 분리
  source?: "comp" | "drill";
  // 드릴 전용 메타
  sheet_id?: string;
  sheet_title?: string;
  pool_key?: string;
  // 풀이 소요 시간(ms) — 한 세션 내 모든 record 동일값
  elapsed_ms?: number;
}

export interface DiagnosisResult {
  total: number;
  correct: number;
  score_pct: number;
  weak_units: {
    unit_id: string;
    unit_name: string;
    subject: string;
    accuracy: number; // 0~100
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
    elapsed_ms?: number;
  } | null;
  // 연산 양식별 진단
  weak_drill_sheets: {
    unit_id: string;
    unit_name: string;
    sheet_id: string;
    sheet_title: string;
    accuracy: number;
    total: number;
    correct: number;
  }[];
  drill_total: number;
  drill_correct: number;
  comp_total: number;
  comp_correct: number;
}

export function loadAttempts(): AttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveAttempts(attempts: AttemptRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadAttempts();
    // 가장 최근 100세션 유지 (단원 학습 1회당 ~20문항)
    const merged = [...existing, ...attempts].slice(-2000);
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
}

export function clearAttempts() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}


export function computeDiagnosis(scope?: { unitId?: string; lastN?: number }): DiagnosisResult {
  let atts = loadAttempts();
  if (scope?.unitId) atts = atts.filter((a) => a.unit_id === scope.unitId);
  if (scope?.lastN && scope.lastN > 0) atts = atts.slice(-scope.lastN);

  const total = atts.length;
  const correct = atts.filter((a) => a.is_correct).length;
  const score_pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // 단원별 집계
  const byUnit = new Map<
    string,
    { correct: number; total: number; unit_name: string; subject: string }
  >();
  for (const a of atts) {
    const u = byUnit.get(a.unit_id) || {
      correct: 0,
      total: 0,
      unit_name: a.unit_name,
      subject: a.subject,
    };
    u.total += 1;
    if (a.is_correct) u.correct += 1;
    byUnit.set(a.unit_id, u);
  }

  // 진단 임계값 (수학 교사 권고):
  // - 단원 학습 (개념 이해): 초1~2 65% / 초3~4 70% / 초5~6 75%
  // - 드릴 (절차 숙달): 일률 80% (mastery learning, Bloom)
  // - 표본: 8문항 이상 (5는 우연 오답 1개로 라벨 뒤집힘 위험)
  const MIN_ATTEMPTS = 8;
  const DRILL_THRESHOLD = 80;
  const compThreshold = (grade: number) =>
    grade <= 2 ? 65 : grade >= 5 ? 75 : 70;
  const gradeFromUid = (uid: string): number => {
    const m = uid.match(/^[a-z]+-(\d+)/i);
    return m ? parseInt(m[1], 10) : 3;
  };

  const weak = [...byUnit.entries()]
    .map(([uid, u]) => ({
      unit_id: uid,
      unit_name: u.unit_name,
      subject: u.subject,
      accuracy: u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0,
      total: u.total,
      correct: u.correct,
    }))
    .filter((u) => u.accuracy < compThreshold(gradeFromUid(u.unit_id)) && u.total >= MIN_ATTEMPTS)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  // 오답 유형 분포
  const eb: Record<string, number> = {
    개념미숙: 0,
    계산실수: 0,
    문제해석: 0,
    함정미인지: 0,
  };
  for (const a of atts) {
    if (!a.is_correct && a.error_label) {
      eb[a.error_label] = (eb[a.error_label] || 0) + 1;
    }
  }

  // 가장 최근 세션 (마지막 단원/양식의 마지막 시도들)
  let recent: DiagnosisResult["recent_session"] = null;
  if (atts.length > 0) {
    const last = atts[atts.length - 1];
    const lastSource = last.source;
    const lastSheetId = last.sheet_id;
    const lastUnit = last.unit_id;
    // 드릴이면 sheet_id 단위, 종합이면 unit_id 단위로 묶기
    const lastAtts =
      lastSource === "drill" && lastSheetId
        ? atts.filter((a) => a.sheet_id === lastSheetId).slice(-30)
        : atts.filter((a) => a.unit_id === lastUnit && (a.source ?? "comp") === (lastSource ?? "comp")).slice(-30);
    const c = lastAtts.filter((a) => a.is_correct).length;
    recent = {
      unit_id: lastUnit,
      unit_name: lastAtts[0]?.unit_name || "",
      total: lastAtts.length,
      correct: c,
      score_pct: lastAtts.length > 0 ? Math.round((c / lastAtts.length) * 100) : 0,
      source: lastSource,
      sheet_title: last.sheet_title,
      elapsed_ms: last.elapsed_ms,
    };
  }

  // source별 통계 + 양식별 약점
  const compAtts = atts.filter((a) => (a.source ?? "comp") === "comp");
  const drillAtts = atts.filter((a) => a.source === "drill");
  const comp_total = compAtts.length;
  const comp_correct = compAtts.filter((a) => a.is_correct).length;
  const drill_total = drillAtts.length;
  const drill_correct = drillAtts.filter((a) => a.is_correct).length;

  // 양식별 집계 (드릴 한정)
  const bySheet = new Map<
    string,
    {
      unit_id: string;
      unit_name: string;
      sheet_id: string;
      sheet_title: string;
      correct: number;
      total: number;
    }
  >();
  for (const a of drillAtts) {
    if (!a.sheet_id) continue;
    const key = `${a.unit_id}::${a.sheet_id}`;
    const s = bySheet.get(key) || {
      unit_id: a.unit_id,
      unit_name: a.unit_name,
      sheet_id: a.sheet_id,
      sheet_title: a.sheet_title || a.sheet_id,
      correct: 0,
      total: 0,
    };
    s.total += 1;
    if (a.is_correct) s.correct += 1;
    bySheet.set(key, s);
  }
  const weak_drill_sheets = [...bySheet.values()]
    .map((s) => ({
      ...s,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .filter((s) => s.accuracy < DRILL_THRESHOLD && s.total >= MIN_ATTEMPTS)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  return {
    total,
    correct,
    score_pct,
    weak_units: weak,
    error_breakdown: eb,
    recent_session: recent,
    weak_drill_sheets,
    drill_total,
    drill_correct,
    comp_total,
    comp_correct,
  };
}

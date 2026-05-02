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
  } | null;
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

  const weak = [...byUnit.entries()]
    .map(([uid, u]) => ({
      unit_id: uid,
      unit_name: u.unit_name,
      subject: u.subject,
      accuracy: u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0,
      total: u.total,
      correct: u.correct,
    }))
    .filter((u) => u.accuracy < 100)
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

  // 가장 최근 세션 (마지막 단원의 마지막 시도들)
  let recent: DiagnosisResult["recent_session"] = null;
  if (atts.length > 0) {
    const lastUnit = atts[atts.length - 1].unit_id;
    const lastAtts = atts.filter((a) => a.unit_id === lastUnit).slice(-30);
    const c = lastAtts.filter((a) => a.is_correct).length;
    recent = {
      unit_id: lastUnit,
      unit_name: lastAtts[0]?.unit_name || "",
      total: lastAtts.length,
      correct: c,
      score_pct: lastAtts.length > 0 ? Math.round((c / lastAtts.length) * 100) : 0,
    };
  }

  return {
    total,
    correct,
    score_pct,
    weak_units: weak,
    error_breakdown: eb,
    recent_session: recent,
  };
}

// Browser API client (calls /api/* same origin)
// Used by client components.

export interface UnitDTO {
  id: string;
  subject: string;
  grade: number;
  unit_name: string;
  sub_unit: string;
  standard_code: string;
  concepts: string[];
  problem_count: number;
  available: boolean;
}

export interface ProblemDTO {
  id: string;
  subject: string;
  grade: number;
  unit_id: string;
  unit_name: string;
  publisher: string;
  type: "multiple_choice" | "short_answer";
  difficulty: number;
  body: string;
  choices?: string[] | null;
  concept_tags: string[];
  answer?: string;
  explanation?: string;
}

export async function fetchUnits(grade: number, subject = "수학"): Promise<UnitDTO[]> {
  const r = await fetch(`/api/units?grade=${grade}&subject=${encodeURIComponent(subject)}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error("단원 불러오기 실패");
  return r.json();
}

export async function fetchUnitProblems(
  unitId: string,
  limit = 20,
  includeAnswers = false
): Promise<ProblemDTO[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (includeAnswers) params.set("include_answers", "true");
  const r = await fetch(
    `/api/units/${encodeURIComponent(unitId)}/problems?${params}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error("문항 불러오기 실패");
  return r.json();
}

export interface BatchGradeResult {
  total: number;
  correct: number;
  score_pct: number;
  error_breakdown: Record<string, number>;
  results: {
    problem_id: string;
    correct: boolean;
    correct_answer: string;
    explanation: string;
    error_label: string | null;
  }[];
}

export async function gradeBatch(
  userId: string,
  answers: { problem_id: string; user_answer: string }[]
): Promise<BatchGradeResult> {
  const r = await fetch("/api/grade", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user_id: userId, answers }),
  });
  if (!r.ok) throw new Error("채점 실패");
  return r.json();
}

export interface DiagnosisResp {
  user_id: string;
  total: number;
  correct: number;
  score_pct: number;
  weak_units: {
    unit_id: string;
    unit_name: string;
    subject: string;
    accuracy: number;
    total: number;
    correct: number;
  }[];
  error_breakdown: Record<string, number>;
}

export async function getDiagnosis(userId: string): Promise<DiagnosisResp> {
  const r = await fetch(`/api/diagnose/${userId}`, { cache: "no-store" });
  if (!r.ok) throw new Error("진단 실패");
  return r.json();
}

export interface ParentReportResp {
  diagnosis: DiagnosisResp;
  source: "gemini" | "template";
  report: {
    subject: string;
    summary: string;
    highlights: string[];
    concerns: string[];
    next_action: string;
  };
}

export async function getParentReport(
  userId: string,
  childName = "OO"
): Promise<ParentReportResp> {
  const r = await fetch(
    `/api/report/${userId}?child_name=${encodeURIComponent(childName)}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error("리포트 실패");
  return r.json();
}

export function makeUserId(): string {
  if (typeof window === "undefined") return "anon";
  let id = window.localStorage.getItem("edujini_uid");
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem("edujini_uid", id);
  }
  return id;
}

export function getPlayedUnits(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("edujini_played_units") || "[]");
  } catch {
    return [];
  }
}

export function recordPlayedUnit(unitId: string) {
  if (typeof window === "undefined") return;
  try {
    const arr = getPlayedUnits();
    if (!arr.includes(unitId)) arr.push(unitId);
    window.localStorage.setItem("edujini_played_units", JSON.stringify(arr));
  } catch {}
}

export const FREE_UNIT_LIMIT = 3;

// Static seed data + in-memory attempt log (per-deployment, ephemeral).
// For PoC. Migrate to Cloudflare KV / D1 / Supabase later.

import seedData from "./seed.json";
import unitsData from "./units.json";

export interface SeedProblem {
  id: string;
  subject: string;
  grade: number;
  unit_id: string;
  unit_name: string;
  sub_unit?: string;
  publisher: string;
  type: "multiple_choice" | "short_answer";
  difficulty: number;
  body: string;
  choices?: string[] | null;
  answer: string;
  answer_aliases?: string[];
  explanation: string;
  concept_tags?: string[];
  common_errors?: { label: string; wrong_answer?: string; reason?: string }[];
  license_code?: string;
  is_published?: boolean;
  standard_code?: string;
}

export interface SeedUnit {
  id: string;
  subject: string;
  grade: number;
  semester?: number;
  unit_no?: number;
  unit_name: string;
  sub_unit: string;
  standard_code: string;
  standard_text?: string;
  concepts: string[];
}

// PoC Phase 1.5 단원 화이트리스트 — 3학년 1단원(덧셈과 뺄셈)만 게시.
// 나머지 단원은 v3 보강 후 순차 활성화.
const PUBLISHED_UNITS = new Set<string>([
  "math-3-1-1", // 덧셈과 뺄셈
]);

// 콘텐츠 품질 게이트 — v3 재생성 전까지 임시 필터:
//  · 단원 화이트리스트
//  · 본문 250자 초과
//  · KaTeX 텍스트 도형 (\\begin{array}, ⋅⟶⟷)
//  · 마크다운 다중 bullet 대화
//  · 보기에 도형 묘사 / 80자 초과 / 보기 중복 노출 (본문 안에 ① ② ③ ④ 패턴)
function isPublishable(p: SeedProblem): boolean {
  if (!PUBLISHED_UNITS.has(p.unit_id)) return false;
  const body = p.body || "";
  if (body.length > 250) return false;
  if (/\\begin\{array\}/.test(body)) return false;
  if (/[⟶⟷]/.test(body)) return false;
  if ((body.match(/⋅/g) || []).length >= 2) return false;
  if ((body.match(/\*\s+[가-힣]+:/g) || []).length >= 3) return false;
  // 보기 번호가 본문에 중복 노출된 케이스 (LLM이 본문에 ① ② ③ ④ + choices에 또 추가)
  if ((body.match(/[①②③④⑤]/g) || []).length >= 3) return false;
  for (const c of p.choices || []) {
    if (/\\begin\{array\}/.test(c)) return false;
    if (/[⟶⟷⋅]{2,}/.test(c)) return false;
    if (c.length > 80) return false;
  }
  return true;
}

export const SEED_PROBLEMS: SeedProblem[] = (seedData as SeedProblem[]).filter(
  isPublishable
);
export const SEED_UNITS: SeedUnit[] = unitsData as SeedUnit[];

const BY_ID = new Map<string, SeedProblem>(SEED_PROBLEMS.map((p) => [p.id, p]));

export function getProblem(id: string): SeedProblem | undefined {
  return BY_ID.get(id);
}

export function listProblemsByUnit(unitId: string, limit = 20): SeedProblem[] {
  const items = SEED_PROBLEMS.filter((p) => p.unit_id === unitId);
  items.sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id));
  return items.slice(0, limit);
}

export function listUnits(grade: number, subject = "수학") {
  return SEED_UNITS.filter((u) => u.grade === grade && u.subject === subject).map(
    (u) => {
      const problemCount = SEED_PROBLEMS.filter((p) => p.unit_id === u.id).length;
      return {
        ...u,
        problem_count: problemCount,
        available: problemCount > 0,
      };
    }
  );
}

export function isCorrect(p: SeedProblem, userAnswer: string): boolean {
  const ua = userAnswer.trim();
  const candidates = [
    String(p.answer || "").trim(),
    ...((p.answer_aliases || []).map((a) => String(a).trim())),
  ];
  if (candidates.includes(ua)) return true;
  // 숫자만 비교 (단위·기호 무시)
  const norm = (s: string) =>
    s
      .replace(/[^\d./-]/g, "")
      .replace(/^[+-]/, "");
  const userNorm = norm(ua);
  if (userNorm) {
    for (const c of candidates) {
      if (norm(c) === userNorm) return true;
    }
  }
  return false;
}

export function heuristicErrorLabel(
  p: SeedProblem,
  userAnswer: string
): string {
  for (const ce of p.common_errors || []) {
    if (
      ce.wrong_answer &&
      String(ce.wrong_answer).trim() === userAnswer.trim()
    ) {
      return ce.label || "계산실수";
    }
  }
  return "계산실수";
}

// In-memory attempt log (resets per cold start — fine for PoC + free Cloudflare/Vercel)
type Attempt = {
  user_id: string;
  problem_id: string;
  user_answer: string;
  is_correct: boolean;
  error_label: string | null;
  created_at: string;
};
const ATTEMPTS: Attempt[] = [];
const ATTEMPTS_BY_USER = new Map<string, Attempt[]>();

export function recordAttempt(a: Omit<Attempt, "created_at">): Attempt {
  const rec: Attempt = { ...a, created_at: new Date().toISOString() };
  ATTEMPTS.push(rec);
  const arr = ATTEMPTS_BY_USER.get(a.user_id) || [];
  arr.push(rec);
  ATTEMPTS_BY_USER.set(a.user_id, arr);
  return rec;
}

export function diagnoseUser(userId: string) {
  const atts = ATTEMPTS_BY_USER.get(userId) || [];
  if (atts.length === 0) {
    return {
      user_id: userId,
      total: 0,
      correct: 0,
      score_pct: 0,
      weak_units: [],
      error_breakdown: {},
    };
  }
  const total = atts.length;
  const correct = atts.filter((a) => a.is_correct).length;
  const unitMap = new Map<
    string,
    { correct: number; total: number; unit_name: string; subject: string }
  >();
  for (const a of atts) {
    const p = BY_ID.get(a.problem_id);
    if (!p) continue;
    const u = unitMap.get(p.unit_id) || {
      correct: 0,
      total: 0,
      unit_name: p.unit_name,
      subject: p.subject,
    };
    u.total += 1;
    if (a.is_correct) u.correct += 1;
    unitMap.set(p.unit_id, u);
  }
  const weak: any[] = [];
  for (const [uid, u] of unitMap.entries()) {
    const acc = u.total ? u.correct / u.total : 0;
    if (acc < 1) {
      weak.push({
        unit_id: uid,
        unit_name: u.unit_name,
        subject: u.subject,
        accuracy: Math.round(acc * 100) / 100,
        total: u.total,
        correct: u.correct,
      });
    }
  }
  weak.sort((a, b) => a.accuracy - b.accuracy);

  const eb: Record<string, number> = {};
  for (const a of atts) {
    if (!a.is_correct && a.error_label) {
      eb[a.error_label] = (eb[a.error_label] || 0) + 1;
    }
  }

  return {
    user_id: userId,
    total,
    correct,
    score_pct: Math.round((correct / total) * 100),
    weak_units: weak.slice(0, 3),
    error_breakdown: eb,
  };
}

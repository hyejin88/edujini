// 드릴 학습지 자동 생성 — Gemini 호출 0, 클라이언트 사이드.
// 매번 호출 시 새 숫자. 1번 문제는 정답 시범 (학생이 양식 학습).

import type { SheetMeta } from "./sheets";

export interface DrillProblem {
  index: number; // 1부터 시작
  is_example: boolean; // true = 정답 시범
  op: "+" | "-";
  operands: number[];
  answer: number;
  // 시각용
  digits: [number, number];
  carry?: "none" | "once" | "any";
}

// 시드 가능한 PRNG (단원·학습지 ID + 날짜로 매일 새 학습지)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function range(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function digitMin(d: number): number {
  return d <= 1 ? 0 : Math.pow(10, d - 1);
}
function digitMax(d: number): number {
  return Math.pow(10, d) - 1;
}

// 받아올림 발생 여부 검사 (세로 덧셈)
function hasCarry(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

// 받아내림 발생 여부 검사 (세로 뺄셈)
function hasBorrow(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if (a % 10 < b % 10) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

export function generateDrill(sheet: SheetMeta): DrillProblem[] {
  const seed = hashCode(`${sheet.unit_id}::${sheet.id}::${todayKey()}`);
  const rng = mulberry32(seed);
  const [d1, d2] = sheet.digits || [3, 3];
  const op: "+" | "-" =
    sheet.type === "drill_h_sub" || sheet.type === "drill_v_sub" ? "-" : "+";

  const list: DrillProblem[] = [];
  let attempts = 0;
  while (list.length < sheet.problem_count && attempts < sheet.problem_count * 50) {
    attempts++;
    const a = range(rng, digitMin(d1), digitMax(d1));
    const b = range(rng, digitMin(d2), digitMax(d2));
    if (op === "-" && a < b) continue; // 음수 방지

    // carry 조건 검사
    if (sheet.carry === "none") {
      if (op === "+" && hasCarry(a, b)) continue;
      if (op === "-" && hasBorrow(a, b)) continue;
    } else if (sheet.carry === "once") {
      if (op === "+" && !hasCarry(a, b)) continue;
      if (op === "-" && !hasBorrow(a, b)) continue;
    } else if (sheet.carry === "any") {
      // 50% 비율로 carry/no-carry 섞기 — 단조 회피
      const want = list.length % 2 === 0;
      if (op === "+" && hasCarry(a, b) !== want && list.length < sheet.problem_count - 4) continue;
      if (op === "-" && hasBorrow(a, b) !== want && list.length < sheet.problem_count - 4) continue;
    }

    list.push({
      index: list.length + 1,
      is_example: list.length === 0,
      op,
      operands: [a, b],
      answer: op === "+" ? a + b : a - b,
      digits: [d1, d2],
      carry: sheet.carry,
    });
  }
  return list;
}

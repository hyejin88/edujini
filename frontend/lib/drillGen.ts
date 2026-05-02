// 드릴 학습지 생성 — drill_pools.json에서 시드 기반 N개 추출.
// Gemini 호출 0, 25만 문제 사전 빌드 풀 활용. 매일 새 학습지.

import type { SheetMeta } from "./sheets";
import poolsRaw from "./drill_pools.json";

type PoolItem =
  | { op: "+" | "-" | "×"; a: number; b: number; ans: number }
  | { op: "÷"; a: number; b: number; ans: number; r?: number }
  | { op: "frac_add" | "frac_sub"; d: number; a: number; b: number; ans_num: number; ans_den: number }
  | { op: "decompose"; n: number; a: number; b: number }
  | { op: "make_ten" | "break_ten"; a: number; ans: number }
  | { op: "three"; a: number; b: number; c: number; ops: "+-" | "-+"; ans: number };

const POOLS = poolsRaw as Record<string, PoolItem[]>;

export interface DrillProblem {
  index: number; // 1부터 시작
  is_example: boolean;
  op: string; // "+" | "-" | "×" | "÷" | "frac_add" | "frac_sub" | "decompose" | "make_ten" | "break_ten" | "three"
  operands: number[]; // 보편적 표현 (덧/뺄/곱: [a,b], 나눗셈: [a,b], 분수: [a,d,b,d], decompose: [n,a,b], three: [a,b,c])
  answer: number; // 주 답 (분수: 분자 / decompose: a / three: ans)
  // 추가 필드
  remainder?: number;
  ans_den?: number; // 분수 답 분모
  ops_str?: string; // 세 수 연산자
  // 시각용
  digits?: [number, number];
  carry?: "none" | "once" | "any";
  raw?: PoolItem; // 렌더러 직접 사용
}

// 시드 가능한 PRNG
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

// Fisher-Yates 셔플 (시드 가능)
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolItemToProblem(item: PoolItem): Omit<DrillProblem, "index" | "is_example"> {
  if (item.op === "+" || item.op === "-" || item.op === "×") {
    return {
      op: item.op,
      operands: [item.a, item.b],
      answer: item.ans,
      raw: item,
    };
  }
  if (item.op === "÷") {
    return {
      op: "÷",
      operands: [item.a, item.b],
      answer: item.ans,
      remainder: item.r,
      raw: item,
    };
  }
  if (item.op === "frac_add" || item.op === "frac_sub") {
    return {
      op: item.op,
      operands: [item.a, item.d, item.b, item.d],
      answer: item.ans_num,
      ans_den: item.ans_den,
      raw: item,
    };
  }
  if (item.op === "decompose") {
    return {
      op: "decompose",
      operands: [item.n, item.a, item.b],
      answer: item.a,
      raw: item,
    };
  }
  if (item.op === "make_ten" || item.op === "break_ten") {
    return {
      op: item.op,
      operands: [item.a],
      answer: item.ans,
      raw: item,
    };
  }
  if (item.op === "three") {
    return {
      op: "three",
      operands: [item.a, item.b, item.c],
      answer: item.ans,
      ops_str: item.ops,
      raw: item,
    };
  }
  // fallthrough
  return {
    op: "?",
    operands: [],
    answer: 0,
    raw: item,
  };
}

export function generateDrill(sheet: SheetMeta): DrillProblem[] {
  const poolKey = sheet.pool_key;
  const pool = poolKey ? POOLS[poolKey] : undefined;
  const seed = hashCode(`${sheet.unit_id}::${sheet.id}::${todayKey()}`);
  const rng = mulberry32(seed);

  // 풀 없으면 빈 배열 (호출처에서 빈 상태 핸들링)
  if (!pool || pool.length === 0) {
    return [];
  }

  // 풀에서 problem_count 만큼 시드 기반 추출 — Fisher-Yates 부분 셔플
  const N = sheet.problem_count;
  const picked: PoolItem[] = [];
  if (pool.length <= N) {
    picked.push(...shuffle(pool, rng));
    while (picked.length < N) picked.push(pool[Math.floor(rng() * pool.length)]);
  } else {
    const idxs = new Set<number>();
    while (idxs.size < N) {
      idxs.add(Math.floor(rng() * pool.length));
    }
    for (const i of idxs) picked.push(pool[i]);
    // 추출 결과도 한 번 더 셔플 (순서 다양성)
    picked.splice(0, picked.length, ...shuffle(picked, rng));
  }

  const list: DrillProblem[] = picked.map((item, i) => {
    const base = poolItemToProblem(item);
    return {
      ...base,
      index: i + 1,
      is_example: i === 0,
      digits: sheet.digits,
      carry: sheet.carry,
    };
  });
  return list;
}

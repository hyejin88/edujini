// 드릴 학습지 생성 — public/pools/<pool_key>.json에서 시드 기반 N개 추출.
// 양식별 풀 1만개 (총 35만 문제), 페이지에서 필요한 풀만 fetch.

import type { SheetMeta } from "./sheets";
import poolIndex from "./drill_pools_index.json";

type PoolItem =
  | { op: "+" | "-" | "×"; a: number; b: number; ans: number }
  | { op: "÷"; a: number; b: number; ans: number; r?: number }
  | { op: "frac_add" | "frac_sub"; d: number; a: number; b: number; ans_num: number; ans_den: number }
  | { op: "decompose"; n: number; a: number; b: number }
  | { op: "make_ten" | "break_ten"; a: number; ans: number }
  | { op: "three"; a: number; b: number; c: number; ops: "+-" | "-+"; ans: number }
  | Record<string, unknown>;

const INDEX = poolIndex as Record<string, number>;

// 메모리 캐시 — 같은 풀 재요청 시 fetch 안 함
const POOL_CACHE = new Map<string, PoolItem[]>();

async function loadPool(key: string): Promise<PoolItem[]> {
  if (POOL_CACHE.has(key)) return POOL_CACHE.get(key)!;
  if (!INDEX[key]) return [];
  try {
    const r = await fetch(`/pools/${key}.json`, { cache: "force-cache" });
    if (!r.ok) return [];
    const data = (await r.json()) as PoolItem[];
    POOL_CACHE.set(key, data);
    return data;
  } catch {
    return [];
  }
}

export interface DrillProblem {
  index: number;
  is_example: boolean;
  op: string;
  operands: number[];
  answer: number;
  remainder?: number;
  ans_den?: number;
  ops_str?: string;
  digits?: [number, number];
  carry?: "none" | "once" | "any";
  raw?: PoolItem;
}

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

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolItemToProblem(item: PoolItem): Omit<DrillProblem, "index" | "is_example"> {
  const op = (item as { op?: string }).op;
  if (op === "+" || op === "-" || op === "×") {
    const it = item as { op: "+" | "-" | "×"; a: number; b: number; ans: number };
    return { op: it.op, operands: [it.a, it.b], answer: it.ans, raw: item };
  }
  if (op === "÷") {
    const it = item as { op: "÷"; a: number; b: number; ans: number; r?: number };
    return { op: "÷", operands: [it.a, it.b], answer: it.ans, remainder: it.r, raw: item };
  }
  if (op === "frac_add" || op === "frac_sub") {
    const it = item as { op: string; d: number; a: number; b: number; ans_num: number; ans_den: number };
    return {
      op: it.op,
      operands: [it.a, it.d, it.b, it.d],
      answer: it.ans_num,
      ans_den: it.ans_den,
      raw: item,
    };
  }
  if (op === "decompose") {
    const it = item as { op: string; n: number; a: number; b: number };
    return { op: "decompose", operands: [it.n, it.a, it.b], answer: it.b, raw: item };
  }
  if (op === "make_ten" || op === "break_ten") {
    const it = item as { op: string; a: number; ans: number };
    return { op: it.op, operands: [it.a], answer: it.ans, raw: item };
  }
  if (op === "three") {
    const it = item as { op: string; a: number; b: number; c: number; ops: string; ans: number };
    return { op: "three", operands: [it.a, it.b, it.c], answer: it.ans, ops_str: it.ops, raw: item };
  }
  // 빈칸 변형 + 관계 + 세 수 ±: answer 필드를 raw에서 가져옴
  if (op === "box_add" || op === "box_sub" || op === "box_mul" || op === "box_div" || op === "box_dec_add" || op === "rel_add_to_sub" || op === "three_pm") {
    const r = item as Record<string, number>;
    return {
      op: op as string,
      operands: [],
      answer: (r.ans ?? r.ans1 ?? 0) as number,
      raw: item,
    };
  }
  // 분수·소수·약수배수·비/비례 — answer는 op별로 다름 (ans_num/ans/ans_a 등)
  // SpecialProblem이 raw에서 직접 읽음. answer는 요약값으로.
  const r2 = item as Record<string, number>;
  let answer = 0;
  if (typeof r2.ans === "number") answer = r2.ans;
  else if (typeof r2.ans_num === "number") answer = r2.ans_num;
  else if (typeof r2.ans_a === "number") answer = r2.ans_a;
  return {
    op: op || "?",
    operands: [],
    answer,
    ans_den: typeof r2.ans_den === "number" ? r2.ans_den : undefined,
    raw: item,
  };
}

export async function generateDrill(sheet: SheetMeta, nonce: number = 0): Promise<DrillProblem[]> {
  const poolKey = sheet.pool_key;
  if (!poolKey) return [];
  const pool = await loadPool(poolKey);
  if (pool.length === 0) return [];

  // 시드: unit + sheet + 날짜 + nonce (진입/새 문제 클릭마다 갱신)
  const seed = hashCode(`${sheet.unit_id}::${sheet.id}::${todayKey()}::${nonce}`);
  const rng = mulberry32(seed);

  // problem_count = 채점 대상 문항 수. 추가로 1문항(예시·is_example)을 더 추출.
  const N = sheet.problem_count + 1; // 예시 1 + 채점 N
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
    picked.splice(0, picked.length, ...shuffle(picked, rng));
  }

  // 첫 번째는 예시(is_example, index 0), 나머지는 1~N번 채점 대상
  return picked.map((item, i) => {
    const base = poolItemToProblem(item);
    return {
      ...base,
      index: i, // 0=예시, 1~N=채점
      is_example: i === 0,
      digits: sheet.digits,
      carry: sheet.carry,
    };
  });
}

// 풀 사이즈 동기 조회 (UI에서 "이 양식 N문제 풀" 표시용)
export function getPoolSize(key: string): number {
  return INDEX[key] || 0;
}

export function hasPool(key: string): boolean {
  return !!INDEX[key];
}

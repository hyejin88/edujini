// 단원별 학습지 메타.
// - 종합(comp): seed.json 기반 단원 학습 (PUBLISHED_UNITS만)
// - 드릴(drill_*): drill_pools.json + sheets_generated.json (일일수학 266개 양식 매핑)

import generatedDrills from "./sheets_generated.json";

export type SheetType =
  | "comprehensive" // 종합 단원 학습 (seed.json)
  | "drill_h_add"
  | "drill_h_sub"
  | "drill_h_mul"
  | "drill_h_div"
  | "drill_v_add"
  | "drill_v_add_carry"
  | "drill_v_sub"
  | "drill_v_mul";

export interface SheetMeta {
  id: string;
  unit_id: string;
  type: SheetType;
  title: string;
  subtitle: string;
  problem_count: number;
  digits?: [number, number];
  carry?: "none" | "once" | "any";
  pool_key?: string;     // drill_pools.json 키 (드릴 양식)
  layout?: "v" | "h";    // 세로(v) / 가로(h) — A=세로, B=가로 변형
}

type GeneratedSheet = SheetMeta & { pool_key: string; layout: "v" | "h" };

const DRILLS = generatedDrills as Record<string, GeneratedSheet[]>;

// 종합 학습 콘텐츠가 있는 단원 (lib/db.ts PUBLISHED_UNITS와 동기화)
const COMP_UNITS: Record<string, { title: string; subtitle: string }> = {
  "math-3-1-1": { title: "단원 학습", subtitle: "객관식 + 서술형 20문제 · AI 자동 채점" },
  "math-3-1-3": { title: "단원 학습", subtitle: "나눗셈 개념·곱셈과 관계 · 20문제" },
  "math-3-1-4": { title: "단원 학습", subtitle: "(두 자리)×(한 자리) · 20문제" },
  "math-3-1-6": { title: "단원 학습", subtitle: "분수의 의미·소수 첫째 자리 · 20문제" },
  "math-3-2-2": { title: "단원 학습", subtitle: "(두 자리) ÷ (한 자리) · 20문제" },
};

function compSheet(unitId: string): SheetMeta | null {
  const meta = COMP_UNITS[unitId];
  if (!meta) return null;
  return {
    id: "comp",
    unit_id: unitId,
    type: "comprehensive",
    title: meta.title,
    subtitle: meta.subtitle,
    problem_count: 20,
  };
}

// 단원별 통합 (comp + 드릴)
const _UNIT_SHEETS_CACHE: Record<string, SheetMeta[]> = {};

function buildUnitSheets(): Record<string, SheetMeta[]> {
  const out: Record<string, SheetMeta[]> = {};
  // 드릴 단원 + comp 단원 합집합
  const allUnits = new Set<string>([
    ...Object.keys(DRILLS),
    ...Object.keys(COMP_UNITS),
  ]);
  for (const uid of allUnits) {
    const sheets: SheetMeta[] = [];
    const cs = compSheet(uid);
    if (cs) sheets.push(cs);
    for (const d of DRILLS[uid] || []) {
      sheets.push(d);
    }
    out[uid] = sheets;
  }
  return out;
}

export const UNIT_SHEETS: Record<string, SheetMeta[]> = (() => {
  if (Object.keys(_UNIT_SHEETS_CACHE).length === 0) {
    Object.assign(_UNIT_SHEETS_CACHE, buildUnitSheets());
  }
  return _UNIT_SHEETS_CACHE;
})();

export function getUnitSheets(unitId: string): SheetMeta[] {
  return UNIT_SHEETS[unitId] || [];
}

export function getSheet(unitId: string, sheetId: string): SheetMeta | undefined {
  return (UNIT_SHEETS[unitId] || []).find((s) => s.id === sheetId);
}

// 단원별 학습지 메타. 종합 학습지(v3 seed.json) + 자동 생성 드릴 학습지.
// 클라이언트에서 시드 없이 즉시 렌더 가능 (드릴은 매번 새 숫자).

export type SheetType =
  | "comprehensive" // v3 종합 학습지 (seed.json 기반)
  | "drill_h_add" // 가로식 덧셈
  | "drill_h_sub" // 가로식 뺄셈
  | "drill_v_add" // 세로식 덧셈 (받아올림 X)
  | "drill_v_add_carry" // 세로식 덧셈 (받아올림 O)
  | "drill_v_sub"; // 세로식 뺄셈 (받아내림 O)

export interface SheetMeta {
  id: string;
  unit_id: string;
  type: SheetType;
  title: string;
  subtitle: string;
  problem_count: number;
  // 드릴용 파라미터
  digits?: [number, number]; // 좌·우 자릿수
  carry?: "none" | "once" | "any";
}

export const UNIT_SHEETS: Record<string, SheetMeta[]> = {
  "math-3-1-1": [
    {
      id: "comp",
      unit_id: "math-3-1-1",
      type: "comprehensive",
      title: "단원 학습지",
      subtitle: "객관식 + 서술형 20문제 · AI 자동 채점",
      problem_count: 20,
    },
    {
      id: "vadd-no",
      unit_id: "math-3-1-1",
      type: "drill_v_add",
      title: "세로 덧셈 — 받아올림 없음",
      subtitle: "세 자리 + 세 자리 · 24문제",
      problem_count: 24,
      digits: [3, 3],
      carry: "none",
    },
    {
      id: "vadd-carry",
      unit_id: "math-3-1-1",
      type: "drill_v_add_carry",
      title: "세로 덧셈 — 받아올림",
      subtitle: "세 자리 + 세 자리 · 16문제",
      problem_count: 16,
      digits: [3, 3],
      carry: "any",
    },
    {
      id: "vsub",
      unit_id: "math-3-1-1",
      type: "drill_v_sub",
      title: "세로 뺄셈 — 받아내림",
      subtitle: "세 자리 - 세 자리 · 16문제",
      problem_count: 16,
      digits: [3, 3],
      carry: "any",
    },
    {
      id: "hadd",
      unit_id: "math-3-1-1",
      type: "drill_h_add",
      title: "가로 덧셈",
      subtitle: "네 자리 + 세 자리 · 14문제",
      problem_count: 14,
      digits: [4, 3],
      carry: "any",
    },
    {
      id: "hsub",
      unit_id: "math-3-1-1",
      type: "drill_h_sub",
      title: "가로 뺄셈",
      subtitle: "네 자리 - 네 자리 · 14문제",
      problem_count: 14,
      digits: [4, 4],
      carry: "any",
    },
  ],
};

export function getUnitSheets(unitId: string): SheetMeta[] {
  return UNIT_SHEETS[unitId] || [];
}

export function getSheet(unitId: string, sheetId: string): SheetMeta | undefined {
  return (UNIT_SHEETS[unitId] || []).find((s) => s.id === sheetId);
}

// 단원별 학습지 메타. 종합 학습지(v3 seed.json) + 자동 생성 드릴 학습지.
// 클라이언트에서 시드 없이 즉시 렌더 가능 (드릴은 매번 새 숫자).

export type SheetType =
  | "comprehensive" // v3 종합 학습지 (seed.json 기반)
  | "drill_h_add" // 가로식 덧셈
  | "drill_h_sub" // 가로식 뺄셈
  | "drill_h_mul" // 가로식 곱셈
  | "drill_h_div" // 가로식 나눗셈 (몫만)
  | "drill_v_add" // 세로식 덧셈 (받아올림 X)
  | "drill_v_add_carry" // 세로식 덧셈 (받아올림 O)
  | "drill_v_sub" // 세로식 뺄셈 (받아내림 O)
  | "drill_v_mul"; // 세로식 곱셈

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
  "math-3-1-2": [
    // 평면도형은 텍스트 드릴 양식 X (도형 식별 → 단원 학습지 위주)
    { id: "comp", unit_id: "math-3-1-2", type: "comprehensive", title: "단원 학습지", subtitle: "직선·반직선·선분·각 · 20문제", problem_count: 20 },
  ],
  "math-3-1-3": [
    { id: "comp", unit_id: "math-3-1-3", type: "comprehensive", title: "단원 학습지", subtitle: "나눗셈 개념·곱셈과 관계 · 20문제", problem_count: 20 },
    { id: "hdiv-1d", unit_id: "math-3-1-3", type: "drill_h_div", title: "가로 나눗셈 — 한 자리", subtitle: "두 자리 ÷ 한 자리 · 16문제", problem_count: 16, digits: [2, 1] },
    { id: "hdiv-easy", unit_id: "math-3-1-3", type: "drill_h_div", title: "가로 나눗셈 — 곱셈구구 범위", subtitle: "한 자리 × 한 자리 안의 나눗셈 · 24문제", problem_count: 24, digits: [1, 1] },
  ],
  "math-3-1-4": [
    { id: "comp", unit_id: "math-3-1-4", type: "comprehensive", title: "단원 학습지", subtitle: "(두 자리)×(한 자리) · 20문제", problem_count: 20 },
    { id: "hmul-2x1", unit_id: "math-3-1-4", type: "drill_h_mul", title: "가로 곱셈 — 두 자리 × 한 자리", subtitle: "받아올림 섞임 · 16문제", problem_count: 16, digits: [2, 1] },
    { id: "vmul-2x1", unit_id: "math-3-1-4", type: "drill_v_mul", title: "세로 곱셈 — 두 자리 × 한 자리", subtitle: "표 양식 · 14문제", problem_count: 14, digits: [2, 1] },
  ],
  "math-3-1-5": [
    // 단위 변환 — 종합 학습지가 적합 (드릴 양식 X)
    { id: "comp", unit_id: "math-3-1-5", type: "comprehensive", title: "단원 학습지", subtitle: "mm·km·시간 단위 변환 · 20문제", problem_count: 20 },
  ],
  "math-3-1-6": [
    { id: "comp", unit_id: "math-3-1-6", type: "comprehensive", title: "단원 학습지", subtitle: "분수의 의미·소수 첫째 자리 · 20문제", problem_count: 20 },
  ],
  "math-3-2-1": [
    { id: "comp", unit_id: "math-3-2-1", type: "comprehensive", title: "단원 학습지", subtitle: "(세 자리)×(한 자리)·(두 자리)×(두 자리) · 20문제", problem_count: 20 },
    { id: "hmul-3x1", unit_id: "math-3-2-1", type: "drill_h_mul", title: "가로 곱셈 — 세 자리 × 한 자리", subtitle: "받아올림 응용 · 14문제", problem_count: 14, digits: [3, 1] },
    { id: "vmul-3x1", unit_id: "math-3-2-1", type: "drill_v_mul", title: "세로 곱셈 — 세 자리 × 한 자리", subtitle: "표 양식 · 14문제", problem_count: 14, digits: [3, 1] },
    { id: "hmul-2x2", unit_id: "math-3-2-1", type: "drill_h_mul", title: "가로 곱셈 — 두 자리 × 두 자리", subtitle: "응용 · 14문제", problem_count: 14, digits: [2, 2] },
  ],
  "math-3-2-2": [
    { id: "comp", unit_id: "math-3-2-2", type: "comprehensive", title: "단원 학습지", subtitle: "(두 자리) ÷ (한 자리) · 20문제", problem_count: 20 },
    { id: "hdiv-2x1", unit_id: "math-3-2-2", type: "drill_h_div", title: "가로 나눗셈 — 나머지 없음", subtitle: "두 자리 ÷ 한 자리 · 16문제", problem_count: 16, digits: [2, 1] },
    { id: "hdiv-rem", unit_id: "math-3-2-2", type: "drill_h_div", title: "가로 나눗셈 — 나머지 있음", subtitle: "두 자리 ÷ 한 자리 · 16문제", problem_count: 16, digits: [2, 1], carry: "once" },
  ],
  "math-3-2-3": [
    { id: "comp", unit_id: "math-3-2-3", type: "comprehensive", title: "단원 학습지", subtitle: "원의 중심·반지름·지름 · 20문제", problem_count: 20 },
  ],
  "math-3-2-4": [
    { id: "comp", unit_id: "math-3-2-4", type: "comprehensive", title: "단원 학습지", subtitle: "진분수·가분수·대분수 변환 · 20문제", problem_count: 20 },
  ],

  // ============ 1학년 (덧셈·뺄셈 입문) ============
  "math-1-1-3": [
    { id: "h-add-1d", unit_id: "math-1-1-3", type: "drill_h_add", title: "가로 덧셈 — 한 자리", subtitle: "한 자리 + 한 자리 · 24문제", problem_count: 24, digits: [1, 1] },
    { id: "h-sub-1d", unit_id: "math-1-1-3", type: "drill_h_sub", title: "가로 뺄셈 — 한 자리", subtitle: "한 자리 - 한 자리 · 24문제", problem_count: 24, digits: [1, 1] },
    { id: "v-add-1d", unit_id: "math-1-1-3", type: "drill_v_add", title: "세로 덧셈 — 한 자리", subtitle: "받아올림 없음 · 16문제", problem_count: 16, digits: [1, 1], carry: "none" },
  ],
  "math-1-2-2": [
    { id: "h-add-2d1d", unit_id: "math-1-2-2", type: "drill_h_add", title: "가로 덧셈 — 받아올림 없음", subtitle: "두 자리 + 한 자리 · 24문제", problem_count: 24, digits: [2, 1], carry: "none" },
    { id: "v-add-2d1d", unit_id: "math-1-2-2", type: "drill_v_add", title: "세로 덧셈 — 받아올림 없음", subtitle: "두 자리 + 한 자리 · 16문제", problem_count: 16, digits: [2, 1], carry: "none" },
  ],
  "math-1-2-4": [
    { id: "h-sub-2d1d", unit_id: "math-1-2-4", type: "drill_h_sub", title: "가로 뺄셈 — 받아내림 없음", subtitle: "두 자리 - 한 자리 · 24문제", problem_count: 24, digits: [2, 1], carry: "none" },
    { id: "v-sub-2d1d", unit_id: "math-1-2-4", type: "drill_v_sub", title: "세로 뺄셈 — 받아내림 없음", subtitle: "두 자리 - 한 자리 · 16문제", problem_count: 16, digits: [2, 1], carry: "none" },
  ],

  // ============ 2학년 (받아올림·내림 + 곱셈구구) ============
  "math-2-1-3": [
    { id: "v-add-carry-2d", unit_id: "math-2-1-3", type: "drill_v_add_carry", title: "세로 덧셈 — 받아올림", subtitle: "두 자리 + 두 자리 · 16문제", problem_count: 16, digits: [2, 2], carry: "any" },
    { id: "v-sub-borrow-2d", unit_id: "math-2-1-3", type: "drill_v_sub", title: "세로 뺄셈 — 받아내림", subtitle: "두 자리 - 두 자리 · 16문제", problem_count: 16, digits: [2, 2], carry: "any" },
    { id: "h-add-2d2d", unit_id: "math-2-1-3", type: "drill_h_add", title: "가로 덧셈 — 두 자리", subtitle: "받아올림 섞임 · 14문제", problem_count: 14, digits: [2, 2], carry: "any" },
    { id: "h-sub-2d2d", unit_id: "math-2-1-3", type: "drill_h_sub", title: "가로 뺄셈 — 두 자리", subtitle: "받아내림 섞임 · 14문제", problem_count: 14, digits: [2, 2], carry: "any" },
  ],
  "math-2-1-6": [
    { id: "h-mul-1d-easy", unit_id: "math-2-1-6", type: "drill_h_mul", title: "가로 곱셈 — 입문", subtitle: "한 자리 × 한 자리 · 24문제", problem_count: 24, digits: [1, 1] },
  ],
  "math-2-2-2": [
    { id: "h-mul-1d", unit_id: "math-2-2-2", type: "drill_h_mul", title: "곱셈구구 — 종합", subtitle: "2~9단 섞기 · 36문제", problem_count: 36, digits: [1, 1] },
    { id: "h-div-1d", unit_id: "math-2-2-2", type: "drill_h_div", title: "곱셈구구 역연산", subtitle: "한 자리 나눗셈 · 24문제", problem_count: 24, digits: [1, 1] },
  ],

  // ============ 4학년 ============
  "math-4-1-3": [
    { id: "comp", unit_id: "math-4-1-3", type: "comprehensive", title: "단원 학습지", subtitle: "(세 자리)×(두 자리)·(세 자리)÷(두 자리) · 20문제", problem_count: 20 },
    { id: "h-mul-3x2", unit_id: "math-4-1-3", type: "drill_h_mul", title: "가로 곱셈 — 세 자리 × 두 자리", subtitle: "응용 · 14문제", problem_count: 14, digits: [3, 2] },
    { id: "h-div-3x1", unit_id: "math-4-1-3", type: "drill_h_div", title: "가로 나눗셈 — 세 자리 ÷ 한 자리", subtitle: "16문제", problem_count: 16, digits: [3, 1] },
    { id: "h-div-3x2-rem", unit_id: "math-4-1-3", type: "drill_h_div", title: "가로 나눗셈 — 세 자리 ÷ 두 자리 (나머지)", subtitle: "14문제", problem_count: 14, digits: [3, 2], carry: "once" },
  ],
  "math-4-2-1": [
    { id: "comp", unit_id: "math-4-2-1", type: "comprehensive", title: "단원 학습지", subtitle: "분모가 같은 분수의 덧·뺄셈 · 20문제", problem_count: 20 },
  ],
  "math-4-2-3": [
    { id: "comp", unit_id: "math-4-2-3", type: "comprehensive", title: "단원 학습지", subtitle: "소수 둘째 자리 덧·뺄셈 · 20문제", problem_count: 20 },
  ],

  // ============ 5학년 ============
  "math-5-1-1": [
    { id: "comp", unit_id: "math-5-1-1", type: "comprehensive", title: "단원 학습지", subtitle: "혼합 계산·괄호 · 20문제", problem_count: 20 },
    { id: "h-mix-3", unit_id: "math-5-1-1", type: "drill_h_add", title: "혼합 계산 드릴 — 3항", subtitle: "+/-/×/÷ 3개 항 · 16문제", problem_count: 16, digits: [2, 2], carry: "any" },
  ],
  "math-5-1-2": [
    { id: "comp", unit_id: "math-5-1-2", type: "comprehensive", title: "단원 학습지", subtitle: "약수·배수·최대공약수·최소공배수 · 20문제", problem_count: 20 },
  ],
  "math-5-1-5": [
    { id: "comp", unit_id: "math-5-1-5", type: "comprehensive", title: "단원 학습지", subtitle: "분모 다른 분수의 덧·뺄셈 · 20문제", problem_count: 20 },
  ],
  "math-5-2-2": [
    { id: "comp", unit_id: "math-5-2-2", type: "comprehensive", title: "단원 학습지", subtitle: "분수의 곱셈·약분 · 20문제", problem_count: 20 },
  ],
  "math-5-2-4": [
    { id: "comp", unit_id: "math-5-2-4", type: "comprehensive", title: "단원 학습지", subtitle: "소수의 곱셈 · 20문제", problem_count: 20 },
  ],

  // ============ 6학년 ============
  "math-6-1-1": [
    { id: "comp", unit_id: "math-6-1-1", type: "comprehensive", title: "단원 학습지", subtitle: "분수의 나눗셈 · 20문제", problem_count: 20 },
  ],
  "math-6-1-3": [
    { id: "comp", unit_id: "math-6-1-3", type: "comprehensive", title: "단원 학습지", subtitle: "소수 ÷ 자연수 · 20문제", problem_count: 20 },
  ],
  "math-6-1-4": [
    { id: "comp", unit_id: "math-6-1-4", type: "comprehensive", title: "단원 학습지", subtitle: "비·비율·백분율 · 20문제", problem_count: 20 },
  ],
  "math-6-2-1": [
    { id: "comp", unit_id: "math-6-2-1", type: "comprehensive", title: "단원 학습지", subtitle: "분수 ÷ 분수 · 20문제", problem_count: 20 },
  ],
  "math-6-2-3": [
    { id: "comp", unit_id: "math-6-2-3", type: "comprehensive", title: "단원 학습지", subtitle: "소수 ÷ 소수 · 20문제", problem_count: 20 },
  ],
  "math-6-2-4": [
    { id: "comp", unit_id: "math-6-2-4", type: "comprehensive", title: "단원 학습지", subtitle: "비례식·비례배분 · 20문제", problem_count: 20 },
  ],
};

export function getUnitSheets(unitId: string): SheetMeta[] {
  return UNIT_SHEETS[unitId] || [];
}

export function getSheet(unitId: string, sheetId: string): SheetMeta | undefined {
  return (UNIT_SHEETS[unitId] || []).find((s) => s.id === sheetId);
}

"use client";

import { useState } from "react";
import type { DrillProblem } from "@/lib/drillGen";
import type { SheetMeta } from "@/lib/sheets";

// 가로식 / 세로식 양식 자동 분기.
// 1번은 정답 시범 (is_example=true), 나머지는 빈칸.
export function DrillSheet({
  sheet,
  problems,
  isGraded,
  answers,
  onChange,
}: {
  sheet: SheetMeta;
  problems: DrillProblem[];
  isGraded: boolean;
  answers: Record<number, string>;
  onChange: (idx: number, value: string) => void;
}) {
  // 가로식: 기존 정수 4종 + 분수/소수 가로식 8종
  // 세로식: drill_v_* (drill_v_div 포함 — 받아내림 표기 위해 4열 grid 사용)
  const isHorizontal =
    sheet.type === "drill_h_add" ||
    sheet.type === "drill_h_sub" ||
    sheet.type === "drill_h_mul" ||
    sheet.type === "drill_h_div" ||
    sheet.type === "drill_h_frac_add" ||
    sheet.type === "drill_h_frac_sub" ||
    sheet.type === "drill_h_frac_mul" ||
    sheet.type === "drill_h_frac_div" ||
    sheet.type === "drill_h_dec_add" ||
    sheet.type === "drill_h_dec_sub" ||
    sheet.type === "drill_h_dec_mul" ||
    sheet.type === "drill_h_dec_div";

  // 인쇄 그리드 — 세로식 ÷ 는 받아내림/몫 단계 표기 공간 확보 위해 4열
  const printCols =
    sheet.type === "drill_v_div" ? "print:grid-cols-4" : "print:grid-cols-3";

  if (problems.length === 0) {
    return (
      <div className="rounded border border-dashed border-[#e5e7eb] bg-[#fafafa] p-8 text-center text-sm text-[#6b7280]">
        이 양식은 아직 문제 풀이 준비 중입니다.
      </div>
    );
  }

  // 예시(is_example) 1개를 별도 영역으로 분리, 본문은 1~N번 채점 대상만
  const example = problems.find((p) => p.is_example);
  const graded = problems.filter((p) => !p.is_example);

  return (
    <div>
      {/* 예시 영역 — 박스로 시각 분리. 인쇄 시 가운데 정렬 (박스 폭 자동 + 컨텐츠 가운데) */}
      {example && (
        <div className="mb-6 rounded-lg border border-[#d1d5db] bg-[#f9fafb] p-4 print:mx-auto print:mb-3 print:flex print:max-w-[60%] print:flex-col print:items-center print:p-2 print:border-2 print:border-[#9ca3af]">
          <p className="mb-2 text-xs font-semibold tracking-wide text-[#0080E0] print:text-center print:text-[#374151]">
            예시 보기
          </p>
          <DrillProblemCell
            problem={example}
            isHorizontal={isHorizontal}
            isGraded={isGraded}
            answer=""
            onChange={() => {}}
            hideNumber
          />
        </div>
      )}

      {/* 채점 대상 1~N번 — 양식별 인쇄 그리드 분기 (drill_v_div=4열, 그 외=3열) */}
      <div className={`grid grid-cols-2 gap-x-8 gap-y-5 ${printCols} print:gap-x-6 print:gap-y-4`}>
        {graded.map((p) => (
          <DrillProblemCell
            key={p.index}
            problem={p}
            isHorizontal={isHorizontal}
            isGraded={isGraded}
            answer={answers[p.index] || ""}
            onChange={(v) => onChange(p.index, v)}
          />
        ))}
      </div>
    </div>
  );
}

// 산술이 아닌 op (분수, 세 수, 가르기·모으기 등)은 별도 렌더
function isArithmetic(op: string): op is "+" | "-" | "×" | "÷" {
  return op === "+" || op === "-" || op === "×" || op === "÷";
}

function DrillProblemCell({
  problem,
  isHorizontal,
  isGraded,
  answer,
  onChange,
  hideNumber = false,
}: {
  problem: DrillProblem;
  isHorizontal: boolean;
  isGraded: boolean;
  answer: string;
  onChange: (v: string) => void;
  hideNumber?: boolean;
}) {
  const userAns = problem.is_example ? String(problem.answer) : answer;
  const correct =
    isGraded && !problem.is_example
      ? Number(answer.replace(/[^\d-]/g, "")) === problem.answer
      : null;

  return (
    <div
      className="break-inside-avoid flex items-start gap-2"
      style={{ wordBreak: "keep-all" }}
    >
      {/* 번호 — 식 좌측 inline (별도 행 차지 X). 예시는 hideNumber로 숨김. */}
      {!hideNumber && (
        <span
          className="font-serif font-bold text-[#111827] flex-shrink-0"
          style={{ fontSize: "18px", lineHeight: "1.4", minWidth: "22px" }}
        >
          {problem.index}.
        </span>
      )}

      <div className="flex-1 min-w-0">
        {!isArithmetic(problem.op) ? (
          <SpecialProblem
            problem={problem}
            isGraded={isGraded}
            userAns={userAns}
            onChange={onChange}
            correct={correct}
          />
        ) : isHorizontal ? (
          <HorizontalProblem
            problem={problem}
            isGraded={isGraded}
            userAns={userAns}
            onChange={onChange}
            correct={correct}
          />
        ) : (
          <VerticalProblem
            problem={problem}
            isGraded={isGraded}
            userAns={userAns}
            onChange={onChange}
            correct={correct}
          />
        )}
      </div>
    </div>
  );
}

function HorizontalProblem({
  problem,
  isGraded,
  userAns,
  onChange,
  correct,
}: {
  problem: DrillProblem;
  isGraded: boolean;
  userAns: string;
  onChange: (v: string) => void;
  correct: boolean | null;
}) {
  const [a, b] = problem.operands;
  const inputCls =
    problem.is_example
      ? "text-[#1e3a8a] font-semibold"
      : isGraded
        ? correct
          ? "text-[#15803d]"
          : "text-[#b91c1c]"
        : "text-[#111827]";

  return (
    <div
      className="font-mono"
      style={{ fontSize: "18px", letterSpacing: "0.02em" }}
    >
      {a} {problem.op} {b} ={" "}
      {problem.is_example ? (
        <span className={inputCls}>{problem.answer}</span>
      ) : (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9\-]*"
          value={userAns}
          disabled={isGraded}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-transparent px-1 outline-none ${inputCls}`}
          style={{
            width: "60px",
            border: "none",
            borderBottom: "1px solid #111827",
            borderRadius: 0,
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        />
      )}
      {isGraded && !problem.is_example && correct === false && (
        <span className="ml-2 text-[#6b7280]" style={{ fontSize: "13px" }}>
          (정답 {problem.answer})
        </span>
      )}
    </div>
  );
}

function VerticalProblem({
  problem,
  isGraded,
  userAns,
  onChange,
  correct,
}: {
  problem: DrillProblem;
  isGraded: boolean;
  userAns: string;
  onChange: (v: string) => void;
  correct: boolean | null;
}) {
  const [a, b] = problem.operands;
  const maxDigits = Math.max(String(a).length, String(b).length, String(problem.answer).length);
  const aDigits = padDigits(a, maxDigits);
  const bDigits = padDigits(b, maxDigits);
  const ansDigits = padDigits(problem.answer, maxDigits);
  const userDigits = padDigits(userAns ? Number(userAns.replace(/[^\d]/g, "")) || 0 : 0, maxDigits, true);

  // 받아올림/내림 표시 (예시 1번에만)
  const opForCarry = problem.op === "+" || problem.op === "-" ? problem.op : "+";
  const carries: string[] = problem.is_example
    ? computeCarries(a, b, opForCarry, maxDigits)
    : Array(maxDigits).fill("");

  return (
    <div
      className="inline-block font-mono"
      style={{ fontSize: "18px", letterSpacing: "0.04em" }}
    >
      <table style={{ borderCollapse: "collapse" }}>
        <tbody>
          {/* 받아올림 행 (예시만) */}
          <tr style={{ height: "16px" }}>
            <td style={{ width: "16px" }} />
            {carries.map((c, i) => (
              <td
                key={i}
                style={{
                  width: "20px",
                  textAlign: "center",
                  fontSize: "11px",
                  color: "#1e3a8a",
                  fontWeight: 600,
                }}
              >
                {c}
              </td>
            ))}
          </tr>
          {/* 첫 번째 수 */}
          <tr>
            <td style={{ width: "16px" }} />
            {aDigits.map((d, i) => (
              <td
                key={i}
                style={{ width: "20px", textAlign: "center" }}
              >
                {d}
              </td>
            ))}
          </tr>
          {/* 연산자 + 두 번째 수 */}
          <tr>
            <td style={{ width: "16px", fontWeight: 700 }}>{problem.op}</td>
            {bDigits.map((d, i) => (
              <td
                key={i}
                style={{ width: "20px", textAlign: "center" }}
              >
                {d}
              </td>
            ))}
          </tr>
          {/* 가로선 */}
          <tr>
            <td colSpan={maxDigits + 1} style={{ borderTop: "1px solid #111827", height: "2px" }} />
          </tr>
          {/* 정답 행 */}
          <tr>
            <td style={{ width: "16px" }} />
            {problem.is_example
              ? ansDigits.map((d, i) => (
                  <td
                    key={i}
                    style={{
                      width: "20px",
                      textAlign: "center",
                      color: "#1e3a8a",
                      fontWeight: 600,
                    }}
                  >
                    {d}
                  </td>
                ))
              : isGraded
                ? padDigits(Number(userAns.replace(/[^\d]/g, "")) || 0, maxDigits, true).map(
                    (d, i) => (
                      <td
                        key={i}
                        style={{
                          width: "20px",
                          textAlign: "center",
                          color: correct ? "#15803d" : "#b91c1c",
                          fontWeight: 600,
                        }}
                      >
                        {d}
                      </td>
                    )
                  )
                : null}
            {!problem.is_example && !isGraded && (
              <td colSpan={maxDigits} style={{ paddingTop: "2px" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9\-]*"
                  value={userAns}
                  onChange={(e) => onChange(e.target.value)}
                  className="bg-transparent text-center outline-none"
                  style={{
                    width: `${20 * maxDigits}px`,
                    border: "none",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    letterSpacing: "0.04em",
                  }}
                  maxLength={maxDigits + 1}
                />
              </td>
            )}
          </tr>
        </tbody>
      </table>
      {isGraded && !problem.is_example && correct === false && (
        <div className="mt-1 text-[#6b7280]" style={{ fontSize: "11px" }}>
          정답 {problem.answer}
        </div>
      )}
    </div>
  );
}

// 산술이 아닌 양식 — 분수, 세 수, 가르기·모으기, 10 만들기 등
function SpecialProblem({
  problem,
  isGraded,
  userAns,
  onChange,
  correct,
}: {
  problem: DrillProblem;
  isGraded: boolean;
  userAns: string;
  onChange: (v: string) => void;
  correct: boolean | null;
}) {
  const inputCls =
    problem.is_example
      ? "text-[#1e3a8a] font-semibold"
      : isGraded
        ? correct
          ? "text-[#15803d]"
          : "text-[#b91c1c]"
        : "text-[#111827]";

  // op별 모바일 키패드 — 분수/비는 / : 입력 필요해서 text + pattern, 그 외는 numeric
  const op = problem.op;
  const needsSlashOrColon =
    op === "frac_add" || op === "frac_sub" || op === "frac_add_diff" || op === "frac_sub_diff" ||
    op === "frac_mul" || op === "frac_mul_nat" || op === "frac_div" || op === "frac_div_nat" ||
    op === "mixed_to_improper" || op === "improper_to_mixed" || op === "mixed_add" || op === "mixed_sub" ||
    op === "reduce_frac" || op === "common_denom" || op === "ratio_simplify" || op === "cont_ratio" ||
    op === "factors" || op === "multiples" || op === "prop_share";
  const isDecimal = op === "dec_add" || op === "dec_sub" || op === "dec_mul" || op === "dec_mul_nat" ||
    op === "dec_div_nat" || op === "dec_div" || op === "nat_div_dec" || op === "nat_div_nat_dec" ||
    op === "ratio_to_pct";
  const inputMode = needsSlashOrColon ? "text" : isDecimal ? "decimal" : "numeric";
  const pattern = needsSlashOrColon ? "[0-9./: ,\\-]*" : isDecimal ? "[0-9.\\-]*" : "[0-9\\-]*";

  const Box = (val: string | number, w = 56) =>
    problem.is_example ? (
      <span className={inputCls}>{val}</span>
    ) : (
      <input
        type="text"
        inputMode={inputMode}
        pattern={pattern}
        value={userAns}
        disabled={isGraded}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-transparent px-1 outline-none ${inputCls}`}
        style={{
          width: w,
          border: "none",
          borderBottom: "1px solid #111827",
          borderRadius: 0,
          fontFamily: "inherit",
          fontSize: "inherit",
        }}
      />
    );

  // 분수 입력 (분자/분모 분리, 숫자 키패드만)
  const FracInput = () => {
    const [num = "", den = ""] = (userAns || "").split("/");
    const cellStyle: React.CSSProperties = {
      width: 28, textAlign: "center", border: "none",
      fontFamily: "inherit", fontSize: "inherit", padding: 0,
    };
    return (
      <span className={`inline-flex flex-col items-center align-middle ${inputCls}`} style={{ lineHeight: 1 }}>
        <input type="text" inputMode="numeric" pattern="[0-9]*"
          value={num} disabled={isGraded}
          onChange={(e) => onChange(`${e.target.value}/${den}`)}
          className="bg-transparent outline-none" style={cellStyle} />
        <span style={{ borderTop: "1px solid #111827", width: "100%", margin: "1px 0" }} />
        <input type="text" inputMode="numeric" pattern="[0-9]*"
          value={den} disabled={isGraded}
          onChange={(e) => onChange(`${num}/${e.target.value}`)}
          className="bg-transparent outline-none" style={cellStyle} />
      </span>
    );
  };

  // 대분수 입력 (자연수 + 분자/분모, 숫자 키패드만)
  const MixedInput = () => {
    // userAns 형식: "w num/den" 또는 "w num den"
    const m = (userAns || "").match(/^\s*(\d*)\s*(\d*)\s*\/?\s*(\d*)\s*$/);
    const whole = m?.[1] || "";
    const num = m?.[2] || "";
    const den = m?.[3] || "";
    const compose = (w: string, n: string, d: string) => `${w} ${n}/${d}`.trim();
    const cellStyle: React.CSSProperties = {
      width: 28, textAlign: "center", border: "none",
      fontFamily: "inherit", fontSize: "inherit", padding: 0,
    };
    return (
      <span className={`inline-flex items-center align-middle ${inputCls}`} style={{ lineHeight: 1 }}>
        <input type="text" inputMode="numeric" pattern="[0-9]*"
          value={whole} disabled={isGraded}
          onChange={(e) => onChange(compose(e.target.value, num, den))}
          className="bg-transparent outline-none" style={{ ...cellStyle, marginRight: 4 }} />
        <span className="inline-flex flex-col items-center" style={{ lineHeight: 1 }}>
          <input type="text" inputMode="numeric" pattern="[0-9]*"
            value={num} disabled={isGraded}
            onChange={(e) => onChange(compose(whole, e.target.value, den))}
            className="bg-transparent outline-none" style={cellStyle} />
          <span style={{ borderTop: "1px solid #111827", width: "100%", margin: "1px 0" }} />
          <input type="text" inputMode="numeric" pattern="[0-9]*"
            value={den} disabled={isGraded}
            onChange={(e) => onChange(compose(whole, num, e.target.value))}
            className="bg-transparent outline-none" style={cellStyle} />
        </span>
      </span>
    );
  };

  // 분수 덧/뺄 (분모 같음)
  if (problem.op === "frac_add" || problem.op === "frac_sub") {
    const [an, ad, bn, bd] = problem.operands;
    const opSym = problem.op === "frac_add" ? "+" : "−";
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Frac n={an} d={ad} /> <span className="mx-1">{opSym}</span>{" "}
        <Frac n={bn} d={bd} /> <span className="mx-1">=</span>{" "}
        {problem.is_example ? (
          <Frac n={problem.answer} d={problem.ans_den ?? ad} />
        ) : (
          <FracInput />
        )}
        {isGraded && !problem.is_example && correct === false && (
          <span className="ml-2 text-[#6b7280]" style={{ fontSize: "13px" }}>
            (정답 {problem.answer}/{problem.ans_den ?? ad})
          </span>
        )}
      </div>
    );
  }

  // 가르기: n = a + ?
  if (problem.op === "decompose") {
    const [n, a] = problem.operands;
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {n} = {a} + {Box(problem.answer)}
      </div>
    );
  }

  // 10 만들기: 빈칸 위치 4종 (right / left / sum / three_sum)
  if (problem.op === "make_ten") {
    const r = (problem.raw || {}) as Record<string, number | null | string>;
    const box = r.box as string | undefined;
    if (box === "left") {
      // □ + b = 10
      return (
        <div className="font-mono" style={{ fontSize: "18px" }}>
          {Box(problem.answer)} + {r.b as number} = 10
        </div>
      );
    }
    if (box === "sum") {
      // a + b = □
      return (
        <div className="font-mono" style={{ fontSize: "18px" }}>
          {r.a as number} + {r.b as number} = {Box(problem.answer)}
        </div>
      );
    }
    if (box === "three_sum") {
      // a + b + c = □
      return (
        <div className="font-mono" style={{ fontSize: "18px" }}>
          {r.a as number} + {r.b as number} + {r.c as number} = {Box(problem.answer)}
        </div>
      );
    }
    // 기본: a + □ = 10
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {r.a as number} + {Box(problem.answer)} = 10
      </div>
    );
  }
  // 10에서 빼기: 빈칸 위치 2종 (right / middle)
  if (problem.op === "break_ten") {
    const r = (problem.raw || {}) as Record<string, number | null | string>;
    const box = r.box as string | undefined;
    if (box === "middle") {
      // 10 - □ = b
      return (
        <div className="font-mono" style={{ fontSize: "18px" }}>
          10 − {Box(problem.answer)} = {r.ans_b as number}
        </div>
      );
    }
    // 기본: 10 - a = □
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        10 − {r.a as number} = {Box(problem.answer)}
      </div>
    );
  }

  // 세 수 ± 양식: a (±) b (±) c = ?
  if (problem.op === "three_pm") {
    const r = (problem.raw || {}) as Record<string, number | string>;
    const ops = String(r.ops || "++");
    const o1 = ops[0] === "+" ? "+" : "−";
    const o2 = ops[1] === "+" ? "+" : "−";
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {r.a as number} {o1} {r.b as number} {o2} {r.c as number} = {Box(problem.answer)}
      </div>
    );
  }

  // 빈칸 채우기 (□+b=c, a+□=c, a-□=c)
  if (problem.op === "box_add") {
    const r = (problem.raw || {}) as Record<string, number | string>;
    if (r.box === "a") {
      return (
        <div className="font-mono" style={{ fontSize: "18px" }}>
          {Box(problem.answer)} + {r.b as number} = {r.c as number}
        </div>
      );
    }
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {r.a as number} + {Box(problem.answer)} = {r.c as number}
      </div>
    );
  }
  if (problem.op === "box_sub") {
    const r = (problem.raw || {}) as Record<string, number | string>;
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {r.a as number} − {Box(problem.answer)} = {r.c as number}
      </div>
    );
  }
  // 곱셈 빈칸 3위치: a×b=?, a×?=c, ?×b=c
  if (problem.op === "box_mul") {
    const r = (problem.raw || {}) as Record<string, number | string>;
    if (r.box === "c") {
      return (<div className="font-mono" style={{ fontSize: "18px" }}>{r.a as number} × {r.b as number} = {Box(problem.answer)}</div>);
    }
    if (r.box === "b") {
      return (<div className="font-mono" style={{ fontSize: "18px" }}>{r.a as number} × {Box(problem.answer)} = {r.c as number}</div>);
    }
    return (<div className="font-mono" style={{ fontSize: "18px" }}>{Box(problem.answer)} × {r.b as number} = {r.c as number}</div>);
  }
  // 나눗셈 빈칸 3위치: a÷b=q, a÷?=q, ?÷b=q
  if (problem.op === "box_div") {
    const r = (problem.raw || {}) as Record<string, number | string>;
    if (r.box === "q") {
      return (<div className="font-mono" style={{ fontSize: "18px" }}>{r.a as number} ÷ {r.b as number} = {Box(problem.answer)}</div>);
    }
    if (r.box === "b") {
      return (<div className="font-mono" style={{ fontSize: "18px" }}>{r.a as number} ÷ {Box(problem.answer)} = {r.q as number}</div>);
    }
    return (<div className="font-mono" style={{ fontSize: "18px" }}>{Box(problem.answer)} ÷ {r.b as number} = {r.q as number}</div>);
  }
  // 소수 덧셈 빈칸 3위치
  if (problem.op === "box_dec_add") {
    const r = (problem.raw || {}) as Record<string, number | string>;
    if (r.box === "c") {
      return (<div className="font-mono" style={{ fontSize: "18px" }}>{r.a as number} + {r.b as number} = {Box(problem.answer)}</div>);
    }
    if (r.box === "b") {
      return (<div className="font-mono" style={{ fontSize: "18px" }}>{r.a as number} + {Box(problem.answer)} = {r.c as number}</div>);
    }
    return (<div className="font-mono" style={{ fontSize: "18px" }}>{Box(problem.answer)} + {r.b as number} = {r.c as number}</div>);
  }
  // 덧뺄 관계: a+b=c 보고 c-a=?, c-b=? (두 답이라 ans1만 빈칸)
  if (problem.op === "rel_add_to_sub") {
    const r = (problem.raw || {}) as Record<string, number | string>;
    return (
      <div className="font-mono text-sm" style={{ fontSize: "15px" }}>
        {r.a as number} + {r.b as number} = {r.c as number} ⇒ {r.c as number} − {r.a as number} = {Box(problem.answer)}
      </div>
    );
  }

  // 세 수 연산: a (op1) b (op2) c = ?
  if (problem.op === "three") {
    const [a, b, c] = problem.operands;
    const ops = problem.ops_str || "+-";
    const o1 = ops[0] === "+" ? "+" : "−";
    const o2 = ops[1] === "+" ? "+" : "−";
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {a} {o1} {b} {o2} {c} = {Box(problem.answer)}
        {isGraded && !problem.is_example && correct === false && (
          <span className="ml-2 text-[#6b7280]" style={{ fontSize: "13px" }}>
            (정답 {problem.answer})
          </span>
        )}
      </div>
    );
  }

  // === 분수 변환 ===
  const raw = (problem.raw || {}) as Record<string, number>;

  // 대분수 → 가분수: w + n/d → ?/d
  if (problem.op === "mixed_to_improper") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Mixed w={raw.whole} n={raw.num} d={raw.den} />
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Frac n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <FracInput />
        )}
        {isGraded && !problem.is_example && correct === false && (
          <span className="ml-2 text-[#6b7280]" style={{ fontSize: "13px" }}>
            (정답 {raw.ans_num}/{raw.ans_den})
          </span>
        )}
      </div>
    );
  }

  // 가분수 → 대분수
  if (problem.op === "improper_to_mixed") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Frac n={raw.num} d={raw.den} />
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Mixed w={raw.ans_whole} n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <MixedInput />
        )}
      </div>
    );
  }

  // 분수 비교: a/d ? b/d — 키패드 대신 >, < 버튼 두 개
  if (problem.op === "frac_compare") {
    const ans = (raw.ans as unknown) as string; // '>' or '<'
    const btnBase = "inline-flex h-7 w-7 items-center justify-center rounded border text-base font-bold transition";
    const renderBtn = (sym: ">" | "<") => {
      const selected = userAns === sym;
      const cls = problem.is_example
        ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
        : isGraded
          ? selected
            ? correct
              ? "border-[#15803d] bg-[#15803d] text-white"
              : "border-[#b91c1c] bg-[#b91c1c] text-white"
            : "border-[#e5e7eb] bg-white text-[#6b7280]"
          : selected
            ? "border-[#111827] bg-[#111827] text-white"
            : "border-[#e5e7eb] bg-white text-[#111827] hover:border-[#111827]";
      return (
        <button
          key={sym}
          type="button"
          disabled={isGraded || problem.is_example}
          onClick={() => onChange(sym)}
          className={`${btnBase} ${cls}`}
        >
          {sym}
        </button>
      );
    };
    return (
      <div className="font-mono flex items-center gap-2" style={{ fontSize: "18px" }}>
        <Frac n={raw.a_num} d={raw.a_den} />
        {problem.is_example ? (
          <span className={`mx-1 ${inputCls}`} style={{ fontWeight: 700 }}>{String(raw.ans)}</span>
        ) : (
          <span className="mx-1 inline-flex gap-1">
            {renderBtn(">")}
            {renderBtn("<")}
          </span>
        )}
        <Frac n={raw.b_num} d={raw.b_den} />
        {isGraded && !problem.is_example && correct === false && (
          <span className="ml-2 text-[#6b7280]" style={{ fontSize: "13px" }}>
            (정답 {String(ans)})
          </span>
        )}
      </div>
    );
  }

  // 대분수 덧셈/뺄셈
  if (problem.op === "mixed_add" || problem.op === "mixed_sub") {
    const opSym = problem.op === "mixed_add" ? "+" : "−";
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Mixed w={raw.w1} n={raw.n1} d={raw.d} />
        <span className="mx-1">{opSym}</span>
        <Mixed w={raw.w2} n={raw.n2} d={raw.d} />
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Mixed w={raw.ans_whole} n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <MixedInput />
        )}
      </div>
    );
  }

  // 분모 다른 분수 덧/뺄
  if (problem.op === "frac_add_diff" || problem.op === "frac_sub_diff") {
    const opSym = problem.op === "frac_add_diff" ? "+" : "−";
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Frac n={raw.a_num} d={raw.a_den} />
        <span className="mx-1">{opSym}</span>
        <Frac n={raw.b_num} d={raw.b_den} />
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Frac n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <FracInput />
        )}
      </div>
    );
  }

  // 분수의 곱셈/나눗셈 (진분수×진분수)
  if (problem.op === "frac_mul" || problem.op === "frac_div") {
    const opSym = problem.op === "frac_mul" ? "×" : "÷";
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Frac n={raw.a_num} d={raw.a_den} />
        <span className="mx-1">{opSym}</span>
        <Frac n={raw.b_num} d={raw.b_den} />
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Frac n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <FracInput />
        )}
      </div>
    );
  }
  // 자연수 X 분수
  if (problem.op === "frac_mul_nat") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.whole} <span className="mx-1">×</span>
        <Frac n={raw.b_num} d={raw.b_den} />
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Frac n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <FracInput />
        )}
      </div>
    );
  }
  // 분수 ÷ 자연수
  if (problem.op === "frac_div_nat") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Frac n={raw.a_num} d={raw.a_den} />
        <span className="mx-1">÷</span>
        {raw.whole}
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Frac n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <FracInput />
        )}
      </div>
    );
  }

  // 약분
  if (problem.op === "reduce_frac") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Frac n={raw.num} d={raw.den} />
        <span className="mx-1">=</span>
        {problem.is_example ? (
          <Frac n={raw.ans_num} d={raw.ans_den} />
        ) : (
          <FracInput />
        )}
      </div>
    );
  }
  // 통분: 두 분수 통분
  if (problem.op === "common_denom") {
    return (
      <div className="font-mono" style={{ fontSize: "15px" }}>
        (<Frac n={raw.a_num} d={raw.a_den} />,{" "}
        <Frac n={raw.b_num} d={raw.b_den} />)<span className="mx-1">→</span>
        {problem.is_example ? (
          <span>
            (<Frac n={raw.ans_a_num} d={raw.ans_lcm} />,{" "}
            <Frac n={raw.ans_b_num} d={raw.ans_lcm} />)
          </span>
        ) : (
          (() => {
            const parts = (userAns || ", ").split(",");
            const a = (parts[0] || "").trim();
            const b = (parts[1] || "").trim();
            const setA = (v: string) => onChange(`${v}, ${b}`);
            const setB = (v: string) => onChange(`${a}, ${v}`);
            const fInput = (val: string, set: (v: string) => void) => {
              const [n = "", d = ""] = val.split("/");
              const cell: React.CSSProperties = { width: 28, textAlign: "center", border: "none", padding: 0, fontFamily: "inherit", fontSize: "inherit" };
              return (
                <span className={`inline-flex flex-col items-center align-middle ${inputCls}`} style={{ lineHeight: 1 }}>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={n} disabled={isGraded}
                    onChange={(e) => set(`${e.target.value}/${d}`)}
                    className="bg-transparent outline-none" style={cell} />
                  <span style={{ borderTop: "1px solid #111827", width: "100%", margin: "1px 0" }} />
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={d} disabled={isGraded}
                    onChange={(e) => set(`${n}/${e.target.value}`)}
                    className="bg-transparent outline-none" style={cell} />
                </span>
              );
            };
            return (
              <span>
                ({fInput(a, setA)}, {fInput(b, setB)})
              </span>
            );
          })()
        )}
      </div>
    );
  }

  // === 소수 덧셈/뺄셈/곱셈/나눗셈 ===
  if (problem.op === "dec_add" || problem.op === "dec_sub") {
    const opSym = problem.op === "dec_add" ? "+" : "−";
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} <span className="mx-1">{opSym}</span> {raw.b}
        <span className="mx-1">=</span>
        {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "dec_mul") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} <span className="mx-1">×</span> {raw.b}
        <span className="mx-1">=</span>
        {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "dec_mul_nat") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.whole} <span className="mx-1">×</span> {raw.dec}
        <span className="mx-1">=</span>
        {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "dec_div_nat") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} <span className="mx-1">÷</span> {raw.whole}
        <span className="mx-1">=</span>
        {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "dec_div") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} <span className="mx-1">÷</span> {raw.b}
        <span className="mx-1">=</span>
        {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "nat_div_dec") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} <span className="mx-1">÷</span> {raw.b}
        <span className="mx-1">=</span>
        {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "nat_div_nat_dec") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} <span className="mx-1">÷</span> {raw.b}
        <span className="mx-1">=</span>
        {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "cont_ratio") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} : {raw.b} : {raw.c} <span className="mx-1">=</span>{" "}
        {problem.is_example ? (
          <span className={inputCls}>{raw.ans_a} : {raw.ans_b} : {raw.ans_c}</span>
        ) : (
          Box(`${raw.ans_a}:${raw.ans_b}:${raw.ans_c}`, 100)
        )}
      </div>
    );
  }

  // === 약수와 배수 ===
  if (problem.op === "factors") {
    const ans = (raw.ans as unknown) as number[];
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.n}의 약수:{" "}
        {problem.is_example ? (
          <span className={inputCls}>{Array.isArray(ans) ? ans.join(", ") : ""}</span>
        ) : (
          Box("(예: 1, 2, 4)", 140)
        )}
      </div>
    );
  }
  if (problem.op === "multiples") {
    const ans = (raw.ans as unknown) as number[];
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.n}의 배수 (10개):{" "}
        {problem.is_example ? (
          <span className={inputCls}>{Array.isArray(ans) ? ans.join(", ") : ""}</span>
        ) : (
          Box("(예: 2, 4, 6...)", 180)
        )}
      </div>
    );
  }
  if (problem.op === "gcd") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a}, {raw.b}의 최대공약수 = {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "lcm") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a}, {raw.b}의 최소공배수 = {Box(raw.ans)}
      </div>
    );
  }

  // === 비/비율/백분율 ===
  if (problem.op === "ratio_simplify") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} : {raw.b} <span className="mx-1">=</span>{" "}
        {problem.is_example ? (
          <span className={inputCls}>{raw.ans_a} : {raw.ans_b}</span>
        ) : (
          Box(`${raw.ans_a}:${raw.ans_b}`, 80)
        )}
      </div>
    );
  }
  if (problem.op === "ratio_to_pct") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        <Frac n={raw.num} d={raw.den} /> <span className="mx-1">=</span>{" "}
        {Box(raw.ans)} %
      </div>
    );
  }
  if (problem.op === "proportion") {
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} : {raw.b} = {raw.c} : {Box(raw.ans)}
      </div>
    );
  }
  if (problem.op === "prop_share") {
    return (
      <div className="font-mono" style={{ fontSize: "15px" }}>
        {raw.total}을 {raw.a} : {raw.b}로 →{" "}
        {problem.is_example ? (
          <span className={inputCls}>{raw.ans_a}, {raw.ans_b}</span>
        ) : (
          Box(`${raw.ans_a}, ${raw.ans_b}`, 100)
        )}
      </div>
    );
  }

  // === 자연수 혼합 계산 (5학년) ===
  if (problem.op === "mixed_calc") {
    const ops = String(raw.ops || "");
    return (
      <div className="font-mono" style={{ fontSize: "18px" }}>
        {raw.a} {ops[0]} {raw.b} {ops[1]} {raw.c} = {Box(raw.ans)}
      </div>
    );
  }

  // unknown op fallthrough
  return (
    <div className="text-sm text-[#6b7280]">
      (이 양식은 표시 준비 중입니다)
    </div>
  );
}

function Mixed({ w, n, d }: { w: number; n: number; d: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span style={{ fontSize: "18px", marginRight: "2px" }}>{w}</span>
      <Frac n={n} d={d} />
    </span>
  );
}

function Frac({ n, d }: { n: number; d: number }) {
  return (
    <span
      className="inline-flex flex-col items-center align-middle"
      style={{ lineHeight: 1, verticalAlign: "middle" }}
    >
      <span style={{ fontSize: "13px" }}>{n}</span>
      <span style={{ borderTop: "1px solid #111827", width: "100%", margin: "1px 0" }} />
      <span style={{ fontSize: "13px" }}>{d}</span>
    </span>
  );
}

function padDigits(n: number, length: number, blankIfZero = false): string[] {
  if (blankIfZero && n === 0) return Array(length).fill("");
  const s = String(Math.abs(n));
  const pad = Math.max(0, length - s.length);
  return [...Array(pad).fill(""), ...s.split("")];
}

function computeCarries(
  a: number,
  b: number,
  op: "+" | "-",
  length: number
): string[] {
  const result: string[] = Array(length).fill("");
  if (op === "+") {
    let carry = 0;
    const aDigits = padDigits(a, length);
    const bDigits = padDigits(b, length);
    for (let i = length - 1; i >= 0; i--) {
      const da = parseInt(aDigits[i] || "0");
      const db = parseInt(bDigits[i] || "0");
      const sum = da + db + carry;
      if (sum >= 10) {
        carry = 1;
        if (i > 0) result[i - 1] = "1";
      } else {
        carry = 0;
      }
    }
  } else {
    // 뺄셈 — 받아내림 표시는 윗줄 작은 숫자
    const aDigits = padDigits(a, length);
    const bDigits = padDigits(b, length);
    let borrow = 0;
    for (let i = length - 1; i >= 0; i--) {
      let da = parseInt(aDigits[i] || "0") - borrow;
      const db = parseInt(bDigits[i] || "0");
      if (da < db) {
        result[i] = String(da + 10);
        borrow = 1;
      } else {
        borrow = 0;
      }
    }
  }
  return result;
}

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
  const isHorizontal =
    sheet.type === "drill_h_add" ||
    sheet.type === "drill_h_sub" ||
    sheet.type === "drill_h_mul" ||
    sheet.type === "drill_h_div";

  if (problems.length === 0) {
    return (
      <div className="rounded border border-dashed border-[#e5e7eb] bg-[#fafafa] p-8 text-center text-sm text-[#6b7280]">
        이 양식은 아직 문제 풀이 준비 중입니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-5 print:grid-cols-2">
      {problems.map((p) => (
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
}: {
  problem: DrillProblem;
  isHorizontal: boolean;
  isGraded: boolean;
  answer: string;
  onChange: (v: string) => void;
}) {
  const userAns = problem.is_example ? String(problem.answer) : answer;
  const correct =
    isGraded && !problem.is_example
      ? Number(answer.replace(/[^\d-]/g, "")) === problem.answer
      : null;

  return (
    <div
      className="break-inside-avoid"
      style={{ wordBreak: "keep-all" }}
    >
      {/* 번호 */}
      <div
        className="mb-1 font-serif font-bold text-[#111827]"
        style={{ fontSize: "16px" }}
      >
        {problem.index}.
      </div>

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
      style={{ fontSize: "16px", letterSpacing: "0.02em" }}
    >
      {a} {problem.op} {b} ={" "}
      {problem.is_example ? (
        <span className={inputCls}>{problem.answer}</span>
      ) : (
        <input
          type="text"
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
      style={{ fontSize: "16px", letterSpacing: "0.04em" }}
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

  const Box = (val: string | number, w = 56) =>
    problem.is_example ? (
      <span className={inputCls}>{val}</span>
    ) : (
      <input
        type="text"
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

  // 분수 덧/뺄 (분모 같음)
  if (problem.op === "frac_add" || problem.op === "frac_sub") {
    const [an, ad, bn, bd] = problem.operands;
    const opSym = problem.op === "frac_add" ? "+" : "−";
    return (
      <div className="font-mono" style={{ fontSize: "16px" }}>
        <Frac n={an} d={ad} /> <span className="mx-1">{opSym}</span>{" "}
        <Frac n={bn} d={bd} /> <span className="mx-1">=</span>{" "}
        {problem.is_example ? (
          <Frac n={problem.answer} d={problem.ans_den ?? ad} />
        ) : (
          Box(`${problem.answer}/${problem.ans_den ?? ad}`, 80)
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
      <div className="font-mono" style={{ fontSize: "16px" }}>
        {n} = {a} + {Box(problem.answer)}
      </div>
    );
  }

  // 10 만들기: a + ? = 10
  if (problem.op === "make_ten") {
    return (
      <div className="font-mono" style={{ fontSize: "16px" }}>
        {problem.operands[0]} + {Box(problem.answer)} = 10
      </div>
    );
  }
  // 10에서 빼기: 10 − a = ?
  if (problem.op === "break_ten") {
    return (
      <div className="font-mono" style={{ fontSize: "16px" }}>
        10 − {problem.operands[0]} = {Box(problem.answer)}
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
      <div className="font-mono" style={{ fontSize: "16px" }}>
        {a} {o1} {b} {o2} {c} = {Box(problem.answer)}
        {isGraded && !problem.is_example && correct === false && (
          <span className="ml-2 text-[#6b7280]" style={{ fontSize: "13px" }}>
            (정답 {problem.answer})
          </span>
        )}
      </div>
    );
  }

  // unknown op
  return (
    <div className="text-sm text-[#6b7280]">
      (이 양식은 표시 준비 중입니다)
    </div>
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

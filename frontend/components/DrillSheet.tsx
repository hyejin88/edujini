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
    sheet.type === "drill_h_add" || sheet.type === "drill_h_sub";

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

      {isHorizontal ? (
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
  const carries: string[] = problem.is_example
    ? computeCarries(a, b, problem.op, maxDigits)
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

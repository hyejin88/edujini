"""/api/v1/attempts — 풀이 제출 + 4축 오답 라벨링.

Gemini 호출은 free tier 한도 인지하여 실패 시 휴리스틱 fallback.
"""
from __future__ import annotations

import json
import os
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..ai.prompts import LABEL_SYSTEM, USER_LABEL
from ..store import store


router = APIRouter()


class AttemptCreate(BaseModel):
    user_id: str
    problem_id: str
    user_answer: str
    time_spent_sec: int = 0


@router.post("")
async def create_attempt(payload: AttemptCreate):
    p = store.get_problem(payload.problem_id)
    if not p:
        raise HTTPException(404, "problem not found")

    correct = store.is_correct(p, payload.user_answer)
    error_label: str | None = None
    if not correct:
        error_label = await _label(p, payload.user_answer) or _heuristic_label(p, payload.user_answer)

    store.record_attempt(
        user_id=payload.user_id,
        problem_id=payload.problem_id,
        user_answer=payload.user_answer,
        correct=correct,
        error_label=error_label,
        time_spent_sec=payload.time_spent_sec,
    )
    return {
        "correct": correct,
        "error_label": error_label,
        "correct_answer": p.get("answer"),
        "explanation": p.get("explanation"),
    }


async def _label(problem: dict, student_answer: str) -> str | None:
    """Gemini Flash로 4축 라벨 분류. free tier 한도 시 None 반환."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore
    except ImportError:
        return None

    user = USER_LABEL.format(
        problem_body=problem.get("body", ""),
        correct_answer=problem.get("answer", ""),
        explanation=problem.get("explanation", ""),
        student_answer=student_answer,
        previous_labels="",
    )
    try:
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash"),
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=LABEL_SYSTEM,
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", (resp.text or "").strip())
        data = json.loads(text)
        return data.get("label")
    except Exception:
        return None


def _heuristic_label(problem: dict, student_answer: str) -> str:
    """Gemini 호출 실패 시 휴리스틱: 공통 오답 매칭 → 미스매치 시 '계산실수'."""
    for ce in problem.get("common_errors", []) or []:
        wrong = str(ce.get("wrong_answer", "")).strip()
        if wrong and wrong == student_answer.strip():
            return ce.get("label") or "계산실수"
    return "계산실수"

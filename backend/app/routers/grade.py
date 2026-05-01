"""/api/v1/grade — 일괄 채점 (학습지 모드용)."""
from __future__ import annotations

from collections import Counter

from fastapi import APIRouter
from pydantic import BaseModel

from ..routers.attempts import _heuristic_label, _label
from ..store import store


router = APIRouter()


class BatchAnswer(BaseModel):
    problem_id: str
    user_answer: str


class BatchGradeRequest(BaseModel):
    user_id: str
    answers: list[BatchAnswer]


@router.post("")
async def grade_batch(payload: BatchGradeRequest):
    results = []
    correct = 0
    for ans in payload.answers:
        p = store.problems.get(ans.problem_id)
        if not p:
            continue
        is_correct = store.is_correct(p, ans.user_answer)
        if is_correct:
            correct += 1
        error_label = None
        if not is_correct:
            try:
                error_label = await _label(p, ans.user_answer)
            except Exception:
                error_label = None
            if not error_label:
                error_label = _heuristic_label(p, ans.user_answer)
        store.record_attempt(
            user_id=payload.user_id,
            problem_id=ans.problem_id,
            user_answer=ans.user_answer,
            correct=is_correct,
            error_label=error_label,
            time_spent_sec=0,
        )
        results.append({
            "problem_id": ans.problem_id,
            "correct": is_correct,
            "correct_answer": p.get("answer"),
            "explanation": p.get("explanation"),
            "error_label": error_label,
        })

    total = len(results)
    error_counts = Counter(
        r["error_label"] for r in results if not r["correct"] and r["error_label"]
    )
    return {
        "total": total,
        "correct": correct,
        "score_pct": round(correct / total * 100) if total else 0,
        "error_breakdown": dict(error_counts),
        "results": results,
    }

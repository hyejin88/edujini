"""/api/v1/problems — 문항 조회."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ..store import store


router = APIRouter()


@router.get("")
async def list_problems(
    grade: int = Query(..., ge=1, le=12),
    subject: str = Query(...),
    unit_id: str | None = None,
    difficulty: int | None = Query(None, ge=1, le=5),
    limit: int = Query(5, ge=1, le=30),
):
    items = store.list_problems(
        grade=grade, subject=subject, unit_id=unit_id, difficulty=difficulty, limit=limit
    )
    # 학생에게 정답·해설을 노출하지 않도록 마스킹
    return [_mask(p) for p in items]


@router.get("/{problem_id}")
async def get_problem(problem_id: str):
    p = store.get_problem(problem_id)
    if not p:
        raise HTTPException(404, "Problem not found")
    return _mask(p)


def _mask(p: dict) -> dict:
    return {
        "id": p["id"],
        "subject": p["subject"],
        "grade": p["grade"],
        "unit_id": p["unit_id"],
        "unit_name": p.get("unit_name", ""),
        "publisher": p["publisher"],
        "type": p["type"],
        "difficulty": p["difficulty"],
        "body": p["body"],
        "choices": p.get("choices"),
        "concept_tags": p.get("concept_tags", []),
    }

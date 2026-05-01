"""/api/v1/units — 단원 목록 + 단원별 문제 카운트."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from ..store import store

router = APIRouter()
ROOT = Path(__file__).resolve().parent.parent.parent.parent
UNITS_PATH = ROOT / "data" / "grade3" / "units.json"


def _load_units() -> list[dict]:
    if not UNITS_PATH.exists():
        return []
    return json.loads(UNITS_PATH.read_text(encoding="utf-8"))


@router.get("")
async def list_units(
    grade: int = Query(..., ge=1, le=12),
    subject: str | None = None,
):
    units = _load_units()
    units = [u for u in units if u.get("grade") == grade]
    if subject:
        units = [u for u in units if u.get("subject") == subject]
    counts = Counter(p["unit_id"] for p in store.problems.values())
    out = []
    for u in units:
        c = counts.get(u["id"], 0)
        out.append({
            **u,
            "problem_count": c,
            "available": c > 0,
        })
    return out


@router.get("/{unit_id}")
async def get_unit(unit_id: str):
    units = _load_units()
    u = next((x for x in units if x["id"] == unit_id), None)
    if not u:
        raise HTTPException(404, "unit not found")
    items = [p for p in store.problems.values() if p["unit_id"] == unit_id]
    return {**u, "problem_count": len(items)}


@router.get("/{unit_id}/problems")
async def list_unit_problems(
    unit_id: str,
    difficulty: int | None = Query(None, ge=1, le=5),
    limit: int = Query(50, ge=1, le=200),
    include_answers: bool = Query(False),
):
    items = [p for p in store.problems.values() if p["unit_id"] == unit_id]
    if difficulty:
        items = [p for p in items if p["difficulty"] == difficulty]
    items.sort(key=lambda p: (p["difficulty"], p["id"]))
    items = items[:limit]
    out = []
    for p in items:
        rec = {
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
        if include_answers:
            rec["answer"] = p.get("answer", "")
            rec["explanation"] = p.get("explanation", "")
        out.append(rec)
    return out

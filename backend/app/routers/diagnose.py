"""/api/v1/diagnose — 사용자별 진단 결과."""
from __future__ import annotations

from fastapi import APIRouter

from ..store import store


router = APIRouter()


@router.get("/{user_id}")
async def diagnose(user_id: str):
    return store.diagnose(user_id)

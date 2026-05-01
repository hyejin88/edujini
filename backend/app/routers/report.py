"""/api/v1/report — 학부모 리포트 (Gemini Flash로 자연어 생성).

free tier 한도 초과 시 템플릿 기반 fallback.
"""
from __future__ import annotations

import json
import os
import re

from fastapi import APIRouter

from ..ai.prompts import PARENT_REPORT_SYSTEM
from ..store import store


router = APIRouter()


@router.get("/{user_id}")
async def parent_report(user_id: str, child_name: str = "OO"):
    diag = store.diagnose(user_id)
    weak = diag.get("weak_units", [])
    eb = diag.get("error_breakdown", {})

    ai = await _ai_report(child_name, diag)
    if ai:
        return {"diagnosis": diag, "report": ai, "source": "gemini"}

    return {"diagnosis": diag, "report": _fallback(child_name, diag), "source": "template"}


async def _ai_report(child_name: str, diag: dict) -> dict | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore
    except ImportError:
        return None

    user = (
        f"자녀 별명: {child_name}\n"
        f"진단 요약: {json.dumps(diag, ensure_ascii=False)}\n"
        "위 데이터로 학부모용 주간 리포트를 작성해줘. JSON 출력."
    )
    try:
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model=os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash"),
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=PARENT_REPORT_SYSTEM,
                temperature=0.6,
                response_mime_type="application/json",
            ),
        )
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", (resp.text or "").strip())
        return json.loads(text)
    except Exception:
        return None


def _fallback(child_name: str, diag: dict) -> dict:
    weak = diag.get("weak_units", [])
    score = diag.get("score_pct", 0)
    total = diag.get("total", 0)
    correct = diag.get("correct", 0)
    weak_text = (
        f"{weak[0].get('unit_name', '')} 단원" if weak else "전 단원 고르게 풀이"
    )
    next_action = (
        f"이번 주 {weak[0].get('unit_name', '약점 단원')}만 5문항 더 풀어보기"
        if weak
        else "현재 수준 유지하며 새로운 단원 도전"
    )
    return {
        "subject": f"이번 주 {child_name}이의 학습 리포트",
        "summary": f"이번 진단에서 총 {total}문항 중 {correct}문항을 맞혀 {score}점이에요.",
        "highlights": [f"{child_name}이는 진단을 끝까지 완주했어요.", "풀이 시간에 집중이 잘 됐어요."],
        "concerns": [f"{weak_text}에서 정답률이 낮아요. 개념 복습이 도움될 거예요."],
        "next_action": next_action,
    }

"""Gemini API 키 유효성 + 프롬프트 라이브러리 1문항 생성 검증.

사용:
    .venv/bin/python scripts/test_gemini.py

성공 조건:
    1. 환경변수 GEMINI_API_KEY 로드
    2. gemini-2.5-flash 호출 200 OK
    3. JSON 출력 파싱 성공
    4. 스키마 필수 키 존재 (problems[].body, .answer, .explanation)
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.ai.prompts import SYSTEM_CHEONJAE, USER_GENERATE  # noqa: E402


def main() -> int:
    load_dotenv(ROOT / ".env.local")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[FAIL] GEMINI_API_KEY 환경변수 없음")
        return 1

    flash_model = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
    print(f"[INFO] model = {flash_model}")
    print(f"[INFO] key prefix = {api_key[:10]}...")

    client = genai.Client(api_key=api_key)

    user_prompt = USER_GENERATE.format(
        grade=3,
        subject="수학",
        publisher="천재교육",
        standard_code="[4수01-01]",
        standard_text="네 자리 이하의 수의 범위에서 자릿값과 위치적 기수법을 이해한다.",
        unit_name="큰 수",
        sub_unit_name="네 자리 수",
        concepts="자릿값, 위치적 기수법, 네 자리 수",
        n=1,
    )

    print("[INFO] Gemini API 호출 중...")
    response = client.models.generate_content(
        model=flash_model,
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_CHEONJAE,
            temperature=0.7,
            response_mime_type="application/json",
        ),
    )

    raw = response.text or ""
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)

    print("=" * 60)
    print("[RAW OUTPUT]")
    print(raw[:2000])
    print("=" * 60)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[FAIL] JSON 파싱 실패: {e}")
        return 2

    problems = data.get("problems", [])
    if not problems:
        print("[FAIL] problems 키 없음 또는 빈 배열")
        return 3

    p = problems[0]
    required = ["type", "difficulty", "body", "answer", "explanation"]
    missing = [k for k in required if k not in p]
    if missing:
        print(f"[FAIL] 필수 키 누락: {missing}")
        return 4

    print("[PASS] Gemini API 키 유효")
    print(f"[PASS] {flash_model} 호출 성공")
    print(f"[PASS] JSON 파싱 OK, problems × {len(problems)}")
    print(f"[PASS] 첫 문항 type={p['type']}, difficulty={p['difficulty']}")
    print(f"[PASS] body 길이={len(str(p['body']))} 자")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Pro 검증 스크립트 (분리 실행).

generate_grade3.py 의 검증 부분이 free tier 한도 초과로 실패해서 분리.
정규화된 problems_normalized.jsonl 에서 무작위 N개 추출 → Pro 검증.
"""
from __future__ import annotations

import json
import os
import random
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.ai.prompts import VERIFY_SYSTEM  # noqa: E402

load_dotenv(ROOT / ".env.local")
PRO = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro")
SAMPLE_N = int(os.getenv("VERIFY_SAMPLE_N", "10"))
SLEEP_SEC = 8  # Pro free tier RPM 5

OUT_DIR = ROOT / "data" / "grade3"
NORM = OUT_DIR / "problems_normalized.jsonl"
VERIFIED = OUT_DIR / "problems_verified.jsonl"


def parse_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", (text or "").strip(), flags=re.MULTILINE)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {}


def main() -> int:
    if not NORM.exists():
        print(f"[ERR] {NORM} 없음 — 먼저 generate_grade3.py 실행")
        return 1

    with NORM.open(encoding="utf-8") as f:
        problems = [json.loads(line) for line in f]
    print(f"[STATE] {len(problems)} 문항 로드")

    sample = random.sample(problems, min(SAMPLE_N, len(problems)))
    print(f"[PLAN] Pro 검증 {len(sample)}건 (sleep {SLEEP_SEC}s/call)")

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    verified: list[dict] = []
    scores: list[int] = []
    fails = 0

    for i, p in enumerate(sample):
        try:
            resp = client.models.generate_content(
                model=PRO,
                contents=f"검증 대상 문항:\n{json.dumps(p, ensure_ascii=False)}",
                config=types.GenerateContentConfig(
                    system_instruction=VERIFY_SYSTEM,
                    temperature=0.2,
                    response_mime_type="application/json",
                ),
            )
            v = parse_json(resp.text or "")
        except Exception as e:
            print(f"  [{i+1:02d}] {p['_id']} → ERR {e}")
            time.sleep(SLEEP_SEC)
            continue

        score = int(v.get("score", 0))
        approved = bool(v.get("approved", False)) and score >= 7
        scores.append(score)
        if approved:
            verified.append({**p, "_verify": v})
        else:
            fails += 1
        print(f"  [{i+1:02d}] {p['_id'][:50]:<50} score={score} approved={approved}")
        time.sleep(SLEEP_SEC)

    with VERIFIED.open("w", encoding="utf-8") as f:
        for r in verified:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    avg = sum(scores) / len(scores) if scores else 0
    print(f"[VERIFIED] {len(verified)}/{len(sample)} 통과")
    print(f"[AVG SCORE] {avg:.2f}/10")
    print(f"[FAIL] {fails} (score<7 또는 approved=false)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

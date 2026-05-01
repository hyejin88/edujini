"""초3 PoC 문항 생성기 v2 — 누락분 재생성 + rate limit 대응 + JSON 정규화.

v1 이슈 수정:
  - JSON 파싱: dict / list 양쪽 처리
  - Rate limit: 호출 사이 4초 sleep (RPM 15 free tier 안전선)
  - 429 응답 시 30초 백오프 후 1회 재시도
  - type/difficulty 정규화 (객관식 → multiple_choice, "1단계" → 1)
  - 이미 생성된 (_unit_id, _publisher) 조합은 skip
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.ai.prompts import SYSTEM_BY_PUBLISHER, USER_GENERATE  # noqa: E402


load_dotenv(ROOT / ".env.local")
API_KEY = os.environ["GEMINI_API_KEY"]
FLASH = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
PUBLISHERS = ["천재교육", "비상교육", "미래엔"]
PER_UNIT_PER_PUBLISHER = 6
SLEEP_SEC = 4

OUT_DIR = ROOT / "data" / "grade3"
RAW_PATH = OUT_DIR / "problems_raw.jsonl"
NORMALIZED_PATH = OUT_DIR / "problems_normalized.jsonl"


def strip_fences(text: str) -> str:
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", (text or "").strip(), flags=re.MULTILINE)


def parse_problems(text: str) -> list[dict]:
    """Gemini 응답을 list[problem] 형태로 정규화."""
    text = strip_fences(text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return []
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if "problems" in data and isinstance(data["problems"], list):
            return data["problems"]
        if "type" in data and "body" in data:
            return [data]
    return []


def normalize_problem(p: dict) -> dict:
    t = p.get("type", "")
    if t in ("객관식", "다지선다", "multiple choice"):
        t = "multiple_choice"
    elif t in ("단답형", "주관식", "short answer"):
        t = "short_answer"
    p["type"] = t or "multiple_choice"

    d = p.get("difficulty", 2)
    if isinstance(d, str):
        m = re.search(r"\d", d)
        d = int(m.group(0)) if m else 2
    p["difficulty"] = max(1, min(5, int(d)))

    p.setdefault("answer_aliases", [])
    p.setdefault("concept_tags", [])
    p.setdefault("common_errors", [])
    return p


def call_with_retry(client, **kwargs):
    try:
        return client.models.generate_content(**kwargs)
    except Exception as e:
        msg = str(e)
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            print(f"  [429] 30초 대기 후 재시도")
            time.sleep(30)
            return client.models.generate_content(**kwargs)
        raise


def generate_for_unit(client, unit, publisher, n):
    user = USER_GENERATE.format(
        grade=unit["grade"],
        subject=unit["subject"],
        publisher=publisher,
        standard_code=unit["standard_code"],
        standard_text=unit["standard_text"],
        unit_name=unit["unit_name"],
        sub_unit_name=unit["sub_unit"],
        concepts=", ".join(unit["concepts"]),
        n=n,
    )
    resp = call_with_retry(
        client,
        model=FLASH,
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_BY_PUBLISHER[publisher],
            temperature=0.85,
            response_mime_type="application/json",
        ),
    )
    return parse_problems(resp.text or "")


def main() -> int:
    units = json.loads((OUT_DIR / "units.json").read_text(encoding="utf-8"))
    client = genai.Client(api_key=API_KEY)

    # 기존 raw 로드 + 정규화
    existing: list[dict] = []
    done_keys: set[tuple[str, str]] = set()
    if RAW_PATH.exists():
        with RAW_PATH.open(encoding="utf-8") as f:
            for line in f:
                p = json.loads(line)
                existing.append(p)
                done_keys.add((p["_unit_id"], p["_publisher"]))

    print(f"[STATE] 기존 {len(existing)} 문항, {len(done_keys)} 조합 완료")

    # 누락 조합 재생성
    new_records: list[dict] = []
    pending = [
        (u, pub) for u in units for pub in PUBLISHERS if (u["id"], pub) not in done_keys
    ]
    print(f"[PLAN] 누락 조합 {len(pending)}개 재생성 (sleep {SLEEP_SEC}s/call)")

    for i, (unit, publisher) in enumerate(pending):
        try:
            problems = generate_for_unit(client, unit, publisher, PER_UNIT_PER_PUBLISHER)
        except Exception as e:
            print(f"  [{i+1:02d}] {unit['unit_name'][:12]:<14} / {publisher} → ERR {e}")
            time.sleep(SLEEP_SEC)
            continue
        for idx, p in enumerate(problems):
            p["_unit_id"] = unit["id"]
            p["_publisher"] = publisher
            p["_seq"] = idx
            p["_id"] = f"{unit['id']}::{publisher}::{idx}"
            new_records.append(p)
        print(f"  [{i+1:02d}] {unit['unit_name'][:12]:<14} / {publisher} → {len(problems)}문항")
        time.sleep(SLEEP_SEC)

    # 합치기 + raw append
    all_records = existing + new_records
    with RAW_PATH.open("w", encoding="utf-8") as f:
        for r in all_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"[RAW] 총 {len(all_records)} 문항 → {RAW_PATH}")

    # 정규화 버전
    normalized = [normalize_problem(dict(p)) for p in all_records]
    with NORMALIZED_PATH.open("w", encoding="utf-8") as f:
        for r in normalized:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"[NORM] {len(normalized)} 문항 → {NORMALIZED_PATH}")

    # 통계
    from collections import Counter
    by_unit = Counter(r["_unit_id"] for r in normalized)
    by_pub = Counter(r["_publisher"] for r in normalized)
    by_type = Counter(r["type"] for r in normalized)
    by_diff = Counter(r["difficulty"] for r in normalized)
    print(f"[STAT] 단원 분포: {dict(by_unit)}")
    print(f"[STAT] 출판사 분포: {dict(by_pub)}")
    print(f"[STAT] 유형 분포: {dict(by_type)}")
    print(f"[STAT] 난이도 분포: {dict(sorted(by_diff.items()))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

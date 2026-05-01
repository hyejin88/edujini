"""초3 PoC 문항 보강 v3 — 6/6/6/2 분포 + Paid tier 친화 모드.

Phase 1.5 시스템 프롬프트 정책 반영:
  - 단원당 20문항 = 연산 6 / 개념 6 / 응용 6 / 심화 2 (모델 A)
  - 객관식 70% / 단답형 30%
  - 본문 200자 이내, 보기 30자 이내
  - 함정미인지 라벨 30%+ 객관식 강제
  - answer_aliases 자동 풍부화

사용:
    .venv/bin/python scripts/generate_grade3_v3.py [unit_id...]
        인자 없으면 누락 조합 자동 탐지.

환경변수:
    SLEEP_SEC=4   # Paid tier면 1로 줄여도 됨
    MAX_CALLS=12  # 회차당 호출 수
    USE_PAID=0    # 1로 두면 sleep 1, max_calls 60 등 자동 조정
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

load_dotenv(ROOT / ".env.local")
API_KEY = os.environ["GEMINI_API_KEY"]
FLASH = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
USE_PAID = os.getenv("USE_PAID", "0") == "1"
SLEEP_SEC = int(os.getenv("SLEEP_SEC", "1" if USE_PAID else "8"))
MAX_CALLS = int(os.getenv("MAX_CALLS", "60" if USE_PAID else "12"))

PUBLISHERS = ["천재교육", "비상교육", "미래엔"]
N_PER_CALL = 20  # 단원당 한 번에 20문항 (모델 A 분포)

OUT_DIR = ROOT / "data" / "grade3"
RAW_PATH = OUT_DIR / "problems_raw.jsonl"
NORM_PATH = OUT_DIR / "problems_normalized.jsonl"
SEED_PATH = OUT_DIR / "seed.json"
UNITS_PATH = OUT_DIR / "units.json"
FRONTEND_SEED = ROOT / "frontend" / "lib" / "seed.json"

KEY_MAP = {
    "question": "body",
    "solution": "explanation",
    "options": "choices",
    "core_concepts": "concept_tags",
    "problem_type": "type",
}

# 6/6/6/2 모델 A 분포 시스템 프롬프트
SYSTEM_TEMPLATE = """You are a Korean K-12 math problem creator emulating the style of {publisher} mathematics textbooks (2022 revised curriculum).

Style hints (internal — DO NOT name in problem text):
- {publisher_style}

YOU MUST OUTPUT JSON IN THIS EXACT SCHEMA (no markdown fences, English keys only):
{{
  "problems": [
    {{
      "type": "multiple_choice" | "short_answer",
      "difficulty": 1-5,
      "section": "warmup" | "concept" | "application" | "challenge",
      "body": "...",
      "choices": [...] or null,
      "answer": "...",
      "answer_aliases": ["..."],
      "explanation": "...",
      "concept_tags": ["..."],
      "common_errors": [
        {{"label": "개념미숙|계산실수|문제해석|함정미인지", "wrong_answer": "...", "reason": "..."}}
      ]
    }}
  ]
}}

CRITICAL:
- 20문항 정확히. 분포 6/6/6/2 (warmup 6 / concept 6 / application 6 / challenge 2)
- 객관식 70% / 단답형 30%
- body 200자 이내, choice 30자 이내
- multiple_choice 4-5지선다, 함정 보기 1개 포함
- 객관식의 30% 이상은 common_errors에 "함정미인지" 라벨 1개 이상
- answer_aliases에 단위 제거 / 동치 표현 모두 포함 (예: "383개" → ["383"])
- DO NOT copy or paraphrase any actual textbook problem
- DO NOT reference {publisher} trademarked names in body/explanation
- Output JSON only
"""

PUBLISHER_STYLE = {
    "천재교육": "단원 도입부에 실생활 맥락 → 개념 도출. 문장 정제, 군더더기 없음.",
    "비상교육": "시각적 구조 강조 (표·그래프·도형). 학생 친화적 톤. 단계적 난이도.",
    "미래엔": "짧고 명확한 문제 진술. 실생활 응용 비중 높음 (교통·요리·스포츠).",
}

USER_TEMPLATE = """[학년] {grade}학년
[과목] 수학
[교과서 출판사 스타일] {publisher} (내부 힌트, body에 노출 X)
[성취기준] {standard_code} - {standard_text}
[단원] {unit_name}
[소단원] {sub_unit}
[핵심 개념] {concepts}

분포 (반드시 정확히):
  - warmup (난이도 1~2): 6문항. 짧은 단답 계산. 일일수학 패턴.
  - concept (난이도 2~3): 6문항. 객관식, 함정 보기 1개 포함.
  - application (난이도 3~4): 6문항. 짧은 서술형 (실생활 맥락).
  - challenge (난이도 4~5): 2문항. 다단계 사고 + 식·답 함께.

객관식 14문항 + 단답형 6문항 권장.
common_errors는 {{"label": ..., "wrong_answer": ..., "reason": ...}} 객체 형식.
JSON만 출력.
"""


def strip_fences(text: str) -> str:
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", (text or "").strip(), flags=re.MULTILINE)


def parse_problems(text: str) -> list[dict]:
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
        if "type" in data or "question" in data or "body" in data:
            return [data]
    return []


def normalize(p: dict) -> dict:
    for src, dst in KEY_MAP.items():
        if src in p and dst not in p:
            p[dst] = p[src]
    t = p.get("type", "")
    if t in ("객관식", "다지선다"):
        t = "multiple_choice"
    elif t in ("단답형", "주관식"):
        t = "short_answer"
    p["type"] = t or "multiple_choice"
    d = p.get("difficulty", 2)
    if isinstance(d, str):
        m = re.search(r"\d", d)
        d = int(m.group(0)) if m else 2
    p["difficulty"] = max(1, min(5, int(d)))
    ce = p.get("common_errors", [])
    if ce and isinstance(ce[0], str):
        p["common_errors"] = [{"label": x, "wrong_answer": "", "reason": ""} for x in ce]
    p.setdefault("answer_aliases", [])
    p.setdefault("concept_tags", [])
    p.setdefault("common_errors", [])
    return enrich_aliases(p)


def enrich_aliases(p: dict) -> dict:
    answer = str(p.get("answer", ""))
    aliases = set(p.get("answer_aliases") or [])
    m = re.match(r"^[①②③④⑤]\s*(.+)$", answer)
    if m:
        aliases.add(m.group(1).strip())
    m = re.match(r"^([\d./\s]+)([a-zA-Z가-힣]+)$", answer.strip())
    if m:
        aliases.add(m.group(1).strip())
    m = re.search(r"\\frac\{(\d+)\}\{(\d+)\}", answer)
    if m:
        aliases.add(f"{m.group(1)}/{m.group(2)}")
    p["answer_aliases"] = sorted(a for a in aliases if a and a != answer)
    return p


def call(client, unit, publisher):
    user = USER_TEMPLATE.format(
        grade=unit["grade"],
        publisher=publisher,
        standard_code=unit["standard_code"],
        standard_text=unit["standard_text"],
        unit_name=unit["unit_name"],
        sub_unit=unit["sub_unit"],
        concepts=", ".join(unit["concepts"]),
    )
    system = SYSTEM_TEMPLATE.format(
        publisher=publisher,
        publisher_style=PUBLISHER_STYLE[publisher],
    )
    resp = client.models.generate_content(
        model=FLASH,
        contents=user,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.85,
            response_mime_type="application/json",
        ),
    )
    return parse_problems(resp.text or "")


def write_seed():
    units = {u["id"]: u for u in json.loads(UNITS_PATH.read_text(encoding="utf-8"))}
    probs = [json.loads(l) for l in NORM_PATH.read_text(encoding="utf-8").splitlines() if l.strip()]
    seed = []
    for p in probs:
        u = units.get(p["_unit_id"], {})
        seed.append({
            "id": p["_id"],
            "subject": u.get("subject", "수학"),
            "grade": u.get("grade", 3),
            "standard_code": u.get("standard_code", ""),
            "unit_id": p["_unit_id"],
            "unit_name": u.get("unit_name", ""),
            "sub_unit": u.get("sub_unit", ""),
            "publisher": p["_publisher"],
            "type": p["type"],
            "difficulty": p["difficulty"],
            "section": p.get("section", ""),
            "body": p.get("body", ""),
            "choices": p.get("choices"),
            "answer": p.get("answer", ""),
            "answer_aliases": p.get("answer_aliases", []),
            "explanation": p.get("explanation", ""),
            "concept_tags": p.get("concept_tags", []),
            "common_errors": p.get("common_errors", []),
            "license_code": "SELF_GEN",
            "is_published": True,
        })
    SEED_PATH.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    FRONTEND_SEED.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(seed)


def main():
    units_list = json.loads(UNITS_PATH.read_text(encoding="utf-8"))
    units_by_id = {u["id"]: u for u in units_list}

    existing = []
    done_keys = set()
    if RAW_PATH.exists():
        for line in RAW_PATH.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            p = json.loads(line)
            existing.append(p)
            done_keys.add((p["_unit_id"], p["_publisher"]))
    print(f"[STATE] 기존 {len(existing)} 문항 / {len(done_keys)} 조합")
    print(f"[MODE] {'PAID' if USE_PAID else 'FREE'} tier (sleep {SLEEP_SEC}s, max {MAX_CALLS} calls)")

    targets = sys.argv[1:]
    if targets:
        plan = [
            (units_by_id[uid], pub)
            for uid in targets if uid in units_by_id
            for pub in PUBLISHERS
            if (uid, pub) not in done_keys
        ]
    else:
        priority = [u["id"] for u in units_list]
        plan = []
        for uid in priority:
            unit = units_by_id.get(uid)
            if not unit:
                continue
            for pub in PUBLISHERS:
                if (uid, pub) not in done_keys:
                    plan.append((unit, pub))

    plan = plan[:MAX_CALLS]
    print(f"[PLAN] {len(plan)} 조합 처리 (단원당 20문항 6/6/6/2 분포)")
    if not plan:
        print("[DONE] 신규 보강 대상 없음")
        write_seed()
        return 0

    client = genai.Client(api_key=API_KEY)
    new_records = []
    for i, (unit, publisher) in enumerate(plan):
        try:
            problems = call(client, unit, publisher)
            for idx, p in enumerate(problems):
                p["_unit_id"] = unit["id"]
                p["_publisher"] = publisher
                p["_seq"] = idx
                p["_id"] = f"{unit['id']}::{publisher}::{idx}"
                new_records.append(p)
            print(f"  [{i+1}/{len(plan)}] {unit['unit_name'][:14]:<16} / {publisher} → {len(problems)}문항")
        except Exception as e:
            print(f"  [{i+1}/{len(plan)}] ERR {str(e)[:120]}")
        if i + 1 < len(plan):
            time.sleep(SLEEP_SEC)

    all_records = existing + new_records
    with RAW_PATH.open("w", encoding="utf-8") as f:
        for r in all_records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    normalized = [normalize(dict(p)) for p in all_records]
    with NORM_PATH.open("w", encoding="utf-8") as f:
        for r in normalized:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    n = write_seed()
    print(f"[OK] raw={len(all_records)} norm={len(normalized)} seed={n}")
    print(f"[NEXT] frontend/lib/seed.json 자동 동기화됨. git add + push 필요.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

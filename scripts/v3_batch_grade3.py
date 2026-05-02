"""초3 단원 v3 일괄 보강 — 분당 한도 안전 마진 모드.

전략:
- 단원당 1회 호출 (단원당 20문항)
- 호출 사이 90초 sleep (분당 한도·일일 한도 안전)
- 단원당 약 50초 호출 + 90초 sleep = 약 140초/단원
- 7단원 = 약 16~20분
- 한도 걸리면 180초 백오프 후 1회 재시도

실행:
    .venv/bin/python scripts/v3_batch_grade3.py [unit_id ...]
        인자 없으면 v3 보강 안 된 단원 자동 탐지.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(ROOT / ".env.local")
API_KEY = os.environ["GEMINI_API_KEY"]
FLASH = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
SLEEP_SEC = int(os.getenv("SLEEP_SEC", "90"))
BACKOFF_SEC = 180

UNITS_PATH = ROOT / "data" / "grade3" / "units.json"
SEED_FRONT = ROOT / "frontend" / "lib" / "seed.json"

# 단원별 내부 출제 가이드 (v3 시스템 프롬프트에 보조 라인으로 주입)
UNIT_GUIDES = {
    "math-3-1-2": "평면도형(직선·반직선·선분·각). 도형 그림 묘사 절대 금지. 텍스트로만 답할 수 있는 문제 — 정의 구분, 점·끝점·시작점 위치 추론, 각도 비교(작다/크다), 이름 표기법(반직선 ㄱㄴ vs ㄴㄱ).",
    "math-3-1-3": "나눗셈 입문. 똑같이 나누기, 묶어 세기, 곱셈과 나눗셈의 관계. 12÷4=3 같은 단순 나눗셈 + 실생활 (사과·연필·공책).",
    "math-3-1-4": "(두 자리)×(한 자리) 곱셈. 분배법칙(20×3+5×3), 올림 있는·없는 곱셈. 실생활 (상자·묶음·꾸러미).",
    "math-3-1-5": "길이(mm·cm·m·km), 시간(분·초). 단위 변환, 어림하기, 비교. 도형 묘사 금지.",
    "math-3-1-6": "분수의 의미 · 소수 첫째 자리. 등분할 → 분수, 분수 → 소수 변환, 분수·소수 비교. KaTeX \\frac 강제.",
    "math-3-2-1": "(세 자리)×(한 자리), (두 자리)×(두 자리). 표준 곱셈 알고리즘. 큰 수 곱셈 응용.",
    "math-3-2-3": "원의 중심·반지름·지름. 도형 그림 묘사 금지. '지름은 반지름의 2배', '한 원에서 반지름은 모두 같다' 같은 텍스트로 답하는 문제.",
}

KEY_MAP = {"question": "body", "solution": "explanation", "options": "choices"}


def strip_fences(text: str) -> str:
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", (text or "").strip(), flags=re.MULTILINE)


def safe_parse_json(text: str) -> dict | list | None:
    """Gemini가 KaTeX 백슬래시를 단일로 출력할 때 JSON 파싱 실패 → 자동 보정."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # 1차 보정: \X 패턴 (X는 영문자) → \\X (KaTeX 명령어)
    fixed = re.sub(r'\\(?=[a-zA-Z])', r'\\\\', text)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    # 2차 보정: 제어문자 제거
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', fixed)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"  [JSON-FIX] 2차 보정도 실패: {e}", flush=True)
        return None


def normalize(p: dict) -> dict:
    for s, d in KEY_MAP.items():
        if s in p and d not in p:
            p[d] = p[s]
    if isinstance(p.get("difficulty"), str):
        m = re.search(r"\d", p["difficulty"])
        p["difficulty"] = int(m.group(0)) if m else 2
    p["difficulty"] = max(1, min(5, int(p.get("difficulty", 2))))
    if p.get("type") in ("객관식", "다지선다"):
        p["type"] = "multiple_choice"
    elif p.get("type") in ("단답형", "주관식"):
        p["type"] = "short_answer"
    ce = p.get("common_errors") or []
    if ce and isinstance(ce[0], str):
        p["common_errors"] = [{"label": x, "wrong_answer": "", "reason": ""} for x in ce]
    p.setdefault("answer_aliases", [])
    p.setdefault("concept_tags", [])
    p.setdefault("common_errors", [])
    return p


def system_prompt(unit_guide: str) -> str:
    return f"""You are a Korean K-12 math problem creator for elementary school grade 3 (초3) following 2022 revised NCIC curriculum. You produce printable worksheet content matching Korean textbook conventions.

UNIT-SPECIFIC GUIDANCE:
{unit_guide}

KOREAN MATH NOTATION STANDARD (strict):
- 분수: ALWAYS KaTeX \\frac{{a}}{{b}} (세로 분수). NEVER write a/b slash form in body or choices.
- 곱셈: KaTeX \\times (×). NEVER asterisk *.
- 나눗셈: KaTeX \\div (÷).
- 등호·연산: $245 + 138 = 383$ inline math, 한 줄. block math $$ $$ avoid in choices.
- 단위: 한국식 (개, cm, m, kg, 자루, 장, 명).
- 빈칸: KaTeX \\square (□). NEVER use ___ or [ ].
- 한국어 문제 본문 + KaTeX 수식 (inline). 평이한 학년 수준 어휘.
- 객관식 보기: pure text or single short KaTeX. NEVER include ① ② ③ ④ in body — those are auto-added by UI.

OUTPUT JSON (English keys only, no markdown fences):
{{
  "problems": [
    {{
      "type": "multiple_choice" | "short_answer",
      "difficulty": 1-5,
      "section": "warmup" | "concept" | "application" | "challenge",
      "body": "한국어 본문 + KaTeX 수식. 200자 이내. ① ② ③ ④ 절대 포함 금지.",
      "choices": ["short text or KaTeX", ...] or null for short_answer,
      "answer": "정답 (단위 포함 OK)",
      "answer_aliases": ["숫자만", "다른 표현"],
      "explanation": "단계별 풀이 (학생이 따라올 수준)",
      "concept_tags": ["..."],
      "common_errors": [
        {{"label": "개념미숙|계산실수|문제해석|함정미인지", "wrong_answer": "...", "reason": "한국어 한 줄"}}
      ]
    }}
  ]
}}

CRITICAL:
- 정확히 20문항.
- 분포 6/6/6/2: warmup 6 (난이도 1~2), concept 6 (난이도 2~3, 객관식 함정 보기), application 6 (난이도 3~4, 짧은 서술), challenge 2 (난이도 4~5, 다단계).
- 객관식 14 / 단답형 6.
- 본문 200자 이내, 보기 30자 이내.
- 출판사명 절대 언급 금지.
- 도형·그림 묘사 절대 금지 ("(그림: ..)" 표기 금지).
- 친구 대화체·다단계 bullet 절대 금지.
- output JSON only.
"""


def gen_unit(client, unit) -> list[dict]:
    user = f"""[학년] {unit['grade']}학년 / 과목: 수학
[성취기준] {unit['standard_code']} - {unit['standard_text']}
[단원] {unit['unit_name']} / 소단원: {unit['sub_unit']}
[핵심 개념] {", ".join(unit['concepts'])}

20문항 6/6/6/2 분포 정확히. 한국 초등 표기 표준 준수. JSON만 출력.
"""
    guide = UNIT_GUIDES.get(unit["id"], "")
    sys_p = system_prompt(guide)

    try:
        resp = client.models.generate_content(
            model=FLASH,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=sys_p,
                temperature=0.85,
                response_mime_type="application/json",
            ),
        )
    except Exception as e:
        msg = str(e)
        if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            print(f"  [429] backoff {BACKOFF_SEC}s 후 재시도", flush=True)
            time.sleep(BACKOFF_SEC)
            resp = client.models.generate_content(
                model=FLASH,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=sys_p,
                    temperature=0.85,
                    response_mime_type="application/json",
                ),
            )
        else:
            raise

    text = strip_fences(resp.text or "")
    data = safe_parse_json(text)
    if data is None:
        return []
    return data.get("problems", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])


def merge_into_seed(unit, new_problems):
    """frontend/lib/seed.json 갱신 (해당 단원 기존 항목 제거 후 신규 추가)."""
    seed = json.loads(SEED_FRONT.read_text(encoding="utf-8"))
    seed = [s for s in seed if s["unit_id"] != unit["id"]]
    for i, p in enumerate(new_problems):
        seed.append({
            "id": f'{unit["id"]}::v3::{i}',
            "subject": unit["subject"],
            "grade": unit["grade"],
            "standard_code": unit["standard_code"],
            "unit_id": unit["id"],
            "unit_name": unit["unit_name"],
            "sub_unit": unit["sub_unit"],
            "publisher": "자체제작",
            "type": p["type"],
            "difficulty": p["difficulty"],
            "section": p.get("section", ""),
            "body": p.get("body", ""),
            "choices": p.get("choices"),
            "answer": p.get("answer", ""),
            "answer_aliases": p["answer_aliases"],
            "explanation": p.get("explanation", ""),
            "concept_tags": p["concept_tags"],
            "common_errors": p["common_errors"],
            "license_code": "SELF_GEN",
            "is_published": True,
        })
    SEED_FRONT.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")
    return len(seed)


def main():
    units = json.loads(UNITS_PATH.read_text(encoding="utf-8"))
    units_by_id = {u["id"]: u for u in units}

    seed_existing = json.loads(SEED_FRONT.read_text(encoding="utf-8"))
    v3_done = {s["unit_id"] for s in seed_existing if s.get("id", "").startswith(f'{s["unit_id"]}::v3::')}
    print(f"[STATE] v3 완료 단원: {sorted(v3_done)}", flush=True)

    targets = sys.argv[1:]
    if not targets:
        # 자동: 초3 단원 중 v3 안 된 것
        targets = [u["id"] for u in units if u["grade"] == 3 and u["id"] not in v3_done]
    targets = [t for t in targets if t in units_by_id]
    print(f"[PLAN] 보강 대상: {targets} ({len(targets)}단원, 단원당 ~140초)", flush=True)

    if not targets:
        print("[DONE] 추가 보강 대상 없음", flush=True)
        return 0

    client = genai.Client(api_key=API_KEY)
    for i, uid in enumerate(targets):
        unit = units_by_id[uid]
        t0 = time.time()
        print(f"\n[{i+1}/{len(targets)}] {uid} ({unit['unit_name']}) 시작 ...", flush=True)
        try:
            problems = gen_unit(client, unit)
            problems = [normalize(p) for p in problems]
            elapsed = time.time() - t0
            sec_dist = Counter(p.get("section", "") for p in problems)
            type_dist = Counter(p["type"] for p in problems)
            print(f"  ✓ {len(problems)}문항 ({elapsed:.0f}s) section={dict(sec_dist)} type={dict(type_dist)}", flush=True)
            n = merge_into_seed(unit, problems)
            print(f"  → seed.json 갱신 (총 {n}문항)", flush=True)
        except Exception as e:
            print(f"  ✗ ERR: {str(e)[:200]}", flush=True)

        if i + 1 < len(targets):
            print(f"  sleep {SLEEP_SEC}s ...", flush=True)
            time.sleep(SLEEP_SEC)

    print(f"\n[OK] 모든 단원 처리 완료. git add + commit + push 권장.", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""1~6학년 단원 v3 일괄 보강 — Gemini Free tier 분당 한도 안전 마진.

사용:
  python3 scripts/v3_batch_all.py            # v3 안 된 모든 수학 단원
  python3 scripts/v3_batch_all.py --grade 4  # 특정 학년만
  python3 scripts/v3_batch_all.py math-4-1-3 # 특정 단원

v3_batch_grade3.py와 동일한 프롬프트 + KaTeX escape 보정. UNITS는 frontend/lib/units.json에서 직접 로드.
"""
import json
import os
import re
import sys
import time
from pathlib import Path
from collections import Counter

ROOT = Path("/Users/hyejin/Documents/generalv1/edutech_qa")
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    # try to load from .env.local
    env_file = ROOT / "frontend" / ".env.local"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("GEMINI_API_KEY=") or line.startswith("GOOGLE_API_KEY="):
                API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
if not API_KEY:
    print("[ERR] GEMINI_API_KEY/GOOGLE_API_KEY 환경변수 또는 frontend/.env.local 필요")
    sys.exit(1)

from google import genai

MODEL = "gemini-2.5-flash"
SLEEP_SEC = 90
BACKOFF_SEC = 180

UNITS_PATH = ROOT / "frontend" / "lib" / "units.json"
SEED_FRONT = ROOT / "frontend" / "lib" / "seed.json"

# 단원별 내부 출제 가이드
UNIT_GUIDES = {
    # 초3 (이미 완료)
    "math-3-1-3": "나눗셈 입문. 똑같이 나누기, 묶어 세기, 곱셈과 나눗셈의 관계.",
    "math-3-1-4": "(두 자리)×(한 자리) 곱셈. 분배법칙, 올림 있는·없는 곱셈.",
    "math-3-1-6": "분수의 의미·소수 첫째 자리. 등분할→분수, 분수↔소수 변환.",
    "math-3-2-1": "(세 자리)×(한 자리), (두 자리)×(두 자리). 표준 알고리즘.",
    "math-3-2-2": "(두 자리) ÷ (한 자리). 몫과 나머지, 검산.",
    "math-3-2-4": "분수 — 진분수·가분수·대분수, 같은 분모 분수 비교.",
    # 초4
    "math-4-1-3": "(세 자리)×(두 자리), (네 자리)×(두 자리), (세 자리)÷(두 자리). 표준 알고리즘 + 어림. 단계별 풀이 필요.",
    "math-4-2-1": "분모가 같은 분수의 덧셈·뺄셈. 진분수·대분수 변환 포함. KaTeX \\frac 사용.",
    "math-4-2-3": "소수 두 자리 수까지의 덧셈·뺄셈. 자릿값 정렬 강조. 일상 단위 (m·kg·L).",
    # 초5
    "math-5-1-1": "자연수의 혼합 계산. 괄호·곱셈·나눗셈·덧셈·뺄셈 우선순위. 식 세우기.",
    "math-5-1-2": "약수와 배수 — 최대공약수, 최소공배수, 공약수, 공배수. 실생활 (정사각형 만들기, 동시 출발).",
    "math-5-1-4": "약분과 통분 — 기약분수, 분모 다른 분수의 크기 비교, 분수와 소수의 관계.",
    "math-5-1-5": "분모가 다른 분수의 덧셈과 뺄셈. 통분 후 계산. KaTeX \\frac.",
    "math-5-2-2": "분수의 곱셈 — (분수)×(자연수), (자연수)×(분수), (분수)×(분수). 약분 활용.",
    "math-5-2-4": "소수의 곱셈 — (소수)×(자연수), (자연수)×(소수), (소수)×(소수). 자릿수 추적.",
    # 초6
    "math-6-1-1": "분수의 나눗셈 (분수)÷(자연수). KaTeX \\frac.",
    "math-6-1-3": "소수의 나눗셈 — (소수)÷(자연수), 몫이 소수인 자연수 나눗셈.",
    "math-6-1-4": "비와 비율 — 비, 비율, 백분율, 할푼리. 실생활 활용.",
    "math-6-2-1": "분수의 나눗셈 — (분수)÷(분수). 역수의 곱.",
    "math-6-2-3": "소수의 나눗셈 — (소수)÷(소수). 자릿수 옮기기.",
    "math-6-2-4": "비례식과 비례배분 — 외항·내항, 비례배분 활용.",
    # 초1
    "math-1-1-3": "9까지의 수 덧셈·뺄셈. 두 수로 가르기, 두 수 모으기. 어휘 매우 쉽게 (사과, 과자, 친구).",
    "math-1-2-2": "받아올림 없는 두 자리 수 덧셈·뺄셈. 자릿값 입문. 어휘 쉽게.",
    "math-1-2-4": "받아올림이 있는 한 자리 수 덧셈, 받아내림이 있는 십몇 - 몇. 어휘 쉽게.",
    # 초2
    "math-2-1-3": "두 자리 수 덧셈·뺄셈. 받아올림·받아내림 1번/2번. 세로식 강조.",
    "math-2-1-6": "곱셈 — 묶어 세기, 같은 수 더하기, 곱셈식 표현. 곱셈 도입.",
    "math-2-2-2": "곱셈구구 (2~9단). 곱셈식과 나눗셈식의 관계 도입.",
}

KEY_MAP = {"question": "body", "solution": "explanation", "options": "choices"}


def strip_fences(text: str) -> str:
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", (text or "").strip(), flags=re.MULTILINE)


VALID_ESCAPE = set('"\\/bfnrtu')


def fix_invalid_escapes(s: str) -> str:
    out = []
    i = 0
    in_string = False
    while i < len(s):
        c = s[i]
        if c == '"':
            backslashes = 0
            j = i - 1
            while j >= 0 and s[j] == '\\':
                backslashes += 1
                j -= 1
            if backslashes % 2 == 0:
                in_string = not in_string
            out.append(c)
            i += 1
        elif in_string and c == '\\' and i + 1 < len(s):
            nxt = s[i + 1]
            if nxt in VALID_ESCAPE:
                out.append(c)
                out.append(nxt)
                i += 2
            else:
                out.append('\\\\')
                i += 1
        else:
            out.append(c)
            i += 1
    return ''.join(out)


def safe_parse_json(text: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    fixed = fix_invalid_escapes(text)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', fixed)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    fixed2 = re.sub(r'\\(?=[a-zA-Z])', r'\\\\', text)
    try:
        return json.loads(fixed2)
    except json.JSONDecodeError as e:
        print(f"  [JSON-FIX] 4차 보정도 실패: {e}", flush=True)
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
    p.setdefault("answer_aliases", [])
    p.setdefault("concept_tags", [])
    p.setdefault("common_errors", [])
    return p


def system_prompt(unit_guide: str, grade: int) -> str:
    grade_label = f"초{grade}"
    age_note = (
        "어휘 매우 쉽게 (한 문장 12자 이내, 사물·일상 위주). 추상 개념 금지."
        if grade <= 2
        else "어휘 학년 수준에 맞춤. 추상 개념은 정의·예시 동반."
    )
    return f"""You are a Korean K-12 math problem creator for elementary school {grade_label} following 2022 revised NCIC curriculum. You produce printable worksheet content matching Korean textbook conventions.

학년 노트:
{age_note}

UNIT-SPECIFIC GUIDANCE:
{unit_guide}

KOREAN MATH NOTATION STANDARD (strict):
- 분수: ALWAYS KaTeX \\frac{{a}}{{b}} (세로 분수). NEVER write a/b slash form.
- 곱셈: KaTeX \\times (×). NEVER asterisk *.
- 나눗셈: KaTeX \\div (÷).
- 등호·연산: $245 + 138 = 383$ inline math.
- 단위: 한국식 (개, cm, m, kg, 자루, 장, 명).
- 빈칸: KaTeX \\square (□). NEVER ___ or [ ] or @box.
- 한국어 본문 + KaTeX 수식. 학년 수준 어휘.
- 객관식 보기: pure text or single short KaTeX. NEVER ① ② ③ ④ in body.

OUTPUT JSON (English keys only, no markdown fences):
{{
  "problems": [
    {{
      "type": "multiple_choice" | "short_answer",
      "difficulty": 1-5,
      "section": "warmup" | "concept" | "application" | "challenge",
      "body": "한국어 본문 + KaTeX 수식. 200자 이내.",
      "choices": ["short text or KaTeX", ...] or null,
      "answer": "정답",
      "answer_aliases": ["숫자만", "다른 표현"],
      "explanation": "단계별 풀이",
      "concept_tags": ["..."],
      "common_errors": [
        {{"label": "개념미숙|계산실수|문제해석|함정미인지", "wrong_answer": "...", "reason": "한 줄"}}
      ]
    }}
  ]
}}

CRITICAL:
- 정확히 20문항. 분포 6/6/6/2 (warmup/concept/application/challenge).
- 객관식 14 / 단답형 6.
- 본문 200자 이내, 보기 30자 이내.
- 출판사·"KaTeX" 단어 절대 본문/explanation에 노출 금지.
- 도형·그림 묘사 절대 금지.
- 친구 대화체·다단계 bullet 절대 금지.
- output JSON only.
"""


def gen_unit(client, unit) -> list[dict]:
    user = f"""[학년] {unit['grade']}학년 / 과목: 수학
[성취기준] {unit['standard_code']} - {unit.get('standard_text','')}
[단원] {unit['unit_name']} / 소단원: {unit['sub_unit']}
[핵심 개념] {", ".join(unit['concepts'])}

20문항 6/6/6/2 분포 정확히. JSON만 출력.
"""
    guide = UNIT_GUIDES.get(unit["id"], "")
    sys_p = system_prompt(guide, unit["grade"])

    try:
        resp = client.models.generate_content(
            model=MODEL,
            contents=user,
            config={"system_instruction": sys_p, "temperature": 0.3},
        )
    except Exception as e:
        msg = str(e)
        if "429" in msg or "quota" in msg.lower():
            print(f"  [429] backoff {BACKOFF_SEC}s 후 재시도", flush=True)
            time.sleep(BACKOFF_SEC)
            resp = client.models.generate_content(
                model=MODEL,
                contents=user,
                config={"system_instruction": sys_p, "temperature": 0.3},
            )
        else:
            raise

    text = strip_fences(resp.text or "")
    data = safe_parse_json(text)
    if not data:
        return []
    return data.get("problems", []) if isinstance(data, dict) else []


def merge_into_seed(unit, new_problems):
    if not (SEED_FRONT.exists()):
        SEED_FRONT.write_text("[]", encoding="utf-8")
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
    units_math = [u for u in units if u.get("subject") == "수학"]
    units_by_id = {u["id"]: u for u in units_math}

    seed_existing = json.loads(SEED_FRONT.read_text(encoding="utf-8")) if SEED_FRONT.exists() else []
    v3_done = {s["unit_id"] for s in seed_existing if s.get("id", "").startswith(f'{s["unit_id"]}::v3::')}
    print(f"[STATE] v3 완료 단원: {sorted(v3_done)}", flush=True)

    args = sys.argv[1:]
    grade_filter = None
    explicit_targets = []
    i = 0
    while i < len(args):
        if args[i] == "--grade":
            grade_filter = int(args[i + 1])
            i += 2
        else:
            explicit_targets.append(args[i])
            i += 1

    if explicit_targets:
        targets = [t for t in explicit_targets if t in units_by_id]
    else:
        targets = [
            u["id"] for u in units_math
            if u["id"] not in v3_done
            and (grade_filter is None or u["grade"] == grade_filter)
        ]

    if not targets:
        print("[DONE] 추가 보강 대상 없음", flush=True)
        return 0

    print(f"[PLAN] 보강 대상: {len(targets)}단원 (단원당 ~140초)", flush=True)
    for t in targets:
        u = units_by_id[t]
        print(f"  - {t}  초{u['grade']} {u['unit_name']}", flush=True)

    client = genai.Client(api_key=API_KEY)
    success = 0
    fail = []
    for i, uid in enumerate(targets):
        unit = units_by_id[uid]
        t0 = time.time()
        print(f"\n[{i+1}/{len(targets)}] {uid} (초{unit['grade']} {unit['unit_name']}) 시작 ...", flush=True)
        try:
            problems = gen_unit(client, unit)
            problems = [normalize(p) for p in problems]
            elapsed = time.time() - t0
            sec_dist = Counter(p.get("section", "") for p in problems)
            type_dist = Counter(p["type"] for p in problems)
            print(f"  ✓ {len(problems)}문항 ({elapsed:.0f}s) section={dict(sec_dist)} type={dict(type_dist)}", flush=True)
            if len(problems) > 0:
                n = merge_into_seed(unit, problems)
                print(f"  → seed.json 갱신 (총 {n}문항)", flush=True)
                success += 1
            else:
                fail.append(uid)
        except Exception as e:
            print(f"  ✗ ERR: {str(e)[:200]}", flush=True)
            fail.append(uid)

        if i + 1 < len(targets):
            print(f"  sleep {SLEEP_SEC}s ...", flush=True)
            time.sleep(SLEEP_SEC)

    print(f"\n[OK] 처리 완료. 성공 {success} / 실패 {len(fail)}", flush=True)
    if fail:
        print(f"  실패 단원: {fail}", flush=True)
    return 0 if not fail else 1


if __name__ == "__main__":
    sys.exit(main())

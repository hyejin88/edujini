# Stage 1.5 — 시스템 프롬프트 개선안 (호출 없이)

**목적**: PoC에서 발견된 응답 안정성·다양성 이슈를 시스템 프롬프트 수정만으로 해결.
**교체 대상**: `backend/app/ai/prompts.py` 의 SYSTEM_VISANG, SYSTEM_MIRAEN, USER_GENERATE, 신규 KOREAN 프롬프트 추가.

---

## 1. 비상교육 시스템 프롬프트 개선 (SYSTEM_VISANG)

### 현재 이슈
- 응답이 `[...]` 단일 list 또는 한국어 키 사용 빈번
- 객체 일관성 부족 (common_errors 단순 string list)

### 개선안
```python
SYSTEM_VISANG = """You are a Korean K-12 math problem creator emulating the style of 비상교육(Visang) mathematics textbooks (2022 revised curriculum).

비상교육 특성:
- 시각적 구조 강조 (표·그래프·도형 활용 활발)
- 단계적 난이도 (개념 → 기본 → 응용 → 심화)
- 객관식 보기에 "그림 요소"가 포함된 케이스 많음
- 풀이 해설이 도식적이고 구조화됨
- 학생 친화적 톤 (격식 less, 친근 more)

YOU MUST OUTPUT JSON IN THIS EXACT SCHEMA — NO OTHER FORMAT:
{
  "problems": [
    {
      "type": "multiple_choice" or "short_answer",   // English keys ONLY
      "difficulty": 1 to 5,                            // integer
      "body": "...",
      "choices": ["..", "..", "..", ".."],            // null if short_answer
      "answer": "..",
      "answer_aliases": ["..", ".."],
      "explanation": "..",
      "concept_tags": ["..", ".."],
      "common_errors": [
        {"label": "개념미숙|계산실수|문제해석|함정미인지", "wrong_answer": "..", "reason": ".."}
      ]
    }
  ]
}

CRITICAL RULES:
- ALWAYS wrap problems in {"problems": [...]} — never return a bare array
- ALWAYS use ENGLISH keys: type, difficulty, body, choices, answer, explanation
- NEVER use Korean keys: question, solution, options, problem_type
- common_errors items MUST be objects with label/wrong_answer/reason — never plain strings
- Output JSON only, no markdown fences, no commentary

YOU MUST:
- Generate problems based ONLY on NCIC achievement standard code provided
- Use proper KaTeX delimiters $$ ... $$ for math
- DO NOT copy or paraphrase any actual textbook problem you may have seen
- DO NOT reference 비상교육 trademarked names
"""
```

---

## 2. 미래엔 시스템 프롬프트 개선 (SYSTEM_MIRAEN)

### 현재 이슈
- common_errors가 단순 문자열 list로 옴
- difficulty가 "1단계" 한국어로 옴

### 개선안
- 비상교육과 동일한 schema 강제 블록 적용
- 추가 라인:
```
- difficulty MUST be integer 1-5 — never strings like "1단계" or "쉬움"
- type MUST be exactly "multiple_choice" or "short_answer" — not "객관식"
```

---

## 3. 천재교육 시스템 프롬프트 강화 (SYSTEM_CHEONJAE)

### 현재 상태
- 응답 안정성 가장 우수, 큰 변경 불필요

### 강화 항목 (Stage 1.5 통합)
- 5단계 난이도 강제: "Each batch MUST include exactly 1 problem at difficulty 5"
- 함정미인지 라벨 빈도 향상: "At least 30% of multiple_choice problems MUST include a 함정미인지 common_error"
- answer_aliases 자동 풍부화: "Always include numerical-only alias when answer contains units (e.g., '383' alongside '383개')"

---

## 4. 신규 — 국어 시스템 프롬프트 (SYSTEM_KOREAN)

### 신설 이유
- 현재 SYSTEM_*는 모두 수학 출제 전용
- 국어는 본문(지문) + 문제 구조가 다름

### 초안
```python
SYSTEM_KOREAN = """You are a Korean K-12 Korean-language(국어) problem creator following the 2022 revised curriculum NCIC standards.

국어 출제 특성:
- 지문(passage) → 문항 구조: 짧은 지문(50~200자)을 본문 상단에 제시 후 문항 작성
- 문항 유형: 어휘(유의어/반의어/다의어), 중심문장 찾기, 감각적 표현, 문맥 추론
- 본문은 학년 수준 어휘로 작성 (초3 = 3~4학년 권장도서 수준)
- 객관식 보기 4지 또는 5지선다, 함정 보기 1개 포함

YOU MUST OUTPUT JSON IN THIS EXACT SCHEMA:
{
  "problems": [
    {
      "type": "multiple_choice" or "short_answer",
      "difficulty": 1 to 5,
      "passage": "지문 본문 (선택, 어휘 단순 문항은 null)",
      "body": "문항 진술",
      "choices": [...] or null,
      "answer": "..",
      "answer_aliases": [...],
      "explanation": "..",
      "concept_tags": [...],
      "common_errors": [{"label": "...", "wrong_answer": "...", "reason": "..."}]
    }
  ]
}

CRITICAL:
- passage 는 전부 자체 작성. 동화·기존 시·교과서 본문 인용 절대 금지.
- 어휘 문항(유의어/반의어)은 passage 없이 body 만 사용 가능
- common_errors 라벨: "어휘선택" / "문맥추론" / "중심문장혼동" / "감각표현미인지"
- 출력 JSON only, English keys only.

YOU MUST NOT:
- Reference any actual published children's book or poem
- Use Korean keys (question/solution/options)
- Output markdown fences
"""
```

USER_KOREAN_GENERATE 별도 정의:
```python
USER_KOREAN_GENERATE = """[학년] {grade}학년
[과목] 국어
[성취기준] {standard_code} - {standard_text}
[단원] {unit_name}
[목표 어휘 수준] 초{grade} 표준
[목표 분포] 어휘 30% / 중심문장 30% / 추론 30% / 감각표현 10% (총 {n}개)

자체 작성 지문 + 문항 {n}개를 생성하라. JSON만 출력.
"""
```

---

## 5. USER_GENERATE 강화 (수학 공통)

### 추가 라인
```
[출력 검증]
- problems 배열은 정확히 {n} 개여야 함
- 각 문항의 difficulty 합은 평균 2.5 이상
- 적어도 1문항은 difficulty=5 (심화)
- 객관식 7 / 단답형 3 비율 엄수
- 모든 type 값은 영문 ("multiple_choice" 또는 "short_answer")
- 모든 difficulty 값은 정수 (1~5)
```

---

## 6. 후처리 — answer_aliases 자동 풍부화

별도 함수 `enrich_answer_aliases(problem)` 작성:

```python
import re

def enrich_answer_aliases(p: dict) -> dict:
    answer = str(p.get('answer', ''))
    aliases = set(p.get('answer_aliases') or [])

    # 1. 보기 번호 제거
    m = re.match(r'^[①②③④⑤]\s*(.+)$', answer)
    if m:
        aliases.add(m.group(1).strip())
    m = re.match(r'^\(?(\d)\)?\s*(.+)$', answer)
    if m:
        aliases.add(m.group(2).strip())
        aliases.add(m.group(1))

    # 2. KaTeX $$ 제거
    m = re.search(r'\$\$\s*(.+?)\s*\$\$', answer)
    if m:
        aliases.add(m.group(1).strip())

    # 3. 단위 분리 ("383개" → "383")
    m = re.match(r'^([\d./\s]+)([a-zA-Z가-힣]+)$', answer)
    if m:
        aliases.add(m.group(1).strip())

    # 4. 분수 표현 ("\frac{1}{8}" → "1/8")
    m = re.search(r'\\frac\{(\d+)\}\{(\d+)\}', answer)
    if m:
        aliases.add(f'{m.group(1)}/{m.group(2)}')

    p['answer_aliases'] = sorted(aliases - {answer})
    return p
```

---

## 7. 적용 순서 (호출 없이 수행 가능)

1. `backend/app/ai/prompts.py` 에 `SYSTEM_VISANG`/`SYSTEM_MIRAEN` 교체
2. `SYSTEM_KOREAN` + `USER_KOREAN_GENERATE` 신규 추가
3. `SYSTEM_BY_PUBLISHER` 매핑 + `SUBJECT_PROMPTS` 매핑 (수학/국어)
4. `enrich_answer_aliases` 후처리 함수 추가
5. `scripts/generate_grade3.py` 에 후처리 함수 적용

---

## 8. 검증 (free tier 리셋 후)

다음날 free tier 리셋 시 다음 호출만 실행:
- 비상교육 × 1단원 × 6문항 = 1 호출
- 미래엔 × 1단원 × 6문항 = 1 호출
- 국어(3-1-1 재미가톡톡톡) × 천재교육 × 6문항 = 1 호출
- 합계 3 호출 → 응답 형식 안정성 확인

이 3건이 모두 정확한 schema로 응답하면 Stage 1.5 완료.

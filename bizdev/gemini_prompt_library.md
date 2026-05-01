# Gemini API — 교과서 스타일 문제 자동 생성 프롬프트 라이브러리

**작성일**: 2026-04-30
**목적**: 콘텐츠 검수 외주 ₩9M 제거 + Gemini API로 자체 콘텐츠 생산
**모델**: `gemini-2.5-flash` (일반 생성) / `gemini-2.5-pro` (고난이도·검증)

---

## 0. 핵심 원칙

1. **자체 저작물 생성** — 평가원·출판사 원문 입력 X. 성취기준 코드(NCIC 공공저작물) + 컨셉 설명만 입력
2. **3단계 파이프라인** — 생성 → 자체 검증 → 학생 풀이 데이터로 재학습
3. **모든 출력은 JSON 강제** — 파싱 안정성
4. **변형 문항 (variants)** — 1개 시드 → 5~10개 변형 → 다양성 확보
5. **검증 루프** — Gemini Pro가 Flash 출력을 재검증 (셀프 QA)

---

## 1. 출판사 스타일별 시스템 프롬프트

### 1.1 천재교육 스타일

```python
SYSTEM_CHEONJAE = """
You are a Korean K-12 math problem creator emulating the style of 천재교육(Cheonjae)
mathematics textbooks (2022 revised curriculum).

천재교육 특성:
- 단원 도입부에서 실생활 맥락(상황 그림 묘사) 후 개념 도출
- 문제 흐름: 개념 확인 → 단계별 적용 → 실생활 응용
- 어휘는 표준 교육과정 용어 엄격 준수
- 문장이 정제되고 군더더기 없음
- 객관식 보기는 4지선다 또는 5지선다, 함정 보기 1개 포함

YOU MUST:
- Generate problems based ONLY on NCIC achievement standard code provided.
- Output JSON only, no markdown fences.
- Use proper KaTeX delimiters $$ ... $$ for math.
- DO NOT copy or paraphrase any actual textbook problem you may have seen.
- DO NOT reference actual 천재교육 trademarked names.

Output schema (strict):
{
  "problems": [
    {
      "type": "multiple_choice" | "short_answer",
      "difficulty": 1-5,
      "body": "문제 본문 (KaTeX)",
      "choices": ["보기1","보기2","보기3","보기4"] (객관식만),
      "answer": "정답",
      "answer_aliases": ["동치 표현"],
      "explanation": "단계별 풀이 (KaTeX)",
      "concept_tags": ["개념1","개념2"],
      "common_errors": [
        {"label":"개념미숙","wrong_answer":"...","reason":"..."}
      ]
    }
  ]
}
"""
```

### 1.2 비상교육 스타일

```python
SYSTEM_VISANG = """
You are a Korean K-12 math problem creator emulating the style of 비상교육(Visang)
mathematics textbooks (2022 revised curriculum).

비상교육 특성:
- 시각적 구조 강조 (표·그래프·도형 활용 활발)
- 단계적 난이도 (개념 → 기본 → 응용 → 심화)
- 객관식 보기에 "그림 요소"가 포함된 케이스 많음
- 풀이 해설이 도식적이고 구조화됨
- 학생 친화적 톤 (격식 less, 친근 more)

[같은 schema/규칙 적용]
"""
```

### 1.3 미래엔 스타일

```python
SYSTEM_MIRAEN = """
You are a Korean K-12 math problem creator emulating 미래엔(Miraen) textbook style.

미래엔 특성:
- 짧고 명확한 문제 진술 (간결성)
- 실생활 응용 비중 높음 (교통·요리·스포츠 등 일상 소재)
- 객관식 정답률을 적절히 분산 (난이도 균형)
- 문법적으로 정제됨

[같은 schema/규칙 적용]
"""
```

---

## 2. 단원·성취기준 → 문제 생성 사용자 프롬프트 템플릿

```python
USER_TEMPLATE = """
[학년] {grade}학년
[과목] {subject}
[교과서 출판사] {publisher}
[성취기준 코드] {standard_code}
[성취기준 내용] {standard_text}
[단원] {unit_name}
[소단원] {sub_unit_name}
[핵심 개념] {concepts}
[목표 난이도 분포] 1단계×2, 2단계×3, 3단계×3, 4단계×1, 5단계×1 (총 10개)

위 성취기준에 부합하는 자체 제작 문제 10개를 생성하라.
- 문제마다 {publisher} 스타일 특성 반영
- 객관식 7 / 단답형 3 비율
- 각 문제는 핵심 개념 1~3개 태깅
- 풀이 해설은 학생이 따라올 수 있도록 단계적
- common_errors 필드에 4축 오답 유형 (개념미숙/계산실수/문제해석/함정미인지) 중 발생 가능한 것 1~2개 포함

JSON만 출력. 설명·머리말 금지.
"""
```

---

## 3. 자체 검증 루프 (Gemini Pro 재검증)

```python
VERIFY_SYSTEM = """
You are a strict K-12 math problem QA reviewer.

Given a generated problem JSON, verify:
1. answer correctness (recompute step-by-step)
2. choices uniqueness (no duplicate distractors)
3. concept_tags relevance to NCIC standard code
4. KaTeX syntax validity
5. age-appropriate vocabulary for grade level
6. no copyright concerns (no verbatim from known textbooks)

Output JSON:
{
  "approved": true/false,
  "fixes": [
    {"field":"answer","reason":"...","suggested":"..."}
  ],
  "score": 0-10
}

If score < 7, mark approved=false and provide fixes.
"""
```

**워크플로우**:
```
Flash 생성 (10문항) → Pro 검증 → score ≥ 7만 DB 적재
                                   → score < 7 → 자동 재시도 1회 → 인간 검수 큐
```

---

## 4. 문항 변형 (Variant Generation)

원본 1개 → 5~10개 변형으로 다양성 확보. 라이선스 안전 + 콘텐츠 풀 폭발적 확장.

```python
VARIANT_SYSTEM = """
You are a math problem variant generator.

Given an original problem, generate {N} variants that:
- Preserve the core concept and difficulty level
- Change numerical values, names, real-world context
- Maintain the same answer structure (multiple_choice / short_answer)
- Each variant has distinct numerical answer (not just renamed)

Output JSON: { "variants": [...] }
"""

USER_VARIANT = """
원본:
{original_json}

10개 변형 생성. 각 변형은:
- 숫자값 30% 이상 변경
- 등장 인물 / 사물 / 상황 컨텍스트 변경 (예: 사과 → 연필, 학교 → 도서관)
- 핵심 개념·난이도 유지
- 정답이 원본과 달라지도록 (단순 표현 변경 X)
"""
```

---

## 5. 4축 오답 라벨러 (학생 풀이 시점)

학생이 오답 제출 → 즉시 라벨링.

```python
LABEL_SYSTEM = """
You are a Korean K-12 error analysis classifier.

Given a problem and a wrong student answer, classify the error into one of:
- "개념미숙" (concept not mastered — fundamentally wrong approach)
- "계산실수" (calculation error — approach correct, arithmetic wrong)
- "문제해석" (misread the question — solved different problem)
- "함정미인지" (fell into a designed trap — common mistake from setup)

Output JSON:
{
  "label": "개념미숙" | "계산실수" | "문제해석" | "함정미인지",
  "confidence": 0.0-1.0,
  "reason": "한국어 한 줄 설명",
  "suggested_review_concept": "개념명"
}
"""

USER_LABEL = """
문제: {problem_body}
정답: {correct_answer}
풀이: {explanation}
학생 답: {student_answer}
이전 라벨 (있으면): {previous_labels}
"""
```

비용: Gemini Flash 호출당 ~₩2 → 학생 1명 일 5문항 오답 라벨링 = 월 ₩300 미만.

---

## 6. 진단 리포트 자연어 생성 (학부모용)

```python
PARENT_REPORT_SYSTEM = """
당신은 한국 학부모에게 자녀의 주간 학습 리포트를 작성하는 EduTech 코치입니다.

원칙:
- 친근하지만 정중한 존댓말 ("OO이는...어요" 톤)
- 비판·질책 절대 금지. 항상 긍정 → 약점 → 개선 방향 순서
- 구체 단원·개념명 명시 (모호하게 "수학 약점" X, "분수 덧셈에서 약분 누락" O)
- 학부모가 행동할 수 있는 다음 한 가지 제안 (TMI 금지)
- 200~300자 이내

JSON:
{
  "subject": "이번 주 OO이의 학습 리포트",
  "summary": "한 줄 요약",
  "highlights": ["긍정 1-2개"],
  "concerns": ["약점 1-2개"],
  "next_action": "이번 주 추천 행동 1개"
}
"""
```

---

## 7. 비용·콜 빈도 시뮬레이션

| 작업 | 모델 | 호출/월 | 토큰/호출 | 비용 (₩) |
|---|---|---|---|---|
| 신규 문항 생성 (10문항/회) | Flash | 300 (3,000 신규) | 입력 800 / 출력 3,000 | ₩60,000 |
| 검증 루프 (Pro) | Pro | 300 | 입력 3,000 / 출력 500 | ₩150,000 |
| 변형 생성 | Flash | 300 | 입력 1,500 / 출력 5,000 | ₩100,000 |
| 4축 오답 라벨러 | Flash | 5,000 (학생 100명 평균) | 입력 400 / 출력 100 | ₩30,000 |
| 학부모 리포트 | Flash | 400 (100명 × 4주) | 입력 2,000 / 출력 600 | ₩50,000 |
| **소계** | | | | **₩390,000** |

→ MVP 단계 LLM 월 비용 **₩40만 원 미만**. 외주 검수 ₩9M 통째 제거.

---

## 8. 한국어 LLM 모델 비교 (2026 기준)

| 모델 | 한국어 수능 수학 정답률 | 입력가 (₩/1M토큰) | 권장 용도 |
|---|---|---|---|
| **Gemini 2.5 Flash** | 약 75% | ₩200 | 대량 생성·라벨링 (1차) |
| **Gemini 2.5 Pro** | **92%** (최고) | ₩2,500 | 검증·고난이도 |
| Claude Sonnet 4.6 | 약 85% | ₩4,000 | 자연어 리포트·복잡 추론 |
| GPT-4o | 약 80% | ₩4,500 | 폴백 |
| Solar Pro 2 | 약 58% | 자체 라이선스 | 한국어 자연스러움 (특수) |

**전략**: Gemini Flash 80% + Pro 15% + Claude 5% (학부모 리포트만) → 비용 최적 + 한국어 정확도 확보.

---

## 9. 라이선스 안전성 검토

### 9.1 Gemini 생성 문항의 저작권

- **Google Gemini Terms**: 생성된 콘텐츠의 IP는 사용자에게 귀속 (상업 사용 가능)
- **단**, 저작권 침해 콘텐츠를 의도적으로 추출하지 않을 책임은 사용자
- **안전 패턴**: 시스템 프롬프트에 "DO NOT copy or paraphrase any actual textbook problem" 명시 (위 1.1 참조)

### 9.2 출판사 침해 방지

- **유사도 검사 자동화**: 신규 생성 문항을 천재·비상 교과서 평가문제 데이터(소량 보유 시) 또는 기출 풀과 cosine similarity 검사 (>0.85 시 폐기)
- **인간 검수 샘플링**: 신규 100건당 5건 정혜진이 직접 확인 (월 30분 투입)

### 9.3 추가 권장

변호사 자문 시 **"AI 생성 콘텐츠 + 자체 저작권 + 데이터 사용 약관"** 패키지로 검토 → 약 50만 원 자문 비용으로 안전성 확보.

---

## 10. MVP 콘텐츠 생산 일정

| 주 | 작업 | 산출 |
|---|---|---|
| W1 | 프롬프트 라이브러리 셋업 + 단원 12개 정의 | 프롬프트 12종 |
| W2 | Flash로 1차 생성 — 단원당 100문항 × 12 = 1,200건 | 초안 1,200 |
| W3 | Pro 검증 루프 → score ≥ 7만 통과 (~70%) | 통과 ~840건 |
| W4 | 변형 생성 → 840 × 평균 4 = ~3,360건 | 최종 3,000+ |
| W5 | 정혜진 샘플링 검수 (5%) | QA 150건 |
| W6+ | DB 적재 + Tag 자동화 + 베타 출시 | MVP 출시 |

→ **6주 안에 3,000문항 + 검증 + 라벨링 완료** (외주 검수 0원).

---

## 11. 다음 액션

1. Google AI Studio에서 Gemini API 키 발급 (무료 한도 일 1,500 요청)
2. 위 11개 프롬프트를 `backend/app/ai/prompts.py`로 코드화
3. 단원 12개 시드 데이터 작성 (성취기준 코드 + 핵심 개념)
4. W1~W6 일정대로 콘텐츠 생산 + 정혜진 샘플 QA
5. 생성 실패·이상 사례를 메모리(`feedback_gemini_quirks.md`)에 누적하여 프롬프트 개선

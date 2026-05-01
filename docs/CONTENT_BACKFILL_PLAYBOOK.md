# 콘텐츠 보강 플레이북 (Gemini Paid 활성 시)

**대상**: edujini-content 에이전트 + 정혜진
**트리거**: 정혜진이 Gemini Paid tier 활성 알림 → 즉시 실행
**예상 비용**: 약 ₩8,000 (3,000문항 1회성)
**예상 시간**: 약 30분 (Paid tier sleep 1초)

---

## 0. 전제 조건 체크
```bash
# Gemini Paid 활성 확인
.venv/bin/python -c "
from google import genai
import os
from dotenv import load_dotenv
load_dotenv('.env.local')
c = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
# 50회 빠른 호출로 Paid 여부 검증
import time
ok = 0
for i in range(20):
    try:
        c.models.generate_content(model='gemini-2.5-flash', contents='1')
        ok += 1
    except Exception as e:
        if '429' in str(e):
            print(f'아직 Free tier (429 at call {i+1})')
            exit()
print(f'Paid 활성 (20회 연속 성공)')
"
```

---

## 1. 단계별 실행

### Step 1 — 환경변수 설정
```bash
cd /Users/hyejin/Documents/generalv1/edutech_qa
export USE_PAID=1
export SLEEP_SEC=1
export MAX_CALLS=60
```

### Step 2 — 초3 보강 (12 단원 × 3 출판사 = 36 호출)
```bash
.venv/bin/python scripts/generate_grade3_v3.py
```
- 결과: 단원당 20문항 × 36 = 720문항
- 분포 자동 적용 (6/6/6/2)
- `frontend/lib/seed.json` 자동 동기화

### Step 3 — 품질 검증 (Pro 샘플 검증)
```bash
.venv/bin/python scripts/verify_sample.py
# 검증 통과율 80%+ 확인
```

### Step 4 — 다른 학년 시드 생성 + 보강
```bash
# 단원 시드 확장
.venv/bin/python scripts/seed_units_grade4.py  # TODO 작성
.venv/bin/python scripts/seed_units_grade5.py
.venv/bin/python scripts/seed_units_grade6.py

# 각 학년 보강
.venv/bin/python scripts/generate_grade4.py
# ...
```

### Step 5 — Git push
```bash
git add data/ frontend/lib/seed.json
git commit -m "feat(content): backfill 6/6/6/2 distribution × 12 units (Paid tier)"
git push origin main
```
→ Cloudflare 자동 배포 1~3분 → 라이브 갱신.

---

## 2. 분포 검증 명령
```python
import json
from collections import Counter
probs = json.load(open('frontend/lib/seed.json'))
print(f'총 {len(probs)}문항')
print('section:', Counter(p.get('section','?') for p in probs))
print('type:', Counter(p['type'] for p in probs))
print('difficulty:', dict(sorted(Counter(p['difficulty'] for p in probs).items())))
print('publisher:', Counter(p['publisher'] for p in probs))
```

목표 분포 (단원당 20):
- section: warmup 6 / concept 6 / application 6 / challenge 2
- type: multiple_choice 14 / short_answer 6
- difficulty: 1×4, 2×6, 3×6, 4×3, 5×1

---

## 3. 추가 학년 시드 작성 가이드 (TODO)

### 초4~6 단원 (NCIC 2022 개정)
- 초4: 큰 수, 각도, 평면도형의 이동, 곱셈과 나눗셈, 막대그래프, 규칙 찾기
- 초5: 자연수의 혼합 계산, 약수와 배수, 규칙과 대응, 약분과 통분, 분수의 덧셈/뺄셈
- 초6: 분수의 나눗셈, 각기둥과 각뿔, 소수의 나눗셈, 비와 비율, 여러 가지 그래프

### 중1~3 단원
- 중1: 소인수분해, 정수와 유리수, 문자와 식, 일차방정식, 좌표평면, 일차함수, 도형의 기초
- 중2: 유리수와 순환소수, 단항식·다항식, 일차함수, 연립방정식, 부등식, 도형의 성질
- 중3: 제곱근과 실수, 다항식의 곱셈, 인수분해, 이차방정식, 이차함수, 닮음, 피타고라스, 삼각비, 원

### 고1~3 단원
- 고1 (수학): 다항식, 방정식과 부등식, 도형의 방정식, 집합과 명제, 함수와 그래프, 경우의 수
- 고2 (수I): 지수함수와 로그함수, 삼각함수, 수열
- 고2 (수II): 함수의 극한·연속, 미분, 적분
- 고3 (확률과 통계, 미적분, 기하 등): 선택과목

→ 각 학년·과목별로 `data/grade{n}/units.json` 작성, 동일 분포 적용.

---

## 4. 위임
- 콘텐츠 분포·프롬프트 → edujini-content
- 코드 실행 → edujini-dev
- 품질 평가 → edujini-qa
- 마일스톤 업데이트 → edujini-pm

---

## 5. 비용 추정
| 시나리오 | Flash 호출 | Pro 검증 | 총 비용 |
|---|---|---|---|
| 초3 보강 (현재 12 단원 × 3) | 36 | 7 | ~$1 |
| 초1~6 풀빌드 (72 단원 × 3) | 216 | 32 | ~$5 |
| 초~고 풀빌드 (300+ 단원 × 3) | 900 | 135 | ~$20 |

→ Stage 2 풀빌드 = 약 ₩28,000. 1회성.

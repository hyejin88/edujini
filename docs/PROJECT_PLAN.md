# Edujini 프로젝트 계획안

**최종 갱신**: 2026-05-01
**작성**: Claude (정혜진과 조율)
**상태**: Stage 1 PoC 완료 / Stage 2 MVP 풀빌드 진행 중

---

## 1. 한 줄 정의

**초1~고3 NCIC 성취기준 기반 기출/연습문제 + AI 4축 오답 진단 웹앱.**
정혜진 1인 + Claude(개발/QA) + Gemini(콘텐츠 생성). 사업자 미등록 또는 간이과세, **Day 1부터 유료**, 무료 인프라 0원 부트스트랩.

---

## 2. 운영 원칙 8개

| # | 원칙 |
|---|---|
| 1 | 자본금 0원, 무료 인프라 (Vercel + Supabase + Render + R2 + Resend) |
| 2 | Gemini API로 콘텐츠 생성 (정혜진 구독 키) |
| 3 | Anthropic Claude는 학부모 자연어 리포트만 (선택, 정혜진 결정 대기) |
| 4 | 초3 PoC → Go 결정 후 전 학년 확대 |
| 5 | Day 1 = 결제 도입 (saju-kid 스타일 ₩990 단발이 메인) |
| 6 | 사업자 X 또는 간이과세 (택1, 정혜진 결정) |
| 7 | 시놀로지 NAS 이전 옵션 보유 |
| 8 | 가격 정책 잠정 TBD (정혜진 결정 대기) |

---

## 3. 4 Stage / 진행 상황

### Stage 0. 법적·인프라 사전 조사 ✅ 완료
| Step | 산출물 |
|---|---|
| S0-1 | 기출문제 크롤링 법적 분석 (`bizdev/legal_crawl_analysis.md`) |
| S0-2 | 결제 옵션 비교 — 사업자 미등록 (`bizdev/payment_options.md`) |
| S0-3 | saju-kid 스타일 단발 결제 모델 (`bizdev/lightweight_payment_model.md`) |
| S0-4 | 라이선스 코드 정의 + DMCA SOP (`legal/`) |

### Stage 1. PoC (초3) ✅ 완료
| Step | 결과 |
|---|---|
| S1-1 | Gemini API 검증 (`scripts/test_gemini.py` PASS) |
| S1-2 | 초3 NCIC 단원 12개 시드 (`data/grade3/units.json`) |
| S1-3 | 초3 60문항 생성 (천재교육 42 / 미래엔 12 / 비상교육 6) |
| S1-4 | Claude 직접 정성 평가 — **8.85/10 통과** |
| S1-5 | 60문항 DB seed JSON 변환 (`data/grade3/seed.json`) |

### Stage 1.5. 시스템 프롬프트 개선 🔄 설계 완료 / 검증 대기
- 비상교육·미래엔 schema 강제 (영문 키 필수, 한국어 키 금지)
- 국어 시스템 프롬프트 신설 (지문 자체 작성)
- `answer_aliases` 자동 풍부화 후처리 함수
- 5단계 난이도 강제 + 함정미인지 비중 향상
- 산출물: `bizdev/prompt_improvements_stage1_5.md`

### Stage 2. MVP 풀빌드 🔄 진행 중
| Step | 상태 |
|---|---|
| S2-1 | 백엔드 인메모리 store + 4 라우터 (problems/attempts/diagnose/report) | ✅ |
| S2-2 | 프론트 5 페이지 (메인 / 진단 / 결과 / 학부모 미리보기 / 체크아웃) | 🔄 |
| S2-3 | Gemini 4축 라벨링 + 휴리스틱 fallback | ✅ |
| S2-4 | 학부모 리포트 (현재 Gemini, Anthropic 전환 대기) | ✅ (B안) |
| S2-5 | 로컬 e2e 검증 | 🔄 |
| S2-6 | 누락 단원 보강 (국어 3 + 원/곱셈) | ⏳ |
| S2-7 | 결제 통합 (Lemon Squeezy or 부트페이) | ⏳ |
| S2-8 | Supabase 가입 후 인메모리 → asyncpg 전환 | ⏳ |

### Stage 3. 공개 런칭 (Day 1 = 유료) ⏳
- 도메인 + Vercel 프로덕션 배포
- 가격 동시 발행 (단발 + 월/연 옵션)
- 마케팅 (정혜진 SNS + 맘카페 + SEO)
- KPI 측정 (가입→결제 전환율 / D7 / churn)

### Stage 4. 인프라 이전 (선택) ⏳
- 시놀로지 NAS Docker 이전 (`docs/synology_migration.md`)
- 매출 안정 후 사업자 등록 의사결정 (연 750만 트리거)

---

## 4. 가격 v5 (잠정, 정혜진 확정 대기)

| 상품 | 가격 | 결과물 | 결제 |
|---|---|---|---|
| 무료 진단 | ₩0 | 5문항 + 약점 1단원 미리보기 | - |
| **AI 진단 리포트** ⭐ | **₩990** | 30문항 + 약점 TOP 3 + PDF + 카톡 발송 | 1회 |
| 주간 학습 팩 | ₩2,900 | 약점 단원 50문항 + 변형문제 + 7일 트래킹 | 1회 |
| 단원 정복 팩 | ₩4,900 | 1개 단원 100문항 + 학부모 리포트 4회 (1개월) | 1회 |
| 월 무제한 (선택) | ₩9,900/mo | 무제한 풀이 + 학부모 주간 리포트 | 정기 |
| 연 무제한 (선택) | ₩69,000/yr | 위 동일 + 30% 할인 | 1회 |

---

## 5. 결제 인프라 옵션

| 옵션 | 사업자 | 카카오페이 | ₩990 단발 가능 | MoR | 추천 |
|---|---|---|---|---|---|
| A. Lemon Squeezy 단독 | X 유지 | ❌ (카드만) | 어려움 (USD) | ✅ | |
| **B. 간이과세 + 부트페이** | 간이 (15분) | ✅ | ✅ | ❌ | **★ 추천** |
| C. 하이브리드 (1차 A → 2차 B) | X→간이 | 단계적 | 단계적 | 단계적 | |

**옵션 B 권장 이유**:
- saju-kid 스타일 ₩990 단발 = 카카오페이 1탭 결제 필수
- 간이과세 등록은 15분 + 무료, 매출 4,800만 미만 부가세 면제
- 종합소득세는 사업자 여부와 무관 (어차피 신고 의무)

---

## 6. 콘텐츠 라이선스 전략

| 비중 | 출처 | 라이선스 코드 |
|---|---|---|
| 80% | Edujini 자체 생성 (Gemini) | `SELF_GEN` |
| 15% | 공공 기출 (시·도교육청 학력평가, 평가원) | `GOV_OPEN` / `KICE` / `EDU_OFFICE` |
| 5% | EBS 메타 큐레이션 (본문 외부 링크) | 메타데이터만 |

**금지**: 출판사 본문 복제, 사설 모의고사, 회원제 플랫폼 스크래핑.
세부: `bizdev/legal_crawl_analysis.md`, `legal/dmca_takedown_sop.md`

---

## 7. PoC 결과 (초3, 60문항)

| 항목 | 값 |
|---|---|
| Claude 정성 평가 평균 | **8.85 / 10** |
| 정답 정확도 | **100%** (모든 표본) |
| 즉시 베타 투입 가능 | 54 / 60 (90%) |
| 단원 커버리지 | 8 / 12 |
| 실비 | $0 (Free tier) |
| 발견 블로커 | **분당(RPM) 한도** — sleep 8초로 해결 가능 |

세부: `reports/poc_grade3_quality_review.md`, `reports/poc_grade3_report.md`

---

## 8. 5대 차별점 (블루프린트)

1. **출판사 스타일** 천재교육 / 비상교육 / 미래엔 시스템 프롬프트
2. **자체 검증 루프** Flash 생성 → Pro 검증 (score ≥ 7만 통과)
3. **변형 생성** 1 시드 → 4~10 변형
4. **4축 오답 라벨링** 개념미숙 / 계산실수 / 문제해석 / 함정미인지
5. **3축 추천** 약점(0.5) × 난이도 적합도(0.3) × SM-2 간격반복(0.2)

---

## 9. 마일스톤·시점

| 시점 | 마일스톤 |
|---|---|
| 2026-05-01 (오늘) | Stage 0~1 완료, Stage 2 MVP 풀빌드 시작 |
| 2026-05-08 | Stage 1.5 검증 + 누락 단원 보강 + 결제 옵션 결정 |
| 2026-05-15 | Stage 2 풀빌드 완료 (전 학년 시드 + 라우터 + 프론트) |
| 2026-06-01 | Stage 3 공개 런칭 (Day 1 유료) |
| 2026-09-30 | 첫 100명 유료 가입 KPI 측정 |
| 2026-12-31 | 연 매출 가시화 → Stage 4 의사결정 |

---

## 10. 정혜진 의사결정 대기 4건

1. **결제 인프라 A/B/C 선택** — 권장 B (간이과세 + 부트페이)
2. **가격 v5 확정** — 위 표 OK인지
3. **학부모 리포트 LLM 선택** — A. Anthropic / B. Gemini / C. fallback (현재 B로 동작)
4. **Gemini 결제 해결 시점** — 정혜진이 별도 알려주기로 함

---

## 11. 리스크·이슈 트래커

| ID | 리스크 | 영향 | 대응 |
|---|---|---|---|
| R1 | 출판사 저작권 분쟁 | 🔴 | 80% 자체 생성 + DMCA 24h SOP |
| R2 | Render Free 콜드스타트 30초 | 🟡 | UX 메시지 + Stage 4 시놀로지 이전 |
| R3 | Gemini Free tier 분당 한도 | 🟡 | sleep 8초 + 향후 Paid tier |
| R4 | Day 1 결제 진입장벽 | 🔴 | ₩990 단발 + 7일 환불 + 카카오페이 |
| R5 | LS 정산 USD→KRW 환차손 (옵션 A) | 🟡 | Wise 활용 |
| R6 | 한국 학부모 카카오페이 미지원 (옵션 A) | 🔴 | 옵션 B 전환 권장 |

---

## 12. 산출물 인덱스 (45+ 파일)

### 분석·전략
- `bizdev/legal_crawl_analysis.md` — 크롤링 법적 분석
- `bizdev/payment_options.md` — 결제 옵션 비교
- `bizdev/lightweight_payment_model.md` — saju-kid 스타일 모델
- `bizdev/launch_marketing.md` — 마케팅 카피
- `bizdev/prompt_improvements_stage1_5.md` — 시스템 프롬프트 개선안
- `bizdev/gemini_prompt_library.md` — 11종 프롬프트

### 로드맵·아키텍처
- `docs/PROJECT_PLAN.md` — **이 문서**
- `docs/roadmap_v3.md` — 4 Stage 로드맵
- `docs/blueprint.md` — UVP/페르소나/사이트맵
- `docs/synology_migration.md` — 시놀로지 이전 가이드

### 평가·리포트
- `reports/poc_grade3_report.md` — PoC 종합 리포트
- `reports/poc_grade3_quality_review.md` — 60문항 정성 평가
- `reports/grade3_generation_log.md` — 생성 로그
- `reports/final_report_v2.md` — 1인+AI 모델 보고서

### 백엔드
- `backend/app/main.py` — FastAPI 엔트리
- `backend/app/store.py` — 인메모리 store
- `backend/app/ai/prompts.py` — Gemini 프롬프트
- `backend/app/routers/` — problems / attempts / diagnose / report / payments
- `backend/migrations/` — 001_init.sql / 002_orders_subscriptions.sql

### 프론트엔드
- `frontend/app/page.tsx` — 메인 (saju-kid 스타일)
- `frontend/app/diagnose/page.tsx` — 진단 흐름
- `frontend/app/result/page.tsx` — 결과 화면
- `frontend/app/parent-preview/page.tsx` — 학부모 리포트 미리보기
- `frontend/app/checkout/page.tsx` — ₩990 결제
- `frontend/components/` — ProblemCard / KatexBody
- `frontend/lib/api.ts` — 백엔드 호출 wrapper

### 콘텐츠
- `data/grade3/units.json` — 12개 단원 NCIC 시드
- `data/grade3/seed.json` — **60문항 (배포 가능)**
- `data/grade3/problems_normalized.jsonl` — 정규화 원본

### 법무·운영
- `legal/license_codes.md` — 6종 라이선스 코드
- `legal/dmca_takedown_sop.md` — 침해 신고 24h SOP

### 인계
- `SESSION_HANDOFF.md` — 다음 세션 시작 가이드
- `SETUP.md` — 무료 인프라 셋업

---

## 13. 다음 액션 (auto mode 진행 중)

1. ✅ npm install 완료
2. 🔄 Next.js dev server 기동 + e2e 검증
3. ⏳ 누락 단원 보강 (국어 3 + 비상/미래엔 — sleep 8초 분당 한도 친화)
4. ⏳ 정혜진 의사결정 4건 회수 후 Stage 2 마무리 → Stage 3 진입

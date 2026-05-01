# 세션 인계 — 2026-05-01

**상태**: PoC Stage 1 완료, 정혜진 의사결정 대기
**다음 세션 시작 시 읽을 순서**: 이 문서 → `reports/poc_grade3_report.md` → `bizdev/lightweight_payment_model.md`

---

## 추가 PoC 결과 (2026-05-01 후속)

- ✅ Claude 직접 정성 평가 완료 — 60문항 평균 **8.85/10** (`reports/poc_grade3_quality_review.md`)
  - 정답·풀이 정확도 100% (모든 표본)
  - 한국어·KaTeX·4축 라벨링 양호
  - 즉시 베타 투입 가능 54문항 / 보완 후 6문항 (도형 SVG 필요)
- ✅ 60문항 DB seed JSON 변환 완료 (`data/grade3/seed.json`, 93KB)
- ✅ Stage 1.5 시스템 프롬프트 개선안 작성 (`bizdev/prompt_improvements_stage1_5.md`)
  - 비상교육·미래엔 schema 강제 라인 추가안
  - 국어 시스템 프롬프트 신설 초안
  - answer_aliases 자동 풍부화 후처리 함수

---

## 정혜진 의사결정 3건 (다음 세션 시작 시 확인)

### 1. Gemini API Paid Tier 업그레이드 ← **블로커**
- 현재 키는 free tier 일 20 RPD 한도. PoC에서 거의 모두 소진.
- Google AI Studio → 우상단 프로필 → "Set up billing" → 결제 카드 등록
- 한 번 등록하면 Stage 2 풀빌드 (3,000문항) 비용 약 **₩8,000** 1회성

### 2. 결제 인프라 옵션 (saju-kid 스타일 ₩990 단발 결제 가능 여부)
- 옵션 A: 사업자 X 유지 → Lemon Squeezy (카드만, 카카오페이 X)
- **옵션 B (추천)**: 간이과세 사업자등록 (15분, 부담 거의 0) → 부트페이 카카오페이 1탭
- 옵션 C: 하이브리드 (1차 A, 2차 B 전환)

### 3. 가격 정책 v5 확정
- 무료: 5문항 진단
- ₩990: AI 진단 리포트 (단발, 메인)
- ₩2,900: 주간 학습 팩
- ₩4,900: 단원 정복 팩
- ₩9,900/월 또는 ₩69,000/년: 무제한 (선택)
→ 사용자 최종 확인 필요

---

## 산출물 트리

```
edutech_qa/
├── project.yaml                      # 프로젝트 메타
├── SETUP.md                          # 무료 인프라 셋업
├── SESSION_HANDOFF.md                # ← 이 파일
├── .env.local                        # Gemini API key
├── docs/
│   ├── blueprint.md                  # UVP, 페르소나, 사이트맵
│   ├── roadmap_v3.md                 # 4 Stage / 15 Step 로드맵
│   └── synology_migration.md         # 시놀로지 NAS 이전 가이드
├── bizdev/
│   ├── legal_crawl_analysis.md       # 기출 크롤링 법적 분석
│   ├── payment_options.md            # 결제 옵션 비교
│   ├── lightweight_payment_model.md  # ★ saju-kid 스타일 분석 + 옵션 결정 가이드
│   ├── launch_marketing.md           # 런칭 마케팅 카피
│   └── gemini_prompt_library.md      # 11종 프롬프트
├── legal/
│   ├── license_codes.md              # 6종 라이선스 코드
│   └── dmca_takedown_sop.md          # 침해 신고 24시간 SOP
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI 엔트리
│   │   ├── ai/prompts.py             # Gemini 프롬프트 코드화
│   │   ├── db/client.py              # asyncpg 풀
│   │   ├── models/schemas.py         # Pydantic
│   │   └── routers/
│   │       ├── problems.py           # 문제 조회
│   │       ├── attempts.py           # 풀이 + 4축 라벨링
│   │       └── payments.py           # LS / 부트페이 webhook
│   ├── migrations/
│   │   ├── 001_init.sql              # 8 핵심 테이블
│   │   └── 002_orders_subscriptions.sql  # 결제 테이블
│   ├── render.yaml, Dockerfile, requirements.txt
├── frontend/
│   ├── package.json, next.config.mjs, tailwind.config.ts
│   ├── app/
│   │   ├── page.tsx                  # 메인 (saju-kid 스타일)
│   │   ├── diagnose/page.tsx         # 진단 흐름
│   │   ├── checkout/page.tsx         # ₩990 결제
│   │   └── globals.css, layout.tsx
│   └── components/ProblemCard.tsx
├── data/grade3/
│   ├── units.json                    # 초3 12개 단원 NCIC 시드
│   ├── problems_raw.jsonl            # Gemini 원본 60문항
│   └── problems_normalized.jsonl     # 정규화 완료 60문항
├── scripts/
│   ├── test_gemini.py                # API 검증 ✅
│   ├── seed_units_grade3.py          # 시드
│   ├── generate_grade3.py            # 생성기 v2
│   └── verify_sample.py              # Pro 검증 분리
└── reports/
    ├── final_report_v2.md            # 1인+AI 모델 보고서
    ├── grade3_generation_log.md      # 생성 로그
    └── poc_grade3_report.md          # ★ PoC 최종 리포트
```

---

## 검증된 사실 (다음 세션에서 의심하지 말 것)

1. **Gemini API 키 유효** (`AIzaSyAosO...`) — `scripts/test_gemini.py` PASS
2. **시스템 프롬프트 정확** — 천재교육 스타일 응답 품질 우수
3. **파싱 후처리 필수** — Gemini가 한국어 키(`question`/`solution`) 사용 케이스 빈번 → `KEY_MAP` 적용
4. **Free tier 한도 너무 박함** — 일 20 RPD, Paid tier 필수
5. **콘텐츠 라이선스 안전 패턴** — 80% 자체 생성 + 15% 공공 기출 + 5% EBS 메타 (`legal_crawl_analysis.md`)

---

## 다음 세션 첫 액션 체크리스트

- [ ] 정혜진 Gemini Paid tier 업그레이드 여부 확인
- [ ] 결제 옵션 B(간이과세) 동의 여부 확인
- [ ] 가격 v5 확정
- [ ] (위 3건 동의 시) Stage 1.5 진입 — 국어 프롬프트 분리 + 비상·미래엔 프롬프트 재정비
- [ ] (위 동의 시) Stage 2 풀빌드 — 3,000문항 생성 + 라우터 4종 + 6 화면

# Edujini

> 초1~고3 NCIC 성취기준 기반 단원별 수학 학습지 + AI 4축 오답 진단

**무료 60문항 (3개 단원) · 단원당 20문제 · 인쇄 가능 · ₩990 단원 정복 팩**

## 🚀 라이브 (배포 후 갱신)
- 프로덕션: https://edujini.pages.dev (Cloudflare Pages)
- GitHub: https://github.com/hyejin88/edujini

## 🏗️ 스택
- **프론트엔드**: Next.js 16.2 + React 19 + Tailwind v4 + shadcn/ui + KaTeX
- **API**: Next.js API Routes (Edge Runtime, Cloudflare Workers 호환)
- **AI**: Gemini 2.5 Flash (4축 오답 라벨링 + 학부모 리포트)
- **데이터**: 정적 60문항 seed.json (PoC)
- **배포**: Cloudflare Pages (상업 무료, 100K req/일, 무제한 대역폭)

## 📦 프로젝트 구조
```
frontend/                  # Next.js 앱 (Cloudflare Pages)
  app/
    page.tsx               # 랜딩
    library/page.tsx       # 단원 목록
    library/[unitId]/      # 단원 학습지 (20문항 + 인쇄)
    result/                # 진단 결과
    parent-preview/        # 학부모 리포트 미리보기
    api/                   # Edge API Routes
      units/route.ts
      units/[unitId]/problems/route.ts
      grade/route.ts       # 일괄 채점 + Gemini 4축 라벨링
      diagnose/[userId]/route.ts
      report/[userId]/route.ts  # 학부모 리포트
  lib/
    seed.json              # 60문항 시드 (배포용)
    units.json             # 12 단원
    db.ts                  # 정적 store + 인메모리 attempt log
    gemini.ts              # Edge 호환 Gemini fetch + 프롬프트
    client.ts              # 브라우저 → API helper
backend/                   # FastAPI (Stage 4 시놀로지 이전 시 부활)
data/grade3/seed.json      # 마스터 콘텐츠 (frontend/lib에 동기화됨)
docs/PROJECT_PLAN.md       # 프로젝트 마스터 플랜
bizdev/competitor_analysis.md  # 13곳 경쟁사 분석
```

## 🌐 Cloudflare Pages 배포 (3분, 정혜진)

1. https://dash.cloudflare.com/sign-up — GitHub 연동 가입
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. `hyejin88/edujini` 선택 → **Begin setup**
4. 빌드 설정:
   - **Framework preset**: `Next.js`
   - **Build command**: `cd frontend && npx @cloudflare/next-on-pages@1`
   - **Build output directory**: `frontend/.vercel/output/static`
   - **Root directory**: `/` (그대로)
5. **Environment variables** 추가:
   - `GEMINI_API_KEY` = (Gemini API 키)
   - `GEMINI_FLASH_MODEL` = `gemini-2.5-flash`
   - `NODE_VERSION` = `20`
   - `NEXT_TELEMETRY_DISABLED` = `1`
6. **Save and Deploy** 클릭 → 1~3분 후 `edujini.pages.dev` 라이브

## 💻 로컬 실행
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev   # http://localhost:3000
```

## 🛠️ Cloudflare 로컬 미리보기
```bash
cd frontend
npm run pages:build
npm run preview
```

## 📋 정혜진 의사결정 대기 (4건)
1. **결제 인프라** — 권장: 간이과세 등록 + 부트페이 (카카오페이 1탭 ₩990 단발)
2. **가격 v5 확정** — 무료 3단원 / ₩990 단원 정복 / ₩2,900 1주 / ₩9,900 월
3. **학부모 리포트 LLM** — Gemini (현재) ✅
4. **Gemini Paid tier 업그레이드** — 정혜진 결제 해결 시 알림

## 📚 핵심 산출물
- `docs/PROJECT_PLAN.md` — 마스터 플랜
- `bizdev/competitor_analysis.md` — 경쟁사 13곳 (콴다·일일수학·매쓰플랫·족보닷컴 등)
- `bizdev/lightweight_payment_model.md` — saju-kid 스타일 ₩990 단발 모델
- `bizdev/legal_crawl_analysis.md` — 콘텐츠 저작권·크롤링 합법 가이드
- `reports/poc_grade3_quality_review.md` — 60문항 정성 평가 (8.85/10)

## 🛡️ 라이선스 / 콘텐츠 정책
- **80% 자체 생성** (Gemini, 출판사 스타일 모방, 본문 자체 작성)
- **15% 공공 기출** (시·도교육청 학력평가, KICE)
- **5% EBS 메타** (외부 링크만)
- 침해 신고 24시간 SOP: `legal/dmca_takedown_sop.md`

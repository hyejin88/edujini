# EduQA — 무료 인프라 0원 셋업 가이드

**작성일**: 2026-05-01
**전제**: 사업자등록 X · 무료 도메인 + 무료 호스팅으로 즉시 시작
**예상 비용**: ₩0 (Gemini 무료 한도 + Vercel/Supabase Free + Render Free)

---

## 0. 무료 인프라 스택 한눈에

| 영역 | 서비스 | 무료 한도 | 가입 |
|---|---|---|---|
| **도메인** | Vercel 서브도메인 (`eduqa.vercel.app`) | 영구 무료 | Vercel 계정 자동 |
| **프론트엔드 호스팅** | Vercel Hobby | 100GB 트래픽 / 월 | https://vercel.com |
| **백엔드 호스팅** | Render Free Web Service | 512MB RAM / 750h/월 | https://render.com |
| **DB** | Supabase Free | 500MB DB / 1GB 스토리지 / 50K MAU | https://supabase.com |
| **CDN/스토리지** | Cloudflare R2 Free | 10GB 스토리지 / 1M 요청/월 | https://cloudflare.com |
| **LLM** | Gemini API Free | 1,500 요청/일 (Flash) / 50/일 (Pro) | https://aistudio.google.com |
| **이메일** | Resend Free | 3,000 통/월 | https://resend.com |
| **모니터링** | Sentry Free | 5K 에러/월 | https://sentry.io |
| **분석** | PostHog Free | 1M 이벤트/월 | https://posthog.com |
| **알림톡 (대체: 이메일)** | Resend로 대체 | — | (카카오 알림톡은 사업자등록 필수) |
| **결제** | **MVP 미적용** (베타 무료 운영) | — | (베타 후 토스/스트라이프 검토) |

→ **모든 서비스 무료 한도 안에서 베타 100명 + Phase 2 초입(유료 미적용)까지 커버 가능**.

---

## 1. 사용자 직접 액션 (D+1, 약 1시간)

다음 7개 무료 계정 가입 — 각 1~3분 소요. 모두 무료, 신용카드 불필요.

### 1.1 GitHub 계정 (코드 저장소)
- 이미 있으시면 스킵. 없으면 https://github.com 가입
- `eduqa` 이름으로 **Private repo** 생성 (Settings에서 Personal Access Token 발급 — 권한: repo, workflow)

### 1.2 Vercel (프론트엔드 + 도메인)
- https://vercel.com → GitHub 로그인
- 자동으로 `*.vercel.app` 서브도메인 무료 제공
- → 결과 URL 예: `eduqa.vercel.app`

### 1.3 Supabase (DB + Auth + Storage)
- https://supabase.com → GitHub 로그인
- Region: **Northeast Asia (Seoul)** 선택
- `eduqa` 프로젝트 생성 → DB 비밀번호 안전 저장 (자동 생성 권장)
- Settings → API → `anon` key, `service_role` key, Project URL 복사

### 1.4 Render (백엔드 호스팅 — FastAPI)
- https://render.com → GitHub 로그인
- 무료 플랜은 15분 idle 후 sleep (첫 요청 30초 지연) — 베타엔 OK

### 1.5 Google AI Studio (Gemini API)
- https://aistudio.google.com/app/apikey
- "Get API key" → 새 프로젝트 → API 키 생성
- 무료 한도: Flash 1,500 req/day, Pro 50 req/day
- 키 안전 저장

### 1.6 Cloudflare (CDN + R2 스토리지)
- https://dash.cloudflare.com → 가입
- R2 Object Storage 활성화 (10GB 무료)
- API 토큰 발급 (R2 Read/Write)

### 1.7 Resend (이메일)
- https://resend.com → GitHub 로그인
- API 키 발급
- 베타에서는 학부모 리포트를 **이메일로** 발송 (카톡 알림톡은 사업자등록 필수)

---

## 2. Claude가 자동 생성할 코드 (D+2~3)

다음 파일들을 Claude Code 세션에서 직접 작성 (이미 일부 작성됨):

```
edutech_qa/
├── README.md                       ← 본 가이드 요약
├── SETUP.md                        ← (이 파일) 무료 인프라 셋업
├── .env.example                    ← 환경 변수 템플릿
├── .gitignore
│
├── backend/                        ← FastAPI (Render 배포)
│   ├── requirements.txt
│   ├── Dockerfile                  ← Render Web Service용
│   ├── render.yaml                 ← Render IaC
│   ├── app/
│   │   ├── main.py                 ← FastAPI 엔트리
│   │   ├── routers/                ← /problems, /attempts, /diagnosis
│   │   ├── ai/
│   │   │   ├── prompts.py          ← Gemini 프롬프트 라이브러리
│   │   │   ├── generator.py        ← 문제 생성기
│   │   │   ├── verifier.py         ← Pro 검증 루프
│   │   │   └── labeler.py          ← 4축 오답 라벨러
│   │   ├── db/
│   │   │   └── client.py           ← Supabase 클라이언트
│   │   └── models/
│   │       └── schemas.py          ← Pydantic
│   └── migrations/
│       └── 001_init.sql            ← (이미 작성됨) 8 테이블 DDL
│
├── frontend/                       ← Next.js 14 (Vercel 배포)
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                ← 랜딩
│   │   ├── (student)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── practice/[unitId]/page.tsx
│   │   │   └── report/page.tsx
│   │   └── api/                    ← Server Actions
│   ├── components/
│   │   ├── ProblemCard.tsx
│   │   ├── AnswerInput.tsx
│   │   └── KaTeXRenderer.tsx
│   └── lib/
│       └── supabase.ts
│
├── .github/workflows/
│   ├── ci.yml                      ← lint·test
│   └── deploy.yml                  ← Vercel/Render 자동 배포
│
└── scripts/
    ├── seed_units.py               ← 단원 12개 시드 데이터 입력
    └── generate_problems.py        ← Gemini로 3,000문항 생성
```

---

## 3. 도메인 결정

### MVP (지금)
**`eduqa.vercel.app`** — Vercel 무료 서브도메인. 즉시 사용 가능. SSL 자동.

### Phase 2 (선택 — 6개월 차)
유료 전환 후 브랜드용 도메인 결정 시점. 옵션:

| 옵션 | 비용 | 비고 |
|---|---|---|
| **계속 vercel.app 무료** | ₩0 | 가장 무난 |
| Cloudflare 등록 도메인 | ₩15K/년 | `.app` 도메인 (Google 소유, SSL 강제) |
| 가비아 `.kr` | ₩22K/년 | 한국 브랜드 명확 |
| Freenom `.tk/.ml` 등 | ₩0 | **권장 X** (서비스 불안정·블랙리스트 위험) |

→ **MVP는 `eduqa.vercel.app` 그대로**. 유료 전환 검증 후에만 도메인 ₩15K~22K 투자.

---

## 4. 결제·알림 (사업자등록 회피 전략)

### 결제: MVP는 적용 X
- 토스페이먼츠/카드 결제는 **사업자등록 필수**
- MVP 베타 100명은 **전원 무료 운영** → PMF 검증에 집중
- Phase 2 유료 전환 시점에 사업자등록 + 결제 도입 (이때는 매출 발생 후라 부담 적음)

### 알림: 이메일 우선
- 카카오 알림톡 → 사업자등록 필수
- **MVP는 Resend 이메일**로 학부모 주간 리포트 발송 (3,000통/월 무료)
- Phase 2부터 카카오 알림톡 추가 (사업자등록 후)

---

## 5. 비용 재계산 (무료 인프라 + 사업자등록 X)

| 항목 | 금액 |
|---|---|
| 일회성 셋업 (사업자등록·도메인 제거) | **₩0** |
| 법무 자문 (저작권만, 약관은 자체 작성) | ₩500,000 (선택) |
| 운영비 (3개월) | **₩0** (모두 무료 한도) |
| **MVP 총 비용** | **₩0 ~ ₩500,000** |

**Gemini API**가 무료 한도 (Flash 1,500/일) 안에서 운영되면 운영비도 **₩0**.

→ **자기자본 ₩100만 이내로 부트스트랩 가능** (법무 ₩500K + 예비비 ₩500K).

---

## 6. 무료 한도 초과 시점·대응

| 자원 | 무료 한도 | 초과 예상 시점 |
|---|---|---|
| Gemini Flash | 1,500 req/일 | 학생 100명 동시 활동 시 도달 (유료 전환 시 검토) |
| Gemini Pro | 50 req/일 | 검증 루프 단순화 또는 Flash로 대체 |
| Supabase DB | 500MB | 학생 1,000명 + attempts 50K건 도달 시 |
| Vercel 트래픽 | 100GB/월 | MAU 5,000 도달 시 |
| Resend 이메일 | 3,000/월 | 베타 100명 X 4주 = 400통, 충분 |

→ **베타 100명 단계에서는 모든 자원이 무료 한도 안**. 유료 진입(Phase 2) 시점에 Vercel Pro $20/mo 등 단계적 업그레이드.

---

## 7. 다음 액션 — 오늘 할 일

| # | 액션 | 시간 |
|---|---|---|
| 1 | GitHub `eduqa` private repo 생성 | 2분 |
| 2 | Vercel·Supabase·Render·Google AI Studio·Cloudflare·Resend 6개 가입 | 30분 |
| 3 | 각 서비스 API 키 `.env.local` 에 저장 (Claude가 템플릿 작성) | 5분 |
| 4 | Claude Code에 "**계속 진행해**" 입력 — 백엔드/프론트 스켈레톤 자동 생성 | 0분 (자동) |

→ 사용자 액션 합 약 **40분**. 그 후 Claude가 코드 자동 작성.

---

## 8. 즉시 시작 가능

다음 명령으로 바로 시작:

```bash
cd /Users/hyejin/Documents/generalv1/edutech_qa
git init
git remote add origin https://github.com/hyejin/eduqa.git
git add . && git commit -m "init: project scaffolding"
git push -u origin main
```

이후 Vercel 대시보드에서 GitHub 레포 import → 자동 배포 시작 → `eduqa.vercel.app` 도메인 활성화.

**Claude Code가 다음 단계로 진행할 작업**:
1. `.env.example` 템플릿 작성
2. `frontend/` Next.js 14 스켈레톤
3. `backend/` FastAPI 스켈레톤
4. `backend/app/ai/prompts.py` Gemini 프롬프트 코드화
5. `scripts/seed_units.py` 단원 시드 데이터
6. `.github/workflows/` CI/CD

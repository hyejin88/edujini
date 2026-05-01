# 시놀로지 NAS 이전 가이드 (Stage 4 옵션)

**전제**: 정혜진 보유 시놀로지 NAS (모델 미정). EduQA 백엔드를 Render Free → 시놀로지 Docker로 이전하여 콜드스타트·요청 한도 해소.

---

## 시점

- **트리거**: 다음 중 하나 충족
  - Render Free 콜드스타트가 사용자 이탈로 이어짐 (KPI 측정)
  - 월 외부 호출 750시간 한도 임박
  - 매출 안정화 → 인프라 가동 시간 확보 의지

- **권장 모델**: DS220+ 이상 (RAM 6GB 이상으로 업그레이드 시 PostgreSQL + pgvector 가능)

---

## 아키텍처 (After)

```
사용자 (PC/모바일)
   │
   ├─ Vercel Hobby (Next.js 14, 정적 + SSR)
   │
   └─ Cloudflare Tunnel
        │
        └─ 시놀로지 NAS (Docker Compose)
             ├─ FastAPI (uvicorn, port 8000)
             ├─ PostgreSQL 16 + pgvector
             ├─ Redis (캐시, optional)
             └─ MinIO (R2 대체, optional)
```

- **외부 노출**: Cloudflare Tunnel만 사용. 포트포워딩 X.
- **DDNS**: 시놀로지 QuickConnect 또는 Cloudflare DNS A 레코드.
- **백업**: Hyper Backup → Synology C2 (월 약 6,500원/100GB).

---

## 이전 절차

### 1. 준비
- 시놀로지 DSM 7.2 이상 업데이트
- Container Manager (구 Docker) 패키지 설치
- SSH 활성화 (관리자만)
- Cloudflare 계정 가입 + Tunnel 토큰 발급

### 2. PostgreSQL + pgvector 컨테이너 (`docker-compose.yml`)
```yaml
version: "3.9"
services:
  db:
    image: pgvector/pgvector:pg16
    restart: always
    environment:
      POSTGRES_USER: eduqa
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: eduqa
    volumes:
      - /volume1/docker/eduqa/pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  api:
    build: ./backend
    restart: always
    environment:
      DATABASE_URL: postgresql+asyncpg://eduqa:${DB_PASSWORD}@db:5432/eduqa
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on: [db]
    ports:
      - "127.0.0.1:8000:8000"

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: always
    command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN}
```

### 3. Cloudflare Tunnel 라우팅
- `api.eduqa.app` → `http://api:8000` (or `http://localhost:8000`)
- HTTPS 자동 (Cloudflare가 처리)

### 4. DB 마이그레이션 (Supabase → 시놀로지)
```bash
# Supabase pg_dump
pg_dump $SUPABASE_DB_URL > eduqa_backup.sql

# 시놀로지 PostgreSQL 컨테이너에 복원
docker exec -i eduqa-db-1 psql -U eduqa -d eduqa < eduqa_backup.sql
```

### 5. 환경 변수 전환
- Vercel 프론트엔드 `NEXT_PUBLIC_API_URL` → `https://api.eduqa.app`
- 기존 Render 서비스는 1주일 유지 (롤백 대비) 후 종료

### 6. 모니터링·백업
- Synology Container Manager 알림 (컨테이너 다운 시 이메일)
- Hyper Backup 매일 02:00 → C2 클라우드
- pg_dump 매일 03:00 → `/volume1/backup/eduqa_db/`

---

## 비용 비교

| 항목 | Render Free | 시놀로지 (자체 보유) |
|---|---|---|
| 호스팅 비용 | $0 (단, sleep) | $0 (전기·인터넷 사용 중) |
| 콜드스타트 | 30초 | 없음 |
| 외부 한도 | 월 750시간 | 무제한 |
| DB | Supabase Free 500MB | 무제한 (NAS 용량) |
| 백업 | Supabase 무료 | Synology C2 ~6,500원/월 |
| 도메인 | eduqa.vercel.app | api.eduqa.app (도메인 ₩15,000/년) |
| 운영 부담 | 0 | 중 (NAS 모니터링·재부팅) |

---

## 리스크

| 리스크 | 대응 |
|---|---|
| 정전·NAS 다운 | UPS + Vercel에 점검 페이지 자동 전환 |
| 인터넷 회선 장애 | LTE 라우터 백업 (월 ₩5,000) |
| 디스크 손상 | RAID 1 + Synology C2 백업 |
| DSM 보안 패치 누락 | 자동 업데이트 활성화 |
| Tunnel 인증 토큰 유출 | DSM 방화벽 + Cloudflare Zero Trust 정책 |

---

## 점진 이전 전략 (recommended)

1. **Phase A (1주)**: 시놀로지에 PostgreSQL만 띄우고 매일 Supabase에서 DB 동기화
2. **Phase B (1주)**: API 컨테이너 추가, 50% 트래픽만 시놀로지로 라우팅 (Cloudflare load balancing)
3. **Phase C (2주)**: 100% 시놀로지로 전환, Render는 핫스탠바이
4. **Phase D**: Render 종료

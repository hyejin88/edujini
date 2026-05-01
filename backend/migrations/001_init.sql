-- EduTech QA — 핵심 8 테이블 초기 마이그레이션
-- PostgreSQL 15+ / pgvector 0.5+ 가정
-- 작성일: 2026-04-30

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. users — 학생 + 학부모 통합 (role 분기)
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('student','parent','teacher','admin')),
    student_grade   INT CHECK (student_grade BETWEEN 1 AND 12),  -- 초1=1, 고3=12
    parent_id       UUID REFERENCES users(id),  -- 학생→부모 link
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free','plus')),
    mastery_vector  VECTOR(768),  -- 사용자 약점 임베딩 (768차원 KoBERT)
    irt_theta       FLOAT DEFAULT 0.0,  -- IRT 능력 추정치
    onboarded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_parent ON users(parent_id);

-- ============================================================
-- 2. textbooks — 출판사 × 과목 × 학년 × 검정 연도
-- ============================================================
CREATE TABLE textbooks (
    id              SERIAL PRIMARY KEY,
    publisher       VARCHAR(50) NOT NULL,  -- '천재교육', '미래엔', '비상교육' 등
    subject         VARCHAR(30) NOT NULL,  -- '수학','국어','영어','사회','과학' 등
    grade           INT NOT NULL CHECK (grade BETWEEN 1 AND 12),
    revision_code   VARCHAR(10) NOT NULL,  -- '2022' (2022 개정 교육과정)
    edition_year    INT NOT NULL,
    cover_url       TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE (publisher, subject, grade, revision_code, edition_year)
);
CREATE INDEX idx_textbooks_lookup ON textbooks(subject, grade, revision_code);

-- ============================================================
-- 3. units — 단원 (대단원/중단원/소단원 self-ref tree)
-- ============================================================
CREATE TABLE units (
    id              SERIAL PRIMARY KEY,
    textbook_id     INT REFERENCES textbooks(id) ON DELETE CASCADE,
    parent_unit_id  INT REFERENCES units(id),
    name            VARCHAR(200) NOT NULL,
    depth           INT NOT NULL CHECK (depth BETWEEN 1 AND 4),  -- 1=대단원, 4=학습목표
    order_idx       INT NOT NULL,
    achievement_standard_code VARCHAR(20),  -- NCIC 성취기준 [4수01-01]
    learning_goal   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_units_textbook ON units(textbook_id, depth, order_idx);
CREATE INDEX idx_units_standard ON units(achievement_standard_code);

-- ============================================================
-- 4. concepts — 개념 그래프 (선수학습 의존성 포함)
-- ============================================================
CREATE TABLE concepts (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,  -- '이차방정식 근의공식', '분수 덧셈' 등
    parent_concept_id INT REFERENCES concepts(id),
    subject         VARCHAR(30) NOT NULL,
    difficulty_base FLOAT DEFAULT 0.0,  -- IRT b 모수 기준값
    description     TEXT,
    embedding       VECTOR(768)  -- 개념 임베딩 (유사도 비교용)
);
CREATE INDEX idx_concepts_parent ON concepts(parent_concept_id);
CREATE INDEX idx_concepts_subject ON concepts(subject);

-- 개념 선수학습 그래프 (DAG)
CREATE TABLE concept_prerequisites (
    concept_id      INT REFERENCES concepts(id) ON DELETE CASCADE,
    prerequisite_id INT REFERENCES concepts(id) ON DELETE CASCADE,
    weight          FLOAT DEFAULT 1.0,  -- 의존도
    PRIMARY KEY (concept_id, prerequisite_id)
);

-- ============================================================
-- 5. problems — 문제 본체 (라이선스 메타 포함)
-- ============================================================
CREATE TABLE problems (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         INT REFERENCES units(id),
    type            VARCHAR(20) NOT NULL CHECK (type IN ('multiple_choice','short_answer','descriptive')),
    difficulty      INT CHECK (difficulty BETWEEN 1 AND 5),
    irt_b           FLOAT,  -- IRT 난이도 모수
    irt_a           FLOAT DEFAULT 1.0,  -- IRT 변별도 모수
    body_md         TEXT NOT NULL,  -- 마크다운 + KaTeX
    image_url       TEXT,
    choices         JSONB,  -- 객관식 보기 ["보기1","보기2",...]
    answer          TEXT NOT NULL,
    answer_aliases  TEXT[],  -- 동치 표현 ["1/2","0.5","½"]
    explanation_md  TEXT,
    -- 라이선스 메타
    source_type     VARCHAR(30) NOT NULL CHECK (source_type IN ('self_made','ai_variant','public_ebs','kice','partner_publisher')),
    source_year     INT,
    license_code    VARCHAR(50),  -- 'KOGL-4' (공공누리 4유형), 'partner-cheonjae-2026' 등
    is_published    BOOLEAN DEFAULT FALSE,
    reviewed_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_problems_unit ON problems(unit_id, is_published);
CREATE INDEX idx_problems_difficulty ON problems(difficulty, is_published);

-- 문제 ↔ 개념 다대다 (한 문제 = 평균 2~4 개념 라벨)
CREATE TABLE problem_concepts (
    problem_id      UUID REFERENCES problems(id) ON DELETE CASCADE,
    concept_id      INT REFERENCES concepts(id) ON DELETE CASCADE,
    weight          FLOAT DEFAULT 1.0,  -- 라벨 강도
    PRIMARY KEY (problem_id, concept_id)
);
CREATE INDEX idx_pc_concept ON problem_concepts(concept_id);

-- ============================================================
-- 6. attempts — 풀이 로그 (분석의 핵심 — 가장 큰 테이블)
-- ============================================================
CREATE TABLE attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    problem_id      UUID REFERENCES problems(id),
    user_answer     TEXT,
    is_correct      BOOLEAN NOT NULL,
    error_label     VARCHAR(30),  -- '개념미숙','계산실수','문제해석','함정미인지' (4축 라벨)
    time_spent_sec  INT,
    confidence      INT CHECK (confidence BETWEEN 1 AND 5),
    attempted_at    TIMESTAMPTZ DEFAULT NOW(),
    is_recommended  BOOLEAN DEFAULT FALSE  -- 추천 받아 푼 문제인지
);
CREATE INDEX idx_attempts_user_time ON attempts(user_id, attempted_at DESC);
CREATE INDEX idx_attempts_problem ON attempts(problem_id);
CREATE INDEX idx_attempts_label ON attempts(error_label) WHERE NOT is_correct;

-- ============================================================
-- 7. diagnosis_reports — 주 1회 배치 진단 스냅샷
-- ============================================================
CREATE TABLE diagnosis_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    weak_concepts   JSONB,  -- [{"concept_id":42,"name":"분수 덧셈","mastery":0.3,"trend":"down"}]
    error_breakdown JSONB,  -- {"개념미숙":12,"계산실수":4,"문제해석":2,"함정미인지":0}
    recommendations JSONB,  -- [{"problem_id":"...","reason":"..."}]
    parent_summary  TEXT,   -- 학부모용 자연어 요약 (LLM 생성)
    student_summary TEXT,
    sent_to_parent  BOOLEAN DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    generated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reports_user ON diagnosis_reports(user_id, period_end DESC);

-- ============================================================
-- 8. subscriptions — 결제·구독
-- ============================================================
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    plan            VARCHAR(20) NOT NULL CHECK (plan IN ('free','plus_monthly','plus_annual','b2b_seat')),
    status          VARCHAR(20) NOT NULL CHECK (status IN ('active','canceled','past_due','trial')),
    payment_provider VARCHAR(20) DEFAULT 'tosspayments',
    provider_subscription_id VARCHAR(100),
    started_at      TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ,
    canceled_at     TIMESTAMPTZ,
    amount_krw      INT NOT NULL,
    metadata        JSONB
);
CREATE INDEX idx_subs_user ON subscriptions(user_id, status);

-- ============================================================
-- 부가 — 핵심 인덱스 보강
-- ============================================================
-- 사용자 임베딩 유사도 검색 (협업 필터링)
CREATE INDEX idx_users_mastery_ivfflat ON users USING ivfflat (mastery_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_concepts_emb_ivfflat ON concepts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- 통계 자동 갱신 트리거 (예시 — 실제 구현은 Celery 배치 권장)
COMMENT ON TABLE attempts IS '풀이 로그 — 매일 1만 건 이상 적재 예상. 월별 파티셔닝 후순위로 검토.';

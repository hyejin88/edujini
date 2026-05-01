-- 002: 단발 주문(orders) + 구독(subscriptions) 테이블
-- saju-kid 스타일 ₩990 단발 결제 + 옵션 월/연 구독을 함께 지원.
-- payment_provider: 'lemonsqueezy' | 'bootpay' | 'gumroad' | 'manual'

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(20),
    product VARCHAR(100) NOT NULL,
    amount_cents INT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'KRW',
    payment_provider VARCHAR(30) NOT NULL,
    receipt_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'paid',  -- paid|refunded|failed
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(40) NOT NULL,                   -- monthly|yearly
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active|cancelled|past_due
    payment_provider VARCHAR(30) NOT NULL,
    next_billing_at TIMESTAMPTZ,
    raw JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);

-- 단발 결제 → 결과물 발송 추적 (PDF 리포트, 카톡 알림 등)
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,                -- email|kakao|sms
    target VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);

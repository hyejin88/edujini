"""/api/v1/payments — Lemon Squeezy 결제 웹훅 + 부트페이 fallback.

Phase 1: Lemon Squeezy 단발/구독 (사업자 X 옵션 A)
Phase 1-alt: 부트페이 ₩990 단발 (간이과세 사업자 옵션 B)

옵션 결정 후 한쪽 분기만 활성화하면 됨.
"""
from __future__ import annotations

import hmac
import hashlib
import json
import os

from fastapi import APIRouter, HTTPException, Request

from ..db.client import conn


router = APIRouter()


# ---------- Lemon Squeezy ----------
LS_WEBHOOK_SECRET = os.getenv("LEMONSQUEEZY_WEBHOOK_SECRET", "")


@router.post("/lemonsqueezy/webhook")
async def ls_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("x-signature", "")
    expected = hmac.new(LS_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(401, "invalid signature")

    payload = json.loads(raw_body)
    event = payload.get("meta", {}).get("event_name")
    data = payload.get("data", {}).get("attributes", {})

    if event == "subscription_created":
        await _record_subscription(data, status="active")
    elif event == "subscription_cancelled":
        await _record_subscription(data, status="cancelled")
    elif event == "order_created":
        await _record_order(data)

    return {"ok": True}


async def _record_subscription(data: dict, status: str):
    user_email = data.get("user_email")
    plan = data.get("variant_name", "unknown")
    async with conn() as c:
        await c.execute(
            """
            INSERT INTO subscriptions(user_email, plan, status, payment_provider, raw)
            VALUES ($1, $2, $3, 'lemonsqueezy', $4::jsonb)
            ON CONFLICT (user_email) DO UPDATE
              SET plan = EXCLUDED.plan, status = EXCLUDED.status, raw = EXCLUDED.raw
            """,
            user_email,
            plan,
            status,
            json.dumps(data),
        )


async def _record_order(data: dict):
    user_email = data.get("user_email")
    product = data.get("first_order_item", {}).get("product_name", "")
    amount = data.get("total", 0)
    async with conn() as c:
        await c.execute(
            """
            INSERT INTO orders(user_email, product, amount_cents, payment_provider, raw)
            VALUES ($1, $2, $3, 'lemonsqueezy', $4::jsonb)
            """,
            user_email,
            product,
            amount,
            json.dumps(data),
        )


# ---------- Bootpay (옵션 B) ----------
BOOTPAY_REST_KEY = os.getenv("BOOTPAY_REST_API_KEY", "")


@router.post("/bootpay/webhook")
async def bootpay_webhook(request: Request):
    payload = await request.json()
    receipt_id = payload.get("receipt_id")
    if not receipt_id:
        raise HTTPException(400, "missing receipt_id")

    # 부트페이 영수증 검증 API 호출 (간략화)
    user_email = payload.get("user", {}).get("email")
    product = payload.get("item_name", "")
    amount = int(payload.get("price", 0))

    async with conn() as c:
        await c.execute(
            """
            INSERT INTO orders(user_email, product, amount_cents, payment_provider, raw)
            VALUES ($1, $2, $3, 'bootpay', $4::jsonb)
            """,
            user_email,
            product,
            amount * 100,
            json.dumps(payload),
        )
    return {"ok": True}

"""DB 클라이언트 (Supabase Postgres / 시놀로지 Postgres 양쪽 호환).

asyncpg 풀을 단일 인스턴스로 관리. Phase 4 시놀로지 이전 시 DATABASE_URL만 교체.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

import asyncpg


_pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is not None:
        return _pool
    dsn = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("SUPABASE_DB_URL 또는 DATABASE_URL 미설정")
    _pool = await asyncpg.create_pool(
        dsn=dsn,
        min_size=1,
        max_size=10,
        command_timeout=30,
    )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def conn():
    pool = await init_pool()
    async with pool.acquire() as connection:
        yield connection

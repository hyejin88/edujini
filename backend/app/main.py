"""EduQA Backend — FastAPI Entry Point.

Render Free Web Service 배포용. 무료 호스팅이라 15분 idle 후 sleep,
첫 요청 30초 cold start. Phase 2 유료 진입 시 Render Starter ($7/mo) 또는
Fly.io / Railway 검토.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "EduQA"
    env: str = "development"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3030",
        "http://127.0.0.1:3030",
        "https://eduqa.vercel.app",
    ]

    supabase_db_url: str = ""
    supabase_service_role_key: str = ""
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    resend_api_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"[startup] {settings.app_name} ({settings.env})")
    yield
    # Shutdown
    print("[shutdown]")


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="초중고 기출/연습문제 + AI 오답 진단 API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"name": settings.app_name, "version": "0.1.0", "docs": "/docs"}


@app.get("/healthz")
async def healthz():
    """Render health check."""
    return {"status": "ok"}


from app.routers import attempts, diagnose, grade, problems, report, units
from app.store import store

n = store.load_seed()
print(f"[seed] {n} problems loaded")

app.include_router(problems.router, prefix="/api/v1/problems", tags=["problems"])
app.include_router(attempts.router, prefix="/api/v1/attempts", tags=["attempts"])
app.include_router(diagnose.router, prefix="/api/v1/diagnose", tags=["diagnose"])
app.include_router(report.router, prefix="/api/v1/report", tags=["report"])
app.include_router(units.router, prefix="/api/v1/units", tags=["units"])
app.include_router(grade.router, prefix="/api/v1/grade", tags=["grade"])

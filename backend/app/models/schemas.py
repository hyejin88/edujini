"""Pydantic 스키마 — API 요청/응답 모델."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# Problem
class CommonError(BaseModel):
    label: Literal["개념미숙", "계산실수", "문제해석", "함정미인지"]
    wrong_answer: str
    reason: str


class Problem(BaseModel):
    id: str | None = None
    type: Literal["multiple_choice", "short_answer"]
    difficulty: int = Field(ge=1, le=5)
    body: str
    choices: list[str] | None = None
    answer: str
    answer_aliases: list[str] = []
    explanation: str
    concept_tags: list[str] = []
    common_errors: list[CommonError] = []
    license_code: str = "SELF_GEN"
    publisher: str | None = None
    standard_code: str | None = None


# Attempt
class AttemptCreate(BaseModel):
    problem_id: str
    user_answer: str
    time_spent_sec: int


class AttemptResult(BaseModel):
    correct: bool
    error_label: str | None = None
    correct_answer: str
    explanation: str


# Diagnosis
class DiagnosisRequest(BaseModel):
    grade: int = Field(ge=1, le=12)
    subject: str
    n_problems: int = Field(default=10, ge=5, le=30)


class DiagnosisReport(BaseModel):
    user_id: str
    weak_concepts: list[dict]
    error_breakdown: dict[str, int]
    irt_theta: float
    recommended_problems: list[str]


# Subscription
class CheckoutSessionRequest(BaseModel):
    plan: Literal["basic_monthly", "basic_yearly", "pro_monthly", "pro_yearly"]
    user_id: str


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
    session_id: str

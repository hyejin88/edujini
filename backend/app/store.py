"""인메모리 데이터 저장소 (Supabase 가입 전 PoC 모드).

Supabase 가입 후 db/client.py 의 asyncpg 풀로 전환 시 동일 인터페이스 유지.
"""
from __future__ import annotations

import json
import uuid
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent.parent
SEED_PATH = ROOT / "data" / "grade3" / "seed.json"


class Store:
    def __init__(self) -> None:
        self.problems: dict[str, dict] = {}
        self.attempts: list[dict] = []
        self.attempts_by_user: dict[str, list[dict]] = defaultdict(list)
        self.orders: list[dict] = []
        self._loaded = False

    def load_seed(self) -> int:
        if self._loaded:
            return len(self.problems)
        if not SEED_PATH.exists():
            return 0
        data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
        for p in data:
            self.problems[p["id"]] = p
        self._loaded = True
        return len(self.problems)

    def list_problems(
        self,
        grade: int | None = None,
        subject: str | None = None,
        unit_id: str | None = None,
        difficulty: int | None = None,
        limit: int = 5,
    ) -> list[dict]:
        items = list(self.problems.values())
        if grade is not None:
            items = [p for p in items if p["grade"] == grade]
        if subject:
            items = [p for p in items if p["subject"] == subject]
        if unit_id:
            items = [p for p in items if p["unit_id"] == unit_id]
        if difficulty:
            items = [p for p in items if p["difficulty"] == difficulty]
        # 난이도 균형: 1~3 위주, 한 단원당 1문항
        import random
        random.shuffle(items)
        seen_units: set[str] = set()
        balanced: list[dict] = []
        for p in items:
            if p["unit_id"] in seen_units:
                continue
            balanced.append(p)
            seen_units.add(p["unit_id"])
            if len(balanced) >= limit:
                break
        if len(balanced) < limit:
            for p in items:
                if p in balanced:
                    continue
                balanced.append(p)
                if len(balanced) >= limit:
                    break
        return balanced[:limit]

    def get_problem(self, problem_id: str) -> dict | None:
        return self.problems.get(problem_id)

    def is_correct(self, problem: dict, user_answer: str) -> bool:
        ua = user_answer.strip()
        candidates = [str(problem.get("answer", "")).strip()]
        for a in problem.get("answer_aliases", []) or []:
            candidates.append(str(a).strip())
        return ua in candidates

    def record_attempt(
        self,
        user_id: str,
        problem_id: str,
        user_answer: str,
        correct: bool,
        error_label: str | None,
        time_spent_sec: int,
    ) -> dict:
        rec = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "problem_id": problem_id,
            "user_answer": user_answer,
            "is_correct": correct,
            "error_label": error_label,
            "time_spent_sec": time_spent_sec,
            "created_at": datetime.utcnow().isoformat(),
        }
        self.attempts.append(rec)
        self.attempts_by_user[user_id].append(rec)
        return rec

    def diagnose(self, user_id: str) -> dict[str, Any]:
        atts = self.attempts_by_user.get(user_id, [])
        if not atts:
            return {"weak_units": [], "error_breakdown": {}, "score_pct": 0, "total": 0, "correct": 0}
        total = len(atts)
        correct = sum(1 for a in atts if a["is_correct"])
        # 약점 단원
        unit_acc: dict[str, dict] = defaultdict(lambda: {"correct": 0, "total": 0, "unit_name": "", "subject": ""})
        for a in atts:
            p = self.problems.get(a["problem_id"])
            if not p:
                continue
            uid = p["unit_id"]
            unit_acc[uid]["total"] += 1
            if a["is_correct"]:
                unit_acc[uid]["correct"] += 1
            unit_acc[uid]["unit_name"] = p.get("unit_name", "")
            unit_acc[uid]["subject"] = p.get("subject", "")
        weak = []
        for uid, ua in unit_acc.items():
            acc = ua["correct"] / ua["total"] if ua["total"] else 0
            if acc < 1.0:
                weak.append({
                    "unit_id": uid,
                    "unit_name": ua["unit_name"],
                    "subject": ua["subject"],
                    "accuracy": round(acc, 2),
                    "total": ua["total"],
                    "correct": ua["correct"],
                })
        weak.sort(key=lambda x: x["accuracy"])

        # 4축 오답 분포
        eb: dict[str, int] = defaultdict(int)
        for a in atts:
            if not a["is_correct"] and a["error_label"]:
                eb[a["error_label"]] += 1

        return {
            "user_id": user_id,
            "total": total,
            "correct": correct,
            "score_pct": round(correct / total * 100) if total else 0,
            "weak_units": weak[:3],
            "error_breakdown": dict(eb),
        }


store = Store()

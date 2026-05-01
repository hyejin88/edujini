"""초등 3학년 NCIC 성취기준 시드.

수학·국어 핵심 단원 12개. PoC 문항 생성의 기준이 됨.
출처: 국가교육과정정보센터 (NCIC) 2022 개정 교육과정 (공공저작물).
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

GRADE3_UNITS = [
    # 수학
    {
        "id": "math-3-1-1",
        "subject": "수학",
        "grade": 3,
        "semester": 1,
        "unit_no": 1,
        "unit_name": "덧셈과 뺄셈",
        "sub_unit": "받아올림이 있는 세 자리 수의 덧셈",
        "standard_code": "[4수01-04]",
        "standard_text": "세 자리 수의 덧셈과 뺄셈을 이해하고 그 계산 원리를 설명할 수 있다.",
        "concepts": ["받아올림", "받아내림", "세 자리 수 덧셈", "세 자리 수 뺄셈"],
    },
    {
        "id": "math-3-1-2",
        "subject": "수학",
        "grade": 3,
        "semester": 1,
        "unit_no": 2,
        "unit_name": "평면도형",
        "sub_unit": "선의 종류 / 각",
        "standard_code": "[4수02-01]",
        "standard_text": "직선, 반직선, 선분을 이해하고 구별할 수 있다.",
        "concepts": ["직선", "반직선", "선분", "각", "직각"],
    },
    {
        "id": "math-3-1-3",
        "subject": "수학",
        "grade": 3,
        "semester": 1,
        "unit_no": 3,
        "unit_name": "나눗셈",
        "sub_unit": "똑같이 나누기",
        "standard_code": "[4수01-07]",
        "standard_text": "나눗셈이 이루어지는 실생활 상황을 통하여 나눗셈의 의미를 알고, 곱셈과 나눗셈의 관계를 이해한다.",
        "concepts": ["똑같이 나누기", "묶어 세기", "곱셈과 나눗셈의 관계"],
    },
    {
        "id": "math-3-1-4",
        "subject": "수학",
        "grade": 3,
        "semester": 1,
        "unit_no": 4,
        "unit_name": "곱셈",
        "sub_unit": "(두 자리 수) × (한 자리 수)",
        "standard_code": "[4수01-06]",
        "standard_text": "곱하는 수가 한 자리 수인 곱셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",
        "concepts": ["올림이 없는 곱셈", "올림이 있는 곱셈", "분배법칙"],
    },
    {
        "id": "math-3-1-5",
        "subject": "수학",
        "grade": 3,
        "semester": 1,
        "unit_no": 5,
        "unit_name": "길이와 시간",
        "sub_unit": "1mm·1km / 시간 단위",
        "standard_code": "[4수03-01]",
        "standard_text": "1mm와 1km의 단위를 알고 길이를 측정하고 어림할 수 있다.",
        "concepts": ["길이 단위 변환", "시간 단위 변환", "어림하기"],
    },
    {
        "id": "math-3-1-6",
        "subject": "수학",
        "grade": 3,
        "semester": 1,
        "unit_no": 6,
        "unit_name": "분수와 소수",
        "sub_unit": "분수의 의미 / 소수의 의미",
        "standard_code": "[4수01-10]",
        "standard_text": "양의 등분할을 통하여 분수를 이해하고, 그 의미를 표현할 수 있다.",
        "concepts": ["진분수", "단위분수", "소수 첫째 자리", "분수와 소수 비교"],
    },
    {
        "id": "math-3-2-1",
        "subject": "수학",
        "grade": 3,
        "semester": 2,
        "unit_no": 1,
        "unit_name": "곱셈",
        "sub_unit": "(세 자리 수) × (한 자리 수) / (두 자리 수) × (두 자리 수)",
        "standard_code": "[4수01-06]",
        "standard_text": "곱하는 수가 한 자리 수 또는 두 자리 수인 곱셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",
        "concepts": ["세 자리 수 곱셈", "두 자리 수 × 두 자리 수", "표준 곱셈 알고리즘"],
    },
    {
        "id": "math-3-2-2",
        "subject": "수학",
        "grade": 3,
        "semester": 2,
        "unit_no": 2,
        "unit_name": "나눗셈",
        "sub_unit": "(두 자리 수) ÷ (한 자리 수)",
        "standard_code": "[4수01-08]",
        "standard_text": "나누는 수가 한 자리 수인 나눗셈의 계산 원리를 이해하고 그 계산을 할 수 있으며, 나눗셈에서 몫과 나머지의 의미를 안다.",
        "concepts": ["나머지가 없는 나눗셈", "나머지가 있는 나눗셈", "검산"],
    },
    {
        "id": "math-3-2-3",
        "subject": "수학",
        "grade": 3,
        "semester": 2,
        "unit_no": 3,
        "unit_name": "원",
        "sub_unit": "원의 중심·반지름·지름",
        "standard_code": "[4수02-04]",
        "standard_text": "원의 중심, 반지름, 지름을 알고, 그 관계를 이해한다.",
        "concepts": ["중심", "반지름", "지름", "지름은 반지름의 2배"],
    },
    # 국어
    {
        "id": "kor-3-1-1",
        "subject": "국어",
        "grade": 3,
        "semester": 1,
        "unit_no": 1,
        "unit_name": "재미가 톡톡톡",
        "sub_unit": "감각적 표현이 드러난 글 읽기",
        "standard_code": "[4국05-01]",
        "standard_text": "시각, 청각 등 감각적 표현에 유의하여 작품을 감상한다.",
        "concepts": ["감각적 표현", "비유", "운율", "의성어·의태어"],
    },
    {
        "id": "kor-3-1-2",
        "subject": "국어",
        "grade": 3,
        "semester": 1,
        "unit_no": 2,
        "unit_name": "문단의 짜임",
        "sub_unit": "중심 문장과 뒷받침 문장",
        "standard_code": "[4국02-02]",
        "standard_text": "글의 중심 생각을 파악한다.",
        "concepts": ["중심 문장", "뒷받침 문장", "문단", "주제"],
    },
    {
        "id": "kor-3-1-3",
        "subject": "국어",
        "grade": 3,
        "semester": 1,
        "unit_no": 3,
        "unit_name": "낱말의 의미",
        "sub_unit": "낱말의 뜻 짐작하기 / 비슷한말·반대말",
        "standard_code": "[4국04-02]",
        "standard_text": "낱말과 낱말의 의미 관계를 파악한다.",
        "concepts": ["유의어", "반의어", "다의어", "문맥 추론"],
    },
]


def main() -> None:
    out_dir = ROOT / "data" / "grade3"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "units.json"
    out_path.write_text(
        json.dumps(GRADE3_UNITS, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[OK] {len(GRADE3_UNITS)} units → {out_path}")
    by_subject: dict[str, int] = {}
    for u in GRADE3_UNITS:
        by_subject[u["subject"]] = by_subject.get(u["subject"], 0) + 1
    for s, n in by_subject.items():
        print(f"     {s}: {n}")


if __name__ == "__main__":
    main()

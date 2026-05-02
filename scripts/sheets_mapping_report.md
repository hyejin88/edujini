# 일일수학 → sheets.ts 매핑 리포트

- 카탈로그 양식: 266개
- 매핑 성공: 247개
- 매핑 실패: 19개

## 단원별 매핑 수
- `math-1-1-3` (덧셈과 뺄셈): 7개
- `math-1-2-2` (덧셈과 뺄셈(1)): 16개
- `math-1-2-4` (덧셈과 뺄셈(2)): 9개
- `math-1-2-6` (덧셈과 뺄셈(3)): 8개
- `math-2-1-3` (덧셈과 뺄셈): 18개
- `math-2-2-2` (곱셈구구): 6개
- `math-3-1-1` (덧셈과 뺄셈): 30개
- `math-3-1-3` (나눗셈): 5개
- `math-3-1-4` (곱셈): 12개
- `math-3-2-1` (곱셈): 12개
- `math-3-2-2` (나눗셈): 14개
- `math-3-2-4` (분수): 4개
- `math-4-1-3` (곱셈과 나눗셈): 22개
- `math-4-2-1` (분수의 덧셈과 뺄셈): 10개
- `math-4-2-3` (소수의 덧셈과 뺄셈): 16개
- `math-5-1-1` (자연수의 혼합계산): 11개
- `math-5-1-2` (약수와 배수): 8개
- `math-5-1-4` (약분과 통분): 8개
- `math-5-1-5` (분수의 덧셈과 뺄셈): 6개
- `math-5-2-2` (분수의 곱셈): 6개
- `math-5-2-4` (소수의 곱셈): 3개
- `math-6-1-1` (분수의 나눗셈): 1개
- `math-6-1-4` (비와 비율): 2개
- `math-6-2-1` (분수의 나눗셈): 3개
- `math-6-2-2` (소수의 나눗셈): 4개
- `math-6-2-4` (비례식과 비례배분): 6개

## 매핑 실패 양식 (단원별)

### math-2-1-3 (덧셈과 뺄셈)
- 17. 몇십 몇 + 몇 - 몇 / 몇십 몇 - 몇 + 몇  _(op?)_

### math-3-1-1 (덧셈과 뺄셈)
- 31. 세 수의 덧셈/뺄셈 (세 자리 수) _(pool? op=sub d=None_None carry=None)_
- 32. 세 수의 덧셈/뺄셈 (네 자리 수) _(pool? op=sub d=None_None carry=None)_

### math-5-2-4 (소수의 곱셈)
- 1. 소수와 자연수의 곱 _(op?)_

### math-6-1-1 (분수의 나눗셈)
- 1. 분수 ÷ 자연수 _(pool? op=div d=None_None carry=None)_

### math-6-1-3 (소수의 나눗셈)
- 1. 소수 ÷ 자연수  _(pool? op=div d=None_None carry=None)_
- 2. 소수 ÷ 자연수 (소수 끝자리 아래 0을 내려 계산) _(pool? op=div d=None_None carry=None)_
- 3. 자연수 ÷ 자연수 _(pool? op=div d=None_None carry=None)_
- 4. 자연수 ÷ 자연수 (반올림하여 나타냄) _(pool? op=div d=None_None carry=None)_

### math-6-2-2 (소수의 나눗셈)
- 1. 소수 한 자리 수 ÷ 소수 한 자리 수 _(pool? op=div d=None_None carry=None)_
- 2. 소수 두 자리 수 ÷ 소수 두 자리 수 _(pool? op=div d=None_None carry=None)_
- 4. 자연수 ÷ 소수 _(pool? op=div d=None_None carry=None)_
- 6. 소수 ÷ 분수 (분수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_
- 7. 소수 ÷ 분수 (소수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_
- 8. 분수 ÷ 소수 (분수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_
- 9. 분수 ÷ 소수 (소수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_

### math-6-2-4 (비례식과 비례배분)
- 1. 가장 작은 자연수의 비로 나타내기 _(op?)_
- 5. 두 비의 관계를 연비로 나타내기 _(op?)_
- 7. 가장 작은 수의 연비로 나타내기 _(op?)_
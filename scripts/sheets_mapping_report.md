# 일일수학 → sheets.ts 매핑 리포트

- 카탈로그 양식: 266개
- 매핑 성공: 229개
- 매핑 실패: 37개

## 단원별 매핑 수
- `math-1-1-3` (덧셈과 뺄셈): 7개
- `math-1-2-2` (덧셈과 뺄셈(1)): 16개
- `math-1-2-4` (덧셈과 뺄셈(2)): 9개
- `math-1-2-6` (덧셈과 뺄셈(3)): 8개
- `math-2-1-3` (덧셈과 뺄셈): 18개
- `math-2-2-2` (곱셈구구): 6개
- `math-3-1-1` (덧셈과 뺄셈): 22개
- `math-3-1-3` (나눗셈): 3개
- `math-3-1-4` (곱셈): 12개
- `math-3-2-1` (곱셈): 12개
- `math-3-2-2` (나눗셈): 13개
- `math-3-2-4` (분수): 4개
- `math-4-1-3` (곱셈과 나눗셈): 19개
- `math-4-2-1` (분수의 덧셈과 뺄셈): 10개
- `math-4-2-3` (소수의 덧셈과 뺄셈): 16개
- `math-5-1-1` (자연수의 혼합계산): 11개
- `math-5-1-2` (약수와 배수): 8개
- `math-5-1-4` (약분과 통분): 4개
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
- 11. 네 자리 수 + 세 자리 수 A _(op?)_
- 12. 네 자리 수 + 세 자리 수 B _(op?)_
- 13. 네 자리 수 + 네 자리 수 A _(op?)_
- 14. 네 자리 수 + 네 자리 수 B _(op?)_
- 23. 네 자리 수 - 세 자리 수 A _(op?)_
- 24. 네 자리 수 - 세 자리 수 B _(op?)_
- 25. 네 자리 수 - 네 자리 수 A _(op?)_
- 26. 네 자리 수 - 네 자리 수 B _(op?)_
- 31. 세 수의 덧셈/뺄셈 (세 자리 수) _(pool? op=sub d=None_None carry=None)_
- 32. 세 수의 덧셈/뺄셈 (네 자리 수) _(pool? op=sub d=None_None carry=None)_

### math-3-1-3 (나눗셈)
- 2. 곱셈과 나눗셈의 관계 _(pool? op=div d=None_None carry=None)_
- 3. 나눗셈과 곱셈의 관계 _(pool? op=div d=None_None carry=None)_

### math-3-2-2 (나눗셈)
- 14. 나눗셈의 검산 _(pool? op=div d=None_None carry=None)_

### math-4-1-3 (곱셈과 나눗셈)
- 2. 몇백, 몇천의 곱 _(op?)_
- 9. 몇십으로 나누기 (나머지 없음) A _(op?)_
- 11. 몇십으로 나누기 (나머지 있음) A _(op?)_

### math-5-1-4 (약분과 통분)
- 1. 크기가 같은 분수 만들기 _(op?)_
- 7. 분수를 소수로 나타내기 _(op?)_
- 8. 소수를 분수로 나타내기 _(op?)_
- 9. 분수와 소수의 비교 _(op?)_

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
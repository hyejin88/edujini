# 일일수학 → sheets.ts 매핑 리포트

- 카탈로그 양식: 266개
- 매핑 성공: 143개
- 매핑 실패: 123개

## 단원별 매핑 수
- `math-1-1-3` (덧셈과 뺄셈): 2개
- `math-1-2-2` (덧셈과 뺄셈(1)): 14개
- `math-1-2-4` (덧셈과 뺄셈(2)): 3개
- `math-1-2-6` (덧셈과 뺄셈(3)): 8개
- `math-2-1-3` (덧셈과 뺄셈): 18개
- `math-2-2-2` (곱셈구구): 6개
- `math-3-1-1` (덧셈과 뺄셈): 22개
- `math-3-1-3` (나눗셈): 3개
- `math-3-1-4` (곱셈): 12개
- `math-3-2-1` (곱셈): 12개
- `math-3-2-2` (나눗셈): 13개
- `math-4-1-3` (곱셈과 나눗셈): 19개
- `math-5-1-1` (자연수의 혼합계산): 2개
- `math-5-2-2` (분수의 곱셈): 6개
- `math-5-2-4` (소수의 곱셈): 3개

## 매핑 실패 양식 (단원별)

### math-1-1-3 (덧셈과 뺄셈)
- 1. 두 수로 가르기(한 자리 수) _(pool? op=sub d=None_None carry=None)_
- 2. 두 수를 모으기(한 자리 수) _(pool? op=add d=None_None carry=None)_
- 5. 한 자리 수 덧셈과 뺄셈의 관계 _(pool? op=sub d=None_None carry=None)_
- 6. 한 자리 수 뺄셈과 덧셈의 관계 _(pool? op=sub d=None_None carry=None)_
- 7. 한 자리 수 덧셈/뺄셈에서 @box안의 수 찾기 _(pool? op=sub d=None_None carry=None)_

### math-1-2-2 (덧셈과 뺄셈(1))
- 15. 두 자리 수 덧셈과 뺄셈의 관계 _(pool? op=sub d=None_None carry=None)_
- 16. 두 자리 수 뺄셈과 덧셈의 관계 _(pool? op=sub d=None_None carry=None)_

### math-1-2-4 (덧셈과 뺄셈(2))
- 4. 10을 두 수로 가르기 _(pool? op=sub d=None_None carry=None)_
- 5. 10이 되도록 두 수를 모으기 _(pool? op=add d=None_None carry=None)_
- 6. 10이 되는 더하기 _(pool? op=add d=None_None carry=None)_
- 7. 10에서 빼기 _(pool? op=sub d=None_None carry=None)_
- 8. 두 수의 합이 10이 되는 세 수의 덧셈 A _(pool? op=add d=None_None carry=None)_
- 9. 두 수의 합이 10이 되는 세 수의 덧셈 B _(pool? op=add d=None_None carry=None)_

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

### math-3-2-4 (분수)
- 1. 대분수를 가분수로 나타내기 _(op?)_
- 2. 가분수를 대분수로 나타내기 _(op?)_
- 3. 분모가 같은 가분수/대분수끼리의 크기 비교 _(op?)_
- 4. 분모가 같은 가분수와 대분수의 크기 비교 _(op?)_

### math-4-1-3 (곱셈과 나눗셈)
- 2. 몇백, 몇천의 곱 _(op?)_
- 9. 몇십으로 나누기 (나머지 없음) A _(op?)_
- 11. 몇십으로 나누기 (나머지 있음) A _(op?)_

### math-4-2-1 (분수의 덧셈과 뺄셈)
- 1. 분모가 같은 진분수의 덧셈 (합이 진분수) _(pool? op=add d=None_None carry=None)_
- 2. 분모가 같은 진분수의 덧셈 (합이 가분수) _(pool? op=add d=None_None carry=None)_
- 3. 분모가 같은 대분수의 덧셈 (분자의 합 < 분모) _(pool? op=add d=None_None carry=None)_
- 4. 분모가 같은 대분수의 덧셈 (분자의 합 > 분모) _(pool? op=add d=None_None carry=None)_
- 5. 분모가 같은 진분수의 뺄셈 (진분수 - 진분수) _(pool? op=sub d=None_None carry=None)_
- 6. 분모가 같은 진분수의 뺄셈 (자연수 - 진분수) _(pool? op=sub d=None_None carry=None)_
- 7. 분모가 같은 대분수의 뺄셈 <1> _(pool? op=sub d=None_None carry=None)_
- 8. 분모가 같은 대분수의 뺄셈 <2> _(pool? op=sub d=None_None carry=None)_
- 9. 분모가 같은 대분수와 진분수의 덧셈 _(pool? op=add d=None_None carry=None)_
- 10. 분모가 같은 대분수와 진분수의 뺄셈 _(pool? op=sub d=None_None carry=None)_

### math-4-2-3 (소수의 덧셈과 뺄셈)
- 1. 자연수가 없는 소수 한 자리 수끼리의 덧셈 A _(pool? op=add d=None_None carry=None)_
- 2. 자연수가 없는 소수 한 자리 수끼리의 덧셈 B _(pool? op=add d=None_None carry=None)_
- 3. 자연수가 없는 소수 두 자리 수 범위의 덧셈 A _(pool? op=add d=None_None carry=None)_
- 4. 자연수가 없는 소수 두 자리 수 범위의 덧셈 B _(pool? op=add d=None_None carry=None)_
- 5. 자연수가 있는 소수 두 자리 수끼리의 덧셈 A _(pool? op=add d=None_None carry=None)_
- 6. 자연수가 있는 소수 두 자리 수끼리의 덧셈 B _(pool? op=add d=None_None carry=None)_
- 7. 자연수가 있는 소수 세 자리 수 범위의 덧셈 A _(pool? op=add d=None_None carry=None)_
- 8. 자연수가 있는 소수 세 자리 수 범위의 덧셈 B _(pool? op=add d=None_None carry=None)_
- 9. 소수 한 자리 수끼리의 뺄셈 A _(pool? op=sub d=None_None carry=None)_
- 10. 소수 한 자리 수끼리의 뺄셈 B _(pool? op=sub d=None_None carry=None)_
- 11. 자연수가 없는 소수 두 자리 범위의 뺄셈 A _(pool? op=sub d=None_None carry=None)_
- 12. 자연수가 없는 소수 두 자리 범위의 뺄셈 B _(pool? op=sub d=None_None carry=None)_
- 13. 자연수가 있는 소수 두 자리 수끼리의 뺄셈 A _(pool? op=sub d=None_None carry=None)_
- 14. 자연수가 있는 소수 두 자리 수끼리의 뺄셈 B _(pool? op=sub d=None_None carry=None)_
- 15. 자연수가 있는 소수 세 자리 수 범위의 뺄셈 A _(pool? op=sub d=None_None carry=None)_
- 16. 자연수가 있는 소수 세 자리 수 범위의 뺄셈 B _(pool? op=sub d=None_None carry=None)_

### math-5-1-1 (자연수의 혼합계산)
- 1. 덧셈과 뺄셈의 혼합 계산 _(pool? op=sub d=None_None carry=None)_
- 2. 곱셈과 나눗셈의 혼합 계산 _(pool? op=div d=None_None carry=None)_
- 4. 덧셈, 뺄셈, 나눗셈의 혼합 계산 _(pool? op=div d=None_None carry=None)_
- 5. 덧셈, 뺄셈, 곱셈, 나눗셈의 혼합 계산 _(pool? op=div d=None_None carry=None)_
- 6. ( )가 있는 덧셈/뺄셈의 혼합 계산 _(pool? op=sub d=None_None carry=None)_
- 7. ( )가 있는 곱셈/나눗셈의 혼합 계산 _(pool? op=div d=None_None carry=None)_
- 9. ( )가 있는 덧셈/뺄셈/나눗셈의 혼합 계산 _(pool? op=div d=None_None carry=None)_
- 10. ( )가 있는 덧셈/뺄셈/곱셈/나눗셈의 혼합 계산 _(pool? op=div d=None_None carry=None)_
- 11. { }가 있는 덧셈/뺄셈/곱셈/나눗셈의 혼합 계산 _(pool? op=div d=None_None carry=None)_

### math-5-1-2 (약수와 배수)
- 1. 약수 구하기 _(op?)_
- 2. 배수 구하기 _(op?)_
- 3. 공약수 구하기 _(op?)_
- 4. 최대 공약수 구하기 - 두 수를 곱으로 나타냄 _(op?)_
- 5. 최대 공약수 구하기 - 공통 약수 이용 _(op?)_
- 6. 공배수 구하기 _(op?)_
- 7. 최소 공배수 구하기 - 두 수를 곱으로 나타냄 _(op?)_
- 8. 최소 공배수 구하기 - 최대공약수 이용 _(op?)_

### math-5-1-4 (약분과 통분)
- 1. 크기가 같은 분수 만들기 _(op?)_
- 3. 기약분수 구하기 _(op?)_
- 4. 분수의 통분 (곱을 공통분모로) _(op?)_
- 5. 분수의 통분 (최소공배수를 공통분모로) _(op?)_
- 6. 분수의 크기 비교 _(op?)_
- 7. 분수를 소수로 나타내기 _(op?)_
- 8. 소수를 분수로 나타내기 _(op?)_
- 9. 분수와 소수의 비교 _(op?)_

### math-5-1-5 (분수의 덧셈과 뺄셈)
- 1. 진분수의 덧셈 _(pool? op=add d=None_None carry=None)_
- 2. 대분수의 덧셈 (받아올림 없음) _(pool? op=add d=None_None carry=0)_
- 3. 대분수의 덧셈 (받아올림 있음) _(pool? op=add d=None_None carry=-1)_
- 4. 진분수의 뺄셈 _(pool? op=sub d=None_None carry=None)_
- 5. 대분수의 뺄셈 (받아내림 없음) _(pool? op=sub d=None_None carry=0)_
- 6. 대분수의 뺄셈 (받아내림 있음) _(pool? op=sub d=None_None carry=-1)_

### math-5-2-4 (소수의 곱셈)
- 1. 소수와 자연수의 곱 _(op?)_

### math-6-1-1 (분수의 나눗셈)
- 1. 분수 ÷ 자연수 _(pool? op=div d=None_None carry=None)_
- 2. 분수와 자연수의 곱셈/나눗셈 혼합 _(pool? op=div d=None_None carry=None)_

### math-6-1-3 (소수의 나눗셈)
- 1. 소수 ÷ 자연수  _(pool? op=div d=None_None carry=None)_
- 2. 소수 ÷ 자연수 (소수 끝자리 아래 0을 내려 계산) _(pool? op=div d=None_None carry=None)_
- 3. 자연수 ÷ 자연수 _(pool? op=div d=None_None carry=None)_
- 4. 자연수 ÷ 자연수 (반올림하여 나타냄) _(pool? op=div d=None_None carry=None)_

### math-6-1-4 (비와 비율)
- 1. 비와 비율 _(op?)_
- 2. 백분율과 할푼리 _(op?)_

### math-6-2-1 (분수의 나눗셈)
- 1. 분수의 나눗셈 <1> _(pool? op=div d=None_None carry=None)_
- 2. 분수의 나눗셈 <2> _(pool? op=div d=None_None carry=None)_
- 3. 분수의 나눗셈 <3> _(pool? op=div d=None_None carry=None)_

### math-6-2-2 (소수의 나눗셈)
- 1. 소수 한 자리 수 ÷ 소수 한 자리 수 _(pool? op=div d=None_None carry=None)_
- 2. 소수 두 자리 수 ÷ 소수 두 자리 수 _(pool? op=div d=None_None carry=None)_
- 3. 자릿수가 다른 두 소수의 나눗셈 _(pool? op=div d=None_None carry=None)_
- 4. 자연수 ÷ 소수 _(pool? op=div d=None_None carry=None)_
- 5. 소수의 나눗셈에서 나머지 구하기 _(pool? op=div d=None_None carry=None)_
- 6. 소수 ÷ 분수 (분수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_
- 7. 소수 ÷ 분수 (소수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_
- 8. 분수 ÷ 소수 (분수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_
- 9. 분수 ÷ 소수 (소수로 고쳐 계산) _(pool? op=div d=None_None carry=None)_
- 10. 분수와 소수의 혼합 계산 (연산자가 2, 3개) _(op?)_
- 11. 분수와 소수의 혼합 계산 (연산자가 4개 이상) _(op?)_

### math-6-2-4 (비례식과 비례배분)
- 1. 가장 작은 자연수의 비로 나타내기 _(op?)_
- 2. 자연수로 된 비례식에서 @box 안의 수 구하기 _(op?)_
- 3. 소수가 있는 비례식에서 @box 안의 수 구하기 _(op?)_
- 4. 분수가 있는 비례식에서 @box 안의 수 구하기 _(op?)_
- 5. 두 비의 관계를 연비로 나타내기 _(op?)_
- 6. 두 비를 연비로 나타낸 것에서 @box 안의 수 구하기 _(op?)_
- 7. 가장 작은 수의 연비로 나타내기 _(op?)_
- 8. 비례배분 _(op?)_
- 9. 연비로 비례배분 _(op?)_
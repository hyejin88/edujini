// SEO 단원별 랜딩 페이지 메타 — 영문 슬러그 + 학부모용 설명 + 자주 막히는 부분

export interface LearnUnit {
  unit_id: string;            // math-3-1-6
  grade: number;              // 3
  semester: number;           // 1
  slug: string;               // fraction-decimal (canonical)
  aliases?: string[];         // SEO alias — 사용자 자연 검색 변형 (예: "fraction", "fractions")
  unit_name: string;          // 분수와 소수
  short_description: string;  // 한 줄 요약 (메타 description)
  long_description: string;   // 학부모용 설명 (3~4문장)
  common_struggles: string[]; // 자주 막히는 부분 3~4개
  search_intents: string[];   // 학부모 자연어 검색 키워드
  ncic_codes: string[];       // [4수01-08] 등
}

export const LEARN_UNITS: LearnUnit[] = [
  // ───────── 초1 ─────────
  {
    unit_id: "math-1-1-3", grade: 1, semester: 1, slug: "addition-subtraction",
    unit_name: "덧셈과 뺄셈", ncic_codes: ["[2수01-04]"],
    short_description: "9까지 수의 덧셈과 뺄셈 — 가르기·모으기·10 만들기",
    long_description: "초등 수학의 가장 기초가 되는 한 자리 수의 덧셈과 뺄셈을 배워요. 두 수로 가르기, 모으기, 10이 되는 수 짝짓기를 통해 자연스럽게 사칙연산의 기초를 다집니다.",
    common_struggles: ["가르기·모으기 개념 헷갈림", "10이 되는 수 짝짓기 오답", "받아올림 직전 단계 막힘"],
    search_intents: ["초1 덧셈 뺄셈", "가르기 모으기 학습지", "10 만들기"],
  },
  {
    unit_id: "math-1-2-2", grade: 1, semester: 2, slug: "addition-subtraction-no-regrouping",
    unit_name: "덧셈과 뺄셈 (받아올림 없음)", ncic_codes: ["[2수01-04]"],
    short_description: "두 자리 수의 덧셈과 뺄셈 — 받아올림·받아내림 없는 기본",
    long_description: "두 자리 수의 덧셈과 뺄셈에서 받아올림과 받아내림이 없는 기본형을 익혀요. 자릿값(일의 자리·십의 자리) 개념을 처음 만나는 단원이라 차근차근 진행하는 게 중요합니다.",
    common_struggles: ["자릿값 개념 혼동", "세로식 정렬 실수"],
    search_intents: ["초1 두 자리 수 덧셈", "받아올림 없는 덧셈"],
  },
  {
    unit_id: "math-1-2-4", grade: 1, semester: 2, slug: "addition-subtraction-with-regrouping",
    unit_name: "덧셈과 뺄셈 (받아올림·받아내림)", ncic_codes: ["[2수01-04]"],
    short_description: "한 자리 수 + 한 자리 수 받아올림, 십몇 - 몇 받아내림",
    long_description: "한 자리 수끼리 더해서 11~18이 되는 받아올림 덧셈, 십몇에서 몇을 빼는 받아내림 뺄셈을 배워요. 1학년 수학에서 가장 중요한 분기점이라 여기서 막히면 이후 모든 연산이 어려워집니다.",
    common_struggles: ["10을 만들어 받아올리기 개념", "13-7 같은 받아내림 단계", "손가락 셈에서 못 벗어남"],
    search_intents: ["초1 받아올림", "받아내림 어려워해요", "13 빼기 7"],
  },

  {
    unit_id: "math-1-2-6", grade: 1, semester: 2, slug: "addition-subtraction-mixed",
    unit_name: "덧셈과 뺄셈 (혼합)", ncic_codes: ["[2수01-04]"],
    short_description: "한 자리 + 한 자리(받아올림) + 십몇 - 몇(받아내림) 종합",
    long_description: "1학년 후반의 덧셈과 뺄셈 종합 단원. 받아올림이 있는 한 자리 수 덧셈, 받아내림이 있는 십몇 - 몇 뺄셈을 함께 다루며 자릿값 감각을 정착시켜요.",
    common_struggles: ["받아올림과 받아내림 동시 학습 부담", "10을 빌려오는 단계 헷갈림"],
    search_intents: ["초1 받아올림 받아내림", "1학년 종합 덧뺄"],
  },
  // ───────── 초2 ─────────
  {
    unit_id: "math-2-1-3", grade: 2, semester: 1, slug: "two-digit-addition-subtraction",
    unit_name: "두 자리 수의 덧셈과 뺄셈", ncic_codes: ["[2수01-05]"],
    short_description: "받아올림·받아내림 1번/2번이 있는 두 자리 수 연산",
    long_description: "두 자리 수끼리의 받아올림과 받아내림이 본격적으로 등장합니다. 1번 받아올림, 2번 받아올림으로 단계별 분리해 풀면 익숙해져요. 세로식 정렬과 자릿값 감각이 핵심입니다.",
    common_struggles: ["받아올림 2번 양식에서 자주 실수", "받아내림 + 받아올림 혼합 헷갈림", "검산 안 함"],
    search_intents: ["초2 받아올림 2번", "두 자리 수 뺄셈 받아내림", "초2 덧셈 학습지"],
  },
  {
    unit_id: "math-2-2-2", grade: 2, semester: 2, slug: "multiplication-table",
    unit_name: "곱셈구구 (2~9단)", ncic_codes: ["[2수01-08]"],
    short_description: "2단부터 9단까지 곱셈구구 정착",
    long_description: "곱셈을 처음 배우는 단원. 2단·5단·9단처럼 외우기 쉬운 단부터 시작해 4·6·7·8단으로 확장합니다. 단순 암기보다 묶어 세기·같은 수 더하기로 의미 이해 후 자동화가 좋아요.",
    common_struggles: ["6×7, 7×8 등 중간 단 자주 틀림", "0의 곱셈 개념", "역연산(나눗셈) 동시 학습 부담"],
    search_intents: ["곱셈구구 외우는 법", "구구단 2단 5단", "초2 곱셈 학습지"],
  },

  // ───────── 초3 ─────────
  {
    unit_id: "math-3-1-1", grade: 3, semester: 1, slug: "three-digit-addition-subtraction",
    unit_name: "세 자리 수의 덧셈과 뺄셈", ncic_codes: ["[4수01-04]"],
    short_description: "받아올림·받아내림이 있는 세 자리 수의 덧셈과 뺄셈",
    long_description: "세 자리 수의 받아올림 1·2·3번 덧셈과 받아내림 1·2번 뺄셈을 배워요. 자릿값 정렬이 핵심이라 종이에 세로식으로 또박또박 쓰는 습관이 중요합니다. 받아올림 횟수별로 양식이 분리되어 있어 단계 학습이 가능합니다.",
    common_struggles: ["받아올림 2번에서 가운데 자릿수 실수", "0이 포함된 받아내림 (예: 305-178)", "받아올림 표시 잊어버림"],
    search_intents: ["초3 덧셈 뺄셈", "세 자리 수 받아내림", "받아올림 3번"],
  },
  {
    unit_id: "math-3-1-3", grade: 3, semester: 1, slug: "division-introduction",
    unit_name: "나눗셈 (입문)", ncic_codes: ["[4수01-07]"],
    short_description: "똑같이 나누기·묶어 세기·곱셈과 나눗셈의 관계",
    long_description: "나눗셈을 처음 배우는 단원. 12 ÷ 3 = 4 같은 단순 나눗셈부터 시작해 곱셈과 나눗셈이 짝이라는 사실을 이해합니다. 곱셈구구가 정착돼 있어야 자연스럽게 풀려요.",
    common_struggles: ["곱셈구구 안 외워서 나눗셈 막힘", "'똑같이 나누기' vs '묶어 세기' 의미 혼동"],
    search_intents: ["초3 나눗셈 입문", "곱셈과 나눗셈의 관계"],
  },
  {
    unit_id: "math-3-1-4", grade: 3, semester: 1, slug: "two-digit-multiplication",
    unit_name: "(두 자리)×(한 자리) 곱셈", ncic_codes: ["[4수01-06]"],
    short_description: "두 자리 수 곱셈 — 받아올림 있는·없는 양식 분리",
    long_description: "곱셈구구를 응용해 두 자리 수에 한 자리 수를 곱하는 표준 알고리즘을 익혀요. 받아올림 없는 양식부터 시작해 받아올림 있는 양식으로 단계 확장. 분배법칙(20×3 + 5×3 = 25×3)도 자연스럽게 만나게 됩니다.",
    common_struggles: ["받아올림 빠뜨림", "십의 자리 곱셈에서 0 잊어버림", "긴 자릿수 정렬 실수"],
    search_intents: ["초3 곱셈", "두 자리 곱셈 학습지", "받아올림 곱셈"],
  },
  {
    unit_id: "math-3-1-6", grade: 3, semester: 1, slug: "fraction-decimal",
    unit_name: "분수와 소수", ncic_codes: ["[4수01-10]", "[4수01-12]"],
    short_description: "분수의 의미·소수 첫째 자리·분수↔소수 변환",
    long_description: "분수를 처음 배우는 단원. 1/2, 1/3 같은 분수의 의미를 등분할로 이해하고, 소수 첫째 자리(0.1, 0.5)를 만나요. 분수와 소수가 같은 수의 다른 표현이라는 것을 발견합니다.",
    common_struggles: ["분수 분모와 분자 헷갈림", "소수점 위치 실수", "분수 1/2 = 0.5 변환 어색함"],
    search_intents: ["초3 분수 어려워해요", "분수와 소수", "1/2 0.5 변환"],
  },
  {
    unit_id: "math-3-2-1", grade: 3, semester: 2, slug: "three-digit-multiplication",
    unit_name: "(세 자리)×(한 자리)·(두 자리)×(두 자리)", ncic_codes: ["[4수01-06]"],
    short_description: "세 자리 곱셈과 두 자리×두 자리 표준 알고리즘",
    long_description: "곱셈을 한 단계 더 확장해요. 세 자리 수×한 자리 수, 두 자리 수×두 자리 수의 표준 알고리즘을 배웁니다. 자릿수가 많아져 정렬 실수가 잦으니 종이에 또박또박 쓰는 습관이 핵심.",
    common_struggles: ["두 자리×두 자리에서 두 번째 줄 자릿수 정렬", "받아올림 누적 실수", "0 곱셈 처리"],
    search_intents: ["초3 두 자리 곱셈", "곱셈 세 자리 한 자리"],
  },
  {
    unit_id: "math-3-2-2", grade: 3, semester: 2, slug: "two-digit-division",
    unit_name: "(두 자리)÷(한 자리) 나눗셈", ncic_codes: ["[4수01-07]"],
    short_description: "몫과 나머지·나눗셈 검산",
    long_description: "두 자리 수를 한 자리 수로 나누는 표준 알고리즘과 몫·나머지 개념을 배워요. 몫×나누는 수+나머지=처음 수 검산이 정착돼야 다음 단원이 쉬워집니다.",
    common_struggles: ["몫 추정 어려움", "나머지가 나누는 수보다 큰 실수", "검산 안 함"],
    search_intents: ["초3 나눗셈", "몫과 나머지", "나눗셈 검산"],
  },
  {
    unit_id: "math-3-2-4", grade: 3, semester: 2, slug: "fraction-types",
    unit_name: "진분수·가분수·대분수", ncic_codes: ["[4수01-11]"],
    short_description: "진분수·가분수·대분수 변환과 크기 비교",
    long_description: "분수를 더 깊이 배우는 단원. 진분수(1/2)·가분수(5/3)·대분수(1과 2/3)의 차이를 이해하고 서로 변환해요. 같은 분모 분수의 크기 비교로 분수 감각이 자라납니다.",
    common_struggles: ["가분수 ↔ 대분수 변환 단계 잊음", "대분수 표기 혼동", "크기 비교에서 분자만 보는 실수"],
    search_intents: ["가분수 대분수 변환", "초3 분수 비교", "진분수 가분수 차이"],
  },

  // ───────── 초4 ─────────
  {
    unit_id: "math-4-1-3", grade: 4, semester: 1, slug: "multiplication-division-advanced",
    unit_name: "큰 수의 곱셈과 나눗셈", ncic_codes: ["[4수01-06]", "[4수01-07]"],
    short_description: "(세 자리)×(두 자리)·(세 자리)÷(두 자리)",
    long_description: "큰 수의 곱셈과 나눗셈을 본격 다뤄요. 세 자리×두 자리, 세 자리÷두 자리 표준 알고리즘을 익히고 어림으로 답을 추정하는 감각도 함께 키웁니다.",
    common_struggles: ["몫 한 번에 추정 실패", "곱셈에서 두 번째 줄 정렬 실수", "어림 안 함"],
    search_intents: ["초4 곱셈 나눗셈", "세 자리 곱셈", "세 자리 나눗셈 두 자리"],
  },
  {
    unit_id: "math-4-2-1", grade: 4, semester: 2, slug: "fraction-add-subtract",
    unit_name: "분모가 같은 분수의 덧셈과 뺄셈", ncic_codes: ["[4수01-13]"],
    short_description: "진분수·대분수 덧뺄·받아올림·받아내림이 있는 분수 연산",
    long_description: "분모가 같은 분수의 덧셈과 뺄셈을 배워요. 합이 가분수가 되는 경우, 자연수 - 진분수, 대분수 받아내림 등 단계가 풍부합니다. 분수의 첫 번째 큰 분기점.",
    common_struggles: ["대분수 받아내림 단계 잊음", "자연수 - 진분수 계산", "약분 안 한 채 답 제출"],
    search_intents: ["초4 분수 덧셈", "분수 받아내림", "대분수 뺄셈"],
  },
  {
    unit_id: "math-4-2-3", grade: 4, semester: 2, slug: "decimal-add-subtract",
    unit_name: "소수의 덧셈과 뺄셈", ncic_codes: ["[4수01-14]"],
    short_description: "소수 둘째 자리까지의 덧셈과 뺄셈",
    long_description: "소수점 이하 두 자리까지의 덧셈과 뺄셈을 배워요. 자릿값 정렬이 핵심으로, 0.5 + 0.25 같은 자릿수 다른 소수도 정렬 후 계산해야 합니다.",
    common_struggles: ["소수점 위치 잘못", "자릿수 다른 소수 정렬 실수", "받아내림에서 소수점 무시"],
    search_intents: ["초4 소수 덧셈", "소수점 정렬", "소수 받아내림"],
  },

  // ───────── 초5 ─────────
  {
    unit_id: "math-5-1-1", grade: 5, semester: 1, slug: "mixed-arithmetic",
    unit_name: "자연수의 혼합 계산", ncic_codes: ["[6수01-01]"],
    short_description: "괄호·곱셈·나눗셈·덧셈·뺄셈 우선순위",
    long_description: "사칙연산이 섞인 식의 계산 순서를 배워요. 괄호 → 곱셈/나눗셈 → 덧셈/뺄셈. 식 세우기와 풀이 순서가 동시에 평가되는 단원입니다.",
    common_struggles: ["덧셈을 먼저 해버림", "괄호 안 우선 잊음", "긴 식에서 단계 누락"],
    search_intents: ["혼합 계산 순서", "초5 사칙연산 순서", "괄호 먼저"],
  },
  {
    unit_id: "math-5-1-2", grade: 5, semester: 1, slug: "factors-multiples",
    unit_name: "약수와 배수", ncic_codes: ["[6수01-04]"],
    short_description: "최대공약수·최소공배수·실생활 응용",
    long_description: "약수와 배수, 최대공약수, 최소공배수를 배우고 실생활(정사각형 만들기, 동시 출발 등)에 적용해요. 분수의 약분·통분과 직접 연결되는 핵심 단원.",
    common_struggles: ["최대공약수와 최소공배수 헷갈림", "약수 나열에서 빼먹음", "실생활 문장제 식 세우기"],
    search_intents: ["최대공약수 구하는 법", "최소공배수", "초5 약수 배수"],
  },
  {
    unit_id: "math-5-1-4", grade: 5, semester: 1, slug: "fraction-reduce-common-denominator",
    unit_name: "약분과 통분", ncic_codes: ["[6수01-05]"],
    short_description: "기약분수·분모 다른 분수 비교·분수↔소수 관계",
    long_description: "분수를 가장 간단한 모양으로 나타내는 약분과, 분모 다른 두 분수를 같은 분모로 만드는 통분을 배워요. 분수의 곱셈·나눗셈 다음 단원으로 가는 핵심 디딤돌.",
    common_struggles: ["기약분수 끝까지 약분 안 함", "통분에서 LCM 못 찾음", "분수와 소수 변환 헷갈림"],
    search_intents: ["초5 약분", "통분 구하는 법", "기약분수"],
  },
  {
    unit_id: "math-5-1-5", grade: 5, semester: 1, slug: "fraction-different-denominator",
    unit_name: "분모가 다른 분수의 덧셈과 뺄셈", ncic_codes: ["[6수01-06]"],
    short_description: "통분 → 같은 분모로 만들고 덧셈·뺄셈",
    long_description: "분모가 다른 분수를 통분해서 더하고 뺍니다. 약수와 배수, 통분 개념이 동시에 적용되는 단원이라 직전 단원과 연결 학습이 중요해요.",
    common_struggles: ["통분 안 하고 분자만 더함", "약분 안 한 채 답 제출", "대분수 통분 추가 부담"],
    search_intents: ["분모 다른 분수 덧셈", "통분", "초5 분수 덧뺄"],
  },
  {
    unit_id: "math-5-2-2", grade: 5, semester: 2, slug: "fraction-multiplication",
    unit_name: "분수의 곱셈", ncic_codes: ["[6수01-07]"],
    short_description: "(분수)×(분수)·(자연수)×(분수)·약분 활용",
    long_description: "분수의 곱셈을 배워요. 분자끼리·분모끼리 곱하면 되지만 약분을 먼저 하면 계산이 훨씬 간단해집니다. 대분수 곱셈은 가분수로 변환 후 곱해야 정확.",
    common_struggles: ["대분수를 그대로 곱하는 실수", "곱셈인데 통분하려 함", "약분 안 함"],
    search_intents: ["초5 분수 곱셈", "분수 약분 곱셈"],
  },
  {
    unit_id: "math-5-2-4", grade: 5, semester: 2, slug: "decimal-multiplication",
    unit_name: "소수의 곱셈", ncic_codes: ["[6수01-08]"],
    short_description: "(소수)×(자연수)·(자연수)×(소수)·(소수)×(소수)",
    long_description: "소수의 곱셈을 배워요. 자릿수를 무시하고 자연수처럼 곱한 뒤 소수점 자리수만큼 옮기는 게 핵심. 소수×소수에서는 두 수의 소수점 자리수를 합쳐야 합니다.",
    common_struggles: ["소수점 위치 옮기기 실수", "0.1×0.1=0.01 같은 자릿수 감각 부족"],
    search_intents: ["초5 소수 곱셈", "소수점 옮기기"],
  },

  // ───────── 초6 ─────────
  {
    unit_id: "math-6-1-1", grade: 6, semester: 1, slug: "fraction-division-natural",
    unit_name: "분수의 나눗셈 (분수÷자연수)", ncic_codes: ["[6수01-10]"],
    short_description: "(분수)÷(자연수) — 분모를 자연수 곱한 만큼 늘림",
    long_description: "분수를 자연수로 나누는 방법을 배워요. 분자를 자연수로 나누거나, 분수의 분모에 자연수를 곱하면 됩니다. 다음 단원의 (분수)÷(분수)로 가는 디딤돌.",
    common_struggles: ["나눗셈인데 곱하기로 함", "약분 단계 잊음"],
    search_intents: ["초6 분수 나눗셈", "분수 자연수 나누기"],
  },
  {
    unit_id: "math-6-1-3", grade: 6, semester: 1, slug: "decimal-division-natural",
    unit_name: "소수의 나눗셈 (소수÷자연수)", ncic_codes: ["[6수01-11]"],
    short_description: "소수를 자연수로 나누기·자연수÷자연수 몫이 소수",
    long_description: "소수÷자연수, 자연수÷자연수에서 몫이 소수가 되는 경우를 배웁니다. 0을 내려 계산하는 방법, 반올림으로 어림하는 감각이 함께 길러져요.",
    common_struggles: ["소수점 위치 실수", "0 내려쓰기 잊음", "반올림 헷갈림"],
    search_intents: ["초6 소수 나눗셈", "소수점 자릿수"],
  },
  {
    unit_id: "math-6-1-4", grade: 6, semester: 1, slug: "ratio-percentage",
    unit_name: "비와 비율", ncic_codes: ["[6수02-01]"],
    short_description: "비·비율·백분율·할푼리",
    long_description: "비, 비율, 백분율(%), 할푼리(0.45 = 45% = 4할 5푼)를 배우고 실생활(할인율, 정답률 등)에 적용해요. 다음 단원 비례식의 디딤돌.",
    common_struggles: ["비와 비율 차이 헷갈림", "백분율 변환 실수", "단위 환산 (할푼리)"],
    search_intents: ["초6 비와 비율", "백분율 구하기", "할푼리"],
  },
  {
    unit_id: "math-6-2-1", grade: 6, semester: 2, slug: "fraction-division-fraction",
    unit_name: "분수의 나눗셈 (분수÷분수)", ncic_codes: ["[6수01-10]"],
    short_description: "역수의 곱·통분 후 분자끼리 나누기",
    long_description: "분수를 분수로 나누는 방법을 배워요. 나누는 분수의 역수를 곱하면 됩니다. 또는 통분 후 분자끼리 나누기. 두 방법을 모두 익히면 응용에서 강해요.",
    common_struggles: ["역수 개념 헷갈림", "약분 안 함", "대분수 변환 잊음"],
    search_intents: ["초6 분수 나눗셈", "분수 역수 곱셈", "분수 분수 나누기"],
  },
  {
    unit_id: "math-6-2-2", grade: 6, semester: 2, slug: "decimal-division-extended",
    unit_name: "소수의 나눗셈 (심화)", ncic_codes: ["[6수01-11]"],
    short_description: "소수÷소수 + 자연수÷소수 + 분수↔소수 변환 나눗셈",
    long_description: "6학년 2학기 소수의 나눗셈 심화 — 소수와 소수의 나눗셈, 자연수를 소수로 나누기, 분수와 소수가 섞인 나눗셈을 배워요. 다양한 변형을 한 단원에서 한꺼번에 다룹니다.",
    common_struggles: ["분수↔소수 변환 후 계산 헷갈림", "자연수÷소수 자릿수 옮기기"],
    search_intents: ["초6 소수 나눗셈", "분수와 소수 나눗셈", "자연수÷소수"],
  },
  {
    unit_id: "math-6-2-3", grade: 6, semester: 2, slug: "decimal-division-decimal",
    unit_name: "소수의 나눗셈 (소수÷소수)", ncic_codes: ["[6수01-11]"],
    short_description: "(소수)÷(소수)·자릿수 옮기기",
    long_description: "소수를 소수로 나누는 방법을 배워요. 두 소수의 소수점을 같이 옮겨 자연수 나눗셈으로 바꾸는 게 핵심. 몫의 소수점 위치는 옮긴 만큼 그대로.",
    common_struggles: ["소수점 옮기기 자릿수 실수", "몫의 소수점 위치 잘못"],
    search_intents: ["초6 소수 나눗셈", "소수 소수 나누기"],
  },
  {
    unit_id: "math-6-2-4", grade: 6, semester: 2, slug: "proportion-share",
    unit_name: "비례식과 비례배분", ncic_codes: ["[6수02-02]"],
    short_description: "비례식·외항·내항·비례배분 활용",
    long_description: "비례식의 외항과 내항의 곱이 같다는 성질을 배우고, 비례배분(전체를 a:b로 나누기)을 실생활에 적용해요. 중학교 수학으로 가는 다리.",
    common_struggles: ["외항·내항 위치 헷갈림", "비례배분에서 합 분모 만들기 실수"],
    search_intents: ["초6 비례식", "비례배분", "외항 내항"],
  },
];

// 흔한 영문 검색 별칭 일괄 매핑 (단원 슬러그 ↔ alias)
const ALIASES: Record<string, string[]> = {
  "fraction-decimal": ["fraction", "fractions", "decimal", "decimals"],
  "fraction-types": ["fraction", "fractions", "improper-fraction", "mixed-fraction"],
  "fraction-add-subtract": ["fraction-add", "fraction-subtract", "fraction-addition"],
  "fraction-different-denominator": ["fraction-different", "fraction-add-different"],
  "fraction-multiplication": ["fraction-multiply", "fraction-mul"],
  "fraction-division-natural": ["fraction-division", "fraction-divide"],
  "fraction-division-fraction": ["fraction-division", "fraction-divide-fraction"],
  "fraction-reduce-common-denominator": ["reduce", "common-denominator", "lcd"],
  "decimal-add-subtract": ["decimal-add", "decimal-subtract"],
  "decimal-multiplication": ["decimal-multiply", "decimal-mul"],
  "decimal-division-natural": ["decimal-division", "decimal-divide"],
  "decimal-division-decimal": ["decimal-division", "decimal-divide-decimal"],
  "decimal-division-extended": ["decimal-division-advanced"],
  "multiplication-table": ["multiplication", "times-table", "multiplication-9"],
  "two-digit-multiplication": ["multiplication", "multiply-two-digit"],
  "three-digit-multiplication": ["multiplication", "multiply-three-digit"],
  "two-digit-division": ["division", "divide-two-digit"],
  "division-introduction": ["division", "divide"],
  "multiplication-division-advanced": ["multiplication", "division", "advanced"],
  "two-digit-addition-subtraction": ["addition", "subtraction", "two-digit"],
  "three-digit-addition-subtraction": ["addition", "subtraction", "three-digit", "regrouping"],
  "addition-subtraction": ["addition", "subtraction", "plus-minus"],
  "addition-subtraction-no-regrouping": ["addition", "subtraction", "no-regrouping"],
  "addition-subtraction-with-regrouping": ["addition", "subtraction", "regrouping", "carry"],
  "addition-subtraction-mixed": ["addition", "subtraction", "mixed"],
  "factors-multiples": ["factors", "multiples", "gcd", "lcm"],
  "mixed-arithmetic": ["arithmetic", "order-of-operations", "mixed"],
  "ratio-percentage": ["ratio", "percentage", "percent"],
  "proportion-share": ["proportion", "ratio-share"],
};

export function findLearnUnit(grade: number, slug: string): LearnUnit | undefined {
  // canonical slug 매칭
  const exact = LEARN_UNITS.find((u) => u.grade === grade && u.slug === slug);
  if (exact) return exact;
  // alias 매칭 — 같은 학년 + alias 포함
  for (const u of LEARN_UNITS) {
    if (u.grade !== grade) continue;
    const aliases = ALIASES[u.slug] || u.aliases || [];
    if (aliases.includes(slug)) return u;
  }
  return undefined;
}

export function unitsByGrade(grade: number): LearnUnit[] {
  return LEARN_UNITS.filter((u) => u.grade === grade);
}

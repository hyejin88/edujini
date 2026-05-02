"""일일수학 카탈로그 + 우리 드릴 풀 → sheets.ts UNIT_SHEETS 자동 생성.

매핑 규칙:
1. 양식 제목 → (op, d1, d2, carry_count, layout) 추출
2. 풀 키 후보 검색 (우선순위: 정확매칭 > carry 'once' fallback > 일반 d1_d2)
3. layout: A=세로(drill_v_*), B=가로(drill_h_*)
4. 풀 키 매칭 안되는 양식은 skip + 별도 리포트
"""
import json
import re
from pathlib import Path

ROOT = Path('/Users/hyejin/Documents/generalv1/edutech_qa')
CAT = json.load(open(ROOT / 'scripts' / '11math_catalog.json'))
POOLS = json.load(open(ROOT / 'frontend' / 'lib' / 'drill_pools.json'))
OUT_TS = ROOT / 'frontend' / 'lib' / 'sheets_generated.json'
OUT_REPORT = ROOT / 'scripts' / 'sheets_mapping_report.md'

POOL_KEYS = set(POOLS.keys())

DIG_MAP = {'한': 1, '두': 2, '세': 3, '네': 4,
           '몇': 1, '몇십': 2, '몇십 몇': 2,
           '몇백': 3, '몇백 몇십': 3, '몇백 몇십 몇': 3, '몇천': 4}


def parse_layout(title, desc):
    last = title.strip().split()[-1] if title.strip() else ''
    if last == 'A': return 'v'
    if last == 'B': return 'h'
    if '세로' in desc: return 'v'
    if '가로' in desc: return 'h'
    return 'h'  # 기본 가로


def parse_op(title, desc):
    # ± / ∓ 는 mix
    if '±' in title or '∓' in title: return 'mix_addsub'
    if '나눗셈' in title or '÷' in title: return 'div'
    if '곱셈' in title or 'X' in title or '×' in title: return 'mul'
    if '뺄셈' in title or '받아내림' in title or '가르기' in title or '에서 빼' in title or '의 차' in title: return 'sub'
    if '덧셈' in title or '받아올림' in title or '모으기' in title or '되는 더하기' in title or '되도록' in title: return 'add'
    if '나눗셈' in desc: return 'div'
    if '곱셈' in desc: return 'mul'
    if '뺄셈' in desc: return 'sub'
    if '덧셈' in desc: return 'add'
    return None


def parse_carry(title, desc):
    m = re.search(r'받아올림\s*(\d+)번', title) or re.search(r'받아내림\s*(\d+)번', title)
    if m: return int(m.group(1))
    m = re.search(r'받아올림이\s*(\d+)번', desc) or re.search(r'받아내림이\s*(\d+)번', desc)
    if m: return int(m.group(1))
    if '받아올림 없음' in title or '받아내림 없음' in title: return 0
    if '받아올림이 없' in desc or '받아내림이 없' in desc: return 0
    if '받아올림' in title or '받아내림' in title or '받아 올림' in desc or '받아 내림' in desc: return -1
    return None


# 단일 키워드 → 자릿수 (양변 모두 같다고 추정)
SINGLE_KW = {
    '몇천': 4, '몇백 몇십 몇': 3, '몇백 몇십': 3, '몇백': 3,
    '몇십 몇': 2, '몇십': 2, '몇': 1,
    '한 자리': 1, '두 자리': 2, '세 자리': 3, '네 자리': 4,
}


def parse_digits(title):
    # 1) "X 자리 수 + Y 자리 수"
    m = re.search(r'(한|두|세|네)\s*자리\s*수[^+\-X×÷±]*[+\-X×÷±]\s*(한|두|세|네)\s*자리\s*수', title)
    if m: return DIG_MAP[m.group(1)], DIG_MAP[m.group(2)]
    # 2) "몇/몇십 + 몇/몇십" — 양쪽 명시
    m = re.search(r'(몇천|몇백 몇십 몇|몇백 몇십|몇백|몇십 몇|몇십|몇)\s*[+\-X×÷±]\s*(몇천|몇백 몇십 몇|몇백 몇십|몇백|몇십 몇|몇십|몇)', title)
    if m: return DIG_MAP[m.group(1)], DIG_MAP[m.group(2)]
    # 3) "몇백 몇십 몇의 덧셈" / "두 자리 수 덧셈" — 단일 키워드 → 양쪽 동일 자릿수
    for kw in sorted(SINGLE_KW.keys(), key=lambda k: -len(k)):
        if kw + '의' in title or kw + ' 덧셈' in title or kw + ' 뺄셈' in title or kw + '끼리' in title or kw + ' 수의' in title:
            d = SINGLE_KW[kw]
            return d, d
    # 4) "몇십 X 몇" 형태 (op 사이에 다른 단어 없음)
    m = re.search(r'(몇천|몇백 몇십 몇|몇백 몇십|몇백|몇십 몇|몇십|몇)\s*[Xx×÷]\s*(몇천|몇백 몇십 몇|몇백 몇십|몇백|몇십 몇|몇십|몇)', title)
    if m: return DIG_MAP[m.group(1)], DIG_MAP[m.group(2)]
    return None, None


def find_pool_key(op, d1, d2, carry, with_remainder=False, title='', desc=''):
    """우선순위 매칭으로 풀 키 결정."""
    candidates = []
    if op == 'add':
        if d1 and d2:
            if carry == 0: candidates.append(f'h_add_{d1}_{d2}_no_carry')
            if isinstance(carry, int) and carry > 0:
                candidates.append(f'h_add_{d1}_{d2}_carry{carry}')
                candidates.append(f'h_add_{d1}_{d2}_carry')
            if carry == -1: candidates.append(f'h_add_{d1}_{d2}_carry')
            candidates.append(f'h_add_{d1}_{d2}')
        if d1 == d2 == 1 and carry == -1:
            candidates.append('h_add_1_1_carry')
    elif op == 'sub':
        if d1 and d2:
            if carry == 0: candidates.append(f'h_sub_{d1}_{d2}_no_borrow')
            if isinstance(carry, int) and carry > 0:
                candidates.append(f'h_sub_{d1}_{d2}_borrow{carry}')
                candidates.append(f'h_sub_{d1}_{d2}_borrow')
            if carry == -1: candidates.append(f'h_sub_{d1}_{d2}_borrow')
            candidates.append(f'h_sub_{d1}_{d2}')
        if d1 == d2 == 1 and carry == -1:
            candidates.append('h_sub_1_1_borrow')
    elif op == 'mul':
        if d1 and d2:
            candidates.append(f'h_mul_{d1}_{d2}')
        candidates.append('h_mul_1_1')  # 곱셈구구 fallback
    elif op == 'div':
        if d1 and d2:
            if with_remainder: candidates.append(f'h_div_{d1}_{d2}_rem')
            candidates.append(f'h_div_{d1}_{d2}')
            if not with_remainder: candidates.append(f'h_div_{d1}_{d2}_rem')
        # 자릿수 미지정 — 곱셈구구 범위 기본 추정
        if '곱셈구구' in title or '곱셈구구' in desc or '나눗셈의 기초' in title:
            candidates.append('h_div_1_1')
            candidates.append('h_div_2_1')
        if '몫과 나머지' in title:
            candidates.append('h_div_2_1_rem')
            candidates.append('h_div_3_1_rem')
        if '몇십으로 나누기' in title:
            if with_remainder or '나머지 있' in title: candidates.append('h_div_3_2_rem')
            else: candidates.append('h_div_3_2')
    elif op == 'mix_addsub':
        # 세 수, 또는 ±형식 — 자릿수에 맞는 add 풀 사용 (내용은 어차피 +/- 섞여 출제)
        if d1 and d2 and d1 == d2:
            candidates.append(f'h_add_{d1}_{d2}')
        if d1 and d2:
            candidates.append(f'h_add_{d1}_{d2}')
        # 세 수 fallback
        candidates.append('three_num_2')
        candidates.append('three_num_1')
    for k in candidates:
        if k in POOL_KEYS:
            return k
    return None


def sheet_type(op, layout):
    if op == 'add':
        if layout == 'v': return 'drill_v_add'
        return 'drill_h_add'
    if op == 'sub':
        if layout == 'v': return 'drill_v_sub'
        return 'drill_h_sub'
    if op == 'mul':
        if layout == 'v': return 'drill_v_mul'
        return 'drill_h_mul'
    if op == 'div':
        return 'drill_h_div'  # 나눗셈은 가로식만 (현재 SheetType에 v_div 없음)
    if op == 'mix_addsub':
        return 'drill_v_add' if layout == 'v' else 'drill_h_add'
    return 'drill_h_add'


def short_id(no, layout, op):
    return f's{no}-{layout}-{op[0]}'


unit_sheets = {}     # unit_id → [SheetMeta]
report_lines = []
unmapped = []
auto_n = 16  # 기본 문항 수
for uid, info in CAT.items():
    sheets = []
    for f in info['formats']:
        title = f['title']
        desc = f['description']
        layout = parse_layout(title, desc)
        op = parse_op(title, desc)
        carry = parse_carry(title, desc)
        d1, d2 = parse_digits(title)
        with_rem = '나머지' in title and '없음' not in title
        if op is None:
            unmapped.append((uid, f['no'], title, 'op?'))
            continue
        pool_key = find_pool_key(op, d1, d2, carry, with_rem, title, desc)
        if not pool_key:
            unmapped.append((uid, f['no'], title, f'pool? op={op} d={d1}_{d2} carry={carry}'))
            continue
        st = sheet_type(op, layout)
        # subtitle 짧게
        subtitle = re.sub(r'\s+[AB]$', '', title)
        sheet = {
            'id': short_id(f['no'], layout, op),
            'unit_id': uid,
            'type': st,
            'title': re.sub(r'\s+[AB]$', '', title),
            'subtitle': f'{("세로식" if layout == "v" else "가로식")} · {auto_n}문제',
            'problem_count': auto_n,
            'pool_key': pool_key,
            'layout': layout,
        }
        sheets.append(sheet)
    if sheets:
        unit_sheets[uid] = sheets

OUT_TS.write_text(json.dumps(unit_sheets, ensure_ascii=False, indent=2), encoding='utf-8')

# 리포트
report_lines.append('# 일일수학 → sheets.ts 매핑 리포트\n')
report_lines.append(f'- 카탈로그 양식: {sum(len(c["formats"]) for c in CAT.values())}개')
report_lines.append(f'- 매핑 성공: {sum(len(s) for s in unit_sheets.values())}개')
report_lines.append(f'- 매핑 실패: {len(unmapped)}개\n')
report_lines.append('## 단원별 매핑 수')
for uid in sorted(unit_sheets):
    cn = CAT[uid]['unit_name']
    report_lines.append(f'- `{uid}` ({cn}): {len(unit_sheets[uid])}개')
report_lines.append('\n## 매핑 실패 양식 (단원별)')
by_uid = {}
for uid, no, title, reason in unmapped:
    by_uid.setdefault(uid, []).append((no, title, reason))
for uid in sorted(by_uid):
    report_lines.append(f'\n### {uid} ({CAT[uid]["unit_name"]})')
    for no, title, reason in by_uid[uid]:
        report_lines.append(f'- {no}. {title} _({reason})_')
OUT_REPORT.write_text('\n'.join(report_lines), encoding='utf-8')

print(f'[OK] sheets generated → {OUT_TS}')
print(f'[OK] report → {OUT_REPORT}')
print(f'\n매핑 성공: {sum(len(s) for s in unit_sheets.values())} / {sum(len(c["formats"]) for c in CAT.values())}')
print(f'매핑 실패: {len(unmapped)}')
print('\n단원별:')
for uid in sorted(unit_sheets):
    print(f'  {uid:<14} {len(unit_sheets[uid]):>3}개  ({CAT[uid]["unit_name"]})')

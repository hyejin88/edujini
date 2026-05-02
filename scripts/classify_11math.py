"""일일수학 카탈로그 266개 양식을 의미적 pool_key + layout(A=세로/B=가로)로 분류.

Output: scripts/11math_classified.json
- 각 양식: pool_key (의미만), layout ('v'/'h'/'mixed')
- pool_key는 build_drill_pools.py와 매칭되는 키 또는 신규 생성 필요 키
"""
import json, re
from pathlib import Path

CAT = json.load(open('/Users/hyejin/Documents/generalv1/edutech_qa/scripts/11math_catalog.json'))
OUT = Path('/Users/hyejin/Documents/generalv1/edutech_qa/scripts/11math_classified.json')

# 자릿수 키워드 → 자릿수 매핑
DIGITS = {
    '몇': 1, '몇십': 2, '몇십 몇': 2, '몇백': 3, '몇백 몇십': 3, '몇백 몇십 몇': 3,
    '몇천': 4, '한 자리': 1, '두 자리': 2, '세 자리': 3, '네 자리': 4,
    '한자리': 1, '두자리': 2, '세자리': 3, '네자리': 4,
}

def detect_layout(title, desc):
    last = title.strip().split()[-1] if title.strip() else ''
    if last == 'A': return 'v'   # 세로식
    if last == 'B': return 'h'   # 가로식
    if '세로' in desc: return 'v'
    if '가로' in desc: return 'h'
    return 'mixed'

def base_title(title):
    """A/B 접미사 제거"""
    t = title.strip()
    t = re.sub(r'\s+[AB]$', '', t)
    return t

def detect_op(title, desc):
    if '덧셈' in title or '+' in title or '덧셈' in desc:
        if '뺄셈' in title or '뺄셈' in desc: return 'mix_addsub'
        return 'add'
    if '뺄셈' in title or '뺄셈' in desc: return 'sub'
    if '곱셈' in title or 'X' in title or '×' in title or '곱셈' in desc:
        if '나눗셈' in title or '나눗셈' in desc: return 'mix_muldiv'
        return 'mul'
    if '나눗셈' in title or '÷' in title or '나눗셈' in desc: return 'div'
    if '분수' in title:
        if '곱셈' in desc: return 'frac_mul'
        if '나눗셈' in desc: return 'frac_div'
        if '뺄셈' in desc and '덧셈' in desc: return 'frac_addsub'
        if '덧셈' in desc: return 'frac_add'
        if '뺄셈' in desc: return 'frac_sub'
        return 'frac'
    if '소수' in title:
        if '곱셈' in desc: return 'dec_mul'
        if '나눗셈' in desc: return 'dec_div'
        if '뺄셈' in desc and '덧셈' in desc: return 'dec_addsub'
        if '덧셈' in desc: return 'dec_add'
        if '뺄셈' in desc: return 'dec_sub'
        return 'dec'
    if '약수' in title: return 'factor'
    if '배수' in title: return 'multiple'
    if '약분' in title: return 'reduce'
    if '통분' in title: return 'common_denom'
    if '비례식' in title: return 'proportion'
    if '비례배분' in title: return 'proportional_share'
    if '비' in title and '비교' not in title: return 'ratio'
    if '혼합' in title or '혼합' in desc: return 'mix_calc'
    return 'unknown'

def detect_carry(title, desc):
    """받아올림/내림 횟수"""
    m = re.search(r'받아올림\s*(\d+)번', title) or re.search(r'받아내림\s*(\d+)번', title)
    if m: return int(m.group(1))
    if '받아올림 없음' in title or '받아내림 없음' in title or '받아올림이 없' in desc or '받아내림이 없' in desc: return 0
    if '받아올림' in title or '받아내림' in title or '받아 올림' in desc or '받아 내림' in desc: return -1  # 임의
    return None

def detect_digits(title, desc):
    """좌·우 피연산자 자릿수 추정"""
    # "세 자리 수 + 두 자리 수" / "네 자리 수 X 두 자리 수" 패턴
    m = re.search(r'(한|두|세|네)\s*자리\s*수[^\(]*?([+\-X×÷])\s*(한|두|세|네)\s*자리\s*수', title)
    if m:
        d_map = {'한': 1, '두': 2, '세': 3, '네': 4}
        return [d_map[m.group(1)], d_map[m.group(3)]]
    # "몇백 + 몇백" 패턴
    m = re.search(r'(몇천|몇백 몇십 몇|몇백 몇십|몇백|몇십 몇|몇십|몇)\s*[+\-]\s*(몇천|몇백 몇십 몇|몇백 몇십|몇백|몇십 몇|몇십|몇)', title)
    if m:
        d_map = {'몇': 1, '몇십': 2, '몇십 몇': 2, '몇백': 3, '몇백 몇십': 3, '몇백 몇십 몇': 3, '몇천': 4}
        return [d_map.get(m.group(1), 0), d_map.get(m.group(2), 0)]
    return None

# 분류
classified = {}
unique_keys = set()
for uid, info in CAT.items():
    out_formats = []
    for f in info['formats']:
        t = f['title']
        d = f['description']
        layout = detect_layout(t, d)
        op = detect_op(t, d)
        carry = detect_carry(t, d)
        digits = detect_digits(t, d)
        base = base_title(t)
        # pool_key 합성
        parts = [op]
        if digits:
            parts.append(f'{digits[0]}_{digits[1]}')
        if carry is not None:
            if carry == 0: parts.append('no_carry')
            elif carry == -1: parts.append('carry')
            else: parts.append(f'carry{carry}')
        pool_key = '_'.join(parts)
        unique_keys.add(pool_key)
        out_formats.append({
            'no': f['no'],
            'title': t,
            'base': base,
            'description': d,
            'layout': layout,
            'op': op,
            'digits': digits,
            'carry': carry,
            'pool_key': pool_key,
        })
    classified[uid] = {**{k: v for k, v in info.items() if k != 'formats'}, 'formats': out_formats}

OUT.write_text(json.dumps(classified, ensure_ascii=False, indent=2), encoding='utf-8')

# 요약: 고유 pool_key
print(f'[OK] {OUT}')
print(f'고유 pool_key: {len(unique_keys)}개\n')

# 현재 drill_pools.json 비교
existing = json.load(open('/Users/hyejin/Documents/generalv1/edutech_qa/frontend/lib/drill_pools.json'))
existing_keys = set(existing.keys())

# 카테고리별 그룹
by_op = {}
for k in unique_keys:
    op = k.split('_')[0]
    by_op.setdefault(op, []).append(k)

for op in sorted(by_op):
    keys = sorted(by_op[op])
    print(f'\n[OP={op}] {len(keys)}개 pool_key')
    for k in keys:
        # 현재 drill_pools 키 변환 (h_/v_ 프리픽스 무시)
        bare = k
        existing_alt = f'h_{bare}'
        in_pool = bare in existing_keys or existing_alt in existing_keys or any(bare in ek for ek in existing_keys)
        mark = '✓' if in_pool else ' '
        print(f'  {mark} {k}')

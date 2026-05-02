"""연산 문제지 (드릴) 풀 사전 빌드 — frontend/lib/drill_pools.json 생성.

양식별로 가능한 조합을 모두 나열 후 만개 이하면 그대로, 초과면 만개로 샘플링.
런타임에 클라이언트가 학습지 ID·날짜로 시드 잡고 풀에서 N개 추출.
Gemini 호출 0, 비용 0, 영원히 고정 풀.
"""
import json
import random
from pathlib import Path

random.seed(20260502)
ROOT = Path('/Users/hyejin/Documents/generalv1/edutech_qa')
OUT = ROOT / 'frontend' / 'lib' / 'drill_pools_index.json'  # 메타만 (키 → 풀 크기)
SPLIT_DIR = ROOT / 'frontend' / 'public' / 'pools'         # 양식별 풀 파일
MAX_POOL = 10000  # 풀당 1만 — 양식별 파일 분리(public/pools/)로 번들 압박 X


def count_carries(a, b):
    """덧셈에서 받아올림이 일어난 자릿수 개수."""
    n = 0
    carry = 0
    while a > 0 or b > 0:
        s = (a % 10) + (b % 10) + carry
        if s >= 10:
            n += 1
            carry = 1
        else:
            carry = 0
        a //= 10
        b //= 10
    return n


def count_borrows(a, b):
    """뺄셈(a-b, a>=b)에서 받아내림이 일어난 자릿수 개수."""
    n = 0
    borrow = 0
    while a > 0 or b > 0:
        da = (a % 10) - borrow
        db = b % 10
        if da < db:
            n += 1
            borrow = 1
        else:
            borrow = 0
        a //= 10
        b //= 10
    return n


def has_carry(a, b):
    return count_carries(a, b) > 0


def has_borrow(a, b):
    return count_borrows(a, b) > 0


def gen_h_add(d1, d2, carry=None):
    """carry: None / 'none' / 'once' / int (0,1,2,3 — 받아올림 횟수 정확 매칭)"""
    lo1, hi1 = (10**(d1-1) if d1 > 1 else 0), 10**d1 - 1
    lo2, hi2 = (10**(d2-1) if d2 > 1 else 0), 10**d2 - 1
    out = []
    for a in range(lo1, hi1 + 1):
        for b in range(lo2, hi2 + 1):
            if carry == 'none' and has_carry(a, b): continue
            if carry == 'once' and not has_carry(a, b): continue
            if isinstance(carry, int) and count_carries(a, b) != carry: continue
            out.append({'op': '+', 'a': a, 'b': b, 'ans': a + b})
    return out


def gen_h_sub(d1, d2, carry=None):
    """carry: None / 'none' / 'once' / int (0,1,2 — 받아내림 횟수 정확 매칭)"""
    lo1, hi1 = (10**(d1-1) if d1 > 1 else 0), 10**d1 - 1
    lo2, hi2 = (10**(d2-1) if d2 > 1 else 0), 10**d2 - 1
    out = []
    for a in range(lo1, hi1 + 1):
        for b in range(lo2, min(hi2, a) + 1):  # a >= b
            if carry == 'none' and has_borrow(a, b): continue
            if carry == 'once' and not has_borrow(a, b): continue
            if isinstance(carry, int) and count_borrows(a, b) != carry: continue
            out.append({'op': '-', 'a': a, 'b': b, 'ans': a - b})
    return out


def gen_h_mul(d1, d2):
    # 한 자리는 2~9 강제
    def rng(d):
        if d == 1: return range(2, 10)
        return range(10**(d-1), 10**d)
    out = []
    for a in rng(d1):
        for b in rng(d2):
            out.append({'op': '×', 'a': a, 'b': b, 'ans': a * b})
    return out


def gen_h_div(d1, d2, with_remainder=False, q_max=99):
    """나눗셈 — 결과(피제수, 제수)를 곱셈으로부터 역산.
    q_max: 몫의 최대값(자릿수 통제). 기본 99(2자리 몫까지).
    """
    out = []
    def rng_b(d):
        if d == 1: return range(2, 10)
        return range(10**(d-1), 10**d)
    for b in rng_b(d2):
        for q in range(2, q_max + 1):
            if with_remainder:
                for r in range(1, b):
                    a = b * q + r
                    if a >= 10**d1: continue
                    if d1 > 1 and a < 10**(d1-1): continue
                    out.append({'op': '÷', 'a': a, 'b': b, 'ans': q, 'r': r})
            else:
                a = b * q
                if a >= 10**d1: continue
                if d1 > 1 and a < 10**(d1-1): continue
                out.append({'op': '÷', 'a': a, 'b': b, 'ans': q})
    return out


def gen_h_mul_no_carry(d1, d2):
    """곱셈 받아올림 없음 — 각 자릿수 곱이 10 미만."""
    pool = gen_h_mul(d1, d2)
    out = []
    for p in pool:
        a, b = p['a'], p['b']
        # 자릿수별 곱이 10 미만이고 누적 받아올림이 없는 경우
        ok = True
        carry = 0
        x = a
        # b가 한 자리인 경우만 정확히 처리 (no-carry 양식은 보통 d2=1)
        if d2 == 1:
            tmp = a
            while tmp > 0:
                if (tmp % 10) * b + carry >= 10:
                    ok = False; break
                tmp //= 10
        else:
            ok = False  # d2>=2는 별도 처리 — 일단 제외
        if ok: out.append(p)
    return out


def gen_round_mul(d1, d2):
    """몇십·몇백 X 몇 / 몇십 X 몇십 같은 '0이 끝에 오는' 곱셈."""
    out = []
    def rng_round(d):
        if d == 1: return range(2, 10)
        # 끝자리 0인 d-자리 수 (예: 2자리 = 10,20,...,90)
        return [n * 10**(d-1) for n in range(1, 10)]
    for a in rng_round(d1):
        for b in rng_round(d2):
            out.append({'op': '×', 'a': a, 'b': b, 'ans': a * b})
    return out


# ==== 1학년: 가르기·모으기, 10 만들기 ====
def gen_decompose_under(n_max=9):
    """두 수로 가르기 — n = a + b 표를 출제. (1자리 한정)"""
    out = []
    for n in range(2, n_max + 1):
        for a in range(1, n):
            b = n - a
            out.append({'op': 'decompose', 'n': n, 'a': a, 'b': b})
    return out


def gen_make_ten():
    """10 만들기 — 빈칸 위치 다양화 + 0 포함 + 세 수 합."""
    out = []
    # 두 자연수 합 = 10, 빈칸 위치 좌/우/합 (0~10)
    for a in range(0, 11):
        b = 10 - a
        # 오른쪽 빈칸: a + □ = 10
        out.append({'op': 'make_ten', 'a': a, 'b': None, 'ans': b, 'box': 'right'})
        # 왼쪽 빈칸: □ + b = 10
        out.append({'op': 'make_ten', 'a': None, 'b': b, 'ans': a, 'box': 'left'})
        # 합 빈칸 (검증형): a + b = □
        out.append({'op': 'make_ten', 'a': a, 'b': b, 'ans': 10, 'box': 'sum'})
    return out


def gen_break_ten():
    """10에서 빼기 + 자리 교환 + 빈칸 위치 다양화."""
    out = []
    for a in range(0, 11):
        b = 10 - a
        # 오른쪽 빈칸: 10 - a = □
        out.append({'op': 'break_ten', 'a': a, 'ans': b, 'box': 'right'})
        # 가운데 빈칸: 10 - □ = b
        out.append({'op': 'break_ten', 'a': None, 'ans_b': b, 'ans': a, 'box': 'middle'})
    return out


# ==== 1·2학년: 한 자리 + 한 자리 (받아올림 있음, 합 11~18) ====
def gen_add_1_1_carry():
    out = []
    for a in range(2, 10):
        for b in range(2, 10):
            if a + b >= 11:
                out.append({'op': '+', 'a': a, 'b': b, 'ans': a + b})
    return out


def gen_sub_teen_1():
    """십몇 - 몇 (받아내림 있음). 차는 1~9."""
    out = []
    for a in range(11, 19):
        for b in range(2, 10):
            if a - b >= 1 and a % 10 < b:  # 받아내림
                out.append({'op': '-', 'a': a, 'b': b, 'ans': a - b})
    return out


# ==== 세 수 연산 ====
def gen_three_num_addsub(d=1):
    """a + b - c / a - b + c (1~2자리)."""
    hi = 10**d - 1
    out = []
    for a in range(1, hi + 1):
        for b in range(1, hi + 1):
            for c in range(1, hi + 1):
                # +, -
                ans1 = a + b - c
                if 0 <= ans1 <= hi * 3:
                    out.append({'op': 'three', 'a': a, 'b': b, 'c': c, 'ops': '+-', 'ans': ans1})
                # -, +
                if a - b >= 0:
                    ans2 = a - b + c
                    out.append({'op': 'three', 'a': a, 'b': b, 'c': c, 'ops': '-+', 'ans': ans2})
    return out


def gen_fraction_same_denom_add():
    """분모 같은 진분수 덧셈, 합이 진분수. 분모 2~30 확대."""
    out = []
    for d in range(3, 31):
        for a in range(1, d - 1):
            for b in range(1, d - a):
                out.append({
                    'op': 'frac_add',
                    'd': d, 'a': a, 'b': b,
                    'ans_num': a + b, 'ans_den': d
                })
    return out


def gen_fraction_same_denom_sub():
    """분모 같은 진분수 뺄셈, 결과 양수. 분모 2~30."""
    out = []
    for d in range(3, 31):
        for a in range(2, d):
            for b in range(1, a):
                out.append({
                    'op': 'frac_sub',
                    'd': d, 'a': a, 'b': b,
                    'ans_num': a - b, 'ans_den': d
                })
    return out


# ==== 분수: 변환 (가분수↔대분수, 진분수↔가분수) — 범위 확대 ====
def gen_frac_proper_to_improper():
    out = []
    for d in range(2, 21):
        for n in range(1, 10):
            for b in range(1, d):
                num = n * d + b
                out.append({
                    'op': 'mixed_to_improper',
                    'whole': n, 'num': b, 'den': d,
                    'ans_num': num, 'ans_den': d,
                })
    return out


def gen_frac_improper_to_mixed():
    out = []
    for d in range(2, 21):
        for num in range(d + 1, 10 * d + 1):
            whole = num // d
            rem = num % d
            out.append({
                'op': 'improper_to_mixed',
                'num': num, 'den': d,
                'ans_whole': whole, 'ans_num': rem, 'ans_den': d,
            })
    return out


def gen_frac_compare_same_denom():
    out = []
    for d in range(2, 21):
        for a in range(1, 5 * d + 1):
            for b in range(1, 5 * d + 1):
                if a == b: continue
                out.append({
                    'op': 'frac_compare',
                    'a_num': a, 'a_den': d, 'b_num': b, 'b_den': d,
                    'ans': '>' if a > b else '<',
                })
    return out


# ==== 분수의 덧셈/뺄셈: 합이 가분수 / 자연수-진분수 / 대분수 ====
def gen_frac_same_add_sum_improper():
    out = []
    for d in range(3, 31):
        for a in range(1, d):
            for b in range(1, d):
                if a + b >= d:
                    out.append({
                        'op': 'frac_add',
                        'd': d, 'a': a, 'b': b,
                        'ans_num': a + b, 'ans_den': d,
                    })
    return out


def gen_frac_natural_minus_proper():
    out = []
    for d in range(2, 31):
        for n in range(1, 11):
            for b in range(1, d):
                out.append({
                    'op': 'frac_sub',
                    'd': d, 'a_whole': n, 'a_num': 0, 'b': b,
                    'ans_whole': n - 1, 'ans_num': d - b, 'ans_den': d,
                })
    return out


def gen_frac_mixed_add():
    out = []
    for d in range(3, 21):
        for w1 in range(1, 7):
            for n1 in range(1, d):
                for w2 in range(1, 7):
                    for n2 in range(1, d - n1):
                        out.append({
                            'op': 'mixed_add',
                            'w1': w1, 'n1': n1, 'w2': w2, 'n2': n2, 'd': d,
                            'ans_whole': w1 + w2, 'ans_num': n1 + n2, 'ans_den': d,
                        })
    return out


def gen_frac_mixed_add_carry():
    out = []
    for d in range(3, 21):
        for w1 in range(1, 7):
            for n1 in range(1, d):
                for w2 in range(1, 7):
                    for n2 in range(d - n1, d):
                        if n1 + n2 < d: continue
                        total_num = n1 + n2
                        ans_w = w1 + w2 + total_num // d
                        ans_n = total_num % d
                        out.append({
                            'op': 'mixed_add',
                            'w1': w1, 'n1': n1, 'w2': w2, 'n2': n2, 'd': d,
                            'ans_whole': ans_w, 'ans_num': ans_n, 'ans_den': d,
                        })
    return out


def gen_frac_mixed_sub():
    out = []
    for d in range(3, 21):
        for w1 in range(2, 9):
            for n1 in range(1, d):
                for w2 in range(1, w1):
                    for n2 in range(1, n1 + 1):
                        out.append({
                            'op': 'mixed_sub',
                            'w1': w1, 'n1': n1, 'w2': w2, 'n2': n2, 'd': d,
                            'ans_whole': w1 - w2, 'ans_num': n1 - n2, 'ans_den': d,
                        })
    return out


def gen_frac_mixed_sub_borrow():
    out = []
    for d in range(3, 21):
        for w1 in range(2, 9):
            for n1 in range(1, d):
                for w2 in range(1, w1):
                    for n2 in range(n1 + 1, d):
                        ans_w = (w1 - 1) - w2
                        ans_n = (n1 + d) - n2
                        out.append({
                            'op': 'mixed_sub',
                            'w1': w1, 'n1': n1, 'w2': w2, 'n2': n2, 'd': d,
                            'ans_whole': ans_w, 'ans_num': ans_n, 'ans_den': d,
                        })
    return out


# ==== 분모 다른 분수의 덧/뺄 (5학년) ====
def gen_frac_diff_denom_add():
    from math import gcd
    out = []
    for d1 in range(2, 21):
        for d2 in range(2, 21):
            if d1 == d2: continue
            for a in range(1, d1):
                for b in range(1, d2):
                    g = gcd(d1, d2)
                    lcm = d1 * d2 // g
                    num = a * (lcm // d1) + b * (lcm // d2)
                    out.append({
                        'op': 'frac_add_diff',
                        'a_num': a, 'a_den': d1, 'b_num': b, 'b_den': d2,
                        'ans_num': num, 'ans_den': lcm,
                    })
    return out


def gen_frac_diff_denom_sub():
    from math import gcd
    out = []
    for d1 in range(2, 21):
        for d2 in range(2, 21):
            if d1 == d2: continue
            for a in range(1, d1):
                for b in range(1, d2):
                    g = gcd(d1, d2)
                    lcm = d1 * d2 // g
                    n1 = a * (lcm // d1)
                    n2 = b * (lcm // d2)
                    if n1 <= n2: continue
                    out.append({
                        'op': 'frac_sub_diff',
                        'a_num': a, 'a_den': d1, 'b_num': b, 'b_den': d2,
                        'ans_num': n1 - n2, 'ans_den': lcm,
                    })
    return out


# ==== 분수의 곱셈/나눗셈 (5·6학년) ====
def gen_frac_mul_proper():
    out = []
    for d1 in range(2, 21):
        for n1 in range(1, d1):
            for d2 in range(2, 21):
                for n2 in range(1, d2):
                    out.append({
                        'op': 'frac_mul',
                        'a_num': n1, 'a_den': d1, 'b_num': n2, 'b_den': d2,
                        'ans_num': n1 * n2, 'ans_den': d1 * d2,
                    })
    return out


def gen_frac_mul_natural():
    out = []
    for n in range(2, 30):
        for d in range(2, 21):
            for num in range(1, d):
                out.append({
                    'op': 'frac_mul_nat',
                    'whole': n, 'b_num': num, 'b_den': d,
                    'ans_num': n * num, 'ans_den': d,
                })
    return out


def gen_frac_div_natural():
    out = []
    for d in range(2, 21):
        for num in range(1, d):
            for n in range(2, 30):
                out.append({
                    'op': 'frac_div_nat',
                    'a_num': num, 'a_den': d, 'whole': n,
                    'ans_num': num, 'ans_den': d * n,
                })
    return out


def gen_frac_div_frac():
    out = []
    for d1 in range(2, 16):
        for n1 in range(1, d1):
            for d2 in range(2, 16):
                for n2 in range(1, d2):
                    out.append({
                        'op': 'frac_div',
                        'a_num': n1, 'a_den': d1, 'b_num': n2, 'b_den': d2,
                        'ans_num': n1 * d2, 'ans_den': d1 * n2,
                    })
    return out


# ==== 약분/통분 ====
def gen_reduce_fraction():
    from math import gcd
    out = []
    for d in range(2, 100):
        for n in range(1, d):
            g = gcd(n, d)
            if g <= 1: continue
            out.append({
                'op': 'reduce_frac',
                'num': n, 'den': d,
                'ans_num': n // g, 'ans_den': d // g,
            })
    return out


def gen_common_denom():
    from math import gcd
    out = []
    for d1 in range(2, 21):
        for d2 in range(d1 + 1, 22):
            for a in range(1, d1):
                for b in range(1, d2):
                    g = gcd(d1, d2)
                    lcm = d1 * d2 // g
                    out.append({
                        'op': 'common_denom',
                        'a_num': a, 'a_den': d1, 'b_num': b, 'b_den': d2,
                        'ans_lcm': lcm,
                        'ans_a_num': a * (lcm // d1), 'ans_b_num': b * (lcm // d2),
                    })
    return out


# ==== 소수 (4학년 +) ====
def gen_decimal_add(decimals=1, integer=False):
    """소수 덧셈. decimals=1: 0.x + 0.y (정수부 없음 또는 1자리)."""
    out = []
    int_max = 9 if integer else 0
    scale = 10 ** decimals
    int_lo = 0 if not integer else 1
    for ai in range(int_lo, int_max + 1):
        for ad in range(1, scale):
            for bi in range(int_lo, int_max + 1):
                for bd in range(1, scale):
                    a = ai + ad / scale
                    b = bi + bd / scale
                    out.append({
                        'op': 'dec_add',
                        'a': round(a, decimals), 'b': round(b, decimals),
                        'ans': round(a + b, decimals),
                    })
    return out


def gen_decimal_sub(decimals=1, integer=False):
    out = []
    int_max = 9 if integer else 0
    scale = 10 ** decimals
    int_lo = 0 if not integer else 1
    for ai in range(int_lo, int_max + 1):
        for ad in range(1, scale):
            for bi in range(int_lo, int_max + 1):
                for bd in range(1, scale):
                    a = ai + ad / scale
                    b = bi + bd / scale
                    if a < b: continue
                    out.append({
                        'op': 'dec_sub',
                        'a': round(a, decimals), 'b': round(b, decimals),
                        'ans': round(a - b, decimals),
                    })
    return out


def gen_decimal_mul_natural(decimals=1):
    """자연수 X 소수."""
    out = []
    scale = 10 ** decimals
    for n in range(2, 10):
        for di in range(0, 10):
            for dd in range(1, scale):
                d = di + dd / scale
                out.append({
                    'op': 'dec_mul_nat',
                    'whole': n, 'dec': round(d, decimals),
                    'ans': round(n * d, decimals),
                })
    return out


def gen_decimal_mul_decimal(decimals=1):
    """소수 X 소수 (decimals 자릿수)."""
    out = []
    scale = 10 ** decimals
    for ai in range(0, 10):
        for ad in range(1, scale):
            for bi in range(0, 10):
                for bd in range(1, scale):
                    a = ai + ad / scale
                    b = bi + bd / scale
                    out.append({
                        'op': 'dec_mul',
                        'a': round(a, decimals), 'b': round(b, decimals),
                        'ans': round(a * b, decimals * 2),
                    })
    return out


def gen_decimal_div_natural(decimals=1):
    out = []
    scale = 10 ** decimals
    for n in range(2, 30):
        for q_int in range(1, 30):
            for q_dec in range(0, scale):
                q = q_int + q_dec / scale
                a = n * q
                if abs(a - round(a, decimals)) > 1e-9: continue
                out.append({
                    'op': 'dec_div_nat',
                    'a': round(a, decimals), 'whole': n,
                    'ans': round(q, decimals),
                })
    return out


# ==== 빈칸 채우기 (덧셈/뺄셈 □ 찾기) ====
def gen_box_addsub_1d():
    """한 자리 수 a ± □ = c 또는 □ + b = c 빈칸 찾기."""
    out = []
    for a in range(0, 10):
        for b in range(0, 10):
            c = a + b
            if c <= 18:
                # a + □ = c
                out.append({'op': 'box_add', 'a': a, 'c': c, 'box': 'b', 'ans': b})
                # □ + b = c
                out.append({'op': 'box_add', 'b': b, 'c': c, 'box': 'a', 'ans': a})
            if a >= b:
                d = a - b
                # a - □ = d
                out.append({'op': 'box_sub', 'a': a, 'c': d, 'box': 'b', 'ans': b})
    return out


def gen_box_addsub_2d():
    out = []
    for a in range(10, 100):
        for b in range(0, 100):
            c = a + b
            if c < 200:
                out.append({'op': 'box_add', 'a': a, 'c': c, 'box': 'b', 'ans': b})
                out.append({'op': 'box_add', 'b': b, 'c': c, 'box': 'a', 'ans': a})
            if a >= b:
                d = a - b
                out.append({'op': 'box_sub', 'a': a, 'c': d, 'box': 'b', 'ans': b})
    return out


# ==== 1학년: 한 자리 수의 ± 관계 (덧셈식 ↔ 뺄셈식) ====
def gen_addsub_relation_1d():
    """a + b = c 식을 보고 c - a = ?, c - b = ? 찾기."""
    out = []
    for a in range(1, 10):
        for b in range(1, 10):
            c = a + b
            if c > 18: continue
            out.append({'op': 'rel_add_to_sub', 'a': a, 'b': b, 'c': c, 'ans1': c - a, 'ans2': c - b})
    return out


# ==== 2학년: 몇십 몇 ± 몇 ± 몇 (세 수 ±/∓) ====
def gen_three_pm_2d():
    """몇십 몇 ± 몇 ± 몇 (세 수 연산)."""
    out = []
    seen = set()
    for a in range(10, 100):
        for b in range(1, 10):
            for c in range(1, 10):
                for ops in ['++', '+-', '-+', '--']:
                    v1 = a + b if ops[0] == '+' else a - b
                    v2 = v1 + c if ops[1] == '+' else v1 - c
                    if v2 < 0 or v2 > 200: continue
                    key = (a, b, c, ops)
                    if key in seen: continue
                    seen.add(key)
                    out.append({'op': 'three_pm', 'a': a, 'b': b, 'c': c, 'ops': ops, 'ans': v2})
    return out


# ==== 두 자리 수 덧셈/뺄셈의 관계 ====
def gen_addsub_relation_2d():
    out = []
    for a in range(10, 100):
        for b in range(1, 100):
            c = a + b
            if c > 199: continue
            out.append({'op': 'rel_add_to_sub', 'a': a, 'b': b, 'c': c, 'ans1': c - a, 'ans2': c - b})
    return out


# ==== 약수와 배수 (5학년) ====
def gen_factors():
    out = []
    for n in range(4, 200):
        factors = [i for i in range(1, n + 1) if n % i == 0]
        if len(factors) >= 3:
            out.append({'op': 'factors', 'n': n, 'ans': factors})
    return out


def gen_multiples():
    out = []
    for n in range(2, 100):
        out.append({
            'op': 'multiples',
            'n': n,
            'ans': [n * i for i in range(1, 11)],
        })
    return out


def gen_gcd():
    from math import gcd
    out = []
    for a in range(4, 200):
        for b in range(4, 200):
            if a == b: continue
            g = gcd(a, b)
            if g >= 2:
                out.append({'op': 'gcd', 'a': a, 'b': b, 'ans': g})
    return out


def gen_lcm():
    from math import gcd
    out = []
    for a in range(2, 100):
        for b in range(a + 1, 100):
            l = a * b // gcd(a, b)
            out.append({'op': 'lcm', 'a': a, 'b': b, 'ans': l})
    return out


# ==== 비/비율/백분율 (6학년) ====
def gen_ratio_simplify():
    from math import gcd
    out = []
    for a in range(2, 200):
        for b in range(2, 200):
            if a == b: continue
            g = gcd(a, b)
            if g >= 2:
                out.append({'op': 'ratio_simplify', 'a': a, 'b': b, 'ans_a': a // g, 'ans_b': b // g})
    return out


def gen_ratio_to_pct():
    out = []
    for n in range(1, 500):
        for d in [2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 125, 200, 250]:
            if n >= d: continue
            pct = n * 100 / d
            if abs(pct - round(pct, 2)) < 1e-9:
                out.append({'op': 'ratio_to_pct', 'num': n, 'den': d, 'ans': round(pct, 2)})
    return out


# ==== 비례식·비례배분 (6학년) ====
def gen_proportion():
    out = []
    for a in range(2, 30):
        for b in range(2, 30):
            if a == b: continue
            for k in range(2, 30):
                c = a * k
                d = b * k
                out.append({'op': 'proportion', 'a': a, 'b': b, 'c': c, 'ans': d})
    return out


def gen_proportional_share():
    out = []
    for total in range(6, 200):
        for a in range(1, 11):
            for b in range(1, 11):
                if (a + b) and total % (a + b) == 0:
                    unit = total // (a + b)
                    out.append({
                        'op': 'prop_share',
                        'total': total, 'a': a, 'b': b,
                        'ans_a': a * unit, 'ans_b': b * unit,
                    })
    return out


# ==== 자연수 혼합 계산 (5학년) — 시도 횟수 대폭 확대 ====
def gen_mixed_calc_three():
    import random as _r
    _r.seed(7)
    out = []
    seen = set()
    for _ in range(50000):
        a = _r.randint(2, 100)
        b = _r.randint(2, 50)
        c = _r.randint(2, 20)
        ops = _r.choice(['+×', '-×', '+÷', '-÷', '×+', '×-', '÷+'])
        try:
            v = {'+×': a + b * c, '-×': a - b * c, '+÷': a + (b // c if b % c == 0 else 0),
                 '-÷': a - (b // c if b % c == 0 else 0), '×+': a * b + c, '×-': a * b - c,
                 '÷+': (a // b if a % b == 0 else 0) + c}[ops]
            if v < 0: continue
            key = (a, b, c, ops)
            if key in seen: continue
            seen.add(key)
            out.append({'op': 'mixed_calc', 'a': a, 'b': b, 'c': c, 'ops': ops, 'ans': v})
        except Exception:
            continue
    return out


def cap(pool, n=MAX_POOL):
    if len(pool) <= n:
        return pool
    return random.sample(pool, n)


def main():
    pools = {}

    # ===== 1학년 기초 =====
    pools['decompose_9'] = cap(gen_decompose_under(9))
    pools['make_ten'] = cap(gen_make_ten())
    pools['break_ten'] = cap(gen_break_ten())

    # ===== 덧셈 =====
    # 1자리 + 1자리
    pools['h_add_1_1'] = cap(gen_h_add(1, 1))
    pools['h_add_1_1_sum9'] = cap([p for p in gen_h_add(1, 1) if p['ans'] <= 9])
    pools['h_add_1_1_carry'] = cap(gen_add_1_1_carry())  # 합 11~18

    # 2자리 + 1자리 / 2자리
    pools['h_add_2_1'] = cap(gen_h_add(2, 1))
    pools['h_add_2_1_no_carry'] = cap(gen_h_add(2, 1, carry='none'))
    pools['h_add_2_1_carry'] = cap(gen_h_add(2, 1, carry='once'))

    pools['h_add_2_2'] = cap(gen_h_add(2, 2))
    pools['h_add_2_2_no_carry'] = cap(gen_h_add(2, 2, carry=0))
    pools['h_add_2_2_carry'] = cap(gen_h_add(2, 2, carry='once'))
    pools['h_add_2_2_carry1'] = cap(gen_h_add(2, 2, carry=1))
    pools['h_add_2_2_carry2'] = cap(gen_h_add(2, 2, carry=2))

    # 3자리 — 받아올림 횟수별 (math-3-1-1 양식 매칭)
    pools['h_add_3_3'] = cap(gen_h_add(3, 3))
    pools['h_add_3_3_no_carry'] = cap(gen_h_add(3, 3, carry=0))
    pools['h_add_3_3_carry'] = cap(gen_h_add(3, 3, carry='once'))
    pools['h_add_3_3_carry1'] = cap(gen_h_add(3, 3, carry=1))
    pools['h_add_3_3_carry2'] = cap(gen_h_add(3, 3, carry=2))
    pools['h_add_3_3_carry3'] = cap(gen_h_add(3, 3, carry=3))

    # 4자리
    pools['h_add_4_3'] = cap(gen_h_add(4, 3))
    pools['h_add_4_4'] = cap(gen_h_add(4, 4))

    # ===== 뺄셈 =====
    pools['h_sub_1_1'] = cap(gen_h_sub(1, 1))
    pools['h_sub_1_1_borrow'] = cap(gen_sub_teen_1())  # 십몇-몇

    pools['h_sub_2_1'] = cap(gen_h_sub(2, 1))
    pools['h_sub_2_1_no_borrow'] = cap(gen_h_sub(2, 1, carry=0))
    pools['h_sub_2_1_borrow'] = cap(gen_h_sub(2, 1, carry='once'))

    pools['h_sub_2_2'] = cap(gen_h_sub(2, 2))
    pools['h_sub_2_2_no_borrow'] = cap(gen_h_sub(2, 2, carry=0))
    pools['h_sub_2_2_borrow'] = cap(gen_h_sub(2, 2, carry='once'))
    pools['h_sub_2_2_borrow1'] = cap(gen_h_sub(2, 2, carry=1))

    pools['h_sub_3_3'] = cap(gen_h_sub(3, 3))
    pools['h_sub_3_3_no_borrow'] = cap(gen_h_sub(3, 3, carry=0))
    pools['h_sub_3_3_borrow'] = cap(gen_h_sub(3, 3, carry='once'))
    pools['h_sub_3_3_borrow1'] = cap(gen_h_sub(3, 3, carry=1))
    pools['h_sub_3_3_borrow2'] = cap(gen_h_sub(3, 3, carry=2))

    pools['h_sub_4_3'] = cap(gen_h_sub(4, 3))
    pools['h_sub_4_4'] = cap(gen_h_sub(4, 4))

    # ===== 세 수 (a+b-c, a-b+c) =====
    pools['three_num_1'] = cap(gen_three_num_addsub(1))
    pools['three_num_2'] = cap(gen_three_num_addsub(2))

    # ===== 곱셈 =====
    pools['h_mul_1_1'] = cap(gen_h_mul(1, 1))         # 곱셈구구 종합
    pools['h_mul_2_1'] = cap(gen_h_mul(2, 1))
    pools['h_mul_2_1_round'] = cap(gen_round_mul(2, 1))  # 몇십 X 몇
    pools['h_mul_2_1_no_carry'] = cap(gen_h_mul_no_carry(2, 1))  # 두 자리 X 한 자리 (올림없음)
    pools['h_mul_3_1'] = cap(gen_h_mul(3, 1))
    pools['h_mul_3_1_no_carry'] = cap(gen_h_mul_no_carry(3, 1))
    pools['h_mul_2_2'] = cap(gen_h_mul(2, 2))
    pools['h_mul_2_2_round'] = cap(gen_round_mul(2, 2))  # 몇십 X 몇십
    pools['h_mul_3_2'] = cap(gen_h_mul(3, 2))
    pools['h_mul_4_2'] = cap(gen_h_mul(4, 2))
    pools['h_mul_round_high'] = cap(gen_round_mul(3, 2) + gen_round_mul(3, 1))  # 몇백·몇천의 곱

    # ===== 나눗셈 =====
    pools['h_div_1_1'] = cap(gen_h_div(1, 1, with_remainder=False))
    pools['h_div_2_1'] = cap(gen_h_div(2, 1, with_remainder=False, q_max=9))
    pools['h_div_2_1_rem'] = cap(gen_h_div(2, 1, with_remainder=True, q_max=9))
    pools['h_div_3_1'] = cap(gen_h_div(3, 1, with_remainder=False, q_max=999))
    pools['h_div_3_1_rem'] = cap(gen_h_div(3, 1, with_remainder=True, q_max=999))
    pools['h_div_2_2'] = cap(gen_h_div(2, 2, with_remainder=False))
    pools['h_div_3_2'] = cap(gen_h_div(3, 2, with_remainder=False, q_max=99))
    pools['h_div_3_2_rem'] = cap(gen_h_div(3, 2, with_remainder=True, q_max=99))

    # ===== 분수 (3·4학년) =====
    pools['frac_same_add'] = cap(gen_fraction_same_denom_add())
    pools['frac_same_add_improper'] = cap(gen_frac_same_add_sum_improper())
    pools['frac_same_sub'] = cap(gen_fraction_same_denom_sub())
    pools['frac_natural_minus_proper'] = cap(gen_frac_natural_minus_proper())
    pools['frac_proper_to_improper'] = cap(gen_frac_proper_to_improper())
    pools['frac_improper_to_mixed'] = cap(gen_frac_improper_to_mixed())
    pools['frac_compare_same'] = cap(gen_frac_compare_same_denom())
    pools['frac_mixed_add'] = cap(gen_frac_mixed_add())
    pools['frac_mixed_add_carry'] = cap(gen_frac_mixed_add_carry())
    pools['frac_mixed_sub'] = cap(gen_frac_mixed_sub())
    pools['frac_mixed_sub_borrow'] = cap(gen_frac_mixed_sub_borrow())

    # ===== 분수 (5·6학년) =====
    pools['frac_diff_add'] = cap(gen_frac_diff_denom_add())
    pools['frac_diff_sub'] = cap(gen_frac_diff_denom_sub())
    pools['frac_mul'] = cap(gen_frac_mul_proper())
    pools['frac_mul_natural'] = cap(gen_frac_mul_natural())
    pools['frac_div_natural'] = cap(gen_frac_div_natural())
    pools['frac_div'] = cap(gen_frac_div_frac())
    pools['frac_reduce'] = cap(gen_reduce_fraction())
    pools['frac_common_denom'] = cap(gen_common_denom())

    # ===== 소수 (4·5·6학년) =====
    pools['dec_add_1'] = cap(gen_decimal_add(1, integer=False))
    pools['dec_add_1_int'] = cap(gen_decimal_add(1, integer=True))
    pools['dec_add_2'] = cap(gen_decimal_add(2, integer=False))
    pools['dec_add_2_int'] = cap(gen_decimal_add(2, integer=True))
    pools['dec_sub_1'] = cap(gen_decimal_sub(1, integer=False))
    pools['dec_sub_1_int'] = cap(gen_decimal_sub(1, integer=True))
    pools['dec_sub_2'] = cap(gen_decimal_sub(2, integer=False))
    pools['dec_sub_2_int'] = cap(gen_decimal_sub(2, integer=True))
    pools['dec_mul_nat_1'] = cap(gen_decimal_mul_natural(1))
    pools['dec_mul_nat_2'] = cap(gen_decimal_mul_natural(2))
    pools['dec_mul_1'] = cap(gen_decimal_mul_decimal(1))
    pools['dec_div_nat_1'] = cap(gen_decimal_div_natural(1))

    # ===== 약수와 배수 (5학년) =====
    pools['factors'] = cap(gen_factors())
    pools['multiples'] = cap(gen_multiples())
    pools['gcd'] = cap(gen_gcd())
    pools['lcm'] = cap(gen_lcm())

    # ===== 비/비율/백분율 (6학년) =====
    pools['ratio_simplify'] = cap(gen_ratio_simplify())
    pools['ratio_to_pct'] = cap(gen_ratio_to_pct())
    pools['proportion'] = cap(gen_proportion())
    pools['proportional_share'] = cap(gen_proportional_share())

    # ===== 자연수 혼합 계산 (5학년) =====
    pools['mixed_calc_3'] = cap(gen_mixed_calc_three())

    # ===== 빈칸 채우기 + 덧뺄셈 관계 + 세 수 ± =====
    pools['box_addsub_1d'] = cap(gen_box_addsub_1d())
    pools['box_addsub_2d'] = cap(gen_box_addsub_2d())
    pools['rel_addsub_1d'] = cap(gen_addsub_relation_1d())
    pools['rel_addsub_2d'] = cap(gen_addsub_relation_2d())
    pools['three_pm_2d'] = cap(gen_three_pm_2d())

    # 분할 저장 — 풀별 개별 JSON 파일 (public/pools/<key>.json)
    SPLIT_DIR.mkdir(parents=True, exist_ok=True)
    # 기존 파일 정리
    for old in SPLIT_DIR.glob('*.json'):
        old.unlink()
    index = {}
    for k, v in pools.items():
        (SPLIT_DIR / f'{k}.json').write_text(json.dumps(v, ensure_ascii=False), encoding='utf-8')
        index[k] = len(v)
    # 인덱스 (lib/drill_pools_index.json) — 클라이언트에서 풀 존재 확인용
    OUT.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')

    # 기존 단일 drill_pools.json 제거
    legacy = ROOT / 'frontend' / 'lib' / 'drill_pools.json'
    if legacy.exists():
        legacy.unlink()

    # 통계
    print(f'[OK] {OUT}')
    print(f'      양식 수: {len(pools)}')
    total = sum(len(v) for v in pools.values())
    print(f'      총 문제: {total:,}')
    print()
    print('양식별 풀 크기:')
    for k in sorted(pools):
        n = len(pools[k])
        cap_flag = '*' if n == MAX_POOL else ' '
        print(f'  {cap_flag} {k:<28} {n:>6,}')


if __name__ == '__main__':
    main()

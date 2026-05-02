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
OUT = ROOT / 'frontend' / 'lib' / 'drill_pools.json'
MAX_POOL = 500  # 시드 셔플 + 매일 다른 학습지면 500개로도 다양성 충분, 번들 ~600KB


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
    """10 만들기 — a + ? = 10."""
    out = []
    for a in range(1, 10):
        out.append({'op': 'make_ten', 'a': a, 'ans': 10 - a})
    return out


def gen_break_ten():
    """10에서 빼기 — 10 - a = ?."""
    out = []
    for a in range(1, 10):
        out.append({'op': 'break_ten', 'a': a, 'ans': 10 - a})
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
    """분모 같은 진분수 덧셈, 합이 진분수. 4학년 2학기."""
    out = []
    for d in range(3, 13):  # 분모 3~12
        for a in range(1, d - 1):  # a/d
            for b in range(1, d - a):  # b/d, a+b < d
                out.append({
                    'op': 'frac_add',
                    'd': d, 'a': a, 'b': b,
                    'ans_num': a + b, 'ans_den': d
                })
    return out


def gen_fraction_same_denom_sub():
    """분모 같은 진분수 뺄셈, 결과 양수."""
    out = []
    for d in range(3, 13):
        for a in range(2, d):  # a/d
            for b in range(1, a):  # b/d, b < a
                out.append({
                    'op': 'frac_sub',
                    'd': d, 'a': a, 'b': b,
                    'ans_num': a - b, 'ans_den': d
                })
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

    # ===== 분수 =====
    pools['frac_same_add'] = cap(gen_fraction_same_denom_add())
    pools['frac_same_sub'] = cap(gen_fraction_same_denom_sub())

    OUT.write_text(json.dumps(pools, ensure_ascii=False), encoding='utf-8')

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

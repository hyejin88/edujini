"""일일수학 chapterData.js 파싱 → 우리 단원 ID와 매핑 가능한 양식 카탈로그 생성.

Output: /Users/hyejin/Documents/generalv1/edutech_qa/scripts/11math_catalog.json
- chapters: visible_calc='t' 단원만 (계산 가능 단원)
- steps: 각 단원의 세부 양식 (이름·설명·페이지)
- grade: '11' = 1학년 1학기, '32' = 3학년 2학기
- 우리 unit_id 매핑: math-{grade}-{semester}-{chapter}
"""
import json
import re
from pathlib import Path

SRC = Path('/tmp/11math_chapterData.js')
OUT = Path('/Users/hyejin/Documents/generalv1/edutech_qa/scripts/11math_catalog.json')

txt = SRC.read_text()

def extract_array(name):
    # var Name = [ ... ];  최상위 [...] 만 추출
    m = re.search(rf'var {name} = (\[.*?\]);', txt, re.DOTALL)
    if not m:
        raise SystemExit(f'no {name}')
    return json.loads(m.group(1))

chapters = extract_array('ChapterList')
steps = extract_array('StepList')

# grade 코드: "11" = 1학년 1학기, "12" = 1학년 2학기, ..., "61" = 6학년 1학기
def parse_grade(code):
    return int(code[0]), int(code[1])  # (grade, semester)

calc_chapters = [c for c in chapters if c.get('visible_calc') == 't']
print(f'[CHAPTER] 전체 {len(chapters)}, 계산 가능 {len(calc_chapters)}')

# 단원별 step 매핑
by_chapter = {}
for s in steps:
    key = (s['grade'], s['chapter'])
    by_chapter.setdefault(key, []).append(s)

# no 순 정렬
for k in by_chapter:
    by_chapter[k].sort(key=lambda x: int(x['no']))

# 우리 unit_id 형식으로 변환
catalog = {}
for c in calc_chapters:
    g, sem = parse_grade(c['grade'])
    chapter_no = int(c['chapter'])
    unit_id = f'math-{g}-{sem}-{chapter_no}'
    formats = []
    for s in by_chapter.get((c['grade'], c['chapter']), []):
        formats.append({
            'no': s['no'],
            'idx': s['idx'],
            'title': s['title'],
            'description': s['description'],
            'page': s.get('page', ''),
            'ccss': s.get('ccss_en', ''),
        })
    catalog[unit_id] = {
        'grade': g,
        'semester': sem,
        'chapter_no': chapter_no,
        'unit_name': c['title'],
        'formats': formats,
        'format_count': len(formats),
    }

OUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')

# 요약
print(f'\n[CATALOG] {OUT}')
print(f'[OK] {len(catalog)}개 단원, 총 {sum(c["format_count"] for c in catalog.values())}개 양식\n')
print(f'{"unit_id":<16} {"학년":<8} {"단원명":<24} {"양식수":>4}')
print('-' * 64)
for uid in sorted(catalog):
    c = catalog[uid]
    print(f'{uid:<16} 초{c["grade"]} {c["semester"]}학기  {c["unit_name"]:<24} {c["format_count"]:>4}')

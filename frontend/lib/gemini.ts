// Edge-friendly Gemini client (uses fetch, no Node deps)
// Works on both Node (Vercel) and Cloudflare Pages/Workers

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiCallOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  apiKey?: string;
}

export async function callGemini(
  prompt: string,
  opts: GeminiCallOptions = {}
): Promise<string> {
  const apiKey = opts.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const model = opts.model || process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash";

  const body: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }
  if (opts.responseMimeType) {
    body.generationConfig.responseMimeType = opts.responseMimeType;
  }

  const resp = await fetch(
    `${API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${text.slice(0, 300)}`);
  }
  const data: any = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  return text;
}

// ─────────────────────────────────────────────
// Prompt library (mirrors backend/app/ai/prompts.py)
// ─────────────────────────────────────────────

export const LABEL_SYSTEM = `당신은 따뜻하지만 꼼꼼한 초등 수학 선생님입니다. 아이가 막 풀어낸 문제 한 개를 손에 들고, 옆자리에 앉아 함께 풀이를 되짚어주는 선생님의 마음으로 응답하세요.

[역할 원칙]
- 절대로 "틀렸다"는 단어를 먼저 쓰지 않습니다. "이 부분에서 길이 갈렸어요" 같은 표현을 씁니다.
- 학생 본인 시점으로 단계 풀이를 다시 보여줍니다. ("○○이는 먼저 …을 떠올렸을 거예요. 그 다음 …")
- 학년 어휘를 맞춥니다.
  · 초1~초2: "와! 여기까지 잘 따라왔어요", "한 칸씩 세어볼까요"
  · 초3~초4: "여기서 한 단계만 더 살펴봐요", "약속한 순서대로 계산해요"
  · 초5~초6: "정확한 추론이에요", "조건을 다시 정리해볼게요"

[4축 오답 분류 기준 — 정확히 한 개 선택]
1) 개념미숙: 풀이 방향 자체가 다름. 식 세우기 단계부터 어긋남.
   판별 신호: 단위 혼동, 연산 종류 오선택, 정의 오해.
2) 계산실수: 식은 맞았는데 사칙연산 결과만 어긋남.
   판별 신호: 정답과 ±1 차이, 받아올림/내림 누락, 부호 실수.
3) 문제해석: 묻는 것을 다른 것으로 바꿔 풂.
   판별 신호: 학생 답이 문제 속 다른 수치와 일치.
4) 함정미인지: 출제 의도된 함정에 빠짐.
   판별 신호: common_errors 중 wrong_answer 일치.

[출력 분량 가이드]
- 초1~초2: explanation 80~120자
- 초3~초4: explanation 120~180자
- 초5~초6: explanation 180~240자

[출력 — JSON only, 마크다운 펜스 금지]
{
  "label": "개념미숙" | "계산실수" | "문제해석" | "함정미인지",
  "confidence": 0.0~1.0,
  "reason": "왜 이 라벨인지 한 줄 (선생님 시점, 학생 비난 금지)",
  "student_view_explanation": "○○이는 …을 떠올렸을 거예요. 그 다음 … 그래서 정답은 …이에요.",
  "encouragement": "다음에 같은 유형이 나오면 어떻게 다가갈지 한 문장",
  "suggested_review_concept": "복습할 핵심 개념명"
}`;

export const PARENT_REPORT_SYSTEM = `당신은 자녀의 한 주 학습을 지켜본 초등 수학 담임 선생님이며, 그 자녀의 학부모께 짧은 편지를 쓰는 입장입니다. 평가자가 아니라, 아이의 성장 곡선을 같이 응원하는 동반자의 톤입니다.

[원칙]
- 정중한 존댓말. "자녀가 …패턴을 보였어요", "이번 주 …에서 빛났어요" 톤.
- 항상 [긍정 → 약점 → 다음 한 걸음] 순서. 비교·질책·등수 언급 금지.
- 단원·개념을 구체적으로. ("수학 약점" X / "분수의 약분에서 한 단계 누락" O)
- 4축 오답 분포가 있으면 학부모가 이해할 수 있는 말로 풀어 설명.
  · 개념미숙 → "아직 익숙하지 않은 개념이 있어요"
  · 계산실수 → "방법은 맞는데 숫자에서 발이 걸렸어요"
  · 문제해석 → "문제를 끝까지 읽는 호흡을 길러주면 좋아요"
  · 함정미인지 → "출제자의 함정에 한 번 걸렸어요"
- 학년별 어휘 매칭: 초1~2 "막 시작한", 초3~4 "한 걸음씩 단단해지는", 초5~6 "스스로 추론하는"
- 가정에서 할 수 있는 다음 행동 1개만 (앱 내 추천 단원 우선).
- 총 분량 250~350자.

[출력 — JSON only]
{
  "subject": "이번 주 ○○이의 학습 리포트",
  "summary": "한 줄 요약 (긍정 톤)",
  "highlights": ["이번 주 잘한 구체 장면 1~2개"],
  "concerns": ["부드럽게 짚는 약점 1~2개 (단원·개념 명시)"],
  "axis_insight": "4축 오답 분포를 학부모 언어로 한 줄",
  "next_action": "이번 주 가정에서 할 수 있는 행동 1개",
  "teacher_note": "선생님이 자녀에게 직접 건네는 한 마디"
}`;

export function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*|\s*```$/gm, "").trim();
}

export function safeParseJson<T = any>(text: string): T | null {
  try {
    return JSON.parse(stripJsonFences(text));
  } catch {
    return null;
  }
}

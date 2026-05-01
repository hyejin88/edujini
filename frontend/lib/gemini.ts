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

export const LABEL_SYSTEM = `You are a Korean K-12 error analysis classifier.

Given a problem and a wrong student answer, classify the error into one of:
- "개념미숙" (concept not mastered — fundamentally wrong approach)
- "계산실수" (calculation error — approach correct, arithmetic wrong)
- "문제해석" (misread the question — solved a different problem)
- "함정미인지" (fell into a designed trap — common mistake from setup)

Output JSON:
{
  "label": "개념미숙" | "계산실수" | "문제해석" | "함정미인지",
  "confidence": 0.0-1.0,
  "reason": "한국어 한 줄 설명",
  "suggested_review_concept": "개념명"
}`;

export const PARENT_REPORT_SYSTEM = `당신은 한국 학부모에게 자녀의 주간 학습 리포트를 작성하는 EduTech 코치입니다.

원칙:
- 친근하지만 정중한 존댓말 ("OO이는...어요" 톤)
- 비판·질책 절대 금지. 항상 긍정 → 약점 → 개선 방향 순서
- 구체 단원·개념명 명시 (모호하게 "수학 약점" X, "분수 덧셈에서 약분 누락" O)
- 학부모가 행동할 수 있는 다음 한 가지 제안 (TMI 금지)
- 200~300자 이내

JSON:
{
  "subject": "이번 주 OO이의 학습 리포트",
  "summary": "한 줄 요약",
  "highlights": ["긍정 1-2개"],
  "concerns": ["약점 1-2개"],
  "next_action": "이번 주 추천 행동 1개"
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

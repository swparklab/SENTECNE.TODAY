import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// 글쓰기 보조용 LLM. 서비스 철학상 "대신 써주는" 용도가 아니라
// 사용자가 직접 쓰도록 거드는(이어쓸 문장 제안 / 막혔을 때 질문) 용도다.

export const llmConfigured = !!process.env.ANTHROPIC_API_KEY;

// 모델은 claude-api 가이드 기준 최신 플래그십. 필요 시 교체 가능.
const WRITING_MODEL = "claude-opus-4-8";

let _client: Anthropic | null = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export type HelpMode = "continue" | "questions";

type Ctx = { title: string; body: string; starters: string[] };

const CONTINUE_SYSTEM = `당신은 글쓰기를 거드는 보조자입니다. 사용자가 자신의 글을 직접 쓰도록 돕는 것이 목적이며, 글을 대신 완성하지 않습니다.
지금까지 쓴 글에 이어질 만한 "문장 한 줄" 후보를 정확히 3개 제안하세요.
- 각 후보는 한 문장으로 짧게.
- 사용자의 문체와 흐름을 존중하고, 서로 충분히 다른 방향일 것.
- 설명·머리말 없이, 오직 JSON 문자열 배열로만 출력. 예: ["문장1","문장2","문장3"]`;

const QUESTIONS_SYSTEM = `당신은 글쓰기 코치입니다. 글이 막힌 사용자가 스스로 다음 문장을 찾도록, 생각을 여는 질문 3개를 던지세요.
- 답을 대신 써주지 말 것. 질문만.
- 지금까지의 글 내용과 연결된, 구체적이고 짧은 질문일 것.
- 설명·머리말 없이, 오직 JSON 문자열 배열로만 출력. 예: ["질문1","질문2","질문3"]`;

function buildPrompt(ctx: Ctx): string {
  const parts: string[] = [];
  if (ctx.starters.length > 0) {
    parts.push(`[출발 문장]\n${ctx.starters.join("\n")}`);
  }
  if (ctx.title.trim()) parts.push(`[제목]\n${ctx.title.trim()}`);
  parts.push(`[지금까지 쓴 글]\n${ctx.body.trim() || "(아직 비어 있음)"}`);
  return parts.join("\n\n");
}

function parseList(text: string): string[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try {
      const arr = JSON.parse(text.slice(start, end + 1));
      if (Array.isArray(arr)) {
        return arr.map((x) => String(x).trim()).filter(Boolean).slice(0, 4);
      }
    } catch {
      // fall through to line split
    }
  }
  return text
    .split("\n")
    .map((l) => l.replace(/^[\s\-*\d.)"]+/, "").trim())
    .filter(Boolean)
    .slice(0, 4);
}

function sampleHelp(mode: HelpMode): string[] {
  if (mode === "continue") {
    return [
      "그 순간, 나는 문득 오래 잊고 지냈던 이름 하나를 떠올렸다.",
      "창밖의 풍경은 어제와 같았지만, 어쩐지 전혀 다르게 느껴졌다.",
      "말하지 못한 문장들이 입안에서 천천히 가라앉았다.",
    ];
  }
  return [
    "이 장면에서 당신이 가장 또렷하게 본 것은 무엇인가요?",
    "그때의 감정을 색이나 온도로 표현한다면 어떨까요?",
    "이 이야기를 누구에게 들려주고 싶나요? 왜죠?",
  ];
}

export async function getWritingHelp(mode: HelpMode, ctx: Ctx): Promise<string[]> {
  if (!llmConfigured) {
    return sampleHelp(mode);
  }

  const res = await client().messages.create({
    model: WRITING_MODEL,
    max_tokens: 700,
    system: mode === "continue" ? CONTINUE_SYSTEM : QUESTIONS_SYSTEM,
    messages: [{ role: "user", content: buildPrompt(ctx) }],
  });

  const text = res.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  const items = parseList(text);
  return items.length > 0 ? items : sampleHelp(mode);
}

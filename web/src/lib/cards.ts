// 발행한 글을 카드뉴스용 카드 배열로 쪼갠다. (순수 함수 — 클라이언트에서 사용)

export type Card = {
  kind: "cover" | "body" | "end";
  text: string;
};

const MAX_BODY_CARDS = 10;
const CARD_CHAR_TARGET = 90;

export function buildCards(
  title: string | null,
  body: string,
  nickname: string | null,
): Card[] {
  const cards: Card[] = [];

  cards.push({
    kind: "cover",
    text: (title ?? "").trim() || "오늘의 문장",
  });

  // 문단 → 문장 단위로 분해
  const sentences = body
    .replace(/\r/g, "")
    .split(/\n+/)
    .flatMap((p) => p.match(/[^.!?…]+[.!?…]*/g) ?? [p])
    .map((s) => s.trim())
    .filter(Boolean);

  // 카드당 길이가 너무 길지 않게 묶기 (문장 경계 유지)
  let buf = "";
  for (const s of sentences) {
    const merged = (buf ? `${buf} ${s}` : s).trim();
    if (buf && merged.length > CARD_CHAR_TARGET) {
      cards.push({ kind: "body", text: buf });
      buf = s;
    } else {
      buf = merged;
    }
  }
  if (buf) cards.push({ kind: "body", text: buf });

  // 본문 카드 수 제한 (커버 1장 포함)
  const limited = cards.slice(0, MAX_BODY_CARDS + 1);

  limited.push({
    kind: "end",
    text: nickname ? `${nickname}의 문장` : "sentence.today",
  });

  return limited;
}

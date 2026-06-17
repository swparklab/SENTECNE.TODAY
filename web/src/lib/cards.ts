// 발행한 글을 카드뉴스용 카드 배열로 쪼갠다. (순수 함수 — 클라이언트에서 사용)

export type Card = {
  kind: "cover" | "body" | "end";
  text: string;
};

// 카드뉴스 배경/폰트 테마
export type CardTheme = {
  id: string;
  label: string;
  bg: string;
  fg: string;
  accent: string;
  serif: boolean;
};

export const CARD_THEMES: CardTheme[] = [
  { id: "classic", label: "클래식", bg: "#faf8f3", fg: "#121212", accent: "#cc3f3b", serif: true },
  { id: "dark", label: "다크", bg: "#121212", fg: "#f4f1ea", accent: "#e0857f", serif: true },
  { id: "brand", label: "브랜드", bg: "#cc3f3b", fg: "#ffffff", accent: "#ffe2df", serif: false },
  { id: "mono", label: "모노", bg: "#ffffff", fg: "#161616", accent: "#9a9a9a", serif: false },
  { id: "night", label: "나이트", bg: "#0f1b2d", fg: "#e8eef7", accent: "#7fa7d4", serif: false },
];

export const SERIF_STACK =
  'Georgia, "Nanum Myeongjo", "Apple SD Gothic Neo", serif';
export const SANS_STACK =
  '"Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif';

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

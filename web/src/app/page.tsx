import Link from "next/link";
import ModeBanner from "@/components/ModeBanner";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getSessionUser } from "@/lib/auth/session";
import { dataReady } from "@/db/client";
import { getProfileNickname } from "@/db/repo";

// 오늘의 문장 — 공개된(저작권 만료) 시 구절을 매일 바꿔 보여준다.
const POEMS: { lines: string[]; by: string }[] = [
  { lines: ["죽는 날까지 하늘을 우러러", "한 점 부끄럼이 없기를,"], by: "윤동주 〈서시〉" },
  { lines: ["먼 훗날 당신이 찾으시면", "그때에 내 말이 ‘잊었노라’"], by: "김소월 〈먼 후일〉" },
  {
    lines: ["모란이 피기까지는,", "나는 아직 나의 봄을 기다리고 있을 테요"],
    by: "김영랑 〈모란이 피기까지는〉",
  },
  { lines: ["그곳이 차마 꿈엔들", "잊힐 리야."], by: "정지용 〈향수〉" },
];

export default async function Home() {
  const user = await getSessionUser();
  const nickname = user && dataReady ? await getProfileNickname(user.sub) : null;

  const poem = POEMS[Math.floor(Date.now() / 86_400_000) % POEMS.length];

  const primaryHref = user
    ? nickname
      ? "/sentence/write"
      : "/profile/setup"
    : "/signup";
  const primaryLabel = user
    ? nickname
      ? "오늘의 문장 쓰기"
      : "프로필 설정하기"
    : "시작하기";

  return (
    <>
      <ModeBanner />
      <Nav />

      <main>
        {/* 히어로 — 오늘의 문장 */}
        <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-28 text-center sm:py-36">
          <p className="text-xs tracking-[0.3em] text-brand">오늘의 문장</p>

          <blockquote className="mt-8 font-serif text-[26px] leading-[1.6] text-ink sm:text-[38px] sm:leading-[1.55]">
            {poem.lines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </blockquote>
          <cite className="mt-6 block text-sm not-italic text-ink/45">
            — {poem.by}
          </cite>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="rounded-full bg-brand px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/community"
              className="rounded-full border border-ink/20 px-7 py-3 text-sm font-medium text-ink/70 transition hover:bg-ink/5"
            >
              커뮤니티 둘러보기
            </Link>
          </div>

          {user && nickname && (
            <p className="mt-8 text-sm text-ink/50">
              <span className="font-medium text-ink">{nickname}</span>님, 오늘은
              어떤 문장을 남기실 건가요?
            </p>
          )}
        </section>

        {/* 어떻게 시작하나요 */}
        <section className="border-y border-ink/10 bg-paper">
          <div className="mx-auto grid max-w-3xl gap-10 px-6 py-20 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "문장을 쓴다",
                d: "떠오르는 한 문장이면 충분해요. 부담 없이 적어보세요.",
              },
              {
                n: "2",
                t: "글로 잇는다",
                d: "고른 문장에서 출발해 한 편의 글로 완성합니다. 막히면 도우미가 거들어요.",
              },
              {
                n: "3",
                t: "카드로 나눈다",
                d: "발행한 글을 카드뉴스로 만들어 SNS에 공유하세요.",
              },
            ].map((step) => (
              <div key={step.n} className="text-center sm:text-left">
                <div className="mx-auto flex size-9 items-center justify-center rounded-full border border-brand/30 font-serif text-sm text-brand sm:mx-0">
                  {step.n}
                </div>
                <h3 className="mt-4 font-serif text-lg text-ink">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  {step.d}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

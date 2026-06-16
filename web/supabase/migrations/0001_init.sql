-- sentence.today — 초기 스키마 (pivot.md §5 기반)
-- Supabase SQL Editor 또는 `supabase db push`로 적용한다.

-- ─────────────────────────────────────────────
-- profiles : auth.users 와 1:1
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  nickname    text unique,
  image_url   text,
  message     text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- sentences : 문장. status로 운명을 표현
--   draft  = 작성 직후
--   used   = 내 글에 사용됨
--   shared = 커뮤니티에 공유됨
-- ─────────────────────────────────────────────
do $$ begin
  create type public.sentence_status as enum ('draft', 'used', 'shared');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.sentences (
  id            bigint generated always as identity primary key,
  writer_id     uuid references auth.users (id) on delete set null,
  text          text not null,
  status        public.sentence_status not null default 'draft',
  emotion_tags  text[] not null default '{}',
  is_hidden     boolean not null default false,   -- 모더레이션
  created_at    timestamptz not null default now()
);
create index if not exists sentences_status_idx on public.sentences (status) where is_hidden = false;
create index if not exists sentences_writer_idx on public.sentences (writer_id);

-- ─────────────────────────────────────────────
-- articles : 완성된 글
-- ─────────────────────────────────────────────
create table if not exists public.articles (
  id                   bigint generated always as identity primary key,
  writer_id            uuid references auth.users (id) on delete set null,
  title                text,
  body                 text not null,
  source_sentence_ids  bigint[] not null default '{}',  -- 출발 문장(순환 추적)
  created_at           timestamptz not null default now()
);
create index if not exists articles_writer_idx on public.articles (writer_id);

-- ─────────────────────────────────────────────
-- sentence_usages : 문장 순환 생태계의 핵심
--   누가 누구의 문장을 어떤 글에 인용했나
-- ─────────────────────────────────────────────
create table if not exists public.sentence_usages (
  id                  bigint generated always as identity primary key,
  sentence_id         bigint references public.sentences (id) on delete cascade,
  used_in_article_id  bigint references public.articles (id) on delete cascade,
  used_by_id          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- reports : 커뮤니티 신고(모더레이션)
-- ─────────────────────────────────────────────
create table if not exists public.reports (
  id           bigint generated always as identity primary key,
  sentence_id  bigint references public.sentences (id) on delete cascade,
  reporter_id  uuid references auth.users (id) on delete set null,
  reason       text,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.sentences       enable row level security;
alter table public.articles        enable row level security;
alter table public.sentence_usages enable row level security;
alter table public.reports         enable row level security;

-- profiles : 누구나 조회, 본인만 생성/수정
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- sentences : 공유+미숨김은 모두 조회, 본인 것은 전부 조회. 본인만 변경
create policy "sentences_select_shared_or_own" on public.sentences
  for select using (
    (status = 'shared' and is_hidden = false) or auth.uid() = writer_id
  );
create policy "sentences_insert_own" on public.sentences
  for insert with check (auth.uid() = writer_id);
create policy "sentences_update_own" on public.sentences
  for update using (auth.uid() = writer_id);
create policy "sentences_delete_own" on public.sentences
  for delete using (auth.uid() = writer_id);

-- articles : 누구나 조회, 본인만 변경
create policy "articles_select_all" on public.articles
  for select using (true);
create policy "articles_insert_own" on public.articles
  for insert with check (auth.uid() = writer_id);
create policy "articles_update_own" on public.articles
  for update using (auth.uid() = writer_id);
create policy "articles_delete_own" on public.articles
  for delete using (auth.uid() = writer_id);

-- sentence_usages : 누구나 조회, 본인 행위만 기록
create policy "usages_select_all" on public.sentence_usages
  for select using (true);
create policy "usages_insert_own" on public.sentence_usages
  for insert with check (auth.uid() = used_by_id);

-- reports : 로그인 사용자가 신고 생성 (조회는 관리자/service_role)
create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() = reporter_id);

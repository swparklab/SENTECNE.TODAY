-- sentence.today — Aurora Serverless v2 (PostgreSQL) 초기 스키마
-- 인증은 Cognito가 담당하므로 사용자는 Cognito sub(text)로 식별한다.
-- RDS Query Editor 또는 Data API로 실행한다.

-- profiles ---------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  user_sub    text not null unique,            -- Cognito sub
  nickname    text unique,
  image_url   text,
  message     text,
  created_at  timestamptz not null default now()
);

-- sentences --------------------------------------------------------
do $$ begin
  create type sentence_status as enum ('draft', 'used', 'shared');
exception
  when duplicate_object then null;
end $$;

create table if not exists sentences (
  id            bigint generated always as identity primary key,
  writer_sub    text,
  text          text not null,
  status        sentence_status not null default 'draft',
  emotion_tags  text[] not null default '{}',
  is_hidden     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists sentences_status_idx on sentences (status) where is_hidden = false;
create index if not exists sentences_writer_idx on sentences (writer_sub);

-- articles ---------------------------------------------------------
create table if not exists articles (
  id                   bigint generated always as identity primary key,
  writer_sub           text,
  title                text,
  body                 text not null,
  source_sentence_ids  bigint[] not null default '{}',
  created_at           timestamptz not null default now()
);
create index if not exists articles_writer_idx on articles (writer_sub);

-- sentence_usages : 문장 순환 추적 -------------------------------
create table if not exists sentence_usages (
  id                  bigint generated always as identity primary key,
  sentence_id         bigint references sentences (id) on delete cascade,
  used_in_article_id  bigint references articles (id) on delete cascade,
  used_by_sub         text,
  created_at          timestamptz not null default now()
);

-- reports : 모더레이션 -------------------------------------------
create table if not exists reports (
  id           bigint generated always as identity primary key,
  sentence_id  bigint references sentences (id) on delete cascade,
  reporter_sub text,
  reason       text,
  created_at   timestamptz not null default now()
);

-- 주의: Supabase의 RLS 대신, 접근 제어는 애플리케이션(Next.js 서버) 레이어에서
-- 인증된 Cognito sub 기준으로 강제한다. (Drizzle 쿼리에서 writer_sub 필터링)

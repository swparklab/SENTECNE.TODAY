# sentence.today — web (Next.js 피버팅)

`pivot.md`의 설계에 따라 4년 전 Django 프로토타입을 단일 TypeScript 스택으로 재구현하는 새 앱입니다.

- **프레임워크:** Next.js 15 (App Router) + React 19 + TypeScript
- **DB / 인증 / 스토리지:** Supabase (Managed Postgres + Auth + Storage)
- **스타일:** Tailwind CSS v4
- **배포:** Vercel
- **LLM:** Anthropic Claude API (Week 4 예정)

> 기존 Django 코드는 저장소 루트에 그대로 있으며, 핵심 루프를 이쪽으로 옮기는 중입니다.

---

## 로컬 실행

### 1. 의존성 설치

```bash
cd web
npm install
```

### 2. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. **SQL Editor** 에 `supabase/migrations/0001_init.sql` 내용을 붙여넣고 실행
   (테이블 + RLS 정책이 생성됨)
3. **Project Settings → API** 에서 URL과 anon key 복사

### 3. 환경 변수

```bash
cp .env.example .env.local
# .env.local 에 위에서 복사한 값을 채운다
```

### 4. 개발 서버

```bash
npm run dev
# http://localhost:3000
```

---

## 현재 구현된 것 (Week 1)

- [x] Supabase 클라이언트 (브라우저 / 서버 / 미들웨어 세션 갱신)
- [x] 이메일·비밀번호 회원가입 / 로그인 / 로그아웃
- [x] 프로필 생성 (닉네임 + 한 줄 소개) — *기존 Django에서 깨져 있던 기능*
- [x] 보호 경로 미들웨어 (`/profile`, `/sentence`, `/write`)
- [x] DB 스키마 + RLS (profiles, sentences, articles, sentence_usages, reports)

## 다음 (Week 2) — 핵심 루프 복원

- [ ] 문장 쓰기 → 저장 → 선택 분기
- [ ] 선택 문장 → 글 작성 → 발행
- [ ] 미선택 문장 → 커뮤니티 공유 (`status = 'shared'`)
- [ ] 커뮤니티 피드 + 1차 모더레이션(숨김/신고)

---

## 배포 (Vercel)

1. Vercel에서 이 저장소 import
2. **Root Directory** 를 `web` 으로 지정
3. 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) 등록
4. `git push` → 자동 배포

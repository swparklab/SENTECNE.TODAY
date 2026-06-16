# sentence.today — 코드 스크리닝 & 아키텍처 피버팅

> 관점: **운용/유지보수 + 플랫폼 운영**
> 전제: 4년 전 Django 프로토타입 → 2026년 API + LLM + React 기반으로 재설계 가능

---

## 0. 한 줄 결론

> **지금 백엔드는 "고쳐 쓸 코드"가 아니라 "동작하지 않는 스케치"다. 보존할 자산은 코드가 아니라 도메인 개념과 프론트엔드 UX뿐이다. 그러므로 재작성이 오히려 싸다 — 단, 6개월짜리 재작성이 아니라 2~4주짜리 린(lean) 재작성이어야 한다.**

이 결론은 `startup.md` §4의 "재개발하지 마라"와 모순되지 않는다. §4는 *동작하는 제품*을 리텐션 명분으로 갈아엎지 말라는 경고였다. 그런데 스크리닝 결과 *동작하는 제품이 없다*. 보존 비용이 거의 0이므로 깨끗한 재시작이 가장 경제적인 선택이 된다.

---

## 1. 코드 스크리닝 — 실제 상태

실제 파일을 읽고 확인한 내용이다. "리팩토링 후보"가 아니라 "지금 크래시하거나 데이터를 잃는" 문제들이다.

### 1.1 핵심 기능이 백엔드에 구현되어 있지 않다

| 위치 | 문제 | 영향 |
|------|------|------|
| `buildapp/views.py:25-31` | `write_sentence` POST 핸들러가 문장을 받기만 하고 **DB에 저장하지 않음**. 게다가 `render('buildapp/write_page.html', ...)` — 첫 인자가 `request`여야 하는데 문자열을 넘김 → **즉시 크래시** | 서비스의 핵심(문장 작성)이 작동 안 함 |
| `buildapp/views.py:56-57` | `community`가 `tst_write_community.html`(테스트 정적 템플릿)만 렌더. **"미선택 문장 → 커뮤니티 공유" 플로우가 존재하지 않음** | 서비스의 차별점(문장 순환)이 미구현 |
| `buildapp/models.py:15-19` | `Sentence` 모델은 정의돼 있으나 **어디서도 저장/조회되지 않음** | 데이터 모델이 죽은 코드 |
| `profileapp/views.py:32-44` | `Create()`: `Nickname()` — 문자열을 함수처럼 호출 → **TypeError 크래시**. `render(request, 'buildapp:home')` — URL 이름을 템플릿 경로로 넘김 → 크래시. 이미지 저장 없음 | 프로필 생성 깨짐 |
| `profileapp/views.py` | `Create`/`ProfileCreate` + 주석 처리된 버전까지 **동일 기능이 3벌 중복**, 무엇이 라이브인지 불명확 | 유지보수 불가능 |

### 1.2 코드 위생 문제

- `buildapp/views.py:1-2` — `from asyncore import write`, `from sqlite3 import Time`: **IDE 자동 임포트 쓰레기**. `asyncore`는 Python 3.12에서 제거되어 최신 런타임에서 임포트 자체가 실패.
- `buildapp/models.py:5` — `from profileapp.models import Profile`: 사용 안 하는 죽은 임포트.
- `*/models.py` — `created_at = DateTimeField(auto_now=True)`: `auto_now`는 **저장할 때마다 갱신**됨. "생성 시각"이라면 `auto_now_add=True`여야 함. (현재는 수정할 때마다 created_at이 바뀜)
- **테스트 0개. API 레이어 0개. 타입 0개.**

### 1.3 설정/의존성/인프라

- `requirements.txt` — **UTF-16 인코딩**(BOM `��` + 공백 깨짐). Django **3.2.9**로 핀했지만 `settings/base.py:3` 주석은 "Django 4.0.5"라 명시 → 버전 불일치. `numpy`, `pandas`(무겁고 미사용), `nodejs==0.1.1`(엉뚱한 패키지) 포함. **운영에 필수인 `gunicorn`, `mysqlclient`는 누락**.
- `today/settings/deploy.py:31` — `ALLOWED_HOSTS = ['*']`: 운영 보안 취약.
- `docker-compose.yml:16` — 이미지 태그 `django_test_iamge:13`(오타 "iamge", 테스트 이미지 고정). `:9` 호스트 절대경로 `/home/todays-sentence/nginx.conf` 하드코딩 → 그 서버에서만 동작.
- `node_modules`가 저장소에 포함됨. `... 2.js` 형태의 **중복 파일이 대량** → macOS↔Windows 복사 중 깨진 설치본. `package.json`은 `styled-components`만 선언하지만 정작 **React는 없음**(템플릿 기반).

### 1.4 보존 가치가 있는 것

1. **도메인 개념** — "문장에서 시작 → 선택 → 글/커뮤니티 분기 → 문장 순환". 이건 좋다.
2. **프론트엔드 UX 프로토타입** — `write_sentence.html` 등 8개 템플릿의 화면 흐름, CSS, 인터랙션 JS. React로 옮길 때 **레퍼런스**로 가치 있음.
3. **데이터 모델의 의도** — User/Profile/Sentence/Article 관계. 단 재설계 필요.

코드 자체(views, 라우팅, 인프라 설정)는 **보존가치 거의 0**.

---

## 2. 피버팅 원칙 — 운용/유지보수 우선

소규모 팀(혹은 1인)이 운영한다는 전제에서, 모든 선택의 1순위 기준은 **"운영 표면적(operational surface area)을 최소화하는가"** 다.

기존 운영 스택의 표면적을 보자:

```
유저 요청
  → Nginx (직접 설정/패치)
    → Gunicorn (프로세스 관리)
      → Django (서버 렌더)
        → MariaDB (직접 운영/백업)
  + Docker Swarm secrets (수동)
  + VM 보안 패치 (수동)
  + 정적/미디어 볼륨 (수동)
```

이걸 1인이 유지보수하려면 앱 코드보다 **인프라 잡일**에 시간을 더 쓰게 된다. 2026년 재설계의 핵심은 기능이 아니라 **이 표면적을 관리형 서비스로 흡수**시키는 것이다.

---

## 3. Before / After 아키텍처

### Before (현재)

| 레이어 | 기술 | 운영 부담 |
|--------|------|-----------|
| 웹서버 | Nginx (수동 설정) | 높음 |
| 앱서버 | Gunicorn + Django | 중간 |
| 렌더링 | Django Template (서버 렌더) | — |
| DB | MariaDB (자체 운영) | 높음 (백업/패치) |
| 인증 | Django auth (세션) | 낮음 |
| 파일 | 로컬 볼륨 + Nginx | 중간 |
| 배포 | Docker Swarm + 수동 secrets | 높음 |
| LLM | 없음 | — |

### After (추천)

| 레이어 | 기술 | 운영 부담 |
|--------|------|-----------|
| 프론트+백 | **Next.js (App Router, TypeScript)** — 한 저장소 | 낮음 |
| API | Next.js Route Handlers / Server Actions | 낮음 |
| DB + 인증 + 스토리지 | **Supabase** (Managed Postgres + Auth + Storage + RLS) | **거의 0** |
| 배포 | **Vercel** (git push → 자동 배포/프리뷰) | **거의 0** |
| LLM | **Anthropic Claude API** (`claude-sonnet-4-6` 등) | 낮음 (호출만) |

**한 줄 요약:** 운영해야 할 서버가 0대가 된다. Nginx·Gunicorn·MariaDB·Docker·VM 패치가 전부 사라지고, 관리 콘솔 2개(Vercel, Supabase) + 코드 저장소 1개만 남는다.

---

## 4. 추천 스택과 트레이드오프

### 추천: 단일 TypeScript 풀스택 (Next.js + Supabase + Vercel)

**얻는 것**
- **언어 1개(TypeScript).** 프론트/백/타입/스키마가 한 언어 → 1인 유지보수 난이도 급감.
- **서버 운영 0.** DB 백업·스케일·보안 패치를 Supabase/Vercel이 대행.
- **배포 마찰 0.** `git push` → 자동 빌드/배포 + PR 프리뷰 URL.
- **LLM 친화.** Anthropic SDK가 TS 1급 지원. 문체 분석·언어 패턴 리포트 같은 2026 기능을 바로 붙임.
- **인증/스토리지 내장.** Supabase Auth(소셜 로그인 포함) + Storage(프로필 이미지) → `startup.md`의 카카오/구글 로그인 로드맵도 설정으로 해결.

**잃는 것 / 트레이드오프**
- **Django Admin을 잃는다.** 이게 가장 큰 손실 — 커뮤니티 문장은 **모더레이션(신고/삭제/숨김)**이 반드시 필요한데, Django admin은 그걸 공짜로 줬다. → **대안:** Supabase 대시보드의 테이블 에디터 + RLS로 1차 대응, 트래픽이 커지면 간단한 `/admin` 페이지를 직접 구축(반나절).
- **벤더 종속(Vercel/Supabase).** → 둘 다 표준 Postgres + Node라 탈출 경로 존재(Postgres 덤프, Node 호스팅 이전). 초기 단계에서 종속 리스크보다 속도 이득이 압도적.
- **Python 자산 포기.** numpy/pandas 기반 분석을 Python으로 하고 싶다면 별도 함수가 필요. → 현재 그 코드는 미사용이므로 손실 없음.

### 대안 (이럴 때만 선택)

**대안 A — Django REST Framework + React(Next.js)**
- 팀이 **Python 네이티브**이고, **Django Admin 모더레이션**을 포기 못 할 때.
- 트레이드오프: 언어 2개, 배포 2개(프론트/백) → **운영 표면적이 추천안의 2배**. 유지보수 관점에서는 명백히 열위. "이미 Django를 잘 안다"는 이유만으로 선택하면 안 됨 — 그 코드도 어차피 재작성이므로 기존 숙련도 이점이 적다.

**대안 B — Django + HTMX (React 안 씀)**
- 인터랙션이 단순하고 SPA가 과하다고 판단될 때. 서버 렌더 유지하며 부분 갱신.
- 트레이드오프: 모바일 앱·복잡한 에디터 확장 시 한계. 문장 작성 화면의 동적 UX를 고려하면 React가 유리.

> **판단:** 운용/유지보수가 1순위 기준이면 **추천안(단일 TS 풀스택)**. "Django admin 모더레이션이 필수"라는 단 하나의 조건이면 대안 A.

---

## 5. 데이터 모델 재설계

기존 모델의 문제(미사용 Sentence, auto_now 오용, 순환 미구현)를 고치고 2026 비전(문장 아카이브·언어 패턴·문장 순환)을 담는다.

```
profiles            (Supabase auth.users와 1:1)
  id, user_id, nickname, image_url, message, created_at

sentences
  id, writer_id, text,
  status         enum('draft','used','shared')   -- 핵심: 문장의 운명을 명시
  emotion_tags   text[]   -- #새벽 #이별 등 (startup.md 거래소 전략용)
  created_at     timestamptz default now()        -- auto_now 오용 수정

articles
  id, writer_id, title, body(rich), created_at
  source_sentence_ids  bigint[]   -- 어떤 문장에서 출발했는지(순환 추적)

sentence_usages    -- 문장 순환의 핵심 테이블 (누가 누구 문장을 인용했나)
  id, sentence_id, used_in_article_id, used_by_id, created_at
```

- `status`로 "선택→내 글 / 미선택→커뮤니티 공유"를 **데이터로 표현**(기존엔 코드로도 없었음).
- `sentence_usages`가 차별점인 "문장 순환 생태계"를 추적 가능하게 만든다.
- `emotion_tags`는 `startup.md` §5의 B2B 문장 큐레이션을 위한 사전 포석.
- 모더레이션을 위해 `sentences.is_hidden`, `reports` 테이블 추가 권장.

---

## 6. LLM 통합 포인트 (Claude API)

AI를 "글을 대신 써주는" 용도로 쓰면 서비스 정체성(인간의 진짜 문장)과 충돌한다. **보조·분석 용도로만** 붙인다.

| 기능 | LLM 역할 | 모델 |
|------|----------|------|
| 언어 패턴 리포트 | 누적 문장을 분석해 어휘/톤/문체 요약 (스포티파이 래핑 방식) | `claude-sonnet-4-6` |
| 오늘의 문장 주제 추천 | 사용자 과거 문장 기반 개인화 프롬프트 생성 | `claude-haiku-4-5`(저비용) |
| 감성 태그 자동 분류 | 커뮤니티 문장에 `emotion_tags` 자동 부여 (B2B 큐레이션용) | `claude-haiku-4-5` |
| 커뮤니티 1차 모더레이션 | 혐오/스팸 문장 자동 플래그 → 사람이 최종 판단 | `claude-haiku-4-5` |

- **운영 주의:** LLM 호출은 비용·지연이 발생하므로 **동기 요청 경로에 넣지 말 것**. 리포트·태그 분류는 백그라운드(예약 작업/큐)로 처리.
- API 키는 Vercel 환경변수로만. 클라이언트에 노출 금지(서버 라우트에서만 호출).
- `claude-api` 스킬에 모델 ID·가격·캐싱 레퍼런스가 있으니 구현 시 참조.

---

## 7. 운영/유지보수 관점 비교표

| 항목 | Before (Django 풀스택) | After (TS + 관리형) |
|------|------------------------|---------------------|
| 운영 서버 수 | VM + Nginx + Gunicorn + DB | **0대** |
| DB 백업/패치 | 수동 | 자동(Supabase) |
| 배포 | Docker Swarm + 수동 secrets | `git push`(Vercel) |
| 롤백 | 수동 | 원클릭(Vercel) |
| 스테이징/프리뷰 | 없음 | PR마다 자동 생성 |
| 보안 패치(OS/웹서버) | 직접 | 불필요 |
| 언어/런타임 수 | Python + JS | **TS 단일** |
| 신규 인력 온보딩 | 인프라 학습 필요 | 저장소 1개만 |
| 모더레이션 도구 | Django admin(공짜) | 직접 구축 필요 ⚠ |

유일한 마이너스 한 칸(모더레이션)을 빼면 전 항목에서 운영 부담이 줄어든다.

---

## 8. 마이그레이션 단계 (린, 2~4주)

6개월짜리 재작성이 아니다. 핵심 루프 하나를 먼저 살린다.

**Week 1 — 토대**
- Next.js(TS) + Supabase 프로젝트 생성, Vercel 연결
- 데이터 모델(§5) 마이그레이션 작성, Supabase Auth 연결
- 인증 + 프로필 생성 (기존에 깨져 있던 것)

**Week 2 — 핵심 루프 복원 (현재 미구현분)**
- 문장 작성 → 저장(드디어 DB에 들어감) → 선택 분기
- 선택 문장 → 글 작성(에디터) → 발행
- 미선택 문장 → 커뮤니티 공유 (status='shared')
- 기존 `write_sentence.html` UX를 React 컴포넌트로 이식

**Week 3 — 리텐션 훅 (startup.md §4 결론)**
- 오늘의 문장 주제 + 작성 스트릭
- 커뮤니티 피드 + 문장 카드 공유(SNS)

**Week 4 — 차별화 / LLM**
- 언어 패턴 리포트(누적 30문장+ 대상)
- 1차 모더레이션 자동 플래그
- (이후) 챌린지 결제 검증 — 별도 제품 없이 §5 2주 플랜

> 기존 데이터 마이그레이션은 **불필요**(운영 중 데이터 없음). 그래서 더 빠르다.

---

## 9. 리스크 & 대부분이 놓치는 포인트

**숨은 리스크**
1. **재작성이 "기능 복원"이 아니라 "기능 추가"로 번지는 것.** 4주 안에 끝내려면 2026 비전 기능(거래소·진위 인증 등)을 Week 1~2에 넣지 말 것. 먼저 *깨진 핵심 루프를 동작시키는 것*이 목표다.
2. **모더레이션 공백.** 커뮤니티 문장 자동 공유는 곧 "누구나 본다"는 뜻 → 첫날부터 스팸/악성 문장이 들어온다. Django admin을 버리는 순간 이 안전장치가 사라지므로, Week 2에 최소한의 숨김/신고 기능을 같이 넣어야 한다.
3. **벤더 비용 곡선.** Supabase/Vercel 무료 티어는 초기엔 충분하나, 트래픽·LLM 호출이 늘면 비용이 계단식으로 뛴다. LLM은 반드시 백그라운드+캐싱.

**대부분이 놓치는 핵심 포인트**
- 이 프로젝트의 진짜 문제는 "기술 스택이 낡았다"가 아니라 **"핵심 기능이 한 번도 동작한 적이 없다"**는 것이다. 스택을 React로 바꾸는 것보다, *문장이 실제로 저장되고 커뮤니티로 순환하는 루프를 처음으로 완성하는 것*이 100배 중요하다. 스택 선택은 그 루프를 **가장 적은 운영 부담으로** 굴리기 위한 수단일 뿐이다.
- "Django를 React로 바꾼다"는 프레이밍 자체가 함정이다. 옮길 Django 로직이 사실상 없다. 이건 *마이그레이션*이 아니라 *처음부터 제대로 만드는 첫 구현*이다 — 그래서 부담이 작고, 그래서 지금 하는 게 맞다.

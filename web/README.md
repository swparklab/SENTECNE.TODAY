# sentence.today — web (Next.js + AWS)

`pivot.md`의 설계에 따라 4년 전 Django 프로토타입을 단일 TypeScript 스택으로 재구현하는 새 앱입니다. 백엔드는 AWS 관리형 서비스로 구성합니다.

- **프레임워크:** Next.js 15 (App Router) + React 19 + TypeScript
- **인증:** Amazon Cognito (User Pool)
- **DB:** Aurora Serverless v2 (PostgreSQL) + Drizzle ORM (RDS Data API)
- **스토리지:** Amazon S3 (+ CloudFront)
- **스타일:** Tailwind CSS v4
- **호스팅:** AWS Amplify Hosting
- **LLM:** Anthropic Claude API (Week 4 예정)

> 기존 Django 코드는 저장소 루트에 그대로 있으며, 핵심 루프를 이쪽으로 옮기는 중입니다.

---

## 로컬 실행 (미리보기)

AWS 없이도 UI는 바로 볼 수 있습니다. 환경변수가 비어 있으면 자동으로
**미리보기 모드**(인증·저장 비활성, 안내 배너 표시)로 동작합니다.

```bash
cd web
npm install
npm run dev
# http://localhost:3000 (포트 사용 중이면 자동으로 3001 등)
```

---

## AWS 연결 (실제 동작)

### 1. Cognito User Pool

1. Cognito 콘솔에서 User Pool 생성 (로그인: 이메일)
2. **App client** 생성 — **시크릿 없이**, 인증 흐름에 `ALLOW_USER_PASSWORD_AUTH` 활성화
3. User Pool ID와 App client ID 확보

```bash
# CLI 예시
aws cognito-idp create-user-pool --pool-name sentence-today \
  --auto-verified-attributes email --region ap-northeast-2
aws cognito-idp create-user-pool-client --user-pool-id <POOL_ID> \
  --client-name web --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --no-generate-secret --region ap-northeast-2
```

### 2. Aurora Serverless v2 (PostgreSQL) + Data API

1. Aurora PostgreSQL(Serverless v2) 클러스터 생성
2. **Data API 활성화** (RDS → 클러스터 → Enable Data API)
3. 자격증명을 **Secrets Manager** 시크릿으로 저장 → secret ARN 확보
4. 클러스터 ARN 확보
5. RDS Query Editor(또는 Data API)로 `drizzle/0001_init.sql` 실행

### 3. S3 버킷

```bash
aws s3 mb s3://sentence-today-media --region ap-northeast-2
```

### 4. 환경 변수

```bash
cp .env.example .env.local   # 값 채우기 (COGNITO_*, AURORA_*, S3_*)
npm run dev                  # 배너 사라지고 회원가입·로그인·프로필 저장 동작
```

로컬에서는 `aws configure`로 설정된 자격증명을 SDK가 자동 사용합니다.

---

## 현재 구현 (Week 1)

- [x] Cognito 인증: 이메일/비밀번호 회원가입·로그인·로그아웃 (httpOnly 쿠키 세션, JWT 검증)
- [x] 프로필 생성(닉네임·한 줄 소개) — *기존 Django에서 깨져 있던 기능*
- [x] Drizzle 스키마 + Aurora Data API 클라이언트
- [x] 보호 경로 미들웨어, S3 업로드 헬퍼
- [x] AWS 미설정 시 graceful 미리보기 모드

## 다음 (Week 2) — 핵심 루프 복원

- [ ] 문장 쓰기 → 저장 → 선택 분기
- [ ] 선택 문장 → 글 발행 / 미선택 문장 → 커뮤니티 공유(`status='shared'`)
- [ ] 커뮤니티 피드 + 1차 모더레이션(숨김/신고)

---

## 배포 (Amplify Hosting)

1. Amplify 콘솔에서 이 저장소 연결
2. 모노레포 설정 — appRoot `web` (루트 `amplify.yml` 참고)
3. 환경 변수(`COGNITO_*`, `AURORA_*`, `S3_*`, `AWS_REGION`) 등록
4. Amplify 서비스 역할(IAM)에 Cognito/RDS Data API/S3 권한 부여
5. `git push` → 자동 빌드·배포

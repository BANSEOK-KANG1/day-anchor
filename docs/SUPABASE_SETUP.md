# Supabase 연결 — 10분 체크리스트

Day Anchor: https://day-anchor.vercel.app

## Step 1. Supabase 프로젝트 만들기

1. https://supabase.com/dashboard 접속 → **New project**
2. 이름: `day-anchor` (아무거나 OK)
3. Database Password: **꼭 저장** (나중에 DB 직접 접속 시 필요)
4. Region: **Northeast Asia (Seoul)** 권장
5. **Create new project** → 1~2분 대기

## Step 2. API 키 복사

**Project Settings → API**

| 항목 | 용도 |
|------|------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

⚠️ `service_role` 키는 **절대** 프론트/Vercel에 넣지 마세요.

## Step 3. SQL 스키마 실행

**SQL Editor → New query**

[supabase/schema.sql](../supabase/schema.sql) **전체** 복사 → 붙여넣기 → **Run**

성공 메시지: `Success. No rows returned`

## Step 4. Auth 설정

**Authentication → Providers → Email**

- Email provider: **Enabled**
- **Confirm email**: 처음엔 **OFF** 권장 (바로 로그인 테스트 가능)

**Authentication → URL Configuration**

| 필드 | 값 |
|------|-----|
| Site URL | `https://day-anchor.vercel.app` |
| Redirect URLs | `https://day-anchor.vercel.app/**` |
| | `http://localhost:3000/**` |

## Step 5. Vercel 환경변수

Vercel → **day-anchor** → **Settings → Environment Variables**

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Step 2 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Step 2 anon key |

Environment: **Production, Preview, Development** 모두 체크 → **Save**

**Deployments → Redeploy** (Use existing Build Cache: OFF)

## Step 6. 로컬 `.env.local`

프로젝트 루트:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

```bash
npm run dev
```

## Step 7. 테스트

1. https://day-anchor.vercel.app/signup → 회원가입
2. `/app` → 달력·일정·할 일 추가
3. 폰/PC 다른 브라우저에서 **같은 계정** 로그인 → 데이터 동기화 확인

## 문제 해결

| 증상 | 해결 |
|------|------|
| 회원가입 후 로그인 안 됨 | Auth → Confirm email OFF |
| 로그인 redirect 오류 | Site URL / Redirect URLs 확인 |
| 음성메모 업로드 실패 | Storage에 `voice-memos` bucket 있는지 확인 |
| Realtime 동기화 안 됨 | Database → Replication에서 5개 테이블 ON |

## 다음 (선택)

- 프로토타입 JSON: `/settings/import`
- PWA: Safari/Chrome → 홈 화면 추가

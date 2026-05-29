# Supabase 설정 가이드

Day Anchor 프로덕션 앱을 사용하려면 Supabase 프로젝트를 생성하고 아래 단계를 따르세요.

## 1. 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Project Settings → API에서 **Project URL**과 **anon public key** 복사

## 2. 환경변수

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Vercel 배포 시에도 동일한 변수를 Environment Variables에 등록하세요.

## 3. 데이터베이스 스키마

Supabase Dashboard → SQL Editor에서 [supabase/schema.sql](../supabase/schema.sql) 전체를 실행합니다.

포함 내용:

- `days`, `schedule_blocks`, `tasks`, `notes`, `voice_memos`, `reminders`, `activity_events` 테이블
- Row Level Security 정책
- `voice-memos` Storage bucket 및 정책
- Realtime publication 설정

## 4. Auth 설정

Authentication → Providers에서 **Email** 활성화.

선택: Google OAuth 등 소셜 로그인 추가.

## 5. Realtime (동기화)

Database → Replication에서 아래 테이블이 Realtime에 포함되었는지 확인:

- `days`
- `schedule_blocks`
- `tasks`
- `notes`
- `reminders`

## 6. 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` → 회원가입 → `/app` 사용.

## 7. 기존 프로토타입 데이터 이전

1. `prototype/` 폴더의 앱에서 JSON 내보내기
2. 로그인 후 `/settings/import`에서 파일 업로드

음성메모는 Storage 재업로드가 필요합니다.

## 8. PWA 설치

HTTPS 배포 후:

| 기기 | 방법 |
|------|------|
| iPhone/iPad | Safari → 공유 → 홈 화면에 추가 |
| Android | Chrome → 앱 설치 |
| Mac/Windows | Chrome/Edge → 주소창 설치 아이콘 |
